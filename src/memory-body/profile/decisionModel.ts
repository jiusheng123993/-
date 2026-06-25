import type { MemoryAtom } from '../core/memoryBodyTypes'

export interface DecisionModel {
  qualityBar: string
  tradeoffPreference: string
  riskTolerance: string
  confirmationStyle: string
  implementationBias: string
  rejectionPatterns: string[]
  decisionEvidenceAtomIds: string[]
  updatedAt: string
}

export interface DecisionModelInput {
  qualityBar?: string
  tradeoffPreference?: string
  riskTolerance?: string
  confirmationStyle?: string
  implementationBias?: string
  rejectionPatterns?: string[]
  decisionEvidenceAtomIds?: string[]
}

const DEFAULT_DECISION_MODEL: DecisionModel = {
  qualityBar: '',
  tradeoffPreference: '',
  riskTolerance: '',
  confirmationStyle: '',
  implementationBias: '',
  rejectionPatterns: [],
  decisionEvidenceAtomIds: [],
  updatedAt: ''
}

export function createDecisionModel(input?: DecisionModelInput): DecisionModel {
  return {
    qualityBar: input?.qualityBar ?? DEFAULT_DECISION_MODEL.qualityBar,
    tradeoffPreference: input?.tradeoffPreference ?? DEFAULT_DECISION_MODEL.tradeoffPreference,
    riskTolerance: input?.riskTolerance ?? DEFAULT_DECISION_MODEL.riskTolerance,
    confirmationStyle: input?.confirmationStyle ?? DEFAULT_DECISION_MODEL.confirmationStyle,
    implementationBias: input?.implementationBias ?? DEFAULT_DECISION_MODEL.implementationBias,
    rejectionPatterns: input?.rejectionPatterns ?? [...DEFAULT_DECISION_MODEL.rejectionPatterns],
    decisionEvidenceAtomIds: input?.decisionEvidenceAtomIds ?? [...DEFAULT_DECISION_MODEL.decisionEvidenceAtomIds],
    updatedAt: new Date().toISOString()
  }
}

export function updateDecisionModel(
  model: DecisionModel,
  patch: Partial<DecisionModelInput>
): DecisionModel {
  return {
    ...model,
    ...patch,
    updatedAt: new Date().toISOString()
  }
}

export function addDecisionEvidence(
  model: DecisionModel,
  atom: MemoryAtom
): DecisionModel {
  if (model.decisionEvidenceAtomIds.includes(atom.id)) {
    return model
  }
  return {
    ...model,
    decisionEvidenceAtomIds: [...model.decisionEvidenceAtomIds, atom.id],
    updatedAt: new Date().toISOString()
  }
}

export function addRejectionPattern(
  model: DecisionModel,
  pattern: string
): DecisionModel {
  if (model.rejectionPatterns.includes(pattern)) {
    return model
  }
  return {
    ...model,
    rejectionPatterns: [...model.rejectionPatterns, pattern],
    updatedAt: new Date().toISOString()
  }
}

export function summarizeDecisionModel(model: DecisionModel): string {
  const parts: string[] = []
  if (model.qualityBar) parts.push(`质量标准: ${model.qualityBar}`)
  if (model.tradeoffPreference) parts.push(`权衡偏好: ${model.tradeoffPreference}`)
  if (model.riskTolerance) parts.push(`风险容忍: ${model.riskTolerance}`)
  if (model.confirmationStyle) parts.push(`确认风格: ${model.confirmationStyle}`)
  if (model.implementationBias) parts.push(`实现倾向: ${model.implementationBias}`)
  if (model.rejectionPatterns.length > 0) {
    parts.push(`拒绝模式: ${model.rejectionPatterns.join(', ')}`)
  }
  return parts.join('; ')
}
