# 会员中心后端订单 API 联动与组件拆分设计

## 背景

当前项目已经完成后端订单、退款、支付接口，后端订单接口也已加入 Bearer Token 鉴权。前端也已经拥有开发态登录态系统，可以生成 `dev-user` 和 `dev-admin` token 并在 API 层携带 Authorization header。

但 App 主界面中的会员中心仍然有部分逻辑直接调用本地内存订单服务：

```ts
orderService.createOrder(...)
orderService.markAsRefunded(...)
```

这会导致前端会员购买、订单查询、退款与后端鉴权订单系统脱节。与此同时，`App.tsx` 已经承载大量会员中心 UI 和业务逻辑，继续在主文件中堆叠异步订单状态会进一步降低可维护性。

因此，本模块采用方案 C：把会员中心订单相关逻辑拆成独立组件，并把购买、退款、订单列表全部切到后端 API。

## 目标

1. 将会员中心主 UI 从 `App.tsx` 拆分到独立组件。
2. 会员中心订单列表改为调用后端 `getUserOrders(userId, authSession)`。
3. 会员购买改为调用后端 `createOrder(request, authSession)`。
4. 退款改为调用后端 `refundOrder(orderId, authSession)`。
5. 保留现有会员中心能力：套餐展示、试用、优惠券、订单详情、退款入口、管理后台入口。
6. 增加异步加载态和错误态，避免后端不可用时白屏或静默失败。
7. 保持后续接入真实 JWT 时改动集中在 auth/API 层。

## 非目标

1. 不重写整站 UI。
2. 不引入新的 UI 组件库。
3. 不改变后端订单状态机。
4. 不在本轮实现真实支付渠道回调。
5. 不把权益服务完全迁移到后端数据库。
6. 不移除当前本地 entitlement/quota 体系，只让订单链路优先走后端。

## 推荐架构

新增一个聚焦组件：

```text
src/components/membership/MembershipCenterModal.tsx
```

职责：

- 渲染会员中心弹窗。
- 接收当前 `authSession`、产品列表、权益状态、试用/优惠券数据和业务回调。
- 内部管理远程订单列表、订单详情选择、订单 loading/error 状态。
- 调用 `src/api/payment.ts` 中的后端订单 API。

`App.tsx` 保留职责：

- 维护全局主题、persona、workspace、authSession。
- 控制会员中心打开/关闭。
- 提供本地 entitlement 服务给会员中心判断权益。
- 提供试用、优惠券、邀请等仍然本地化的开发阶段功能。

API 层保持职责：

- `createOrder(request, authSession)`
- `getUserOrders(userId, authSession)`
- `refundOrder(orderId, authSession)`
- 统一携带 Authorization header。

## 数据流

### 打开会员中心

```text
App
→ setIsMembershipOpen(true)
→ MembershipCenterModal mount/open
→ getUserOrders(authSession.userId, authSession)
→ setRemoteOrders
```

### 创建订单

```text
用户点击套餐购买
→ MembershipCenterModal.handlePayment(channel)
→ createOrder({ userId: authSession.userId, productId, channel }, authSession)
→ 后端返回 orderId/paymentParams
→ 展示订单创建成功提示
→ refreshOrders()
```

### 退款

```text
用户打开订单详情
→ 点击申请退款
→ refundOrder(orderId, authSession)
→ 后端校验订单归属和状态
→ 返回 refunded 订单
→ refreshOrders()
→ 更新详情弹窗
```

## 组件接口设计

`MembershipCenterModal` props：

```ts
interface MembershipCenterModalProps {
  isOpen: boolean
  authSession: DevAuthSession
  currentTier: { level: string; label: string; color: string }
  totalQuota: number
  quotaStatus: ReturnType<typeof aiQuotaProvider.getQuotaStatus>
  products: Product[]
  userTrials: TrialState[]
  userCoupons: CouponState[]
  inviteRewards: InviteRewardState[]
  onClose: () => void
  onOpenAdmin: () => void
  onStartTrial: (trialCode: string, durationDays: number) => void
  onRedeemCoupon: (code: string) => void
}
```

为避免一次性过度泛化，试用、优惠券、邀请奖励仍由 App 管理，会员中心组件只负责展示和触发回调。

## 订单展示模型

后端订单类型来自 `OrderDetailResponse`。前端展示需要使用以下字段：

- `id` 或 `orderId`
- `productId`
- `amount`
- `channel`
- `status`
- `createdAt`
- `paidAt`
- `channelTradeNo`

由于历史本地订单使用 `Order` 类型，后端响应可能命名略有差异，本轮会新增一个轻量归一化函数：

```ts
function normalizeOrderForDisplay(order: OrderDetailResponse): DisplayOrder
```

该函数只在会员中心组件内部使用，不污染服务层。

## 异步状态

会员中心组件内部新增：

```ts
const [orders, setOrders] = useState<DisplayOrder[]>([])
const [isOrdersLoading, setIsOrdersLoading] = useState(false)
const [ordersError, setOrdersError] = useState<string | null>(null)
const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false)
const [isRefundSubmitting, setIsRefundSubmitting] = useState(false)
```

行为：

- 订单加载中：显示“正在加载订单…”
- 订单加载失败：显示“订单加载失败，可稍后重试”并提供刷新按钮
- 创建订单中：支付按钮禁用
- 退款中：退款按钮禁用
- 后端不可用：显示 alert 和错误区，不让页面崩溃

## 错误处理

1. `401 Unauthorized`：提示“登录态失效，请切换开发身份后重试”。
2. `403 Forbidden`：提示“当前身份无权访问该订单”。
3. `404 Order not found`：提示“订单不存在或已被清理”。
4. 网络错误：提示“后端服务不可用，请确认 npm run server 已启动”。

## 测试计划

新增或更新测试：

1. `MembershipCenterModal` 打开时调用 `getUserOrders`。
2. 订单加载成功后展示订单列表。
3. 订单加载失败时展示错误和刷新按钮。
4. 点击购买调用 `createOrder`，并传入 `authSession`。
5. 创建订单成功后刷新订单列表。
6. 点击退款调用 `refundOrder`，并传入 `authSession`。
7. 非 paid 订单不显示退款按钮。
8. App 顶层可以渲染拆分后的会员中心入口。

## 迁移步骤

1. 新建 `MembershipCenterModal.tsx`，先复制并收敛 App 中会员中心相关 UI。
2. 在组件内部接入后端订单 API。
3. App 删除原会员中心大块 JSX，改为渲染 `MembershipCenterModal`。
4. App 保留 trial/coupon/admin/auth 状态。
5. 补齐测试。
6. 跑 lint/test/build。

## 风险与缓解

### 风险 1：App.tsx 过大，搬迁 JSX 容易遗漏状态

缓解：先只搬会员中心弹窗内逻辑，不拆主布局和其他模块。

### 风险 2：后端服务未启动导致前端订单加载失败

缓解：订单区域显示错误和刷新按钮，不影响会员套餐展示。

### 风险 3：后端订单响应和本地订单类型不完全一致

缓解：组件内部用 `normalizeOrderForDisplay` 做展示归一化。

### 风险 4：现有本地权益仍和后端订单不同步

缓解：本轮只迁移订单链路；权益发放仍保留原本本地逻辑，后续可接后端 payment callback 和 entitlement API。

## 自检

- 无 TBD/TODO。
- 范围聚焦会员中心组件拆分和订单后端 API 联动。
- 不引入新 UI 库。
- 不改变后端订单状态机。
- 保留现有会员中心试用、优惠券、邀请、套餐展示、订单详情和退款入口。

### 安全依赖说明

> 本模块依赖后端鉴权与支付安全体系，详细安全审查见以下文档：
> - `docs/superpowers/specs/2026-06-01-auth-permission-design.md`（鉴权权限模块设计）
> - `docs/superpowers/specs/2026-06-01-payment-system-design.md`（支付流程接入设计）

- 所有订单 API 调用必须携带有效的 Authorization header（由 `authSession` 生成）
- 前端不应绕过鉴权直接调用支付回调路由（`/api/payment/*/callback`）
- 生产环境必须替换 dev token 为真实 JWT，JWT 密钥禁止硬编码（P0 风险）
- 订单归属校验由后端 `canAccessUserResource` 中间件保证，前端不应信任客户端传入的 userId
- 支付金额由后端根据 productId 从 ProductCatalog 查询，前端不应自行计算金额
