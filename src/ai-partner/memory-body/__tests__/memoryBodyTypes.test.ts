import { describe, expect, it } from 'vitest'
import { createMemoryBodyState, isActiveMemoryAtom, isProtectedMemoryAtom } from '../core/memoryBodyGuards'
import type { MemoryAtom } from '../core/memoryBodyTypes'

describe('memory body core types', () => {
  it('creates an empty memory body state', () => {
    const state = createMemoryBodyState('user-1', 'project-1')

    expect(state.version).toBe(1)
    expect(state.scope).toEqual({ userId: 'user-1', projectId: 'project-1' })
    expect(state.atoms).toEqual([])
    expect(state.entities).toEqual([])
    expect(state.relations).toEqual([])
    expect(state.beliefs).toEqual([])
  })

  it('distinguishes active and protected memory atoms', () => {
    const atom: MemoryAtom = {
      id: 'atom-1',
      scope: { userId: 'user-1', projectId: 'project-1' },
      layer: 'semantic',
      type: 'preference',
      subject: 'user',
      predicate: 'likes',
      object: '西瓜',
      content: '用户喜欢西瓜',
      source: 'chat',
      confidence: 0.86,
      strength: 0.72,
      emotionalWeight: 0.2,
      sensitivity: 'personal',
      lifecycle: 'protected',
      evidence: [],
      tags: ['food'],
      createdAt: '2026-06-21T00:00:00.000Z',
      updatedAt: '2026-06-21T00:00:00.000Z',
      lastAccessedAt: '2026-06-21T00:00:00.000Z',
      accessCount: 0,
      contradictionOf: []
    }

    expect(isActiveMemoryAtom(atom)).toBe(true)
    expect(isProtectedMemoryAtom(atom)).toBe(true)
  })
})
