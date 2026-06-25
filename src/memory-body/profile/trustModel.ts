export interface TrustModel {
  trustLevel: number
  trustBreakEvents: string[]
  trustRepairActions: string[]
  sensitiveFailureModes: string[]
  userPatienceSignals: string[]
  requiredProofStyle: string
  updatedAt: string
}

export interface TrustModelInput {
  trustLevel?: number
  trustBreakEvents?: string[]
  trustRepairActions?: string[]
  sensitiveFailureModes?: string[]
  userPatienceSignals?: string[]
  requiredProofStyle?: string
}

const DEFAULT_TRUST_MODEL: TrustModel = {
  trustLevel: 0.5,
  trustBreakEvents: [],
  trustRepairActions: [],
  sensitiveFailureModes: [],
  userPatienceSignals: [],
  requiredProofStyle: '',
  updatedAt: ''
}

export function createTrustModel(input?: TrustModelInput): TrustModel {
  return {
    trustLevel: clampTrustLevel(input?.trustLevel ?? DEFAULT_TRUST_MODEL.trustLevel),
    trustBreakEvents: input?.trustBreakEvents ?? [...DEFAULT_TRUST_MODEL.trustBreakEvents],
    trustRepairActions: input?.trustRepairActions ?? [...DEFAULT_TRUST_MODEL.trustRepairActions],
    sensitiveFailureModes: input?.sensitiveFailureModes ?? [...DEFAULT_TRUST_MODEL.sensitiveFailureModes],
    userPatienceSignals: input?.userPatienceSignals ?? [...DEFAULT_TRUST_MODEL.userPatienceSignals],
    requiredProofStyle: input?.requiredProofStyle ?? DEFAULT_TRUST_MODEL.requiredProofStyle,
    updatedAt: new Date().toISOString()
  }
}

function clampTrustLevel(level: number): number {
  return Math.round(Math.max(0, Math.min(1, level)) * 100) / 100
}

export function updateTrustModel(
  model: TrustModel,
  patch: Partial<TrustModelInput>
): TrustModel {
  const updated = {
    ...model,
    ...patch,
    updatedAt: new Date().toISOString()
  }
  if (patch.trustLevel !== undefined) {
    updated.trustLevel = clampTrustLevel(patch.trustLevel)
  }
  return updated
}

export function recordTrustBreak(
  model: TrustModel,
  event: string
): TrustModel {
  return {
    ...model,
    trustLevel: clampTrustLevel(model.trustLevel - 0.15),
    trustBreakEvents: [...model.trustBreakEvents, event],
    updatedAt: new Date().toISOString()
  }
}

export function recordTrustRepair(
  model: TrustModel,
  action: string
): TrustModel {
  return {
    ...model,
    trustLevel: clampTrustLevel(model.trustLevel + 0.1),
    trustRepairActions: [...model.trustRepairActions, action],
    updatedAt: new Date().toISOString()
  }
}

export function addSensitiveFailureMode(
  model: TrustModel,
  mode: string
): TrustModel {
  if (model.sensitiveFailureModes.includes(mode)) {
    return model
  }
  return {
    ...model,
    sensitiveFailureModes: [...model.sensitiveFailureModes, mode],
    updatedAt: new Date().toISOString()
  }
}

export function addPatienceSignal(
  model: TrustModel,
  signal: string
): TrustModel {
  if (model.userPatienceSignals.includes(signal)) {
    return model
  }
  return {
    ...model,
    userPatienceSignals: [...model.userPatienceSignals, signal],
    updatedAt: new Date().toISOString()
  }
}

export function summarizeTrustModel(model: TrustModel): string {
  const parts: string[] = []
  parts.push(`信任等级: ${model.trustLevel}`)
  if (model.requiredProofStyle) parts.push(`证明风格: ${model.requiredProofStyle}`)
  if (model.trustBreakEvents.length > 0) {
    parts.push(`信任破裂事件: ${model.trustBreakEvents.length}次`)
  }
  if (model.trustRepairActions.length > 0) {
    parts.push(`信任修复行动: ${model.trustRepairActions.length}次`)
  }
  if (model.sensitiveFailureModes.length > 0) {
    parts.push(`敏感失败模式: ${model.sensitiveFailureModes.join(', ')}`)
  }
  return parts.join('; ')
}
