export interface ChangeEvent {
  timestamp: string
  field: string
  oldValue: string
  newValue: string
  reason: string
}

export interface TemporalUserModel {
  stableTraits: string[]
  recentChanges: ChangeEvent[]
  oldPreferences: string[]
  emergingPatterns: string[]
  decayedPatterns: string[]
  changeEvents: ChangeEvent[]
  updatedAt: string
}

export interface TemporalUserModelInput {
  stableTraits?: string[]
  recentChanges?: ChangeEvent[]
  oldPreferences?: string[]
  emergingPatterns?: string[]
  decayedPatterns?: string[]
  changeEvents?: ChangeEvent[]
}

const DEFAULT_TEMPORAL_MODEL: TemporalUserModel = {
  stableTraits: [],
  recentChanges: [],
  oldPreferences: [],
  emergingPatterns: [],
  decayedPatterns: [],
  changeEvents: [],
  updatedAt: ''
}

export function createTemporalUserModel(
  input?: TemporalUserModelInput
): TemporalUserModel {
  return {
    stableTraits: input?.stableTraits ?? [...DEFAULT_TEMPORAL_MODEL.stableTraits],
    recentChanges: input?.recentChanges ?? [...DEFAULT_TEMPORAL_MODEL.recentChanges],
    oldPreferences: input?.oldPreferences ?? [...DEFAULT_TEMPORAL_MODEL.oldPreferences],
    emergingPatterns: input?.emergingPatterns ?? [...DEFAULT_TEMPORAL_MODEL.emergingPatterns],
    decayedPatterns: input?.decayedPatterns ?? [...DEFAULT_TEMPORAL_MODEL.decayedPatterns],
    changeEvents: input?.changeEvents ?? [...DEFAULT_TEMPORAL_MODEL.changeEvents],
    updatedAt: new Date().toISOString()
  }
}

export function updateTemporalUserModel(
  model: TemporalUserModel,
  patch: Partial<TemporalUserModelInput>
): TemporalUserModel {
  return {
    ...model,
    ...patch,
    updatedAt: new Date().toISOString()
  }
}

export function recordChange(
  model: TemporalUserModel,
  event: ChangeEvent
): TemporalUserModel {
  return {
    ...model,
    changeEvents: [...model.changeEvents, event],
    recentChanges: [...model.recentChanges, event].slice(-20),
    updatedAt: new Date().toISOString()
  }
}

export function addStableTrait(
  model: TemporalUserModel,
  trait: string
): TemporalUserModel {
  if (model.stableTraits.includes(trait)) {
    return model
  }
  return {
    ...model,
    stableTraits: [...model.stableTraits, trait],
    updatedAt: new Date().toISOString()
  }
}

export function addEmergingPattern(
  model: TemporalUserModel,
  pattern: string
): TemporalUserModel {
  if (model.emergingPatterns.includes(pattern)) {
    return model
  }
  return {
    ...model,
    emergingPatterns: [...model.emergingPatterns, pattern],
    updatedAt: new Date().toISOString()
  }
}

export function decayPattern(
  model: TemporalUserModel,
  pattern: string
): TemporalUserModel {
  return {
    ...model,
    emergingPatterns: model.emergingPatterns.filter((p) => p !== pattern),
    decayedPatterns: [...model.decayedPatterns, pattern],
    updatedAt: new Date().toISOString()
  }
}

export function archiveOldPreference(
  model: TemporalUserModel,
  preference: string
): TemporalUserModel {
  if (model.oldPreferences.includes(preference)) {
    return model
  }
  return {
    ...model,
    oldPreferences: [...model.oldPreferences, preference],
    updatedAt: new Date().toISOString()
  }
}

export function summarizeTemporalUserModel(model: TemporalUserModel): string {
  const parts: string[] = []
  if (model.stableTraits.length > 0) {
    parts.push(`稳定特质: ${model.stableTraits.join(', ')}`)
  }
  if (model.emergingPatterns.length > 0) {
    parts.push(`新兴模式: ${model.emergingPatterns.join(', ')}`)
  }
  if (model.decayedPatterns.length > 0) {
    parts.push(`已衰减模式: ${model.decayedPatterns.join(', ')}`)
  }
  if (model.recentChanges.length > 0) {
    parts.push(`最近变化: ${model.recentChanges.length}项`)
  }
  return parts.join('; ')
}
