import { describe, expect, it } from 'vitest'
import { createMemoryAuditEvent, redactAuditText } from '../audit/memoryAuditLog'

describe('memoryAuditLog', () => {
  it('creates an audit event for memory confirmation without changing the input text', () => {
    const event = createMemoryAuditEvent({
      id: 'audit-1',
      type: 'memory_confirmed',
      atomId: 'atom-1',
      timestamp: '2026-06-23T00:00:00.000Z',
      actor: 'user',
      summary: '用户确认完整方案偏好',
      sourceText: '确认这条记忆，没错'
    })

    expect(event).toEqual({
      id: 'audit-1',
      type: 'memory_confirmed',
      atomId: 'atom-1',
      timestamp: '2026-06-23T00:00:00.000Z',
      actor: 'user',
      summary: '用户确认完整方案偏好',
      safeSourceText: '确认这条记忆，没错'
    })
  })

  it('redacts secret-like text from audit source text', () => {
    expect(redactAuditText('我的 token 是 sk-1234567890abcdef')).toBe('我的 token 是 [REDACTED_SECRET]')
    expect(redactAuditText('password=hello-world')).toBe('password=[REDACTED_SECRET]')
  })
})
