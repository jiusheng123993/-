import { describe, expect, it } from 'vitest'
import { createInMemoryMemoryBodyStore } from '../store/inMemoryMemoryBodyStore'
import type { MemoryAtom } from '../core/memoryBodyTypes'

function createAtom(id: string, object: string): MemoryAtom {
  return {
    id,
    scope: { userId: 'user-1', projectId: 'project-1' },
    layer: 'semantic',
    type: 'preference',
    subject: 'user',
    predicate: 'likes',
    object,
    content: `用户喜欢${object}`,
    source: 'chat',
    confidence: 0.8,
    strength: 0.6,
    emotionalWeight: 0.2,
    sensitivity: 'personal',
    lifecycle: 'active',
    evidence: [],
    tags: ['food'],
    createdAt: '2026-06-21T00:00:00.000Z',
    updatedAt: '2026-06-21T00:00:00.000Z',
    lastAccessedAt: '2026-06-21T00:00:00.000Z',
    accessCount: 0,
    contradictionOf: []
  }
}

describe('memory body store', () => {
  it('upserts and lists active atoms by scope', () => {
    const store = createInMemoryMemoryBodyStore('user-1', 'project-1')
    store.upsertAtom(createAtom('atom-1', '西瓜'))

    expect(store.listActiveAtoms({ userId: 'user-1', projectId: 'project-1' })).toHaveLength(1)
    expect(store.listActiveAtoms({ userId: 'user-2', projectId: 'project-1' })).toHaveLength(0)
  })

  it('archives atoms without deleting evidence', () => {
    const store = createInMemoryMemoryBodyStore('user-1', 'project-1')
    store.upsertAtom(createAtom('atom-1', '西瓜'))
    const archived = store.archiveAtom('atom-1', '2026-06-22T00:00:00.000Z')

    const state = store.load()
    expect(archived).toBe(true)
    expect(state.atoms[0].lifecycle).toBe('archived')
    expect(state.atoms[0].updatedAt).toBe('2026-06-22T00:00:00.000Z')
  })

  it('marks atoms forbidden when forgotten', () => {
    const store = createInMemoryMemoryBodyStore('user-1', 'project-1')
    store.upsertAtom(createAtom('atom-1', '西瓜'))
    const forgotten = store.forgetAtom('atom-1', '2026-06-22T00:00:00.000Z')

    const state = store.load()
    expect(forgotten).toBe(true)
    expect(state.atoms[0].lifecycle).toBe('forbidden')
    expect(state.atoms[0].sensitivity).toBe('forbidden')
  })
})
