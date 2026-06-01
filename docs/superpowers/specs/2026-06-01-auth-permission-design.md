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

## 自检结果

- 无 TBD/TODO。
- 范围聚焦在订单、退款、支付测试接口权限。
- 不引入完整账号系统，避免过度设计。
- 模块边界清晰：Auth 解析身份，Router 做资源授权，Service 保持纯业务状态机。
- 测试场景覆盖正常、异常、越权、生产禁用和状态机边界。
