# 支付流程接入设计

> 本文档定义「个人学习规划记录」产品的支付系统技术架构、API 契约和实施规范，作为后续开发的唯一权威依据。

---

## 一、整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端 (Electron/Web)                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │ 商品选择    │───▶│ 创建订单    │───▶│ 发起支付(SDK/URL)   │ │
│  └─────────────┘    └──────┬──────┘    └──────────┬──────────┘ │
│                            │                       │            │
│                            ▼                       ▼            │
│                    ┌───────────────┐    ┌─────────────────────┐ │
│                    │ WebSocket     │◀───│ 支付回调/轮询       │ │
│                    │ 状态监听      │    │ 支付结果            │ │
│                    └───────┬───────┘    └─────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│                    ┌───────────────┐                           │
│                    │ 权益发放      │                           │
│                    │ (Entitlement)│                           │
│                    └───────────────┘                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP / WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                         后端服务                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │ Order API   │    │ Payment     │    │ WebSocket           │ │
│  │ (REST)      │    │ Callback    │    │ Server              │ │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘ │
│         │                   │                       │            │
│         │                   ▼                       │            │
│         │           ┌───────────────┐               │            │
│         │           │ 支付渠道      │               │            │
│         │           │ (微信/支付宝/ │               │            │
│         │           │  Apple)       │               │            │
│         │           └───────────────┘               │            │
│         │                                           │            │
│         └───────────────────┬───────────────────────┘            │
│                             │                                    │
│                             ▼                                    │
│                    ┌───────────────┐                            │
│                    │ 订单/权益存储  │                            │
│                    └───────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、核心支付流程

```
用户点击购买
     │
     ▼
前端调用 POST /api/orders 创建订单
     │
     ▼
后端创建订单，返回 orderId + 支付参数
     │
     ▼
前端根据渠道调用对应支付 SDK
     │
     ├── 微信：WeChat Pay SDK / JSAPI
     ├── 支付宝：Alipay SDK / H5
     └── Apple：StoreKit / IAP
     │
     ▼
用户完成支付
     │
     ├── 方式1：支付渠道异步回调 → 后端验证 → 发放权益 → WebSocket 推送
     ├── 方式2：前端轮询 → 后端查询状态 → 更新 UI
     └── Apple IAP：Receipt 验证 → 发放权益
     │
     ▼
前端收到支付成功 → 刷新权益状态 → 展示成功页
```

---

## 三、后端 API 设计

### 3.1 订单接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/orders | 创建订单 |
| GET | /api/orders/:id | 查询订单状态 |
| GET | /api/orders/user/:userId | 用户订单列表 |

### 3.2 支付回调接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/payment/wechat/callback | 微信支付回调 |
| POST | /api/payment/alipay/callback | 支付宝回调 |
| POST | /api/payment/apple/verify | Apple Receipt 验证 |

### 3.3 退款接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/payment/:orderId/refund | 退款申请 |

### 3.4 WebSocket

| 路径 | 说明 |
|------|------|
| WS /ws/payment | 支付状态实时推送 |

---

## 四、API 契约

### 4.1 创建订单

```ts
// 请求
interface CreateOrderRequest {
  userId: string
  productId: string
  channel: 'wechat' | 'alipay' | 'apple'
}

// 响应
interface CreateOrderResponse {
  orderId: string
  amount: number
  channel: OrderPaymentChannel
  status: 'pending'
  createdAt: string
  paymentParams?: {
    // 微信 JSAPI
    appId?: string
    timeStamp?: string
    nonceStr?: string
    package?: string
    signType?: string
    paySign?: string
    // 支付宝
    orderStr?: string
    // Apple IAP
    productId?: string
  }
}
```

### 4.2 查询订单

```ts
// 响应
interface OrderDetailResponse {
  id: string
  userId: string
  productId: string
  amount: number
  channel: OrderPaymentChannel
  status: OrderStatus
  channelTradeNo?: string
  createdAt: string
  paidAt?: string
  refundedAt?: string
}
```

### 4.3 WebSocket 消息

```ts
// 支付状态推送
interface PaymentStatusMessage {
  type: 'payment_status'
  orderId: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  tradeNo?: string
  error?: string
}
```

---

## 五、前端模块设计

```
src/
├── services/
│   ├── paymentService.ts      # 支付核心服务
│   ├── wechatPay.ts           # 微信支付适配器
│   ├── alipay.ts              # 支付宝适配器
│   ├── appleIap.ts            # Apple IAP 适配器
│   └── websocket.ts           # WebSocket 连接管理
├── hooks/
│   ├── usePayment.ts          # 支付流程 Hook
│   └── usePaymentStatus.ts    # 支付状态监听
├── components/
│   └── payment/
│       ├── PaymentModal.tsx   # 支付弹窗
│       ├── PaymentSuccess.tsx # 支付成功页
│       └── PaymentFailed.tsx  # 支付失败页
```

---

## 六、支付渠道差异

| 渠道 | 支付方式 | 回调方式 | 注意事项 |
|------|----------|----------|----------|
| 微信 | JSAPI/H5/小程序 | 异步回调 | 需要 appId/mchId |
| 支付宝 | H5/小程序 | 异步回调 | 需要 appId |
| Apple IAP | StoreKit | Receipt 验证 | 需要 receipt 验证 |

---

## 七、安全要点

### 7.1 安全边界表

> 按规则第 8 节六大维度输出。

#### 一、接口输入安全

| 问题 | 回答 |
|------|------|
| 风险是什么 | 前端传来的 userId/productId/channel/orderId 可能被篡改，导致越权创建订单、非法支付渠道、金额篡改 |
| 在哪里处理 | `src/server/routes/orders.ts` 第 57-86 行（创建订单校验 userId/productId/channel）、第 118-142 行（退款校验 orderId） |
| 处理规则 | userId 正则 `/^[a-zA-Z0-9_-]{1,64}$/`；orderId 正则 `/^order-[a-z0-9-]{6,64}$/i`；channel 白名单 `['wechat','alipay','apple']`；productId 类型+长度≤64 |
| 如何验证 | `src/server/routes/orders.test.ts` 有专项测试：userId 含特殊字符返回 400、productId 过长返回 400、channel 非法返回 400、orderId 含 `<script>` 返回 400 |
| 哪些未验证 | 支付回调路由 `src/server/routes/payment.ts` 的 orderId 和 req.body 没有做格式校验和白名单，直接透传给回调处理服务 |

#### 二、登录状态

| 问题 | 回答 |
|------|------|
| 风险是什么 | 未登录用户可能访问订单、退款接口；支付回调路由无任何鉴权 |
| 在哪里处理 | `src/server/auth/authMiddleware.ts` 的 `requireAuth` 中间件 |
| 处理规则 | 订单/退款接口需要 Bearer Token；支付回调路由当前无鉴权（依赖第三方签名验证） |
| 如何验证 | `src/server/auth/authMiddleware.test.ts` 和 `src/server/routes/orders.test.ts` 覆盖了鉴权测试 |
| 哪些未验证 | 支付回调路由（`src/server/routes/payment.ts` 第 24/64/104 行）完全没有鉴权，开发环境任何人可 POST 触发权益发放 |

#### 三、系统权限设计

| 问题 | 回答 |
|------|------|
| 风险是什么 | 普通用户可能操作他人订单、退款他人订单、执行模拟支付 |
| 在哪里处理 | `src/server/auth/authMiddleware.ts` 的 `canAccessUserResource` 和 `isAdmin` |
| 处理规则 | 用户只能操作自己的订单；管理员可操作任意订单；模拟支付仅管理员+非生产环境 |
| 如何验证 | `src/server/routes/orders.test.ts` 覆盖了横向越权和角色权限测试 |
| 哪些未验证 | 支付回调接口没有权限校验 |

#### 四、密码规则

| 问题 | 回答 |
|------|------|
| 风险是什么 | JWT 密钥硬编码默认值，生产环境若未设置环境变量，所有 token 可被伪造 |
| 在哪里处理 | `src/server/auth/jwtService.ts` 第 3 行 |
| 处理规则 | `process.env.VITE_JWT_SECRET \|\| 'xinghuanhai-dev-secret-key-2026'` |
| 如何验证 | 代码审查确认 |
| 哪些未验证 | 生产环境启动时没有检测是否使用默认密钥的机制 |

#### 五、数据归属

| 问题 | 回答 |
|------|------|
| 风险是什么 | 用户 A 可能读取/修改用户 B 的订单数据 |
| 在哪里处理 | 数据库层 RLS + 应用层 `canAccessUserResource` 双重保护 |
| 处理规则 | 每条订单绑定 userId，查询/退款时校验归属 |
| 如何验证 | orders.test.ts 覆盖了横向越权测试 |
| 哪些未验证 | 支付回调处理时没有校验订单归属 |

#### 六、注入风险

| 问题 | 回答 |
|------|------|
| 风险是什么 | SQL 注入、支付回调数据二次注入、错误信息泄露 |
| 在哪里处理 | 全部数据库操作使用 Supabase JS SDK（参数化查询）；关键参数正则白名单 |
| 处理规则 | Supabase SDK 参数化查询；userId/orderId 正则白名单 |
| 如何验证 | orders.test.ts 有防注入测试 |
| 哪些未验证 | 支付回调的 `rawCallback` 字段直接存储为 JSONB，存在二次注入风险；支付回调错误信息直接返回 `(error as Error).message`，可能泄露内部信息 |

### 7.2 支付安全专项

1. **签名验证**：微信/支付宝回调必须验证签名。当前 `verifyAlipaySign` 函数体为空（死代码），`generateWechatSign` 返回未哈希字符串（实现不完整），生产环境必须修复
2. **幂等性**：同一订单多次回调只发放一次权益。当前通过订单状态机（pending→paid）保证
3. **Receipt 验证**：Apple 需要服务端验证 receipt。当前 `verifyAppleReceipt` 未实现（死代码）
4. **金额校验**：防止篡改金额。当前金额由服务端根据 productId 从 ProductCatalog 查询，不信任前端传入

### 7.3 注入风险详细检查

#### SQL 注入

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 是否使用 ORM/参数化查询 | ✅ 安全 | 全部使用 Supabase JS SDK 参数化方法 |
| 是否存在字符串拼接 SQL | ✅ 无 | 未发现 |
| 支付回调 rawCallback 存储 | ⚠️ 风险 | 直接存储为 JSONB，后续如拼接此字段到 HTML/SQL 存在二次注入风险 |

#### 命令注入

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 是否使用 exec/spawn/eval 等 | ✅ 无 | 未使用任何命令执行函数 |

#### HTML/模板注入

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 是否有 HTML 渲染用户输入 | ✅ 安全 | 后端返回 JSON，不渲染 HTML |
| 支付回调错误信息 | ⚠️ 风险 | 直接返回 `(error as Error).message`，可能泄露内部信息 |

### 7.4 过度防御审查

#### 必须校验的业务规则（保留）

| 校验 | 理由 |
|------|------|
| 订单状态机（pending→paid→refunded） | 防止重复支付、重复退款 |
| 生产环境禁用模拟支付 | 防止生产环境资金漏洞 |
| 金额由服务端查询 ProductCatalog | 防止前端篡改金额 |
| 支付回调幂等性（状态机保证） | 防止重复发放权益 |

#### 框架已处理的基础校验（可简化）

| 校验 | 说明 |
|------|------|
| `typeof channel === 'string'` | Express JSON 解析 + TypeScript 编译时已覆盖，保留也无害 |

#### 永远不会触发的防御分支（死代码，必须清理）

| 代码 | 位置 | 说明 |
|------|------|------|
| `verifyAlipaySign` 始终返回 `false` | `src/server/services/paymentCallbackService.ts` 第 97-99 行 | 函数体为空，生产环境支付宝回调永远验签失败 |
| `verifyAppleReceipt` 始终返回失败 | `src/server/services/paymentCallbackService.ts` 第 101-103 行 | Apple 收据验证未实现 |
| `generateWechatSign` 返回未哈希字符串 | `src/server/services/paymentCallbackService.ts` 第 91-95 行 | 实现不完整，未做 MD5/SHA256 哈希 |

### 7.5 支付安全风险清单

| 优先级 | 风险 | 位置 | 影响 |
|--------|------|------|------|
| 🔴 P0 | 支付回调路由无鉴权 | `src/server/routes/payment.ts` 第 24/64/104 行 | 开发环境任何人可触发权益发放 |
| 🟠 P1 | 支付宝/Apple 支付验签未实现 | `src/server/services/paymentCallbackService.ts` 第 97-103 行 | 生产环境支付回调永远失败 |
| 🟡 P2 | 支付回调错误信息泄露 | `src/server/routes/payment.ts` 第 60/100/139 行 | 可能泄露内部实现细节 |
| 🟡 P2 | 支付回调 rawCallback 二次注入风险 | `src/server/db/orderRepository.ts` 第 134 行 | 后续如拼接此字段存在风险 |
| 🟢 P3 | 微信签名生成不完整 | `src/server/services/paymentCallbackService.ts` 第 91-95 行 | 开发环境不影响，生产环境需修复 |

---

## 八、与现有代码的集成

### 8.1 复用现有模块

- `OrderService`：订单生命周期管理
- `PaymentAdapter`：支付渠道适配器接口
- `ProductCatalog`：商品目录查询
- `EntitlementService`：权益发放

### 8.2 扩展点

- 新增支付渠道：在 `PaymentAdapter` 接口追加实现
- 新增支付方式：在 `paymentService.ts` 追加处理逻辑

---

## 九、实施优先级

| 阶段 | 内容 |
|------|------|
| P0 | 后端订单 API + 微信支付接入 + WebSocket 状态推送 |
| P1 | 支付宝支付接入 + 前端支付流程 UI |
| P2 | Apple IAP 接入 + 退款功能 |
| P3 | 订单查询页面 + 退款记录 |
