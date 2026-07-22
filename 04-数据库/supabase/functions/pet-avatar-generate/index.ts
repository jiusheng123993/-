import { corsResponse, withCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { sanitizePrompt, isPromptSafe } from '../_shared/sanitize.ts'

const FREE_DAILY_LIMIT = 1
const MEMBER_DAILY_LIMIT = 5

const VALID_IMAGE_SIZES = new Set([
  'square_hd', 'square', 'portrait_4_3', 'portrait_16_9',
  'landscape_4_3', 'landscape_16_9',
])

const VALID_STYLES = new Set(['cartoon', 'realistic', 'anime'])

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

    if (!isPromptSafe(body.prompt)) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: '提示词包含不安全内容' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    body.prompt = sanitizePrompt(body.prompt)

    if (body.prompt.length > 500) {
      return withCors(new Response(
        JSON.stringify({ success: false, error: 'prompt 长度不能超过500字符' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ))
    }

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

    const serviceClient = createServiceClient()

    const { data: membership } = await serviceClient
      .from('memberships')
      .select('tier, status, expires_at')
      .eq('user_id', userId)
      .single()

    const isMember = membership?.tier === 'member' && membership?.status === 'active' &&
      (!membership.expires_at || new Date(membership.expires_at) > new Date())

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

    const seedreamApiKey = Deno.env.get('SEEDREAM_API_KEY')
    const seedreamApiUrl = Deno.env.get('SEEDREAM_API_URL') || 'https://visual.volcengineapi.com'

    if (!seedreamApiKey) {
      await serviceClient
        .from('avatar_generations')
        .delete()
        .eq('id', generationId)

      return withCors(new Response(
        JSON.stringify({ success: false, error: 'AI 图片生成服务未配置' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ))
    }

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
        if (generationId) {
          await serviceClient
            .from('avatar_generations')
            .update({ status: 'failed', error: 'Rate limited' })
            .eq('id', generationId)
        } else {
          console.error('generationId is null, cannot update avatar_generations on 429')
        }

        return withCors(new Response(
          JSON.stringify({ success: false, error: '请求过于频繁，请稍后再试' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        ))
      }

      if (!apiResponse.ok) {
        if (generationId) {
          await serviceClient
            .from('avatar_generations')
            .update({ status: 'failed', error: `API error: ${apiResponse.status}` })
            .eq('id', generationId)
        } else {
          console.error('generationId is null, cannot update avatar_generations on API error')
        }

        return withCors(new Response(
          JSON.stringify({ success: false, error: `生成失败: ${apiResponse.status}` }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ))
      }

      const result = await apiResponse.json()
      const imageUrl = result.data?.image_url || result.image_url || result.url

      if (!imageUrl) {
        if (generationId) {
          await serviceClient
            .from('avatar_generations')
            .update({ status: 'failed', error: 'No image URL in response' })
            .eq('id', generationId)
        } else {
          console.error('generationId is null, cannot update avatar_generations on no imageUrl')
        }

        return withCors(new Response(
          JSON.stringify({ success: false, error: '生成失败：未获取到图片' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ))
      }

      if (generationId) {
        await serviceClient
          .from('avatar_generations')
          .update({
            status: 'completed',
            result_url: imageUrl,
            completed_at: new Date().toISOString(),
          })
          .eq('id', generationId)
      } else {
        console.error('generationId is null, cannot update avatar_generations on success')
      }

      return withCors(new Response(
        JSON.stringify({ success: true, imageUrl }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ))
    } catch (apiError) {
      if (generationId) {
        await serviceClient
          .from('avatar_generations')
          .update({
            status: 'failed',
            error: apiError instanceof Error ? apiError.message : 'Unknown error',
          })
          .eq('id', generationId)
      } else {
        console.error('generationId is null, cannot update avatar_generations on exception')
      }

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
