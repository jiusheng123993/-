import type { MemoryAtom, MemoryBodyState } from '../core/memoryBodyTypes'
import type { DecisionModel } from './decisionModel'
import type { TasteModel } from './tasteModel'
import type { TrustModel } from './trustModel'
import type { MisunderstandingMemory } from './misunderstandingMemory'
import type { TemporalUserModel } from './temporalUserModel'
import type { MetaCognitionModel } from './metaCognitionModel'
import { createDecisionModel } from './decisionModel'
import { createTasteModel } from './tasteModel'
import { createTrustModel } from './trustModel'
import { createTemporalUserModel } from './temporalUserModel'
import { createMetaCognitionModel } from './metaCognitionModel'

export interface CognitiveProfile {
  id: string
  scope: { userId: string; projectId: string }
  identityModel: string
  preferenceModel: string[]
  decisionModel: DecisionModel
  tasteModel: TasteModel
  goalModel: string[]
  trustModel: TrustModel
  relationshipModel: string
  emotionModel: string
  temporalUserModel: TemporalUserModel
  scenarioModel: string[]
  safetyBoundary: string[]
  reflectionSummary: string
  evolutionHistory: string[]
  misunderstandingMemories: MisunderstandingMemory[]
  metaCognitionModel: MetaCognitionModel
  evidenceAtomIds: string[]
  createdAt: string
  updatedAt: string
}

export interface CognitiveProfileInput {
  scope: { userId: string; projectId: string }
  identityModel?: string
  preferenceModel?: string[]
  decisionModel?: DecisionModel
  tasteModel?: TasteModel
  goalModel?: string[]
  trustModel?: TrustModel
  relationshipModel?: string
  emotionModel?: string
  temporalUserModel?: TemporalUserModel
  scenarioModel?: string[]
  safetyBoundary?: string[]
  reflectionSummary?: string
  evolutionHistory?: string[]
  misunderstandingMemories?: MisunderstandingMemory[]
  metaCognitionModel?: MetaCognitionModel
  evidenceAtomIds?: string[]
}

let profileIdCounter = 0

function generateProfileId(): string {
  profileIdCounter++
  return `cognitive-profile-${Date.now()}-${profileIdCounter}`
}

export function createCognitiveProfile(
  input: CognitiveProfileInput
): CognitiveProfile {
  const now = new Date().toISOString()
  return {
    id: generateProfileId(),
    scope: input.scope,
    identityModel: input.identityModel ?? '',
    preferenceModel: input.preferenceModel ?? [],
    decisionModel: input.decisionModel ?? createDecisionModel(),
    tasteModel: input.tasteModel ?? createTasteModel(),
    goalModel: input.goalModel ?? [],
    trustModel: input.trustModel ?? createTrustModel(),
    relationshipModel: input.relationshipModel ?? '',
    emotionModel: input.emotionModel ?? '',
    temporalUserModel: input.temporalUserModel ?? createTemporalUserModel(),
    scenarioModel: input.scenarioModel ?? [],
    safetyBoundary: input.safetyBoundary ?? [],
    reflectionSummary: input.reflectionSummary ?? '',
    evolutionHistory: input.evolutionHistory ?? [],
    misunderstandingMemories: input.misunderstandingMemories ?? [],
    metaCognitionModel: input.metaCognitionModel ?? createMetaCognitionModel(),
    evidenceAtomIds: input.evidenceAtomIds ?? [],
    createdAt: now,
    updatedAt: now
  }
}

export function updateCognitiveProfile(
  profile: CognitiveProfile,
  patch: Partial<CognitiveProfileInput>
): CognitiveProfile {
  return {
    ...profile,
    ...patch,
    updatedAt: new Date().toISOString()
  }
}

export function addPreference(
  profile: CognitiveProfile,
  preference: string
): CognitiveProfile {
  if (profile.preferenceModel.includes(preference)) {
    return profile
  }
  return {
    ...profile,
    preferenceModel: [...profile.preferenceModel, preference],
    updatedAt: new Date().toISOString()
  }
}

export function addGoal(
  profile: CognitiveProfile,
  goal: string
): CognitiveProfile {
  if (profile.goalModel.includes(goal)) {
    return profile
  }
  return {
    ...profile,
    goalModel: [...profile.goalModel, goal],
    updatedAt: new Date().toISOString()
  }
}

export function addSafetyBoundary(
  profile: CognitiveProfile,
  boundary: string
): CognitiveProfile {
  if (profile.safetyBoundary.includes(boundary)) {
    return profile
  }
  return {
    ...profile,
    safetyBoundary: [...profile.safetyBoundary, boundary],
    updatedAt: new Date().toISOString()
  }
}

export function addScenario(
  profile: CognitiveProfile,
  scenario: string
): CognitiveProfile {
  if (profile.scenarioModel.includes(scenario)) {
    return profile
  }
  return {
    ...profile,
    scenarioModel: [...profile.scenarioModel, scenario],
    updatedAt: new Date().toISOString()
  }
}

export function addMisunderstandingMemory(
  profile: CognitiveProfile,
  memory: MisunderstandingMemory
): CognitiveProfile {
  return {
    ...profile,
    misunderstandingMemories: [...profile.misunderstandingMemories, memory],
    updatedAt: new Date().toISOString()
  }
}

export function addEvidenceAtom(
  profile: CognitiveProfile,
  atom: MemoryAtom
): CognitiveProfile {
  if (profile.evidenceAtomIds.includes(atom.id)) {
    return profile
  }
  return {
    ...profile,
    evidenceAtomIds: [...profile.evidenceAtomIds, atom.id],
    updatedAt: new Date().toISOString()
  }
}

export function recordEvolution(
  profile: CognitiveProfile,
  entry: string
): CognitiveProfile {
  return {
    ...profile,
    evolutionHistory: [...profile.evolutionHistory, entry],
    updatedAt: new Date().toISOString()
  }
}

export function setReflectionSummary(
  profile: CognitiveProfile,
  summary: string
): CognitiveProfile {
  return {
    ...profile,
    reflectionSummary: summary,
    updatedAt: new Date().toISOString()
  }
}

export function buildCognitiveProfileFromState(
  state: MemoryBodyState,
  existingProfile?: CognitiveProfile
): CognitiveProfile {
  const base = existingProfile ?? createCognitiveProfile({
    scope: state.scope
  })

  const preferenceAtoms = state.atoms.filter((a) => a.type === 'preference')
  const goalAtoms = state.atoms.filter((a) => a.type === 'goal')
  const boundaryAtoms = state.atoms.filter((a) => a.type === 'boundary')
  const identityAtoms = state.atoms.filter((a) => a.type === 'identity')

  const preferences = preferenceAtoms.map((a) => a.content)
  const goals = goalAtoms.map((a) => a.content)
  const boundaries = boundaryAtoms.map((a) => a.content)
  const identity = identityAtoms.map((a) => a.content).join('; ')

  const allAtomIds = state.atoms.map((a) => a.id)

  return {
    ...base,
    identityModel: identity || base.identityModel,
    preferenceModel: [...new Set([...base.preferenceModel, ...preferences])],
    goalModel: [...new Set([...base.goalModel, ...goals])],
    safetyBoundary: [...new Set([...base.safetyBoundary, ...boundaries])],
    evidenceAtomIds: [...new Set([...base.evidenceAtomIds, ...allAtomIds])],
    updatedAt: new Date().toISOString()
  }
}

export function summarizeCognitiveProfile(
  profile: CognitiveProfile
): string {
  const parts: string[] = []

  if (profile.identityModel) {
    parts.push(`身份: ${profile.identityModel}`)
  }

  if (profile.preferenceModel.length > 0) {
    parts.push(`偏好: ${profile.preferenceModel.join(', ')}`)
  }

  if (profile.goalModel.length > 0) {
    parts.push(`目标: ${profile.goalModel.join(', ')}`)
  }

  if (profile.safetyBoundary.length > 0) {
    parts.push(`安全边界: ${profile.safetyBoundary.join(', ')}`)
  }

  if (profile.relationshipModel) {
    parts.push(`关系: ${profile.relationshipModel}`)
  }

  if (profile.emotionModel) {
    parts.push(`情绪: ${profile.emotionModel}`)
  }

  if (profile.reflectionSummary) {
    parts.push(`反思: ${profile.reflectionSummary}`)
  }

  if (profile.misunderstandingMemories.length > 0) {
    parts.push(`误解记忆: ${profile.misunderstandingMemories.length}条`)
  }

  parts.push(`证据原子: ${profile.evidenceAtomIds.length}个`)

  return parts.join(' | ')
}
