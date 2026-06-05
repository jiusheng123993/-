import { useState, useEffect, useCallback } from 'react'
import type { EvolutionEntry } from './evolutionRitualTypes'
import type { MemoryEvent, MemoryProfile } from '../../memory/memoryTypes'
import { evolutionStorage } from './evolutionStorage'
import { reflectionEngine } from './reflectionEngine'

function getWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

export function useEvolutionRitual(
  userId: string | undefined,
  memoryEvents?: MemoryEvent[],
  memoryProfile?: MemoryProfile
) {
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

      const allEntries = await evolutionStorage.getByUser(userId)
      const currentWeekKey = getWeekKey(new Date())
      const hasEntryThisWeek = allEntries.some((entry) => {
        const entryWeekKey = getWeekKey(new Date(entry.createdAt))
        return entryWeekKey === currentWeekKey
      })

      if (hasEntryThisWeek) {
        setIsLoading(false)
        return
      }

      const now = new Date().toISOString()
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const events = memoryEvents || []
      
      const shouldTrigger = reflectionEngine.shouldTrigger(
        events,
        lastWeek,
        now,
        hasEntryThisWeek
      )
      
      if (shouldTrigger) {
        const profile = memoryProfile || {
          identity: { nickname: userId, role: '', mbti: 'unknown' },
          personality: { traits: [], planningStyle: '', workRhythm: '' },
          rhythm: { energyPeak: 'unknown' },
          goals: { primaryGoal: '', activeGoals: [] },
          preferences: { encouragementStyle: '', communicationStyle: '' },
          boundaries: { topicsToAvoid: [] },
          learning: { style: 'unknown', preferredMethods: [] },
          emotional: { motivationLevel: 'medium' }
        } as MemoryProfile

        const reflectionResult = await reflectionEngine.executeReflection(profile, events)
        
        const entry = reflectionEngine.createEntry(
          'cron',
          'Weekly reflection triggered',
          events,
          userId
        )
        
        entry.reflectionNote = reflectionResult.reflectionNote
        entry.proposedChanges = reflectionResult.proposedChanges
        
        await evolutionStorage.save(entry)
        setPendingEntry(entry)
      }
    } catch (error) {
      console.error('Failed to check evolution entry:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, hasChecked, memoryEvents, memoryProfile])

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

  const handleClose = useCallback(async () => {
    if (pendingEntry) {
      await evolutionStorage.updateDecision(pendingEntry.id, 'rejected')
    }
    setPendingEntry(null)
  }, [pendingEntry])

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
