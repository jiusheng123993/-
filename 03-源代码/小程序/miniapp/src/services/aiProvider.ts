import Taro from '@tarojs/taro'
import type { ChatMessage, ChatResponse } from '../types/chatTypes'
import { CONFIG } from '../config'

interface ChatRequest {
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
}

export async function chat(request: ChatRequest): Promise<string> {
  const token = Taro.getStorageSync(CONFIG.STORAGE_KEYS.TOKEN)
  try {
    const res = await Taro.request({
      url: `${CONFIG.API_BASE_URL}/api/ai/chat`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: request,
    })
    if (res.statusCode === 200) {
      const body = res.data as { reply: string }
      return body.reply
    }
    return 'AI服务暂不可用，请稍后再试'
  } catch {
    return '网络异常，请检查网络连接后重试'
  }
}

export interface GuardResult {
  isHarmful: boolean
  score: number
  isCrisis: boolean
}

export async function guardCheck(text: string): Promise<GuardResult> {
  const token = Taro.getStorageSync(CONFIG.STORAGE_KEYS.TOKEN)
  try {
    const res = await Taro.request({
      url: `${CONFIG.API_BASE_URL}/api/ai/guard`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: { text },
    })
    if (res.statusCode === 200) {
      return res.data as GuardResult
    }
    return { isHarmful: false, score: 0, isCrisis: false }
  } catch {
    return { isHarmful: false, score: 0, isCrisis: false }
  }
}

export async function guardCheckOutput(text: string): Promise<{ isUnsafeMedicalAdvice: boolean }> {
  const token = Taro.getStorageSync(CONFIG.STORAGE_KEYS.TOKEN)
  try {
    const res = await Taro.request({
      url: `${CONFIG.API_BASE_URL}/api/ai/guard/output`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: { text },
    })
    if (res.statusCode === 200) {
      return res.data as { isUnsafeMedicalAdvice: boolean }
    }
    return { isUnsafeMedicalAdvice: false }
  } catch {
    return { isUnsafeMedicalAdvice: false }
  }
}
