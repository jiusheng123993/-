import { getStorage, setStorage } from '../utils/storage'
import {
  type FrequencyRule,
  type SendRecord,
  type DoNotDisturbSetting,
  type FrequencyCheckResult,
  type FrequencyControlConfig,
} from '../types/frequencyTypes'

const FREQUENCY_CONFIG_KEY = 'frequency_control_config'

const DEFAULT_RULES: FrequencyRule[] = [
  {
    templateId: 'FOLLOWUP_TEMPLATE_ID_PLACEHOLDER',
    minInterval: 60, // 1小时
    dailyLimit: 3,
    weeklyLimit: 7,
    monthlyLimit: 20,
    enabled: true,
  },
  {
    templateId: 'INTERVENTION_REMINDER_TEMPLATE_ID_PLACEHOLDER',
    minInterval: 30, // 30分钟
    dailyLimit: 5,
    weeklyLimit: 15,
    monthlyLimit: 50,
    enabled: true,
  },
  {
    templateId: 'MOOD_CHECKIN_TEMPLATE_ID_PLACEHOLDER',
    minInterval: 120, // 2小时
    dailyLimit: 2,
    weeklyLimit: 7,
    monthlyLimit: 30,
    enabled: true,
  },
]

const DEFAULT_CONFIG: FrequencyControlConfig = {
  defaultRules: DEFAULT_RULES,
  userRules: {},
  sendHistory: [],
  doNotDisturb: {
    enabled: false,
    startHour: 22,
    startMinute: 0,
    endHour: 8,
    endMinute: 0,
    timezone: 'Asia/Shanghai',
  },
  globalDailyLimit: 10,
  globalWeeklyLimit: 30,
}

function getConfig(): FrequencyControlConfig {
  return getStorage<FrequencyControlConfig>(FREQUENCY_CONFIG_KEY) || DEFAULT_CONFIG
}

function saveConfig(config: FrequencyControlConfig): void {
  setStorage(FREQUENCY_CONFIG_KEY, config)
}

function getNow(): Date {
  return new Date()
}

function isInDoNotDisturb(setting: DoNotDisturbSetting): boolean {
  if (!setting.enabled) return false

  const now = getNow()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinute

  const startTime = setting.startHour * 60 + setting.startMinute
  const endTime = setting.endHour * 60 + setting.endMinute

  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime
  } else {
    // 跨天的情况，如 22:00 - 08:00
    return currentTime >= startTime || currentTime < endTime
  }
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 周一为周开始
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getStartOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getFrequencyRule(templateId: string): FrequencyRule {
  const config = getConfig()
  return (
    config.userRules[templateId] ||
    config.defaultRules.find((r) => r.templateId === templateId) ||
    DEFAULT_RULES[0]
  )
}

export function setFrequencyRule(templateId: string, rule: Partial<FrequencyRule>): void {
  const config = getConfig()
  const existing = config.userRules[templateId] || config.defaultRules.find((r) => r.templateId === templateId)

  config.userRules[templateId] = {
    ...(existing || DEFAULT_RULES[0]),
    ...rule,
    templateId,
  }

  saveConfig(config)
}

export function recordSend(templateId: string, success: boolean): void {
  const config = getConfig()
  config.sendHistory.push({
    templateId,
    sentAt: Date.now(),
    success,
  })

  // 只保留最近90天的记录
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  config.sendHistory = config.sendHistory.filter((r) => r.sentAt > ninetyDaysAgo)

  saveConfig(config)
}

export function checkFrequency(templateId: string): FrequencyCheckResult {
  const config = getConfig()

  // 检查免打扰时段
  if (isInDoNotDisturb(config.doNotDisturb)) {
    const { endHour, endMinute } = config.doNotDisturb
    const now = getNow()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(endHour, endMinute, 0, 0)

    return {
      allowed: false,
      reason: '当前处于免打扰时段',
      nextAllowedAt: tomorrow.getTime(),
    }
  }

  const rule = getFrequencyRule(templateId)

  if (!rule.enabled) {
    return {
      allowed: false,
      reason: '该消息类型已禁用',
    }
  }

  const now = getNow()
  const nowTime = now.getTime()

  // 检查最小间隔
  const recentSends = config.sendHistory.filter(
    (r) => r.templateId === templateId && r.sentAt > nowTime - rule.minInterval * 60 * 1000
  )

  if (recentSends.length > 0) {
    const lastSend = recentSends[recentSends.length - 1]
    const nextAllowed = lastSend.sentAt + rule.minInterval * 60 * 1000
    return {
      allowed: false,
      reason: `发送过于频繁，最小间隔为 ${rule.minInterval} 分钟`,
      nextAllowedAt: nextAllowed,
    }
  }

  // 检查每日限制
  const startOfDay = getStartOfDay(now).getTime()
  const todaySends = config.sendHistory.filter(
    (r) => r.templateId === templateId && r.sentAt >= startOfDay
  )

  if (todaySends.length >= rule.dailyLimit) {
    const tomorrow = new Date(startOfDay)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return {
      allowed: false,
      reason: `今日发送已达上限 (${rule.dailyLimit} 条)`,
      nextAllowedAt: tomorrow.getTime(),
      remainingToday: 0,
    }
  }

  // 检查每周限制
  const startOfWeek = getStartOfWeek(now).getTime()
  const weekSends = config.sendHistory.filter(
    (r) => r.templateId === templateId && r.sentAt >= startOfWeek
  )

  if (weekSends.length >= rule.weeklyLimit) {
    const nextWeek = new Date(startOfWeek)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return {
      allowed: false,
      reason: `本周发送已达上限 (${rule.weeklyLimit} 条)`,
      nextAllowedAt: nextWeek.getTime(),
      remainingThisWeek: 0,
    }
  }

  // 检查全局每日限制
  const globalTodaySends = config.sendHistory.filter((r) => r.sentAt >= startOfDay)
  if (globalTodaySends.length >= config.globalDailyLimit) {
    const tomorrow = new Date(startOfDay)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return {
      allowed: false,
      reason: `今日总消息数已达上限 (${config.globalDailyLimit} 条)`,
      nextAllowedAt: tomorrow.getTime(),
    }
  }

  // 检查全局每周限制
  const globalWeekSends = config.sendHistory.filter((r) => r.sentAt >= startOfWeek)
  if (globalWeekSends.length >= config.globalWeeklyLimit) {
    const nextWeek = new Date(startOfWeek)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return {
      allowed: false,
      reason: `本周总消息数已达上限 (${config.globalWeeklyLimit} 条)`,
      nextAllowedAt: nextWeek.getTime(),
    }
  }

  return {
    allowed: true,
    remainingToday: rule.dailyLimit - todaySends.length - 1,
    remainingThisWeek: rule.weeklyLimit - weekSends.length - 1,
  }
}

export function getSendStats(templateId?: string): {
  today: number
  thisWeek: number
  thisMonth: number
  total: number
} {
  const config = getConfig()
  const now = getNow()
  const startOfDay = getStartOfDay(now).getTime()
  const startOfWeek = getStartOfWeek(now).getTime()
  const startOfMonth = getStartOfMonth(now).getTime()

  const records = templateId
    ? config.sendHistory.filter((r) => r.templateId === templateId)
    : config.sendHistory

  return {
    today: records.filter((r) => r.sentAt >= startOfDay).length,
    thisWeek: records.filter((r) => r.sentAt >= startOfWeek).length,
    thisMonth: records.filter((r) => r.sentAt >= startOfMonth).length,
    total: records.length,
  }
}

export function setDoNotDisturb(setting: Partial<DoNotDisturbSetting>): void {
  const config = getConfig()
  config.doNotDisturb = { ...config.doNotDisturb, ...setting }
  saveConfig(config)
}

export function getDoNotDisturbSetting(): DoNotDisturbSetting {
  return getConfig().doNotDisturb
}

export function clearSendHistory(): void {
  const config = getConfig()
  config.sendHistory = []
  saveConfig(config)
}

export function resetToDefaultRules(): void {
  const config = getConfig()
  config.userRules = {}
  config.sendHistory = []
  saveConfig(config)
}
