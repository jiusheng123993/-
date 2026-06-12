import { useState, useEffect, useCallback } from 'react'
import { taskService } from '../services/taskService'
import type { Task, CreateTaskInput, UpdateTaskInput } from '../data/repositories'

export function useTasks(userId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await taskService.getAllTasks(userId)
      setTasks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const createTask = useCallback(async (input: Omit<CreateTaskInput, 'userId'>): Promise<Task | null> => {
    if (!userId) return null
    setError(null)
    try {
      const task = await taskService.createTask(userId, input)
      setTasks((prev) => [task, ...prev])
      return task
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
      return null
    }
  }, [userId])

  const completeTask = useCallback(async (taskId: string): Promise<number | null> => {
    setError(null)
    try {
      const { task, experience } = await taskService.completeTask(taskId)
      setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)))
      return experience
    } catch (e) {
      setError(e instanceof Error ? e.message : '完成失败')
      return null
    }
  }, [])

  const updateTask = useCallback(async (taskId: string, patch: UpdateTaskInput): Promise<Task | null> => {
    setError(null)
    try {
      const updated = await taskService.updateTask(taskId, patch)
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)))
      return updated
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失败')
      return null
    }
  }, [])

  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    setError(null)
    try {
      await taskService.deleteTask(taskId)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
      return false
    }
  }, [])

  return {
    tasks,
    loading,
    error,
    createTask,
    completeTask,
    updateTask,
    deleteTask,
    refresh: loadTasks
  }
}
