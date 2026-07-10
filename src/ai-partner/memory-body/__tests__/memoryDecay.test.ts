import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { decayMemoryAtoms } from '../decay/memoryDecay'

const scope = { userId: 'user-1', projectId: 'project-1' }
const now = '2026-06-22T00:00:00.000Z'
const recent = '2026-06-10T00:00:00.000Z'
const old = '2026-03-01T00:00:00.000Z'

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
    strength: overrides.strength ?? 0.6,
    emotionalWeight: overrides.emotionalWeight ?? 0.1,
    sensitivity: overrides.sensitivity ?? 'personal',
    lifecycle: overrides.lifecycle ?? 'active',
    evidence: overrides.evidence ?? [{
      id: `evidence-${id}`,
      source: 'chat',
      sourceText: '我喜欢吃西瓜',
      timestamp: old,
      confidence: 0.78
    }],
    tags: overrides.tags ?? ['preference'],
    scenarios: overrides.scenarios ?? ['chat', 'food_recommendation'],
    conditions: overrides.conditions,
    createdAt: overrides.createdAt ?? old,
    updatedAt: overrides.updatedAt ?? old,
    lastAccessedAt: overrides.lastAccessedAt ?? old,
    accessCount: overrides.accessCount ?? 0,
    contradictionOf: overrides.contradictionOf ?? []
  }
}

describe('memory decay', () => {
  it('weakens active memories that have not been accessed for a long time', () => {
    const [decayed] = decayMemoryAtoms({
      atoms: [createAtom({ id: 'atom-old', strength: 0.6, lastAccessedAt: old })],
      decayedAt: now
    }).atoms

    expect(decayed.strength).toBeLessThan(0.6)
    expect(decayed.lifecycle).toBe('active')
    expect(decayed.updatedAt).toBe(now)
  })

  it('does not weaken recently accessed memories', () => {
    const [decayed] = decayMemoryAtoms({
      atoms: [createAtom({ id: 'atom-recent', strength: 0.6, lastAccessedAt: recent })],
      decayedAt: now
    }).atoms

    expect(decayed.strength).toBe(0.6)
    expect(decayed.updatedAt).toBe(old)
  })

  it('does not decay protected, forbidden, or archived memories', () => {
    const result = decayMemoryAtoms({
      atoms: [
        createAtom({ id: 'atom-protected', lifecycle: 'protected', strength: 0.6 }),
        createAtom({ id: 'atom-forbidden', lifecycle: 'forbidden', sensitivity: 'forbidden', strength: 0.6 }),
        createAtom({ id: 'atom-archived', lifecycle: 'archived', strength: 0.6 })
      ],
      decayedAt: now
    })

    expect(result.atoms.map(atom => atom.strength)).toEqual([0.6, 0.6, 0.6])
    expect(result.proposals).toEqual([])
  })

  it('moves very weak memories to weakening and archives exhausted weakening memories', () => {
    const result = decayMemoryAtoms({
      atoms: [
        createAtom({ id: 'atom-weak', lifecycle: 'active', strength: 0.16, lastAccessedAt: old }),
        createAtom({ id: 'atom-exhausted', lifecycle: 'weakening', strength: 0.06, lastAccessedAt: old })
      ],
      decayedAt: now
    })

    expect(result.atoms.find(atom => atom.id === 'atom-weak')?.lifecycle).toBe('weakening')
    expect(result.atoms.find(atom => atom.id === 'atom-exhausted')?.lifecycle).toBe('archived')
    expect(result.proposals.map(proposal => proposal.type)).toEqual(['weaken_memory', 'archive_memory'])
  })
})
