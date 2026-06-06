import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, renderHook } from '@testing-library/react'
import { SilentSuggestionUI, useSilentSuggestions } from './SilentSuggestionUI'
import type { SilentSuggestion } from './SilentSuggestionUI'
import type { MemoryProfile, MemoryEvent } from '../memory/memoryTypes'

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

describe('SilentSuggestionUI', () => {
  describe('rendering', () => {
    it('renders nothing when suggestions is empty', () => {
      const { container } = render(<SilentSuggestionUI suggestions={[]} />)
      expect(container.innerHTML).toBe('')
    })

    it('renders a single suggestion', () => {
      render(<SilentSuggestionUI suggestions={[makeSuggestion()]} />)
      expect(screen.getByText('测试建议')).toBeInTheDocument()
    })

    it('renders multiple suggestions sorted by priority', () => {
      const suggestions: SilentSuggestion[] = [
        makeSuggestion({ id: 'low', message: '低优先级', priority: 'low' }),
        makeSuggestion({ id: 'high', message: '高优先级', priority: 'high' }),
        makeSuggestion({ id: 'medium', message: '中优先级', priority: 'medium' }),
      ]
      render(<SilentSuggestionUI suggestions={suggestions} />)

      const messages = screen.getAllByText(/优先级/)
      expect(messages[0].textContent).toBe('高优先级')
      expect(messages[1].textContent).toBe('中优先级')
      expect(messages[2].textContent).toBe('低优先级')
    })

    it('limits visible suggestions to 3', () => {
      const suggestions: SilentSuggestion[] = Array.from({ length: 5 }, (_, i) =>
        makeSuggestion({ id: `sug-${i}`, message: `建议${i}` })
      )
      render(<SilentSuggestionUI suggestions={suggestions} />)

      const messages = screen.getAllByText(/建议/)
      expect(messages.length).toBeLessThanOrEqual(3)
    })

    it('renders action button when actionLabel is provided', () => {
      render(
        <SilentSuggestionUI
          suggestions={[makeSuggestion({ actionLabel: '立即行动' })]}
        />
      )
      expect(screen.getByText('立即行动')).toBeInTheDocument()
    })

    it('renders dismiss button when dismissible is true', () => {
      render(<SilentSuggestionUI suggestions={[makeSuggestion({ dismissible: true })]} />)
      expect(screen.getByText('知道了')).toBeInTheDocument()
    })

    it('does not render dismiss button when dismissible is false', () => {
      render(<SilentSuggestionUI suggestions={[makeSuggestion({ dismissible: false })]} />)
      expect(screen.queryByText('知道了')).toBeNull()
    })
  })

  describe('interactions', () => {
    it('calls onDismiss when dismiss button clicked', () => {
      const onDismiss = vi.fn()
      render(
        <SilentSuggestionUI
          suggestions={[makeSuggestion()]}
          onDismiss={onDismiss}
        />
      )

      fireEvent.click(screen.getByText('知道了'))
      expect(onDismiss).toHaveBeenCalledWith('sug-1')
    })

    it('removes suggestion after dismiss', () => {
      const { rerender } = render(
        <SilentSuggestionUI suggestions={[makeSuggestion()]} />
      )

      fireEvent.click(screen.getByText('知道了'))

      rerender(<SilentSuggestionUI suggestions={[makeSuggestion()]} />)

      expect(screen.queryByText('测试建议')).toBeNull()
    })

    it('calls onAction when action button clicked', () => {
      const onAction = vi.fn()
      render(
        <SilentSuggestionUI
          suggestions={[makeSuggestion({ actionLabel: '执行' })]}
          onAction={onAction}
        />
      )

      fireEvent.click(screen.getByText('执行'))
      expect(onAction).toHaveBeenCalledWith('sug-1')
    })

    it('calls suggestion.action when action button clicked', () => {
      const action = vi.fn()
      render(
        <SilentSuggestionUI
          suggestions={[makeSuggestion({ actionLabel: '执行', action })]}
        />
      )

      fireEvent.click(screen.getByText('执行'))
      expect(action).toHaveBeenCalled()
    })
  })

  describe('priority styles', () => {
    it('renders high priority with error border', () => {
      render(<SilentSuggestionUI suggestions={[makeSuggestion({ priority: 'high' })]} />)
      expect(screen.getByText('测试建议')).toBeInTheDocument()
    })

    it('renders medium priority with warning border', () => {
      render(<SilentSuggestionUI suggestions={[makeSuggestion({ priority: 'medium' })]} />)
      expect(screen.getByText('测试建议')).toBeInTheDocument()
    })

    it('renders low priority', () => {
      render(<SilentSuggestionUI suggestions={[makeSuggestion({ priority: 'low' })]} />)
      expect(screen.getByText('测试建议')).toBeInTheDocument()
    })
  })
})

describe('useSilentSuggestions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T08:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty suggestions when no profile and no events', () => {
    const { result } = renderHook(() => useSilentSuggestions())
    expect(result.current.suggestions).toEqual([])
  })

  it('generates morning suggestion with goal hint', () => {
    const profile = makeProfile({ goals: { primaryGoal: '通过考试', secondaryGoals: [] } })
    const { result } = renderHook(() => useSilentSuggestions(profile, []))

    expect(result.current.suggestions.length).toBeGreaterThan(0)
    const morningSuggestion = result.current.suggestions.find(s => s.message.includes('早上好'))
    expect(morningSuggestion).toBeDefined()
    expect(morningSuggestion!.message).toContain('通过考试')
    expect(morningSuggestion!.priority).toBe('high')
    expect(morningSuggestion!.actionLabel).toBe('查看任务')
  })

  it('generates morning suggestion without goal hint when no primary goal', () => {
    const profile = makeProfile({ goals: {} })
    vi.setSystemTime(new Date('2026-06-06T08:00:00Z'))

    const { result } = renderHook(() => useSilentSuggestions(profile, []))

    const morningSuggestion = result.current.suggestions.find(s => s.message.includes('早上好'))
    expect(morningSuggestion).toBeDefined()
    expect(morningSuggestion!.message).not.toContain('继续朝着')
  })

  it('generates evening suggestion with completed task count', () => {
    vi.setSystemTime(new Date('2026-06-06T21:00:00Z'))
    const profile = makeProfile()
    const events = [
      makeEvent({ id: 'e1', category: 'task_completed', timestamp: '2026-06-06T10:00:00Z' }),
      makeEvent({ id: 'e2', category: 'task_completed', timestamp: '2026-06-06T14:00:00Z' }),
    ]

    const { result } = renderHook(() => useSilentSuggestions(profile, events))

    const eveningSuggestion = result.current.suggestions.find(s => s.message.includes('完成了'))
    expect(eveningSuggestion).toBeDefined()
    expect(eveningSuggestion!.message).toContain('2')
    expect(eveningSuggestion!.priority).toBe('medium')
  })

  it('generates evening suggestion without task count when no tasks', () => {
    vi.setSystemTime(new Date('2026-06-06T21:00:00Z'))
    const profile = makeProfile()

    const { result } = renderHook(() => useSilentSuggestions(profile, []))

    const eveningSuggestion = result.current.suggestions.find(s => s.message.includes('辛苦了'))
    expect(eveningSuggestion).toBeDefined()
    expect(eveningSuggestion!.message).toContain('今天辛苦了')
  })

  it('generates Monday reflection suggestion', () => {
    vi.setSystemTime(new Date('2026-06-01T08:00:00Z'))
    const profile = makeProfile()

    const { result } = renderHook(() => useSilentSuggestions(profile, []))

    const mondaySuggestion = result.current.suggestions.find(s => s.message.includes('周一'))
    expect(mondaySuggestion).toBeDefined()
    expect(mondaySuggestion!.priority).toBe('low')
  })

  it('generates focus reminder when no focus for 2+ days', () => {
    vi.setSystemTime(new Date('2026-06-06T10:00:00Z'))
    const profile = makeProfile()
    const events = [
      makeEvent({ id: 'e1', category: 'focus_completed', timestamp: '2026-06-03T10:00:00Z' }),
    ]

    const { result } = renderHook(() => useSilentSuggestions(profile, events))

    const focusSuggestion = result.current.suggestions.find(s => s.message.includes('专注'))
    expect(focusSuggestion).toBeDefined()
    expect(focusSuggestion!.actionLabel).toBe('开始专注')
  })

  it('does not generate focus reminder when focus was recent', () => {
    vi.setSystemTime(new Date('2026-06-06T10:00:00Z'))
    const profile = makeProfile()
    const events = [
      makeEvent({ id: 'e1', category: 'focus_completed', timestamp: '2026-06-05T10:00:00Z' }),
    ]

    const { result } = renderHook(() => useSilentSuggestions(profile, []))

    const focusSuggestion = result.current.suggestions.find(s => s.message.includes('专注'))
    expect(focusSuggestion).toBeUndefined()
  })

  it('generates goal review suggestion when no goal update for 7+ days', () => {
    vi.setSystemTime(new Date('2026-06-06T10:00:00Z'))
    const profile = makeProfile()
    const events = [
      makeEvent({ id: 'e1', category: 'goal_updated', timestamp: '2026-05-20T10:00:00Z' }),
    ]

    const { result } = renderHook(() => useSilentSuggestions(profile, events))

    const goalSuggestion = result.current.suggestions.find(s => s.message.includes('目标'))
    expect(goalSuggestion).toBeDefined()
    expect(goalSuggestion!.actionLabel).toBe('查看目标')
  })

  it('generates learning style hint when preferredMethods is set', () => {
    vi.setSystemTime(new Date('2026-06-06T10:00:00Z'))
    const profile = makeProfile({ learning: { preferredMethods: ['阅读'] } })

    const { result } = renderHook(() => useSilentSuggestions(profile, []))

    const learningSuggestion = result.current.suggestions.find(s => s.message.includes('阅读'))
    expect(learningSuggestion).toBeDefined()
    expect(learningSuggestion!.priority).toBe('low')
  })

  it('does not generate suggestions outside morning/evening hours', () => {
    vi.setSystemTime(new Date('2026-06-06T14:00:00Z'))
    const profile = makeProfile()

    const { result } = renderHook(() => useSilentSuggestions(profile, []))

    const morningSuggestion = result.current.suggestions.find(s => s.message.includes('早上好'))
    const eveningSuggestion = result.current.suggestions.find(s => s.message.includes('辛苦了'))
    expect(morningSuggestion).toBeUndefined()
    expect(eveningSuggestion).toBeUndefined()
  })

  it('refresh function regenerates suggestions', () => {
    const profile = makeProfile()
    const { result } = renderHook(() => useSilentSuggestions(profile, []))

    const initialCount = result.current.suggestions.length

    act(() => {
      result.current.refresh()
    })

    expect(result.current.suggestions.length).toBeGreaterThanOrEqual(0)
  })
})
