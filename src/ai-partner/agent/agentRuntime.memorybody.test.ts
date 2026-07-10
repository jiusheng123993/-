import { describe, expect, it } from 'vitest'
import { buildChatSystemPrompt } from './agentRuntime'

describe('agent runtime MemoryBody context', () => {
  it('includes MemoryBody context in the chat system prompt', () => {
    const prompt = buildChatSystemPrompt(undefined, undefined, undefined, 'MemoryBody 长期记忆\n- 用户喜欢西瓜')

    expect(prompt).toContain('MemoryBody 长期记忆')
    expect(prompt).toContain('用户喜欢西瓜')
  })
})
