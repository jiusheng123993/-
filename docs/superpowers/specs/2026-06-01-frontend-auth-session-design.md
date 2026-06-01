# 前端开发态登录态系统设计

## 背景

后端订单接口已经加入 Bearer Token 鉴权，敏感接口不再允许匿名调用。前端现有支付、订单查询与退款流程仍主要依赖 `userId` 字符串或本地内存订单服务，缺少统一登录态与 Authorization header，导致前端无法稳定适配后端权限边界。

本设计采用开发阶段完整登录态系统，直接在前端加入用户/管理员身份切换、token 生成、请求头注入与订单 API 联动。该方案服务当前开发调试，同时为后续真实登录、JWT 与账号系统保留替换边界。

## 目标

1. 新增前端登录态模块，管理当前身份、角色和 token。
2. 支持普通用户和管理员两种角色。
3. 订单创建、订单查询、用户订单列表、退款 API 自动携带 Authorization header。
4. 支付服务通过登录态调用订单 API。
5. 保持后端 dev token 格式兼容：`dev-user:<userId>`、`dev-admin:<adminId>`。
6. 提供测试覆盖，验证 token 生成、请求头注入和支付服务参数传递。

## 非目标

1. 不实现密码登录、注册、验证码或真实账号体系。
2. 不接入 JWT 签发与刷新。
3. 不新增数据库用户表。
4. 不改造所有 UI 成完整登录页。
5. 不改变订单、权益、支付状态机。

## 方案

采用前端开发态 Auth Session 模块。

新增：

```text
src/auth/devAuthSession.ts
```

该模块职责：

- 定义 `DevAuthRole` 和 `DevAuthSession`。
- 生成默认开发用户身份。
- 生成 Bearer token。
- 生成 Authorization headers。
- 校验 userId/adminId 格式。
- 提供 localStorage 读写函数。

默认身份：

```ts
{
  userId: 'dev-user-001',
  role: 'user',
  displayName: '开发用户'
}
```

管理员身份示例：

```ts
{
  userId: 'dev-admin-001',
  role: 'admin',
  displayName: '开发管理员'
}
```

## API 改造

修改 `src/api/payment.ts`：

- `createOrder(request, authSession)`
- `getOrder(orderId, authSession)`
- `getUserOrders(userId, authSession)`
- 新增 `refundOrder(orderId, authSession)`

所有接口统一调用 `createAuthHeaders(authSession)`。

## 支付服务改造

修改 `src/services/paymentService.ts`：

- `initiatePayment(authSession, productId, channel)`
- `pollPaymentStatus(orderId, authSession, interval, maxAttempts)`

支付 hook 后续可基于 auth session 传入当前身份。

## UI 集成

当前项目主要会员中心逻辑仍在 `App.tsx` 使用本地订单服务。开发阶段先在 App 中建立当前登录态：

- 初始化 `authSession`。
- 顶部状态显示当前身份。
- 管理后台按钮仅管理员可直接进入；普通用户点击时切换/提示可后续补 UI。

由于 UI 文件较大，本轮优先完成底层 Auth Session 与订单 API 请求联动，避免一次性重构主界面。

## 安全策略

- dev token 仅用于开发阶段。
- userId 仅允许字母、数字、下划线和短横线，长度 1-64。
- 管理员 token 使用 `dev-admin:<userId>`。
- 普通用户 token 使用 `dev-user:<userId>`。
- 生成 header 前必须校验 session。

## 测试计划

1. 默认 session 生成正确。
2. 用户 token 生成正确。
3. 管理员 token 生成正确。
4. 非法 userId 拒绝生成 header。
5. `createOrder` 携带 Authorization header。
6. `getOrder` 携带 Authorization header。
7. `getUserOrders` 携带 Authorization header。
8. `refundOrder` 使用 POST 且携带 Authorization header。
9. `initiatePayment` 把 session 传入 `createOrder`。
10. `pollPaymentStatus` 把 session 传入 `getOrder`。

## 影响范围

主要影响：

- `src/auth/devAuthSession.ts`
- `src/auth/devAuthSession.test.ts`
- `src/api/payment.ts`
- `src/api/payment.test.ts`
- `src/services/paymentService.ts`
- `src/services/paymentService.test.ts`
- `src/hooks/usePayment.ts`
- `src/hooks/usePayment.test.ts`

可能影响：

- `src/components/payment/PaymentModal.tsx`
- `src/components/payment/PaymentModal.test.tsx`

## 自检

- 无 TBD/TODO。
- 范围聚焦开发态登录态和订单 API 鉴权联动。
- 不引入真实账号系统，避免过度设计。
- dev token 模块独立，后续可替换 JWT。
