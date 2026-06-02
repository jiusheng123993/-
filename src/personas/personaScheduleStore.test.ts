import { describe, expect, it, beforeEach } from 'vitest'
import { createPersonaScheduleStorage } from './personaScheduleStore'
import type { PersonaScheduleStorage } from './personaScheduleStore'

describe('personaScheduleStore', () => {
  let storage: PersonaScheduleStorage

  beforeEach(() => {
    storage = createPersonaScheduleStorage()
    storage.clear()
  })

  it('returns null for non-existent user', () => {
    expect(storage.get('unknown-user')).toBeNull()
  })

  it('saves and retrieves schedule', () => {
    const schedule = {
      userId: 'user-1',
      mainPersonaId: 'senior_buddy',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'medium' as const
    }

    storage.save(schedule)
    const retrieved = storage.get('user-1')

    expect(retrieved).toEqual(schedule)
  })

  it('allows changing main persona when no previous schedule', () => {
    expect(storage.canChangeMainPersona('new-user')).toBe(true)
  })

  it('allows changing main persona after one month', () => {
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

    storage.save({
      userId: 'user-1',
      mainPersonaId: 'old_persona',
      mainPersonaSelectedAt: twoMonthsAgo.toISOString(),
      mainPersonaLastChangedAt: twoMonthsAgo.toISOString(),
      cameoFrequency: 'medium'
    })

    expect(storage.canChangeMainPersona('user-1')).toBe(true)
  })

  it('blocks changing main persona within the same month', () => {
    const now = new Date().toISOString()

    storage.save({
      userId: 'user-1',
      mainPersonaId: 'current_persona',
      mainPersonaSelectedAt: now,
      mainPersonaLastChangedAt: now,
      cameoFrequency: 'medium'
    })

    expect(storage.canChangeMainPersona('user-1')).toBe(false)
  })

  it('updates main persona successfully', () => {
    const result = storage.updateMainPersona('user-1', 'new_persona')
    expect(result).toBe(true)

    const schedule = storage.get('user-1')
    expect(schedule?.mainPersonaId).toBe('new_persona')
  })

  it('fails to update main persona within same month', () => {
    const now = new Date().toISOString()
    storage.save({
      userId: 'user-1',
      mainPersonaId: 'current',
      mainPersonaSelectedAt: now,
      mainPersonaLastChangedAt: now,
      cameoFrequency: 'medium'
    })

    const result = storage.updateMainPersona('user-1', 'new_persona')
    expect(result).toBe(false)
  })

  it('activates and ends cameo', () => {
    storage.save({
      userId: 'user-1',
      mainPersonaId: 'main',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'medium'
    })

    storage.activateCameo('user-1', {
      personaId: 'cameo_1',
      triggeredBy: 'user_manual',
      triggerDetail: 'User activated cameo',
      startedAt: '2026-06-01T00:00:00.000Z',
      endsAt: '2026-06-08T00:00:00.000Z'
    })

    let schedule = storage.get('user-1')
    expect(schedule?.activeCameo?.personaId).toBe('cameo_1')

    storage.endCameo('user-1')
    schedule = storage.get('user-1')
    expect(schedule?.activeCameo).toBeUndefined()
  })

  it('clears all data', () => {
    storage.save({
      userId: 'user-1',
      mainPersonaId: 'main',
      mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
      mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
      cameoFrequency: 'medium'
    })

    storage.clear()
    expect(storage.get('user-1')).toBeNull()
  })
})
