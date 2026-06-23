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
    expect(result.explanations).toEqual(['使用 atom-complete：confirmed / personal / quality 0.78 / economy 0.51'])
    expect(result.threatWarnings).toEqual([])
    expect(result.overfittingAdjustments).toEqual([])
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
    expect(result.threatWarnings).toEqual([])
    expect(result.overfittingAdjustments).toEqual([])
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
    expect(result.threatWarnings).toEqual([])
    expect(result.overfittingAdjustments).toEqual([])
  })

  it('includes boundaryWarnings in result', () => {
    const result = composePromptContext({
      atoms: [
        atom({
          id: 'atom-emotion',
          type: 'emotion',
          content: '用户今天心情不好',
          emotionalWeight: 0.9,
          evidence: [{
            id: 'evidence-1',
            source: 'chat',
            sourceText: '今天心情不好',
            timestamp: '2026-06-23T00:00:00.000Z',
            confidence: 0.7
          }],
          tags: ['single_event']
        })
      ],
      maxItems: 5,
      scope: { userId: 'user-1', projectId: 'project-1' }
    })

    expect(result.boundaryWarnings).toContain('single_event_emotion_not_personality')
    expect(result.threatWarnings).toContain('over_personalization')
    expect(result.overfittingAdjustments).toContain('temporary_emotion_short_term')
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
    expect(result.threatWarnings).toContain('cross_context_leakage')
    expect(result.overfittingAdjustments).toEqual([])
  })

  it('returns empty boundaryWarnings when no scope is provided', () => {
    const result = composePromptContext({
      atoms: [
        atom({ id: 'atom-1', content: '用户偏好完整方案' })
      ],
      maxItems: 5
    })

    expect(result.boundaryWarnings).toEqual([])
    expect(result.threatWarnings).toEqual([])
    expect(result.overfittingAdjustments).toEqual([])
  })

  it('blocks memory with unauthorized_memory_use threat', () => {
    const result = composePromptContext({
      atoms: [
        atom({ id: 'atom-forbidden', content: '禁止使用的记忆', lifecycle: 'confirmed', sensitivity: 'forbidden' })
      ],
      maxItems: 5,
      scope: { userId: 'user-1', projectId: 'project-1' }
    })

    expect(result.usedAtomIds).toEqual([])
    expect(result.threatWarnings).toContain('unauthorized_memory_use')
  })

  it('blocks memory with cross_context_leakage threat', () => {
    const result = composePromptContext({
      atoms: [
        atom({ id: 'atom-other-user', scope: { userId: 'user-2', projectId: 'project-1' }, content: '其他用户记忆' })
      ],
      maxItems: 5,
      scope: { userId: 'user-1', projectId: 'project-1' }
    })

    expect(result.usedAtomIds).toEqual([])
    expect(result.threatWarnings).toContain('cross_context_leakage')
  })

  it('blocks memory with low_evidence_stable anti-overfitting', () => {
    const result = composePromptContext({
      atoms: [
        atom({
          id: 'atom-low-evidence',
          content: '低证据稳定记忆',
          lifecycle: 'stable',
          confidence: 0.3,
          evidence: [{ id: 'evidence-1', source: 'chat', sourceText: 'test', timestamp: '2026-06-23T00:00:00.000Z', confidence: 0.3 }]
        })
      ],
      maxItems: 5
    })

    expect(result.usedAtomIds).toEqual([])
    expect(result.overfittingAdjustments).toContain('low_evidence_stable_blocked')
  })

  it('blocks memory with corrected_memory_isolated anti-overfitting', () => {
    const result = composePromptContext({
      atoms: [
        atom({
          id: 'atom-corrected',
          content: '已纠正的记忆',
          lifecycle: 'confirmed',
          source: 'manual',
          contradictionOf: ['atom-other']
        })
      ],
      maxItems: 5
    })

    expect(result.usedAtomIds).toEqual([])
    expect(result.overfittingAdjustments).toContain('corrected_memory_isolated')
  })
})
