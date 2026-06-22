import { describe, expect, it } from 'vitest'
import { ingestMemoryText } from '../ingestion/memoryIngestor'
import { createInMemoryMemoryBodyStore } from '../store/inMemoryMemoryBodyStore'
import { buildMemoryBodyPromptContext } from '../context/memoryBodyContextBuilder'

const scope = { userId: 'user-1', projectId: 'project-1' }
const timestamp = '2026-06-22T00:00:00.000Z'

describe('memory body context builder', () => {
  it('builds prompt context from active MemoryBody atoms', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    ingestMemoryText({
      text: '我喜欢吃西瓜',
      source: 'chat',
      scope,
      timestamp,
      store
    })

    const context = buildMemoryBodyPromptContext({
      atoms: store.listActiveAtoms(scope),
      maxItems: 5
    })

    expect(context).toContain('MemoryBody 长期记忆')
    expect(context).toContain('用户喜欢西瓜')
    expect(context).toContain('food_recommendation')
  })

  it('excludes forbidden atoms from prompt context', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    store.upsertAtom({
      id: 'atom-secret',
      scope,
      layer: 'semantic',
      type: 'system',
      subject: 'user',
      predicate: 'has_secret',
      object: 'api-key',
      content: 'api key sk-test',
      source: 'chat',
      confidence: 1,
      strength: 1,
      emotionalWeight: 0,
      sensitivity: 'forbidden',
      lifecycle: 'forbidden',
      evidence: [],
      tags: ['secret'],
      scenarios: ['chat'],
      createdAt: timestamp,
      updatedAt: timestamp,
      lastAccessedAt: timestamp,
      accessCount: 0,
      contradictionOf: []
    })

    const context = buildMemoryBodyPromptContext({
      atoms: store.load().atoms,
      maxItems: 5
    })

    expect(context).toBe('')
  })
})
