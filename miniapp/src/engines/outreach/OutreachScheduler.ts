/**
 * AI主动外联调度引擎
 * 基于规则的建议系统，无需LLM即可运行
 */

import Taro from '@tarojs/taro'
import type { OutreachTriggerType, MoodTag, ContextTag } from '../../data/outreachSuggestions'
import { getSuggestionsByTrigger, getRandomSuggestion, type OutreachSuggestion } from '../../data/outreachSuggestions'
import {
  validateOutreach,
  COOLDOWN_CONFIG,
  DEFAULT_USER_SETTINGS,
  type OutreachRecord,
  type UserOutreachSettings,
  type ValidationResult
} from '../../utils/outreachValidator'

/** 用户情绪状态接口 */
export interface UserEmotionState {
  lastMood?: MoodTag
  lastIntensity?: number
  lastContext?: ContextTag
  lastActiveAt?: string
  consecutiveNegativeDays?: number
  daysSinceLastEntry?: number
  hasEmergencyRecently?: boolean
  emergencyDate?: string
  moodTrend?: 'declining' | 'improving' | 'stable'
  changePercent?: number
}

/** 触发条件上下文 */
export interface OutreachContext {
  hour: number
  userEmotion: UserEmotionState
  records: OutreachRecord[]
  settings: UserOutreachSettings
}

/** 外联决策结果 */
export interface OutreachDecision {
  shouldPush: boolean
  suggestion?: OutreachSuggestion
  reason: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  validation?: ValidationResult
}

/** 模式检测结果 */
export interface PatternDetection {
  type: 'weekly_cycle' | 'trigger_association' | 'silence' | 'emergency_followup' | 'trend_improvement'
  confidence: number
  data: any
}

/** 外联调度器接口 */
export interface OutreachScheduler {
  checkTriggers(context: OutreachContext): OutreachDecision[]
  detectPatterns(userEmotion: UserEmotionState): PatternDetection[]
  recordOutreach(record: OutreachRecord): void
  getTodayCount(): number
  updateSettings(settings: Partial<UserOutreachSettings>): void
}

const STORAGE_KEY = 'outreach_records'
const SETTINGS_KEY = 'outreach_settings'

/** 从存储加载记录 */
function loadRecords(): OutreachRecord[] {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw as string)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

/** 保存记录到存储 */
function saveRecords(records: OutreachRecord[]): void {
  try {
    const serialized = JSON.stringify(records)
    Taro.setStorageSync(STORAGE_KEY, serialized)
  } catch {
  }
}

/** 从存储加载设置 */
function loadSettings(): UserOutreachSettings {
  try {
    const raw = Taro.getStorageSync(SETTINGS_KEY)
    if (!raw) return DEFAULT_USER_SETTINGS
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw as string) }
  } catch {
    return DEFAULT_USER_SETTINGS
  }
}

/** 保存设置到存储 */
function saveSettings(settings: UserOutreachSettings): void {
  try {
    const serialized = JSON.stringify(settings)
    Taro.setStorageSync(SETTINGS_KEY, serialized)
  } catch {
  }
}

/** 检测时间模式（周周期） */
function detectTimePattern(userEmotion: UserEmotionState): PatternDetection | null {
  // MVP版本：简化实现，实际应从memory-body读取历史数据
  const now = new Date()
  const dayOfWeek = now.getDay()

  // 如果用户在周日晚上经常焦虑，检测这个模式
  if (dayOfWeek === 0 && userEmotion.lastMood === 'anxious') {
    return {
      type: 'weekly_cycle',
      confidence: 0.6,
      data: {
        dayOfWeek,
        typicalMood: 'anxious',
        trigger: 'sunday_evening'
      }
    }
  }

  return null
}

/** 检测沉默模式 */
function detectSilencePattern(userEmotion: UserEmotionState): PatternDetection | null {
  if (userEmotion.daysSinceLastEntry !== undefined && userEmotion.daysSinceLastEntry >= 3) {
    return {
      type: 'silence',
      confidence: 1.0,
      data: {
        daysSinceLastEntry: userEmotion.daysSinceLastEntry,
        lastMood: userEmotion.lastMood,
        lastActiveAt: userEmotion.lastActiveAt
      }
    }
  }
  return null
}

/** 检测急救后跟进 */
function detectEmergencyFollowup(userEmotion: UserEmotionState): PatternDetection | null {
  if (userEmotion.hasEmergencyRecently && userEmotion.emergencyDate) {
    const emergencyDate = new Date(userEmotion.emergencyDate)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - emergencyDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return {
        type: 'emergency_followup',
        confidence: 1.0,
        data: {
          emergencyDate: userEmotion.emergencyDate,
          followupDay: 1
        }
      }
    }
  }
  return null
}

/** 检测情绪改善趋势 */
function detectImprovementTrend(userEmotion: UserEmotionState): PatternDetection | null {
  if (userEmotion.moodTrend === 'improving' && userEmotion.changePercent && userEmotion.changePercent > 10) {
    return {
      type: 'trend_improvement',
      confidence: 0.8,
      data: {
        changePercent: userEmotion.changePercent,
        trendDirection: 'improving'
      }
    }
  }
  return null
}

/** 检测高强度情绪记录 */
function detectHighIntensity(userEmotion: UserEmotionState): boolean {
  return userEmotion.lastIntensity !== undefined && userEmotion.lastIntensity >= 7
}

/** 创建外联调度器 */
export function createOutreachScheduler(): OutreachScheduler {
  let currentSettings = loadSettings()

  return {
    checkTriggers(context: OutreachContext): OutreachDecision[] {
      const decisions: OutreachDecision[] = []
      const { hour, userEmotion, records, settings } = context

      // 1. 晨间问候（8:00-9:00）
      if (hour >= 8 && hour < 9) {
        const validation = validateOutreach('morning_checkin', records, settings, hour)
        if (validation.canSend) {
          const suggestions = getSuggestionsByTrigger('morning_checkin')
          const suggestion = getRandomSuggestion(suggestions)
          if (suggestion) {
            decisions.push({
              shouldPush: true,
              suggestion,
              reason: '晨间问候时段',
              priority: suggestion.priority,
              validation
            })
          }
        }
      }

      // 2. 晚间反思（21:00-22:00）
      if (hour >= 21 && hour < 22) {
        const validation = validateOutreach('evening_reflection', records, settings, hour)
        if (validation.canSend) {
          const suggestions = getSuggestionsByTrigger('evening_reflection')
          const suggestion = getRandomSuggestion(suggestions)
          if (suggestion) {
            decisions.push({
              shouldPush: true,
              suggestion,
              reason: '晚间反思时段',
              priority: suggestion.priority,
              validation
            })
          }
        }
      }

      // 3. 高强度情绪记录后
      if (detectHighIntensity(userEmotion) && userEmotion.lastMood) {
        const validation = validateOutreach('high_intensity', records, settings, hour)
        if (validation.canSend) {
          const suggestions = getSuggestionsByTrigger('high_intensity')
          const filtered = suggestions.filter((s: OutreachSuggestion) => !s.mood || s.mood === userEmotion.lastMood)
          const suggestion = getRandomSuggestion(filtered)
          if (suggestion) {
            decisions.push({
              shouldPush: true,
              suggestion,
              reason: `检测到高强度${userEmotion.lastMood}情绪`,
              priority: suggestion.priority,
              validation
            })
          }
        }
      }

      // 4. 沉默预警（3天未记录）
      const silencePattern = detectSilencePattern(userEmotion)
      if (silencePattern) {
        const validation = validateOutreach('silence_warning', records, settings, hour)
        if (validation.canSend) {
          const suggestions = getSuggestionsByTrigger('silence_warning')
          const suggestion = getRandomSuggestion(suggestions)
          if (suggestion) {
            decisions.push({
              shouldPush: true,
              suggestion,
              reason: `用户已${userEmotion.daysSinceLastEntry}天未记录`,
              priority: suggestion.priority,
              validation
            })
          }
        }
      }

      // 5. 急救后跟进（第二天早上）
      const emergencyFollowup = detectEmergencyFollowup(userEmotion)
      if (emergencyFollowup) {
        const validation = validateOutreach('followup_emergency', records, settings, hour)
        if (validation.canSend) {
          const suggestions = getSuggestionsByTrigger('followup_emergency')
          const suggestion = getRandomSuggestion(suggestions)
          if (suggestion) {
            decisions.push({
              shouldPush: true,
              suggestion,
              reason: '急救后第一天跟进',
              priority: suggestion.priority,
              validation
            })
          }
        }
      }

      // 6. 情绪改善趋势
      const improvementTrend = detectImprovementTrend(userEmotion)
      if (improvementTrend) {
        const validation = validateOutreach('good_news', records, settings, hour)
        if (validation.canSend) {
          const suggestions = getSuggestionsByTrigger('good_news')
          const suggestion = getRandomSuggestion(suggestions)
          if (suggestion) {
            decisions.push({
              shouldPush: true,
              suggestion,
              reason: `检测到情绪改善趋势（+${userEmotion.changePercent}%）`,
              priority: suggestion.priority,
              validation
            })
          }
        }
      }

      // 按优先级排序
      decisions.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

      return decisions
    },

    detectPatterns(userEmotion: UserEmotionState): PatternDetection[] {
      const patterns: PatternDetection[] = []

      const timePattern = detectTimePattern(userEmotion)
      if (timePattern) patterns.push(timePattern)

      const silencePattern = detectSilencePattern(userEmotion)
      if (silencePattern) patterns.push(silencePattern)

      const emergencyFollowup = detectEmergencyFollowup(userEmotion)
      if (emergencyFollowup) patterns.push(emergencyFollowup)

      const improvementTrend = detectImprovementTrend(userEmotion)
      if (improvementTrend) patterns.push(improvementTrend)

      return patterns
    },

    recordOutreach(record: OutreachRecord): void {
      const records = loadRecords()
      records.unshift(record)
      // 只保留最近30天的记录
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      const filtered = records.filter(r => new Date(r.sentAt).getTime() > thirtyDaysAgo)
      saveRecords(filtered)
    },

    getTodayCount(): number {
      const records = loadRecords()
      const today = new Date().toISOString().split('T')[0]
      return records.filter(r => r.sentAt.startsWith(today)).length
    },

    updateSettings(newSettings: Partial<UserOutreachSettings>): void {
      currentSettings = { ...currentSettings, ...newSettings }
      saveSettings(currentSettings)
    }
  }
}
