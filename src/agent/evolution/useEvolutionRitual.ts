import { useState, useEffect, useCallback } from 'react'
import type { EvolutionEntry } from './evolutionRitualTypes'
import type { MemoryEvent, MemoryProfile } from '../../memory/memoryTypes'
import type { ProfileChangeProposal } from './reflectionEngineTypes'
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

function applyProfileChanges(profile: MemoryProfile, changes: ProfileChangeProposal[]): MemoryProfile {
  const updated = { ...profile }
  for (const change of changes) {
    setNestedValue(updated, change.fieldPath, change.newValue)
  }
  return updated
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  let current: Record<string, unknown> = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {}
    }
    current = current[keys[i]] as Record<string, unknown>
  }
  current[keys[keys.length - 1]] = value
}

export function useEvolutionRitual(
  userId: string | undefined,
  memoryEvents?: MemoryEvent[],
  memoryProfile?: MemoryProfile,
  onProfileUpdate?: (updatedProfile: MemoryProfile) => void
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
          identity: { nickname: userId, currentRole: '' },
          personality: { traits: [], planningStyle: '' },
          rhythm: { energyPeak: 'unknown' },
          goals: { primaryGoal: '', secondaryGoals: [] },
          preferences: { encouragementStyle: '' },
          boundaries: { tabooTopics: [] },
          learning: { learningStyle: 'unknown', effectiveStrategies: [] },
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
    const entry = await evolutionStorage.getById(entryId)
    await evolutionStorage.updateDecision(entryId, 'accepted')
    
    if (entry && onProfileUpdate && memoryProfile) {
      const updatedProfile = applyProfileChanges(memoryProfile, entry.proposedChanges)
      onProfileUpdate(updatedProfile)
    }
    
    setPendingEntry(null)
  }, [memoryProfile, onProfileUpdate])

  const handleReject = useCallback(async (entryId: string) => {
    await evolutionStorage.updateDecision(entryId, 'rejected')
    setPendingEntry(null)
  }, [])

  const handleModify = useCallback(async (entryId: string, modifiedChanges: EvolutionEntry['finalChanges']) => {
    const entry = await evolutionStorage.getById(entryId)
    await evolutionStorage.updateDecision(entryId, 'modified', modifiedChanges)
    
    if (entry && onProfileUpdate && memoryProfile && modifiedChanges) {
      const proposals = modifiedChanges.map(c => ({
        fieldPath: c.fieldPath,
        oldValue: c.oldValue,
        newValue: c.newValue,
        reasoning: '',
        evidenceEventIds: [] as string[],
        confidence: 0.8
      }))
      const updatedProfile = applyProfileChanges(memoryProfile, proposals)
      onProfileUpdate(updatedProfile)
    }
    
    setPendingEntry(null)
  }, [memoryProfile, onProfileUpdate])

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
