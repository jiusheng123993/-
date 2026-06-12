import { useState, useEffect, useCallback } from 'react'
import { journalService } from '../services/journalService'
import type { Journal, CreateJournalInput, UpdateJournalInput } from '../data/repositories'

export function useJournal(userId: string | null) {
  const [entries, setEntries] = useState<Journal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEntries = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await journalService.getEntries(userId)
      setEntries(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const createEntry = useCallback(async (input: Omit<CreateJournalInput, 'userId'>): Promise<Journal | null> => {
    if (!userId) return null
    setError(null)
    try {
      const entry = await journalService.createEntry(userId, input)
      setEntries((prev) => [entry, ...prev])
      return entry
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
      return null
    }
  }, [userId])

  const updateEntry = useCallback(async (entryId: string, patch: UpdateJournalInput): Promise<Journal | null> => {
    setError(null)
    try {
      const updated = await journalService.updateEntry(entryId, patch)
      setEntries((prev) => prev.map((e) => (e.id === entryId ? updated : e)))
      return updated
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失败')
      return null
    }
  }, [])

  const deleteEntry = useCallback(async (entryId: string): Promise<boolean> => {
    setError(null)
    try {
      await journalService.deleteEntry(entryId)
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
      return false
    }
  }, [])

  return {
    entries,
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    refresh: loadEntries
  }
}
