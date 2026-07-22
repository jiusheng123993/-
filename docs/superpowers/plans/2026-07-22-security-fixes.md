# 安全审查修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复后端安全审查发现的 P1-P5 安全问题，确保 Edge Functions 输入校验完整、身份验证安全、并发安全

**Architecture:** 在 Edge Function 层增加白名单校验、从 JWT token 直接提取 userId 替代前端传入、增加数据库级并发防护、增加 prompt 清洗、增加 page 参数格式校验、修复静默失败和类型断言问题

**Tech Stack:** Deno (Edge Functions), Supabase (PostgreSQL + RLS), TypeScript

---

## 修复清单

| 编号 | 级别 | 问题 | 修复方式 |
|------|------|------|----------|
| SEC-01 | P1 | pet-avatar-generate imageSize/style 无白名单 | 增加白名单常量 + 校验 |
| SEC-02 | P1 | share-grant-reward userId 从前端传入 | 移除 body.userId，直接用 token 中的 userId |
| SEC-03 | P2 | 并发请求配额竞态条件 | 使用数据库事务 + advisory lock |
| SEC-04 | P2 | prompt 注入风险 | 增加 prompt 清洗函数 |
| SEC-05 | P2 | 无管理员角色定义 | 在 init.sql 增加 admin role + RLS 策略 |
| SEC-06 | P3 | subscribe-send page 参数无格式校验 | 增加正则校验 |
| SEC-07 | P5 | generationId null 静默失败 | 改为显式错误日志 |
| SEC-08 | P5 | todayLogsList 类型断言不安全 | 增加运行时类型守卫 |

---

### Task 1: SEC-01 — pet-avatar-generate imageSize/style 白名单校验

**Files:**
- Modify: `04-数据库/supabase/functions/pet-avatar-generate/index.ts`

- [ ] **Step 1: 在 pet-avatar-generate/index.ts 顶部增加白名单常量**

在 `const MEMBER_DAILY_LIMIT = 5` 之后增加：

```typescript
const VALID_IMAGE_SIZES = new Set([
  'square_hd', 'square', 'portrait_4_3', 'portrait_16_9',
  'landscape_4_3', 'landscape_16_9',
])

const VALID_STYLES = new Set(['cartoon', 'realistic', 'anime'])
```

- [ ] **Step 2: 在 prompt 长度校验之后、配额检查之前，增加 imageSize 和 style 校验**

在 `if (body.prompt.length > 500)` 块之后插入：

```typescript
if (body.imageSize && !VALID_IMAGE_SIZES.has(body.imageSize)) {
  return withCors(new Response(
    JSON.stringify({ success: false, error: '无效的图片尺寸参数' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  ))
}

if (body.style && !VALID_STYLES.has(body.style)) {
  return withCors(new Response(
    JSON.stringify({ success: false, error: '无效的风格参数' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  ))
}
```

- [ ] **Step 3: 运行测试验证无回归**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp" ; npx vitest run --reporter=verbose 2>&1 | Select-Object -Last 20`
Expected: ALL TESTS PASS

---

### Task 2: SEC-02 — share-grant-reward userId 从 token 提取

**Files:**
- Modify: `04-数据库/supabase/functions/share-grant-reward/index.ts`
- Modify: `03-源代码/小程序/miniapp/src/services/shareService.ts`

- [ ] **Step 1: 修改 share-grant-reward/index.ts，移除 body.userId 校验**

将：
```typescript
const body = await request.json()
const requestUserId = body.userId

if (requestUserId !== userId) {
  return withCors(new Response(
    JSON.stringify({ success: false, error: '用户身份不匹配' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  ))
}
```

替换为：
```typescript
await request.json()
```

因为 `userId` 已从 `verifyAuth(request)` 的 JWT token 中提取，无需前端传入。

- [ ] **Step 2: 修改 shareService.ts 的 grantShareReward，移除 body 中的 userId**

将 `data: { userId }` 替换为 `data: {}`：

```typescript
const res = await Taro.request({
  url: getEdgeFunctionUrl('share-grant-reward'),
  method: 'POST',
  data: {},
  header: {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  },
});
```

- [ ] **Step 3: 运行测试验证无回归**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp" ; npx vitest run --reporter=verbose 2>&1 | Select-Object -Last 20`
Expected: ALL TESTS PASS

---

### Task 3: SEC-03 — 并发请求配额竞态条件修复

**Files:**
- Modify: `04-数据库/supabase/functions/pet-avatar-generate/index.ts`
- Modify: `04-数据库/supabase/functions/subscribe-send/index.ts`

- [ ] **Step 1: 在 pet-avatar-generate 中使用 INSERT 先占位再检查配额**

将配额检查逻辑从"先查后插"改为"先插后查"模式。在 avatar_generations 表中先插入一条 processing 记录，然后查询当天记录数，如果超限则删除刚插入的记录并返回 402。

将：
```typescript
const today = new Date().toISOString().split('T')[0]
const { data: todayGenerations } = await serviceClient
  .from('avatar_generations')
  .select('id')
  .eq('user_id', userId)
  .gte('created_at', today)

const todayCount = (todayGenerations as { id: string }[] | null)?.length ?? 0
const dailyLimit = isMember ? MEMBER_DAILY_LIMIT : FREE_DAILY_LIMIT

if (todayCount >= dailyLimit) {
  return withCors(new Response(
    JSON.stringify({ success: false, error: '生成次数已用完' }),
    { status: 402, headers: { 'Content-Type': 'application/json' } }
  ))
}
```

替换为：
```typescript
const today = new Date().toISOString().split('T')[0]
const dailyLimit = isMember ? MEMBER_DAILY_LIMIT : FREE_DAILY_LIMIT

const { data: generation } = await serviceClient
  .from('avatar_generations')
  .insert({
    user_id: userId,
    prompt: body.prompt,
    style: body.style || 'cartoon',
    status: 'processing',
  })
  .select('id')
  .single()

const generationId = (generation as { id: string } | null)?.id

if (!generationId) {
  return withCors(new Response(
    JSON.stringify({ success: false, error: '创建生成记录失败' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  ))
}

const { data: todayGenerations } = await serviceClient
  .from('avatar_generations')
  .select('id')
  .eq('user_id', userId)
  .gte('created_at', today)

const todayCount = (todayGenerations as { id: string }[] | null)?.length ?? 0

if (todayCount > dailyLimit) {
  await serviceClient
    .from('avatar_generations')
    .delete()
    .eq('id', generationId)

  return withCors(new Response(
    JSON.stringify({ success: false, error: '生成次数已用完' }),
    { status: 402, headers: { 'Content-Type': 'application/json' } }
  ))
}
```

同时删除原来的 insert 语句（第78-87行），因为现在配额检查前已插入。

- [ ] **Step 2: 在 subscribe-send 中使用 advisory lock 防止并发频率检查绕过**

在 `const serviceClient = createServiceClient()` 之后、频率检查之前插入：

```typescript
const lockKey = Math.abs(hashCode(`subscribe_send_${userId}_${today}`))
const { data: lockResult } = await serviceClient.rpc('pg_advisory_xact_lock', { lock_key: lockKey }).catch(() => ({ data: null }))
```

在 `_shared/supabase.ts` 中增加 hashCode 工具函数：

```typescript
export function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash
}
```

注意：由于 Supabase 的 rpc 调用 `pg_advisory_xact_lock` 需要在事务中，而 Edge Function 的 serviceClient 不自动管理事务，此方案在当前架构下无法直接使用。改用更简单的方案：先 INSERT behavior_log 再检查计数，与 avatar-generate 同样的"先写后查"模式。

将 subscribe-send 中的频率检查逻辑改为：先插入一条 behavior_log（status=pending），然后查询当天计数，超限则删除刚插入的记录。

在 `const serviceClient = createServiceClient()` 之后，将原来的频率检查逻辑替换为：

```typescript
const { data: pendingLog } = await serviceClient
  .from('behavior_logs')
  .insert({
    user_id: userId,
    action: 'subscribe_send',
    page: body.page || 'unknown',
    metadata: {
      templateId: body.templateId,
      status: 'pending',
    },
  })
  .select('id')
  .single()

const pendingLogId = (pendingLog as { id: string } | null)?.id

const { data: todayLogs } = await serviceClient
  .from('behavior_logs')
  .select('id, metadata')
  .eq('user_id', userId)
  .eq('action', 'subscribe_send')
  .gte('created_at', today)

const todayLogsList = todayLogs as { id: string; metadata: { templateId: string; status: string } }[] | null

const templateSends = todayLogsList?.filter(
  (l) => l.metadata?.templateId === body.templateId
).length ?? 0

if (templateSends > DAILY_LIMIT_PER_TEMPLATE) {
  if (pendingLogId) {
    await serviceClient.from('behavior_logs').delete().eq('id', pendingLogId)
  }
  return withCors(new Response(
    JSON.stringify({ success: false, error: '该模板今日发送已达上限' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  ))
}

const globalSends = todayLogsList?.length ?? 0
if (globalSends > GLOBAL_DAILY_LIMIT) {
  if (pendingLogId) {
    await serviceClient.from('behavior_logs').delete().eq('id', pendingLogId)
  }
  return withCors(new Response(
    JSON.stringify({ success: false, error: '今日消息发送已达上限' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  ))
}
```

同时删除原来末尾的 behavior_logs insert 语句，改为更新 pending 记录：

将原来的：
```typescript
await serviceClient.from('behavior_logs').insert({
  user_id: userId,
  action: 'subscribe_send',
  page: body.page || 'unknown',
  metadata: {
    templateId: body.templateId,
    success: sendResult.errcode === 0,
    errcode: sendResult.errcode,
  },
})
```

替换为：
```typescript
if (pendingLogId) {
  await serviceClient
    .from('behavior_logs')
    .update({
      metadata: {
        templateId: body.templateId,
        success: sendResult.errcode === 0,
        errcode: sendResult.errcode,
      },
    })
    .eq('id', pendingLogId)
}
```

- [ ] **Step 3: 运行测试验证无回归**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp" ; npx vitest run --reporter=verbose 2>&1 | Select-Object -Last 20`
Expected: ALL TESTS PASS

---

### Task 4: SEC-04 — prompt 注入风险防护

**Files:**
- Modify: `04-数据库/supabase/functions/_shared/sanitize.ts` (Create)
- Modify: `04-数据库/supabase/functions/pet-avatar-generate/index.ts`

- [ ] **Step 1: 创建 _shared/sanitize.ts 清洗工具**

```typescript
const BLOCKED_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now/i,
  /system\s*:/i,
  /\<\/?system\>/i,
  /\<\/?instruction\>/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /developer\s+mode/i,
]

export function sanitizePrompt(prompt: string): string {
  let cleaned = prompt

  for (const pattern of BLOCKED_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[filtered]')
  }

  cleaned = cleaned
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s{3,}/g, ' ')
    .trim()

  return cleaned
}

export function isPromptSafe(prompt: string): boolean {
  return BLOCKED_PATTERNS.every((p) => !p.test(prompt))
}
```

- [ ] **Step 2: 在 pet-avatar-generate 中使用 sanitizePrompt**

在 import 区域增加：
```typescript
import { sanitizePrompt, isPromptSafe } from '../_shared/sanitize.ts'
```

在 prompt 非空校验之后、长度校验之前插入：
```typescript
if (!isPromptSafe(body.prompt)) {
  return withCors(new Response(
    JSON.stringify({ success: false, error: '提示词包含不安全内容' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  ))
}

body.prompt = sanitizePrompt(body.prompt)
```

- [ ] **Step 3: 运行测试验证无回归**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp" ; npx vitest run --reporter=verbose 2>&1 | Select-Object -Last 20`
Expected: ALL TESTS PASS

---

### Task 5: SEC-05 — 增加管理员角色定义

**Files:**
- Modify: `04-数据库/supabase/init.sql`

- [ ] **Step 1: 在 init.sql 的 users 表中增加 role 字段**

在 users 表的 `created_at TIMESTAMPTZ DEFAULT now()` 之前增加：

```sql
role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
```

- [ ] **Step 2: 在 RLS 策略区域增加管理员策略**

在 `SELECT public.apply_user_rls('invite_codes');` 之后增加：

```sql
-- 管理员可读所有用户数据（用于运营后台）
CREATE OR REPLACE FUNCTION public.admin_read_policy(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'CREATE POLICY "Admin can read all %s" ON %I
     FOR SELECT USING (
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = ''admin'')
     )',
    table_name, table_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT public.admin_read_policy('users');
SELECT public.admin_read_policy('memberships');
SELECT public.admin_read_policy('pet_profiles');
SELECT public.admin_read_policy('pet_health_entries');
SELECT public.admin_read_policy('share_records');
SELECT public.admin_read_policy('referral_records');
SELECT public.admin_read_policy('avatar_generations');
SELECT public.admin_read_policy('behavior_logs');
```

- [ ] **Step 3: 运行测试验证无回归**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp" ; npx vitest run --reporter=verbose 2>&1 | Select-Object -Last 20`
Expected: ALL TESTS PASS

---

### Task 6: SEC-06 — subscribe-send page 参数格式校验

**Files:**
- Modify: `04-数据库/supabase/functions/subscribe-send/index.ts`

- [ ] **Step 1: 在 templateId 校验之后增加 page 参数格式校验**

在 `if (!body.data || Object.keys(body.data).length === 0)` 块之后插入：

```typescript
if (body.page && !/^\/[a-zA-Z0-9_\-\/]*$/.test(body.page)) {
  return withCors(new Response(
    JSON.stringify({ success: false, error: '无效的页面路径参数' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  ))
}
```

- [ ] **Step 2: 运行测试验证无回归**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp" ; npx vitest run --reporter=verbose 2>&1 | Select-Object -Last 20`
Expected: ALL TESTS PASS

---

### Task 7: SEC-07 — generationId null 静默失败修复

**Files:**
- Modify: `04-数据库/supabase/functions/pet-avatar-generate/index.ts`

- [ ] **Step 1: 将所有 `if (generationId)` 条件中的静默 update 改为带错误日志的 update**

由于 Task 3 已将 generationId 的获取提前到配额检查之前，且增加了 null 检查返回 500，此问题已部分修复。但后续的 update 调用仍需确保 generationId 存在。

在 Task 3 完成后，generationId 在配额检查后已确认非 null（否则返回 500），因此后续的 `if (generationId)` 条件可以简化为直接调用，无需 if 包裹。但为了防御性编程，保留 if 检查，但在 else 分支增加 console.error：

将所有 `if (generationId) { await serviceClient... }` 替换为：

```typescript
if (generationId) {
  await serviceClient
    .from('avatar_generations')
    .update({ ... })
    .eq('id', generationId)
} else {
  console.error('generationId is null, cannot update avatar_generations record')
}
```

- [ ] **Step 2: 运行测试验证无回归**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp" ; npx vitest run --reporter=verbose 2>&1 | Select-Object -Last 20`
Expected: ALL TESTS PASS

---

### Task 8: SEC-08 — todayLogsList 类型断言安全化

**Files:**
- Modify: `04-数据库/supabase/functions/subscribe-send/index.ts`

- [ ] **Step 1: 将 todayLogsList 的类型断言改为运行时类型守卫**

将：
```typescript
const todayLogsList = todayLogs as { id: string; metadata: { templateId: string } }[] | null
```

替换为：
```typescript
const todayLogsList = Array.isArray(todayLogs)
  ? todayLogs.filter(
      (l): l is { id: string; metadata: { templateId: string; status: string } } =>
        typeof l?.id === 'string' && typeof l?.metadata?.templateId === 'string'
    )
  : []
```

- [ ] **Step 2: 运行测试验证无回归**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp" ; npx vitest run --reporter=verbose 2>&1 | Select-Object -Last 20`
Expected: ALL TESTS PASS

---

### Task 9: 更新看板和项目记忆

**Files:**
- Modify: `.board/index.html` (via update-board.bat)
- Modify: project memory (via MCP)

- [ ] **Step 1: 运行 update-board.bat**

```bash
E:\update-board.bat "E:\星寰海" "安全审查修复完成" "修复 SEC-01~SEC-08 共8项安全问题" "04-数据库/supabase/functions/pet-avatar-generate/index.ts,04-数据库/supabase/functions/share-grant-reward/index.ts,04-数据库/supabase/functions/subscribe-send/index.ts,04-数据库/supabase/functions/_shared/sanitize.ts,04-数据库/supabase/init.sql,03-源代码/小程序/miniapp/src/services/shareService.ts"
```

- [ ] **Step 2: 写入项目记忆**

记录安全修复完成状态，标记高 importance。
