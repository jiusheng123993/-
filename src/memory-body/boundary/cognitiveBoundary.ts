import type { MemoryAtom, MemoryScenario, MemoryScope } from '../core/memoryBodyTypes'

export type CognitiveBoundaryWarning =
  | 'cross_user_boundary'
  | 'cross_project_boundary'
  | 'single_event_emotion_not_personality'
  | 'project_preference_in_global_context'
  | 'low_evidence_high_confidence'
  | 'draft_memory_in_decision_context'

export interface CognitiveBoundaryContext {
  currentScenario: MemoryScenario
  currentScope: MemoryScope
}

export interface CognitiveBoundaryCheckResult {
  allowed: boolean
  reason?: 'cross_user_boundary' | 'cross_project_boundary'
  warnings: CognitiveBoundaryWarning[]
}

const decisionScenarios: MemoryScenario[] = ['goal_planning', 'focus', 'study']

export function checkCognitiveBoundary(
  atom: MemoryAtom,
  context: CognitiveBoundaryContext
): CognitiveBoundaryCheckResult {
  const warnings: CognitiveBoundaryWarning[] = []

  if (atom.scope.userId !== context.currentScope.userId) {
    return { allowed: false, reason: 'cross_user_boundary', warnings: ['cross_user_boundary'] }
  }

  if (atom.scope.projectId !== context.currentScope.projectId) {
    return { allowed: false, reason: 'cross_project_boundary', warnings: ['cross_project_boundary'] }
  }

  if (
    atom.type === 'emotion' &&
    atom.evidence.length <= 1 &&
    !atom.tags.includes('repeated') &&
    atom.emotionalWeight >= 0.7
  ) {
    warnings.push('single_event_emotion_not_personality')
  }

  if (
    atom.tags.includes('project_scoped') &&
    context.currentScenario === 'chat' &&
    atom.scenarios?.some(s => decisionScenarios.includes(s))
  ) {
    warnings.push('project_preference_in_global_context')
  }

  if (atom.confidence >= 0.8 && atom.evidence.length === 0) {
    warnings.push('low_evidence_high_confidence')
  }

  if (
    atom.lifecycle === 'draft' &&
    decisionScenarios.includes(context.currentScenario)
  ) {
    warnings.push('draft_memory_in_decision_context')
  }

  return { allowed: true, warnings }
}
