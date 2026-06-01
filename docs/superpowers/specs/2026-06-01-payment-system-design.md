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

1. **签名验证**：微信/支付宝回调必须验证签名
2. **幂等性**：同一订单多次回调只发放一次权益
3. **Receipt 验证**：Apple 需要服务端验证 receipt
4. **金额校验**：防止篡改金额

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
