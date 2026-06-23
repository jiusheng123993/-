import type { MemoryAtom, MemoryLifecycle, MemoryScenario } from '../core/memoryBodyTypes'

export type AntiOverfittingAdjustment =
  | 'low_evidence_stable_blocked'
  | 'single_evidence_scenario_boundary'
  | 'temporary_emotion_short_term'
  | 'contradiction_confidence_reduced'
  | 'model_source_lower_priority'
  | 'corrected_memory_isolated'

export interface AntiOverfittingResult {
  allowed: boolean
  adjustments: AntiOverfittingAdjustment[]
  adjustedConfidence?: number
  adjustedStrength?: number
  suggestedLifecycle?: MemoryLifecycle
  suggestedScenarios?: MemoryScenario[]
}

function hasLowEvidence(atom: MemoryAtom): boolean {
  if (atom.evidence.length === 0) return true
  const avgConfidence = atom.evidence.reduce((sum, e) => sum + e.confidence, 0) / atom.evidence.length
  return avgConfidence < 0.5
}

function hasSingleEvidence(atom: MemoryAtom): boolean {
  return atom.evidence.length === 1
}

function isTemporaryEmotion(atom: MemoryAtom): boolean {
  return atom.type === 'emotion' && atom.emotionalWeight >= 0.7
}

function hasContradiction(atom: MemoryAtom): boolean {
  return atom.contradictionOf.length > 0
}

function isModelSource(atom: MemoryAtom): boolean {
  return atom.source === 'model'
}

function isCorrected(atom: MemoryAtom): boolean {
  return hasContradiction(atom) && atom.source === 'manual'
}

export function applyAntiOverfittingPolicy(atom: MemoryAtom): AntiOverfittingResult {
  const adjustments: AntiOverfittingAdjustment[] = []
  let allowed = true
  let adjustedConfidence: number | undefined
  let adjustedStrength: number | undefined
  let suggestedLifecycle: MemoryLifecycle | undefined
  let suggestedScenarios: MemoryScenario[] | undefined

  if (isCorrected(atom)) {
    adjustments.push('corrected_memory_isolated')
    return { allowed: false, adjustments }
  }

  if (atom.lifecycle === 'stable' && (hasLowEvidence(atom) || atom.confidence < 0.5)) {
    adjustments.push('low_evidence_stable_blocked')
    allowed = false
  }

  if (hasSingleEvidence(atom) && atom.scenarios && atom.scenarios.length > 1) {
    adjustments.push('single_evidence_scenario_boundary')
    suggestedScenarios = atom.scenarios.slice(0, 1)
  }

  if (isTemporaryEmotion(atom) && atom.lifecycle !== 'draft') {
    adjustments.push('temporary_emotion_short_term')
    suggestedLifecycle = 'draft'
  }

  if (hasContradiction(atom) && atom.confidence > 0.5) {
    adjustments.push('contradiction_confidence_reduced')
    adjustedConfidence = Math.round((atom.confidence * 0.7) * 100) / 100
  }

  if (isModelSource(atom) && atom.source !== 'manual') {
    adjustments.push('model_source_lower_priority')
    adjustedStrength = Math.round((atom.strength * 0.85) * 100) / 100
  }

  return {
    allowed,
    adjustments,
    adjustedConfidence,
    adjustedStrength,
    suggestedLifecycle,
    suggestedScenarios
  }
}
