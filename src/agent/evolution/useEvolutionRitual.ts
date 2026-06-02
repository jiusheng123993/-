import { useState, useEffect, useCallback } from 'react'
import type { EvolutionEntry } from './evolutionRitualTypes'
import { evolutionStorage } from './evolutionStorage'
import { reflectionEngine } from './reflectionEngine'
import type { MemoryEvent } from '../../memory/memoryTypes'

export function useEvolutionRitual(userId: string | undefined) {
  const [pendingEntry, setPendingEntry] = useState<EvolutionEntry | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  const checkAndCreateEntry = useCallback(async () => {
    if (!userId || hasChecked) return
    
    setHasChecked(true)
    setIsLoading(true)
    
    try {
      const pending = await evolutionStorage.getPending(userId)
      if (pending.length > 0) {
        setPendingEntry(pending[0])
        setIsLoading(false)
        return
      }

      const shouldTrigger = reflectionEngine.shouldTrigger(
        [],
        undefined,
        undefined
      )
      
      if (shouldTrigger) {
        const entry = reflectionEngine.createEntry(
          'cron',
          'Weekly reflection triggered',
          []
        )
        await evolutionStorage.save(entry)
        setPendingEntry(entry)
      }
    } catch (error) {
      console.error('Failed to check evolution entry:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, hasChecked])

  useEffect(() => {
    checkAndCreateEntry()
  }, [checkAndCreateEntry])

  const handleAccept = useCallback(async (entryId: string) => {
    await evolutionStorage.updateDecision(entryId, 'accepted')
    setPendingEntry(null)
  }, [])

  const handleReject = useCallback(async (entryId: string) => {
    await evolutionStorage.updateDecision(entryId, 'rejected')
    setPendingEntry(null)
  }, [])

  const handleModify = useCallback(async (entryId: string, modifiedChanges: EvolutionEntry['finalChanges']) => {
    await evolutionStorage.updateDecision(entryId, 'modified', modifiedChanges)
    setPendingEntry(null)
  }, [])

  const handleClose = useCallback(() => {
    setPendingEntry(null)
  }, [])

  const refresh = useCallback(() => {
    setHasChecked(false)
    checkAndCreateEntry()
  }, [checkAndCreateEntry])

  return {
    pendingEntry,
    isLoading,
    handleAccept,
    handleReject,
    handleModify,
    handleClose,
    refresh
  }
}
