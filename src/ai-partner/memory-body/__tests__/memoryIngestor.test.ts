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
    expect(result.writtenAtoms[0].type).toBe('preference')
    expect(result.writtenAtoms[0].lifecycle).toBe('active')
  })

  it('returns skipped when no extractable memory is found', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)

    const result = ingestMemoryText({
      text: '今天天气不错',
      source: 'chat',
      scope,
      timestamp,
      store
    })

    expect(result.writtenAtoms).toEqual([])
    expect(result.skipped).toBe(true)
    expect(result.reason).toBe('no_extractable_memory')
  })

  it('extracts goal atoms from goal-like text', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)

    const result = ingestMemoryText({
      text: '我的目标是学好 TypeScript',
      source: 'chat',
      scope,
      timestamp,
      store
    })

    expect(result.writtenAtoms.length).toBeGreaterThanOrEqual(1)
    expect(result.writtenAtoms.some(a => a.type === 'goal')).toBe(true)
  })
})
