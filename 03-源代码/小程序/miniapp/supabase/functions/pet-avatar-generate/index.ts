import { serve } from 'https://esm.sh/@supabase/functions-js/edge-runtime?bundle'

export interface SeedreamGenerateParams {
  prompt: string
  imageSize?: string
  negativePrompt?: string
  style?: string
}

export interface SeedreamGenerateResult {
  success: boolean
  imageUrl?: string
  error?: string
}

const SEEDREAM_API_URL = 'https://api.volcengineapi.com/v1/visual/generation'

async function callSeedreamApi(params: SeedreamGenerateParams): Promise<SeedreamGenerateResult> {
  const apiKey = process.env.SEEDREAM_API_KEY
  if (!apiKey) {
    return { success: false, error: 'Seedream API key not configured' }
  }

  try {
    const response = await fetch(SEEDREAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: params.style === 'realistic' ? 'seedream-3-0-t2i-250415' : 'seedream-lite-t2i-250915',
        prompt: params.prompt,
        size: params.imageSize || '1024x1024',
        negative_prompt: params.negativePrompt || '',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `Seedream API error: ${response.status} - ${errorText}` }
    }

    const data = await response.json()

    if (data.data && data.data[0] && data.data[0].url) {
      return { success: true, imageUrl: data.data[0].url }
    }

    return { success: false, error: 'No image URL in response' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const params = await req.json() as SeedreamGenerateParams

    if (!params.prompt) {
      return new Response(JSON.stringify({ success: false, error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const result = await callSeedreamApi(params)

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})