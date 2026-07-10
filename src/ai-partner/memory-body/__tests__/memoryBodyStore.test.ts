import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { createBrowserMemoryBodyStore } from '../store/browserMemoryBodyStore'
import { createInMemoryMemoryBodyStore } from '../store/inMemoryMemoryBodyStore'
import type { LocalStorageLike } from '../store/memoryBodyStore'

function createAtom(id: string, object: string, overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id,
    scope: overrides.scope ?? { userId: 'user-1', projectId: 'project-1' },
    layer: overrides.layer ?? 'semantic',
    type: overrides.type ?? 'preference',
    subject: overrides.subject ?? 'user',
    predicate: overrides.predicate ?? 'likes',
    object: overrides.object ?? object,
    content: overrides.content ?? `用户喜欢${object}`,
    source: overrides.source ?? 'chat',
    confidence: overrides.confidence ?? 0.8,
    strength: overrides.strength ?? 0.6,
    emotionalWeight: overrides.emotionalWeight ?? 0.2,
    sensitivity: overrides.sensitivity ?? 'personal',
    lifecycle: overrides.lifecycle ?? 'active',
    evidence: overrides.evidence ?? [],
    tags: overrides.tags ?? ['food'],
    createdAt: overrides.createdAt ?? '2026-06-21T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-06-21T00:00:00.000Z',
    lastAccessedAt: overrides.lastAccessedAt ?? '2026-06-21T00:00:00.000Z',
    accessCount: overrides.accessCount ?? 0,
    contradictionOf: overrides.contradictionOf ?? []
  }
}

function createStorage(): LocalStorageLike {
  const values = new Map<string, string>()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
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

  it('persists and loads state from browser storage', () => {
    const storage = createStorage()
    const key = 'memory-body-test'
    const store = createBrowserMemoryBodyStore('user-1', 'project-1', storage, key)
    store.upsertAtom(createAtom('atom-1', '西瓜'))

    const secondStore = createBrowserMemoryBodyStore('user-1', 'project-1', storage, key)
    const loaded = secondStore.load()

    expect(loaded.atoms).toHaveLength(1)
    expect(loaded.atoms[0].object).toBe('西瓜')
  })
})
