import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { retrieveRelevantMemories } from '../retrieval/memoryRetrieval'

const scope = { userId: 'user-1', projectId: 'project-1' }
const otherScope = { userId: 'user-2', projectId: 'project-1' }
const timestamp = '2026-06-22T00:00:00.000Z'

function createAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  const id = overrides.id ?? 'atom-1'
  return {
    id,
    scope: overrides.scope ?? scope,
    layer: overrides.layer ?? 'semantic',
    type: overrides.type ?? 'preference',
    subject: overrides.subject ?? 'user',
    predicate: overrides.predicate ?? 'likes',
    object: overrides.object ?? '西瓜',
    content: overrides.content ?? '用户喜欢西瓜',
    source: overrides.source ?? 'chat',
    confidence: overrides.confidence ?? 0.78,
    strength: overrides.strength ?? 0.5,
    emotionalWeight: overrides.emotionalWeight ?? 0.1,
    sensitivity: overrides.sensitivity ?? 'personal',
    lifecycle: overrides.lifecycle ?? 'active',
    evidence: overrides.evidence ?? [{
      id: `evidence-${id}`,
      source: 'chat',
      sourceText: '我喜欢吃西瓜',
      timestamp,
      confidence: 0.78
    }],
    tags: overrides.tags ?? ['preference'],
    scenarios: overrides.scenarios ?? ['chat', 'food_recommendation'],
    conditions: overrides.conditions,
    createdAt: overrides.createdAt ?? timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
    lastAccessedAt: overrides.lastAccessedAt ?? timestamp,
    accessCount: overrides.accessCount ?? 0,
    contradictionOf: overrides.contradictionOf ?? []
  }
}

describe('memory retrieval', () => {
  it('ranks memories by query relevance before generic strength', () => {
    const results = retrieveRelevantMemories({
      atoms: [
        createAtom({ id: 'atom-generic', object: '学习', content: '用户重视学习计划', strength: 1, confidence: 1, scenarios: ['study'] }),
        createAtom({ id: 'atom-watermelon', object: '西瓜', content: '用户喜欢西瓜', strength: 0.45, confidence: 0.78, scenarios: ['food_recommendation'] })
      ],
      scope,
      query: '我喜欢吃什么水果',
      scenarios: ['food_recommendation'],
      maxItems: 2
    })

    expect(results.map(atom => atom.id)).toEqual(['atom-watermelon', 'atom-generic'])
  })

  it('filters unsafe, inactive, and cross-scope memories', () => {
    const results = retrieveRelevantMemories({
      atoms: [
        createAtom({ id: 'atom-active' }),
        createAtom({ id: 'atom-archived', lifecycle: 'archived' }),
        createAtom({ id: 'atom-forbidden', sensitivity: 'forbidden', lifecycle: 'forbidden', content: 'api key sk-test' }),
        createAtom({ id: 'atom-other-scope', scope: otherScope })
      ],
      scope,
      query: '西瓜',
      maxItems: 10
    })

    expect(results.map(atom => atom.id)).toEqual(['atom-active'])
  })

  it('prefers scenario-matched memories when query terms are equally relevant', () => {
    const results = retrieveRelevantMemories({
      atoms: [
        createAtom({ id: 'atom-chat', content: '用户喜欢西瓜聊天梗', scenarios: ['chat'], strength: 0.7, confidence: 0.7 }),
        createAtom({ id: 'atom-food', content: '用户喜欢西瓜作为水果推荐', scenarios: ['food_recommendation'], strength: 0.7, confidence: 0.7 })
      ],
      scope,
      query: '西瓜',
      scenarios: ['food_recommendation'],
      maxItems: 2
    })

    expect(results.map(atom => atom.id)).toEqual(['atom-food', 'atom-chat'])
  })

  it('respects max item limits', () => {
    const results = retrieveRelevantMemories({
      atoms: [
        createAtom({ id: 'atom-1', content: '用户喜欢西瓜' }),
        createAtom({ id: 'atom-2', content: '用户喜欢草莓', object: '草莓' })
      ],
      scope,
      query: '喜欢',
      maxItems: 1
    })

    expect(results).toHaveLength(1)
  })
})
