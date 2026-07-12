/**
 * 外联功能 Hook
 * 提供外联消息的检测、显示和管理功能
 */

import Taro from '@tarojs/taro'
import { useEffect, useCallback } from 'react'
import { useOutreachStore, type OutreachMessage } from '../stores/outreachStore'
import { createOutreachScheduler, type OutreachDecision, type UserEmotionState } from '../engines/outreach/OutreachScheduler'
import type { MoodTag, ContextTag } from '../data/outreachSuggestions'

/** 外联选项接口 */
export interface UseOutreachOptions {
  checkInterval?: number // 检查间隔（毫秒），默认5分钟
  autoShowToast?: boolean // 是否自动显示Toast，默认true
}

/** 外联返回值接口 */
export interface UseOutreachReturn {
  messages: OutreachMessage[]
  isChecking: boolean
  lastCheckTime: string | null
  checkForOutreach: () => Promise<OutreachDecision[]>
  dismissMessage: (messageId: string) => void
  markAsRead: (messageId: string) => void
  updateUserEmotion: (emotion: Partial<UserEmotionState>) => void
  recordEmergency: (date: string) => void
  clearAllMessages: () => void
}

/** 创建外联 Hook */
export function useOutreach(options: UseOutreachOptions = {}): UseOutreachReturn {
  const { checkInterval = 5 * 60 * 1000, autoShowToast = true } = options

  const {
    messages,
    isChecking,
    lastCheckTime,
    checkForOutreach,
    dismissMessage,
    markAsRead,
    updateUserEmotion,
    recordEmergency,
    clearAllMessages
  } = useOutreachStore()

  // 定时检查触发条件
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const decisions = await checkForOutreach()

      // 如果有新消息且启用了自动显示Toast
      if (autoShowToast && decisions.length > 0) {
        const highestPriority = decisions[0]
        if (highestPriority.suggestion) {
          showOutreachToast(highestPriority.suggestion)
        }
      }
    }, checkInterval)

    return () => clearInterval(intervalId)
  }, [checkInterval, autoShowToast, checkForOutreach])

  return {
    messages,
    isChecking,
    lastCheckTime,
    checkForOutreach,
    dismissMessage,
    markAsRead,
    updateUserEmotion,
    recordEmergency,
    clearAllMessages
  }
}

/** 显示外联消息 Toast */
function showOutreachToast(suggestion: { title: string; content: string; priority: string }): void {
  try {
    Taro.showToast({
      title: suggestion.title,
      icon: 'none',
      duration: 3000
    })
  } catch {
  }
}

/** 更新用户情绪状态 */
export function updateEmotionState(
  emotion: Partial<UserEmotionState> & {
    lastMood?: MoodTag
    lastIntensity?: number
    lastContext?: ContextTag
  }
): void {
  useOutreachStore.getState().updateUserEmotion(emotion)
}

/** 记录急救事件 */
export function logEmergencyEvent(): void {
  useOutreachStore.getState().recordEmergency(new Date().toISOString())
}
