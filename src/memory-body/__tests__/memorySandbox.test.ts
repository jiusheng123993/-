import { describe, expect, it } from 'vitest'
import {
  createMemorySandbox,
  addToSandbox,
  reviewSandboxedAtom,
  promoteSandboxedAtom,
  checkPromotionEligibility,
  autoPromoteEligible,
  expireStaleCandidates,
  getSandboxedAtomsByStatus,
  getSandboxedAtomsForScenario,
  removeFromSandbox,
  clearSandbox,
  summarizeSandbox,
  type MemorySandbox,
  type SandboxedAtom
} from '../sandbox/memorySandbox'
import type { MemoryAtom } from '../core/memoryBodyTypes'

function createTestAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: `atom-${Math.random().toString(36).slice(2, 7)}`,
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
    evidence: [
      { type: 'chat', source: 'msg-1', timestamp: new Date().toISOString() },
      { type: 'chat', source: 'msg-2', timestamp: new Date().toISOString() }
    ],
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

describe('MemorySandbox', () => {
  describe('createMemorySandbox', () => {
    it('should create an empty sandbox', () => {
      const sandbox = createMemorySandbox()

      expect(sandbox.id).toMatch(/^sandbox-/)
      expect(sandbox.atoms).toEqual([])
      expect(sandbox.maxCapacity).toBe(50)
      expect(sandbox.autoPromoteEnabled).toBe(false)
      expect(sandbox.createdAt).toBeDefined()
      expect(sandbox.updatedAt).toBeDefined()
    })

    it('should accept overrides', () => {
      const sandbox = createMemorySandbox({
        maxCapacity: 100,
        autoPromoteEnabled: true
      })

      expect(sandbox.maxCapacity).toBe(100)
      expect(sandbox.autoPromoteEnabled).toBe(true)
    })
  })

  describe('addToSandbox', () => {
    it('should add an atom to the sandbox', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom()

      const { sandbox: updated, sandboxed } = addToSandbox(sandbox, atom, 'New candidate memory')

      expect(updated.atoms).toHaveLength(1)
      expect(sandboxed).not.toBeNull()
      expect(sandboxed!.status).toBe('candidate')
      expect(sandboxed!.reason).toBe('New candidate memory')
      expect(sandboxed!.atom.lifecycle).toBe('draft')
    })

    it('should not add duplicate atoms', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom()

      const { sandbox: first } = addToSandbox(sandbox, atom, 'First')
      const { sandbox: second, sandboxed } = addToSandbox(first, atom, 'Second')

      expect(second.atoms).toHaveLength(1)
      expect(sandboxed).toBeNull()
    })

    it('should not add when at capacity', () => {
      const sandbox = createMemorySandbox({ maxCapacity: 2 })
      const a1 = createTestAtom({ id: 'atom-1' })
      const a2 = createTestAtom({ id: 'atom-2' })
      const a3 = createTestAtom({ id: 'atom-3' })

      const { sandbox: s1 } = addToSandbox(sandbox, a1, 'First')
      const { sandbox: s2 } = addToSandbox(s1, a2, 'Second')
      const { sandbox: s3, sandboxed } = addToSandbox(s2, a3, 'Third')

      expect(s3.atoms).toHaveLength(2)
      expect(sandboxed).toBeNull()
    })

    it('should accept custom promotion criteria', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom()

      const { sandboxed } = addToSandbox(sandbox, atom, 'Test', {
        minConfidence: 0.9,
        minEvidenceCount: 5
      })

      expect(sandboxed!.promotionCriteria.minConfidence).toBe(0.9)
      expect(sandboxed!.promotionCriteria.minEvidenceCount).toBe(5)
      expect(sandboxed!.promotionCriteria.minReinforcementCount).toBe(1)
    })
  })

  describe('reviewSandboxedAtom', () => {
    it('should approve an atom', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom()
      const { sandbox: withAtom } = addToSandbox(sandbox, atom, 'Test')

      const updated = reviewSandboxedAtom(withAtom, atom.id, 'approved')

      const reviewed = updated.atoms.find(s => s.atom.id === atom.id)
      expect(reviewed!.status).toBe('approved')
      expect(reviewed!.reviewedAt).toBeDefined()
      expect(reviewed!.reviewCount).toBe(1)
    })

    it('should reject an atom', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom()
      const { sandbox: withAtom } = addToSandbox(sandbox, atom, 'Test')

      const updated = reviewSandboxedAtom(withAtom, atom.id, 'rejected')

      const reviewed = updated.atoms.find(s => s.atom.id === atom.id)
      expect(reviewed!.status).toBe('rejected')
    })

    it('should not modify other atoms', () => {
      const sandbox = createMemorySandbox()
      const a1 = createTestAtom({ id: 'atom-1' })
      const a2 = createTestAtom({ id: 'atom-2' })
      const { sandbox: s1 } = addToSandbox(sandbox, a1, 'First')
      const { sandbox: s2 } = addToSandbox(s1, a2, 'Second')

      const updated = reviewSandboxedAtom(s2, a1.id, 'approved')

      const other = updated.atoms.find(s => s.atom.id === a2.id)
      expect(other!.status).toBe('candidate')
    })
  })

  describe('promoteSandboxedAtom', () => {
    it('should promote an approved atom to active', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom()
      const { sandbox: withAtom } = addToSandbox(sandbox, atom, 'Test')
      const reviewed = reviewSandboxedAtom(withAtom, atom.id, 'approved')

      const { sandbox: updated, promotedAtom } = promoteSandboxedAtom(reviewed, atom.id)

      expect(promotedAtom).not.toBeNull()
      expect(promotedAtom!.lifecycle).toBe('active')
      const entry = updated.atoms.find(s => s.atom.id === atom.id)
      expect(entry!.status).toBe('promoted')
    })

    it('should not promote a non-approved atom', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom()
      const { sandbox: withAtom } = addToSandbox(sandbox, atom, 'Test')

      const { sandbox: updated, promotedAtom } = promoteSandboxedAtom(withAtom, atom.id)

      expect(promotedAtom).toBeNull()
      expect(updated.atoms[0].status).toBe('candidate')
    })

    it('should return null for non-existent atom', () => {
      const sandbox = createMemorySandbox()
      const { promotedAtom } = promoteSandboxedAtom(sandbox, 'non-existent')

      expect(promotedAtom).toBeNull()
    })
  })

  describe('checkPromotionEligibility', () => {
    it('should mark eligible when all criteria met', () => {
      const atom = createTestAtom({
        confidence: 0.8,
        evidence: [
          { type: 'chat', source: 'msg-1', timestamp: new Date().toISOString() },
          { type: 'chat', source: 'msg-2', timestamp: new Date().toISOString() }
        ],
        accessCount: 3,
        createdAt: new Date().toISOString()
      })
      const entry: SandboxedAtom = {
        atom,
        status: 'candidate',
        reason: 'test',
        addedAt: new Date().toISOString(),
        reviewCount: 0,
        promotionCriteria: {
          minConfidence: 0.6,
          minEvidenceCount: 2,
          minReinforcementCount: 1,
          maxAgeDays: 30,
          requireUserConfirmation: true
        }
      }

      const { eligible, reasons } = checkPromotionEligibility(entry)

      expect(eligible).toBe(true)
      expect(reasons).toEqual([])
    })

    it('should mark ineligible for low confidence', () => {
      const atom = createTestAtom({ confidence: 0.3 })
      const entry: SandboxedAtom = {
        atom,
        status: 'candidate',
        reason: 'test',
        addedAt: new Date().toISOString(),
        reviewCount: 0,
        promotionCriteria: {
          minConfidence: 0.6,
          minEvidenceCount: 2,
          minReinforcementCount: 1,
          maxAgeDays: 30,
          requireUserConfirmation: true
        }
      }

      const { eligible, reasons } = checkPromotionEligibility(entry)

      expect(eligible).toBe(false)
      expect(reasons.some(r => r.includes('Confidence'))).toBe(true)
    })

    it('should mark ineligible for insufficient evidence', () => {
      const atom = createTestAtom({ evidence: [] })
      const entry: SandboxedAtom = {
        atom,
        status: 'candidate',
        reason: 'test',
        addedAt: new Date().toISOString(),
        reviewCount: 0,
        promotionCriteria: {
          minConfidence: 0.6,
          minEvidenceCount: 2,
          minReinforcementCount: 1,
          maxAgeDays: 30,
          requireUserConfirmation: true
        }
      }

      const { eligible, reasons } = checkPromotionEligibility(entry)

      expect(eligible).toBe(false)
      expect(reasons.some(r => r.includes('Evidence'))).toBe(true)
    })

    it('should mark ineligible for old atoms', () => {
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      const atom = createTestAtom({ createdAt: oldDate })
      const entry: SandboxedAtom = {
        atom,
        status: 'candidate',
        reason: 'test',
        addedAt: new Date().toISOString(),
        reviewCount: 0,
        promotionCriteria: {
          minConfidence: 0.6,
          minEvidenceCount: 2,
          minReinforcementCount: 1,
          maxAgeDays: 30,
          requireUserConfirmation: true
        }
      }

      const { eligible, reasons } = checkPromotionEligibility(entry)

      expect(eligible).toBe(false)
      expect(reasons.some(r => r.includes('Age'))).toBe(true)
    })
  })

  describe('autoPromoteEligible', () => {
    it('should auto-promote eligible candidates', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom({
        confidence: 0.9,
        evidence: [
          { type: 'chat', source: 'msg-1', timestamp: new Date().toISOString() },
          { type: 'chat', source: 'msg-2', timestamp: new Date().toISOString() }
        ],
        accessCount: 3
      })
      const { sandbox: withAtom } = addToSandbox(sandbox, atom, 'Test')

      const result = autoPromoteEligible(withAtom)

      expect(result.promoted).toHaveLength(1)
      expect(result.promoted[0].status).toBe('approved')
      expect(result.rejected).toHaveLength(0)
      expect(result.expired).toHaveLength(0)
    })

    it('should reject ineligible candidates', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom({ confidence: 0.2, evidence: [] })
      const { sandbox: withAtom } = addToSandbox(sandbox, atom, 'Test')

      const result = autoPromoteEligible(withAtom)

      expect(result.promoted).toHaveLength(0)
      expect(result.rejected).toHaveLength(1)
    })

    it('should skip non-candidate statuses', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom({ confidence: 0.9 })
      const { sandbox: withAtom } = addToSandbox(sandbox, atom, 'Test')
      const reviewed = reviewSandboxedAtom(withAtom, atom.id, 'approved')

      const result = autoPromoteEligible(reviewed)

      expect(result.promoted).toHaveLength(0)
      expect(result.rejected).toHaveLength(0)
    })
  })

  describe('expireStaleCandidates', () => {
    it('should expire old candidates', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom()
      const { sandbox: withAtom } = addToSandbox(sandbox, atom, 'Test')

      const oldEntry = {
        ...withAtom.atoms[0],
        addedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      }
      const modified: MemorySandbox = {
        ...withAtom,
        atoms: [oldEntry]
      }

      const updated = expireStaleCandidates(modified, 14)

      expect(updated.atoms[0].status).toBe('expired')
    })

    it('should not expire recent candidates', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom()
      const { sandbox: withAtom } = addToSandbox(sandbox, atom, 'Test')

      const updated = expireStaleCandidates(withAtom, 14)

      expect(updated.atoms[0].status).toBe('candidate')
    })

    it('should not affect non-candidate statuses', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom()
      const { sandbox: withAtom } = addToSandbox(sandbox, atom, 'Test')
      const reviewed = reviewSandboxedAtom(withAtom, atom.id, 'approved')

      const updated = expireStaleCandidates(reviewed, 1)

      expect(updated.atoms[0].status).toBe('approved')
    })
  })

  describe('getSandboxedAtomsByStatus', () => {
    it('should filter atoms by status', () => {
      const sandbox = createMemorySandbox()
      const a1 = createTestAtom({ id: 'atom-1' })
      const a2 = createTestAtom({ id: 'atom-2' })
      const { sandbox: s1 } = addToSandbox(sandbox, a1, 'First')
      const { sandbox: s2 } = addToSandbox(s1, a2, 'Second')
      const reviewed = reviewSandboxedAtom(s2, a1.id, 'approved')

      const candidates = getSandboxedAtomsByStatus(reviewed, 'candidate')
      const approved = getSandboxedAtomsByStatus(reviewed, 'approved')

      expect(candidates).toHaveLength(1)
      expect(candidates[0].atom.id).toBe('atom-2')
      expect(approved).toHaveLength(1)
      expect(approved[0].atom.id).toBe('atom-1')
    })
  })

  describe('getSandboxedAtomsForScenario', () => {
    it('should filter atoms by scenario', () => {
      const sandbox = createMemorySandbox()
      const a1 = createTestAtom({ id: 'atom-1', scenarios: ['general'] })
      const a2 = createTestAtom({ id: 'atom-2', scenarios: ['study'] })
      const { sandbox: s1 } = addToSandbox(sandbox, a1, 'First')
      const { sandbox: s2 } = addToSandbox(s1, a2, 'Second')

      const generalAtoms = getSandboxedAtomsForScenario(s2, 'general')
      const studyAtoms = getSandboxedAtomsForScenario(s2, 'study')

      expect(generalAtoms).toHaveLength(1)
      expect(generalAtoms[0].atom.id).toBe('atom-1')
      expect(studyAtoms).toHaveLength(1)
      expect(studyAtoms[0].atom.id).toBe('atom-2')
    })
  })

  describe('removeFromSandbox', () => {
    it('should remove an atom from sandbox', () => {
      const sandbox = createMemorySandbox()
      const atom = createTestAtom()
      const { sandbox: withAtom } = addToSandbox(sandbox, atom, 'Test')

      const updated = removeFromSandbox(withAtom, atom.id)

      expect(updated.atoms).toHaveLength(0)
    })

    it('should not fail when removing non-existent atom', () => {
      const sandbox = createMemorySandbox()
      const updated = removeFromSandbox(sandbox, 'non-existent')

      expect(updated.atoms).toHaveLength(0)
    })
  })

  describe('clearSandbox', () => {
    it('should remove all atoms', () => {
      const sandbox = createMemorySandbox()
      const a1 = createTestAtom({ id: 'atom-1' })
      const a2 = createTestAtom({ id: 'atom-2' })
      const { sandbox: s1 } = addToSandbox(sandbox, a1, 'First')
      const { sandbox: s2 } = addToSandbox(s1, a2, 'Second')

      const cleared = clearSandbox(s2)

      expect(cleared.atoms).toEqual([])
    })
  })

  describe('summarizeSandbox', () => {
    it('should summarize sandbox state', () => {
      const sandbox = createMemorySandbox()
      const a1 = createTestAtom({ id: 'atom-1' })
      const a2 = createTestAtom({ id: 'atom-2' })
      const a3 = createTestAtom({ id: 'atom-3' })
      const { sandbox: s1 } = addToSandbox(sandbox, a1, 'First')
      const { sandbox: s2 } = addToSandbox(s1, a2, 'Second')
      const { sandbox: s3 } = addToSandbox(s2, a3, 'Third')
      const reviewed = reviewSandboxedAtom(s3, a1.id, 'approved')
      const rejected = reviewSandboxedAtom(reviewed, a2.id, 'rejected')

      const summary = summarizeSandbox(rejected)

      expect(summary.totalCandidates).toBe(1)
      expect(summary.approved).toBe(1)
      expect(summary.rejected).toBe(1)
      expect(summary.underReview).toBe(0)
      expect(summary.expired).toBe(0)
      expect(summary.promoted).toBe(0)
      expect(summary.capacityUsage).toBe('3/50')
    })

    it('should summarize empty sandbox', () => {
      const sandbox = createMemorySandbox()
      const summary = summarizeSandbox(sandbox)

      expect(summary.totalCandidates).toBe(0)
      expect(summary.capacityUsage).toBe('0/50')
    })
  })
})
