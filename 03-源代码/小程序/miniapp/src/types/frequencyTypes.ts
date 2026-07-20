export type TimeWindow = 'minute' | 'hour' | 'day' | 'week' | 'month'

export interface FrequencyRule {
  templateId: string
  minInterval: number // 最小间隔（分钟）
  dailyLimit: number // 每日上限
  weeklyLimit: number // 每周上限
  monthlyLimit: number // 每月上限
  enabled: boolean // 是否启用
}

export interface SendRecord {
  templateId: string
  sentAt: number // 时间戳
  success: boolean
}

export interface DoNotDisturbSetting {
  enabled: boolean
  startHour: number // 0-23
  startMinute: number // 0-59
  endHour: number
  endMinute: number
  timezone: string
}

export interface FrequencyControlConfig {
  defaultRules: FrequencyRule[]
  userRules: Record<string, FrequencyRule> // key: templateId
  sendHistory: SendRecord[]
  doNotDisturb: DoNotDisturbSetting
  globalDailyLimit: number // 所有消息合计每日上限
  globalWeeklyLimit: number
}

export interface FrequencyCheckResult {
  allowed: boolean
  reason?: string
  nextAllowedAt?: number
  remainingToday?: number
  remainingThisWeek?: number
}
