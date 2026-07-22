# Supabase Edge Functions + 数据库补全 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补全缺失的数据库表定义，实现 3 个 Supabase Edge Functions 代理服务，部署 RLS 策略，使前端 3 个后端代理 API 调用有真实后端支撑。

**Architecture:** 前端 Taro 小程序通过 SupabaseClient 直接操作 REST API（已实现），3 个需要服务端逻辑的敏感操作通过 Supabase Edge Functions（Deno runtime）代理执行。Edge Function 使用 JWT 验证用户身份，通过 service_role key 操作数据库绕过 RLS，实现业务逻辑后返回结果。数据库补全 3 张缺失表（invite_codes、referral_records、share_records）并应用 RLS。

**Tech Stack:** Supabase Edge Functions (Deno), PostgreSQL RLS, TypeScript, Taro 3.x

---

## 关键发现

1. **init.sql 缺失 3 张表**：`invite_codes`、`referral_records`、`share_records` — shareService.ts 直接操作这些表但数据库 schema 中没有定义
2. **3 个后端代理 API 未实现**：
   - `POST /api/share/grant-reward` — shareService.ts:147-206，奖励邀请会员
   - `POST /api/pet-avatar/generate` — seedreamAdapter.ts:51-89，AI 头像生成
   - `POST /api/subscribe/send` — subscribeService.ts:159-204，微信订阅消息
3. **RLS 策略未部署**：init.sql 定义了完整 RLS 但未执行到 Supabase
4. **前端 grantShareReward 逻辑问题**：前端先查 getShareStats 判断是否达标，再调后端发奖，但后端应独立验证（防绕过）

## API 契约

### share/grant-reward
- **请求**: `POST /api/share/grant-reward`，body: `{ userId: string }`，header: `Authorization: Bearer <token>`
- **响应 200**: `{ success: true, rewardType: 'membership_days', rewardValue: 7 }` 或 `{ success: false, error: string }`
- **业务逻辑**: 验证 userId 对应的 referral_records 中 rewardGranted=false 的记录数 >= SHARE_REWARD_INVITES(3)，则将 memberships 表的 expires_at 延长 7 天，并标记 referral_records.rewardGranted=true

### pet-avatar/generate
- **请求**: `POST /api/pet-avatar/generate`，body: `SeedreamGenerateParams { prompt, imageSize?, negativePrompt?, style? }`，header: `Authorization: Bearer <token>`
- **响应 200**: `{ success: true, imageUrl: string }` 或 `{ success: false, error: string }`
- **响应 402**: `{ success: false, error: '生成次数已用完' }` — 配额耗尽
- **响应 429**: `{ success: false, error: '请求过于频繁' }` — 限流
- **业务逻辑**: 验证用户身份，检查 avatar_generations 配额（免费用户每日 1 次，会员每日 5 次），调用 Seedream API 生成图片，上传到 pet-avatars 存储桶，记录 avatar_generations

### subscribe/send
- **请求**: `POST /api/subscribe/send`，body: `{ templateId: string, data: SubscribeMessageData, page?: string }`，header: `Authorization: Bearer <token>`
- **响应 200**: `true`（boolean）
- **业务逻辑**: 验证用户身份，验证 templateId 在白名单中，调用微信订阅消息 API 发送，记录发送日志

## 文件结构

```
04-数据库/supabase/
├── init.sql                          # 修改：追加 3 张缺失表 + RLS
├── seed.sql                          # 新建：测试数据种子
└── functions/                        # 新建：Edge Functions 目录
    ├── _shared/                      # 新建：共享工具
    │   ├── cors.ts                   # CORS 头处理
    │   ├── auth.ts                   # JWT 验证 + 用户身份解析
    │   └── supabase.ts               # Supabase 客户端初始化
    ├── share-grant-reward/           # 新建：分享奖励
    │   └── index.ts
    ├── pet-avatar-generate/          # 新建：AI 头像生成
    │   └── index.ts
    └── subscribe-send/              # 新建：订阅消息
        └── index.ts
```

---

### Task 1: 补全 init.sql 缺失的 3 张表 + RLS

**Files:**
- Modify: `04-数据库/supabase/init.sql`

- [ ] **Step 1: 在 init.sql 末尾追加 invite_codes 表定义**

在 init.sql 的 `-- 初始数据：知识库版本记录` 之前追加：

```sql
-- ============================================================
-- 18. invite_codes（邀请码）
-- ============================================================
CREATE TABLE IF NOT EXISTS invite_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  use_count       SMALLINT NOT NULL DEFAULT 0,
  max_use_count   SMALLINT NOT NULL DEFAULT 50,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_user ON invite_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- ============================================================
-- 19. share_records（分享记录）
-- ============================================================
CREATE TABLE IF NOT EXISTS share_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_type       TEXT NOT NULL CHECK (card_type IN ('food', 'health_trend', 'vaccine', 'achievement')),
  pet_id          TEXT REFERENCES pet_profiles(id) ON DELETE SET NULL,
  platform        TEXT NOT NULL DEFAULT 'wechat',
  invite_code     TEXT REFERENCES invite_codes(code) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_records_user ON share_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_records_type ON share_records(user_id, card_type);

-- ============================================================
-- 20. referral_records（推荐记录）
-- ============================================================
CREATE TABLE IF NOT EXISTS referral_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code     TEXT NOT NULL REFERENCES invite_codes(code),
  reward_granted  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(inviter_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_records_inviter ON referral_records(inviter_id);
CREATE INDEX IF NOT EXISTS idx_referral_records_invitee ON referral_records(invitee_id);
```

- [ ] **Step 2: 追加 3 张表的 RLS 策略**

在 init.sql 的 RLS 策略部分（`SELECT public.apply_user_rls('avatar_generations');` 之后）追加：

```sql
SELECT public.apply_user_rls('invite_codes');
SELECT public.apply_user_rls('share_records');
SELECT public.apply_user_rls('referral_records');
```

- [ ] **Step 3: 验证 SQL 语法**

检查所有表定义、约束、索引、RLS 策略的 SQL 语法正确性。确保：
- 外键引用的表已先定义（users → invite_codes → share_records/referral_records）
- CHECK 约束的枚举值与前端 shareTypes.ts 的 ShareCardType 一致
- RLS 策略使用 `apply_user_rls()` 辅助函数

---

### Task 2: 创建 Edge Functions 共享工具层

**Files:**
- Create: `04-数据库/supabase/functions/_shared/cors.ts`
- Create: `04-数据库/supabase/functions/_shared/auth.ts`
- Create: `04-数据库/supabase/functions/_shared/supabase.ts`

- [ ] **Step 1: 创建 CORS 处理模块**

```typescript
// 04-数据库/supabase/functions/_shared/cors.ts
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function corsResponse(): Response {
  return new Response('ok', { headers: CORS_HEADERS })
}

export function withCors(response: Response): Response {
  const headers = new Headers(response.headers)
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    headers.set(key, value)
  })
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
```

- [ ] **Step 2: 创建 JWT 验证 + 用户身份解析模块**

```typescript
// 04-数据库/supabase/functions/_shared/auth.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AuthResult {
  userId: string
  supabase: ReturnType<typeof createClient>
}

export async function verifyAuth(request: Request): Promise<AuthResult | Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ success: false, error: '未提供认证信息' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const token = authHeader.replace('Bearer ', '')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return new Response(
      JSON.stringify({ success: false, error: '认证无效或已过期' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return { userId: user.id, supabase }
}

export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, serviceRoleKey)
}
```

- [ ] **Step 3: 创建 Supabase 服务端客户端模块**

```typescript
// 04-数据库/supabase/functions/_shared/supabase.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, serviceRoleKey)
}

export function createUserClient(token: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}
```

---

### Task 3: 实现 share-grant-reward Edge Function

**Files:**
- Create: `04-数据库/supabase/functions/share-grant-reward/index.ts`

- [ ] **Step 1: 实现 share-grant-reward Edge Function**

```typescript
// 04-数据库/supabase/functions/share-grant-reward/index.ts
import { corsResponse, withCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { createServiceClient } from '../_shared/supabase.ts'

const SHARE_REWARD_INVITES = 3
const REWARD_DAYS = 7

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return corsResponse()

  const authResult = await verifyAuth(request)
  if (authResult instanceof Response) return withCors(authResult)

  const { userId } = authResult

  try {
    const body = await request.json()
    const requestUserId = body.userId

    if (requestUserId !== userId) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: '用户身份不匹配' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const serviceClient = createServiceClient()

    const { data: referrals, error: refError } = await serviceClient
      .from('referral_records')
      .select('id, reward_granted')
      .eq('inviter_id', userId)
      .eq('reward_granted', false)

    if (refError) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: '查询推荐记录失败' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const ungrantedCount = referrals?.length ?? 0

    if (ungrantedCount < SHARE_REWARD_INVITES) {
      return withCors(new Response(
        JSON.stringify({
          success: false,
          error: `还需邀请${SHARE_REWARD_INVITES - ungrantedCount}位好友即可获得奖励`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const { data: membership, error: memberError } = await serviceClient
      .from('memberships')
      .select('id, expires_at, tier, status')
      .eq('user_id', userId)
      .single()

    if (memberError) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: '查询会员信息失败' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const now = new Date()
    let newExpiresAt: Date

    if (membership && membership.status === 'active' && membership.expires_at) {
      const currentExpiry = new Date(membership.expires_at)
      newExpiresAt = currentExpiry > now
        ? new Date(currentExpiry.getTime() + REWARD_DAYS * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + REWARD_DAYS * 24 * 60 * 60 * 1000)
    } else {
      newExpiresAt = new Date(now.getTime() + REWARD_DAYS * 24 * 60 * 60 * 1000)
    }

    if (membership) {
      const { error: updateError } = await serviceClient
        .from('memberships')
        .update({
          tier: 'member',
          status: 'active',
          expires_at: newExpiresAt.toISOString(),
          started_at: membership.started_at || now.toISOString(),
        })
        .eq('id', membership.id)

      if (updateError) {
        return withCors(new Response(
          JSON.stringify({ success: false, error: '更新会员信息失败' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ))
      }
    } else {
      const { error: insertError } = await serviceClient
        .from('memberships')
        .insert({
          user_id: userId,
          tier: 'member',
          status: 'active',
          expires_at: newExpiresAt.toISOString(),
          started_at: now.toISOString(),
        })

      if (insertError) {
        return withCors(new Response(
          JSON.stringify({ success: false, error: '创建会员记录失败' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ))
      }
    }

    const referralIds = referrals!.map((r: { id: string }) => r.id)
    await serviceClient
      .from('referral_records')
      .update({ reward_granted: true })
      .in('id', referralIds)

    return withCors(new Response(
      JSON.stringify({
        success: true,
        rewardType: 'membership_days',
        rewardValue: REWARD_DAYS,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ))
  } catch {
    return withCors(new Response(
      JSON.stringify({ success: false, error: '服务器内部错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    ))
  }
})
```

---

### Task 4: 实现 pet-avatar-generate Edge Function

**Files:**
- Create: `04-数据库/supabase/functions/pet-avatar-generate/index.ts`

- [ ] **Step 1: 实现 pet-avatar-generate Edge Function**

```typescript
// 04-数据库/supabase/functions/pet-avatar-generate/index.ts
import { corsResponse, withCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { createServiceClient } from '../_shared/supabase.ts'

const FREE_DAILY_LIMIT = 1
const MEMBER_DAILY_LIMIT = 5

interface GenerateRequest {
  prompt: string
  imageSize?: string
  negativePrompt?: string
  style?: string
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return corsResponse()

  const authResult = await verifyAuth(request)
  if (authResult instanceof Response) return withCors(authResult)

  const { userId } = authResult

  try {
    const body: GenerateRequest = await request.json()

    if (!body.prompt || body.prompt.trim().length === 0) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: 'prompt 参数不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    if (body.prompt.length > 500) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: 'prompt 长度不能超过500字符' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const serviceClient = createServiceClient()

    const { data: membership } = await serviceClient
      .from('memberships')
      .select('tier, status, expires_at')
      .eq('user_id', userId)
      .single()

    const isMember = membership?.tier === 'member' && membership?.status === 'active' &&
      (!membership.expires_at || new Date(membership.expires_at) > new Date())

    const today = new Date().toISOString().split('T')[0]
    const { data: todayGenerations } = await serviceClient
      .from('avatar_generations')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', today)

    const todayCount = (todayGenerations as unknown as { id: string }[])?.length ?? 0
    const dailyLimit = isMember ? MEMBER_DAILY_LIMIT : FREE_DAILY_LIMIT

    if (todayCount >= dailyLimit) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: '生成次数已用完' }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const seedreamApiKey = Deno.env.get('SEEDREAM_API_KEY')
    const seedreamApiUrl = Deno.env.get('SEEDREAM_API_URL') || 'https://visual.volcengineapi.com'

    if (!seedreamApiKey) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: 'AI 图片生成服务未配置' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ))
    }

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

    const generationId = (generation as { id: string })?.id

    try {
      const apiResponse = await fetch(`${seedreamApiUrl}/api/v1/image/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${seedreamApiKey}`,
        },
        body: JSON.stringify({
          prompt: body.prompt,
          image_size: body.imageSize || 'square',
          negative_prompt: body.negativePrompt || '低质量, 模糊, 变形, 多余肢体, 文字, 水印',
          style: body.style || 'cartoon',
        }),
      })

      if (apiResponse.status === 429) {
        await serviceClient
          .from('avatar_generations')
          .update({ status: 'failed', error: 'Rate limited' })
          .eq('id', generationId)

        return withCors(new Response(
          JSON.stringify({ success: false, error: '请求过于频繁，请稍后再试' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        ))
      }

      if (!apiResponse.ok) {
        await serviceClient
          .from('avatar_generations')
          .update({ status: 'failed', error: `API error: ${apiResponse.status}` })
          .eq('id', generationId)

        return withCors(new Response(
          JSON.stringify({ success: false, error: `生成失败: ${apiResponse.status}` }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ))
      }

      const result = await apiResponse.json()
      const imageUrl = result.data?.image_url || result.image_url || result.url

      if (!imageUrl) {
        await serviceClient
          .from('avatar_generations')
          .update({ status: 'failed', error: 'No image URL in response' })
          .eq('id', generationId)

        return withCors(new Response(
          JSON.stringify({ success: false, error: '生成失败：未获取到图片' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ))
      }

      await serviceClient
        .from('avatar_generations')
        .update({
          status: 'completed',
          result_url: imageUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('id', generationId)

      return withCors(new Response(
        JSON.stringify({ success: true, imageUrl }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ))
    } catch (apiError) {
      await serviceClient
        .from('avatar_generations')
        .update({
          status: 'failed',
          error: apiError instanceof Error ? apiError.message : 'Unknown error',
        })
        .eq('id', generationId)

      return withCors(new Response(
        JSON.stringify({ success: false, error: 'AI 服务调用失败' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ))
    }
  } catch {
    return withCors(new Response(
      JSON.stringify({ success: false, error: '服务器内部错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    ))
  }
})
```

---

### Task 5: 实现 subscribe-send Edge Function

**Files:**
- Create: `04-数据库/supabase/functions/subscribe-send/index.ts`

- [ ] **Step 1: 实现 subscribe-send Edge Function**

```typescript
// 04-数据库/supabase/functions/subscribe-send/index.ts
import { corsResponse, withCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { createServiceClient } from '../_shared/supabase.ts'

const VALID_TEMPLATE_IDS = new Set([
  Deno.env.get('FOLLOWUP_TEMPLATE_ID') || '',
  Deno.env.get('CARE_PLAN_REMINDER_TEMPLATE_ID') || '',
  Deno.env.get('HEALTH_CHECKIN_TEMPLATE_ID') || '',
].filter(Boolean))

const DAILY_LIMIT_PER_TEMPLATE = 3
const GLOBAL_DAILY_LIMIT = 10

interface SendRequest {
  templateId: string
  data: Record<string, { value: string }>
  page?: string
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return corsResponse()

  const authResult = await verifyAuth(request)
  if (authResult instanceof Response) return withCors(authResult)

  const { userId } = authResult

  try {
    const body: SendRequest = await request.json()

    if (!body.templateId) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: 'templateId 不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    if (!VALID_TEMPLATE_IDS.has(body.templateId)) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: '无效的模板 ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    if (!body.data || Object.keys(body.data).length === 0) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: '消息数据不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const serviceClient = createServiceClient()

    const today = new Date().toISOString().split('T')[0]
    const { data: todayLogs } = await serviceClient
      .from('behavior_logs')
      .select('id, metadata')
      .eq('user_id', userId)
      .eq('action', 'subscribe_send')
      .gte('created_at', today)

    const todayLogsList = todayLogs as { id: string; metadata: { templateId: string } }[] | null

    const templateSends = todayLogsList?.filter(
      (l) => l.metadata?.templateId === body.templateId
    ).length ?? 0

    if (templateSends >= DAILY_LIMIT_PER_TEMPLATE) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: '该模板今日发送已达上限' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const globalSends = todayLogsList?.length ?? 0
    if (globalSends >= GLOBAL_DAILY_LIMIT) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: '今日消息发送已达上限' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const wechatAppId = Deno.env.get('WECHAT_APP_ID')
    const wechatAppSecret = Deno.env.get('WECHAT_APP_SECRET')

    if (!wechatAppId || !wechatAppSecret) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: '微信服务未配置' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const tokenRes = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wechatAppId}&secret=${wechatAppSecret}`
    )
    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: '获取微信 access_token 失败' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const { data: userProfile } = await serviceClient
      .from('users')
      .select('openid')
      .eq('id', userId)
      .single()

    const openid = (userProfile as { openid: string })?.openid
    if (!openid) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: '用户 openid 不存在' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const messagePayload: Record<string, unknown> = {
      touser: openid,
      template_id: body.templateId,
      data: body.data,
    }

    if (body.page) {
      messagePayload.page = body.page
    }

    const sendRes = await fetch('https://api.weixin.qq.com/cgi-bin/message/subscribe/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messagePayload),
    })

    const sendResult = await sendRes.json()

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

    if (sendResult.errcode !== 0) {
      return withCors(new Response(
        JSON.stringify({
          success: false,
          error: sendResult.errmsg || '微信消息发送失败',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    return withCors(new Response(
      JSON.stringify(true),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ))
  } catch {
    return withCors(new Response(
      JSON.stringify({ success: false, error: '服务器内部错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    ))
  }
})
```

---

### Task 6: 更新前端服务层指向 Edge Function URL

**Files:**
- Modify: `03-源代码/小程序/miniapp/src/services/shareService.ts`
- Modify: `03-源代码/小程序/miniapp/src/engines/petAvatar/seedreamAdapter.ts`
- Modify: `03-源代码/小程序/miniapp/src/services/subscribeService.ts`
- Modify: `03-源代码/小程序/miniapp/src/config/supabase.ts`

- [ ] **Step 1: 在 supabase.ts 配置中添加 Edge Function URL 解析**

在 `supabase.ts` 的 `EnvConfig` 接口中添加 `edgeFunctionBaseUrl` 字段：

```typescript
interface EnvConfig {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
  edgeFunctionBaseUrl: string;
  useMock: boolean;
}
```

在 ENV 对象中添加：

```typescript
development: {
  // ...existing fields
  edgeFunctionBaseUrl: (process.env as Record<string, string | undefined>).TARO_APP_SUPABASE_URL || 'http://localhost:54321',
},
production: {
  // ...existing fields
  edgeFunctionBaseUrl: (process.env as Record<string, string | undefined>).TARO_APP_SUPABASE_URL || '',
},
```

导出辅助函数：

```typescript
export function getEdgeFunctionUrl(functionName: string): string {
  const base = currentEnv.edgeFunctionBaseUrl || currentEnv.supabaseUrl
  return `${base}/functions/v1/${functionName}`
}
```

- [ ] **Step 2: 更新 shareService.ts 的 grantShareReward 使用 Edge Function**

将 `grantShareReward` 函数中的 API 调用改为：

```typescript
import { getEdgeFunctionUrl } from '../config/supabase';

// 在 grantShareReward 函数中替换 API 调用部分：
const token = Taro.getStorageSync('xhh_token');
const res = await Taro.request({
  url: getEdgeFunctionUrl('share-grant-reward'),
  method: 'POST',
  data: { userId },
  header: {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  },
});
```

- [ ] **Step 3: 更新 seedreamAdapter.ts 使用 Edge Function**

将 `generateRealImage` 方法中的 API 调用改为：

```typescript
import { getEdgeFunctionUrl } from '../../config/supabase';

// 在 generateRealImage 方法中替换：
const res = await Taro.request({
  url: getEdgeFunctionUrl('pet-avatar-generate'),
  method: 'POST',
  data: apiParams,
  header: {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  },
  timeout: 30000,
});
```

同样更新 `generateAchievementImage` 方法中的 API 调用。

- [ ] **Step 4: 更新 subscribeService.ts 使用 Edge Function**

将 `sendSubscribeMessage` 函数中的 API 调用改为：

```typescript
import { getEdgeFunctionUrl } from '../config/supabase';

// 在 sendSubscribeMessage 函数中替换：
const token = Taro.getStorageSync('xhh_token');
const res = await Taro.request({
  url: getEdgeFunctionUrl('subscribe-send'),
  method: 'POST',
  data: { templateId, data, page },
  header: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

- [ ] **Step 5: 运行测试确保前端改动不破坏现有测试**

Run: `cd e:\星寰海\03-源代码\小程序\miniapp && npx vitest run`
Expected: ALL TESTS PASS

---

### Task 7: 修复前端 grantShareReward 的安全逻辑

**Files:**
- Modify: `03-源代码/小程序/miniapp/src/services/shareService.ts`

- [ ] **Step 1: 简化前端 grantShareReward，移除前端资格判断**

当前前端先查 getShareStats 判断是否达标再调后端，但后端应独立验证。前端应直接调后端，由后端返回是否达标：

```typescript
export async function grantShareReward(userId: string): Promise<ShareRewardResult> {
  try {
    const token = Taro.getStorageSync('xhh_token');
    const res = await Taro.request({
      url: getEdgeFunctionUrl('share-grant-reward'),
      method: 'POST',
      data: { userId },
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (res.statusCode === 200 && res.data?.success) {
      return {
        rewardGranted: true,
        rewardType: res.data.rewardType || 'membership_days',
        rewardValue: res.data.rewardValue || 7,
        message: `邀请${SHARE_REWARD_INVITES}位好友，奖励7天会员`,
      };
    }

    if (res.statusCode === 200 && res.data?.error) {
      return {
        rewardGranted: false,
        rewardType: 'none',
        rewardValue: 0,
        message: res.data.error,
      };
    }

    return {
      rewardGranted: false,
      rewardType: 'none',
      rewardValue: 0,
      message: '奖励发放失败',
    };
  } catch {
    return {
      rewardGranted: false,
      rewardType: 'none',
      rewardValue: 0,
      message: '网络异常，请稍后重试',
    };
  }
}
```

- [ ] **Step 2: 更新 shareService 测试**

更新 `shareService.test.ts` 中 `grantShareReward` 相关测试，移除对 getShareStats 的依赖，改为直接 mock Taro.request 返回后端响应。

- [ ] **Step 3: 运行测试**

Run: `cd e:\星寰海\03-源代码\小程序\miniapp && npx vitest run`
Expected: ALL TESTS PASS

---

### Task 8. **Task 8: 更新看板和项目记忆**

- [ ] **Step 1: 更新看板**

Run: `E:\update-board.bat "E:\星寰海" "P0-1 Edge Functions + 数据库补全" "完成 3 个 Edge Functions、补全 3 张缺失表、更新前端服务层指向 Edge Function URL" "04-数据库/supabase/init.sql,04-数据库/supabase/functions/,03-源代码/小程序/miniapp/src/services/shareService.ts,03-源代码/小程序/miniapp/src/engines/petAvatar/seedreamAdapter.ts,03-源代码/小程序/miniapp/src/services/subscribeService.ts,03-源代码/小程序/miniapp/src/config/supabase.ts"`

- [ ] **Step 2: 同步项目记忆**

Run: `node "E:\sync-memory-to-board.cjs" "E:\星寰海"`

- [ ] **Step 3: 写入项目记忆（安全审查结果）**

使用 local-project-memory MCP 记录：
- type=risk, importance=high: 后端安全边界表（6 大方面 × 5 个问题）
- type=risk, importance=high: 3 个 Edge Function 的权限设计表
- type=decision, importance=high: grantShareReward 安全逻辑从客户端移到服务端

---

## 自检清单

1. **Spec 覆盖**: 3 个后端代理 API 全部有对应 Edge Function 实现 ✓
2. **Placeholder 扫描**: 无 TBD/TODO/实现后补充 ✓
3. **类型一致性**: ShareRewardResult、SeedreamGenerateParams、SubscribeMessageData 与前端类型定义一致 ✓
4. **安全审查**: JWT 验证、userId 身份校验、配额限制、频率控制全部覆盖 ✓
5. **RLS 覆盖**: 3 张新表全部应用 apply_user_rls() ✓
6. **前端兼容**: Edge Function URL 通过 getEdgeFunctionUrl() 动态解析，mock 模式不受影响 ✓
