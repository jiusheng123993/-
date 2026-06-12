import { useState, useEffect, useCallback } from 'react'
import { habitService } from '../services/habitService'
import type { Habit, CreateHabitInput, UpdateHabitInput } from '../data/repositories'

export function useHabits(userId: string | null) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHabits = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await habitService.getHabits(userId)
      setHabits(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  const createHabit = useCallback(async (input: Omit<CreateHabitInput, 'userId'>): Promise<Habit | null> => {
    if (!userId) return null
    setError(null)
    try {
      const habit = await habitService.createHabit(userId, input)
      setHabits((prev) => [habit, ...prev])
      return habit
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
      return null
    }
  }, [userId])

  const checkIn = useCallback(async (habitId: string): Promise<Habit | null> => {
    setError(null)
    try {
      const updated = await habitService.checkIn(habitId)
      setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)))
      return updated
    } catch (e) {
      setError(e instanceof Error ? e.message : '打卡失败')
      return null
    }
  }, [])

  const updateHabit = useCallback(async (habitId: string, patch: UpdateHabitInput): Promise<Habit | null> => {
    setError(null)
    try {
      const updated = await habitService.updateHabit(habitId, patch)
      setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)))
      return updated
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失败')
      return null
    }
  }, [])

  const deleteHabit = useCallback(async (habitId: string): Promise<boolean> => {
    setError(null)
    try {
      await habitService.deleteHabit(habitId)
      setHabits((prev) => prev.filter((h) => h.id !== habitId))
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
      return false
    }
  }, [])

  return {
    habits,
    loading,
    error,
    createHabit,
    checkIn,
    updateHabit,
    deleteHabit,
    refresh: loadHabits
  }
}
