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

    if (body.page && !/^\/[a-zA-Z0-9_\-\/]*$/.test(body.page)) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: '无效的页面路径参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const serviceClient = createServiceClient()

    const today = new Date().toISOString().split('T')[0]

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

    const todayLogsList = Array.isArray(todayLogs)
      ? todayLogs.filter(
          (l): l is { id: string; metadata: { templateId: string; status: string } } =>
            typeof l?.id === 'string' && typeof l?.metadata?.templateId === 'string'
        )
      : []

    const templateSends = todayLogsList.filter(
      (l) => l.metadata.templateId === body.templateId
    ).length

    if (templateSends > DAILY_LIMIT_PER_TEMPLATE) {
      if (pendingLogId) {
        await serviceClient.from('behavior_logs').delete().eq('id', pendingLogId)
      }
      return withCors(new Response(
        JSON.stringify({ success: false, error: '该模板今日发送已达上限' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const globalSends = todayLogsList.length
    if (globalSends > GLOBAL_DAILY_LIMIT) {
      if (pendingLogId) {
        await serviceClient.from('behavior_logs').delete().eq('id', pendingLogId)
      }
      return withCors(new Response(
        JSON.stringify({ success: false, error: '今日消息发送已达上限' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    const wechatAppId = Deno.env.get('WECHAT_APP_ID')
    const wechatAppSecret = Deno.env.get('WECHAT_APP_SECRET')

    if (!wechatAppId || !wechatAppSecret) {
      if (pendingLogId) {
        await serviceClient.from('behavior_logs').delete().eq('id', pendingLogId)
      }
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
      if (pendingLogId) {
        await serviceClient.from('behavior_logs').delete().eq('id', pendingLogId)
      }
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

    const openid = (userProfile as { openid: string } | null)?.openid
    if (!openid) {
      if (pendingLogId) {
        await serviceClient.from('behavior_logs').delete().eq('id', pendingLogId)
      }
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
