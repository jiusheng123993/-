import { describe, it, expect } from 'vitest'
import { reflectionEngine, isSundayAt21, checkEventThresholds } from './reflectionEngine'
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
  })
})
