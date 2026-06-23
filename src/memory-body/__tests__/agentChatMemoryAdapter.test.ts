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

  it('tracks access only for the governed composer selection window', () => {
    const accessedAt = '2026-06-22T01:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    const atoms = Array.from({ length: 9 }, (_, index) => createAtom({
      id: `atom-complete-${index + 1}`,
      object: `完整方案${index + 1}`,
      content: `用户偏好完整方案${index + 1}`,
      lifecycle: 'confirmed',
      confidence: 0.9,
      strength: index === 8 ? 0.9 : 0.8,
      accessCount: 0,
      scenarios: ['chat'],
      tags: [`complete-solution-${index + 1}`],
      evidence: [{
        id: `evidence-complete-${index + 1}`,
        source: 'chat',
        sourceText: `要做完整方案${index + 1}`,
        timestamp,
        confidence: index === 8 ? 0.1 : 0.9
      }]
    }))
    atoms.forEach(atom => store.upsertAtom(atom))
    const adapter = createAgentChatMemoryAdapter({ store, scope, now: () => accessedAt })

    const context = adapter.buildPromptContext()

    const storedAtoms = store.load().atoms
    expect(context).toContain('用户偏好完整方案1')
    expect(context).not.toContain('用户偏好完整方案9')
    expect(storedAtoms.filter(atom => atom.lastAccessedAt === accessedAt)).toHaveLength(8)
    expect(storedAtoms.find(atom => atom.id === 'atom-complete-9')).toMatchObject({
      accessCount: 0,
      lastAccessedAt: timestamp,
      updatedAt: timestamp
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

  it('applies natural language forget feedback commands through the adapter', () => {
    const feedbackAt = '2026-06-22T03:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜' }))
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    const result = adapter.applyFeedbackCommand('忘掉西瓜，不要记这个', feedbackAt)

    expect(result).toMatchObject({
      matched: true,
      applied: true,
      feedback: {
        type: 'forget',
        atomId: 'atom-watermelon',
        timestamp: feedbackAt
      }
    })
    expect(store.load().atoms.find(atom => atom.id === 'atom-watermelon')).toMatchObject({
      lifecycle: 'forbidden',
      sensitivity: 'forbidden',
      updatedAt: feedbackAt
    })
    expect(adapter.buildPromptContext('我喜欢吃什么水果')).not.toContain('用户喜欢西瓜')
  })

  it('applies natural language correction feedback commands through the adapter', () => {
    const feedbackAt = '2026-06-22T03:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜' }))
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    const result = adapter.applyFeedbackCommand('我喜欢的是芒果，不是西瓜', feedbackAt)

    const state = store.load()
    expect(result).toMatchObject({
      matched: true,
      applied: true,
      feedback: {
        type: 'correct',
        atomId: 'atom-watermelon',
        timestamp: feedbackAt
      }
    })
    expect(state.atoms.find(atom => atom.id === 'atom-watermelon')).toMatchObject({
      lifecycle: 'archived',
      updatedAt: feedbackAt
    })
    expect(state.atoms.find(atom => atom.object === '芒果')).toMatchObject({
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

  it('does not apply unrelated chat as a feedback command', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜' }))
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    const result = adapter.applyFeedbackCommand('今天我想聊聊学习计划', timestamp)

    expect(result).toEqual({ matched: false, applied: false })
    expect(store.load().atoms).toHaveLength(1)
    expect(store.load().atoms[0]).toMatchObject({
      id: 'atom-watermelon',
      lifecycle: 'active'
    })
  })

  it('records memory_confirmed audit event when user confirms a memory', () => {
    const feedbackAt = '2026-06-22T02:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', confidence: 0.72, strength: 0.5 }))
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    adapter.applyFeedback({
      type: 'confirm',
      atomId: 'atom-watermelon',
      timestamp: feedbackAt
    })

    const events = store.getAuditEvents({ type: 'memory_confirmed' })
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      type: 'memory_confirmed',
      atomId: 'atom-watermelon',
      actor: 'user',
      summary: '用户确认记忆'
    })
  })

  it('records memory_forgotten audit event when user forgets a memory', () => {
    const feedbackAt = '2026-06-22T02:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜' }))
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    adapter.applyFeedback({
      type: 'forget',
      atomId: 'atom-watermelon',
      timestamp: feedbackAt
    })

    const events = store.getAuditEvents({ type: 'memory_forgotten' })
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      type: 'memory_forgotten',
      atomId: 'atom-watermelon',
      actor: 'user',
      summary: '用户要求忘记记忆'
    })
  })

  it('records memory_corrected audit event when user corrects a memory', () => {
    const feedbackAt = '2026-06-22T02:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜' }))
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    adapter.applyFeedback({
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

    const events = store.getAuditEvents({ type: 'memory_corrected' })
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      type: 'memory_corrected',
      atomId: 'atom-watermelon',
      actor: 'user',
      summary: '用户纠正记忆'
    })
  })

  it('records memory_used_in_prompt audit events for atoms injected into prompt context', () => {
    const accessedAt = '2026-06-22T01:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜', scenarios: ['food_recommendation'] }))
    store.upsertAtom(createAtom({ id: 'atom-study', content: '用户重视学习计划', object: '学习', strength: 1, confidence: 1, scenarios: ['study'] }))
    const adapter = createAgentChatMemoryAdapter({ store, scope, now: () => accessedAt })

    adapter.buildPromptContext('我喜欢吃什么水果')

    const events = store.getAuditEvents({ type: 'memory_used_in_prompt' })
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      type: 'memory_used_in_prompt',
      atomId: 'atom-watermelon',
      actor: 'system',
      summary: '记忆被注入 prompt 上下文'
    })
  })

  it('does not record memory_used_in_prompt for atoms outside the governed composer window', () => {
    const accessedAt = '2026-06-22T01:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    const atoms = Array.from({ length: 9 }, (_, index) => createAtom({
      id: `atom-complete-${index + 1}`,
      object: `完整方案${index + 1}`,
      content: `用户偏好完整方案${index + 1}`,
      lifecycle: 'confirmed',
      confidence: 0.9,
      strength: index === 8 ? 0.9 : 0.8,
      accessCount: 0,
      scenarios: ['chat'],
      tags: [`complete-solution-${index + 1}`],
      evidence: [{
        id: `evidence-complete-${index + 1}`,
        source: 'chat',
        sourceText: `要做完整方案${index + 1}`,
        timestamp,
        confidence: index === 8 ? 0.1 : 0.9
      }]
    }))
    atoms.forEach(atom => store.upsertAtom(atom))
    const adapter = createAgentChatMemoryAdapter({ store, scope, now: () => accessedAt })

    adapter.buildPromptContext()

    const events = store.getAuditEvents({ type: 'memory_used_in_prompt' })
    expect(events).toHaveLength(8)
    const auditedIds = events.map(e => e.atomId)
    expect(auditedIds).toContain('atom-complete-1')
    expect(auditedIds).not.toContain('atom-complete-9')
  })

  it('does not record audit events when feedback does not match any atom', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    const result = adapter.applyFeedback({
      type: 'confirm',
      atomId: 'nonexistent',
      timestamp
    })

    expect(result.applied).toBe(false)
    expect(store.getAuditEvents()).toHaveLength(0)
  })

  it('does not record audit events for unmatched feedback commands', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜' }))
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    adapter.applyFeedbackCommand('今天我想聊聊学习计划', timestamp)

    expect(store.getAuditEvents()).toHaveLength(0)
  })

  it('redacts sensitive source text in audit events from feedback commands', () => {
    const feedbackAt = '2026-06-22T03:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜' }))
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    adapter.applyFeedbackCommand('我喜欢的是芒果，不是西瓜', feedbackAt)

    const events = store.getAuditEvents({ type: 'memory_corrected' })
    expect(events).toHaveLength(1)
    expect(events[0].safeSourceText).toBe('用户喜欢芒果')
  })

  it('does not write raw source text containing secrets into audit safeSourceText', () => {
    const feedbackAt = '2026-06-22T02:00:00.000Z'
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom(createAtom({ id: 'atom-watermelon', content: '用户喜欢西瓜', object: '西瓜' }))
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    adapter.applyFeedback({
      type: 'correct',
      atomId: 'atom-watermelon',
      timestamp: feedbackAt,
      correction: {
        id: 'atom-mango',
        predicate: 'likes',
        object: '芒果',
        content: '我的 token 是 sk-1234567890abcdef'
      }
    })

    const events = store.getAuditEvents({ type: 'memory_corrected' })
    expect(events).toHaveLength(1)
    expect(events[0].safeSourceText).not.toContain('sk-1234567890abcdef')
    expect(events[0].safeSourceText).toContain('[REDACTED_SECRET]')
  })
})
