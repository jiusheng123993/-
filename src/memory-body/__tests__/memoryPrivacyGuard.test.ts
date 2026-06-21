import { describe, expect, it } from 'vitest'
import { guardMemoryWrite } from '../safety/memoryPrivacyGuard'

describe('memory privacy guard', () => {
  it('blocks api keys and tokens', () => {
    const result = guardMemoryWrite({
      content: '我的 API Key 是 sk-1234567890abcdef',
      source: 'chat'
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('forbidden_secret')
  })

  it('allows harmless preferences', () => {
    const result = guardMemoryWrite({
      content: '我喜欢吃西瓜',
      source: 'chat'
    })

    expect(result.allowed).toBe(true)
    expect(result.sensitivity).toBe('personal')
  })

  it('marks user no-memory instruction as forbidden', () => {
    const result = guardMemoryWrite({
      content: '这个不要记',
      source: 'chat'
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('user_requested_no_memory')
  })
})
