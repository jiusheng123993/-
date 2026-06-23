import type { MemoryAtom } from '../core/memoryBodyTypes'
import { scoreMemoryQuality } from '../quality/memoryQuality'

export interface CognitiveBudget {
  memoryStorageBudget: number
  promptTokenBudget: number
  attentionBudget: number
  reviewBudget: number
  syncBudget: number
  privacyBudget: number
}

export interface BudgetAllocation {
  atomId: string
  tokenAllocation: number
  qualityScore: number
}

export const DEFAULT_COGNITIVE_BUDGET: CognitiveBudget = {
  memoryStorageBudget: 500,
  promptTokenBudget: 2000,
  attentionBudget: 10,
  reviewBudget: 5,
  syncBudget: 100,
  privacyBudget: 50
}

function estimateTokenCount(atom: MemoryAtom): number {
  return atom.content.length * 0.5 + atom.tags.join(' ').length * 0.3 + 10
}

export function createCognitiveBudget(overrides: Partial<CognitiveBudget> = {}): CognitiveBudget {
  return {
    ...DEFAULT_COGNITIVE_BUDGET,
    ...overrides
  }
}

export function isWithinPromptTokenBudget(atoms: MemoryAtom[], budget: CognitiveBudget): boolean {
  const totalTokens = atoms.reduce((sum, atom) => sum + estimateTokenCount(atom), 0)
  return totalTokens <= budget.promptTokenBudget
}

export function isWithinReviewBudget(count: number, budget: CognitiveBudget): boolean {
  return count <= budget.reviewBudget
}

export function isWithinStorageBudget(count: number, budget: CognitiveBudget): boolean {
  return count <= budget.memoryStorageBudget
}

export function allocatePromptBudget(atoms: MemoryAtom[], budget: CognitiveBudget): BudgetAllocation[] {
  if (atoms.length === 0) return []

  const scored = atoms.map(atom => ({
    atom,
    quality: scoreMemoryQuality(atom)
  }))

  scored.sort((a, b) => b.quality.overallScore - a.quality.overallScore)

  const totalQuality = scored.reduce((sum, item) => sum + item.quality.overallScore, 0)

  if (totalQuality === 0) {
    const equalShare = Math.floor(budget.promptTokenBudget / scored.length)
    return scored.map(item => ({
      atomId: item.atom.id,
      tokenAllocation: equalShare,
      qualityScore: item.quality.overallScore
    }))
  }

  const allocations: BudgetAllocation[] = []
  let remainingBudget = budget.promptTokenBudget

  for (let i = 0; i < scored.length; i++) {
    const item = scored[i]
    const proportion = item.quality.overallScore / totalQuality
    const allocation = Math.floor(proportion * budget.promptTokenBudget)

    if (i === scored.length - 1) {
      allocations.push({
        atomId: item.atom.id,
        tokenAllocation: Math.max(0, remainingBudget),
        qualityScore: item.quality.overallScore
      })
    } else {
      const clamped = Math.min(allocation, remainingBudget)
      allocations.push({
        atomId: item.atom.id,
        tokenAllocation: clamped,
        qualityScore: item.quality.overallScore
      })
      remainingBudget -= clamped
    }
  }

  return allocations
}

export function allocateReviewBudget(atoms: MemoryAtom[], budget: CognitiveBudget): BudgetAllocation[] {
  if (atoms.length === 0) return []

  const scored = atoms.map(atom => ({
    atom,
    quality: scoreMemoryQuality(atom)
  }))

  scored.sort((a, b) => b.quality.overallScore - a.quality.overallScore)

  return scored.slice(0, budget.reviewBudget).map(item => ({
    atomId: item.atom.id,
    tokenAllocation: estimateTokenCount(item.atom),
    qualityScore: item.quality.overallScore
  }))
}
