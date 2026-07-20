import { ACTIVE_MEMORY_LIFECYCLES, MEMORY_BODY_VERSION } from './memoryBodyConfig'
import type { MemoryAtom, MemoryBodyState, MemoryScope } from './memoryBodyTypes'

export function createMemoryBodyState(userId: string, projectId: string, now = new Date().toISOString()): MemoryBodyState {
  return {
    version: MEMORY_BODY_VERSION,
    scope: { userId, projectId },
    atoms: [],
    entities: [],
    relations: [],
    beliefs: [],
    meta: {
      createdAt: now,
      updatedAt: now,
      totalInteractions: 0,
      totalCorrections: 0,
      maturityLevel: 0
    }
  }
}

export function sameMemoryScope(left: MemoryScope, right: MemoryScope): boolean {
  return left.userId === right.userId && left.projectId === right.projectId
}

export function normalizeScore(score: number): number {
  return Math.max(0, Math.min(1, score))
}

export function isActiveMemoryAtom(atom: MemoryAtom): boolean {
  return ACTIVE_MEMORY_LIFECYCLES.includes(atom.lifecycle)
}

export function isProtectedMemoryAtom(atom: MemoryAtom): boolean {
  return atom.lifecycle === 'protected'
}

export function isForbiddenMemoryAtom(atom: MemoryAtom): boolean {
  return atom.lifecycle === 'forbidden'
}
