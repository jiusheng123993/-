import type { MemoryBodyState } from '../core/memoryBodyTypes'
import { decayMemoryAtoms, type MemoryDecayInput, type MemoryDecayProposal } from './memoryDecay'

export interface MemoryDecayCycleInput extends Omit<MemoryDecayInput, 'atoms'> {
  state: MemoryBodyState
  minDaysBetweenDecay?: number
}

export interface MemoryDecayCycleResult {
  state: MemoryBodyState
  decayed: boolean
  proposals: MemoryDecayProposal[]
}

function daysBetween(left: string | undefined, right: string): number {
  if (!left) return Number.POSITIVE_INFINITY
  const leftTime = new Date(left).getTime()
  const rightTime = new Date(right).getTime()
  if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return 0
  return Math.max(0, Math.floor((rightTime - leftTime) / 86_400_000))
}

export function runMemoryDecayCycle(input: MemoryDecayCycleInput): MemoryDecayCycleResult {
  const minDaysBetweenDecay = input.minDaysBetweenDecay ?? 1
  if (daysBetween(input.state.meta.lastDecayAt, input.decayedAt) < minDaysBetweenDecay) {
    return { state: input.state, decayed: false, proposals: [] }
  }

  const result = decayMemoryAtoms({
    atoms: input.state.atoms,
    decayedAt: input.decayedAt,
    inactiveDaysBeforeDecay: input.inactiveDaysBeforeDecay,
    decayAmount: input.decayAmount,
    weakeningThreshold: input.weakeningThreshold,
    archiveThreshold: input.archiveThreshold
  })

  return {
    state: {
      ...input.state,
      atoms: result.atoms,
      meta: {
        ...input.state.meta,
        updatedAt: input.decayedAt,
        lastDecayAt: input.decayedAt
      }
    },
    decayed: true,
    proposals: result.proposals
  }
}
