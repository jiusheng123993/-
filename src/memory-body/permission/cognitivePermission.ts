import type { MemoryScenario } from '../core/memoryBodyTypes'

export interface CognitivePermissionInput {
  usableInChat?: boolean
  usableInPlanning?: boolean
  usableInCoding?: boolean
  usableInRecommendation?: boolean
  usableInEmotionalSupport?: boolean
  excludedScenarios?: string[]
  requiresConfirmation?: boolean
}

export interface CognitivePermission {
  usableInChat: boolean
  usableInPlanning: boolean
  usableInCoding: boolean
  usableInRecommendation: boolean
  usableInEmotionalSupport: boolean
  excludedScenarios: string[]
  requiresConfirmation: boolean
}

export interface CognitivePermissionCheckResult {
  allowed: boolean
  requiresConfirmation: boolean
  reason?: 'memory_not_permitted_for_scenario' | 'scenario_excluded'
}

export const DEFAULT_COGNITIVE_PERMISSION: CognitivePermission = {
  usableInChat: true,
  usableInPlanning: false,
  usableInCoding: false,
  usableInRecommendation: false,
  usableInEmotionalSupport: false,
  excludedScenarios: [],
  requiresConfirmation: false
}

const scenarioPermissionMap: Record<MemoryScenario, keyof CognitivePermission> = {
  general: 'usableInChat',
  chat: 'usableInChat',
  study: 'usableInPlanning',
  focus: 'usableInCoding',
  goal_planning: 'usableInPlanning',
  emotional_support: 'usableInEmotionalSupport',
  food_recommendation: 'usableInRecommendation',
  reflection: 'usableInChat',
  knowledge_graph: 'usableInPlanning'
}

export function createCognitivePermission(input: CognitivePermissionInput = {}): CognitivePermission {
  return {
    usableInChat: input.usableInChat ?? DEFAULT_COGNITIVE_PERMISSION.usableInChat,
    usableInPlanning: input.usableInPlanning ?? DEFAULT_COGNITIVE_PERMISSION.usableInPlanning,
    usableInCoding: input.usableInCoding ?? DEFAULT_COGNITIVE_PERMISSION.usableInCoding,
    usableInRecommendation: input.usableInRecommendation ?? DEFAULT_COGNITIVE_PERMISSION.usableInRecommendation,
    usableInEmotionalSupport: input.usableInEmotionalSupport ?? DEFAULT_COGNITIVE_PERMISSION.usableInEmotionalSupport,
    excludedScenarios: input.excludedScenarios ?? [],
    requiresConfirmation: input.requiresConfirmation ?? DEFAULT_COGNITIVE_PERMISSION.requiresConfirmation
  }
}

export function checkCognitivePermission(
  permission: CognitivePermission,
  scenario: MemoryScenario
): CognitivePermissionCheckResult {
  if (permission.excludedScenarios.includes(scenario)) {
    return { allowed: false, requiresConfirmation: false, reason: 'scenario_excluded' }
  }

  const permissionKey = scenarioPermissionMap[scenario]
  if (!permissionKey || !permission[permissionKey]) {
    return { allowed: false, requiresConfirmation: false, reason: 'memory_not_permitted_for_scenario' }
  }

  return {
    allowed: true,
    requiresConfirmation: permission.requiresConfirmation,
    reason: undefined
  }
}
