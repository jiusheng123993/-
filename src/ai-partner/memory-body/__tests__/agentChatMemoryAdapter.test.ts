import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { createInMemoryMemoryBodyStore } from '../store/inMemoryMemoryBodyStore'
import { createAgentChatMemoryAdapter } from '../adapter/agentChatMemoryAdapter'

const scope = { userId: 'user-1', projectId: 'project-1' }
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

describe('agent chat memory adapter', () => {
  it('writes chat preferences to MemoryBody and exposes prompt context for later replies', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    const result = adapter.rememberUserMessage('我喜欢吃西瓜', timestamp)
    const context = adapter.buildPromptContext()

    expect(result.writtenAtoms).toHaveLength(1)
    expect(context).toContain('西瓜')
  })

  it('builds prompt context from memories relevant to the current user message', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜', scenarios: ['food_recommendation'] }))
    store.upsertAtom(createAtom({ id: 'atom-study', content: '用户重视学习计划', object: '学习', strength: 1, confidence: 1, scenarios: ['study'] }))
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    const context = adapter.buildPromptContext('我喜欢吃什么水果')

    expect(context).toContain('用户喜欢西瓜')
    expect(context).not.toContain('用户重视学习计划')
  })

  it('tracks access only for memories injected into prompt context', () => {
    const accessedAt = '2026-06-22T01:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜', accessCount: 2, lastAccessedAt: timestamp, scenarios: ['food_recommendation'] }))
    store.upsertAtom(createAtom({ id: 'atom-study', content: '用户重视学习计划', object: '学习', accessCount: 5, lastAccessedAt: timestamp, strength: 1, confidence: 1, scenarios: ['study'] }))
    const adapter = createAgentChatMemoryAdapter({ store, scope, now: () => accessedAt })

    adapter.buildPromptContext('我喜欢吃什么水果')

    const atoms = store.load().atoms
    expect(atoms.find(atom => atom.id === 'atom-watermelon')).toMatchObject({
      accessCount: 3,
      lastAccessedAt: accessedAt,
      updatedAt: accessedAt
    })
    expect(atoms.find(atom => atom.id === 'atom-study')).toMatchObject({
      accessCount: 5,
      lastAccessedAt: timestamp,
      updatedAt: timestamp
    })
  })

  it('reinforces only memories injected into prompt context', () => {
    const accessedAt = '2026-06-22T01:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜', strength: 0.5, confidence: 0.78, scenarios: ['food_recommendation'] }))
    store.upsertAtom(createAtom({ id: 'atom-study', content: '用户重视学习计划', object: '学习', strength: 0.9, confidence: 0.9, scenarios: ['study'] }))
    const adapter = createAgentChatMemoryAdapter({ store, scope, now: () => accessedAt })

    adapter.buildPromptContext('我喜欢吃什么水果')

    const atoms = store.load().atoms
    expect(atoms.find(atom => atom.id === 'atom-watermelon')).toMatchObject({
      strength: 0.54,
      confidence: 0.8
    })
    expect(atoms.find(atom => atom.id === 'atom-study')).toMatchObject({
      strength: 0.9,
      confidence: 0.9
    })
  })

  it('applies explicit confirmation feedback through the adapter store boundary', () => {
    const feedbackAt = '2026-06-22T02:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', confidence: 0.72, strength: 0.5 }))
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    const result = adapter.applyFeedback({
      type: 'confirm',
      atomId: 'atom-watermelon',
      timestamp: feedbackAt
    })

    expect(result.applied).toBe(true)
    expect(store.load().atoms.find(atom => atom.id === 'atom-watermelon')).toMatchObject({
      lifecycle: 'confirmed',
      confidence: 0.87,
      strength: 0.7,
      updatedAt: feedbackAt
    })
  })

  it('applies explicit forget feedback and keeps forbidden memory out of prompt context', () => {
    const feedbackAt = '2026-06-22T02:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜' }))
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    const result = adapter.applyFeedback({
      type: 'forget',
      atomId: 'atom-watermelon',
      timestamp: feedbackAt
    })

    expect(result.applied).toBe(true)
    expect(store.load().atoms.find(atom => atom.id === 'atom-watermelon')).toMatchObject({
      lifecycle: 'forbidden',
      sensitivity: 'forbidden',
      updatedAt: feedbackAt
    })
    expect(adapter.buildPromptContext('我喜欢吃什么水果')).not.toContain('用户喜欢西瓜')
  })

  it('applies explicit correction feedback and records correction meta', () => {
    const feedbackAt = '2026-06-22T02:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜' }))
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    const result = adapter.applyFeedback({
      type: 'correct',
      atomId: 'atom-watermelon',
      timestamp: feedbackAt,
      correction: {
        id: 'atom-mango',
        predicate: 'likes',
        object: '芒果',
        content: '用户喜欢芒果'
      }
    })

    const state = store.load()
    expect(result.applied).toBe(true)
    expect(state.atoms.find(atom => atom.id === 'atom-watermelon')).toMatchObject({
      lifecycle: 'archived',
      updatedAt: feedbackAt
    })
    expect(state.atoms.find(atom => atom.id === 'atom-mango')).toMatchObject({
      source: 'manual',
      lifecycle: 'confirmed',
      content: '用户喜欢芒果',
      contradictionOf: ['atom-watermelon']
    })
    expect(state.meta).toMatchObject({
      totalCorrections: 1,
      updatedAt: feedbackAt
    })
  })

  it('does not apply feedback when atom does not exist', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    const result = adapter.applyFeedback({
      type: 'confirm',
      atomId: 'nonexistent',
      timestamp
    })

    expect(result.applied).toBe(false)
  })
})
