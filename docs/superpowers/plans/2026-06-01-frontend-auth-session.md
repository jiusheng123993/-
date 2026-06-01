# 前端开发态登录态系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为前端支付/订单 API 增加开发态登录态、角色 token 与 Authorization header 注入。

**Architecture:** 新增独立 `src/auth/devAuthSession.ts` 管理开发态身份与 token。API 层只接收 session 并生成请求头，支付服务与 hook 传递 session，不在业务代码里散落 token 拼接。

**Tech Stack:** TypeScript, React, Vite, Vitest, Fetch API.

---

## File Structure

- Create: `src/auth/devAuthSession.ts`：开发态身份、token、headers、localStorage 读写。
- Create: `src/auth/devAuthSession.test.ts`：覆盖 token/header/session 校验。
- Modify: `src/api/payment.ts`：订单 API 接收 session 并注入 Authorization。
- Modify: `src/api/payment.test.ts`：验证请求头。
- Modify: `src/services/paymentService.ts`：支付服务传递 session。
- Modify: `src/services/paymentService.test.ts`：验证 session 传递。
- Modify: `src/hooks/usePayment.ts`：从 userId 升级为 authSession。
- Modify: `src/hooks/usePayment.test.ts`：更新 hook 参数测试。

---

### Task 1: Dev Auth Session

- [ ] Create `src/auth/devAuthSession.ts` with role/session/token/header/localStorage helpers.
- [ ] Create `src/auth/devAuthSession.test.ts` covering user token, admin token, invalid id, storage fallback.
- [ ] Run `npm run test -- src/auth/devAuthSession.test.ts`.
- [ ] Commit `feat(auth): add frontend dev auth session`.

### Task 2: Payment API Authorization

- [ ] Modify `src/api/payment.ts` to accept `DevAuthSession` for create/get/list/refund APIs.
- [ ] Update `src/api/payment.test.ts` to assert Authorization headers.
- [ ] Run `npm run test -- src/api/payment.test.ts`.
- [ ] Commit `fix(api): attach auth headers to order requests`.

### Task 3: Payment Service / Hook Integration

- [ ] Modify `src/services/paymentService.ts` to accept session in `initiatePayment` and `pollPaymentStatus`.
- [ ] Modify `src/hooks/usePayment.ts` to accept `DevAuthSession | undefined` and pass it through.
- [ ] Update related tests.
- [ ] Run `npm run test -- src/services/paymentService.test.ts src/hooks/usePayment.test.ts src/components/payment/PaymentModal.test.tsx`.
- [ ] Commit `fix(payment): use auth session in payment flow`.

### Task 4: Full Verification

- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Start server on a non-conflicting port if needed.
- [ ] Smoke test authorized and unauthorized order creation.

## Self-Review

- Spec coverage: token generation、headers、API 注入、支付服务传递、测试均覆盖。
- Placeholder scan: no placeholders.
- Type consistency: `DevAuthSession` 在 auth/api/service/hook 一致使用。
