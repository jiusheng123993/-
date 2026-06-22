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
    expect(store.listActiveAtoms(scope)[0]).toMatchObject({
      predicate: 'likes',
      object: '西瓜',
      lifecycle: 'active'
    })
    expect(context).toContain('用户喜欢西瓜')
  })

  it('does not remember explicit no-memory instructions', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    const result = adapter.rememberUserMessage('不要记，我喜欢吃西瓜', timestamp)

    expect(result.skipped).toBe(true)
    expect(store.listActiveAtoms(scope)).toEqual([])
    expect(adapter.buildPromptContext()).toBe('')
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
})
