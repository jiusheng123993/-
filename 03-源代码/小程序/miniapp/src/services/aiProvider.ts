import Taro from '@tarojs/taro'
import type { ChatMessage, ChatResponse } from '../types/chatTypes'
import { CONFIG } from '../config'
import { storage } from '../utils/storage'

interface ChatRequest {
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  petId?: string
}

export async function chat(request: ChatRequest): Promise<string> {
  const token = storage.getToken()
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
      const body = res.data as { success: boolean; data: { content: string } }
      if (body.success && body.data?.content) {
        return body.data.content
      }
      console.warn('[AIProvider] AI 返回非成功状态:', body)
    } else {
      console.error('[AIProvider] AI 请求失败，状态码:', res.statusCode, res.data)
    }
    return 'AI服务暂不可用，请稍后再试'
  } catch (err) {
    console.error('[AIProvider] AI 请求网络异常:', err)
    return '网络异常，请检查网络连接后重试'
  }
}

export interface GuardResult {
  isHarmful: boolean
  score: number
  isCrisis: boolean
}

export async function guardCheck(text: string): Promise<GuardResult> {
  const token = storage.getToken()
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
  const token = storage.getToken()
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
