import { buildMemoryBodyPromptContext } from './memoryBodyContextBuilder'
import { isActiveMemoryAtom, isForbiddenMemoryAtom } from '../core/memoryBodyGuards'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { scoreMemoryQuality } from '../quality/memoryQuality'

export interface PromptContextComposerInput {
  atoms: MemoryAtom[]
  maxItems?: number
}

export interface PromptContextComposerResult {
  context: string
  usedAtomIds: string[]
  explanations: string[]
}

export function composePromptContext(input: PromptContextComposerInput): PromptContextComposerResult {
  const ranked = input.atoms
    .filter(atom => isActiveMemoryAtom(atom) && !isForbiddenMemoryAtom(atom))
    .map(atom => ({ atom, quality: scoreMemoryQuality(atom) }))
    .sort((left, right) => right.quality.overallScore - left.quality.overallScore)
    .slice(0, input.maxItems ?? 8)

  const atoms = ranked.map(item => item.atom)

  return {
    context: buildMemoryBodyPromptContext({ atoms }),
    usedAtomIds: atoms.map(atom => atom.id),
    explanations: ranked.map(item => `使用 ${item.atom.id}：${item.atom.lifecycle} / ${item.atom.sensitivity} / overall ${item.quality.overallScore.toFixed(2)}`)
  }
}
