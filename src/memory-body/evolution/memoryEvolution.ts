import { normalizeScore } from '../core/memoryBodyGuards'
import type { MemoryAtom, MemoryEvidence } from '../core/memoryBodyTypes'
import { detectMemoryContradictions } from '../graph/contradictionDetector'

export type MemoryEvolutionProposalType = 'merge_duplicate' | 'promote_memory' | 'resolve_contradiction'

export interface MemoryEvolutionProposal {
  type: MemoryEvolutionProposalType
  targetAtomIds: string[]
  confidence: number
  reason: string
}

export interface MemoryEvolutionResult {
  atoms: MemoryAtom[]
  proposals: MemoryEvolutionProposal[]
}

function evolutionKey(atom: MemoryAtom): string {
  return [
    atom.scope.userId,
    atom.scope.projectId,
    atom.subject,
    atom.predicate,
    atom.object.toLowerCase()
  ].join(':')
}

function roundScore(score: number): number {
  return Math.round(normalizeScore(score) * 100) / 100
}

function isEvolvable(atom: MemoryAtom): boolean {
  return atom.sensitivity !== 'forbidden' && atom.lifecycle !== 'forbidden' && atom.lifecycle !== 'archived'
}

function mergeEvidence(left: MemoryEvidence[], right: MemoryEvidence[]): MemoryEvidence[] {
  const seen = new Set<string>()
  return [...left, ...right].filter(evidence => {
    if (seen.has(evidence.id)) return false
    seen.add(evidence.id)
    return true
  })
}

function mergeDuplicateGroup(group: MemoryAtom[], evolvedAt: string): { atoms: MemoryAtom[], proposal?: MemoryEvolutionProposal } {
  if (group.length < 2) return { atoms: group }

  const [primary, ...duplicates] = group
  const mergedAtom = duplicates.reduce<MemoryAtom>((current, duplicate) => ({
    ...current,
    confidence: roundScore(current.confidence + 0.08),
    strength: roundScore(current.strength + 0.12),
    evidence: mergeEvidence(current.evidence, duplicate.evidence),
    updatedAt: evolvedAt
  }), primary)

  return {
    atoms: [
      mergedAtom,
      ...duplicates.map(atom => ({ ...atom, lifecycle: 'archived' as const, updatedAt: evolvedAt }))
    ],
    proposal: {
      type: 'merge_duplicate',
      targetAtomIds: group.map(atom => atom.id),
      confidence: 0.8,
      reason: `合并 ${group.length} 条重复记忆：${primary.content}`
    }
  }
}

function promoteStrongMemory(atom: MemoryAtom, evolvedAt: string): { atom: MemoryAtom, proposal?: MemoryEvolutionProposal } {
  if (atom.lifecycle !== 'active' || atom.confidence < 0.85 || atom.strength < 0.8) {
    return { atom }
  }

  return {
    atom: { ...atom, lifecycle: 'confirmed', updatedAt: evolvedAt },
    proposal: {
      type: 'promote_memory',
      targetAtomIds: [atom.id],
      confidence: atom.confidence,
      reason: `记忆强度与置信度已达到确认阈值：${atom.content}`
    }
  }
}

export function evolveMemoryAtoms(atoms: MemoryAtom[], evolvedAt: string): MemoryEvolutionResult {
  const grouped = atoms.reduce<Record<string, MemoryAtom[]>>((groups, atom) => {
    if (!isEvolvable(atom)) return { ...groups, [atom.id]: [atom] }
    const key = evolutionKey(atom)
    return { ...groups, [key]: [...(groups[key] ?? []), atom] }
  }, {})

  const mergeResults = Object.values(grouped).map(group => mergeDuplicateGroup(group, evolvedAt))
  const mergeProposals = mergeResults.flatMap(result => result.proposal ? [result.proposal] : [])
  const mergedAtoms = mergeResults.flatMap(result => result.atoms)

  const promoteResults = mergedAtoms.map(atom => isEvolvable(atom) ? promoteStrongMemory(atom, evolvedAt) : { atom })
  const promotedAtoms = promoteResults.map(result => result.atom)
  const promoteProposals = promoteResults.flatMap(result => result.proposal ? [result.proposal] : [])

  const contradictionProposals = detectMemoryContradictions(promotedAtoms.filter(isEvolvable)).map<MemoryEvolutionProposal>(contradiction => ({
    type: 'resolve_contradiction',
    targetAtomIds: contradiction.atomIds,
    confidence: 0.5,
    reason: `发现关于 ${contradiction.object} 的矛盾记忆，需要用户确认`
  }))

  return {
    atoms: promotedAtoms,
    proposals: [...mergeProposals, ...promoteProposals, ...contradictionProposals]
  }
}
