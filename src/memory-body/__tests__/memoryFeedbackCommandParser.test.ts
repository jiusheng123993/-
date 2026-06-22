import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { parseMemoryFeedbackCommand } from '../feedback/memoryFeedbackCommandParser'

const timestamp = '2026-06-23T00:00:00.000Z'
const scope = { userId: 'user-1', projectId: 'project-1' }

function createAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  const id = overrides.id ?? 'atom-watermelon'
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

describe('memory feedback command parser', () => {
  it('parses confirmation feedback for the most recent memory', () => {
    const result = parseMemoryFeedbackCommand({
      text: '确认这条记忆，没错',
      atoms: [createAtom()],
      timestamp
    })

    expect(result.matched).toBe(true)
    expect(result.feedback).toMatchObject({
      type: 'confirm',
      atomId: 'atom-watermelon',
      timestamp
    })
  })

  it('parses forget feedback by matching the target memory object', () => {
    const result = parseMemoryFeedbackCommand({
      text: '忘掉西瓜，不要记这个',
      atoms: [
        createAtom({ id: 'atom-watermelon', object: '西瓜', content: '用户喜欢西瓜' }),
        createAtom({ id: 'atom-mango', object: '芒果', content: '用户喜欢芒果' })
      ],
      timestamp
    })

    expect(result.matched).toBe(true)
    expect(result.feedback).toMatchObject({
      type: 'forget',
      atomId: 'atom-watermelon',
      timestamp
    })
  })

  it('parses correction feedback from natural language replacement', () => {
    const result = parseMemoryFeedbackCommand({
      text: '我喜欢的是芒果，不是西瓜',
      atoms: [createAtom({ id: 'atom-watermelon', object: '西瓜', content: '用户喜欢西瓜' })],
      timestamp
    })

    expect(result.matched).toBe(true)
    expect(result.feedback).toMatchObject({
      type: 'correct',
      atomId: 'atom-watermelon',
      timestamp,
      correction: {
        id: 'atom-correction-atom-watermelon-2026-06-23T00%3A00%3A00.000Z',
        predicate: 'likes',
        object: '芒果',
        content: '用户喜欢芒果'
      }
    })
  })

  it('does not parse unrelated chat as feedback', () => {
    const result = parseMemoryFeedbackCommand({
      text: '今天我想聊聊学习计划',
      atoms: [createAtom()],
      timestamp
    })

    expect(result).toEqual({ matched: false })
  })
})
