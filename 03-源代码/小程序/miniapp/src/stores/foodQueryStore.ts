import { create } from 'zustand'
import type { PetFoodQuery } from '../memory-body/types/memoryBodyTypes'
export type { PetFoodQuery }
import type { FoodQueryStats } from '../services/foodService'
export type { FoodQueryStats }
import { queryFood, getQueryHistory, getQueryStats } from '../services/foodService'

interface FoodQueryStoreState {
  history: PetFoodQuery[]
  lastResult: PetFoodQuery | null
  stats: FoodQueryStats | null
  isLoading: boolean
  error: string | null

  queryFood: (userId: string, petId: string, foodName: string, species: 'dog' | 'cat') => Promise<PetFoodQuery>
  fetchHistory: (petId: string, userId: string) => Promise<void>
  fetchStats: (petId: string, userId: string) => Promise<void>
  clearError: () => void
}

export const useFoodQueryStore = create<FoodQueryStoreState>((set) => ({
  history: [],
  lastResult: null,
  stats: null,
  isLoading: false,
  error: null,

  queryFood: async (userId, petId, foodName, species) => {
    set({ isLoading: true, error: null })
    try {
      const result = await queryFood(userId, petId, foodName, species)
      set((state) => ({
        lastResult: result,
        history: [result, ...state.history],
        isLoading: false
      }))
      return result
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '查询食物安全性失败'
      })
      throw err
    }
  },

  fetchHistory: async (petId, userId) => {
    set({ isLoading: true, error: null })
    try {
      const history = await getQueryHistory(petId, userId)
      set({ history, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取查询历史失败'
      })
    }
  },

  fetchStats: async (petId, userId) => {
    set({ isLoading: true, error: null })
    try {
      const stats = await getQueryStats(petId, userId)
      set({ stats, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取查询统计失败'
      })
    }
  },

  clearError: () => {
    set({ error: null })
  }
}))
