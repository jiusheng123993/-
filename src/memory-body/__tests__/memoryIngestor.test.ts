import { describe, expect, it } from 'vitest'
import { createInMemoryMemoryBodyStore } from '../store/inMemoryMemoryBodyStore'
import { ingestMemoryText } from '../ingestion/memoryIngestor'

const scope = { userId: 'user-1', projectId: 'project-1' }
const timestamp = '2026-06-22T00:00:00.000Z'

describe('memory ingestor', () => {
  it('writes extracted atoms to the memory body store as active memories', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)

    const result = ingestMemoryText({
      text: '我喜欢吃西瓜',
      source: 'chat',
      scope,
      timestamp,
      store
    })

    expect(result.writtenAtoms).toHaveLength(1)
    expect(result.skipped).toBe(false)
    expect(store.listActiveAtoms(scope)).toHaveLength(1)
    expect(store.listActiveAtoms(scope)[0]).toMatchObject({
      type: 'preference',
      predicate: 'likes',
      object: '西瓜',
      lifecycle: 'active'
    })
  })

  it('does not write blocked text to the store', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)

    const result = ingestMemoryText({
      text: '这个不要记，我喜欢吃西瓜',
      source: 'chat',
      scope,
      timestamp,
      store
    })

    expect(result.writtenAtoms).toEqual([])
    expect(result.skipped).toBe(true)
    expect(result.reason).toBe('no_extractable_memory')
    expect(store.listActiveAtoms(scope)).toEqual([])
  })

  it('does not write forbidden secrets to the store', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)

    const result = ingestMemoryText({
      text: '我的 API Key 是 sk-1234567890abcdef',
      source: 'chat',
      scope,
      timestamp,
      store
    })

    expect(result.writtenAtoms).toEqual([])
    expect(result.skipped).toBe(true)
    expect(store.listActiveAtoms(scope)).toEqual([])
  })
})
