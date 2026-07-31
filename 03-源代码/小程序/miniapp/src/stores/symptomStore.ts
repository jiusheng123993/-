/**
 * 症状自查状态管理
 * 管理症状分类、症状选择、AI 分析结果和历史记录
 */
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

/** 症状状态定义 */
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

  /**
   * 获取症状分类列表
   * @param species - 筛选物种（cat/dog）
   */
  fetchCategories: (species?: 'cat' | 'dog') => {
    const categories = getSymptomCategories(species)
    set({ categories })
  },

  /** 选中一个症状 */
  selectSymptom: (symptomId: string) => {
    const { selectedSymptoms } = get()
    if (selectedSymptoms.includes(symptomId)) {
      return
    }
    set({ selectedSymptoms: [...selectedSymptoms, symptomId] })
  },

  /** 取消选中一个症状 */
  deselectSymptom: (symptomId: string) => {
    const { selectedSymptoms } = get()
    set({
      selectedSymptoms: selectedSymptoms.filter((id) => id !== symptomId),
    })
  },

  /**
   * 对已选症状进行 AI 分析
   * @param petId - 宠物 ID
   * @param additionalInfo - 附加信息
   * @param petProfile - 宠物档案
   * @returns 分析结果
   */
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

  /**
   * 获取历史检查记录
   * @param petId - 宠物 ID
   */
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

  /**
   * 获取单条检查结果详情
   * @param id - 检查记录 ID
   */
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

  /**
   * 删除检查记录
   * @param id - 检查记录 ID
   */
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

  /** 清空已选症状和当前结果 */
  clearSelection: () => {
    set({ selectedSymptoms: [], currentResult: null })
  },

  /** 清除错误状态 */
  clearError: () => {
    set({ error: null })
  },
}))
