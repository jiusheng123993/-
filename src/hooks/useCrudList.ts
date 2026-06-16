import { useState, useEffect, useCallback, useMemo } from 'react'
import { createErrorHandler } from '../utils/errorHandler'
import type { ToastMessage } from '../components/toast/Toast'

export interface CrudListOptions<T, CreateInput, UpdateInput> {
  userId: string | null
  loadFn: (userId: string) => Promise<T[]>
  createFn: (userId: string, input: CreateInput) => Promise<T>
  updateFn: (id: string, patch: UpdateInput) => Promise<T>
  deleteFn: (id: string) => Promise<void>
  moduleName: string
  addToast?: (toast: Omit<ToastMessage, 'id'>) => void
}

export interface CrudListResult<T, CreateInput, UpdateInput> {
  items: T[]
  loading: boolean
  error: string | null
  create: (input: CreateInput) => Promise<T | null>
  update: (id: string, patch: UpdateInput) => Promise<T | null>
  remove: (id: string) => Promise<boolean>
  refresh: () => void
}

export function useCrudList<T extends { id: string }, CreateInput, UpdateInput>(
  options: CrudListOptions<T, CreateInput, UpdateInput>
): CrudListResult<T, CreateInput, UpdateInput> {
  const { userId, loadFn, createFn, updateFn, deleteFn, moduleName, addToast } = options

  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleError = useMemo(
    () => createErrorHandler({ setError, addToast, moduleName }),
    [addToast, moduleName]
  )

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await loadFn(userId)
      setItems(data)
    } catch (e) {
      handleError(e, '加载失败')
    } finally {
      setLoading(false)
    }
  }, [userId, loadFn, handleError])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (input: CreateInput): Promise<T | null> => {
      if (!userId) return null
      setError(null)
      try {
        const result = await createFn(userId, input)
        setItems((prev) => [result, ...prev])
        return result
      } catch (e) {
        handleError(e, '创建失败')
        return null
      }
    },
    [userId, createFn, handleError]
  )

  const update = useCallback(
    async (id: string, patch: UpdateInput): Promise<T | null> => {
      setError(null)
      try {
        const result = await updateFn(id, patch)
        setItems((prev) => prev.map((item) => (item.id === id ? result : item)))
        return result
      } catch (e) {
        handleError(e, '更新失败')
        return null
      }
    },
    [updateFn, handleError]
  )

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null)
      try {
        await deleteFn(id)
        setItems((prev) => prev.filter((item) => item.id !== id))
        return true
      } catch (e) {
        handleError(e, '删除失败')
        return false
      }
    },
    [deleteFn, handleError]
  )

  return {
    items,
    loading,
    error,
    create,
    update,
    remove,
    refresh: load,
  }
}
