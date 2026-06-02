# 会员体系实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建完整的会员体系，包括学习会员、Agent 智能体会员、Agent PLUS 会员，以及配套的权益系统、支付模块、试用机制

**Architecture:** 采用 Entitlement / Provider / Adapter 架构，新增任何付费类型只需新增 Provider 和 EntitlementCode，不修改业务层代码

**Tech Stack:** TypeScript, React, IndexedDB, 微信支付 / Apple IAP / 支付宝

---

## 阶段划分

由于模块较多，分为 4 个阶段实施：

- **Phase 1**: 核心权益系统（P0 模块）— ✅ 已完成
- **Phase 2**: 会员订阅与支付（P0 模块）— ✅ 已完成
- **Phase 3**: Agent 会员扩展与 UI（P0 模块）— ✅ 已完成
- **Phase 4**: 试用/优惠券/管理后台（P1 模块）— ✅ 已完成

---

## Phase 1: 核心权益系统 ✅ 已完成

### Task 1: Entitlement Core ✅

**Files:**
- `src/entitlement/entitlementTypes.ts` — 权益数据契约
- `src/entitlement/entitlementService.ts` — 权益查询/消耗/授予 API
- `src/entitlement/entitlementStorage.ts` — 权益持久化存储

**已完成内容：**
- [x] EntitlementCode 类型定义（study, agent, agent_plus, space, ai_quota_*, theme_*, avatar_*, memory_sync, evolution_*, agent_tool_call 等）
- [x] Entitlement / UserEntitlements 接口
- [x] EntitlementService（has / consume / grant / revoke / list）
- [x] EntitlementStorage（IndexedDB 持久化）
- [x] 完整测试覆盖

### Task 2: Product Catalog ✅

**Files:**
- `src/entitlement/productTypes.ts` — 商品数据契约
- `src/entitlement/productCatalog.ts` — 商品配置与查询

**已完成内容：**
- [x] Product 接口（id, name, type, period, price, grants, channel, active）
- [x] 全量商品配置（study_monthly/quarterly/yearly, agent_monthly/yearly, agent_plus_monthly/yearly, ai_pack_100）
- [x] getActiveProducts / getProductById 查询
- [x] 完整测试覆盖

### Task 3: Order Service ✅

**Files:**
- `src/entitlement/orderTypes.ts` — 订单数据契约
- `src/entitlement/orderService.ts` — 订单 CRUD

**已完成内容：**
- [x] Order 接口（id, userId, productId, amount, channel, status, channelTradeNo, rawReceipt）
- [x] OrderService（createOrder / markAsPaid / markAsRefunded / getOrdersByUser）
- [x] PersistentOrderService（IndexedDB 持久化）
- [x] 完整测试覆盖

---

## Phase 2: 会员订阅与支付 ✅ 已完成

### Task 4: Subscription Provider ✅

**Files:**
- `src/entitlement/subscriptionProvider.ts` — 订阅生命周期管理

**已完成内容：**
- [x] activate（激活订阅 + 授予权益）
- [x] renew（续费 + 延长权益）
- [x] deactivate（取消订阅 + 回收权益）
- [x] getStatus（查询订阅状态）
- [x] 完整测试覆盖

### Task 5: AI Quota Provider ✅

**Files:**
- `src/entitlement/aiQuotaProvider.ts` — 四池额度管理

**已完成内容：**
- [x] 四池额度模型（free / study / agent / pack）
- [x] 消耗顺序：free → study → agent → pack
- [x] consume / getQuotaStatus
- [x] PLUS 不限量标记（ai_unlimited）
- [x] 完整测试覆盖

### Task 6: Payment Adapters ✅

**Files:**
- `src/entitlement/paymentAdapters.ts` — 支付渠道适配器
- `src/api/payment.ts` — 支付 API
- `src/server/routes/payment.ts` — 服务端支付路由
- `src/server/services/paymentCallbackService.ts` — 支付回调

**已完成内容：**
- [x] PaymentAdapter 接口（createPayment / verifyCallback / queryOrder）
- [x] WechatPayAdapter / AlipayAdapter / AppleIAPAdapter
- [x] 服务端支付路由与回调处理
- [x] 完整测试覆盖

### Task 7: Payment Hooks & Modal ✅

**Files:**
- `src/hooks/usePayment.ts` — 支付流程 Hook
- `src/hooks/usePaymentStatus.ts` — 支付状态轮询 Hook
- `src/components/payment/PaymentModal.tsx` — 支付弹窗组件
- `src/components/payment/PaymentModal.module.css` — 支付弹窗样式

**已完成内容：**
- [x] usePayment（startPayment / reset / status / orderId / error）
- [x] usePaymentStatus（轮询支付状态）
- [x] PaymentModal（渠道选择 / 处理中 / 成功 / 失败 四态切换）
- [x] 完整测试覆盖

### Task 8: Membership UI ✅

**Files:**
- `src/components/membership/MembershipPage.tsx` — 学习会员页
- `src/components/membership/AgentMembershipPage.tsx` — Agent 会员页
- `src/components/membership/MembershipPage.module.css` — 样式
- `src/hooks/useMembership.ts` — 会员状态 Hook

**已完成内容：**
- [x] MembershipPage（学习会员权益展示 + 产品选择 + 购买触发）
- [x] AgentMembershipPage（Agent/PLUS 权益展示 + 产品选择 + 购买触发）
- [x] useMembership（当前会员状态查询）
- [x] 完整测试覆盖

### Task 9: E2E Payment Test ✅

**Files:**
- `src/e2e/payment.test.ts` — 支付全流程端到端测试

**已完成内容：**
- [x] 完整购买流程（创建订单 → 支付 → 授予权益）
- [x] Agent 会员购买流程
- [x] Agent PLUS 会员购买流程
- [x] AI 额度包购买流程
- [x] 订阅续费流程
- [x] 订阅取消流程
- [x] 商品目录验证
- [x] 额度消耗顺序验证
- [x] 订单管理（列表/退款）

---

## Phase 3: Agent 会员扩展与 UI 🔄 进行中

### Task 10: Agent Tier Provider ✅

**Files:**
- `src/entitlement/agentTierProvider.ts` — Agent 档位解析

**已完成内容：**
- [x] getTier（解析 free / study / agent / agent_plus）
- [x] isPro（兼容旧 isPro 布尔判断）
- [x] hasPermission（权限检查：memory_system, avatar_rpm, avatar_ai_gen, agent_tool_call, self_evolution_realtime）
- [x] 完整测试覆盖

### Task 11: Avatar AI Gen Provider ✅

**Files:**
- `src/entitlement/avatarAiGenProvider.ts` — AI 3D 角色生成额度

**已完成内容：**
- [x] getRemainingQuota / consumeQuota / resetMonthlyQuota
- [x] PLUS 会员 10 次/月额度管理
- [x] 完整测试覆盖

### Task 12: Memory Sync Provider ✅

**Files:**
- `src/entitlement/memorySyncProvider.ts` — 记忆云同步权益

**已完成内容：**
- [x] canSync（是否允许云同步）
- [x] getStorageLimit（存储配额：Agent 100MB / PLUS 1GB）
- [x] 完整测试覆盖

### Task 13: One-time Purchase Provider ✅

**Files:**
- `src/entitlement/oneTimePurchaseProvider.ts` — 一次性内购

**已完成内容：**
- [x] purchase（一次性购买主题/模板/IP 角色）
- [x] hasPurchased（检查是否已购买）
- [x] 完整测试覆盖

### Task 14: Admin Console ✅

**Files:**
- `src/components/membership/AdminConsolePage.tsx` — 管理后台页面
- `src/entitlement/adminAuth.ts` — 管理员鉴权

**已完成内容：**
- [x] AdminConsolePage（商品管理 + 赠送名额 + 订单查看）
- [x] adminAuth（管理员身份校验）
- [x] 完整测试覆盖

### Task 15: Creator Service ✅

**Files:**
- `src/entitlement/creatorService.ts` — 创作者服务
- `src/entitlement/assetMarketplace.ts` — 资产市场

**已完成内容：**
- [x] CreatorService（创作者实名/上架/审核/分成）
- [x] AssetMarketplace（资产市场前台 + 购买流程）
- [x] 完整测试覆盖

### Task 16: Trial & Coupon Provider ✅

**Files:**
- `src/entitlement/trialCouponProvider.ts` — 试用与优惠券

**已完成内容：**
- [x] grantTrial（发放试用权益）
- [x] grantCoupon（发放优惠券）
- [x] hasUsedTrial（检查是否已使用试用）
- [x] 完整测试覆盖

---

## Phase 4: 支付 UI 补全与集成测试 ⏳ 待开始

### Task 17: PaymentSuccess 组件

**Files:**
- Create: `src/components/payment/PaymentSuccess.tsx`
- Create: `src/components/payment/PaymentSuccess.module.css`
- Create: `src/components/payment/PaymentSuccess.test.tsx`

- [ ] **Step 1: 创建 PaymentSuccess 独立组件**

从 PaymentModal 中提取支付成功状态为独立组件，增加更丰富的成功反馈：

```typescript
interface PaymentSuccessProps {
  productName: string
  orderId: string
  tier?: 'study' | 'agent' | 'agent_plus'
  onClose: () => void
  onViewMembership?: () => void
}
```

功能：
- 动画效果（勾选动画 + 渐入）
- 根据档位显示不同权益解锁提示
- "查看我的会员"按钮
- "完成"按钮

- [ ] **Step 2: 创建样式文件**

- [ ] **Step 3: 创建测试文件**

- [ ] **Step 4: 运行测试验证**

Run: `npm test -- --run src/components/payment/PaymentSuccess.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/components/payment/PaymentSuccess.tsx src/components/payment/PaymentSuccess.module.css src/components/payment/PaymentSuccess.test.tsx
git commit -m "feat(payment): add PaymentSuccess component with tier-aware feedback"
```

### Task 18: PaymentFailure 组件

**Files:**
- Create: `src/components/payment/PaymentFailure.tsx`
- Create: `src/components/payment/PaymentFailure.module.css`
- Create: `src/components/payment/PaymentFailure.test.tsx`

- [ ] **Step 1: 创建 PaymentFailure 独立组件**

从 PaymentModal 中提取支付失败状态为独立组件，增加更友好的错误处理：

```typescript
interface PaymentFailureProps {
  error?: string
  orderId?: string
  onRetry: () => void
  onClose: () => void
  onContactSupport?: () => void
}
```

功能：
- 错误分类展示（网络错误 / 支付取消 / 系统错误）
- 重试按钮
- 联系客服入口
- 订单号展示

- [ ] **Step 2: 创建样式文件**

- [ ] **Step 3: 创建测试文件**

- [ ] **Step 4: 运行测试验证**

Run: `npm test -- --run src/components/payment/PaymentFailure.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/components/payment/PaymentFailure.tsx src/components/payment/PaymentFailure.module.css src/components/payment/PaymentFailure.test.tsx
git commit -m "feat(payment): add PaymentFailure component with error categorization"
```

### Task 19: 重构 PaymentModal 使用独立组件

**Files:**
- Modify: `src/components/payment/PaymentModal.tsx`
- Modify: `src/components/payment/PaymentModal.test.tsx`

- [ ] **Step 1: 重构 PaymentModal**

将 PaymentModal 中的成功/失败状态渲染替换为 PaymentSuccess / PaymentFailure 组件

- [ ] **Step 2: 更新测试**

- [ ] **Step 3: 运行测试验证**

Run: `npm test -- --run src/components/payment/`

- [ ] **Step 4: Commit**

```bash
git add src/components/payment/
git commit -m "refactor(payment): extract PaymentSuccess and PaymentFailure from PaymentModal"
```

### Task 20: 支付集成测试补全

**Files:**
- Modify: `src/e2e/payment.test.ts`
- Modify: `src/hooks/usePayment.test.ts`

- [ ] **Step 1: 补充边界场景测试**

新增测试用例：
- 并发支付请求处理
- 支付超时场景
- 网络断开后恢复
- 重复支付防护
- 订单状态不一致恢复

- [ ] **Step 2: 运行完整测试**

Run: `npm test -- --run`

- [ ] **Step 3: Commit**

```bash
git add src/e2e/payment.test.ts src/hooks/usePayment.test.ts
git commit -m "test(payment): add edge case and integration tests"
```

### Task 21: 最终验证

- [ ] **Step 1: 运行 Lint**

Run: `npm run lint`

- [ ] **Step 2: 运行完整测试**

Run: `npm test -- --run`

- [ ] **Step 3: 运行构建**

Run: `npm run build`

- [ ] **Step 4: 浏览器验证**

启动 dev server，检查：
- 会员页面渲染正常
- PaymentModal 弹窗交互正常
- 支付成功/失败组件展示正常

---

## Phase 3-4 完成标准

**Phase 3 完成标准（已达成）：**
- ✅ Agent Tier Provider 完整实现
- ✅ Avatar AI Gen Provider 完整实现
- ✅ Memory Sync Provider 完整实现
- ✅ One-time Purchase Provider 完整实现
- ✅ Admin Console 完整实现
- ✅ Creator Service 完整实现
- ✅ Trial & Coupon Provider 完整实现
- ✅ 所有测试通过

**Phase 4 完成标准（待达成）：**
- [ ] PaymentSuccess 独立组件
- [ ] PaymentFailure 独立组件
- [ ] PaymentModal 重构使用独立组件
- [ ] 支付集成测试补全
- [ ] Lint / Test / Build 全部通过
- [ ] 浏览器验证通过

---

## 与设计文档对齐说明

| 设计文档 | 本计划覆盖 |
|---|---|
| `2026-06-01-monetization-and-membership-design.md` §4 Entitlement | Phase 1 ✅ |
| `2026-06-01-monetization-and-membership-design.md` §5 六大模块 | Phase 1-2 ✅ |
| `2026-06-01-monetization-and-membership-design.md` §6 AI 额度 | Phase 2 ✅ |
| `2026-06-01-monetization-and-membership-design.md` §8 冷启动 | Phase 4 (Trial/Coupon) ✅ |
| `2026-06-01-monetization-and-membership-design.md` §11 M1-M22 | Phase 1-3 ✅ |
| `2026-06-01-membership-backend-integration-design.md` | Phase 2 ✅ |
| `2026-06-01-memory-and-self-evolving-agent-design.md` §6 会员扩展 | Phase 3 ✅ |

---

## 下一步：第二阶段 AI 陪伴核心

Phase 4 完成后，进入 AI 陪伴核心开发：

1. **MemoryProfileEditorUI**（用户画像编辑器）— M20
2. **ReflectionEngine**（反思引擎）— M7
3. **EvolutionRitualUI**（进化仪式 UI）— M9

详见 `2026-06-02-memory-profile.md` 实施计划。
