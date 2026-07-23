import create from 'zustand'
import type { ReminderItem } from '../services/reminderService'
import {
  getSubscriptionStatus,
  saveSubscriptionStatus,
  requestSubscribeMessage,
  getUpcomingReminders,
  getOverdueReminders,
} from '../services/reminderService'

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

  fetchSubscriptionStatus: () => {
    const subscribed = getSubscriptionStatus()
    set({ subscriptionStatus: subscribed })
  },

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

  toggleSubscription: (subscribed: boolean) => {
    saveSubscriptionStatus(subscribed)
    set({ subscriptionStatus: subscribed })
  },

  clearError: () => {
    set({ error: null })
  },
}))
