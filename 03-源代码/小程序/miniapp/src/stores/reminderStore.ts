/**
 * 提醒订阅状态管理
 * 管理消息订阅状态、到期提醒和逾期提醒列表
 */
import create from 'zustand'
import type { ReminderItem } from '../services/reminderService'
import {
  getSubscriptionStatus,
  saveSubscriptionStatus,
  requestSubscribeMessage,
  getUpcomingReminders,
  getOverdueReminders,
} from '../services/reminderService'

/** 提醒状态定义 */
interface ReminderStoreState {
  subscriptionStatus: boolean
  upcomingReminders: ReminderItem[]
  overdueReminders: ReminderItem[]
  isLoading: boolean
  error: string | null

  fetchSubscriptionStatus: () => void
  requestSubscription: () => Promise<boolean>
  fetchUpcomingReminders: (petId: string, days?: number) => void
  fetchOverdueReminders: (petId: string) => void
  toggleSubscription: (subscribed: boolean) => void
  clearError: () => void
}

export const useReminderStore = create<ReminderStoreState>((set) => ({
  subscriptionStatus: false,
  upcomingReminders: [],
  overdueReminders: [],
  isLoading: false,
  error: null,

  /** 从本地存储获取订阅状态 */
  fetchSubscriptionStatus: () => {
    const subscribed = getSubscriptionStatus()
    set({ subscriptionStatus: subscribed })
  },

  /** 请求消息订阅权限 */
  requestSubscription: async () => {
    set({ isLoading: true, error: null })
    try {
      const accepted = await requestSubscribeMessage()
      set({ subscriptionStatus: accepted, isLoading: false })
      return accepted
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '请求订阅失败',
      })
      return false
    }
  },

  /**
   * 获取即将到期的提醒列表
   * @param petId - 宠物 ID
   * @param days - 提前天数，默认 7 天
   */
  fetchUpcomingReminders: (petId: string, days: number = 7) => {
    set({ isLoading: true, error: null })
    try {
      const upcomingReminders = getUpcomingReminders(petId, days)
      set({ upcomingReminders, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取即将到期提醒失败',
      })
    }
  },

  /**
   * 获取已逾期的提醒列表
   * @param petId - 宠物 ID
   */
  fetchOverdueReminders: (petId: string) => {
    set({ isLoading: true, error: null })
    try {
      const overdueReminders = getOverdueReminders(petId)
      set({ overdueReminders, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取已逾期提醒失败',
      })
    }
  },

  /**
   * 切换订阅状态
   * @param subscribed - 是否订阅
   */
  toggleSubscription: (subscribed: boolean) => {
    saveSubscriptionStatus(subscribed)
    set({ subscriptionStatus: subscribed })
  },

  /** 清除错误状态 */
  clearError: () => {
    set({ error: null })
  },
}))
