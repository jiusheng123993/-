import { create } from 'zustand'
import type { TrendDataPoint, TrendSummary, MonthlyReport } from '../services/trendService'
import {
  getTrendData,
  getTrendSummary,
  getMonthlyReport,
  getWeightTrend,
  getAppetiteTrend,
  getStoolTrend,
  getAbnormalDays,
} from '../services/trendService'
import { setStorageUserId } from '../utils/storage'

interface TrendStoreState {
  userId: string
  trendData: TrendDataPoint[]
  summary: TrendSummary | null
  monthlyReport: MonthlyReport | null
  isLoading: boolean
  error: string | null

  initUser: (userId: string) => void
  fetchTrendData: (petId: string, startDate: string, endDate: string) => Promise<void>
  fetchSummary: (petId: string, period: 'week' | 'month' | 'quarter') => Promise<void>
  fetchMonthlyReport: (petId: string, month: string) => Promise<void>
  fetchWeightTrend: (petId: string, months?: number) => Promise<void>
  fetchAppetiteTrend: (petId: string, months?: number) => Promise<void>
  fetchStoolTrend: (petId: string, months?: number) => Promise<void>
  fetchAbnormalDays: (petId: string, startDate: string, endDate: string) => Promise<void>
  clearError: () => void
  reset: () => void
}

export const useTrendStore = create<TrendStoreState>((set, get) => ({
  userId: '',
  trendData: [],
  summary: null,
  monthlyReport: null,
  isLoading: false,
  error: null,

  initUser: (userId: string) => {
    if (!userId) throw new Error('[TrendStore] userId is required')
    setStorageUserId(userId)
    set({ userId })
  },

  fetchTrendData: async (petId: string, startDate: string, endDate: string) => {
    set({ isLoading: true, error: null })
    try {
      const trendData = await getTrendData(petId, startDate, endDate, get().userId)
      set({ trendData, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取趋势数据失败',
      })
    }
  },

  fetchSummary: async (petId: string, period: 'week' | 'month' | 'quarter') => {
    set({ isLoading: true, error: null })
    try {
      const summary = await getTrendSummary(petId, period)
      set({ summary, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取趋势摘要失败',
      })
    }
  },

  fetchMonthlyReport: async (petId: string, month: string) => {
    set({ isLoading: true, error: null })
    try {
      const monthlyReport = await getMonthlyReport(petId, month)
      set({ monthlyReport, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取月度报告失败',
      })
    }
  },

  fetchWeightTrend: async (petId: string, months: number = 3) => {
    set({ isLoading: true, error: null })
    try {
      const trendData = await getWeightTrend(petId, months)
      set({ trendData, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取体重趋势失败',
      })
    }
  },

  fetchAppetiteTrend: async (petId: string, months: number = 3) => {
    set({ isLoading: true, error: null })
    try {
      const trendData = await getAppetiteTrend(petId, months)
      set({ trendData, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取食欲趋势失败',
      })
    }
  },

  fetchStoolTrend: async (petId: string, months: number = 3) => {
    set({ isLoading: true, error: null })
    try {
      const trendData = await getStoolTrend(petId, months)
      set({ trendData, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取便便趋势失败',
      })
    }
  },

  fetchAbnormalDays: async (petId: string, startDate: string, endDate: string) => {
    set({ isLoading: true, error: null })
    try {
      const trendData = await getAbnormalDays(petId, startDate, endDate)
      set({ trendData, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取异常天数失败',
      })
    }
  },

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    set({
      trendData: [],
      summary: null,
      monthlyReport: null,
      isLoading: false,
      error: null,
    })
  },
}))
