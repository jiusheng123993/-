import { describe, expect, it } from 'vitest'
import {
  calculateMemoryEconomy,
  getRetentionPolicy,
  getDeletionPriority,
  DEFAULT_MEMORY_ECONOMY,
  type MemoryEconomy
} from '../economy/memoryEconomy'
import type { MemoryAtom } from '../core/memoryBodyTypes'

function createTestAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: 'test-1',
    scope: 'user',
    layer: 'preference',
    type: 'preference',
    subject: 'user',
    predicate: 'likes',
    object: 'coffee',
    content: '用户喜欢咖啡',
    source: { type: 'chat', timestamp: new Date().toISOString() },
    confidence: 0.8,
    strength: 0.7,
    emotionalWeight: 0.3,
    sensitivity: 'low',
    lifecycle: 'active',
    evidence: [],
    tags: ['food', 'preference'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    accessCount: 5,
    contradictionOf: [],
    ...overrides
  }
}

describe('MemoryEconomy', () => {
  describe('calculateMemoryEconomy', () => {
    it('should calculate economy for a normal active memory', () => {
      const atom = createTestAtom()
      const economy = calculateMemoryEconomy(atom)

      expect(economy.valueScore).toBeGreaterThan(0)
      expect(economy.valueScore).toBeLessThanOrEqual(1)
      expect(economy.costScore).toBeGreaterThan(0)
      expect(economy.costScore).toBeLessThanOrEqual(1)
      expect(economy.riskScore).toBeGreaterThanOrEqual(0)
      expect(economy.riskScore).toBeLessThanOrEqual(1)
      expect(economy.usageFrequency).toBeGreaterThan(0)
      expect(economy.correctionCost).toBeGreaterThanOrEqual(0)
      expect(economy.retentionPolicy).toBeDefined()
      expect(economy.deletionPriority).toBeGreaterThanOrEqual(0)
    })

    it('should give higher value to high-confidence memories', () => {
      const lowConf = createTestAtom({ confidence: 0.3 })
      const highConf = createTestAtom({ confidence: 0.9 })

      const lowEconomy = calculateMemoryEconomy(lowConf)
      const highEconomy = calculateMemoryEconomy(highConf)

      expect(highEconomy.valueScore).toBeGreaterThan(lowEconomy.valueScore)
    })

    it('should give higher value to memories with more evidence', () => {
      const noEvidence = createTestAtom({ evidence: [] })
      const withEvidence = createTestAtom({
        evidence: [
          { type: 'chat', source: 'msg-1', timestamp: new Date().toISOString() },
          { type: 'chat', source: 'msg-2', timestamp: new Date().toISOString() }
        ]
      })

      const noEvEconomy = calculateMemoryEconomy(noEvidence)
      const withEvEconomy = calculateMemoryEconomy(withEvidence)

      expect(withEvEconomy.valueScore).toBeGreaterThan(noEvEconomy.valueScore)
    })

    it('should give higher value to frequently accessed memories', () => {
      const lowAccess = createTestAtom({ accessCount: 1 })
      const highAccess = createTestAtom({ accessCount: 50 })

      const lowEconomy = calculateMemoryEconomy(lowAccess)
      const highEconomy = calculateMemoryEconomy(highAccess)

      expect(highEconomy.valueScore).toBeGreaterThan(lowEconomy.valueScore)
    })

    it('should assign higher risk to sensitive memories', () => {
      const lowSens = createTestAtom({ sensitivity: 'low' })
      const highSens = createTestAtom({ sensitivity: 'high' })

      const lowEconomy = calculateMemoryEconomy(lowSens)
      const highEconomy = calculateMemoryEconomy(highSens)

      expect(highEconomy.riskScore).toBeGreaterThan(lowEconomy.riskScore)
    })

    it('should assign higher risk to forbidden memories', () => {
      const normal = createTestAtom({ lifecycle: 'active' })
      const forbidden = createTestAtom({ lifecycle: 'forbidden' })

      const normalEconomy = calculateMemoryEconomy(normal)
      const forbiddenEconomy = calculateMemoryEconomy(forbidden)

      expect(forbiddenEconomy.riskScore).toBeGreaterThan(normalEconomy.riskScore)
    })

    it('should assign higher cost to memories with many contradictions', () => {
      const noContra = createTestAtom({ contradictionOf: [] })
      const withContra = createTestAtom({ contradictionOf: ['atom-1', 'atom-2', 'atom-3'] })

      const noContraEconomy = calculateMemoryEconomy(noContra)
      const withContraEconomy = calculateMemoryEconomy(withContra)

      expect(withContraEconomy.costScore).toBeGreaterThan(noContraEconomy.costScore)
    })

    it('should assign higher cost to old memories that are rarely accessed', () => {
      const recent = createTestAtom({
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        accessCount: 10
      })
      const old = createTestAtom({
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        lastAccessedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        accessCount: 1
      })

      const recentEconomy = calculateMemoryEconomy(recent)
      const oldEconomy = calculateMemoryEconomy(old)

      expect(oldEconomy.costScore).toBeGreaterThan(recentEconomy.costScore)
    })

    it('should assign higher correction cost to high-confidence memories', () => {
      const lowConf = createTestAtom({ confidence: 0.3 })
      const highConf = createTestAtom({ confidence: 0.95 })

      const lowEconomy = calculateMemoryEconomy(lowConf)
      const highEconomy = calculateMemoryEconomy(highConf)

      expect(highEconomy.correctionCost).toBeGreaterThan(lowEconomy.correctionCost)
    })

    it('should assign higher correction cost to memories with more evidence', () => {
      const noEvidence = createTestAtom({ evidence: [] })
      const withEvidence = createTestAtom({
        evidence: [
          { type: 'chat', source: 'msg-1', timestamp: new Date().toISOString() },
          { type: 'chat', source: 'msg-2', timestamp: new Date().toISOString() },
          { type: 'chat', source: 'msg-3', timestamp: new Date().toISOString() }
        ]
      })

      const noEvEconomy = calculateMemoryEconomy(noEvidence)
      const withEvEconomy = calculateMemoryEconomy(withEvidence)

      expect(withEvEconomy.correctionCost).toBeGreaterThan(noEvEconomy.correctionCost)
    })
  })

  describe('getRetentionPolicy', () => {
    it('should return "keep" for high-value low-risk memories', () => {
      const economy: MemoryEconomy = {
        ...DEFAULT_MEMORY_ECONOMY,
        valueScore: 0.9,
        riskScore: 0.1,
        costScore: 0.2
      }
      expect(getRetentionPolicy(economy)).toBe('keep')
    })

    it('should return "review" for medium-value memories', () => {
      const economy: MemoryEconomy = {
        ...DEFAULT_MEMORY_ECONOMY,
        valueScore: 0.5,
        riskScore: 0.3,
        costScore: 0.4
      }
      expect(getRetentionPolicy(economy)).toBe('review')
    })

    it('should return "decay" for low-value memories', () => {
      const economy: MemoryEconomy = {
        ...DEFAULT_MEMORY_ECONOMY,
        valueScore: 0.2,
        riskScore: 0.3,
        costScore: 0.5
      }
      expect(getRetentionPolicy(economy)).toBe('decay')
    })

    it('should return "sandbox" for high-risk memories', () => {
      const economy: MemoryEconomy = {
        ...DEFAULT_MEMORY_ECONOMY,
        valueScore: 0.6,
        riskScore: 0.8,
        costScore: 0.3
      }
      expect(getRetentionPolicy(economy)).toBe('sandbox')
    })

    it('should return "delete" for very low-value high-cost memories', () => {
      const economy: MemoryEconomy = {
        ...DEFAULT_MEMORY_ECONOMY,
        valueScore: 0.05,
        riskScore: 0.1,
        costScore: 0.9
      }
      expect(getRetentionPolicy(economy)).toBe('delete')
    })
  })

  describe('getDeletionPriority', () => {
    it('should return higher priority for low-value high-cost memories', () => {
      const good: MemoryEconomy = {
        ...DEFAULT_MEMORY_ECONOMY,
        valueScore: 0.9,
        costScore: 0.1,
        riskScore: 0.1
      }
      const bad: MemoryEconomy = {
        ...DEFAULT_MEMORY_ECONOMY,
        valueScore: 0.1,
        costScore: 0.9,
        riskScore: 0.5
      }

      expect(getDeletionPriority(bad)).toBeGreaterThan(getDeletionPriority(good))
    })

    it('should return a value between 0 and 1', () => {
      const economy: MemoryEconomy = {
        ...DEFAULT_MEMORY_ECONOMY,
        valueScore: 0.5,
        costScore: 0.5,
        riskScore: 0.5
      }
      const priority = getDeletionPriority(economy)
      expect(priority).toBeGreaterThanOrEqual(0)
      expect(priority).toBeLessThanOrEqual(1)
    })
  })
})
