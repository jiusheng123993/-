# 鉴权权限模块设计

## 背景

当前订单、退款与支付测试接口已经具备参数校验、状态机保护、全局异常处理和生产环境模拟支付禁用能力，但仍缺少统一身份上下文。普通用户理论上仍可能通过直接构造请求访问他人订单或退款他人订单，因此需要新增轻量鉴权与权限边界。

本设计聚焦订单与支付相关后端接口的权限闭环，不引入完整登录注册系统，优先建立可替换、可测试、可扩展的后端鉴权中间件，为后续接入真实 JWT、OAuth、账号系统或管理员后台 API 留出扩展点。

## 目标

1. 为订单、退款、订单查询和开发支付确认接口加入统一鉴权。
2. 防止用户查询、退款、操作他人订单。
3. 支持管理员角色访问全部订单资源。
4. 保持现有接口路径和响应结构尽量兼容。
5. `/api/orders/:id/pay` 继续仅允许非生产环境使用，并额外要求管理员身份。
6. 为后续真实 JWT 接入提供可替换的 Auth Provider 边界。

## 非目标

1. 不实现完整注册、登录、密码、刷新 token 流程。
2. 不接入第三方 OAuth。
3. 不新增数据库用户表。
4. 不改造前端完整登录态系统。
5. 不改变订单核心状态机与权益发放核心逻辑。

## 推荐方案

采用轻量 Bearer Token 鉴权。

请求格式：

```http
Authorization: Bearer dev-user:<userId>
Authorization: Bearer dev-admin:<adminId>
```

解析结果形成统一 `AuthContext`：

```ts
interface AuthContext {
  userId: string
  role: 'user' | 'admin'
}
```

后端中间件负责：

1. 读取 `Authorization` header。
2. 校验 Bearer token 格式。
3. 解析 dev token。
4. 校验 userId/adminId 字符白名单。
5. 将 `auth` 注入 request。
6. 由路由层基于订单归属与角色进行授权判断。

该方案的核心价值是先建立“身份上下文 + 授权判断”的工程边界，后续可把 dev token parser 替换为真实 JWT verifier，而无需重写订单路由业务判断。

## 模块边界

### Auth 模块

建议新增目录：

```text
src/server/auth/
  authTypes.ts
  authMiddleware.ts
```

职责：

- 定义身份上下文类型。
- 解析 Authorization header。
- 提供 `requireAuth` 中间件。
- 提供角色判断工具。
- 不直接依赖订单服务。
- 不写业务授权逻辑。

### Orders Router

职责：

- 参数校验。
- 调用订单服务。
- 根据订单归属和 `req.auth` 做资源级授权。
- 返回 401、403、400、404 等标准响应。

不承担 token 解析逻辑。

### Order Service

职责不变：

- 订单创建。
- 支付状态更新。
- 退款状态更新。
- 查询订单。

不引入 HTTP、Auth、Request、Response 等上层概念。

## 接口权限规则

| 接口 | 权限规则 |
|---|---|
| `POST /api/orders` | 需要登录；`body.userId` 必须等于 token userId；admin 可为指定用户创建订单 |
| `GET /api/orders/:id` | 订单所属用户或 admin 可访问 |
| `GET /api/orders/user/:userId` | userId 本人或 admin 可访问 |
| `POST /api/orders/:id/refund` | 订单所属用户或 admin 可退款；订单必须为 `paid` |
| `POST /api/orders/:id/pay` | 仅非生产环境；必须为 admin；订单必须为 `pending` |

## 错误语义

| 状态码 | 场景 |
|---|---|
| 400 | 参数格式错误、非法 channel、非法订单状态 |
| 401 | 缺少 Authorization 或 token 无效 |
| 403 | 已登录但无权访问目标资源 |
| 404 | 订单不存在或产品不存在 |
| 500 | 未预期服务端错误，响应必须脱敏 |

## 数据流

1. 请求进入 Express。
2. CORS、安全头、body limit 中间件先执行。
3. 订单路由进入 `requireAuth`。
4. Auth 中间件解析 token 并注入 `req.auth`。
5. 路由做参数校验。
6. 路由读取订单并校验资源归属。
7. 授权通过后调用订单服务。
8. 返回订单结果或标准错误。

## 安全设计

### 防横向越权

所有订单资源接口必须基于订单 `userId` 与 `req.auth.userId` 比对。普通用户不能通过修改路径参数访问他人订单。

### 防模拟支付滥用

`POST /api/orders/:id/pay` 同时满足两个条件才允许执行：

1. `NODE_ENV !== 'production'`
2. `req.auth.role === 'admin'`

### Token 输入约束

dev token 只允许以下格式：

```text
dev-user:<1-64 位字母数字下划线短横线>
dev-admin:<1-64 位字母数字下划线短横线>
```

非法 token 返回 401。

### 错误脱敏

鉴权失败不返回解析细节，不暴露堆栈、环境变量、服务路径或内部异常。

## 兼容性

- 接口路径不变。
- 响应主体结构尽量不变。
- 新增要求：敏感接口必须带 Authorization header。
- 现有测试需要更新请求模拟，补齐鉴权上下文。
- 前端后续需要在调用订单 API 时带上 token；当前本次实现可先完成后端权限闭环。

## 测试计划

新增或更新测试覆盖：

1. 缺少 Authorization 时访问订单接口返回 401。
2. 非法 token 返回 401。
3. 用户创建自己的订单成功。
4. 用户为其他 userId 创建订单返回 403。
5. 用户查询自己的订单成功。
6. 用户查询他人订单返回 403。
7. admin 查询任意订单成功。
8. 用户退款自己的已支付订单成功。
9. 用户退款他人订单返回 403。
10. pending 订单退款仍返回 400。
11. 生产环境 `/pay` 返回 403。
12. 非 admin 调用 `/pay` 返回 403。
13. admin 在开发环境调用 `/pay` 成功。

## 影响范围

主要影响：

- `src/server/routes/orders.ts`
- 新增 `src/server/auth/authTypes.ts`
- 新增 `src/server/auth/authMiddleware.ts`
- `src/server/routes/orders.test.ts`

可能影响：

- `src/api/payment.ts`
- `src/services/paymentService.ts`
- `src/hooks/usePayment.ts`

后续如果前端真实调用后端订单 API，需要补齐 Authorization header 传递。

## 风险与缓解

### 风险 1：现有 API 测试未带 token 导致失败

缓解：统一测试 helper 生成 Authorization header 或 mock req.auth。

### 风险 2：dev token 被误用于生产

缓解：在文档中明确 dev token 仅用于开发；后续真实生产必须替换 JWT verifier。`/pay` 已通过 `NODE_ENV=production` 禁用。

### 风险 3：未来接入真实用户系统时重复改造

缓解：Auth Provider 独立在 auth 模块，订单路由只依赖 `AuthContext`，不依赖 dev token 格式。

## 后端安全边界表

> 按规则第 8 节六大维度输出，每个方面回答：风险是什么、在哪里处理、处理规则、如何验证、哪些未验证。

### 一、接口输入安全

| 问题 | 回答 |
|------|------|
| 风险是什么 | 前端传来的 userId/orderId/productId/channel 可能被篡改，导致越权创建订单、非法支付渠道、注入攻击 |
| 在哪里处理 | `src/server/routes/orders.ts` 第 57-86 行（创建订单）、第 88-99 行（查询用户订单）、第 101-116 行（查询单个订单）、第 118-142 行（退款）；`src/server/auth/authRoutes.ts` 第 13-69 行（注册） |
| 处理规则 | userId 正则 `/^[a-zA-Z0-9_-]{1,64}$/`；orderId 正则 `/^order-[a-z0-9-]{6,64}$/i`；channel 白名单 `['wechat','alipay','apple']`；productId 类型+长度≤64；phoneNumber 正则 `/^1[3-9]\d{9}$/` |
| 如何验证 | `src/server/routes/orders.test.ts` 有专项测试：userId 含特殊字符返回 400、productId 过长返回 400、channel 非法返回 400、orderId 含 `<script>` 返回 400 |
| 哪些未验证 | 支付回调路由 `src/server/routes/payment.ts` 的 orderId 和 req.body 没有做格式校验和白名单，直接透传给回调处理服务 |

### 二、登录状态

| 问题 | 回答 |
|------|------|
| 风险是什么 | 未登录用户可能访问订单、退款、同步等敏感接口 |
| 在哪里处理 | `src/server/auth/authMiddleware.ts` 的 `requireAuth` 中间件（第 29-40 行），解析 `Authorization: Bearer <token>` 头 |
| 处理规则 | 支持两种 token：开发环境 `dev-user:<userId>` / `dev-admin:<adminId>`（正则白名单校验）；生产环境 JWT（HMAC-SHA256 签名+过期校验）。无 token 返回 401 |
| 如何验证 | `src/server/auth/authMiddleware.test.ts` 覆盖：有效 token 注入 auth、缺失 token 返回 401、非法格式返回 undefined |
| 哪些未验证 | 支付回调路由完全没有鉴权（`src/server/routes/payment.ts` 第 24/64/104 行），任何人都可以 POST 触发权益发放。生产环境依赖微信/支付宝签名验证，但开发环境无任何保护 |

### 三、系统权限设计

| 问题 | 回答 |
|------|------|
| 风险是什么 | 普通用户可能操作他人订单、查看他人数据、执行管理员操作 |
| 在哪里处理 | `src/server/auth/authMiddleware.ts` 的 `canAccessUserResource`（第 46-49 行）和 `isAdmin`（第 42-44 行）；`src/server/routes/orders.ts` 每个接口都调用了 `canAccessUserResource` |
| 处理规则 | 用户只能操作自己的资源（`auth.userId === targetUserId`）；管理员可以操作任意用户资源（`auth.role === 'admin'`）；模拟支付接口额外要求管理员身份 |
| 如何验证 | `src/server/routes/orders.test.ts` 覆盖：用户为他人创建订单返回 403、管理员可为他人创建、用户退款他人订单返回 403、用户查询他人订单返回 403、管理员可查任意订单 |
| 哪些未验证 | 同步路由 `src/server/routes/sync.ts` 只校验了 JWT token 有效性，但没有校验 body 中的 `personas[].id` 和 `memoryEvents[].id` 是否属于当前用户 |

### 四、密码规则

| 问题 | 回答 |
|------|------|
| 风险是什么 | JWT 密钥硬编码默认值，生产环境若未设置环境变量，所有 token 可被伪造 |
| 在哪里处理 | `src/server/auth/jwtService.ts` 第 3 行 |
| 处理规则 | `process.env.VITE_JWT_SECRET \|\| 'xinghuanhai-dev-secret-key-2026'` |
| 如何验证 | 代码审查确认 |
| 哪些未验证 | 生产环境启动时没有检测是否使用默认密钥的机制；没有自动生成强随机密钥的兜底逻辑 |

### 五、数据归属

| 问题 | 回答 |
|------|------|
| 风险是什么 | 用户 A 可能读取/修改用户 B 的数据（订单、Persona、记忆事件等） |
| 在哪里处理 | 数据库层：`supabase/init.sql` 启用 RLS，每张表有 `FOR ALL USING (auth.uid() = user_id)` 策略；应用层：`src/server/routes/orders.ts` 每个接口校验 `canAccessUserResource`；`src/server/routes/sync.ts` 通过 JWT 中的 `sub` 限定数据范围 |
| 处理规则 | 数据库层 RLS 兜底 + 应用层鉴权双重保护 |
| 如何验证 | orders.test.ts 覆盖了横向越权测试；schema.sql 有完整的 RLS 策略定义 |
| 哪些未验证 | sync push 接口：push 时用 JWT sub 创建数据，但 body 中的 id 来自前端——如果前端传了别人的 id，虽然数据归属正确但 id 可能冲突。内存存储降级时没有 userId 校验 |

### 六、注入风险

| 问题 | 回答 |
|------|------|
| 风险是什么 | SQL 注入、命令注入、HTML/模板注入、日志注入 |
| 在哪里处理 | 全部数据库操作使用 Supabase JS SDK（参数化查询），无字符串拼接 SQL；所有用户输入经过正则白名单校验；错误响应脱敏不返回堆栈 |
| 处理规则 | Supabase SDK 的 `.eq()`、`.insert()`、`.update()` 都是参数化查询；userId/orderId 等关键参数有正则白名单 |
| 如何验证 | orders.test.ts 有防注入测试（userId 含 `../etc/passwd` 返回 400、orderId 含 `<script>` 返回 400） |
| 哪些未验证 | 支付回调的 `rawCallback` 字段直接存储为 JSONB，如果后续有代码直接拼接此字段到 HTML 或 SQL，存在二次注入风险。sync push 的 `content` 和 `metadata` 字段没有做内容清洗，直接存入数据库。支付回调错误信息直接返回 `(error as Error).message`，可能泄露内部信息 |

---

## 注入风险详细检查

### SQL 注入

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 是否使用 ORM/参数化查询 | ✅ 安全 | 全部数据库操作使用 Supabase JS SDK，所有查询通过 `.eq()`、`.insert()`、`.update()` 等参数化方法 |
| 是否存在字符串拼接 SQL | ✅ 无 | 未发现任何 SQL 字符串拼接 |
| 是否存在动态表名/列名来自用户输入 | ✅ 无 | 所有表名和列名都是硬编码 |
| schema.sql 迁移 | ⚠️ 注意 | `src/server/db/migration.ts` 通过 `client.rpc('exec_sql', { sql: statement + ';' })` 执行 SQL，但 statement 来自本地文件读取，非用户输入，风险可控 |

### 命令注入

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 是否使用 exec/spawn/eval 等 | ✅ 无 | 后端代码中未使用任何命令执行函数 |

### HTML/模板注入

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 是否有 HTML 渲染用户输入 | ✅ 安全 | 后端是纯 API 服务，返回 JSON，不渲染 HTML |
| 错误信息是否脱敏 | ✅ 安全 | `src/server/index.ts` 全局异常处理只返回 `{ error: 'Internal server error' }`，不暴露堆栈 |
| 支付回调错误信息 | ⚠️ 风险 | `src/server/routes/payment.ts` 直接返回 `(error as Error).message`，可能泄露内部信息 |

### 日志注入

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 日志是否直接写入用户输入 | ⚠️ 注意 | 部分日志可能包含用户输入，需确认是否做了换行符清洗 |
| 错误响应是否泄露敏感信息 | ✅ 安全 | 全局异常处理已脱敏 |

---

## 过度防御审查

### 必须校验的业务规则（保留）

| 校验 | 位置 | 理由 |
|------|------|------|
| `canAccessUserResource` 横向越权检查 | `src/server/routes/orders.ts` 多处 | 核心安全规则，防止用户操作他人订单 |
| 订单状态机校验（退款仅限 paid） | `src/server/routes/orders.ts` 第 132 行 | 防止重复退款、退款未支付订单 |
| 生产环境禁用模拟支付 | `src/server/routes/orders.ts` 第 145 行 | 防止生产环境资金漏洞 |
| userId/orderId 正则白名单 | `src/server/routes/orders.ts` 第 29-30 行 | 防注入、防路径遍历 |

### 框架已处理的基础校验（可简化）

| 校验 | 位置 | 说明 |
|------|------|------|
| `typeof channel === 'string'` 类型检查 | `src/server/routes/orders.ts` 第 67 行 | Express 的 `express.json()` 已解析 JSON body，TypeScript 编译时类型检查已覆盖。保留也无害 |
| `Array.isArray(body.personas)` | `src/server/routes/sync.ts` 第 66 行 | 合理的防御性编程，保留 |

### 可以由前端处理的校验（保留但可降级）

| 校验 | 位置 | 说明 |
|------|------|------|
| `displayName.trim().length === 0` | `src/server/auth/authRoutes.ts` 第 26 行 | 前端可以做，但后端保留作为安全兜底是合理的 |
| `age > 0 && age <= 150` | `src/server/auth/authRoutes.ts` 第 52 行 | 同上，保留合理 |

### 永远不会触发的防御分支（死代码，必须清理）

| 代码 | 位置 | 说明 |
|------|------|------|
| `verifyAlipaySign` 始终返回 `false` | `src/server/services/paymentCallbackService.ts` 第 97-99 行 | 函数体为空（参数用 `_` 前缀标记未使用），始终返回 `false`。生产环境支付宝回调永远验签失败 |
| `verifyAppleReceipt` 始终返回失败 | `src/server/services/paymentCallbackService.ts` 第 101-103 行 | Apple 收据验证未实现，生产环境永远失败 |
| `generateWechatSign` 返回未哈希字符串 | `src/server/services/paymentCallbackService.ts` 第 91-95 行 | 函数名暗示生成签名，但实际只是拼接字符串，没有做 MD5/SHA256 哈希 |

---

## 风险清单（按严重程度排序）

| 优先级 | 风险 | 位置 | 影响 |
|--------|------|------|------|
| 🔴 P0 | JWT 密钥硬编码默认值 | `src/server/auth/jwtService.ts:3` | 生产环境若未设置环境变量，所有 token 可被伪造 |
| 🔴 P0 | 支付回调路由无鉴权 | `src/server/routes/payment.ts` 第 24/64/104 行 | 开发环境任何人可触发权益发放 |
| 🟠 P1 | 支付宝/Apple 支付验签未实现 | `src/server/services/paymentCallbackService.ts` 第 97-103 行 | 生产环境支付回调永远失败 |
| 🟠 P1 | sync push 缺少数据归属校验 | `src/server/routes/sync.ts` 第 60-118 行 | 前端可构造他人数据 id |
| 🟡 P2 | 支付回调错误信息泄露 | `src/server/routes/payment.ts` 第 60/100/139 行 | 可能泄露内部实现细节 |
| 🟡 P2 | sync push 内容未清洗 | `src/server/routes/sync.ts` 第 70-106 行 | 存储型 XSS 风险（需前端配合） |
| 🟡 P2 | authRoutes 无测试覆盖 | `src/server/auth/authRoutes.ts` | 认证接口变更无法自动验证 |
| 🟢 P3 | 微信签名生成不完整 | `src/server/services/paymentCallbackService.ts` 第 91-95 行 | 开发环境不影响，生产环境需修复 |

---

## 自检结果

- 无 TBD/TODO。
- 范围聚焦在订单、退款、支付测试接口权限。
- 不引入完整账号系统，避免过度设计。
- 模块边界清晰：Auth 解析身份，Router 做资源授权，Service 保持纯业务状态机。
- 测试场景覆盖正常、异常、越权、生产禁用和状态机边界。
- 安全边界表已按六大维度输出，风险已按 P0-P5 分级。
- 注入风险已逐项检查，过度防御已区分四类。
