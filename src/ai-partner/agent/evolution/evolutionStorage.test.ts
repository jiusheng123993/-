import { describe, it, expect, beforeEach } from 'vitest'
import { evolutionStorage } from './evolutionStorage'
import type { EvolutionEntry } from './evolutionRitualTypes'

function makeEntry(overrides: Partial<EvolutionEntry> & { id: string }): EvolutionEntry {
  return {
    userId: 'u1',
    triggeredBy: 'cron',
    triggerDetail: 'Weekly reflection',
    proposedChanges: [],
    userDecision: 'pending',
    finalChanges: [],
    reflectionNote: '',
    createdAt: '2026-06-01T10:00:00Z',
    ...overrides,
  }
}

describe('evolutionStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('save', () => {
    it('saves an entry to localStorage', async () => {
      const entry = makeEntry({ id: 'evo-1' })
      await evolutionStorage.save(entry)

      const raw = localStorage.getItem('xinghuanhai_evolution_entries')
      expect(raw).toBeTruthy()
      const parsed = JSON.parse(raw!)
      expect(parsed['evo-1']).toEqual(entry)
    })

    it('overwrites existing entry with same id', async () => {
      const entry1 = makeEntry({ id: 'evo-1', userDecision: 'pending' })
      await evolutionStorage.save(entry1)

      const entry2 = makeEntry({ id: 'evo-1', userDecision: 'accepted' })
      await evolutionStorage.save(entry2)

      const result = await evolutionStorage.getById('evo-1')
      expect(result?.userDecision).toBe('accepted')
    })

    it('saves multiple entries', async () => {
      await evolutionStorage.save(makeEntry({ id: 'evo-1' }))
      await evolutionStorage.save(makeEntry({ id: 'evo-2' }))

      const raw = localStorage.getItem('xinghuanhai_evolution_entries')
      const parsed = JSON.parse(raw!)
      expect(Object.keys(parsed)).toHaveLength(2)
    })
  })

  describe('getById', () => {
    it('returns entry by id', async () => {
      const entry = makeEntry({ id: 'evo-1' })
      await evolutionStorage.save(entry)

      const result = await evolutionStorage.getById('evo-1')
      expect(result).toEqual(entry)
    })

    it('returns undefined for non-existent id', async () => {
      const result = await evolutionStorage.getById('non-existent')
      expect(result).toBeUndefined()
    })
  })

  describe('getByUser', () => {
    it('returns entries for a specific user', async () => {
      await evolutionStorage.save(makeEntry({ id: 'evo-1', userId: 'u1' }))
      await evolutionStorage.save(makeEntry({ id: 'evo-2', userId: 'u1' }))
      await evolutionStorage.save(makeEntry({ id: 'evo-3', userId: 'u2' }))

      const results = await evolutionStorage.getByUser('u1')
      expect(results).toHaveLength(2)
      expect(results.map(e => e.id).sort()).toEqual(['evo-1', 'evo-2'])
    })

    it('returns empty array for user with no entries', async () => {
      const results = await evolutionStorage.getByUser('u1')
      expect(results).toEqual([])
    })
  })

  describe('getPending', () => {
    it('returns only pending entries for user', async () => {
      await evolutionStorage.save(makeEntry({ id: 'evo-1', userId: 'u1', userDecision: 'pending' }))
      await evolutionStorage.save(makeEntry({ id: 'evo-2', userId: 'u1', userDecision: 'accepted' }))
      await evolutionStorage.save(makeEntry({ id: 'evo-3', userId: 'u1', userDecision: 'pending' }))

      const results = await evolutionStorage.getPending('u1')
      expect(results).toHaveLength(2)
      expect(results.every(e => e.userDecision === 'pending')).toBe(true)
    })

    it('returns empty array when no pending entries', async () => {
      await evolutionStorage.save(makeEntry({ id: 'evo-1', userId: 'u1', userDecision: 'accepted' }))

      const results = await evolutionStorage.getPending('u1')
      expect(results).toEqual([])
    })
  })

  describe('getByDecision', () => {
    it('returns entries with specific decision', async () => {
      await evolutionStorage.save(makeEntry({ id: 'evo-1', userId: 'u1', userDecision: 'accepted' }))
      await evolutionStorage.save(makeEntry({ id: 'evo-2', userId: 'u1', userDecision: 'rejected' }))
      await evolutionStorage.save(makeEntry({ id: 'evo-3', userId: 'u1', userDecision: 'accepted' }))

      const results = await evolutionStorage.getByDecision('u1', 'accepted')
      expect(results).toHaveLength(2)
      expect(results.every(e => e.userDecision === 'accepted')).toBe(true)
    })

    it('returns empty array for unmatched decision', async () => {
      await evolutionStorage.save(makeEntry({ id: 'evo-1', userId: 'u1', userDecision: 'pending' }))

      const results = await evolutionStorage.getByDecision('u1', 'accepted')
      expect(results).toEqual([])
    })
  })

  describe('updateDecision', () => {
    it('updates decision and sets decidedAt', async () => {
      await evolutionStorage.save(makeEntry({ id: 'evo-1', userDecision: 'pending' }))

      const updated = await evolutionStorage.updateDecision('evo-1', 'accepted')
      expect(updated).toBeDefined()
      expect(updated!.userDecision).toBe('accepted')
      expect(updated!.decidedAt).toBeTruthy()

      const stored = await evolutionStorage.getById('evo-1')
      expect(stored?.userDecision).toBe('accepted')
      expect(stored?.decidedAt).toBeTruthy()
    })

    it('updates finalChanges when provided', async () => {
      await evolutionStorage.save(makeEntry({ id: 'evo-1' }))

      const finalChanges = [
        { fieldPath: 'emotional.motivationLevel', oldValue: 'medium', newValue: 'high' },
      ]
      const updated = await evolutionStorage.updateDecision('evo-1', 'modified', finalChanges)
      expect(updated!.finalChanges).toEqual(finalChanges)
    })

    it('updates reflectionNote when provided', async () => {
      await evolutionStorage.save(makeEntry({ id: 'evo-1' }))

      const updated = await evolutionStorage.updateDecision('evo-1', 'accepted', undefined, 'Good reflection')
      expect(updated!.reflectionNote).toBe('Good reflection')
    })

    it('returns undefined for non-existent entry', async () => {
      const result = await evolutionStorage.updateDecision('non-existent', 'accepted')
      expect(result).toBeUndefined()
    })

    it('keeps existing finalChanges when not provided', async () => {
      const existingChanges = [
        { fieldPath: 'goals.primaryGoal', oldValue: 'old', newValue: 'new' },
      ]
      await evolutionStorage.save(makeEntry({ id: 'evo-1', finalChanges: existingChanges }))

      const updated = await evolutionStorage.updateDecision('evo-1', 'accepted')
      expect(updated!.finalChanges).toEqual(existingChanges)
    })
  })

  describe('delete', () => {
    it('removes entry from storage', async () => {
      await evolutionStorage.save(makeEntry({ id: 'evo-1' }))
      await evolutionStorage.save(makeEntry({ id: 'evo-2' }))

      await evolutionStorage.delete('evo-1')

      const result = await evolutionStorage.getById('evo-1')
      expect(result).toBeUndefined()

      const remaining = await evolutionStorage.getById('evo-2')
      expect(remaining).toBeDefined()
    })

    it('does not throw when deleting non-existent entry', async () => {
      await expect(evolutionStorage.delete('non-existent')).resolves.toBeUndefined()
    })
  })

  describe('getAll', () => {
    it('returns all entries for user', async () => {
      await evolutionStorage.save(makeEntry({ id: 'evo-1', userId: 'u1' }))
      await evolutionStorage.save(makeEntry({ id: 'evo-2', userId: 'u1' }))
      await evolutionStorage.save(makeEntry({ id: 'evo-3', userId: 'u2' }))

      const results = await evolutionStorage.getAll('u1')
      expect(results).toHaveLength(2)
    })
  })

  describe('corrupted localStorage', () => {
    it('handles corrupted JSON gracefully', async () => {
      localStorage.setItem('xinghuanhai_evolution_entries', 'not-valid-json')

      const result = await evolutionStorage.getById('evo-1')
      expect(result).toBeUndefined()

      const byUser = await evolutionStorage.getByUser('u1')
      expect(byUser).toEqual([])
    })
  })
})
