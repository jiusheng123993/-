import { create } from 'zustand'
import type { PetHealthEntry, HealthRiskLevel } from '../memory-body/types/memoryBodyTypes'
export type { PetHealthEntry, HealthRiskLevel }
import type { HealthCheckinStats } from '../services/checkinService'
export type { HealthCheckinStats }
import {
  getCheckins,
  createCheckin,
  getTodayCheckin,
  getCheckinStats,
  calculateConsecutiveAnomalyDays,
} from '../services/checkinService'
import { setStorageUserId } from '../utils/storage'

interface CheckinStoreState {
  userId: string
  entries: PetHealthEntry[]
  todayEntry: PetHealthEntry | null
  stats: HealthCheckinStats | null
  consecutiveAnomalyDays: number
  isLoading: boolean
  error: string | null

  initUser: (userId: string) => void
  fetchCheckins: (petId: string) => Promise<void>
  fetchTodayCheckin: (petId: string) => Promise<void>
  addCheckin: (
    data: Omit<PetHealthEntry, 'id' | 'createdAt' | 'riskLevel' | 'aiFeedback'>
  ) => Promise<PetHealthEntry>
  fetchStats: (petId: string) => Promise<void>
  clearError: () => void
}

export const useCheckinStore = create<CheckinStoreState>((set, get) => ({
  userId: '',
  entries: [],
  todayEntry: null,
  stats: null,
  consecutiveAnomalyDays: 0,
  isLoading: false,
  error: null,

  initUser: (userId: string) => {
    if (!userId) throw new Error('[CheckinStore] userId is required')
    setStorageUserId(userId)
    set({ userId })
  },

  fetchCheckins: async (petId: string) => {
    const { userId } = get()
    if (!userId) throw new Error('[CheckinStore] userId not initialized')
    set({ isLoading: true, error: null })
    try {
      const entries = await getCheckins(petId, userId)
      const consecutiveAnomalyDays = calculateConsecutiveAnomalyDays(entries)
      set({ entries, consecutiveAnomalyDays, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取打卡记录失败'
      })
    }
  },

  fetchTodayCheckin: async (petId: string) => {
    const { userId } = get()
    if (!userId) throw new Error('[CheckinStore] userId not initialized')
    set({ isLoading: true, error: null })
    try {
      const todayEntry = await getTodayCheckin(petId, userId)
      set({ todayEntry, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取今日打卡失败'
      })
    }
  },

  addCheckin: async (data) => {
    const { userId } = get()
    if (!userId) throw new Error('[CheckinStore] userId not initialized')
    set({ isLoading: true, error: null })
    try {
      const newEntry = await createCheckin({ ...data, userId })
      set((state) => ({
        entries: [...state.entries, newEntry],
        todayEntry: newEntry,
        isLoading: false
      }))
      return newEntry
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '创建打卡失败'
      })
      throw err
    }
  },

  fetchStats: async (petId: string) => {
    const { userId } = get()
    if (!userId) throw new Error('[CheckinStore] userId not initialized')
    set({ isLoading: true, error: null })
    try {
      const stats = await getCheckinStats(petId, userId)
      set({ stats, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取打卡统计失败'
      })
    }
  },

  clearError: () => {
    set({ error: null })
  }
}))
