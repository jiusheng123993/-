import { describe, expect, it } from 'vitest'
import type { MemoryAtom, MemoryBodyState } from '../core/memoryBodyTypes'
import { runMemoryDecayCycle } from '../decay/memoryDecayCycle'

const scope = { userId: 'user-1', projectId: 'project-1' }
const old = '2026-03-01T00:00:00.000Z'
const now = '2026-06-22T00:00:00.000Z'

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
    evidence: overrides.evidence ?? [],
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

function createState(overrides: Partial<MemoryBodyState> = {}): MemoryBodyState {
  return {
    version: 1,
    scope,
    atoms: overrides.atoms ?? [createAtom()],
    entities: overrides.entities ?? [],
    relations: overrides.relations ?? [],
    beliefs: overrides.beliefs ?? [],
    meta: overrides.meta ?? {
      createdAt: old,
      updatedAt: old,
      lastDecayAt: old,
      totalInteractions: 0,
      totalCorrections: 0,
      maturityLevel: 0
    }
  }
}

describe('memory decay cycle', () => {
  it('runs decay when the decay interval has elapsed and records meta timestamps', () => {
    const result = runMemoryDecayCycle({ state: createState(), decayedAt: now, minDaysBetweenDecay: 1 })

    expect(result.decayed).toBe(true)
    expect(result.state.atoms[0].strength).toBeLessThan(0.6)
    expect(result.state.meta.lastDecayAt).toBe(now)
    expect(result.state.meta.updatedAt).toBe(now)
  })

  it('does not run decay again before the interval has elapsed', () => {
    const state = createState({
      meta: {
        createdAt: old,
        updatedAt: now,
        lastDecayAt: now,
        totalInteractions: 0,
        totalCorrections: 0,
        maturityLevel: 0
      }
    })

    const result = runMemoryDecayCycle({ state, decayedAt: now, minDaysBetweenDecay: 1 })

    expect(result.decayed).toBe(false)
    expect(result.state.atoms[0].strength).toBe(0.6)
    expect(result.state.meta.lastDecayAt).toBe(now)
  })
})
