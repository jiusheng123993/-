import { describe, expect, it } from 'vitest'
import {
  buildMemoryPromptContext,
  createBrowserMemoryStore,
  createInitialMemoryState,
  createInMemoryMemoryStore,
  deriveMemoryProfile
} from './memoryStore'
import type { MemoryEvent, MemoryScope } from './memoryTypes'

const fixedNow = '2026-06-01T10:00:00.000Z'

const defaultScope: MemoryScope = {
  userId: 'user-default',
  projectId: 'personal-study-planner'
}

const createEvent = (overrides: Partial<MemoryEvent> = {}): MemoryEvent => ({
  id: overrides.id ?? 'memory-1',
  scope: overrides.scope ?? defaultScope,
  kind: overrides.kind ?? 'preference',
  content: overrides.content ?? '用户喜欢中文详细解释',
  source: overrides.source ?? 'manual',
  confidence: overrides.confidence ?? 0.9,
  status: overrides.status ?? 'active',
  tags: overrides.tags ?? ['communication'],
  createdAt: overrides.createdAt ?? fixedNow,
  updatedAt: overrides.updatedAt ?? fixedNow,
  expiresAt: overrides.expiresAt ?? null
})

describe('memoryStore', () => {
  it('creates a local-first memory state with no external provider dependency', () => {
    const state = createInitialMemoryState()

    expect(state.events).toEqual([])
    expect(state.profiles).toEqual([])
    expect(state.settings.mode).toBe('local-first')
    expect(state.settings.provider).toBe('local')
  })

  it('appends and lists active memories by user and project scope', () => {
    const store = createInMemoryMemoryStore(createInitialMemoryState())
    const otherScope = { userId: 'other-user', projectId: 'personal-study-planner' }

    store.appendEvent(createEvent({ id: 'memory-1', content: '用户喜欢中文详细解释' }))
    store.appendEvent(createEvent({ id: 'memory-2', scope: otherScope, content: '其他用户喜欢英文' }))
    store.appendEvent(createEvent({ id: 'memory-3', status: 'forgotten', content: '用户曾经喜欢强提醒' }))

    const memories = store.listEvents(defaultScope)

    expect(memories).toHaveLength(1)
    expect(memories[0].content).toBe('用户喜欢中文详细解释')
  })

  it('forgets a memory without deleting the audit trail', () => {
    const store = createInMemoryMemoryStore(createInitialMemoryState())
    store.appendEvent(createEvent({ id: 'memory-1' }))

    const forgotten = store.forgetEvent('memory-1', fixedNow)
    const state = store.load()

    expect(forgotten).toBe(true)
    expect(store.listEvents(defaultScope)).toEqual([])
    expect(state.events[0].status).toBe('forgotten')
    expect(state.events[0].updatedAt).toBe(fixedNow)
  })

  it('expires temporary memories while keeping long-term profile facts active', () => {
    const store = createInMemoryMemoryStore(createInitialMemoryState())
    store.appendEvent(createEvent({ id: 'memory-1', expiresAt: '2026-05-31T23:59:59.000Z', content: '用户明天考试' }))
    store.appendEvent(createEvent({ id: 'memory-2', expiresAt: null, content: '用户是项目小白' }))

    const expiredCount = store.clearExpired('2026-06-01T00:00:00.000Z')

    expect(expiredCount).toBe(1)
    expect(store.listEvents(defaultScope).map((event) => event.content)).toEqual(['用户是项目小白'])
  })

  it('derives a user profile with static facts and dynamic context from memory events', () => {
    const events = [
      createEvent({ id: 'memory-1', kind: 'preference', content: '用户喜欢中文详细解释', confidence: 0.95 }),
      createEvent({ id: 'memory-2', kind: 'goal', content: '用户正在开发个人学习规划项目', confidence: 0.9 }),
      createEvent({ id: 'memory-3', kind: 'context', content: '用户最近在研究 AI 记忆模块', confidence: 0.86 }),
      createEvent({ id: 'memory-4', kind: 'constraint', content: '国内用户不能稳定访问海外服务', confidence: 0.88 })
    ]

    const profile = deriveMemoryProfile(defaultScope, events, fixedNow)

    expect(profile.staticFacts.map((fact) => fact.content)).toContain('用户喜欢中文详细解释')
    expect(profile.staticFacts.map((fact) => fact.content)).toContain('用户正在开发个人学习规划项目')
    expect(profile.dynamicContext.map((fact) => fact.content)).toEqual(['用户最近在研究 AI 记忆模块'])
    expect(profile.constraints.map((fact) => fact.content)).toEqual(['国内用户不能稳定访问海外服务'])
  })

  it('builds a compact prompt context for AI without leaking inactive memories', () => {
    const activeEvents = [
      createEvent({ id: 'memory-1', kind: 'preference', content: '用户喜欢小白式解释' }),
      createEvent({ id: 'memory-2', kind: 'context', content: '用户愿意继续开发 memory-core' })
    ]
    const profile = deriveMemoryProfile(defaultScope, activeEvents, fixedNow)

    const context = buildMemoryPromptContext(profile, activeEvents)

    expect(context).toContain('长期画像')
    expect(context).toContain('用户喜欢小白式解释')
    expect(context).toContain('近期上下文')
    expect(context).toContain('用户愿意继续开发 memory-core')
    expect(context).not.toContain('forgotten')
  })

  it('persists memory state through browser storage provider contract', () => {
    const storage = new Map<string, string>()
    const localStorageLike = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value)
    }
    const store = createBrowserMemoryStore(localStorageLike, 'memory-test-state')

    store.appendEvent(createEvent({ id: 'memory-1', content: '用户偏好本地优先记忆' }))
    const reloadedStore = createBrowserMemoryStore(localStorageLike, 'memory-test-state')

    expect(reloadedStore.listEvents(defaultScope)[0].content).toBe('用户偏好本地优先记忆')
  })
})
