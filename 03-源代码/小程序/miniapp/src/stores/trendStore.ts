/**
 * 健康趋势状态管理
 * 管理宠物健康趋势数据、趋势摘要、月度报告和各类趋势查询
 */
import create from 'zustand'
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

/** 趋势状态定义 */
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

  /**
   * 初始化用户并持久化 userId
   * @param userId - 用户 ID
   */
  initUser: (userId: string) => {
    if (!userId) throw new Error('[TrendStore] userId is required')
    setStorageUserId(userId)
    set({ userId })
  },

  /**
   * 获取趋势数据
   * @param petId - 宠物 ID
   * @param startDate - 开始日期
   * @param endDate - 结束日期
   */
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

  /**
   * 获取趋势摘要
   * @param petId - 宠物 ID
   * @param period - 周期（周/月/季度）
   */
  fetchSummary: async (petId: string, period: 'week' | 'month' | 'quarter') => {
    set({ isLoading: true, error: null })
    try {
      const summary = await getTrendSummary(petId, period, get().userId)
      set({ summary, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取趋势摘要失败',
      })
    }
  },

  /**
   * 获取月度报告
   * @param petId - 宠物 ID
   * @param month - 月份（格式：YYYY-MM）
   */
  fetchMonthlyReport: async (petId: string, month: string) => {
    set({ isLoading: true, error: null })
    try {
      const monthlyReport = await getMonthlyReport(petId, month, get().userId)
      set({ monthlyReport, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取月度报告失败',
      })
    }
  },

  /**
   * 获取体重趋势
   * @param petId - 宠物 ID
   * @param months - 月数，默认 3 个月
   */
  fetchWeightTrend: async (petId: string, months: number = 3) => {
    set({ isLoading: true, error: null })
    try {
      const trendData = await getWeightTrend(petId, months, get().userId)
      set({ trendData, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取体重趋势失败',
      })
    }
  },

  /**
   * 获取食欲趋势
   * @param petId - 宠物 ID
   * @param months - 月数，默认 3 个月
   */
  fetchAppetiteTrend: async (petId: string, months: number = 3) => {
    set({ isLoading: true, error: null })
    try {
      const trendData = await getAppetiteTrend(petId, months, get().userId)
      set({ trendData, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取食欲趋势失败',
      })
    }
  },

  /**
   * 获取便便趋势
   * @param petId - 宠物 ID
   * @param months - 月数，默认 3 个月
   */
  fetchStoolTrend: async (petId: string, months: number = 3) => {
    set({ isLoading: true, error: null })
    try {
      const trendData = await getStoolTrend(petId, months, get().userId)
      set({ trendData, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取便便趋势失败',
      })
    }
  },

  /**
   * 获取异常天数数据
   * @param petId - 宠物 ID
   * @param startDate - 开始日期
   * @param endDate - 结束日期
   */
  fetchAbnormalDays: async (petId: string, startDate: string, endDate: string) => {
    set({ isLoading: true, error: null })
    try {
      const trendData = await getAbnormalDays(petId, startDate, endDate, get().userId)
      set({ trendData, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取异常天数失败',
      })
    }
  },

  /** 清除错误状态 */
  clearError: () => {
    set({ error: null })
  },

  /** 重置所有状态为初始值 */
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
