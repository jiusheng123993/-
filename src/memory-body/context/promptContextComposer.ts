import { buildMemoryBodyPromptContext } from './memoryBodyContextBuilder'
import { isActiveMemoryAtom, isForbiddenMemoryAtom } from '../core/memoryBodyGuards'
import type { MemoryAtom, MemoryScenario, MemoryScope } from '../core/memoryBodyTypes'
import { scoreMemoryQuality } from '../quality/memoryQuality'
import { checkCognitivePermission, createCognitivePermission, DEFAULT_COGNITIVE_PERMISSION, type CognitivePermission } from '../permission/cognitivePermission'
import { checkCognitiveBoundary, type CognitiveBoundaryWarning } from '../boundary/cognitiveBoundary'

export interface PromptContextComposerInput {
  atoms: MemoryAtom[]
  maxItems?: number
  scenarios?: MemoryScenario[]
  scope?: MemoryScope
}

export interface PromptContextComposerResult {
  context: string
  usedAtomIds: string[]
  explanations: string[]
  boundaryWarnings: CognitiveBoundaryWarning[]
}

function inferPermissionFromScenarios(scenarios: MemoryScenario[]): CognitivePermission {
  if (scenarios.length === 0) return DEFAULT_COGNITIVE_PERMISSION

  return createCognitivePermission({
    usableInChat: scenarios.some(s => s === 'chat' || s === 'general' || s === 'reflection'),
    usableInPlanning: scenarios.some(s => s === 'goal_planning' || s === 'study' || s === 'knowledge_graph'),
    usableInCoding: scenarios.some(s => s === 'focus'),
    usableInRecommendation: scenarios.some(s => s === 'food_recommendation'),
    usableInEmotionalSupport: scenarios.some(s => s === 'emotional_support')
  })
}

function isScenarioAllowed(atomScenarios: MemoryScenario[], currentScenarios: MemoryScenario[]): boolean {
  if (currentScenarios.length === 0) return true
  const permission = inferPermissionFromScenarios(atomScenarios)
  return currentScenarios.some(scenario => checkCognitivePermission(permission, scenario).allowed)
}

export function composePromptContext(input: PromptContextComposerInput): PromptContextComposerResult {
  const currentScenarios = input.scenarios ?? ['chat']
  const scope = input.scope
  const boundaryWarnings: CognitiveBoundaryWarning[] = []

  const ranked = input.atoms
    .filter(atom => isActiveMemoryAtom(atom) && !isForbiddenMemoryAtom(atom))
    .filter(atom => {
      const atomScenarios = atom.scenarios ?? []
      return isScenarioAllowed(atomScenarios, currentScenarios)
    })
    .filter(atom => {
      if (!scope) return true
      const boundaryCheck = checkCognitiveBoundary(atom, { currentScenario: currentScenarios[0] ?? 'chat', currentScope: scope })
      boundaryWarnings.push(...boundaryCheck.warnings)
      return boundaryCheck.allowed
    })
    .map(atom => ({ atom, quality: scoreMemoryQuality(atom) }))
    .sort((left, right) => right.quality.overallScore - left.quality.overallScore)
    .slice(0, input.maxItems ?? 8)

  const atoms = ranked.map(item => item.atom)

  return {
    context: buildMemoryBodyPromptContext({ atoms }),
    usedAtomIds: atoms.map(atom => atom.id),
    explanations: ranked.map(item => `使用 ${item.atom.id}：${item.atom.lifecycle} / ${item.atom.sensitivity} / overall ${item.quality.overallScore.toFixed(2)}`),
    boundaryWarnings
  }
}
