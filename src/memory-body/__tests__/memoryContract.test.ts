import { describe, expect, it } from 'vitest'
import {
  createMemoryContract,
  addContractTerm,
  removeContractTerm,
  allowScenario,
  excludeScenario,
  setRequiresConfirmation,
  setConfidenceThreshold,
  setMaxUsageCount,
  setExpiration,
  recordUsage,
  deactivateContract,
  activateContract,
  validateContract,
  buildContractFromAtom,
  summarizeContract
} from '../contract/memoryContract'
import type { MemoryAtom } from '../core/memoryBodyTypes'

function createTestAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: 'test-atom-1',
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
    scenarios: ['general'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    accessCount: 5,
    contradictionOf: [],
    ...overrides
  }
}

describe('MemoryContract', () => {
  describe('createMemoryContract', () => {
    it('should create a contract with default values', () => {
      const contract = createMemoryContract('atom-1')

      expect(contract.id).toMatch(/^contract-/)
      expect(contract.atomId).toBe('atom-1')
      expect(contract.terms).toEqual([])
      expect(contract.allowedScenarios).toHaveLength(9)
      expect(contract.excludedScenarios).toEqual([])
      expect(contract.requiresConfirmation).toBe(false)
      expect(contract.confidenceThreshold).toBe(0.3)
      expect(contract.maxUsageCount).toBe(100)
      expect(contract.currentUsageCount).toBe(0)
      expect(contract.expiresAt).toBeNull()
      expect(contract.isActive).toBe(true)
    })

    it('should accept overrides', () => {
      const contract = createMemoryContract('atom-1', {
        requiresConfirmation: true,
        confidenceThreshold: 0.7,
        maxUsageCount: 50,
        expiresAt: '2026-12-31T00:00:00.000Z'
      })

      expect(contract.requiresConfirmation).toBe(true)
      expect(contract.confidenceThreshold).toBe(0.7)
      expect(contract.maxUsageCount).toBe(50)
      expect(contract.expiresAt).toBe('2026-12-31T00:00:00.000Z')
    })
  })

  describe('addContractTerm', () => {
    it('should add a new term', () => {
      const contract = createMemoryContract('atom-1')
      const updated = addContractTerm(contract, 'requires_confirmation', true, 'Needs user confirmation')

      expect(updated.terms).toHaveLength(1)
      expect(updated.terms[0].clause).toBe('requires_confirmation')
      expect(updated.terms[0].value).toBe(true)
    })

    it('should update existing term with same clause', () => {
      const contract = createMemoryContract('atom-1')
      const withTerm = addContractTerm(contract, 'requires_confirmation', true, 'Old desc')
      const updated = addContractTerm(withTerm, 'requires_confirmation', false, 'New desc')

      expect(updated.terms).toHaveLength(1)
      expect(updated.terms[0].value).toBe(false)
      expect(updated.terms[0].description).toBe('New desc')
    })
  })

  describe('removeContractTerm', () => {
    it('should remove a term by clause', () => {
      const contract = createMemoryContract('atom-1')
      const withTerm = addContractTerm(contract, 'requires_confirmation', true, 'desc')
      const updated = removeContractTerm(withTerm, 'requires_confirmation')

      expect(updated.terms).toHaveLength(0)
    })

    it('should not fail when removing non-existent term', () => {
      const contract = createMemoryContract('atom-1')
      const updated = removeContractTerm(contract, 'requires_confirmation')

      expect(updated.terms).toHaveLength(0)
    })
  })

  describe('allowScenario', () => {
    it('should add a scenario to allowed list', () => {
      const contract = createMemoryContract('atom-1', { allowedScenarios: ['general'] })
      const updated = allowScenario(contract, 'study')

      expect(updated.allowedScenarios).toContain('study')
    })

    it('should remove from excluded when allowing', () => {
      const contract = createMemoryContract('atom-1', {
        allowedScenarios: ['general'],
        excludedScenarios: ['study']
      })
      const updated = allowScenario(contract, 'study')

      expect(updated.allowedScenarios).toContain('study')
      expect(updated.excludedScenarios).not.toContain('study')
    })

    it('should not duplicate allowed scenarios', () => {
      const contract = createMemoryContract('atom-1', { allowedScenarios: ['general'] })
      const updated = allowScenario(contract, 'general')

      expect(updated.allowedScenarios).toEqual(['general'])
    })
  })

  describe('excludeScenario', () => {
    it('should add a scenario to excluded list', () => {
      const contract = createMemoryContract('atom-1')
      const updated = excludeScenario(contract, 'knowledge_graph')

      expect(updated.excludedScenarios).toContain('knowledge_graph')
    })

    it('should remove from allowed when excluding', () => {
      const contract = createMemoryContract('atom-1')
      const updated = excludeScenario(contract, 'general')

      expect(updated.allowedScenarios).not.toContain('general')
      expect(updated.excludedScenarios).toContain('general')
    })
  })

  describe('setRequiresConfirmation', () => {
    it('should set requires confirmation flag', () => {
      const contract = createMemoryContract('atom-1')
      const updated = setRequiresConfirmation(contract, true)

      expect(updated.requiresConfirmation).toBe(true)
    })
  })

  describe('setConfidenceThreshold', () => {
    it('should set confidence threshold', () => {
      const contract = createMemoryContract('atom-1')
      const updated = setConfidenceThreshold(contract, 0.8)

      expect(updated.confidenceThreshold).toBe(0.8)
    })

    it('should clamp threshold between 0 and 1', () => {
      const contract = createMemoryContract('atom-1')

      const tooLow = setConfidenceThreshold(contract, -0.5)
      const tooHigh = setConfidenceThreshold(contract, 1.5)

      expect(tooLow.confidenceThreshold).toBe(0)
      expect(tooHigh.confidenceThreshold).toBe(1)
    })
  })

  describe('setMaxUsageCount', () => {
    it('should set max usage count', () => {
      const contract = createMemoryContract('atom-1')
      const updated = setMaxUsageCount(contract, 200)

      expect(updated.maxUsageCount).toBe(200)
    })

    it('should not allow negative max usage', () => {
      const contract = createMemoryContract('atom-1')
      const updated = setMaxUsageCount(contract, -10)

      expect(updated.maxUsageCount).toBe(0)
    })
  })

  describe('setExpiration', () => {
    it('should set expiration date', () => {
      const contract = createMemoryContract('atom-1')
      const updated = setExpiration(contract, '2026-12-31T00:00:00.000Z')

      expect(updated.expiresAt).toBe('2026-12-31T00:00:00.000Z')
    })

    it('should allow null expiration', () => {
      const contract = createMemoryContract('atom-1', { expiresAt: '2026-12-31T00:00:00.000Z' })
      const updated = setExpiration(contract, null)

      expect(updated.expiresAt).toBeNull()
    })
  })

  describe('recordUsage', () => {
    it('should increment usage count', () => {
      const contract = createMemoryContract('atom-1')
      const updated = recordUsage(contract)

      expect(updated.currentUsageCount).toBe(1)
    })

    it('should accumulate usage', () => {
      const contract = createMemoryContract('atom-1')
      let updated = recordUsage(contract)
      updated = recordUsage(updated)
      updated = recordUsage(updated)

      expect(updated.currentUsageCount).toBe(3)
    })
  })

  describe('deactivateContract / activateContract', () => {
    it('should deactivate a contract', () => {
      const contract = createMemoryContract('atom-1')
      const updated = deactivateContract(contract)

      expect(updated.isActive).toBe(false)
    })

    it('should activate a contract', () => {
      const contract = createMemoryContract('atom-1')
      const deactivated = deactivateContract(contract)
      const activated = activateContract(deactivated)

      expect(activated.isActive).toBe(true)
    })
  })

  describe('validateContract', () => {
    it('should validate a valid contract', () => {
      const contract = createMemoryContract('atom-1')
      const atom = createTestAtom({ confidence: 0.8, lifecycle: 'confirmed' })

      const result = validateContract(contract, atom, 'general')

      expect(result.valid).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should block inactive contract', () => {
      const contract = createMemoryContract('atom-1')
      const deactivated = deactivateContract(contract)
      const atom = createTestAtom()

      const result = validateContract(deactivated, atom, 'general')

      expect(result.valid).toBe(false)
      expect(result.violations.some(v => v.severity === 'block')).toBe(true)
    })

    it('should block excluded scenario', () => {
      const contract = createMemoryContract('atom-1')
      const withExclusion = excludeScenario(contract, 'study')
      const atom = createTestAtom()

      const result = validateContract(withExclusion, atom, 'study')

      expect(result.valid).toBe(false)
      expect(result.violations.some(v => v.clause === 'scenario_locked')).toBe(true)
    })

    it('should warn on low confidence', () => {
      const contract = createMemoryContract('atom-1', { confidenceThreshold: 0.7 })
      const atom = createTestAtom({ confidence: 0.3 })

      const result = validateContract(contract, atom, 'general')

      expect(result.violations.some(v => v.clause === 'confidence_threshold')).toBe(true)
    })

    it('should block when usage exceeds max', () => {
      const contract = createMemoryContract('atom-1', { maxUsageCount: 5 })
      let used = contract
      for (let i = 0; i < 5; i++) {
        used = recordUsage(used)
      }
      const atom = createTestAtom()

      const result = validateContract(used, atom, 'general')

      expect(result.valid).toBe(false)
      expect(result.violations.some(v => v.clause === 'max_usage_count')).toBe(true)
    })

    it('should block expired contract', () => {
      const contract = createMemoryContract('atom-1', { expiresAt: '2020-01-01T00:00:00.000Z' })
      const atom = createTestAtom()

      const result = validateContract(contract, atom, 'general')

      expect(result.valid).toBe(false)
      expect(result.violations.some(v => v.clause === 'auto_expire')).toBe(true)
    })

    it('should warn when confirmation required but atom not confirmed', () => {
      const contract = createMemoryContract('atom-1', { requiresConfirmation: true })
      const atom = createTestAtom({ lifecycle: 'draft' })

      const result = validateContract(contract, atom, 'general')

      expect(result.violations.some(v => v.clause === 'requires_confirmation')).toBe(true)
    })
  })

  describe('buildContractFromAtom', () => {
    it('should build contract for normal atom', () => {
      const atom = createTestAtom({ sensitivity: 'low', lifecycle: 'active' })
      const contract = buildContractFromAtom(atom)

      expect(contract.atomId).toBe(atom.id)
      expect(contract.allowedScenarios).toHaveLength(9)
    })

    it('should exclude knowledge_graph for sensitive atoms', () => {
      const atom = createTestAtom({ sensitivity: 'sensitive' })
      const contract = buildContractFromAtom(atom)

      expect(contract.excludedScenarios).toContain('knowledge_graph')
    })

    it('should block all scenarios for forbidden atoms', () => {
      const atom = createTestAtom({ sensitivity: 'forbidden' })
      const contract = buildContractFromAtom(atom)

      expect(contract.allowedScenarios).toEqual([])
      expect(contract.excludedScenarios).toHaveLength(9)
      expect(contract.requiresConfirmation).toBe(true)
      expect(contract.confidenceThreshold).toBe(1.0)
      expect(contract.maxUsageCount).toBe(0)
    })

    it('should restrict draft atoms', () => {
      const atom = createTestAtom({ lifecycle: 'draft' })
      const contract = buildContractFromAtom(atom)

      expect(contract.allowedScenarios).toEqual(['general'])
      expect(contract.excludedScenarios).toContain('goal_planning')
      expect(contract.requiresConfirmation).toBe(true)
      expect(contract.confidenceThreshold).toBe(0.5)
      expect(contract.maxUsageCount).toBe(3)
    })

    it('should require confirmation for non-confirmed atoms', () => {
      const atom = createTestAtom({ lifecycle: 'active' })
      const contract = buildContractFromAtom(atom)

      expect(contract.requiresConfirmation).toBe(true)
    })

    it('should not require confirmation for confirmed atoms', () => {
      const atom = createTestAtom({ lifecycle: 'confirmed' })
      const contract = buildContractFromAtom(atom)

      expect(contract.requiresConfirmation).toBe(false)
    })
  })

  describe('summarizeContract', () => {
    it('should summarize a contract', () => {
      const contract = createMemoryContract('atom-1')
      const summary = summarizeContract(contract)

      expect(summary.id).toBe(contract.id)
      expect(summary.atomId).toBe('atom-1')
      expect(summary.isActive).toBe(true)
      expect(summary.termCount).toBe(0)
      expect(summary.allowedScenarioCount).toBe(9)
      expect(summary.excludedScenarioCount).toBe(0)
      expect(summary.requiresConfirmation).toBe(false)
      expect(summary.confidenceThreshold).toBe(0.3)
      expect(summary.usageRatio).toBe('0/100')
      expect(summary.isExpired).toBe(false)
      expect(summary.violationRisk).toBe('low')
    })

    it('should report high risk for inactive contract', () => {
      const contract = createMemoryContract('atom-1')
      const deactivated = deactivateContract(contract)
      const summary = summarizeContract(deactivated)

      expect(summary.violationRisk).toBe('high')
    })

    it('should report high risk for expired contract', () => {
      const contract = createMemoryContract('atom-1', { expiresAt: '2020-01-01T00:00:00.000Z' })
      const summary = summarizeContract(contract)

      expect(summary.violationRisk).toBe('high')
    })

    it('should report medium risk when usage near max', () => {
      const contract = createMemoryContract('atom-1', { maxUsageCount: 10 })
      let used = contract
      for (let i = 0; i < 8; i++) {
        used = recordUsage(used)
      }
      const summary = summarizeContract(used)

      expect(summary.violationRisk).toBe('medium')
    })
  })
})
