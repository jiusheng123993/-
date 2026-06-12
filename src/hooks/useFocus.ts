import { useState, useEffect, useCallback } from 'react'
import { focusService } from '../services/focusService'
import type { FocusSession } from '../data/repositories'

export function useFocus(userId: string | null) {
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null)
  const [totalTime, setTotalTime] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [data, total] = await Promise.all([
        focusService.getHistory(userId),
        focusService.getTotalFocusTime(userId)
      ])
      setSessions(data)
      setTotalTime(total)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const startSession = useCallback(async (mode?: string): Promise<FocusSession | null> => {
    if (!userId) return null
    setError(null)
    try {
      const session = await focusService.startSession(userId, mode)
      setActiveSession(session)
      return session
    } catch (e) {
      setError(e instanceof Error ? e.message : '开始失败')
      return null
    }
  }, [userId])

  const endSession = useCallback(async (): Promise<number | null> => {
    if (!activeSession) return null
    setError(null)
    try {
      const { session, experience } = await focusService.endSession(activeSession.id)
      setActiveSession(null)
      setSessions((prev) => [session, ...prev])
      setTotalTime((prev) => prev + session.duration)
      return experience
    } catch (e) {
      setError(e instanceof Error ? e.message : '结束失败')
      return null
    }
  }, [activeSession])

  return {
    sessions,
    activeSession,
    totalTime,
    loading,
    error,
    startSession,
    endSession,
    refresh: loadHistory
  }
}
