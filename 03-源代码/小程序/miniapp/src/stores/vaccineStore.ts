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

  getRecordsByMonth: (year: number, month: number) => {
    const monthStr = String(month + 1).padStart(2, '0')
    const prefix = `${year}-${monthStr}`
    return get().records.filter((r) => r.date.startsWith(prefix) || r.nextDate.startsWith(prefix))
  },

  clearError: () => {
    set({ error: null })
  },
}))
