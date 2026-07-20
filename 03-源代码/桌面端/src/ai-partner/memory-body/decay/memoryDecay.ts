import { normalizeScore } from '../core/memoryBodyGuards'
import type { MemoryAtom } from '../core/memoryBodyTypes'

export type MemoryDecayProposalType = 'weaken_memory' | 'archive_memory'

export interface MemoryDecayProposal {
  type: MemoryDecayProposalType
  targetAtomIds: string[]
  confidence: number
  reason: string
}

export interface MemoryDecayInput {
  atoms: MemoryAtom[]
  decayedAt: string
  inactiveDaysBeforeDecay?: number
  decayAmount?: number
  weakeningThreshold?: number
  archiveThreshold?: number
}

export interface MemoryDecayResult {
  atoms: MemoryAtom[]
  proposals: MemoryDecayProposal[]
}

function daysBetween(left: string, right: string): number {
  const leftTime = new Date(left).getTime()
  const rightTime = new Date(right).getTime()
  if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return 0
  return Math.max(0, Math.floor((rightTime - leftTime) / 86_400_000))
}

function shouldSkipDecay(atom: MemoryAtom): boolean {
  return atom.lifecycle === 'protected'
    || atom.lifecycle === 'forbidden'
    || atom.lifecycle === 'archived'
    || atom.sensitivity === 'forbidden'
}

function roundScore(score: number): number {
  return Math.round(normalizeScore(score) * 100) / 100
}

export function decayMemoryAtoms(input: MemoryDecayInput): MemoryDecayResult {
  const inactiveDaysBeforeDecay = input.inactiveDaysBeforeDecay ?? 30
  const decayAmount = input.decayAmount ?? 0.08
  const weakeningThreshold = input.weakeningThreshold ?? 0.15
  const archiveThreshold = input.archiveThreshold ?? 0.05
  const proposals: MemoryDecayProposal[] = []

  const atoms = input.atoms.map(atom => {
    if (shouldSkipDecay(atom)) return atom
    if (daysBetween(atom.lastAccessedAt, input.decayedAt) < inactiveDaysBeforeDecay) return atom

    const strength = roundScore(atom.strength - decayAmount)
    let lifecycle = atom.lifecycle

    if (atom.lifecycle === 'weakening' && strength <= archiveThreshold) {
      lifecycle = 'archived'
      proposals.push({
        type: 'archive_memory',
        targetAtomIds: [atom.id],
        confidence: 0.72,
        reason: `记忆长期未被访问且强度已耗尽：${atom.content}`
      })
    } else if (atom.lifecycle !== 'weakening' && strength <= weakeningThreshold) {
      lifecycle = 'weakening'
      proposals.push({
        type: 'weaken_memory',
        targetAtomIds: [atom.id],
        confidence: 0.68,
        reason: `记忆长期未被访问，进入自然弱化：${atom.content}`
      })
    }

    return {
      ...atom,
      strength,
      lifecycle,
      updatedAt: input.decayedAt
    }
  })

  return { atoms, proposals }
}
