import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import {
  CONSTITUTION_PRINCIPLES,
  checkAtomAgainstConstitution,
  checkAtomsAgainstConstitution,
  checkCrossContextIsolation,
  checkCorrectionPriority,
  checkOverfitting,
  summarizeConstitution,
  getPrincipleById,
  getPrinciplesByCategory
} from '../constitution/memoryConstitution'

const scope = { userId: 'user-1', projectId: 'project-1' }
const timestamp = '2026-06-24T00:00:00.000Z'

function createAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  const id = overrides.id ?? 'atom-1'
  return {
    id,
    scope: overrides.scope ?? scope,
    layer: overrides.layer ?? 'semantic',
    type: overrides.type ?? 'preference',
    subject: overrides.subject ?? 'user',
    predicate: overrides.predicate ?? 'likes',
    object: overrides.object ?? 'test',
    content: overrides.content ?? '测试记忆',
    source: overrides.source ?? 'chat',
    confidence: overrides.confidence ?? 0.78,
    strength: overrides.strength ?? 0.5,
    emotionalWeight: overrides.emotionalWeight ?? 0.1,
    sensitivity: overrides.sensitivity ?? 'personal',
    lifecycle: overrides.lifecycle ?? 'active',
    evidence: overrides.evidence ?? [{
      id: `evidence-${id}`,
      source: 'chat',
      sourceText: '测试证据',
      timestamp,
      confidence: 0.8
    }],
    tags: overrides.tags ?? [],
    scenarios: overrides.scenarios ?? ['chat'],
    createdAt: overrides.createdAt ?? timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
    lastAccessedAt: overrides.lastAccessedAt ?? timestamp,
    accessCount: overrides.accessCount ?? 1,
    contradictionOf: overrides.contradictionOf ?? []
  }
}

describe('MemoryConstitution', () => {
  describe('CONSTITUTION_PRINCIPLES', () => {
    it('should have 10 principles', () => {
      expect(CONSTITUTION_PRINCIPLES).toHaveLength(10)
    })

    it('should have unique ids', () => {
      const ids = CONSTITUTION_PRINCIPLES.map(p => p.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('should cover all categories', () => {
      const categories = new Set(CONSTITUTION_PRINCIPLES.map(p => p.category))
      expect(categories).toContain('ownership')
      expect(categories).toContain('transparency')
      expect(categories).toContain('safety')
      expect(categories).toContain('governance')
      expect(categories).toContain('quality')
    })
  })

  describe('checkAtomAgainstConstitution', () => {
    it('should flag forbidden atoms as critical violation', () => {
      const atom = createAtom({ sensitivity: 'forbidden' })
      const result = checkAtomAgainstConstitution(atom)
      expect(result.compliant).toBe(false)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0].principleId).toBe('forbidden_no_prompt')
      expect(result.violations[0].severity).toBe('critical')
    })

    it('should flag sensitive unconfirmed atoms as error', () => {
      const atom = createAtom({ sensitivity: 'sensitive', lifecycle: 'active' })
      const result = checkAtomAgainstConstitution(atom)
      expect(result.compliant).toBe(false)
      const sensitiveViolation = result.violations.find(v => v.principleId === 'sensitive_default_no_record')
      expect(sensitiveViolation).toBeDefined()
      expect(sensitiveViolation!.severity).toBe('error')
    })

    it('should flag private unconfirmed atoms as error', () => {
      const atom = createAtom({ sensitivity: 'private', lifecycle: 'active' })
      const result = checkAtomAgainstConstitution(atom)
      const sensitiveViolation = result.violations.find(v => v.principleId === 'sensitive_default_no_record')
      expect(sensitiveViolation).toBeDefined()
    })

    it('should allow sensitive confirmed atoms', () => {
      const atom = createAtom({ sensitivity: 'sensitive', lifecycle: 'confirmed' })
      const result = checkAtomAgainstConstitution(atom)
      const sensitiveViolation = result.violations.find(v => v.principleId === 'sensitive_default_no_record')
      expect(sensitiveViolation).toBeUndefined()
    })

    it('should allow sensitive protected atoms', () => {
      const atom = createAtom({ sensitivity: 'sensitive', lifecycle: 'protected' })
      const result = checkAtomAgainstConstitution(atom)
      const sensitiveViolation = result.violations.find(v => v.principleId === 'sensitive_default_no_record')
      expect(sensitiveViolation).toBeUndefined()
    })

    it('should flag low confidence unconfirmed atoms as warning', () => {
      const atom = createAtom({ confidence: 0.3, lifecycle: 'active' })
      const result = checkAtomAgainstConstitution(atom)
      const inferenceViolation = result.violations.find(v => v.principleId === 'high_risk_inference_confirm')
      expect(inferenceViolation).toBeDefined()
      expect(inferenceViolation!.severity).toBe('warning')
    })

    it('should allow low confidence draft atoms', () => {
      const atom = createAtom({ confidence: 0.3, lifecycle: 'draft' })
      const result = checkAtomAgainstConstitution(atom)
      const inferenceViolation = result.violations.find(v => v.principleId === 'high_risk_inference_confirm')
      expect(inferenceViolation).toBeUndefined()
    })

    it('should flag weak emotional atoms as warning', () => {
      const atom = createAtom({ type: 'emotion', layer: 'emotional', strength: 0.3 })
      const result = checkAtomAgainstConstitution(atom)
      const emotionViolation = result.violations.find(v => v.principleId === 'temporary_emotion_no_permanent')
      expect(emotionViolation).toBeDefined()
      expect(emotionViolation!.severity).toBe('warning')
    })

    it('should allow strong emotional atoms', () => {
      const atom = createAtom({ type: 'emotion', layer: 'emotional', strength: 0.8 })
      const result = checkAtomAgainstConstitution(atom)
      const emotionViolation = result.violations.find(v => v.principleId === 'temporary_emotion_no_permanent')
      expect(emotionViolation).toBeUndefined()
    })

    it('should return compliant for normal atoms', () => {
      const atom = createAtom({ sensitivity: 'personal', lifecycle: 'confirmed', confidence: 0.8, strength: 0.7 })
      const result = checkAtomAgainstConstitution(atom)
      expect(result.compliant).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should detect multiple violations on one atom', () => {
      const atom = createAtom({
        sensitivity: 'sensitive',
        lifecycle: 'active',
        confidence: 0.3,
        type: 'emotion',
        layer: 'emotional',
        strength: 0.2
      })
      const result = checkAtomAgainstConstitution(atom)
      expect(result.compliant).toBe(false)
      expect(result.violations.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('checkAtomsAgainstConstitution', () => {
    it('should aggregate violations from multiple atoms', () => {
      const atom1 = createAtom({ id: 'atom-1', sensitivity: 'forbidden' })
      const atom2 = createAtom({ id: 'atom-2', sensitivity: 'sensitive', lifecycle: 'active' })
      const result = checkAtomsAgainstConstitution([atom1, atom2])
      expect(result.compliant).toBe(false)
      expect(result.violations.length).toBeGreaterThanOrEqual(2)
    })

    it('should return compliant for all clean atoms', () => {
      const atoms = [
        createAtom({ id: 'a1', sensitivity: 'personal', lifecycle: 'confirmed', confidence: 0.8 }),
        createAtom({ id: 'a2', sensitivity: 'public', lifecycle: 'stable', confidence: 0.9 })
      ]
      const result = checkAtomsAgainstConstitution(atoms)
      expect(result.compliant).toBe(true)
      expect(result.violations).toHaveLength(0)
    })
  })

  describe('checkCrossContextIsolation', () => {
    it('should flag cross-project usage of project-scoped types', () => {
      const atom = createAtom({ type: 'preference' })
      const result = checkCrossContextIsolation({
        atom,
        sourceScope: { userId: 'user-1', projectId: 'proj-a' },
        targetScope: { userId: 'user-1', projectId: 'proj-b' }
      })
      expect(result.compliant).toBe(false)
      expect(result.violations[0].principleId).toBe('project_personal_isolation')
      expect(result.violations[0].severity).toBe('error')
    })

    it('should flag cross-user usage as critical', () => {
      const atom = createAtom({ type: 'preference' })
      const result = checkCrossContextIsolation({
        atom,
        sourceScope: { userId: 'user-1', projectId: 'proj-a' },
        targetScope: { userId: 'user-2', projectId: 'proj-a' }
      })
      expect(result.compliant).toBe(false)
      expect(result.violations[0].severity).toBe('critical')
    })

    it('should allow same scope usage', () => {
      const atom = createAtom({ type: 'preference' })
      const result = checkCrossContextIsolation({
        atom,
        sourceScope: { userId: 'user-1', projectId: 'proj-a' },
        targetScope: { userId: 'user-1', projectId: 'proj-a' }
      })
      expect(result.compliant).toBe(true)
    })

    it('should allow cross-project for non-project-scoped types', () => {
      const atom = createAtom({ type: 'goal' })
      const result = checkCrossContextIsolation({
        atom,
        sourceScope: { userId: 'user-1', projectId: 'proj-a' },
        targetScope: { userId: 'user-1', projectId: 'proj-b' }
      })
      expect(result.compliant).toBe(true)
    })
  })

  describe('checkCorrectionPriority', () => {
    it('should flag when correction is older than existing', () => {
      const existing = createAtom({ id: 'existing', updatedAt: '2026-06-24T10:00:00.000Z' })
      const correction = createAtom({ id: 'correction', updatedAt: '2026-06-24T09:00:00.000Z' })
      const result = checkCorrectionPriority({ existingAtom: existing, correctionAtom: correction })
      expect(result.compliant).toBe(false)
      expect(result.violations[0].principleId).toBe('user_correction_priority')
    })

    it('should be compliant when correction is newer', () => {
      const existing = createAtom({ id: 'existing', updatedAt: '2026-06-24T09:00:00.000Z' })
      const correction = createAtom({ id: 'correction', updatedAt: '2026-06-24T10:00:00.000Z' })
      const result = checkCorrectionPriority({ existingAtom: existing, correctionAtom: correction })
      expect(result.compliant).toBe(true)
    })
  })

  describe('checkOverfitting', () => {
    it('should flag stable atom with single evidence', () => {
      const atom = createAtom({ lifecycle: 'stable' })
      const result = checkOverfitting({ atom, evidenceCount: 1, isCrossScenario: false })
      expect(result.compliant).toBe(false)
      expect(result.violations[0].principleId).toBe('avoid_overfitting')
    })

    it('should allow stable atom with multiple evidence', () => {
      const atom = createAtom({ lifecycle: 'stable' })
      const result = checkOverfitting({ atom, evidenceCount: 3, isCrossScenario: false })
      expect(result.compliant).toBe(true)
    })

    it('should flag cross-scenario preference without confirmation', () => {
      const atom = createAtom({ type: 'preference', lifecycle: 'stable' })
      const result = checkOverfitting({ atom, evidenceCount: 3, isCrossScenario: true })
      expect(result.compliant).toBe(false)
    })

    it('should allow cross-scenario for non-preference types', () => {
      const atom = createAtom({ type: 'goal', lifecycle: 'stable' })
      const result = checkOverfitting({ atom, evidenceCount: 3, isCrossScenario: true })
      expect(result.compliant).toBe(true)
    })
  })

  describe('summarizeConstitution', () => {
    it('should return total principles count', () => {
      const summary = summarizeConstitution()
      expect(summary.totalPrinciples).toBe(10)
    })

    it('should return category breakdown', () => {
      const summary = summarizeConstitution()
      expect(summary.categories.length).toBeGreaterThan(0)
      const totalFromCategories = summary.categories.reduce((sum, c) => sum + c.count, 0)
      expect(totalFromCategories).toBe(10)
    })

    it('should return principle list', () => {
      const summary = summarizeConstitution()
      expect(summary.principles).toHaveLength(10)
    })
  })

  describe('getPrincipleById', () => {
    it('should find existing principle', () => {
      const principle = getPrincipleById('user_ownership')
      expect(principle).toBeDefined()
      expect(principle!.title).toBe('用户拥有记忆所有权')
    })

    it('should return undefined for non-existent principle', () => {
      const principle = getPrincipleById('nonexistent')
      expect(principle).toBeUndefined()
    })
  })

  describe('getPrinciplesByCategory', () => {
    it('should filter by category', () => {
      const safety = getPrinciplesByCategory('safety')
      expect(safety.length).toBeGreaterThan(0)
      expect(safety.every(p => p.category === 'safety')).toBe(true)
    })

    it('should return empty for unused category', () => {
      const result = getPrinciplesByCategory('ownership')
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
