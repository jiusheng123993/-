/**
 * 外联状态管理 Store
 * 使用 Zustand 进行状态管理
 */

import Taro from '@tarojs/taro'
import { create } from 'zustand'
import type { OutreachTriggerType, MoodTag, ContextTag } from '../data/outreachSuggestions'
import type { UserOutreachSettings, OutreachRecord } from '../utils/outreachValidator'
import { DEFAULT_USER_SETTINGS } from '../utils/outreachValidator'
import { createOutreachScheduler, type OutreachDecision, type UserEmotionState } from '../engines/outreach/OutreachScheduler'

/** 外联消息接口 */
export interface OutreachMessage {
  id: string
  title: string
  content: string
  triggerType: OutreachTriggerType
  priority: 'low' | 'medium' | 'high' | 'critical'
  actionType?: string
  sentAt: string
  read: boolean
}

/** Store 状态接口 */
interface OutreachStoreState {
  // 数据
  messages: OutreachMessage[]
  settings: UserOutreachSettings
  userEmotion: UserEmotionState
  isChecking: boolean
  lastCheckTime: string | null

  // 操作
  checkForOutreach: () => Promise<OutreachDecision[]>
  dismissMessage: (messageId: string) => void
  markAsRead: (messageId: string) => void
  updateUserEmotion: (emotion: Partial<UserEmotionState>) => void
  updateSettings: (settings: Partial<UserOutreachSettings>) => void
  recordEmergency: (date: string) => void
  clearAllMessages: () => void
}

// 创建调度器实例（单例）
const scheduler = createOutreachScheduler()

/** 生成唯一 ID */
function generateId(): string {
  return `outreach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/** 获取当前小时 */
function getCurrentHour(): number {
  return new Date().getHours()
}

/** 加载存储的消息 */
function loadStoredMessages(): OutreachMessage[] {
  try {
    const raw = Taro.getStorageSync('outreach_messages')
    if (!raw) return []
    const parsed = JSON.parse(raw as string)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

/** 保存消息到存储 */
function saveMessagesToStorage(messages: OutreachMessage[]): void {
  try {
    const serialized = JSON.stringify(messages)
    Taro.setStorageSync('outreach_messages', serialized)
  } catch {
  }
}

/** 创建外联 Store */
export const useOutreachStore = create<OutreachStoreState>((set, get) => ({
  messages: loadStoredMessages(),
  settings: DEFAULT_USER_SETTINGS,
  userEmotion: {},
  isChecking: false,
  lastCheckTime: null,

  checkForOutreach: async () => {
    set({ isChecking: true })

    try {
      const currentState = get()
      const hour = getCurrentHour()

      // 构建上下文
      const context = {
        hour,
        userEmotion: currentState.userEmotion,
        records: currentState.messages.map(m => ({
          id: m.id,
          triggerType: m.triggerType,
          sentAt: m.sentAt,
          opened: m.read
        })),
        settings: currentState.settings
      }

      // 检查触发条件
      const decisions = scheduler.checkTriggers(context)

      // 将决策转换为消息并记录
      const newMessages: OutreachMessage[] = []
      for (const decision of decisions) {
        if (decision.shouldPush && decision.suggestion) {
          const message: OutreachMessage = {
            id: generateId(),
            title: decision.suggestion.title,
            content: decision.suggestion.content,
            triggerType: decision.suggestion.triggerType,
            priority: decision.suggestion.priority,
            actionType: decision.suggestion.actionType,
            sentAt: new Date().toISOString(),
            read: false
          }
          newMessages.push(message)

          // 记录外联尝试
          scheduler.recordOutreach({
            id: message.id,
            triggerType: message.triggerType,
            sentAt: message.sentAt
          })
        }
      }

      // 更新消息列表
      if (newMessages.length > 0) {
        const updatedMessages = [...newMessages, ...currentState.messages]
        saveMessagesToStorage(updatedMessages)
        set({
          messages: updatedMessages,
          lastCheckTime: new Date().toISOString()
        })
      } else {
        set({ lastCheckTime: new Date().toISOString() })
      }

      return decisions
    } finally {
      set({ isChecking: false })
    }
  },

  dismissMessage: (messageId: string) => {
    const currentMessages = get().messages
    const updatedMessages = currentMessages.filter(m => m.id !== messageId)
    saveMessagesToStorage(updatedMessages)
    set({ messages: updatedMessages })
  },

  markAsRead: (messageId: string) => {
    const currentMessages = get().messages
    const updatedMessages = currentMessages.map(m =>
      m.id === messageId ? { ...m, read: true } : m
    )
    saveMessagesToStorage(updatedMessages)
    set({ messages: updatedMessages })
  },

  updateUserEmotion: (emotion: Partial<UserEmotionState>) => {
    set((state) => ({
      userEmotion: { ...state.userEmotion, ...emotion }
    }))
  },

  updateSettings: (newSettings: Partial<UserOutreachSettings>) => {
    const updatedSettings = { ...get().settings, ...newSettings }
    scheduler.updateSettings(updatedSettings)
    set({ settings: updatedSettings })
  },

  recordEmergency: (date: string) => {
    set((state) => ({
      userEmotion: {
        ...state.userEmotion,
        hasEmergencyRecently: true,
        emergencyDate: date
      }
    }))
  },

  clearAllMessages: () => {
    saveMessagesToStorage([])
    set({ messages: [] })
  }
}))
