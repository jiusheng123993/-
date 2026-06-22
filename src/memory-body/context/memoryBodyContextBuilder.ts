import { isActiveMemoryAtom, isForbiddenMemoryAtom } from '../core/memoryBodyGuards'
import type { MemoryAtom } from '../core/memoryBodyTypes'

export interface MemoryBodyPromptContextInput {
  atoms: MemoryAtom[]
  maxItems?: number
}

function formatScore(score: number): string {
  return Math.round(score * 100).toString()
}

function formatScenarios(atom: MemoryAtom): string {
  return atom.scenarios && atom.scenarios.length > 0 ? atom.scenarios.join('、') : 'general'
}

function compareMemoryPriority(left: MemoryAtom, right: MemoryAtom): number {
  const leftScore = left.strength + left.confidence
  const rightScore = right.strength + right.confidence
  if (leftScore !== rightScore) return rightScore - leftScore
  return right.updatedAt.localeCompare(left.updatedAt)
}

export function buildMemoryBodyPromptContext(input: MemoryBodyPromptContextInput): string {
  const maxItems = input.maxItems ?? 12
  const atoms = input.atoms
    .filter(atom => isActiveMemoryAtom(atom) && !isForbiddenMemoryAtom(atom))
    .sort(compareMemoryPriority)
    .slice(0, maxItems)

  if (atoms.length === 0) return ''

  const lines = atoms.map(atom => `- ${atom.content}（场景：${formatScenarios(atom)}；置信度：${formatScore(atom.confidence)}%；强度：${formatScore(atom.strength)}%）`)

  return `MemoryBody 长期记忆\n${lines.join('\n')}`
}
