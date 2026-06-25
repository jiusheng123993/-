import { describe, it, expect } from 'vitest'
import {
  checkLowEvidenceStable,
  checkSingleOccurrenceGlobal,
  checkTemporaryEmotionPermanent,
  checkConflictConfidenceDecay,
  checkModelReinforcementOverride,
  checkCorrectionIsolation,
  determineMaxLifecycle,
  applyAntiOverfittingPolicy,
  summarizeAntiOverfittingResult,
} from '../policy/antiOverfittingPolicy'
import type { MemoryAtom } from '../types'

function makeAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: 'atom-1',
    content: '用户偏好 TypeScript',
    kind: 'preference',
    scope: 'project',
    scenario: 'coding',
    lifecycle: 'active',
    status: 'active',
    confidence: 0.7,
    sensitivity: 'public',
    source: 'chat',
    evidence: [],
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    quality: 0.6,
    ...overrides,
  }
}

describe('checkLowEvidenceStable', () => {
  it('returns risk when stable with low evidence', () => {
    const atom = makeAtom({ lifecycle: 'stable' })
    const risk = checkLowEvidenceStable(atom, 1)
    expect(risk).not.toBeNull()
    expect(risk!.type).toBe('low_evidence_stable')
    expect(risk!.severity).toBe('high')
  })

  it('returns null when stable with enough evidence', () => {
    const atom = makeAtom({ lifecycle: 'stable' })
    const risk = checkLowEvidenceStable(atom, 3)
    expect(risk).toBeNull()
  })

  it('returns null when not stable', () => {
    const atom = makeAtom({ lifecycle: 'active' })
    const risk = checkLowEvidenceStable(atom, 1)
    expect(risk).toBeNull()
  })
})

describe('checkSingleOccurrenceGlobal', () => {
  it('returns risk when suggesting global with single occurrence', () => {
    const atom = makeAtom({ scope: 'project' })
    const risk = checkSingleOccurrenceGlobal(atom, 1, 'global')
    expect(risk).not.toBeNull()
    expect(risk!.type).toBe('single_occurrence_global')
  })

  it('returns null when already global', () => {
    const atom = makeAtom({ scope: 'global' })
    const risk = checkSingleOccurrenceGlobal(atom, 1, 'global')
    expect(risk).toBeNull()
  })

  it('returns null with enough occurrences', () => {
    const atom = makeAtom({ scope: 'project' })
    const risk = checkSingleOccurrenceGlobal(atom, 2, 'global')
    expect(risk).toBeNull()
  })
})

describe('checkTemporaryEmotionPermanent', () => {
  it('returns risk when temporary emotion is not transient', () => {
    const atom = makeAtom({ lifecycle: 'stable' })
    const risk = checkTemporaryEmotionPermanent(atom, true)
    expect(risk).not.toBeNull()
    expect(risk!.type).toBe('temporary_emotion_permanent')
  })

  it('returns null when temporary emotion is transient', () => {
    const atom = makeAtom({ lifecycle: 'transient' })
    const risk = checkTemporaryEmotionPermanent(atom, true)
    expect(risk).toBeNull()
  })

  it('returns null when not temporary emotion', () => {
    const atom = makeAtom({ lifecycle: 'stable' })
    const risk = checkTemporaryEmotionPermanent(atom, false)
    expect(risk).toBeNull()
  })
})

describe('checkConflictConfidenceDecay', () => {
  it('decays confidence when conflict exists and confidence > 0.5', () => {
    const atom = makeAtom({ confidence: 0.8 })
    const { risk, adjustedConfidence } = checkConflictConfidenceDecay(atom, true)
    expect(risk).not.toBeNull()
    expect(risk!.type).toBe('conflict_confidence_decay')
    expect(adjustedConfidence).toBe(0.5)
  })

  it('does not decay when no conflict', () => {
    const atom = makeAtom({ confidence: 0.8 })
    const { risk, adjustedConfidence } = checkConflictConfidenceDecay(atom, false)
    expect(risk).toBeNull()
    expect(adjustedConfidence).toBe(0.8)
  })

  it('does not decay when confidence is low', () => {
    const atom = makeAtom({ confidence: 0.4 })
    const { risk, adjustedConfidence } = checkConflictConfidenceDecay(atom, true)
    expect(risk).toBeNull()
    expect(adjustedConfidence).toBe(0.4)
  })
})

describe('checkModelReinforcementOverride', () => {
  it('returns risk when model reinforced without user confirmation', () => {
    const risk = checkModelReinforcementOverride(false, true)
    expect(risk).not.toBeNull()
    expect(risk!.type).toBe('model_reinforcement_override')
  })

  it('returns null when user confirmed', () => {
    const risk = checkModelReinforcementOverride(true, true)
    expect(risk).toBeNull()
  })

  it('returns null when not model reinforced', () => {
    const risk = checkModelReinforcementOverride(false, false)
    expect(risk).toBeNull()
  })
})

describe('checkCorrectionIsolation', () => {
  it('returns risk when correction exists and atom not archived', () => {
    const atom = makeAtom({ lifecycle: 'active' })
    const { risk, shouldIsolateOld } = checkCorrectionIsolation(true, atom)
    expect(risk).not.toBeNull()
    expect(risk!.type).toBe('correction_isolation_missing')
    expect(shouldIsolateOld).toBe(true)
  })

  it('returns null when already archived', () => {
    const atom = makeAtom({ lifecycle: 'archived' })
    const { risk, shouldIsolateOld } = checkCorrectionIsolation(true, atom)
    expect(risk).toBeNull()
    expect(shouldIsolateOld).toBe(false)
  })

  it('returns null when no correction', () => {
    const atom = makeAtom({ lifecycle: 'active' })
    const { risk, shouldIsolateOld } = checkCorrectionIsolation(false, atom)
    expect(risk).toBeNull()
    expect(shouldIsolateOld).toBe(false)
  })

  it('returns null when source is manual (correction result atom)', () => {
    const atom = makeAtom({ lifecycle: 'confirmed', source: 'manual' })
    const { risk, shouldIsolateOld } = checkCorrectionIsolation(true, atom)
    expect(risk).toBeNull()
    expect(shouldIsolateOld).toBe(false)
  })
})

describe('determineMaxLifecycle', () => {
  it('returns transient for temporary emotion', () => {
    expect(determineMaxLifecycle(true, 5, true, false)).toBe('transient')
  })

  it('returns active when conflict exists', () => {
    expect(determineMaxLifecycle(false, 5, true, true)).toBe('active')
  })

  it('returns confirmed when user confirmed with enough evidence', () => {
    expect(determineMaxLifecycle(false, 3, true, false)).toBe('confirmed')
  })

  it('returns stable with enough evidence but no confirmation', () => {
    expect(determineMaxLifecycle(false, 3, false, false)).toBe('stable')
  })

  it('returns active with some evidence', () => {
    expect(determineMaxLifecycle(false, 1, false, false)).toBe('active')
  })

  it('returns transient with no evidence', () => {
    expect(determineMaxLifecycle(false, 0, false, false)).toBe('transient')
  })
})

describe('applyAntiOverfittingPolicy', () => {
  it('passes for a healthy atom', () => {
    const atom = makeAtom({ lifecycle: 'active', confidence: 0.7 })
    const result = applyAntiOverfittingPolicy({
      atom,
      evidenceCount: 3,
      occurrenceCount: 2,
      hasConflict: false,
      isUserConfirmed: true,
      isModelReinforced: false,
      isTemporaryEmotion: false,
      hasCorrection: false,
      currentScope: 'project',
      suggestedScope: 'project',
    })
    expect(result.passed).toBe(true)
    expect(result.risks).toHaveLength(0)
  })

  it('detects low evidence stable risk', () => {
    const atom = makeAtom({ lifecycle: 'stable' })
    const result = applyAntiOverfittingPolicy({
      atom,
      evidenceCount: 1,
      occurrenceCount: 2,
      hasConflict: false,
      isUserConfirmed: false,
      isModelReinforced: false,
      isTemporaryEmotion: false,
      hasCorrection: false,
      currentScope: 'project',
      suggestedScope: 'project',
    })
    expect(result.passed).toBe(false)
    expect(result.risks.some((r) => r.type === 'low_evidence_stable')).toBe(true)
  })

  it('detects single occurrence global risk', () => {
    const atom = makeAtom({ scope: 'project' })
    const result = applyAntiOverfittingPolicy({
      atom,
      evidenceCount: 3,
      occurrenceCount: 1,
      hasConflict: false,
      isUserConfirmed: false,
      isModelReinforced: false,
      isTemporaryEmotion: false,
      hasCorrection: false,
      currentScope: 'project',
      suggestedScope: 'global',
    })
    expect(result.passed).toBe(false)
    expect(result.risks.some((r) => r.type === 'single_occurrence_global')).toBe(true)
    expect(result.adjustedScope).toBe('project')
  })

  it('detects temporary emotion permanent risk', () => {
    const atom = makeAtom({ lifecycle: 'stable' })
    const result = applyAntiOverfittingPolicy({
      atom,
      evidenceCount: 3,
      occurrenceCount: 2,
      hasConflict: false,
      isUserConfirmed: false,
      isModelReinforced: false,
      isTemporaryEmotion: true,
      hasCorrection: false,
      currentScope: 'project',
      suggestedScope: 'project',
    })
    expect(result.passed).toBe(false)
    expect(result.risks.some((r) => r.type === 'temporary_emotion_permanent')).toBe(true)
    expect(result.maxLifecycle).toBe('transient')
  })

  it('detects conflict confidence decay', () => {
    const atom = makeAtom({ confidence: 0.8 })
    const result = applyAntiOverfittingPolicy({
      atom,
      evidenceCount: 3,
      occurrenceCount: 2,
      hasConflict: true,
      isUserConfirmed: false,
      isModelReinforced: false,
      isTemporaryEmotion: false,
      hasCorrection: false,
      currentScope: 'project',
      suggestedScope: 'project',
    })
    expect(result.passed).toBe(false)
    expect(result.risks.some((r) => r.type === 'conflict_confidence_decay')).toBe(true)
    expect(result.adjustedConfidence).toBe(0.5)
  })

  it('detects model reinforcement override', () => {
    const atom = makeAtom()
    const result = applyAntiOverfittingPolicy({
      atom,
      evidenceCount: 3,
      occurrenceCount: 2,
      hasConflict: false,
      isUserConfirmed: false,
      isModelReinforced: true,
      isTemporaryEmotion: false,
      hasCorrection: false,
      currentScope: 'project',
      suggestedScope: 'project',
    })
    expect(result.passed).toBe(false)
    expect(result.risks.some((r) => r.type === 'model_reinforcement_override')).toBe(true)
  })

  it('detects correction isolation missing', () => {
    const atom = makeAtom({ lifecycle: 'active' })
    const result = applyAntiOverfittingPolicy({
      atom,
      evidenceCount: 3,
      occurrenceCount: 2,
      hasConflict: false,
      isUserConfirmed: false,
      isModelReinforced: false,
      isTemporaryEmotion: false,
      hasCorrection: true,
      currentScope: 'project',
      suggestedScope: 'project',
    })
    expect(result.passed).toBe(false)
    expect(result.risks.some((r) => r.type === 'correction_isolation_missing')).toBe(true)
    expect(result.shouldIsolateOld).toBe(true)
  })

  it('detects multiple risks simultaneously', () => {
    const atom = makeAtom({ lifecycle: 'stable', confidence: 0.8 })
    const result = applyAntiOverfittingPolicy({
      atom,
      evidenceCount: 1,
      occurrenceCount: 1,
      hasConflict: true,
      isUserConfirmed: false,
      isModelReinforced: true,
      isTemporaryEmotion: false,
      hasCorrection: false,
      currentScope: 'project',
      suggestedScope: 'global',
    })
    expect(result.passed).toBe(false)
    expect(result.risks.length).toBeGreaterThanOrEqual(3)
  })
})

describe('summarizeAntiOverfittingResult', () => {
  it('summarizes passed result', () => {
    const atom = makeAtom()
    const result = applyAntiOverfittingPolicy({
      atom,
      evidenceCount: 3,
      occurrenceCount: 2,
      hasConflict: false,
      isUserConfirmed: true,
      isModelReinforced: false,
      isTemporaryEmotion: false,
      hasCorrection: false,
      currentScope: 'project',
      suggestedScope: 'project',
    })
    const summary = summarizeAntiOverfittingResult(result)
    expect(summary).toContain('通过')
    expect(summary).toContain('风险数: 0')
  })

  it('summarizes failed result with risks', () => {
    const atom = makeAtom({ lifecycle: 'stable' })
    const result = applyAntiOverfittingPolicy({
      atom,
      evidenceCount: 1,
      occurrenceCount: 2,
      hasConflict: false,
      isUserConfirmed: false,
      isModelReinforced: false,
      isTemporaryEmotion: false,
      hasCorrection: false,
      currentScope: 'project',
      suggestedScope: 'project',
    })
    const summary = summarizeAntiOverfittingResult(result)
    expect(summary).toContain('未通过')
    expect(summary).toContain('low_evidence_stable')
  })
})
