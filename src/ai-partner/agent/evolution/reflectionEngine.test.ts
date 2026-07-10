import { describe, it, expect } from 'vitest'
import { reflectionEngine, isSundayAt21, checkEventThresholds, countEventsByCategory } from './reflectionEngine'
import type { MemoryEvent, MemoryProfile } from '../../memory/memoryTypes'
import type { EventThreshold } from './reflectionEngineTypes'

function makeEvent(overrides: Partial<MemoryEvent> & { id: string; createdAt: string; tags?: string[] }): MemoryEvent {
  return {
    scope: { userId: 'u1', projectId: 'p1' },
    kind: 'habit',
    content: 'test event',
    source: 'behavior',
    confidence: 0.8,
    status: 'active',
    tags: overrides.tags ?? [],
    updatedAt: overrides.createdAt,
    expiresAt: null,
    ...overrides,
  }
}

function makeProfile(overrides: Partial<MemoryProfile> = {}): MemoryProfile {
  return {
    version: 1,
    scope: { userId: 'u1', projectId: 'p1' },
    identity: {},
    personality: {},
    rhythm: {},
    goals: {},
    preferences: {},
    boundaries: {},
    learning: {},
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

describe('reflectionEngine', () => {
  describe('shouldTrigger', () => {
    it('returns true for Sunday 21:00 cron', () => {
      const sunday21 = new Date('2026-06-07T21:00:00Z')
      const result = reflectionEngine.shouldTrigger(
        [],
        '2026-06-01T00:00:00Z',
        sunday21.toISOString()
      )
      expect(result).toBe(true)
    })

    it('returns false for non-Sunday', () => {
      const monday21 = new Date('2026-06-08T21:00:00Z')
      const result = reflectionEngine.shouldTrigger(
        [],
        '2026-06-06T00:00:00Z',
        monday21.toISOString()
      )
      expect(result).toBe(false)
    })

    it('returns false for Sunday but not 21:00', () => {
      const sunday10 = new Date('2026-06-07T10:00:00Z')
      const result = reflectionEngine.shouldTrigger(
        [],
        '2026-06-01T00:00:00Z',
        sunday10.toISOString()
      )
      expect(result).toBe(false)
    })

    it('returns true when schedule_anomaly threshold met', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-05T02:30:00Z', tags: ['schedule_anomaly'] }),
        makeEvent({ id: 'e2', createdAt: '2026-06-04T03:00:00Z', tags: ['schedule_anomaly'] }),
        makeEvent({ id: 'e3', createdAt: '2026-06-03T02:15:00Z', tags: ['schedule_anomaly'] }),
      ]
      const result = reflectionEngine.shouldTrigger(
        events,
        '2026-06-06T00:00:00Z',
        now.toISOString()
      )
      expect(result).toBe(true)
    })

    it('returns true when goal_completed threshold met', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-05T10:00:00Z', tags: ['goal_completed'] }),
      ]
      const result = reflectionEngine.shouldTrigger(
        events,
        '2026-06-06T00:00:00Z',
        now.toISOString()
      )
      expect(result).toBe(true)
    })

    it('returns true when no_reflection threshold met', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const lastReflection = '2026-05-30T00:00:00Z'
      const result = reflectionEngine.shouldTrigger([], lastReflection, now.toISOString())
      expect(result).toBe(true)
    })

    it('returns true when low_focus threshold met', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const events: MemoryEvent[] = Array.from({ length: 5 }, (_, i) =>
        makeEvent({ id: `e${i}`, createdAt: `2026-06-0${i + 2}T10:00:00Z`, tags: ['low_focus'] })
      )
      const result = reflectionEngine.shouldTrigger(
        events,
        '2026-06-06T00:00:00Z',
        now.toISOString()
      )
      expect(result).toBe(true)
    })

    it('returns true when exam_countdown threshold met', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-07T08:00:00Z', tags: ['exam_countdown'] }),
      ]
      const result = reflectionEngine.shouldTrigger(
        events,
        '2026-06-06T00:00:00Z',
        now.toISOString()
      )
      expect(result).toBe(true)
    })

    it('returns false when no thresholds met', () => {
      const now = new Date('2026-06-05T10:00:00Z')
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-04T10:00:00Z', tags: ['other'] }),
      ]
      const result = reflectionEngine.shouldTrigger(
        events,
        '2026-06-04T00:00:00Z',
        now.toISOString()
      )
      expect(result).toBe(false)
    })
  })

  describe('executeReflection', () => {
    it('returns SummarizeResult with proposals', async () => {
      const profile = makeProfile()
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-01T10:00:00Z' }),
        makeEvent({ id: 'e2', createdAt: '2026-06-02T10:00:00Z' }),
      ]
      const result = await reflectionEngine.executeReflection(profile, events)
      expect(result).toHaveProperty('proposedChanges')
      expect(result).toHaveProperty('reflectionNote')
      expect(result).toHaveProperty('confidence')
      expect(typeof result.confidence).toBe('number')
    })

    it('filters out proposals with confidence below 0.6', async () => {
      const profile = makeProfile()
      const events: MemoryEvent[] = []
      const result = await reflectionEngine.executeReflection(profile, events)
      for (const proposal of result.proposedChanges) {
        expect(proposal.confidence).toBeGreaterThanOrEqual(0.6)
      }
    })
  })

  describe('getDefaultTriggers', () => {
    it('returns expected configuration', () => {
      const triggers = reflectionEngine.getDefaultTriggers()
      expect(triggers).toHaveLength(2)

      const cronTrigger = triggers.find((t) => t.type === 'cron')
      expect(cronTrigger).toBeDefined()
      expect(cronTrigger!.cronSchedule).toBe('0 21 * * 0')

      const thresholdTrigger = triggers.find((t) => t.type === 'event_threshold')
      expect(thresholdTrigger).toBeDefined()
      expect(thresholdTrigger!.eventThresholds).toHaveLength(5)

      const categories = thresholdTrigger!.eventThresholds.map((t) => t.category)
      expect(categories).toContain('schedule_anomaly')
      expect(categories).toContain('goal_completed')
      expect(categories).toContain('no_reflection')
      expect(categories).toContain('low_focus')
      expect(categories).toContain('exam_countdown')
    })
  })

  describe('isSundayAt21', () => {
    it('returns true for Sunday 21:00', () => {
      expect(isSundayAt21(new Date('2026-06-07T21:00:00Z'))).toBe(true)
    })

    it('returns false for Monday 21:00', () => {
      expect(isSundayAt21(new Date('2026-06-08T21:00:00Z'))).toBe(false)
    })

    it('returns false for Sunday 20:00', () => {
      expect(isSundayAt21(new Date('2026-06-07T20:00:00Z'))).toBe(false)
    })
  })

  describe('checkEventThresholds', () => {
    it('detects schedule_anomaly with late night events', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-05T02:30:00Z', tags: ['schedule_anomaly'] }),
        makeEvent({ id: 'e2', createdAt: '2026-06-04T03:00:00Z', tags: ['schedule_anomaly'] }),
        makeEvent({ id: 'e3', createdAt: '2026-06-03T02:15:00Z', tags: ['schedule_anomaly'] }),
      ]
      const thresholds: EventThreshold[] = [
        { category: 'schedule_anomaly', count: 3, windowDays: 7, description: '凌晨2点后仍在记录' },
      ]
      expect(checkEventThresholds(events, '2026-06-06T00:00:00Z', now, thresholds)).toBe(true)
    })

    it('does not trigger schedule_anomaly for early events', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-05T10:30:00Z', tags: ['schedule_anomaly'] }),
        makeEvent({ id: 'e2', createdAt: '2026-06-04T11:00:00Z', tags: ['schedule_anomaly'] }),
        makeEvent({ id: 'e3', createdAt: '2026-06-03T09:15:00Z', tags: ['schedule_anomaly'] }),
      ]
      const thresholds: EventThreshold[] = [
        { category: 'schedule_anomaly', count: 3, windowDays: 7, description: '凌晨2点后仍在记录' },
      ]
      expect(checkEventThresholds(events, '2026-06-06T00:00:00Z', now, thresholds)).toBe(false)
    })

    it('detects goal_completed threshold', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-05T10:00:00Z', tags: ['goal_completed'] }),
      ]
      const thresholds: EventThreshold[] = [
        { category: 'goal_completed', count: 1, windowDays: 30, description: '目标达成' },
      ]
      expect(checkEventThresholds(events, '2026-06-06T00:00:00Z', now, thresholds)).toBe(true)
    })

    it('detects no_reflection threshold', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const thresholds: EventThreshold[] = [
        { category: 'no_reflection', count: 1, windowDays: 7, description: '连续7天无复盘' },
      ]
      expect(checkEventThresholds([], '2026-05-30T00:00:00Z', now, thresholds)).toBe(true)
    })

    it('does not trigger no_reflection when recent reflection exists', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const thresholds: EventThreshold[] = [
        { category: 'no_reflection', count: 1, windowDays: 7, description: '连续7天无复盘' },
      ]
      expect(checkEventThresholds([], '2026-06-05T00:00:00Z', now, thresholds)).toBe(false)
    })

    it('detects low_focus threshold', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const events: MemoryEvent[] = Array.from({ length: 5 }, (_, i) =>
        makeEvent({ id: `e${i}`, createdAt: `2026-06-0${i + 2}T10:00:00Z`, tags: ['low_focus'] })
      )
      const thresholds: EventThreshold[] = [
        { category: 'low_focus', count: 5, windowDays: 7, description: '连续5天专注时长低于目标的50%' },
      ]
      expect(checkEventThresholds(events, '2026-06-06T00:00:00Z', now, thresholds)).toBe(true)
    })

    it('detects exam_countdown threshold', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-07T08:00:00Z', tags: ['exam_countdown'] }),
      ]
      const thresholds: EventThreshold[] = [
        { category: 'exam_countdown', count: 1, windowDays: 1, description: '考试倒计时归零' },
      ]
      expect(checkEventThresholds(events, '2026-06-06T00:00:00Z', now, thresholds)).toBe(true)
    })

    it('returns false when no thresholds match', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-05T10:00:00Z', tags: ['other'] }),
      ]
      const thresholds: EventThreshold[] = [
        { category: 'goal_completed', count: 1, windowDays: 7, description: '目标达成' },
      ]
      expect(checkEventThresholds(events, '2026-06-06T00:00:00Z', now, thresholds)).toBe(false)
    })
  })

  describe('countEventsByCategory', () => {
    it('counts events with matching category tag within window', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-05T10:00:00Z', tags: ['goal_completed'] }),
        makeEvent({ id: 'e2', createdAt: '2026-06-04T10:00:00Z', tags: ['goal_completed'] }),
        makeEvent({ id: 'e3', createdAt: '2026-06-01T10:00:00Z', tags: ['other'] }),
      ]
      const count = countEventsByCategory(events, 'goal_completed', now, 7)
      expect(count).toBe(2)
    })

    it('excludes events outside window', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-05-20T10:00:00Z', tags: ['goal_completed'] }),
      ]
      const count = countEventsByCategory(events, 'goal_completed', now, 7)
      expect(count).toBe(0)
    })

    it('returns 0 for empty events', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const count = countEventsByCategory([], 'goal_completed', now, 7)
      expect(count).toBe(0)
    })
  })

  describe('createEntry', () => {
    it('creates entry with correct structure', () => {
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-01T10:00:00Z' }),
      ]
      const entry = reflectionEngine.createEntry('cron', 'Weekly reflection', events, 'u1')

      expect(entry.id).toMatch(/^evo-/)
      expect(entry.userId).toBe('u1')
      expect(entry.triggeredBy).toBe('cron')
      expect(entry.triggerDetail).toBe('Weekly reflection')
      expect(entry.userDecision).toBe('pending')
      expect(entry.proposedChanges).toEqual([])
      expect(entry.finalChanges).toEqual([])
      expect(entry.reflectionNote).toBe('')
      expect(entry.createdAt).toBeTruthy()
    })

    it('creates entry with event_threshold trigger', () => {
      const entry = reflectionEngine.createEntry('event_threshold', 'Schedule anomaly detected', [], 'u2')

      expect(entry.triggeredBy).toBe('event_threshold')
      expect(entry.triggerDetail).toBe('Schedule anomaly detected')
      expect(entry.userId).toBe('u2')
    })

    it('creates entry with manual trigger', () => {
      const entry = reflectionEngine.createEntry('manual', 'User requested reflection', [], 'u3')

      expect(entry.triggeredBy).toBe('manual')
      expect(entry.userId).toBe('u3')
    })

    it('generates unique IDs', () => {
      const entry1 = reflectionEngine.createEntry('cron', '', [], 'u1')
      const entry2 = reflectionEngine.createEntry('cron', '', [], 'u1')

      expect(entry1.id).not.toBe(entry2.id)
    })
  })

  describe('executeReflection rule-based fallback', () => {
    it('returns motivation proposal when many tasks completed', async () => {
      const profile = makeProfile()
      const events: MemoryEvent[] = Array.from({ length: 5 }, (_, i) =>
        makeEvent({
          id: `task-${i}`,
          createdAt: `2026-06-0${i + 1}T10:00:00Z`,
          category: 'task_completed',
        })
      )

      const result = await reflectionEngine.executeReflection(profile, events)

      const motivationChange = result.proposedChanges.find(
        p => p.fieldPath === 'emotional.motivationLevel'
      )
      expect(motivationChange).toBeDefined()
      expect(motivationChange!.newValue).toBe('high')
      expect(motivationChange!.confidence).toBeGreaterThanOrEqual(0.6)
    })

    it('returns energyPeak proposal when many focus sessions', async () => {
      const profile = makeProfile()
      const events: MemoryEvent[] = Array.from({ length: 3 }, (_, i) =>
        makeEvent({
          id: `focus-${i}`,
          createdAt: `2026-06-0${i + 1}T10:00:00Z`,
          category: 'focus_completed',
        })
      )

      const result = await reflectionEngine.executeReflection(profile, events)

      const energyChange = result.proposedChanges.find(
        p => p.fieldPath === 'rhythm.energyPeak'
      )
      expect(energyChange).toBeDefined()
      expect(energyChange!.newValue).toBe('morning')
    })

    it('returns goal review proposal when no goal updates with many events', async () => {
      const profile = makeProfile()
      const events: MemoryEvent[] = Array.from({ length: 11 }, (_, i) =>
        makeEvent({
          id: `evt-${i}`,
          createdAt: `2026-06-0${(i % 7) + 1}T10:00:00Z`,
          category: 'other',
        })
      )

      const result = await reflectionEngine.executeReflection(profile, events)

      const goalChange = result.proposedChanges.find(
        p => p.fieldPath === 'goals.primaryGoal'
      )
      expect(goalChange).toBeDefined()
    })

    it('returns empty proposals when no conditions met', async () => {
      const profile = makeProfile()
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-01T10:00:00Z', category: 'other' }),
      ]

      const result = await reflectionEngine.executeReflection(profile, events)

      expect(result.proposedChanges).toEqual([])
      expect(result.reflectionNote).toContain('近期活动较少')
    })

    it('returns reflection note with task and focus counts', async () => {
      const profile = makeProfile()
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-01T10:00:00Z', category: 'task_completed' }),
        makeEvent({ id: 'e2', createdAt: '2026-06-02T10:00:00Z', category: 'focus_completed' }),
      ]

      const result = await reflectionEngine.executeReflection(profile, events)

      expect(result.reflectionNote).toContain('1 个任务')
      expect(result.reflectionNote).toContain('1 次专注')
    })
  })

  describe('shouldTrigger with hasEntryThisWeek', () => {
    it('returns false for cron when hasEntryThisWeek is true', () => {
      const sunday21 = new Date('2026-06-07T21:00:00Z')
      const result = reflectionEngine.shouldTrigger(
        [],
        '2026-06-01T00:00:00Z',
        sunday21.toISOString(),
        true
      )
      expect(result).toBe(false)
    })

    it('still returns true for event_threshold even when hasEntryThisWeek is true', () => {
      const now = new Date('2026-06-07T10:00:00Z')
      const events: MemoryEvent[] = [
        makeEvent({ id: 'e1', createdAt: '2026-06-05T02:30:00Z', tags: ['schedule_anomaly'] }),
        makeEvent({ id: 'e2', createdAt: '2026-06-04T03:00:00Z', tags: ['schedule_anomaly'] }),
        makeEvent({ id: 'e3', createdAt: '2026-06-03T02:15:00Z', tags: ['schedule_anomaly'] }),
      ]
      const result = reflectionEngine.shouldTrigger(
        events,
        '2026-06-06T00:00:00Z',
        now.toISOString(),
        true
      )
      expect(result).toBe(true)
    })
  })
})
