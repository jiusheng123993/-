import { describe, expect, it } from 'vitest'
import {
  createCognitiveBudget,
  DEFAULT_COGNITIVE_BUDGET,
  isWithinPromptTokenBudget,
  isWithinReviewBudget,
  isWithinStorageBudget,
  allocatePromptBudget,
  allocateReviewBudget
} from '../budget/cognitiveBudget'
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

describe('CognitiveBudget', () => {
  describe('createCognitiveBudget', () => {
    it('should create a budget with default values', () => {
      const budget = createCognitiveBudget()
      expect(budget.memoryStorageBudget).toBe(DEFAULT_COGNITIVE_BUDGET.memoryStorageBudget)
      expect(budget.promptTokenBudget).toBe(DEFAULT_COGNITIVE_BUDGET.promptTokenBudget)
      expect(budget.attentionBudget).toBe(DEFAULT_COGNITIVE_BUDGET.attentionBudget)
      expect(budget.reviewBudget).toBe(DEFAULT_COGNITIVE_BUDGET.reviewBudget)
    })

    it('should allow overriding specific budget values', () => {
      const budget = createCognitiveBudget({ promptTokenBudget: 500, reviewBudget: 3 })
      expect(budget.promptTokenBudget).toBe(500)
      expect(budget.reviewBudget).toBe(3)
      expect(budget.memoryStorageBudget).toBe(DEFAULT_COGNITIVE_BUDGET.memoryStorageBudget)
    })
  })

  describe('isWithinPromptTokenBudget', () => {
    it('should return true when under budget', () => {
      const atoms = [createTestAtom(), createTestAtom()]
      const budget = createCognitiveBudget({ promptTokenBudget: 1000 })
      expect(isWithinPromptTokenBudget(atoms, budget)).toBe(true)
    })

    it('should return false when over budget', () => {
      const atoms = Array.from({ length: 100 }, (_, i) =>
        createTestAtom({ id: `test-${i}`, content: 'x'.repeat(200) })
      )
      const budget = createCognitiveBudget({ promptTokenBudget: 100 })
      expect(isWithinPromptTokenBudget(atoms, budget)).toBe(false)
    })

    it('should return true for empty atom list', () => {
      const budget = createCognitiveBudget({ promptTokenBudget: 0 })
      expect(isWithinPromptTokenBudget([], budget)).toBe(true)
    })
  })

  describe('isWithinReviewBudget', () => {
    it('should return true when under review budget', () => {
      const budget = createCognitiveBudget({ reviewBudget: 5 })
      expect(isWithinReviewBudget(3, budget)).toBe(true)
    })

    it('should return false when over review budget', () => {
      const budget = createCognitiveBudget({ reviewBudget: 5 })
      expect(isWithinReviewBudget(10, budget)).toBe(false)
    })

    it('should return true when exactly at budget', () => {
      const budget = createCognitiveBudget({ reviewBudget: 5 })
      expect(isWithinReviewBudget(5, budget)).toBe(true)
    })
  })

  describe('isWithinStorageBudget', () => {
    it('should return true when under storage budget', () => {
      const budget = createCognitiveBudget({ memoryStorageBudget: 100 })
      expect(isWithinStorageBudget(50, budget)).toBe(true)
    })

    it('should return false when over storage budget', () => {
      const budget = createCognitiveBudget({ memoryStorageBudget: 100 })
      expect(isWithinStorageBudget(150, budget)).toBe(false)
    })
  })

  describe('allocatePromptBudget', () => {
    it('should allocate budget proportionally to quality', () => {
      const atoms = [
        createTestAtom({ id: 'high', confidence: 0.9, strength: 0.9 }),
        createTestAtom({ id: 'low', confidence: 0.3, strength: 0.3 })
      ]
      const budget = createCognitiveBudget({ promptTokenBudget: 1000 })
      const allocation = allocatePromptBudget(atoms, budget)

      expect(allocation.length).toBe(2)
      expect(allocation[0].atomId).toBe('high')
      expect(allocation[1].atomId).toBe('low')
      expect(allocation[0].tokenAllocation).toBeGreaterThan(allocation[1].tokenAllocation)
    })

    it('should not exceed total budget', () => {
      const atoms = Array.from({ length: 5 }, (_, i) =>
        createTestAtom({ id: `test-${i}`, content: 'x'.repeat(100) })
      )
      const budget = createCognitiveBudget({ promptTokenBudget: 500 })
      const allocation = allocatePromptBudget(atoms, budget)

      const totalAllocated = allocation.reduce((sum, a) => sum + a.tokenAllocation, 0)
      expect(totalAllocated).toBeLessThanOrEqual(budget.promptTokenBudget)
    })

    it('should return empty allocation for empty atoms', () => {
      const budget = createCognitiveBudget()
      const allocation = allocatePromptBudget([], budget)
      expect(allocation).toEqual([])
    })

    it('should prioritize high-quality atoms when budget is tight', () => {
      const atoms = [
        createTestAtom({ id: 'best', confidence: 0.95, strength: 0.95, accessCount: 100 }),
        createTestAtom({ id: 'good', confidence: 0.7, strength: 0.7, accessCount: 10 }),
        createTestAtom({ id: 'ok', confidence: 0.5, strength: 0.5, accessCount: 1 }),
        createTestAtom({ id: 'bad', confidence: 0.2, strength: 0.2, accessCount: 0 })
      ]
      const budget = createCognitiveBudget({ promptTokenBudget: 200 })
      const allocation = allocatePromptBudget(atoms, budget)

      const allocatedIds = allocation.map(a => a.atomId)
      expect(allocatedIds).toContain('best')
      expect(allocatedIds).toContain('good')
    })
  })

  describe('allocateReviewBudget', () => {
    it('should return at most reviewBudget items', () => {
      const atoms = Array.from({ length: 10 }, (_, i) =>
        createTestAtom({ id: `test-${i}` })
      )
      const budget = createCognitiveBudget({ reviewBudget: 3 })
      const allocation = allocateReviewBudget(atoms, budget)

      expect(allocation.length).toBeLessThanOrEqual(3)
    })

    it('should prioritize high-gravity atoms for review', () => {
      const atoms = [
        createTestAtom({ id: 'low', confidence: 0.3, strength: 0.2 }),
        createTestAtom({ id: 'high', confidence: 0.9, strength: 0.9, accessCount: 50 }),
        createTestAtom({ id: 'mid', confidence: 0.5, strength: 0.5 })
      ]
      const budget = createCognitiveBudget({ reviewBudget: 2 })
      const allocation = allocateReviewBudget(atoms, budget)

      expect(allocation[0].atomId).toBe('high')
    })

    it('should return empty for empty atoms', () => {
      const budget = createCognitiveBudget()
      const allocation = allocateReviewBudget([], budget)
      expect(allocation).toEqual([])
    })
  })
})
