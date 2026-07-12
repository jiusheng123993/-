/**
 * 外联验证工具
 * 用于验证外联消息的发送条件和频率限制
 */

import type { OutreachTriggerType } from '../data/outreachSuggestions'

/** 安静时段配置（22:00-8:00） */
export const QUIET_HOURS_START = 22 // 晚上10点开始
export const QUIET_HOURS_END = 8   // 早上8点结束

/** 每日最大推送次数 */
export const DAILY_MAX_OUTREACH = 2

/** 冷却时间配置（毫秒） */
export const COOLDOWN_CONFIG: Record<OutreachTriggerType, number> = {
  morning_checkin: 24 * 60 * 60 * 1000,
  evening_reflection: 24 * 60 * 60 * 1000,
  high_intensity: 60 * 60 * 1000,
  silence_warning: 72 * 60 * 60 * 1000,
  pattern_discovery: 7 * 24 * 60 * 60 * 1000,
  followup_emergency: 24 * 60 * 60 * 1000,
  good_news: 7 * 24 * 60 * 60 * 1000,
  crisis_intervention: 0
}

/** 外联记录接口 */
export interface OutreachRecord {
  id: string
  triggerType: OutreachTriggerType
  sentAt: string
  opened?: boolean
  userResponse?: 'opened' | 'ignored' | 'replied'
}

/** 用户设置接口 */
export interface UserOutreachSettings {
  dailyLimit: number
  quietHoursEnabled: boolean
  quietHoursStart: number
  quietHoursEnd: number
  enabledTriggers: OutreachTriggerType[]
}

/** 默认用户设置 */
export const DEFAULT_USER_SETTINGS: UserOutreachSettings = {
  dailyLimit: DAILY_MAX_OUTREACH,
  quietHoursEnabled: true,
  quietHoursStart: QUIET_HOURS_START,
  quietHoursEnd: QUIET_HOURS_END,
  enabledTriggers: [
    'morning_checkin',
    'evening_reflection',
    'high_intensity',
    'silence_warning',
    'followup_emergency',
    'good_news'
  ]
}

/** 检查是否在安静时段内 */
export function isInQuietHours(hour: number, settings: UserOutreachSettings): boolean {
  if (!settings.quietHoursEnabled) return false

  const start = settings.quietHoursStart
  const end = settings.quietHoursEnd

  // 如果开始时间大于结束时间，表示跨午夜
  if (start > end) {
    return hour >= start || hour < end
  } else {
    return hour >= start && hour < end
  }
}

/** 获取今天的日期字符串（YYYY-MM-DD） */
export function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 计算今天已发送的外联数量 */
export function countTodayOutreach(records: OutreachRecord[]): number {
  const today = getTodayDateString()
  return records.filter(r => r.sentAt.startsWith(today)).length
}

/** 检查是否达到每日上限 */
export function hasReachedDailyLimit(records: OutreachRecord[], settings: UserOutreachSettings): boolean {
  return countTodayOutreach(records) >= settings.dailyLimit
}

/** 检查触发类型是否在冷却中 */
export function isTriggerInCooldown(
  triggerType: OutreachTriggerType,
  records: OutreachRecord[],
  cooldownMs: number
): boolean {
  if (cooldownMs === 0) return false

  const now = Date.now()
  for (const record of records) {
    if (record.triggerType !== triggerType) continue
    const sentTime = new Date(record.sentAt).getTime()
    if (now - sentTime < cooldownMs) {
      return true
    }
  }
  return false
}

/** 检查触发类型是否启用 */
export function isTriggerEnabled(triggerType: OutreachTriggerType, settings: UserOutreachSettings): boolean {
  return settings.enabledTriggers.includes(triggerType)
}

/** 综合验证结果 */
export interface ValidationResult {
  canSend: boolean
  reason?: string
  issues: string[]
}

/** 验证是否可以发送外联消息 */
export function validateOutreach(
  triggerType: OutreachTriggerType,
  records: OutreachRecord[],
  settings: UserOutreachSettings,
  currentHour: number
): ValidationResult {
  const issues: string[] = []

  // 1. 检查触发类型是否启用
  if (!isTriggerEnabled(triggerType, settings)) {
    return {
      canSend: false,
      reason: '该触发类型已被禁用',
      issues: ['触发类型未启用']
    }
  }

  // 2. 检查每日上限
  if (hasReachedDailyLimit(records, settings)) {
    issues.push('已达每日推送上限')
  }

  // 3. 检查安静时段
  if (isInQuietHours(currentHour, settings)) {
    issues.push('当前处于安静时段')
  }

  // 4. 检查冷却时间
  const cooldownMs = COOLDOWN_CONFIG[triggerType]
  if (isTriggerInCooldown(triggerType, records, cooldownMs)) {
    issues.push(`触发类型冷却中（${cooldownMs / 1000 / 60 / 60}小时）`)
  }

  // 5. 危机干预不受限制
  if (triggerType === 'crisis_intervention') {
    return {
      canSend: true,
      reason: '危机干预不受频率限制',
      issues: ['危机干预不受频率限制']
    }
  }

  const canSend = issues.length === 0

  return {
    canSend,
    reason: canSend ? '可以发送' : issues[0],
    issues
  }
}

/** 格式化时间为友好显示 */
export function formatTimeFriendly(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  return date.toLocaleDateString('zh-CN')
}
