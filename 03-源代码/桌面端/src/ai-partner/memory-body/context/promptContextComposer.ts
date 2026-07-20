import { isActiveMemoryAtom, isForbiddenMemoryAtom } from '../core/memoryBodyGuards'
import type { MemoryAtom, MemoryScenario, MemoryScope } from '../core/memoryBodyTypes'

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
}

function formatAtomForContext(atom: MemoryAtom): string {
  const tags = atom.tags.length > 0 ? ` [${atom.tags.join(', ')}]` : ''
  const prefix = atom.type === 'goal' ? '用户想要' : atom.tags.includes('negative') ? '用户不喜欢' : '用户喜欢'
  return `- ${prefix}${atom.content}${tags}`
}

export function composePromptContext(input: PromptContextComposerInput): PromptContextComposerResult {
  const currentScenarios = input.scenarios ?? ['chat']
  const scope = input.scope

  const filtered = input.atoms
    .filter(atom => isActiveMemoryAtom(atom) && !isForbiddenMemoryAtom(atom))
    .filter(atom => {
      if (!scope) return true
      return atom.scope.userId === scope.userId && atom.scope.projectId === scope.projectId
    })
    .filter(atom => {
      const atomScenarios = atom.scenarios ?? []
      if (currentScenarios.length === 0 || atomScenarios.length === 0) return true
      return atomScenarios.some(s => currentScenarios.includes(s))
    })

  const ranked = filtered
    .sort((a, b) => {
      const scoreA = a.confidence * 0.5 + a.quality * 0.3 + (a.accessCount > 0 ? 0.2 : 0)
      const scoreB = b.confidence * 0.5 + b.quality * 0.3 + (b.accessCount > 0 ? 0.2 : 0)
      return scoreB - scoreA
    })
    .slice(0, input.maxItems ?? 8)

  const atoms = ranked

  if (atoms.length === 0) {
    return { context: '', usedAtomIds: [], explanations: [] }
  }

  const contextLines = [
    '## 用户记忆上下文',
    ...atoms.map(formatAtomForContext)
  ]

  return {
    context: contextLines.join('\n'),
    usedAtomIds: atoms.map(atom => atom.id),
    explanations: ranked.map(atom => `使用 ${atom.id}：${atom.lifecycle} / ${atom.sensitivity} / confidence ${atom.confidence.toFixed(2)}`)
  }
}
