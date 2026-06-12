import { useState, useEffect, useCallback } from 'react'
import { goalService, type GrowthReward } from '../services/goalService'
import type { Goal, CreateGoalInput, UpdateGoalInput } from '../data/repositories'

export function useGoals(userId: string | null) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadGoals = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await goalService.getAllGoals(userId)
      setGoals(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  const createGoal = useCallback(async (input: Omit<CreateGoalInput, 'userId'>): Promise<Goal | null> => {
    if (!userId) return null
    setError(null)
    try {
      const goal = await goalService.createGoal(userId, input)
      setGoals((prev) => [goal, ...prev])
      return goal
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
      return null
    }
  }, [userId])

  const updateGoal = useCallback(async (goalId: string, patch: UpdateGoalInput): Promise<Goal | null> => {
    setError(null)
    try {
      const updated = await goalService.updateProgress(goalId, patch.progress ?? 0)
      setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)))
      return updated
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失败')
      return null
    }
  }, [])

  const completeGoal = useCallback(async (goalId: string): Promise<GrowthReward | null> => {
    setError(null)
    try {
      const { goal, reward } = await goalService.completeGoal(goalId)
      setGoals((prev) => prev.map((g) => (g.id === goalId ? goal : g)))
      return reward
    } catch (e) {
      setError(e instanceof Error ? e.message : '完成失败')
      return null
    }
  }, [])

  const deleteGoal = useCallback(async (goalId: string): Promise<boolean> => {
    setError(null)
    try {
      await goalService.deleteGoal(goalId)
      setGoals((prev) => prev.filter((g) => g.id !== goalId))
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
      return false
    }
  }, [])

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    completeGoal,
    deleteGoal,
    refresh: loadGoals
  }
}
