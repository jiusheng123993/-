import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useEvolutionRitual } from './useEvolutionRitual'
import { evolutionStorage } from './evolutionStorage'
import { reflectionEngine } from './reflectionEngine'
import type { EvolutionEntry } from './evolutionRitualTypes'
import type { MemoryEvent, MemoryProfile } from '../../memory/memoryTypes'
import type { SummarizeResult } from './reflectionEngineTypes'

vi.mock('./evolutionStorage', () => ({
  evolutionStorage: {
    save: vi.fn(),
    getById: vi.fn(),
    getByUser: vi.fn(),
    getPending: vi.fn(),
    updateDecision: vi.fn(),
  },
}))

vi.mock('./reflectionEngine', () => ({
  reflectionEngine: {
    shouldTrigger: vi.fn(),
    executeReflection: vi.fn(),
    createEntry: vi.fn(),
    getDefaultTriggers: vi.fn(),
  },
}))

function makeEvent(overrides: Partial<MemoryEvent> & { id: string }): MemoryEvent {
  return {
    scope: { userId: 'u1', projectId: 'p1' },
    kind: 'habit',
    content: 'test event',
    source: 'behavior',
    confidence: 0.8,
    status: 'active',
    tags: [],
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
    expiresAt: null,
    ...overrides,
  }
}

function makeProfile(overrides: Partial<MemoryProfile> = {}): MemoryProfile {
  return {
    version: 1,
    scope: { userId: 'u1', projectId: 'p1' },
    identity: { nickname: '测试用户', currentRole: '学生' },
    personality: { traits: [], planningStyle: 'structured', workStyle: 'morning' },
    rhythm: { energyPeak: 'morning' },
    goals: { primaryGoal: '通过考试', secondaryGoals: ['每天学习2小时'] },
    preferences: { encouragementStyle: 'warm', languageStyle: 'casual' },
    boundaries: { tabooTopics: [] },
    learning: { learningStyle: 'visual', effectiveStrategies: ['笔记法'] },
    emotional: { motivationLevel: 'medium' },
    meta: {
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      lastReflectionAt: '2026-05-25T00:00:00Z',
      totalEventsProcessed: 10,
      sourceBreakdown: { manual: 3, conversation: 4, behavior: 3 },
    },
    ...overrides,
  }
}

function makeEntry(overrides: Partial<EvolutionEntry> = {}): EvolutionEntry {
  return {
    id: 'evo-test-1',
    userId: 'u1',
    triggeredBy: 'cron',
    triggerDetail: 'Weekly reflection triggered',
    proposedChanges: [
      {
        fieldPath: 'emotional.motivationLevel',
        oldValue: 'medium',
        newValue: 'high',
        reasoning: '近期表现良好',
        evidenceEventIds: ['e1'],
        confidence: 0.85,
      },
    ],
    userDecision: 'pending',
    finalChanges: [],
    reflectionNote: '测试反思笔记',
    createdAt: '2026-06-01T10:00:00Z',
    ...overrides,
  }
}

describe('useEvolutionRitual', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('returns default state when userId is undefined', () => {
      const { result } = renderHook(() =>
        useEvolutionRitual(undefined)
      )

      expect(result.current.pendingEntry).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    it('returns default state with userId but no events', async () => {
      vi.mocked(evolutionStorage.getPending).mockResolvedValue([])
      vi.mocked(evolutionStorage.getByUser).mockResolvedValue([])
      vi.mocked(reflectionEngine.shouldTrigger).mockReturnValue(false)

      const { result } = renderHook(() =>
        useEvolutionRitual('u1')
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.pendingEntry).toBeNull()
    })
  })

  describe('pending entry retrieval', () => {
    it('loads existing pending entry on mount', async () => {
      const pendingEntry = makeEntry()
      vi.mocked(evolutionStorage.getPending).mockResolvedValue([pendingEntry])

      const { result } = renderHook(() =>
        useEvolutionRitual('u1')
      )

      await waitFor(() => {
        expect(result.current.pendingEntry).toEqual(pendingEntry)
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('does not check again after first check', async () => {
      vi.mocked(evolutionStorage.getPending).mockResolvedValue([])
      vi.mocked(evolutionStorage.getByUser).mockResolvedValue([])
      vi.mocked(reflectionEngine.shouldTrigger).mockReturnValue(false)

      const { result, rerender } = renderHook(() =>
        useEvolutionRitual('u1')
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      rerender()

      expect(evolutionStorage.getPending).toHaveBeenCalledTimes(1)
    })
  })

  describe('reflection trigger and entry creation', () => {
    it('creates entry when shouldTrigger returns true', async () => {
      vi.mocked(evolutionStorage.getPending).mockResolvedValue([])
      vi.mocked(evolutionStorage.getByUser).mockResolvedValue([])
      vi.mocked(reflectionEngine.shouldTrigger).mockReturnValue(true)

      const reflectionResult: SummarizeResult = {
        proposedChanges: [
          {
            fieldPath: 'emotional.motivationLevel',
            oldValue: 'medium',
            newValue: 'high',
            reasoning: '表现良好',
            evidenceEventIds: [],
            confidence: 0.85,
          },
        ],
        reflectionNote: '本周表现不错',
        confidence: 0.85,
      }
      vi.mocked(reflectionEngine.executeReflection).mockResolvedValue(reflectionResult)

      const createdEntry = makeEntry({ id: 'evo-new-1' })
      vi.mocked(reflectionEngine.createEntry).mockReturnValue(createdEntry)

      const events = [makeEvent({ id: 'e1' })]
      const profile = makeProfile()

      const { result } = renderHook(() =>
        useEvolutionRitual('u1', events, profile)
      )

      await waitFor(() => {
        expect(result.current.pendingEntry).not.toBeNull()
      })

      expect(reflectionEngine.shouldTrigger).toHaveBeenCalled()
      expect(reflectionEngine.executeReflection).toHaveBeenCalledWith(profile, events)
      expect(reflectionEngine.createEntry).toHaveBeenCalledWith(
        'cron',
        'Weekly reflection triggered',
        events,
        'u1'
      )
      expect(evolutionStorage.save).toHaveBeenCalled()
    })

    it('uses default profile when memoryProfile is not provided', async () => {
      vi.mocked(evolutionStorage.getPending).mockResolvedValue([])
      vi.mocked(evolutionStorage.getByUser).mockResolvedValue([])
      vi.mocked(reflectionEngine.shouldTrigger).mockReturnValue(true)

      const reflectionResult: SummarizeResult = {
        proposedChanges: [],
        reflectionNote: '无特别变化',
        confidence: 0.5,
      }
      vi.mocked(reflectionEngine.executeReflection).mockResolvedValue(reflectionResult)

      const createdEntry = makeEntry({ id: 'evo-new-2' })
      vi.mocked(reflectionEngine.createEntry).mockReturnValue(createdEntry)

      const { result } = renderHook(() =>
        useEvolutionRitual('u1', [])
      )

      await waitFor(() => {
        expect(result.current.pendingEntry).not.toBeNull()
      })

      expect(reflectionEngine.executeReflection).toHaveBeenCalledWith(
        expect.objectContaining({
          identity: expect.objectContaining({ nickname: 'u1' }),
          emotional: expect.objectContaining({ motivationLevel: 'medium' }),
        }),
        []
      )
    })

    it('skips when already has entry this week', async () => {
      vi.mocked(evolutionStorage.getPending).mockResolvedValue([])
      const thisWeekEntry = makeEntry({
        id: 'evo-this-week',
        createdAt: new Date().toISOString(),
      })
      vi.mocked(evolutionStorage.getByUser).mockResolvedValue([thisWeekEntry])

      const { result } = renderHook(() =>
        useEvolutionRitual('u1')
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.pendingEntry).toBeNull()
      expect(reflectionEngine.shouldTrigger).not.toHaveBeenCalled()
    })

    it('handles error gracefully', async () => {
      vi.mocked(evolutionStorage.getPending).mockRejectedValue(new Error('Storage error'))

      const { result } = renderHook(() =>
        useEvolutionRitual('u1')
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.pendingEntry).toBeNull()
    })
  })

  describe('handleAccept', () => {
    it('accepts entry and calls onProfileUpdate', async () => {
      const pendingEntry = makeEntry()
      vi.mocked(evolutionStorage.getPending).mockResolvedValue([pendingEntry])
      vi.mocked(evolutionStorage.getById).mockResolvedValue(pendingEntry)
      vi.mocked(evolutionStorage.updateDecision).mockResolvedValue(pendingEntry)

      const onProfileUpdate = vi.fn()
      const profile = makeProfile()

      const { result } = renderHook(() =>
        useEvolutionRitual('u1', [], profile, onProfileUpdate)
      )

      await waitFor(() => {
        expect(result.current.pendingEntry).not.toBeNull()
      })

      await act(async () => {
        await result.current.handleAccept('evo-test-1')
      })

      expect(evolutionStorage.updateDecision).toHaveBeenCalledWith('evo-test-1', 'accepted')
      expect(onProfileUpdate).toHaveBeenCalled()
      expect(result.current.pendingEntry).toBeNull()
    })

    it('does not call onProfileUpdate when profile is not provided', async () => {
      const pendingEntry = makeEntry()
      vi.mocked(evolutionStorage.getPending).mockResolvedValue([pendingEntry])
      vi.mocked(evolutionStorage.getById).mockResolvedValue(pendingEntry)
      vi.mocked(evolutionStorage.updateDecision).mockResolvedValue(pendingEntry)

      const onProfileUpdate = vi.fn()

      const { result } = renderHook(() =>
        useEvolutionRitual('u1', [], undefined, onProfileUpdate)
      )

      await waitFor(() => {
        expect(result.current.pendingEntry).not.toBeNull()
      })

      await act(async () => {
        await result.current.handleAccept('evo-test-1')
      })

      expect(onProfileUpdate).not.toHaveBeenCalled()
    })
  })

  describe('handleReject', () => {
    it('rejects entry and clears pending', async () => {
      const pendingEntry = makeEntry()
      vi.mocked(evolutionStorage.getPending).mockResolvedValue([pendingEntry])
      vi.mocked(evolutionStorage.updateDecision).mockResolvedValue(pendingEntry)

      const { result } = renderHook(() =>
        useEvolutionRitual('u1')
      )

      await waitFor(() => {
        expect(result.current.pendingEntry).not.toBeNull()
      })

      await act(async () => {
        await result.current.handleReject('evo-test-1')
      })

      expect(evolutionStorage.updateDecision).toHaveBeenCalledWith('evo-test-1', 'rejected')
      expect(result.current.pendingEntry).toBeNull()
    })
  })

  describe('handleModify', () => {
    it('modifies entry and calls onProfileUpdate with modified changes', async () => {
      const pendingEntry = makeEntry()
      vi.mocked(evolutionStorage.getPending).mockResolvedValue([pendingEntry])
      vi.mocked(evolutionStorage.getById).mockResolvedValue(pendingEntry)
      vi.mocked(evolutionStorage.updateDecision).mockResolvedValue(pendingEntry)

      const onProfileUpdate = vi.fn()
      const profile = makeProfile()

      const { result } = renderHook(() =>
        useEvolutionRitual('u1', [], profile, onProfileUpdate)
      )

      await waitFor(() => {
        expect(result.current.pendingEntry).not.toBeNull()
      })

      const modifiedChanges = [
        {
          fieldPath: 'emotional.motivationLevel',
          oldValue: 'medium',
          newValue: 'burnout_risk',
        },
      ]

      await act(async () => {
        await result.current.handleModify('evo-test-1', modifiedChanges)
      })

      expect(evolutionStorage.updateDecision).toHaveBeenCalledWith(
        'evo-test-1',
        'modified',
        modifiedChanges
      )
      expect(onProfileUpdate).toHaveBeenCalled()
      expect(result.current.pendingEntry).toBeNull()
    })
  })

  describe('handleClose', () => {
    it('rejects pending entry and clears it', async () => {
      const pendingEntry = makeEntry()
      vi.mocked(evolutionStorage.getPending).mockResolvedValue([pendingEntry])
      vi.mocked(evolutionStorage.updateDecision).mockResolvedValue(pendingEntry)

      const { result } = renderHook(() =>
        useEvolutionRitual('u1')
      )

      await waitFor(() => {
        expect(result.current.pendingEntry).not.toBeNull()
      })

      await act(async () => {
        await result.current.handleClose()
      })

      expect(evolutionStorage.updateDecision).toHaveBeenCalledWith('evo-test-1', 'rejected')
      expect(result.current.pendingEntry).toBeNull()
    })

    it('does nothing when no pending entry', async () => {
      vi.mocked(evolutionStorage.getPending).mockResolvedValue([])
      vi.mocked(evolutionStorage.getByUser).mockResolvedValue([])
      vi.mocked(reflectionEngine.shouldTrigger).mockReturnValue(false)

      const { result } = renderHook(() =>
        useEvolutionRitual('u1')
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.handleClose()
      })

      expect(evolutionStorage.updateDecision).not.toHaveBeenCalled()
    })
  })

  describe('refresh', () => {
    it('resets hasChecked and re-checks', async () => {
      vi.mocked(evolutionStorage.getPending).mockResolvedValue([])
      vi.mocked(evolutionStorage.getByUser).mockResolvedValue([])
      vi.mocked(reflectionEngine.shouldTrigger).mockReturnValue(false)

      const { result } = renderHook(() =>
        useEvolutionRitual('u1')
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const firstCallCount = vi.mocked(evolutionStorage.getPending).mock.calls.length

      await act(async () => {
        result.current.refresh()
      })

      await waitFor(() => {
        expect(vi.mocked(evolutionStorage.getPending).mock.calls.length).toBeGreaterThan(firstCallCount)
      })
    })
  })
})