import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { applyMemoryFeedback } from '../feedback/memoryFeedback'

const scope = { userId: 'user-1', projectId: 'project-1' }
const timestamp = '2026-06-22T00:00:00.000Z'
const feedbackAt = '2026-06-23T00:00:00.000Z'

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
    confidence: overrides.confidence ?? 0.72,
    strength: overrides.strength ?? 0.5,
    emotionalWeight: overrides.emotionalWeight ?? 0.1,
    sensitivity: overrides.sensitivity ?? 'personal',
    lifecycle: overrides.lifecycle ?? 'active',
    evidence: overrides.evidence ?? [{
      id: `evidence-${id}`,
      source: 'chat',
      sourceText: '我喜欢吃西瓜',
      timestamp,
      confidence: 0.72
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

describe('memory feedback', () => {
  it('confirms a memory by strengthening it and promoting lifecycle', () => {
    const result = applyMemoryFeedback({
      atoms: [createAtom({ id: 'atom-watermelon', confidence: 0.72, strength: 0.5 })],
      feedback: { type: 'confirm', atomId: 'atom-watermelon', timestamp: feedbackAt }
    })

    expect(result.applied).toBe(true)
    expect(result.atoms[0]).toMatchObject({
      lifecycle: 'confirmed',
      confidence: 0.87,
      strength: 0.7,
      updatedAt: feedbackAt
    })
  })

  it('corrects a memory by archiving the old atom and adding the corrected atom', () => {
    const result = applyMemoryFeedback({
      atoms: [createAtom({ id: 'atom-watermelon' })],
      feedback: {
        type: 'correct',
        atomId: 'atom-watermelon',
        timestamp: feedbackAt,
        correction: {
          id: 'atom-mango',
          predicate: 'likes',
          object: '芒果',
          content: '用户喜欢芒果'
        }
      }
    })

    expect(result.applied).toBe(true)
    expect(result.atoms.find(atom => atom.id === 'atom-watermelon')).toMatchObject({
      lifecycle: 'archived',
      updatedAt: feedbackAt
    })
    expect(result.atoms.find(atom => atom.id === 'atom-mango')).toMatchObject({
      predicate: 'likes',
      object: '芒果',
      content: '用户喜欢芒果',
      source: 'manual',
      confidence: 0.95,
      strength: 0.85,
      lifecycle: 'confirmed',
      contradictionOf: ['atom-watermelon']
    })
  })

  it('forgets a memory by marking it forbidden without deleting evidence', () => {
    const result = applyMemoryFeedback({
      atoms: [createAtom({ id: 'atom-watermelon' })],
      feedback: { type: 'forget', atomId: 'atom-watermelon', timestamp: feedbackAt }
    })

    expect(result.applied).toBe(true)
    expect(result.atoms[0]).toMatchObject({
      lifecycle: 'forbidden',
      sensitivity: 'forbidden',
      updatedAt: feedbackAt
    })
    expect(result.atoms[0].evidence).toHaveLength(1)
  })

  it('does not change atoms when the target memory does not exist', () => {
    const atom = createAtom({ id: 'atom-watermelon' })
    const result = applyMemoryFeedback({
      atoms: [atom],
      feedback: { type: 'confirm', atomId: 'missing', timestamp: feedbackAt }
    })

    expect(result.applied).toBe(false)
    expect(result.atoms).toEqual([atom])
  })
})
