/**
 * 外联服务 API
 * 处理与后端的交互（如果需要）
 */

import Taro from '@tarojs/taro'
import type { OutreachTriggerType, MoodTag } from '../data/outreachSuggestions'
import type { UserOutreachSettings, OutreachRecord } from '../utils/outreachValidator'
import { DEFAULT_USER_SETTINGS } from '../utils/outreachValidator'
import type { UserEmotionState } from '../engines/outreach/OutreachScheduler'

/** API 配置 */
const API_BASE = 'https://api.xinghuanhai.com/v1'

/** 请求头 */
function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    // 如果需要认证，添加 token
    // 'Authorization': `Bearer ${token}`
  }
}

/** 获取用户设置 */
export async function fetchUserSettings(): Promise<UserOutreachSettings> {
  try {
    const response = await fetch(`${API_BASE}/outreach/settings`, {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch settings')
    }

    const data = await response.json()
    return { ...DEFAULT_USER_SETTINGS, ...data }
  } catch (error) {
    console.warn('Failed to fetch user settings, using defaults:', error)
    return DEFAULT_USER_SETTINGS
  }
}

/** 保存用户设置 */
export async function saveUserSettings(settings: Partial<UserOutreachSettings>): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/outreach/settings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    })

    if (!response.ok) {
      throw new Error('Failed to save settings')
    }
  } catch (error) {
    console.warn('Failed to save user settings:', error)
    // 静默失败，本地存储已更新
  }
}

/** 记录外联事件 */
export async function logOutreachEvent(record: OutreachRecord): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/outreach/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(record)
    })

    if (!response.ok) {
      throw new Error('Failed to log event')
    }
  } catch (error) {
    console.warn('Failed to log outreach event:', error)
    // 静默失败，本地存储已记录
  }
}

/** 同步情绪数据到服务器 */
export async function syncEmotionData(emotion: UserEmotionState): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/outreach/sync`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ emotion, timestamp: new Date().toISOString() })
    })

    if (!response.ok) {
      throw new Error('Failed to sync emotion data')
    }
  } catch (error) {
    console.warn('Failed to sync emotion data:', error)
    // 离线模式，静默失败
  }
}

/** 检查网络状态 */
export async function checkNetworkStatus(): Promise<boolean> {
  try {
    const result = await Taro.getNetworkType()
    return result.networkType !== 'none'
  } catch {
    return false
  }
}
