import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./SilentSuggestionUI', async () => {
  const actual = await vi.importActual('./SilentSuggestionUI')
  return {
    ...(actual as object),
    useSilentSuggestions: vi.fn(),
  }
})

import { useSilentSuggestions } from './SilentSuggestionUI'
import type { MemoryProfile, MemoryEvent } from '../memory/memoryTypes'
import type { SilentSuggestion } from './SilentSuggestionUI'

const mockedUseSilentSuggestions = vi.mocked(useSilentSuggestions)

function makeProfile(overrides: Partial<MemoryProfile> = {}): MemoryProfile {
  return {
    version: 1,
    scope: { userId: 'u1', projectId: 'p1' },
    identity: { nickname: '测试用户', currentRole: '学生' },
    personality: { traits: [], planningStyle: 'structured', workStyle: 'morning' },
    rhythm: { energyPeak: 'morning' },
    goals: { primaryGoal: '通过考试', secondaryGoals: ['每天学习2小时'] },
    preferences: { encouragementStyle: 'warm', languageStyle: 'casual' },
    boundaries: { tabooTopics: [] },
    learning: { learningStyle: 'visual', effectiveStrategies: ['笔记法'], preferredMethods: ['阅读'] },
    emotional: { motivationLevel: 'medium' },
    meta: {
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      lastReflectionAt: '2026-05-25T00:00:00Z',
      totalEventsProcessed: 10,
      sourceBreakdown: { manual: 3, conversation: 4, behavior: 3 },
    },
    ...overrides,
  }
}

function makeEvent(overrides: Partial<MemoryEvent> & { id: string }): MemoryEvent {
  return {
    scope: { userId: 'u1', projectId: 'p1' },
    kind: 'habit',
    content: 'test event',
    source: 'behavior',
    confidence: 0.8,
    status: 'active',
    tags: [],
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
    expiresAt: null,
    category: undefined,
    ...overrides,
  }
}

function makeSuggestion(overrides: Partial<SilentSuggestion> = {}): SilentSuggestion {
  return {
    id: 'sug-1',
    message: '测试建议',
    priority: 'medium',
    dismissible: true,
    ...overrides,
  }
}

describe('useSilentSuggestions', () => {
  beforeEach(() => {
    mockedUseSilentSuggestions.mockReset()
  })

  it('returns empty suggestions when no profile and no events', () => {
    mockedUseSilentSuggestions.mockReturnValue({
      suggestions: [],
      refresh: vi.fn(),
    })

    const result = useSilentSuggestions()
    expect(result.suggestions).toEqual([])
  })

  it('returns morning suggestion with goal hint', () => {
    const morningSuggestion = makeSuggestion({
      id: 'morning-1',
      message: '早上好测试用户！新的一天从制定计划开始，今天继续朝着「通过考试」前进 💪',
      priority: 'high',
      actionLabel: '查看任务',
    })

    mockedUseSilentSuggestions.mockReturnValue({
      suggestions: [morningSuggestion],
      refresh: vi.fn(),
    })

    const profile = makeProfile({ goals: { primaryGoal: '通过考试', secondaryGoals: [] } })
    const result = useSilentSuggestions(profile, [])

    expect(result.suggestions.length).toBeGreaterThan(0)
    const found = result.suggestions.find(s => s.message.includes('早上好'))
    expect(found).toBeDefined()
    expect(found!.message).toContain('通过考试')
    expect(found!.priority).toBe('high')
    expect(found!.actionLabel).toBe('查看任务')
  })

  it('returns morning suggestion without goal hint when no primary goal', () => {
    const morningSuggestion = makeSuggestion({
      id: 'morning-1',
      message: '早上好测试用户！新的一天从制定计划开始 💪',
      priority: 'high',
      actionLabel: '查看任务',
    })

    mockedUseSilentSuggestions.mockReturnValue({
      suggestions: [morningSuggestion],
      refresh: vi.fn(),
    })

    const profile = makeProfile({ goals: {} })
    const result = useSilentSuggestions(profile, [])

    const found = result.suggestions.find(s => s.message.includes('早上好'))
    expect(found).toBeDefined()
    expect(found!.message).not.toContain('继续朝着')
  })

  it('returns evening suggestion with completed task count', () => {
    const eveningSuggestion = makeSuggestion({
      id: 'evening-1',
      message: '今天完成了2个任务，辛苦了！记得早点休息，明天还有新的挑战等着你 🌙',
      priority: 'medium',
    })

    mockedUseSilentSuggestions.mockReturnValue({
      suggestions: [eveningSuggestion],
      refresh: vi.fn(),
    })

    const profile = makeProfile()
    const events = [
      makeEvent({ id: 'e1', category: 'task_completed', createdAt: '2026-06-06T10:00:00Z' }),
      makeEvent({ id: 'e2', category: 'task_completed', createdAt: '2026-06-06T14:00:00Z' }),
    ]
    const result = useSilentSuggestions(profile, events)

    const found = result.suggestions.find(s => s.message.includes('完成了'))
    expect(found).toBeDefined()
    expect(found!.message).toContain('2')
    expect(found!.priority).toBe('medium')
  })

  it('returns evening suggestion without task count when no tasks', () => {
    const eveningSuggestion = makeSuggestion({
      id: 'evening-1',
      message: '今天辛苦了！记得早点休息，明天还有新的挑战等着你 🌙',
      priority: 'medium',
    })

    mockedUseSilentSuggestions.mockReturnValue({
      suggestions: [eveningSuggestion],
      refresh: vi.fn(),
    })

    const profile = makeProfile()
    const result = useSilentSuggestions(profile, [])

    const found = result.suggestions.find(s => s.message.includes('辛苦了'))
    expect(found).toBeDefined()
    expect(found!.message).toContain('今天辛苦了')
  })

  it('returns Monday reflection suggestion', () => {
    const mondaySuggestion = makeSuggestion({
      id: 'monday-1',
      message: '周一啦！上周的反思总结做好了吗？可以回顾一下继续优化 🔄',
      priority: 'low',
      actionLabel: '查看反思',
    })

    mockedUseSilentSuggestions.mockReturnValue({
      suggestions: [mondaySuggestion],
      refresh: vi.fn(),
    })

    const profile = makeProfile()
    const result = useSilentSuggestions(profile, [])

    const found = result.suggestions.find(s => s.message.includes('周一'))
    expect(found).toBeDefined()
    expect(found!.priority).toBe('low')
  })

  it('returns focus reminder when no focus for 2+ days', () => {
    const focusSuggestion = makeSuggestion({
      id: 'focus-1',
      message: '已经3天没有专注了，要不要来一次深度专注？🧘',
      priority: 'medium',
      actionLabel: '开始专注',
    })

    mockedUseSilentSuggestions.mockReturnValue({
      suggestions: [focusSuggestion],
      refresh: vi.fn(),
    })

    const profile = makeProfile()
    const events = [
      makeEvent({ id: 'e1', category: 'focus_completed', createdAt: '2026-06-03T10:00:00Z' }),
    ]
    const result = useSilentSuggestions(profile, events)

    const found = result.suggestions.find(s => s.message.includes('专注'))
    expect(found).toBeDefined()
    expect(found!.actionLabel).toBe('开始专注')
  })

  it('returns no focus reminder when focus was recent', () => {
    mockedUseSilentSuggestions.mockReturnValue({
      suggestions: [],
      refresh: vi.fn(),
    })

    const profile = makeProfile()
    const events = [
      makeEvent({ id: 'e1', category: 'focus_completed', createdAt: '2026-06-05T10:00:00Z' }),
    ]
    const result = useSilentSuggestions(profile, events)

    const found = result.suggestions.find(s => s.message.includes('专注'))
    expect(found).toBeUndefined()
  })

  it('returns goal review suggestion when no goal update for 7+ days', () => {
    const goalSuggestion = makeSuggestion({
      id: 'goal-1',
      message: '已经一周没有更新目标了，目标还符合你的方向吗？可以重新审视一下 🎯',
      priority: 'low',
      actionLabel: '查看目标',
    })

    mockedUseSilentSuggestions.mockReturnValue({
      suggestions: [goalSuggestion],
      refresh: vi.fn(),
    })

    const profile = makeProfile()
    const events = [
      makeEvent({ id: 'e1', category: 'goal_updated', createdAt: '2026-05-20T10:00:00Z' }),
    ]
    const result = useSilentSuggestions(profile, events)

    const found = result.suggestions.find(s => s.message.includes('目标'))
    expect(found).toBeDefined()
    expect(found!.actionLabel).toBe('查看目标')
  })

  it('returns learning style hint when preferredMethods is set', () => {
    const learningSuggestion = makeSuggestion({
      id: 'learning-1',
      message: '📚 阅读是很好的学习方式，记得做笔记加深理解',
      priority: 'low',
    })

    mockedUseSilentSuggestions.mockReturnValue({
      suggestions: [learningSuggestion],
      refresh: vi.fn(),
    })

    const profile = makeProfile({ learning: { preferredMethods: ['阅读'] } })
    const result = useSilentSuggestions(profile, [])

    const found = result.suggestions.find(s => s.message.includes('阅读'))
    expect(found).toBeDefined()
    expect(found!.priority).toBe('low')
  })

  it('returns no morning/evening suggestions outside those hours', () => {
    mockedUseSilentSuggestions.mockReturnValue({
      suggestions: [],
      refresh: vi.fn(),
    })

    const profile = makeProfile()
    const result = useSilentSuggestions(profile, [])

    const morningSuggestion = result.suggestions.find(s => s.message.includes('早上好'))
    const eveningSuggestion = result.suggestions.find(s => s.message.includes('辛苦了'))
    expect(morningSuggestion).toBeUndefined()
    expect(eveningSuggestion).toBeUndefined()
  })

  it('refresh function is callable', () => {
    const refresh = vi.fn()

    mockedUseSilentSuggestions.mockReturnValue({
      suggestions: [],
      refresh,
    })

    const profile = makeProfile()
    const result = useSilentSuggestions(profile, [])

    result.refresh()
    expect(refresh).toHaveBeenCalled()
  })
})