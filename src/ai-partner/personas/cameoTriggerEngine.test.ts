import { describe, expect, it, beforeEach } from 'vitest'
import {
  createCameoTriggerEngine,
  buildTriggerContextFromMemoryObserver,
  DEFAULT_RULES,
  HOLIDAY_DATES,
  EXAM_SEASONS,
  type CameoTriggerEngine,
  type CameoTriggerContext,
  type CameoTriggerRule,
} from './cameoTriggerEngine'
import { PRESET_PERSONAS, type PersonaDefinition } from './personaScheduler'
import { createInMemoryMemoryStore } from '../memory/memoryStore'
import type { MemoryStore, MemoryScope } from '../memory/memoryTypes'

function makeContext(overrides: Partial<CameoTriggerContext> = {}): CameoTriggerContext {
  return {
    now: new Date('2026-06-12T10:00:00Z'),
    schedule: {
      cameoFrequency: 'weekly',
    },
    ...overrides,
  }
}

describe('cameoTriggerEngine', () => {
  let engine: CameoTriggerEngine

  beforeEach(() => {
    engine = createCameoTriggerEngine()
  })

  describe('createCameoTriggerEngine', () => {
    it('creates engine with default rules', () => {
      const rules = engine.getActiveRules()
      expect(rules.length).toBeGreaterThanOrEqual(8)
      expect(rules.every(r => typeof r.type === 'string')).toBe(true)
    })

    it('sorts rules by priority descending', () => {
      const rules = engine.getActiveRules()
      for (let i = 1; i < rules.length; i++) {
        expect(rules[i - 1].priority).toBeGreaterThanOrEqual(rules[i].priority)
      }
    })

    it('accepts custom initial rules', () => {
      const customRules: CameoTriggerRule[] = [
        {
          type: 'holiday',
          personaId: 'playful_girlfriend',
          condition: () => true,
          priority: 100,
        },
      ]
      const customEngine = createCameoTriggerEngine(customRules)
      expect(customEngine.getActiveRules()).toHaveLength(1)
    })
  })

  describe('evaluate', () => {
    it('returns no trigger when cameoFrequency is off', () => {
      const result = engine.evaluate(
        makeContext({ schedule: { cameoFrequency: 'off' } }),
        PRESET_PERSONAS
      )
      expect(result.triggered).toBe(false)
      expect(result.persona).toBeNull()
    })

    it('returns no trigger when no rules match', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-03-17T10:00:00Z'),
          schedule: { cameoFrequency: 'weekly' },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggered).toBe(false)
    })

    it('triggers holiday cameo on matching date', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-01-01T10:00:00Z'),
          schedule: { cameoFrequency: 'weekly' },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggered).toBe(true)
      expect(result.triggerType).toBe('holiday')
      expect(result.triggerDetail).toBe('新年客串')
    })

    it('triggers exam season cameo during exam period', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-01-10T10:00:00Z'),
          schedule: { cameoFrequency: 'weekly' },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggered).toBe(true)
      expect(result.triggerType).toBe('exam_season')
      expect(result.triggerDetail).toBe('期末考试客串')
    })

    it('triggers birthday cameo on user birthday', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-06-12T10:00:00Z'),
          schedule: {
            cameoFrequency: 'weekly',
            userBirthday: '2000-06-12',
          },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggered).toBe(true)
      expect(result.triggerType).toBe('birthday')
      expect(result.triggerDetail).toBe('生日客串')
    })

    it('does not trigger birthday on wrong date', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-06-13T10:00:00Z'),
          schedule: {
            cameoFrequency: 'weekly',
            userBirthday: '2000-06-12',
          },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggerType).not.toBe('birthday')
    })

    it('triggers anniversary cameo on matching date', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-06-12T10:00:00Z'),
          schedule: {
            cameoFrequency: 'weekly',
            userAnniversary: '2025-06-12',
          },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggered).toBe(true)
      expect(result.triggerType).toBe('anniversary')
      expect(result.triggerDetail).toBe('纪念日客串')
    })

    it('triggers daily evening cameo after 8pm', () => {
      const eveningDate = new Date('2026-06-12T14:00:00Z')
      eveningDate.setHours(21)
      const result = engine.evaluate(
        makeContext({
          now: eveningDate,
          schedule: { cameoFrequency: 'daily' },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggered).toBe(true)
      expect(result.triggerType).toBe('daily_evening')
    })

    it('does not trigger daily evening before 8pm', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-06-12T18:00:00Z'),
          schedule: { cameoFrequency: 'daily' },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggerType).not.toBe('daily_evening')
    })

    it('triggers weekend cameo on Sunday', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-06-14T10:00:00Z'),
          schedule: { cameoFrequency: 'weekly' },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggered).toBe(true)
      expect(result.triggerType).toBe('weekend')
    })

    it('does not trigger weekend cameo on Monday', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-06-15T10:00:00Z'),
          schedule: { cameoFrequency: 'weekly' },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggerType).not.toBe('weekend')
    })

    it('triggers focus streak cameo when focus minutes >= 120', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-06-12T10:00:00Z'),
          schedule: {
            cameoFrequency: 'event_threshold',
            lastFocusMinutes: 150,
          },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggered).toBe(true)
      expect(result.triggerType).toBe('focus_streak')
      expect(result.triggerDetail).toBe('专注150分钟客串')
    })

    it('does not trigger focus streak when focus minutes < 120', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-06-12T10:00:00Z'),
          schedule: {
            cameoFrequency: 'event_threshold',
            lastFocusMinutes: 60,
          },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggerType).not.toBe('focus_streak')
    })

    it('triggers task milestone cameo at every 10 tasks', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-06-12T10:00:00Z'),
          schedule: {
            cameoFrequency: 'event_threshold',
            completedTaskCount: 20,
          },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggered).toBe(true)
      expect(result.triggerType).toBe('task_milestone')
      expect(result.triggerDetail).toBe('完成20个任务客串')
    })

    it('does not trigger task milestone below 10 tasks', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-06-12T10:00:00Z'),
          schedule: {
            cameoFrequency: 'event_threshold',
            completedTaskCount: 5,
          },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggerType).not.toBe('task_milestone')
    })

    it('triggers mood low cameo when recentMoodLow is true', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-06-12T10:00:00Z'),
          schedule: { cameoFrequency: 'weekly' },
          memoryEvents: {
            recentMoodLow: true,
            recentTaskCompleted: false,
            recentFocusCompleted: false,
          },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggered).toBe(true)
      expect(result.triggerType).toBe('mood_low')
      expect(result.triggerDetail).toBe('情绪关怀客串')
    })

    it('returns correct persona for triggered cameo', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-01-01T10:00:00Z'),
          schedule: { cameoFrequency: 'weekly' },
        }),
        PRESET_PERSONAS
      )
      expect(result.persona).not.toBeNull()
      expect(result.persona!.id).toBe('caring_sister')
    })

    it('returns null persona when persona not in list', () => {
      const emptyPersonas: PersonaDefinition[] = []
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-01-01T10:00:00Z'),
          schedule: { cameoFrequency: 'weekly' },
        }),
        emptyPersonas
      )
      expect(result.triggered).toBe(false)
      expect(result.persona).toBeNull()
    })

    it('higher priority rule wins when multiple match', () => {
      const result = engine.evaluate(
        makeContext({
          now: new Date('2026-01-01T14:00:00Z'),
          schedule: {
            cameoFrequency: 'daily',
            userBirthday: '2000-01-01',
          },
        }),
        PRESET_PERSONAS
      )
      expect(result.triggered).toBe(true)
      expect(result.triggerType).toBe('holiday')
    })
  })

  describe('addRule', () => {
    it('adds a new rule', () => {
      const newRule: CameoTriggerRule = {
        type: 'focus_streak',
        personaId: 'playful_girlfriend',
        condition: () => true,
        priority: 200,
      }
      engine.addRule(newRule)
      const rules = engine.getActiveRules()
      const added = rules.find(r => r.priority === 200)
      expect(added).toBeDefined()
      expect(added!.personaId).toBe('playful_girlfriend')
    })

    it('replaces existing rule with same type', () => {
      const newRule: CameoTriggerRule = {
        type: 'holiday',
        personaId: 'strict_teacher',
        condition: () => true,
        priority: 200,
      }
      engine.addRule(newRule)
      const rules = engine.getActiveRules()
      const holidayRules = rules.filter(r => r.type === 'holiday')
      expect(holidayRules).toHaveLength(1)
      expect(holidayRules[0].personaId).toBe('strict_teacher')
    })
  })

  describe('removeRule', () => {
    it('removes a rule by type', () => {
      const before = engine.getActiveRules().length
      engine.removeRule('holiday')
      const after = engine.getActiveRules().length
      expect(after).toBe(before - 1)
    })

    it('does nothing when type not found', () => {
      const before = engine.getActiveRules().length
      engine.removeRule('birthday')
      engine.removeRule('birthday')
      const after = engine.getActiveRules().length
      expect(after).toBe(before - 1)
    })
  })
})

describe('HOLIDAY_DATES', () => {
  it('contains 7 holidays', () => {
    expect(HOLIDAY_DATES).toHaveLength(7)
  })

  it('all holidays have valid persona ids', () => {
    const validIds = PRESET_PERSONAS.map(p => p.id)
    for (const holiday of HOLIDAY_DATES) {
      expect(validIds).toContain(holiday.personaId)
    }
  })
})

describe('EXAM_SEASONS', () => {
  it('contains 3 exam seasons', () => {
    expect(EXAM_SEASONS).toHaveLength(3)
  })

  it('all exam seasons target strict_teacher', () => {
    for (const exam of EXAM_SEASONS) {
      expect(exam.personaId).toBe('strict_teacher')
    }
  })
})

describe('DEFAULT_RULES', () => {
  it('contains at least 8 rules', () => {
    expect(DEFAULT_RULES.length).toBeGreaterThanOrEqual(8)
  })

  it('all rules have valid persona ids', () => {
    const validIds = PRESET_PERSONAS.map(p => p.id)
    for (const rule of DEFAULT_RULES) {
      expect(validIds).toContain(rule.personaId)
    }
  })

  it('all rules have positive priority', () => {
    for (const rule of DEFAULT_RULES) {
      expect(rule.priority).toBeGreaterThan(0)
    }
  })
})

describe('buildTriggerContextFromMemoryObserver', () => {
  let store: MemoryStore
  let scope: MemoryScope

  beforeEach(() => {
    store = createInMemoryMemoryStore()
    scope = { userId: 'test-user', projectId: 'test-project' }
  })

  it('returns all false when no memoryStore provided', () => {
    const baseContext = makeContext()
    const result = buildTriggerContextFromMemoryObserver(null, baseContext, null, undefined)
    expect(result.memoryEvents).toEqual({
      recentMoodLow: false,
      recentTaskCompleted: false,
      recentFocusCompleted: false,
    })
  })

  it('returns all false when no scope provided', () => {
    const baseContext = makeContext()
    const result = buildTriggerContextFromMemoryObserver(null, baseContext, store, undefined)
    expect(result.memoryEvents).toEqual({
      recentMoodLow: false,
      recentTaskCompleted: false,
      recentFocusCompleted: false,
    })
  })

  it('returns all false when store has no matching events', () => {
    const baseContext = makeContext()
    const result = buildTriggerContextFromMemoryObserver(null, baseContext, store, scope)
    expect(result.memoryEvents).toEqual({
      recentMoodLow: false,
      recentTaskCompleted: false,
      recentFocusCompleted: false,
    })
  })

  it('detects recent mood_low event', () => {
    store.appendEvent({
      id: 'evt-1',
      scope,
      kind: 'observation',
      content: 'feeling down',
      source: 'user_input',
      confidence: 0.9,
      status: 'active',
      tags: ['mood'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: null,
      category: 'mood_low',
    })

    const baseContext = makeContext()
    const result = buildTriggerContextFromMemoryObserver(null, baseContext, store, scope)
    expect(result.memoryEvents!.recentMoodLow).toBe(true)
    expect(result.memoryEvents!.recentTaskCompleted).toBe(false)
    expect(result.memoryEvents!.recentFocusCompleted).toBe(false)
  })

  it('detects recent task_completed event', () => {
    store.appendEvent({
      id: 'evt-2',
      scope,
      kind: 'event',
      content: 'task done',
      source: 'system',
      confidence: 1,
      status: 'active',
      tags: ['task'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: null,
      category: 'task_completed',
    })

    const baseContext = makeContext()
    const result = buildTriggerContextFromMemoryObserver(null, baseContext, store, scope)
    expect(result.memoryEvents!.recentMoodLow).toBe(false)
    expect(result.memoryEvents!.recentTaskCompleted).toBe(true)
    expect(result.memoryEvents!.recentFocusCompleted).toBe(false)
  })

  it('detects recent focus_completed event', () => {
    store.appendEvent({
      id: 'evt-3',
      scope,
      kind: 'event',
      content: 'focus done',
      source: 'system',
      confidence: 1,
      status: 'active',
      tags: ['focus'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: null,
      category: 'focus_completed',
    })

    const baseContext = makeContext()
    const result = buildTriggerContextFromMemoryObserver(null, baseContext, store, scope)
    expect(result.memoryEvents!.recentMoodLow).toBe(false)
    expect(result.memoryEvents!.recentTaskCompleted).toBe(false)
    expect(result.memoryEvents!.recentFocusCompleted).toBe(true)
  })

  it('ignores events older than 24 hours', () => {
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    store.appendEvent({
      id: 'evt-old',
      scope,
      kind: 'observation',
      content: 'old mood',
      source: 'user_input',
      confidence: 0.9,
      status: 'active',
      tags: ['mood'],
      createdAt: oldDate,
      updatedAt: oldDate,
      expiresAt: null,
      category: 'mood_low',
    })

    const baseContext = makeContext()
    const result = buildTriggerContextFromMemoryObserver(null, baseContext, store, scope)
    expect(result.memoryEvents!.recentMoodLow).toBe(false)
  })

  it('ignores inactive events', () => {
    store.appendEvent({
      id: 'evt-inactive',
      scope,
      kind: 'observation',
      content: 'forgotten mood',
      source: 'user_input',
      confidence: 0.9,
      status: 'forgotten',
      tags: ['mood'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: null,
      category: 'mood_low',
    })

    const baseContext = makeContext()
    const result = buildTriggerContextFromMemoryObserver(null, baseContext, store, scope)
    expect(result.memoryEvents!.recentMoodLow).toBe(false)
  })

  it('preserves baseContext fields', () => {
    const baseContext = makeContext({
      schedule: {
        cameoFrequency: 'daily',
        lastFocusMinutes: 120,
      },
    })

    const result = buildTriggerContextFromMemoryObserver(null, baseContext, store, scope)
    expect(result.schedule.cameoFrequency).toBe('daily')
    expect(result.schedule.lastFocusMinutes).toBe(120)
  })
})
