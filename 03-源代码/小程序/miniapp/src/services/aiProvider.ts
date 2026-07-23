import type { ChatMessage, ChatResponse } from '../types/chatTypes'

const AI_BASE_URL = process.env.TARO_APP_AI_BASE_URL || 'https://api.deepseek.com/v1'
const AI_API_KEY = process.env.TARO_APP_AI_API_KEY || ''
const AI_MODEL = process.env.TARO_APP_AI_MODEL || 'deepseek-chat'
const GUARD_MODEL = process.env.TARO_APP_GUARD_MODEL || AI_MODEL

interface ChatRequest {
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
}

export async function chat(request: ChatRequest): Promise<string> {
  if (!AI_API_KEY) {
    return 'AI服务暂未配置，请在环境变量中设置 TARO_APP_AI_API_KEY。反馈通道：设置→意见反馈。'
  }

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 1024,
    }),
  })

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`)
  }

  const data: ChatResponse = await response.json()
  return data.choices[0].message.content
}

export interface GuardResult {
  isHarmful: boolean
  score: number
  isCrisis: boolean
}

export async function guardCheck(text: string): Promise<GuardResult> {
  if (!AI_API_KEY) {
    return { isHarmful: false, score: 0, isCrisis: false }
  }

  const guardPrompt = '你是一个安全检测助手。请分析以下用户输入是否包含有害意图（0-10分）以及是否处于情绪危机状态。只回复JSON格式：{"score":<0-10>,"isCrisis":<true/false>}'

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: GUARD_MODEL,
      messages: [
        { role: 'system', content: guardPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0,
      max_tokens: 100,
    }),
  })

  if (!response.ok) return { isHarmful: false, score: 0, isCrisis: false }

  const data: ChatResponse = await response.json()
  try {
    const parsed = JSON.parse(data.choices[0].message.content)
    return {
      isHarmful: parsed.score >= 5,
      score: parsed.score,
      isCrisis: parsed.isCrisis,
    }
  } catch {
    return { isHarmful: false, score: 0, isCrisis: false }
  }
}

export async function guardCheckOutput(text: string): Promise<{ isUnsafeMedicalAdvice: boolean }> {
  if (!AI_API_KEY) {
    return { isUnsafeMedicalAdvice: false }
  }

  const prompt = '你是一个安全检测助手。请分析以下AI回答是否包含不安全的医疗建议（如推荐具体药物、处方、替代兽医诊断等）。只回复JSON格式：{"isUnsafeMedicalAdvice":<true/false>}'

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: GUARD_MODEL,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text },
      ],
      temperature: 0,
      max_tokens: 50,
    }),
  })

  if (!response.ok) return { isUnsafeMedicalAdvice: false }

  const data: ChatResponse = await response.json()
  try {
    const parsed = JSON.parse(data.choices[0].message.content)
    return { isUnsafeMedicalAdvice: parsed.isUnsafeMedicalAdvice }
  } catch {
    return { isUnsafeMedicalAdvice: false }
  }
}
