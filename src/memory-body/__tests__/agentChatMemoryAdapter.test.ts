import { describe, expect, it } from 'vitest'
import { createInMemoryMemoryBodyStore } from '../store/inMemoryMemoryBodyStore'
import { createAgentChatMemoryAdapter } from '../adapter/agentChatMemoryAdapter'

const scope = { userId: 'user-1', projectId: 'project-1' }
const timestamp = '2026-06-22T00:00:00.000Z'

describe('agent chat memory adapter', () => {
  it('writes chat preferences to MemoryBody and exposes prompt context for later replies', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    const result = adapter.rememberUserMessage('我喜欢吃西瓜', timestamp)
    const context = adapter.buildPromptContext()

    expect(result.writtenAtoms).toHaveLength(1)
    expect(store.listActiveAtoms(scope)[0]).toMatchObject({
      predicate: 'likes',
      object: '西瓜',
      lifecycle: 'active'
    })
    expect(context).toContain('用户喜欢西瓜')
  })

  it('does not remember explicit no-memory instructions', () => {
    const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
    const adapter = createAgentChatMemoryAdapter({ store, scope })

    const result = adapter.rememberUserMessage('不要记，我喜欢吃西瓜', timestamp)

    expect(result.skipped).toBe(true)
    expect(store.listActiveAtoms(scope)).toEqual([])
    expect(adapter.buildPromptContext()).toBe('')
  })
})
