/**
 * 平台适配器 - 登录模块
 * 微信小程序走 Taro.login，App 端走手机号验证码登录
 */
import Taro from '@tarojs/taro'
import { isWeapp } from './detector'

export interface LoginResult {
  code?: string
  token: string
  refreshToken: string
  user: {
    id: string
    nickname: string
    avatarUrl: string
  }
}

export interface SmsCodeResult {
  success: boolean
  message: string
}

/**
 * 获取登录凭证
 * 小程序：调用微信登录获取 code
 * App/H5：返回 null，由上层调用手机号登录
 */
export async function getLoginCode(): Promise<string | null> {
  if (isWeapp()) {
    const { code } = await Taro.login()
    return code || null
  }
  return null
}

/**
 * 发送短信验证码
 */
export async function sendSmsCode(phone: string, apiBaseUrl: string): Promise<SmsCodeResult> {
  try {
    const res = await fetch(`${apiBaseUrl}/api/auth/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const data = await res.json()
    return { success: data.success, message: data.message || '验证码已发送' }
  } catch {
    return { success: false, message: '网络异常，请重试' }
  }
}

/**
 * 手机号+验证码登录
 */
export async function loginWithPhone(
  phone: string,
  code: string,
  apiBaseUrl: string
): Promise<{ success: boolean; token?: string; refreshToken?: string; user?: any; error?: string }> {
  try {
    const res = await fetch(`${apiBaseUrl}/api/auth/login/phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    })
    const data = await res.json()
    if (data.success) {
      return { success: true, token: data.token, refreshToken: data.refreshToken, user: data.user }
    }
    return { success: false, error: data.message || '登录失败' }
  } catch {
    return { success: false, error: '网络异常，请重试' }
  }
}