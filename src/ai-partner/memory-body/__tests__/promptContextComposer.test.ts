import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { composePromptContext } from '../context/promptContextComposer'

function atom(partial: Partial<MemoryAtom>): MemoryAtom {
  return {
    id: partial.id ?? 'atom-1',
    scope: partial.scope ?? { userId: 'user-1', projectId: 'project-1' },
    layer: 'semantic',
    type: partial.type ?? 'preference',
    subject: 'user',
    predicate: 'prefers',
    object: partial.object ?? '完整方案',
    content: partial.content ?? '用户偏好完整方案，不接受简化版',
    source: partial.source ?? 'chat',
    confidence: partial.confidence ?? 0.9,
    strength: partial.strength ?? 0.9,
    emotionalWeight: partial.emotionalWeight ?? 0.2,
    sensitivity: partial.sensitivity ?? 'personal',
    lifecycle: partial.lifecycle ?? 'confirmed',
    evidence: partial.evidence ?? [{
      id: 'evidence-1',
      source: 'chat',
      sourceText: '要做就做最完整的方案',
      timestamp: '2026-06-23T00:00:00.000Z',
      confidence: 0.9
    }],
    tags: partial.tags ?? ['complete-solution'],
    scenarios: partial.scenarios ?? ['chat'],
    createdAt: '2026-06-23T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z',
    lastAccessedAt: '2026-06-23T00:00:00.000Z',
    accessCount: partial.accessCount ?? 1,
    contradictionOf: partial.contradictionOf ?? []
  }
}

describe('promptContextComposer', () => {
  it('composes safe memory context with usage explanation', () => {
    const result = composePromptContext({
      atoms: [atom({ id: 'atom-complete' })],
      maxItems: 3
    })

    expect(result.context).toContain('用户偏好完整方案，不接受简化版')
    expect(result.usedAtomIds).toEqual(['atom-complete'])
    expect(result.explanations.length).toBe(1)
    expect(result.explanations[0]).toContain('atom-complete')
  })

  it('excludes forbidden and archived memories', () => {
    const result = composePromptContext({
      atoms: [
        atom({ id: 'atom-active', content: '用户偏好完整方案' }),
        atom({ id: 'atom-forbidden', content: '用户喜欢西瓜', lifecycle: 'forbidden', sensitivity: 'forbidden' }),
        atom({ id: 'atom-archived', content: '旧偏好', lifecycle: 'archived' })
      ],
      maxItems: 5
    })

    expect(result.context).toContain('用户偏好完整方案')
    expect(result.context).not.toContain('用户喜欢西瓜')
    expect(result.context).not.toContain('旧偏好')
    expect(result.usedAtomIds).toEqual(['atom-active'])
  })

  it('excludes memory not permitted for the current scenario', () => {
    const result = composePromptContext({
      atoms: [
        atom({ id: 'atom-chat', content: '聊天偏好', scenarios: ['chat'] }),
        atom({ id: 'atom-planning', content: '规划偏好', scenarios: ['goal_planning'] })
      ],
      maxItems: 5,
      scenarios: ['goal_planning']
    })

    expect(result.usedAtomIds).toContain('atom-planning')
    expect(result.usedAtomIds).not.toContain('atom-chat')
  })

  it('blocks cross-user memory when scope is provided', () => {
    const result = composePromptContext({
      atoms: [
        atom({ id: 'atom-other-user', scope: { userId: 'user-2', projectId: 'project-1' }, content: '其他用户记忆' })
      ],
      maxItems: 5,
      scope: { userId: 'user-1', projectId: 'project-1' }
    })

    expect(result.usedAtomIds).toEqual([])
  })

  it('returns empty context when no atoms match', () => {
    const result = composePromptContext({
      atoms: [],
      maxItems: 5
    })

    expect(result.context).toBe('')
    expect(result.usedAtomIds).toEqual([])
    expect(result.explanations).toEqual([])
  })

  it('respects maxItems limit', () => {
    const atoms = Array.from({ length: 10 }, (_, i) =>
      atom({ id: `atom-${i + 1}`, content: `偏好${i + 1}`, confidence: 0.9 - i * 0.05 })
    )
    const result = composePromptContext({
      atoms,
      maxItems: 3
    })

    expect(result.usedAtomIds).toHaveLength(3)
  })
})
