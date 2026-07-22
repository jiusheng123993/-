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
    await request.json()

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
      .select('id, expires_at, tier, status, started_at')
      .eq('user_id', userId)
      .single()

    if (memberError && memberError.code !== 'PGRST116') {
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

    const referralIds = (referrals ?? []).map((r: { id: string }) => r.id)
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
