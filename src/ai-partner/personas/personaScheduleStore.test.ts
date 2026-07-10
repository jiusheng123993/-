import { describe, expect, it, beforeEach } from 'vitest'
import {
  createPersonaScheduleStorage,
  createIndexedDBPersonaScheduleStorage
} from './personaScheduleStore'
import type { PersonaScheduleStorage } from './personaScheduleStore'

function runStorageTests(
  suiteName: string,
  factory: () => PersonaScheduleStorage
) {
  describe(suiteName, () => {
    let storage: PersonaScheduleStorage

    beforeEach(() => {
      storage = factory()
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
        cameoFrequency: 'weekly' as const
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
        cameoFrequency: 'weekly'
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
        cameoFrequency: 'weekly'
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
        cameoFrequency: 'weekly'
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
        cameoFrequency: 'weekly'
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
        cameoFrequency: 'weekly'
      })

      storage.clear()
      expect(storage.get('user-1')).toBeNull()
    })

    it('handles multiple users independently', () => {
      storage.save({
        userId: 'user-1',
        mainPersonaId: 'persona_a',
        mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
        mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
        cameoFrequency: 'weekly'
      })

      storage.save({
        userId: 'user-2',
        mainPersonaId: 'persona_b',
        mainPersonaSelectedAt: '2026-02-01T00:00:00.000Z',
        mainPersonaLastChangedAt: '2026-02-01T00:00:00.000Z',
        cameoFrequency: 'daily'
      })

      expect(storage.get('user-1')?.mainPersonaId).toBe('persona_a')
      expect(storage.get('user-2')?.mainPersonaId).toBe('persona_b')
    })

    it('activateCameo does nothing for non-existent user', () => {
      storage.activateCameo('no-user', {
        personaId: 'cameo_x',
        triggeredBy: 'user_manual',
        triggerDetail: 'test',
        startedAt: '2026-01-01T00:00:00.000Z',
        endsAt: '2026-01-08T00:00:00.000Z'
      })

      expect(storage.get('no-user')).toBeNull()
    })

    it('endCameo does nothing for non-existent user', () => {
      storage.endCameo('no-user')
      expect(storage.get('no-user')).toBeNull()
    })

    it('preserves cameoFrequency on updateMainPersona', () => {
      storage.save({
        userId: 'user-1',
        mainPersonaId: 'old',
        mainPersonaSelectedAt: '2026-01-01T00:00:00.000Z',
        mainPersonaLastChangedAt: '2026-01-01T00:00:00.000Z',
        cameoFrequency: 'off'
      })

      storage.updateMainPersona('user-1', 'new')
      expect(storage.get('user-1')?.cameoFrequency).toBe('off')
    })
  })
}

runStorageTests('personaScheduleStore (localStorage)', () => createPersonaScheduleStorage())
runStorageTests('personaScheduleStore (IndexedDB)', () => createIndexedDBPersonaScheduleStorage())
