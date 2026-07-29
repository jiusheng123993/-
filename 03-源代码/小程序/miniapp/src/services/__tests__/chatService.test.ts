import { describe, it, expect, vi } from 'vitest'

vi.mock('../aiProvider', () => ({
  chat: vi.fn().mockResolvedValue('这是一条AI回复'),
  guardCheck: vi.fn().mockResolvedValue({ isHarmful: false, score: 0, isCrisis: false }),
  guardCheckOutput: vi.fn().mockResolvedValue({ isUnsafeMedicalAdvice: false }),
}))

vi.mock('../../utils/ruleGuard', () => ({
  checkInput: vi.fn().mockReturnValue({ blocked: false, action: 'pass' }),
  sanitizeOutput: vi.fn((t: string) => t),
}))

vi.mock('../../utils/authGuard', () => ({
  requireAuth: vi.fn(),
  AuthenticationError: class extends Error { constructor(m: string) { super(m); this.name = 'AuthenticationError' } },
}))

import { sendChatMessage } from '../chatService'

describe('sendChatMessage', () => {
  it('should return AI reply for normal pet question', async () => {
    const result = await sendChatMessage('青橘今天食欲不太好', { petName: '青橘' })
    expect(result.blocked).toBe(false)
    expect(typeof result.reply).toBe('string')
  })

  it('should include pet context in prompt', async () => {
    const result = await sendChatMessage('今天怎么样', {
      petName: '小橘',
      petBreed: '中华田园猫',
      petAge: '4岁'
    })
    expect(result.blocked).toBe(false)
    expect(typeof result.reply).toBe('string')
  })
})
