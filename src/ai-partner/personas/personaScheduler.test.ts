import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import { createPersonaScheduler, PRESET_PERSONAS } from './personaScheduler'
import { createPersonaScheduleStorage } from './personaScheduleStore'
import { createCameoTriggerEngine } from './cameoTriggerEngine'
import type { PersonaScheduler, EntitlementService } from './personaScheduler'
import type { CameoTriggerEngine } from './cameoTriggerEngine'

describe('personaScheduler', () => {
  let scheduler: PersonaScheduler
  let storage: ReturnType<typeof createPersonaScheduleStorage>
  let mockEntitlement: EntitlementService

  beforeEach(() => {
    storage = createPersonaScheduleStorage()
    storage.clear()

    mockEntitlement = {
      has(userId: string, feature: string) {
        return feature === 'agent' || feature === 'agent_plus'
      }
    }

    scheduler = createPersonaScheduler(storage, mockEntitlement)
  })

  it('returns null when no schedule exists', () => {
    expect(scheduler.getCurrentPersona('unknown')).toBeNull()
  })

  it('returns main persona when schedule exists', () => {
    storage.save({
      userId: 'user-1',
      mainPersonaId: 'caring_sister',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'medium'
    })

    const persona = scheduler.getCurrentPersona('user-1')
    expect(persona?.id).toBe('caring_sister')
    expect(persona?.name).toBe('贴心姐姐')
  })

  it('returns cameo persona when active', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)

    storage.save({
      userId: 'user-1',
      mainPersonaId: 'playful_girlfriend',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'medium',
      activeCameo: {
        personaId: 'strict_teacher',
        triggeredBy: 'user_manual',
        triggerDetail: 'User activated',
        startedAt: new Date().toISOString(),
        endsAt: futureDate.toISOString()
      }
    })

    const persona = scheduler.getCurrentPersona('user-1')
    expect(persona?.id).toBe('strict_teacher')
  })

  it('selects main persona with valid entitlement', () => {
    const result = scheduler.selectMainPersona('user-1', 'caring_sister')
    expect(result.ok).toBe(true)

    const schedule = storage.get('user-1')
    expect(schedule?.mainPersonaId).toBe('caring_sister')
  })

  it('rejects persona selection without entitlement', () => {
    mockEntitlement = {
      has() { return false }
    }
    scheduler = createPersonaScheduler(storage, mockEntitlement)

    const result = scheduler.selectMainPersona('user-1', 'caring_sister')
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('tier_required')
  })

  it('rejects unknown persona', () => {
    const result = scheduler.selectMainPersona('user-1', 'unknown_persona')
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('persona_not_found')
  })

  it('rejects selection within monthly limit', () => {
    storage.save({
      userId: 'user-1',
      mainPersonaId: 'playful_girlfriend',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: new Date().toISOString(),
      cameoFrequency: 'medium'
    })

    const result = scheduler.selectMainPersona('user-1', 'caring_sister')
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('monthly_limit_reached')
  })

  it('activates and ends cameo', () => {
    storage.save({
      userId: 'user-1',
      mainPersonaId: 'playful_girlfriend',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'medium'
    })

    scheduler.activateCameo('user-1', 'strict_teacher', 7, 'user_manual')

    let schedule = storage.get('user-1')
    expect(schedule?.activeCameo?.personaId).toBe('strict_teacher')

    scheduler.endCameo('user-1')
    schedule = storage.get('user-1')
    expect(schedule?.activeCameo).toBeUndefined()
  })

  it('returns null for auto cameo when frequency is off', () => {
    storage.save({
      userId: 'user-1',
      mainPersonaId: 'playful_girlfriend',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'off'
    })

    expect(scheduler.checkAutoCameoTriggers('user-1')).toBeNull()
  })
})

describe('PRESET_PERSONAS', () => {
  it('contains 3 preset personas', () => {
    expect(PRESET_PERSONAS).toHaveLength(3)
  })

  it('has unique ids', () => {
    const ids = PRESET_PERSONAS.map(p => p.id)
    const uniqueIds = [...new Set(ids)]
    expect(uniqueIds).toHaveLength(ids.length)
  })

  it('includes playful_girlfriend with female gender', () => {
    const gf = PRESET_PERSONAS.find(p => p.id === 'playful_girlfriend')
    expect(gf).toBeDefined()
    expect(gf!.gender).toBe('female')
    expect(gf!.identityRole).toBe('girlfriend')
  })

  it('includes caring_sister with female gender', () => {
    const sister = PRESET_PERSONAS.find(p => p.id === 'caring_sister')
    expect(sister).toBeDefined()
    expect(sister!.gender).toBe('female')
    expect(sister!.identityRole).toBe('sister')
  })

  it('includes strict_teacher with neutral gender', () => {
    const teacher = PRESET_PERSONAS.find(p => p.id === 'strict_teacher')
    expect(teacher).toBeDefined()
    expect(teacher!.gender).toBe('neutral')
    expect(teacher!.identityRole).toBe('teacher')
  })

  it('all personas have tierRequired free', () => {
    for (const persona of PRESET_PERSONAS) {
      expect(persona.tierRequired).toBe('free')
    }
  })
})

describe('personaScheduler with cameoEngine', () => {
  let scheduler: PersonaScheduler
  let storage: ReturnType<typeof createPersonaScheduleStorage>
  let mockEntitlement: EntitlementService
  let cameoEngine: CameoTriggerEngine

  beforeEach(() => {
    storage = createPersonaScheduleStorage()
    storage.clear()

    mockEntitlement = {
      has(userId: string, feature: string) {
        return feature === 'agent' || feature === 'agent_plus'
      }
    }

    cameoEngine = createCameoTriggerEngine()
    scheduler = createPersonaScheduler(storage, mockEntitlement, cameoEngine)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null for auto cameo when frequency is off', () => {
    storage.save({
      userId: 'user-1',
      mainPersonaId: 'playful_girlfriend',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'off'
    })

    expect(scheduler.checkAutoCameoTriggers('user-1')).toBeNull()
  })

  it('triggers holiday cameo on matching date via engine', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'))

    storage.save({
      userId: 'user-1',
      mainPersonaId: 'playful_girlfriend',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'weekly'
    })

    const result = scheduler.checkAutoCameoTriggers('user-1')
    expect(result).not.toBeNull()
    expect(result!.id).toBe('caring_sister')
  })

  it('triggers exam season cameo during exam period via engine', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T10:00:00Z'))

    storage.save({
      userId: 'user-1',
      mainPersonaId: 'playful_girlfriend',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'weekly'
    })

    const result = scheduler.checkAutoCameoTriggers('user-1')
    expect(result).not.toBeNull()
    expect(result!.id).toBe('strict_teacher')
  })

  it('triggers focus streak cameo when focus minutes >= 120 via engine', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T10:00:00Z'))

    storage.save({
      userId: 'user-1',
      mainPersonaId: 'playful_girlfriend',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'event_threshold',
      lastFocusMinutes: 150
    })

    const result = scheduler.checkAutoCameoTriggers('user-1')
    expect(result).not.toBeNull()
    expect(result!.id).toBe('strict_teacher')
  })

  it('does not trigger focus streak when focus minutes < 120 via engine', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T10:00:00Z'))

    storage.save({
      userId: 'user-1',
      mainPersonaId: 'playful_girlfriend',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'event_threshold',
      lastFocusMinutes: 60
    })

    const result = scheduler.checkAutoCameoTriggers('user-1')
    expect(result).toBeNull()
  })

  it('triggers task milestone cameo at every 10 tasks via engine', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T10:00:00Z'))

    storage.save({
      userId: 'user-1',
      mainPersonaId: 'playful_girlfriend',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'event_threshold',
      completedTaskCount: 10
    })

    const result = scheduler.checkAutoCameoTriggers('user-1')
    expect(result).not.toBeNull()
    expect(result!.id).toBe('playful_girlfriend')
  })

  it('does not trigger task milestone below 10 tasks via engine', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T10:00:00Z'))

    storage.save({
      userId: 'user-1',
      mainPersonaId: 'playful_girlfriend',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'event_threshold',
      completedTaskCount: 5
    })

    const result = scheduler.checkAutoCameoTriggers('user-1')
    expect(result).toBeNull()
  })

  it('falls back to inline logic when no cameoEngine provided', () => {
    const fallbackScheduler = createPersonaScheduler(storage, mockEntitlement)

    storage.save({
      userId: 'user-1',
      mainPersonaId: 'playful_girlfriend',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'off'
    })

    expect(fallbackScheduler.checkAutoCameoTriggers('user-1')).toBeNull()
  })
})
