import type { MemoryAtom, MemoryScenario, MemoryScope } from '../core/memoryBodyTypes'

export type CognitiveThreat =
  | 'memory_injection'
  | 'false_belief_persistence'
  | 'cross_context_leakage'
  | 'sensitive_inference'
  | 'stale_memory_hijack'
  | 'over_personalization'
  | 'unauthorized_memory_use'
  | 'prompt_leakage'

export interface CognitiveThreatContext {
  currentScope: MemoryScope
  currentScenario?: MemoryScenario
}

const STALE_THRESHOLD_MS = 90 * 24 * 60 * 60 * 1000

function isStale(atom: MemoryAtom): boolean {
  const updatedAt = new Date(atom.updatedAt).getTime()
  const now = Date.now()
  return now - updatedAt > STALE_THRESHOLD_MS
}

function isCrossScope(atom: MemoryAtom, context: CognitiveThreatContext): boolean {
  return atom.scope.userId !== context.currentScope.userId ||
    atom.scope.projectId !== context.currentScope.projectId
}

function hasLowEvidence(atom: MemoryAtom): boolean {
  if (atom.evidence.length === 0) return true
  const avgConfidence = atom.evidence.reduce((sum, e) => sum + e.confidence, 0) / atom.evidence.length
  return avgConfidence < 0.5
}

function hasSingleEvidence(atom: MemoryAtom): boolean {
  return atom.evidence.length === 1
}

export function detectCognitiveThreats(
  atom: MemoryAtom,
  context: CognitiveThreatContext
): CognitiveThreat[] {
  const threats: CognitiveThreat[] = []

  if (atom.lifecycle === 'forbidden' || atom.sensitivity === 'forbidden') {
    threats.push('unauthorized_memory_use')
  }

  if (isCrossScope(atom, context)) {
    threats.push('cross_context_leakage')
  }

  if (atom.lifecycle === 'stable' && (hasLowEvidence(atom) || atom.confidence < 0.5)) {
    threats.push('false_belief_persistence')
  }

  if (isStale(atom) && atom.confidence >= 0.7) {
    threats.push('stale_memory_hijack')
  }

  if (hasSingleEvidence(atom) && atom.confidence >= 0.9 && atom.strength >= 0.8) {
    threats.push('over_personalization')
  }

  if ((atom.sensitivity === 'sensitive' || atom.sensitivity === 'private') &&
      atom.emotionalWeight >= 0.7 &&
      atom.type === 'emotion') {
    threats.push('sensitive_inference')
  }

  if (atom.sensitivity === 'private' &&
      context.currentScenario &&
      context.currentScenario !== 'chat' &&
      context.currentScenario !== 'general') {
    threats.push('prompt_leakage')
  }

  return threats
}
