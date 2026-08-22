# 星河宠记 API 文档

> Base URL: `http://localhost:3001`

## 认证接口 (Auth)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/refresh` | 刷新 Token | 否 |
| POST | `/api/auth/logout` | 登出 | 否 |
| GET | `/api/auth/session` | 获取当前用户 | 是 |
| POST | `/api/auth/bind-device` | 绑定设备 | 是 |
| GET | `/api/auth/devices` | 获取设备列表 | 是 |

### POST /api/auth/register

注册新用户。

**请求体：**
```json
{
  "provider": "wechat" | "alipay" | "apple",
  "code": "string",
  "phoneNumber": "1xxxxxxxxxx",
  "displayName": "string",
  "age": 18
}
```

**响应 (201)：**
```json
{
  "userId": "user-xxx",
  "role": "user",
  "displayName": "string",
  "phoneNumber": "1xxxxxxxxxx",
  "avatarUrl": "string",
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 7200
}
```

**错误：**
- 400: 无效的登录方式 / 请输入有效的手机号 / 请输入昵称
- 409: 该手机号已注册 / 该账号已注册

---

### POST /api/auth/login

用户登录。

**请求体：**
```json
{
  "provider": "wechat" | "alipay" | "apple",
  "code": "string",
  "phoneNumber": "1xxxxxxxxxx"
}
```

**响应 (200)：**
```json
{
  "userId": "user-xxx",
  "role": "user",
  "displayName": "string",
  "phoneNumber": "1xxxxxxxxxx",
  "avatarUrl": "string",
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 7200
}
```

**错误：**
- 400: 无效的登录方式
- 404: 用户未注册 (needRegister: true)

---

### POST /api/auth/refresh

刷新访问令牌。

**请求体：**
```json
{
  "refreshToken": "string"
}
```

**响应 (200)：**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 7200
}
```

**错误：**
- 400: 缺少 refreshToken
- 401: refreshToken 无效或已过期 / 用户不存在

---

### POST /api/auth/logout

用户登出。

**响应 (200)：**
```json
{
  "success": true
}
```

---

### GET /api/auth/session

获取当前登录用户信息。

**请求头：**
```
Authorization: Bearer <accessToken>
```

**响应 (200)：**
```json
{
  "userId": "user-xxx",
  "role": "user",
  "displayName": "string",
  "phoneNumber": "1xxxxxxxxxx",
  "avatarUrl": "string",
  "provider": "wechat"
}
```

**错误：**
- 401: 未登录 / Token 无效或已过期 / 用户不存在

---

### POST /api/auth/bind-device

绑定设备。

**请求头：**
```
Authorization: Bearer <accessToken>
```

**请求体：**
```json
{
  "deviceName": "string"
}
```

**响应 (201)：**
```json
{
  "deviceId": "device-xxx",
  "deviceName": "string",
  "boundAt": "2024-01-01T00:00:00.000Z"
}
```

**错误：**
- 400: 缺少设备名称
- 401: 未登录 / Token 无效或已过期
- 404: 用户不存在

---

### GET /api/auth/devices

获取用户绑定的设备列表。

**请求头：**
```
Authorization: Bearer <accessToken>
```

**响应 (200)：**
```json
[
  {
    "deviceId": "device-xxx",
    "deviceName": "string",
    "boundAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**错误：**
- 401: 未登录 / Token 无效或已过期

---

## 订单接口 (Orders)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/orders` | 创建订单 | 是 |
| GET | `/api/orders/user/:userId` | 用户订单列表 | 是 |
| GET | `/api/orders/:id` | 订单详情 | 是 |
| POST | `/api/orders/:id/refund` | 申请退款 | 是 |
| POST | `/api/orders/:id/pay` | 模拟支付 | 是 (仅管理员) |

### POST /api/orders

创建新订单。

**请求头：**
```
Authorization: Bearer <accessToken>
```

**请求体：**
```json
{
  "userId": "user-xxx",
  "productId": "string",
  "channel": "wechat" | "alipay" | "apple"
}
```

**响应 (200)：**
```json
{
  "id": "order-xxx",
  "userId": "user-xxx",
  "productId": "string",
  "amount": 100,
  "channel": "wechat",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**错误：**
- 400: Invalid userId / Invalid productId / channel must be one of: wechat, alipay, apple
- 403: Forbidden
- 404: Product not found

---

### GET /api/orders/user/:userId

获取用户订单列表。

**请求头：**
```
Authorization: Bearer <accessToken>
```

**响应 (200)：**
```json
[
  {
    "id": "order-xxx",
    "userId": "user-xxx",
    "productId": "string",
    "amount": 100,
    "channel": "wechat",
    "status": "paid",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**错误：**
- 400: Invalid userId format
- 403: Forbidden

---

### GET /api/orders/:id

获取订单详情。

**请求头：**
```
Authorization: Bearer <accessToken>
```

**响应 (200)：**
```json
{
  "id": "order-xxx",
  "userId": "user-xxx",
  "productId": "string",
  "amount": 100,
  "channel": "wechat",
  "status": "paid",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**错误：**
- 400: Invalid order id format
- 403: Forbidden
- 404: Order not found

---

### POST /api/orders/:id/refund

申请退款。

**请求头：**
```
Authorization: Bearer <accessToken>
```

**响应 (200)：**
```json
{
  "id": "order-xxx",
  "status": "refunded",
  "refundedAt": "2024-01-01T00:00:00.000Z"
}
```

**错误：**
- 400: Invalid order id format / Cannot refund order with status: xxx
- 403: Forbidden
- 404: Order not found

---

### POST /api/orders/:id/pay

模拟支付（仅开发环境 + 管理员可用）。

**请求头：**
```
Authorization: Bearer <accessToken>
```

**请求体：**
```json
{
  "channelTradeNo": "string"
}
```

**响应 (200)：**
```json
{
  "id": "order-xxx",
  "status": "paid",
  "paidAt": "2024-01-01T00:00:00.000Z"
}
```

**错误：**
- 400: Invalid order id format / Cannot pay order with status: xxx
- 403: This endpoint is disabled in production / Forbidden
- 404: Order not found
- 500: Failed to mark as paid

---

## 支付回调接口 (Payment)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/payment/wechat/callback` | 微信支付回调 | 否 |
| POST | `/api/payment/alipay/callback` | 支付宝回调 | 否 |
| POST | `/api/payment/apple/verify` | Apple IAP 验证 | 否 |

### POST /api/payment/wechat/callback

微信支付回调。

**请求体：**
```json
{
  "orderId": "order-xxx",
  "transactionId": "string",
  "totalAmount": 100,
  "timeEnd": "20240101000000"
}
```

**响应 (200)：**
```json
{
  "success": true
}
```

---

### POST /api/payment/alipay/callback

支付宝回调。

**请求体：**
```json
{
  "orderId": "order-xxx",
  "tradeNo": "string",
  "totalAmount": "100.00"
}
```

**响应 (200)：**
```json
{
  "success": true
}
```

---

### POST /api/payment/apple/verify

Apple IAP 支付验证。

**请求体：**
```json
{
  "orderId": "order-xxx",
  "receipt": "base64-encoded-receipt"
}
```

**响应 (200)：**
```json
{
  "success": true,
  "tradeNo": "string"
}
```

---

## 同步接口 (Sync)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/sync/push` | 推送数据 | 是 |
| GET | `/api/sync/pull` | 拉取数据 | 是 |
| POST | `/api/sync/conflict` | 冲突解决 | 是 |
| GET | `/api/sync/status` | 同步状态 | 是 |

### POST /api/sync/push

推送本地数据到服务器。

**请求头：**
```
Authorization: Bearer <accessToken>
```

**请求体：**
```json
{
  "personas": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "personaType": "string",
      "config": {},
      "avatarUrl": "string",
      "isPublic": true,
      "status": "active"
    }
  ],
  "memoryEvents": [
    {
      "id": "string",
      "eventType": "string",
      "content": "string",
      "metadata": {},
      "importance": 0.5
    }
  ]
}
```

**响应 (200)：**
```json
{
  "success": true,
  "syncedAt": "2024-01-01T00:00:00.000Z",
  "results": {
    "personas": 1,
    "memoryEvents": 1
  }
}
```

**错误：**
- 401: Missing authorization token / Invalid or expired token
- 500: Sync push failed

---

### GET /api/sync/pull

从服务器拉取数据。

**请求头：**
```
Authorization: Bearer <accessToken>
```

**查询参数：**
- `since` (可选): ISO 时间戳，只返回该时间之后的数据

**响应 (200)：**
```json
{
  "personas": [],
  "memoryEvents": [],
  "syncedAt": "2024-01-01T00:00:00.000Z"
}
```

**错误：**
- 401: Missing authorization token / Invalid or expired token
- 500: Sync pull failed

---

### POST /api/sync/conflict

冲突解决。

**请求头：**
```
Authorization: Bearer <accessToken>
```

**请求体：**
```json
{
  "localVersion": 1,
  "remoteVersion": 2,
  "localData": {},
  "remoteData": {}
}
```

**响应 (200)：**
```json
{
  "resolution": "local" | "remote" | "merge",
  "mergedData": {}
}
```

**错误：**
- 500: Conflict resolution failed

---

### GET /api/sync/status

获取同步状态。

**请求头：**
```
Authorization: Bearer <accessToken>
```

**响应 (200)：**
```json
{
  "connected": true,
  "lastSync": "2024-01-01T00:00:00.000Z",
  "tables": {
    "personas": "2024-01-01T00:00:00.000Z",
    "memory_events": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误：**
- 500: Failed to get sync status

---

## 健康检查

### GET /health

服务健康检查。

**响应 (200)：**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "error": "错误信息描述"
}
```

部分接口可能返回额外字段：

```json
{
  "error": "用户未注册",
  "needRegister": true,
  "providerUserId": "wechat-xxx"
}
```

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 / Token 无效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器错误 |
---

## 2026-08-22 变更与新增接口

> 说明：本文档为早期版本，完整接口以代码为准（server/src/routes/*）。
> 本节记录 2026-08-22 起的行为变更与新增/设计中的接口。

### 行为变更

| 接口 | 变更 |
| --- | --- |
| `POST /api/pets/:petId/checkins` | 打卡含异常项（has_anomaly/anomaly_items/risk_level）时，自动写健康事件记忆（异步，`recordHealthMemory`） |
| `POST /api/pets/:petId/symptom-check` | 初筛提交后自动写医疗记忆（症状+评估+建议，异步） |

### 回忆录 2.0（已实现，管线见 TECH_DESIGN 二十章）

| 接口 | 说明 |
| --- | --- |
| `POST /api/pets/:petId/memoir` | 创建回忆录（含 script 分镜自动生成，状态含 script_ready） |

### 设计中（剧本确认流程，待实现）

| 接口 | 说明 |
| --- | --- |
| `POST /api/memoir/script-draft` | 生成剧本草稿（选模板，DeepSeek 文本 ~0.03 元） |
| `GET /api/memoir/:id/script` | 读剧本预览 |
| `POST /api/memoir/:id/script/confirm` | 确认剧本 → script_confirmed |
| `POST /api/memoir/:id/script/regenerate` | 换模板/换记忆重生成 |
| `POST /api/memoir/:id/script/edit` | 修改旁白/字幕 |

### 设计中（体检报告识别 F8，待实现）

| 接口 | 说明 |
| --- | --- |
| `POST /api/ai/health-report-recognize` | 上传体检报告图 → 结构化指标提取 → 存 health_reports + 写健康记忆 |