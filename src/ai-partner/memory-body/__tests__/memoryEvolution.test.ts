import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { evolveMemoryAtoms } from '../evolution/memoryEvolution'

const scope = { userId: 'user-1', projectId: 'project-1' }
const timestamp = '2026-06-22T00:00:00.000Z'
const evolvedAt = '2026-06-22T01:00:00.000Z'

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

describe('memory evolution', () => {
  it('strengthens repeated equivalent memories and archives duplicate atoms', () => {
    const result = evolveMemoryAtoms([
      createAtom({ id: 'atom-first', confidence: 0.72, strength: 0.45 }),
      createAtom({ id: 'atom-repeat', confidence: 0.78, strength: 0.5 })
    ], evolvedAt)

    expect(result.atoms).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'atom-first',
        confidence: 0.8,
        strength: 0.57,
        lifecycle: 'active',
        updatedAt: evolvedAt,
        evidence: expect.arrayContaining([
          expect.objectContaining({ id: 'evidence-atom-first' }),
          expect.objectContaining({ id: 'evidence-atom-repeat' })
        ])
      }),
      expect.objectContaining({
        id: 'atom-repeat',
        lifecycle: 'archived',
        updatedAt: evolvedAt
      })
    ]))
    expect(result.proposals).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'merge_duplicate',
        targetAtomIds: ['atom-first', 'atom-repeat']
      })
    ]))
  })

  it('promotes strong active memories to confirmed', () => {
    const result = evolveMemoryAtoms([
      createAtom({ id: 'atom-strong', confidence: 0.88, strength: 0.82 })
    ], evolvedAt)

    expect(result.atoms[0]).toMatchObject({
      id: 'atom-strong',
      lifecycle: 'confirmed',
      updatedAt: evolvedAt
    })
    expect(result.proposals).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'promote_memory',
        targetAtomIds: ['atom-strong']
      })
    ]))
  })

  it('creates contradiction resolution proposals without deciding which memory is true', () => {
    const result = evolveMemoryAtoms([
      createAtom({ id: 'atom-like', predicate: 'likes', type: 'preference', content: '用户喜欢西瓜' }),
      createAtom({ id: 'atom-dislike', predicate: 'dislikes', type: 'boundary', content: '用户不喜欢西瓜' })
    ], evolvedAt)

    expect(result.atoms.map(atom => atom.lifecycle)).toEqual(['active', 'active'])
    expect(result.proposals).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'resolve_contradiction',
        targetAtomIds: ['atom-like', 'atom-dislike'],
        confidence: 0.5
      })
    ]))
  })

  it('does not evolve forbidden memories into active context', () => {
    const result = evolveMemoryAtoms([
      createAtom({ id: 'atom-secret', sensitivity: 'forbidden', lifecycle: 'forbidden', content: 'api key sk-test' })
    ], evolvedAt)

    expect(result.atoms[0]).toMatchObject({
      id: 'atom-secret',
      sensitivity: 'forbidden',
      lifecycle: 'forbidden',
      updatedAt: timestamp
    })
    expect(result.proposals).toEqual([])
  })
})
