/**
 * 疫苗/驱虫状态管理
 * 管理疫苗和驱虫记录、到期提醒、初始计划生成
 */
import create from 'zustand'
import type { VaccineRecord, CreateVaccineData } from '../services/vaccineService'
import {
  getVaccineRecords,
  createVaccineRecord,
  updateVaccineRecord,
  deleteVaccineRecord,
  markAsCompleted,
  getUpcomingRecords,
  getOverdueRecords,
  generateInitialPlan,
} from '../services/vaccineService'

/** 疫苗状态定义 */
interface VaccineStoreState {
  records: VaccineRecord[]
  upcomingRecords: VaccineRecord[]
  overdueRecords: VaccineRecord[]
  isLoading: boolean
  error: string | null

  fetchRecords: (petId: string) => Promise<void>
  addRecord: (data: CreateVaccineData) => Promise<VaccineRecord>
  updateRecord: (id: string, data: Partial<Omit<VaccineRecord, 'id' | 'petId' | 'createdAt'>>) => Promise<void>
  removeRecord: (id: string) => Promise<void>
  markCompleted: (id: string) => Promise<void>
  fetchUpcoming: (petId: string, days?: number) => Promise<void>
  fetchOverdue: (petId: string) => Promise<void>
  initPlan: (petId: string, petInfo: { species: 'dog' | 'cat'; breed: string; birthDate: string }) => Promise<void>
  getRecordsByMonth: (year: number, month: number) => VaccineRecord[]
  clearError: () => void
}

export const useVaccineStore = create<VaccineStoreState>((set, get) => ({
  records: [],
  upcomingRecords: [],
  overdueRecords: [],
  isLoading: false,
  error: null,

  /**
   * 获取疫苗/驱虫记录列表
   * @param petId - 宠物 ID
   */
  fetchRecords: async (petId: string) => {
    set({ isLoading: true, error: null })
    try {
      const records = await getVaccineRecords(petId)
      set({ records, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取疫苗记录失败',
      })
    }
  },

  /**
   * 添加疫苗/驱虫记录
   * @param data - 创建数据
   * @returns 创建后的记录
   */
  addRecord: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const newRecord = await createVaccineRecord(data)
      set((state) => ({
        records: [...state.records, newRecord],
        isLoading: false,
      }))
      return newRecord
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '添加疫苗记录失败',
      })
      throw err
    }
  },

  /**
   * 更新疫苗/驱虫记录
   * @param id - 记录 ID
   * @param data - 要更新的字段
   */
  updateRecord: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await updateVaccineRecord(id, data)
      set((state) => ({
        records: state.records.map((r) => (r.id === id ? updated : r)),
        upcomingRecords: state.upcomingRecords.map((r) => (r.id === id ? updated : r)),
        overdueRecords: state.overdueRecords.map((r) => (r.id === id ? updated : r)),
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '更新疫苗记录失败',
      })
      throw err
    }
  },

  /**
   * 删除疫苗/驱虫记录
   * @param id - 记录 ID
   */
  removeRecord: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await deleteVaccineRecord(id)
      set((state) => ({
        records: state.records.filter((r) => r.id !== id),
        upcomingRecords: state.upcomingRecords.filter((r) => r.id !== id),
        overdueRecords: state.overdueRecords.filter((r) => r.id !== id),
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '删除疫苗记录失败',
      })
      throw err
    }
  },

  /**
   * 标记记录为已完成
   * @param id - 记录 ID
   */
  markCompleted: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await markAsCompleted(id)
      set((state) => ({
        records: state.records.map((r) => (r.id === id ? updated : r)),
        upcomingRecords: state.upcomingRecords.filter((r) => r.id !== id),
        overdueRecords: state.overdueRecords.filter((r) => r.id !== id),
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '标记完成失败',
      })
      throw err
    }
  },

  /**
   * 获取即将到期的记录
   * @param petId - 宠物 ID
   * @param days - 提前天数，默认 30 天
   */
  fetchUpcoming: async (petId: string, days = 30) => {
    set({ isLoading: true, error: null })
    try {
      const upcomingRecords = await getUpcomingRecords(petId, days)
      set({ upcomingRecords, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取即将到期疫苗失败',
      })
    }
  },

  /**
   * 获取已过期的记录
   * @param petId - 宠物 ID
   */
  fetchOverdue: async (petId: string) => {
    set({ isLoading: true, error: null })
    try {
      const overdueRecords = await getOverdueRecords(petId)
      set({ overdueRecords, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取已过期疫苗失败',
      })
    }
  },

  /**
   * 根据宠物信息生成初始疫苗/驱虫计划
   * @param petId - 宠物 ID
   * @param petInfo - 宠物信息（物种、品种、出生日期）
   */
  initPlan: async (petId, petInfo) => {
    set({ isLoading: true, error: null })
    try {
      const records = await generateInitialPlan(petId, petInfo)
      set({ records, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '生成初始计划失败',
      })
    }
  },

  /**
   * 按年月筛选记录
   * @param year - 年份
   * @param month - 月份（0-11）
   * @returns 匹配的记录列表
   */
  getRecordsByMonth: (year: number, month: number) => {
    const monthStr = String(month + 1).padStart(2, '0')
    const prefix = `${year}-${monthStr}`
    return get().records.filter((r) => r.date.startsWith(prefix) || r.nextDate.startsWith(prefix))
  },

  /** 清除错误状态 */
  clearError: () => {
    set({ error: null })
  },
}))
