import { describe, expect, it } from 'vitest'
import { buildMemoryEventContext, buildMemorySystemPromptExtension } from './memoryInjector'
import { deriveMemoryProfile } from './memoryStore'
import type { MemoryEvent, MemoryScope } from './memoryTypes'

const fixedNow = '2026-06-01T10:00:00.000Z'

const defaultScope: MemoryScope = {
  userId: 'user-default',
  projectId: 'xinghuanhai'
}

const createEvent = (overrides: Partial<MemoryEvent> = {}): MemoryEvent => ({
  id: overrides.id ?? 'memory-1',
  scope: overrides.scope ?? defaultScope,
  kind: overrides.kind ?? 'preference',
  content: overrides.content ?? '用户喜欢先看整体规划再看代码细节',
  source: overrides.source ?? 'manual',
  confidence: overrides.confidence ?? 0.9,
  status: overrides.status ?? 'active',
  tags: overrides.tags ?? ['planning'],
  createdAt: overrides.createdAt ?? fixedNow,
  updatedAt: overrides.updatedAt ?? fixedNow,
  expiresAt: overrides.expiresAt ?? null
})

describe('memoryInjector', () => {
  it('builds a compact system prompt extension from active profile facts', () => {
    const events = [
      createEvent({ id: 'memory-1', kind: 'preference', content: '用户喜欢先看整体规划再看代码细节' }),
      createEvent({ id: 'memory-2', kind: 'constraint', content: '不要泄露密钥或生产配置' })
    ]
    const profile = deriveMemoryProfile(defaultScope, events, fixedNow)

    const prompt = buildMemorySystemPromptExtension(profile, events, {
      mode: 'chat',
      personaId: 'self-growth',
      timeOfDay: 'evening'
    })

    expect(prompt).toContain('用户长期记忆')
    expect(prompt).toContain('self-growth')
    expect(prompt).toContain('用户喜欢先看整体规划再看代码细节')
    expect(prompt).toContain('不要泄露密钥或生产配置')
  })

  it('filters inactive events and returns at most five relevant event lines', () => {
    const events = [
      createEvent({ id: 'memory-1', content: '用户正在开发记忆系统', tags: ['memory'] }),
      createEvent({ id: 'memory-2', content: '用户关注自进化 Agent', tags: ['agent'] }),
      createEvent({ id: 'memory-3', content: '用户喜欢会员系统', tags: ['membership'] }),
      createEvent({ id: 'memory-4', content: '用户喜欢主题系统', tags: ['theme'] }),
      createEvent({ id: 'memory-5', content: '用户关注 prompt 注入', tags: ['memory'] }),
      createEvent({ id: 'memory-6', content: '用户关注云同步', tags: ['memory'] }),
      createEvent({ id: 'memory-7', content: '用户已忘记旧需求', status: 'forgotten', tags: ['memory'] })
    ]

    const context = buildMemoryEventContext(events, '记忆 Agent prompt')

    expect(context).toContain('相关记忆事件')
    expect(context).toContain('用户正在开发记忆系统')
    expect(context).toContain('用户关注自进化 Agent')
    expect(context).not.toContain('用户已忘记旧需求')
    expect(context.split('\n').filter((line) => line.startsWith('- '))).toHaveLength(5)
  })
})
