import type { MemoryAtom, MemoryScope } from '../types'

export type OverfittingRiskType =
  | 'low_evidence_stable'
  | 'single_occurrence_global'
  | 'temporary_emotion_permanent'
  | 'conflict_confidence_decay'
  | 'model_reinforcement_override'
  | 'correction_isolation_missing'

export interface OverfittingRisk {
  type: OverfittingRiskType
  atomId: string
  description: string
  severity: 'low' | 'medium' | 'high'
  recommendation: string
}

export interface AntiOverfittingPolicyInput {
  atom: MemoryAtom
  evidenceCount: number
  occurrenceCount: number
  hasConflict: boolean
  isUserConfirmed: boolean
  isModelReinforced: boolean
  isTemporaryEmotion: boolean
  hasCorrection: boolean
  currentScope: MemoryScope
  suggestedScope: MemoryScope
}

export interface AntiOverfittingPolicyResult {
  passed: boolean
  risks: OverfittingRisk[]
  adjustedScope: MemoryScope
  adjustedConfidence: number
  shouldIsolateOld: boolean
  maxLifecycle: 'transient' | 'active' | 'stable' | 'confirmed'
}

const MIN_EVIDENCE_FOR_STABLE = 3
const MIN_OCCURRENCE_FOR_GLOBAL = 2
const CONFLICT_CONFIDENCE_DECAY = 0.3
const TEMPORARY_EMOTION_MAX_LIFECYCLE: MemoryAtom['lifecycle'] = 'transient'

export function checkLowEvidenceStable(atom: MemoryAtom, evidenceCount: number): OverfittingRisk | null {
  if (atom.lifecycle === 'stable' && evidenceCount < MIN_EVIDENCE_FOR_STABLE) {
    return {
      type: 'low_evidence_stable',
      atomId: atom.id,
      description: `记忆 "${atom.content}" 仅有 ${evidenceCount} 条证据但已标记为 stable`,
      severity: 'high',
      recommendation: `降级为 active，等待至少 ${MIN_EVIDENCE_FOR_STABLE} 条证据后再升级`,
    }
  }
  return null
}

export function checkSingleOccurrenceGlobal(
  atom: MemoryAtom,
  occurrenceCount: number,
  suggestedScope: MemoryScope
): OverfittingRisk | null {
  if (
    suggestedScope === 'global' &&
    occurrenceCount < MIN_OCCURRENCE_FOR_GLOBAL &&
    atom.scope !== 'global'
  ) {
    return {
      type: 'single_occurrence_global',
      atomId: atom.id,
      description: `记忆 "${atom.content}" 仅出现 ${occurrenceCount} 次，不应升级为 global`,
      severity: 'medium',
      recommendation: '保持当前 scope，或降级为 project 级别',
    }
  }
  return null
}

export function checkTemporaryEmotionPermanent(
  atom: MemoryAtom,
  isTemporaryEmotion: boolean
): OverfittingRisk | null {
  if (isTemporaryEmotion && atom.lifecycle !== 'transient') {
    return {
      type: 'temporary_emotion_permanent',
      atomId: atom.id,
      description: `记忆 "${atom.content}" 被标记为临时情绪但生命周期为 ${atom.lifecycle}`,
      severity: 'high',
      recommendation: '降级为 transient，设置短期过期时间',
    }
  }
  return null
}

export function checkConflictConfidenceDecay(
  atom: MemoryAtom,
  hasConflict: boolean
): { risk: OverfittingRisk | null; adjustedConfidence: number } {
  if (hasConflict && atom.confidence > 0.5) {
    const adjustedConfidence = Math.max(0, atom.confidence - CONFLICT_CONFIDENCE_DECAY)
    return {
      risk: {
        type: 'conflict_confidence_decay',
        atomId: atom.id,
        description: `记忆 "${atom.content}" 存在冲突，置信度从 ${atom.confidence} 降至 ${adjustedConfidence}`,
        severity: 'medium',
        recommendation: '降低置信度，等待用户确认或更多证据',
      },
      adjustedConfidence,
    }
  }
  return { risk: null, adjustedConfidence: atom.confidence }
}

export function checkModelReinforcementOverride(
  isUserConfirmed: boolean,
  isModelReinforced: boolean
): OverfittingRisk | null {
  if (isModelReinforced && !isUserConfirmed) {
    return {
      type: 'model_reinforcement_override',
      atomId: '',
      description: '模型强化优先于用户确认，可能导致错误信念固化',
      severity: 'medium',
      recommendation: '模型强化不应替代用户确认，需等待用户明确确认后再升级',
    }
  }
  return null
}

export function checkCorrectionIsolation(
  hasCorrection: boolean,
  atom: MemoryAtom
): { risk: OverfittingRisk | null; shouldIsolateOld: boolean } {
  if (hasCorrection && atom.lifecycle !== 'archived' && atom.source !== 'manual') {
    return {
      risk: {
        type: 'correction_isolation_missing',
        atomId: atom.id,
        description: `记忆 "${atom.content}" 已被用户纠正但旧版本未隔离`,
        severity: 'high',
        recommendation: '将旧版本归档，创建新版本并标记为 corrected',
      },
      shouldIsolateOld: true,
    }
  }
  return { risk: null, shouldIsolateOld: false }
}

export function determineMaxLifecycle(
  isTemporaryEmotion: boolean,
  evidenceCount: number,
  isUserConfirmed: boolean,
  hasConflict: boolean
): MemoryAtom['lifecycle'] {
  if (isTemporaryEmotion) return TEMPORARY_EMOTION_MAX_LIFECYCLE
  if (hasConflict) return 'active'
  if (isUserConfirmed && evidenceCount >= MIN_EVIDENCE_FOR_STABLE) return 'confirmed'
  if (evidenceCount >= MIN_EVIDENCE_FOR_STABLE) return 'stable'
  if (evidenceCount >= 1) return 'active'
  return 'transient'
}

export function applyAntiOverfittingPolicy(input: AntiOverfittingPolicyInput): AntiOverfittingPolicyResult {
  const risks: OverfittingRisk[] = []

  const lowEvidenceRisk = checkLowEvidenceStable(input.atom, input.evidenceCount)
  if (lowEvidenceRisk) risks.push(lowEvidenceRisk)

  const singleOccurrenceRisk = checkSingleOccurrenceGlobal(
    input.atom,
    input.occurrenceCount,
    input.suggestedScope
  )
  if (singleOccurrenceRisk) risks.push(singleOccurrenceRisk)

  const tempEmotionRisk = checkTemporaryEmotionPermanent(input.atom, input.isTemporaryEmotion)
  if (tempEmotionRisk) risks.push(tempEmotionRisk)

  const { risk: conflictRisk, adjustedConfidence } = checkConflictConfidenceDecay(
    input.atom,
    input.hasConflict
  )
  if (conflictRisk) risks.push(conflictRisk)

  const modelReinforcementRisk = checkModelReinforcementOverride(
    input.isUserConfirmed,
    input.isModelReinforced
  )
  if (modelReinforcementRisk) risks.push(modelReinforcementRisk)

  const { risk: correctionRisk, shouldIsolateOld } = checkCorrectionIsolation(
    input.hasCorrection,
    input.atom
  )
  if (correctionRisk) risks.push(correctionRisk)

  let adjustedScope = input.suggestedScope
  if (input.occurrenceCount < MIN_OCCURRENCE_FOR_GLOBAL && input.suggestedScope === 'global') {
    adjustedScope = input.currentScope
  }

  const maxLifecycle = determineMaxLifecycle(
    input.isTemporaryEmotion,
    input.evidenceCount,
    input.isUserConfirmed,
    input.hasConflict
  )

  return {
    passed: risks.length === 0,
    risks,
    adjustedScope,
    adjustedConfidence,
    shouldIsolateOld,
    maxLifecycle,
  }
}

export function summarizeAntiOverfittingResult(result: AntiOverfittingPolicyResult): string {
  const lines: string[] = []
  lines.push(`防过拟合检查: ${result.passed ? '通过' : '未通过'}`)
  lines.push(`风险数: ${result.risks.length}`)
  if (result.risks.length > 0) {
    lines.push('风险列表:')
    for (const risk of result.risks) {
      lines.push(`  - [${risk.severity}] ${risk.type}: ${risk.description}`)
    }
  }
  lines.push(`调整后 scope: ${result.adjustedScope}`)
  lines.push(`调整后置信度: ${result.adjustedConfidence}`)
  lines.push(`最大生命周期: ${result.maxLifecycle}`)
  lines.push(`是否隔离旧版本: ${result.shouldIsolateOld}`)
  return lines.join('\n')
}
