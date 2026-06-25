export interface MetaCognitionModel {
  knownFacts: string[]
  uncertainAssumptions: string[]
  confidenceCalibration: number
  missingContext: string[]
  ambiguitySignals: string[]
  shouldAskUser: boolean
  shouldActDirectly: boolean
  updatedAt: string
}

export interface MetaCognitionModelInput {
  knownFacts?: string[]
  uncertainAssumptions?: string[]
  confidenceCalibration?: number
  missingContext?: string[]
  ambiguitySignals?: string[]
  shouldAskUser?: boolean
  shouldActDirectly?: boolean
}

const DEFAULT_META_COGNITION: MetaCognitionModel = {
  knownFacts: [],
  uncertainAssumptions: [],
  confidenceCalibration: 0.5,
  missingContext: [],
  ambiguitySignals: [],
  shouldAskUser: false,
  shouldActDirectly: true,
  updatedAt: ''
}

export function createMetaCognitionModel(
  input?: MetaCognitionModelInput
): MetaCognitionModel {
  return {
    knownFacts: input?.knownFacts ?? [...DEFAULT_META_COGNITION.knownFacts],
    uncertainAssumptions: input?.uncertainAssumptions ?? [...DEFAULT_META_COGNITION.uncertainAssumptions],
    confidenceCalibration: clampConfidence(
      input?.confidenceCalibration ?? DEFAULT_META_COGNITION.confidenceCalibration
    ),
    missingContext: input?.missingContext ?? [...DEFAULT_META_COGNITION.missingContext],
    ambiguitySignals: input?.ambiguitySignals ?? [...DEFAULT_META_COGNITION.ambiguitySignals],
    shouldAskUser: input?.shouldAskUser ?? DEFAULT_META_COGNITION.shouldAskUser,
    shouldActDirectly: input?.shouldActDirectly ?? DEFAULT_META_COGNITION.shouldActDirectly,
    updatedAt: new Date().toISOString()
  }
}

function clampConfidence(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100
}

export function updateMetaCognitionModel(
  model: MetaCognitionModel,
  patch: Partial<MetaCognitionModelInput>
): MetaCognitionModel {
  const updated = {
    ...model,
    ...patch,
    updatedAt: new Date().toISOString()
  }
  if (patch.confidenceCalibration !== undefined) {
    updated.confidenceCalibration = clampConfidence(patch.confidenceCalibration)
  }
  return updated
}

export function addKnownFact(
  model: MetaCognitionModel,
  fact: string
): MetaCognitionModel {
  if (model.knownFacts.includes(fact)) {
    return model
  }
  return {
    ...model,
    knownFacts: [...model.knownFacts, fact],
    updatedAt: new Date().toISOString()
  }
}

export function addUncertainAssumption(
  model: MetaCognitionModel,
  assumption: string
): MetaCognitionModel {
  if (model.uncertainAssumptions.includes(assumption)) {
    return model
  }
  return {
    ...model,
    uncertainAssumptions: [...model.uncertainAssumptions, assumption],
    updatedAt: new Date().toISOString()
  }
}

export function addMissingContext(
  model: MetaCognitionModel,
  context: string
): MetaCognitionModel {
  if (model.missingContext.includes(context)) {
    return model
  }
  return {
    ...model,
    missingContext: [...model.missingContext, context],
    updatedAt: new Date().toISOString()
  }
}

export function addAmbiguitySignal(
  model: MetaCognitionModel,
  signal: string
): MetaCognitionModel {
  if (model.ambiguitySignals.includes(signal)) {
    return model
  }
  return {
    ...model,
    ambiguitySignals: [...model.ambiguitySignals, signal],
    updatedAt: new Date().toISOString()
  }
}

export function evaluateActionMode(
  model: MetaCognitionModel
): { shouldAskUser: boolean; shouldActDirectly: boolean; reason: string } {
  const hasAmbiguity = model.ambiguitySignals.length > 0
  const hasMissingContext = model.missingContext.length > 0
  const hasUncertainAssumptions = model.uncertainAssumptions.length > 0
  const lowConfidence = model.confidenceCalibration < 0.4

  if (hasAmbiguity && lowConfidence) {
    return {
      shouldAskUser: true,
      shouldActDirectly: false,
      reason: '存在歧义信号且置信度低，建议询问用户'
    }
  }

  if (hasMissingContext && hasUncertainAssumptions) {
    return {
      shouldAskUser: true,
      shouldActDirectly: false,
      reason: '缺少上下文且存在不确定假设，建议询问用户'
    }
  }

  if (hasAmbiguity || hasMissingContext) {
    return {
      shouldAskUser: false,
      shouldActDirectly: true,
      reason: '存在部分不确定性但可继续执行，标注风险'
    }
  }

  return {
    shouldAskUser: false,
    shouldActDirectly: true,
    reason: '认知状态清晰，可直接执行'
  }
}

export function summarizeMetaCognitionModel(model: MetaCognitionModel): string {
  const parts: string[] = []
  parts.push(`置信度校准: ${model.confidenceCalibration}`)
  if (model.knownFacts.length > 0) {
    parts.push(`已知事实: ${model.knownFacts.length}项`)
  }
  if (model.uncertainAssumptions.length > 0) {
    parts.push(`不确定假设: ${model.uncertainAssumptions.length}项`)
  }
  if (model.missingContext.length > 0) {
    parts.push(`缺失上下文: ${model.missingContext.length}项`)
  }
  if (model.ambiguitySignals.length > 0) {
    parts.push(`歧义信号: ${model.ambiguitySignals.length}项`)
  }
  parts.push(
    model.shouldAskUser ? '建议询问用户' : '可直接执行'
  )
  return parts.join('; ')
}
