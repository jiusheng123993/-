# P1 Analytics补全 + 安全关键测试 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补全10个缺失页面的分析埋点，添加分享/付费墙结果追踪，补齐4个安全关键组件的测试覆盖。

**Architecture:** 复用已有 analyticsService + useAnalytics Hook，在缺失页面添加埋点。为 EmergencyAlert、AnxietyIntervention、emotionStore、useAnxietyDetection 添加测试。

**Tech Stack:** Taro, React, Vitest, @testing-library/react

---

## Task 1: Login + Onboarding 页面埋点

**Files:**
- Modify: `src/pages/login/index.tsx`
- Modify: `src/pagesUser/onboarding/index.tsx`

### Login page changes:
1. Add import: `import { useAnalytics } from '../../hooks/useAnalytics'`
2. Add: `const { trackPageView, trackEvent } = useAnalytics()`
3. Add useEffect: `trackPageView('login')`
4. Track `login_success` on successful login
5. Track `login_failure` on failed login

### Onboarding page changes:
1. Add import: `import { useAnalytics } from '../../hooks/useAnalytics'`
2. Add: `const { trackPageView, trackEvent } = useAnalytics()`
3. Add useEffect: `trackPageView('onboarding')`
4. Track `onboarding_complete` when onboarding finishes
5. Track `onboarding_step_view` with step index on each slide change

---

## Task 2: Member + Mine 页面埋点

**Files:**
- Modify: `src/pages/member/index.tsx`
- Modify: `src/pages/mine/index.tsx`

### Member page changes:
1. Add import: `import { useAnalytics } from '../../hooks/useAnalytics'`
2. Add: `const { trackPageView, trackEvent } = useAnalytics()`
3. Add useEffect: `trackPageView('member')`
4. Track `subscribe_attempt` when subscribe button clicked
5. Track `subscribe_success` on successful subscription
6. Track `subscribe_cancel` on cancellation
7. Track `restore_purchase` on restore

### Mine page changes:
1. Add import: `import { useAnalytics } from '../../hooks/useAnalytics'`
2. Add: `const { trackPageView, trackEvent } = useAnalytics()`
3. Add useEffect: `trackPageView('mine')`
4. Track `navigate_member` when member button clicked
5. Track `navigate_invite` when invite button clicked
6. Track `logout` when logout clicked

---

## Task 3: Pet Profile + 剩余页面埋点

**Files:**
- Modify: `src/pages/pet-profile/index.tsx`
- Modify: `src/pagesPet/add/index.tsx`
- Modify: `src/pagesPet/edit/index.tsx`
- Modify: `src/pagesPet/avatar-customize/index.tsx`
- Modify: `src/pagesUser/settings/index.tsx`
- Modify: `src/pagesUser/invite/index.tsx`

### Pet profile changes:
1. Add useAnalytics import + trackPageView('pet_profile')
2. Track `mark_deceased` when PetDeceasedModal confirmed
3. Track `delete_pet` when pet deleted

### Add-pet page: trackPageView('add_pet')
### Edit-pet page: trackPageView('edit_pet')
### Avatar-customize: trackPageView('avatar_customize') + trackEvent('show_paywall') when limit reached
### Settings: trackPageView('settings')
### Invite: trackPageView('invite')

---

## Task 4: 分享 + 付费墙结果追踪

**Files:**
- Modify: `src/pagesPet/food-query/index.tsx`
- Modify: `src/pagesPet/trends/index.tsx`
- Modify: `src/pagesPet/vaccine/index.tsx`
- Modify: `src/pages/index/index.tsx`
- Modify: `src/pagesPet/checkin/index.tsx`

### Share tracking:
Add `trackEvent('share_card', { cardType, petId })` to each share confirm callback:
- food-query: FoodShareCard share → trackEvent('share_card', { cardType: 'food' })
- trends: HealthTrendShareCard share → trackEvent('share_card', { cardType: 'health_trend' })
- vaccine: VaccineShareCard share → trackEvent('share_card', { cardType: 'vaccine' })
- home: AchievementShareCard share → trackEvent('share_card', { cardType: 'achievement' })
- checkin: AchievementShareCard share → trackEvent('share_card', { cardType: 'achievement' })

### Paywall outcome tracking:
Add `trackEvent('paywall_dismiss')` to PaywallPopup onClose callback on each page that uses it.

---

## Task 5: EmergencyAlert 组件测试

**Files:**
- Create: `src/components/EmergencyAlert/__tests__/index.test.tsx`

Test cases:
1. Renders emergency message
2. Renders hospital button
3. Calls onFindHospital when hospital button clicked
4. Calls onDismiss when dismiss button clicked

---

## Task 6: AnxietyIntervention 组件测试

**Files:**
- Create: `src/components/__tests__/AnxietyIntervention.test.tsx`

Test cases:
1. Renders intervention message
2. Renders action button
3. Calls onAction when action button clicked
4. Calls onDismiss when dismiss clicked

---

## Task 7: emotionStore 测试

**Files:**
- Create: `src/stores/__tests__/emotionStore.test.ts`

Test cases:
1. checkSickAnxiety creates intervention with correct type
2. checkNewOwnerAnxiety creates intervention with correct type
3. checkGrief creates intervention with requiresCrisisReferral=true
4. dismissIntervention clears activeIntervention
5. respondToIntervention clears activeIntervention

---

## Task 8: useAnxietyDetection Hook 测试

**Files:**
- Create: `src/hooks/__tests__/useAnxietyDetection.test.ts`

Test cases:
1. Returns shouldShowIntervention boolean
2. Returns interventionType
3. Returns dismiss function
4. Returns respond function

---

## Task 9: 全量验证 + 看板更新

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp" && npx vitest run --reporter=verbose`
Expected: All tests pass

Update board and project memory.