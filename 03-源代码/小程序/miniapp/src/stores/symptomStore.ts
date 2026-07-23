import create from 'zustand'
import type { SymptomCheckResult, SymptomCategory } from '../services/symptomService'
import type { PetProfile } from '../services/petService'
import {
  getSymptomCategories,
  analyzeSymptoms,
  getCheckHistory,
  getCheckResult,
  deleteCheckResult,
} from '../services/symptomService'
import { queueSync } from '../services/syncHelper'
import { useAuthStore } from './authStore'

interface SymptomStoreState {
  categories: SymptomCategory[]
  selectedSymptoms: string[]
  currentResult: SymptomCheckResult | null
  history: SymptomCheckResult[]
  isLoading: boolean
  error: string | null

  fetchCategories: (species?: 'cat' | 'dog') => void
  selectSymptom: (symptomId: string) => void
  deselectSymptom: (symptomId: string) => void
  analyzeSymptoms: (
    petId: string,
    additionalInfo?: SymptomCheckResult['additionalInfo'],
    petProfile?: PetProfile
  ) => Promise<SymptomCheckResult>
  fetchHistory: (petId: string) => Promise<void>
  fetchCheckResult: (id: string) => Promise<void>
  removeCheckResult: (id: string) => Promise<void>
  clearSelection: () => void
  clearError: () => void
}

export const useSymptomStore = create<SymptomStoreState>((set, get) => ({
  categories: [],
  selectedSymptoms: [],
  currentResult: null,
  history: [],
  isLoading: false,
  error: null,

  fetchCategories: (species?: 'cat' | 'dog') => {
    const categories = getSymptomCategories(species)
    set({ categories })
  },

  selectSymptom: (symptomId: string) => {
    const { selectedSymptoms } = get()
    if (selectedSymptoms.includes(symptomId)) {
      return
    }
    set({ selectedSymptoms: [...selectedSymptoms, symptomId] })
  },

  deselectSymptom: (symptomId: string) => {
    const { selectedSymptoms } = get()
    set({
      selectedSymptoms: selectedSymptoms.filter((id) => id !== symptomId),
    })
  },

  analyzeSymptoms: async (petId, additionalInfo, petProfile) => {
    const { selectedSymptoms } = get()
    if (selectedSymptoms.length === 0) {
      set({ error: '请至少选择一个症状' })
      throw new Error('请至少选择一个症状')
    }

    set({ isLoading: true, error: null })
    try {
      const result = await analyzeSymptoms(petId, selectedSymptoms, additionalInfo, petProfile)
      set((state) => ({
        currentResult: result,
        history: [result, ...state.history],
        isLoading: false,
      }))
      const user = useAuthStore.getState().user
      if (user?.id) {
        queueSync('pet_symptom_checks', result.id, 'insert', result, user.id)
      }
      return result
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '症状分析失败',
      })
      throw err
    }
  },

  fetchHistory: async (petId: string) => {
    set({ isLoading: true, error: null })
    try {
      const history = await getCheckHistory(petId)
      set({ history, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取历史记录失败',
      })
    }
  },

  fetchCheckResult: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const result = await getCheckResult(id)
      if (result) {
        set({ currentResult: result, isLoading: false })
      } else {
        set({
          isLoading: false,
          error: '未找到该检查记录',
        })
      }
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取检查结果失败',
      })
    }
  },

  removeCheckResult: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await deleteCheckResult(id)
      set((state) => ({
        history: state.history.filter((item) => item.id !== id),
        currentResult: state.currentResult?.id === id ? null : state.currentResult,
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '删除检查记录失败',
      })
    }
  },

  clearSelection: () => {
    set({ selectedSymptoms: [], currentResult: null })
  },

  clearError: () => {
    set({ error: null })
  },
}))
