import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryContextPreview } from './MemoryContextPreview'
import type { MemoryProfile, MemoryEvent } from './memoryTypes'

vi.mock('./memoryInjector', () => ({
  buildMemoryProfilePrompt: vi.fn((profile, events) => {
    if (!profile || !events || events.length === 0) return ''
    return '=== 用户画像 ===\n身份\n  - 昵称: 测试用户\n\n=== 相关记忆 ===\n- 用户表达了想要提高学习效率的愿望'
  }),
  buildMemoryEventContext: vi.fn((events, query) => {
    if (!events || events.length === 0) return ''
    return '相关记忆事件\n- 用户表达了想要提高学习效率的愿望'
  })
}))

const createMockProfile = (overrides?: Partial<MemoryProfile>): MemoryProfile => ({
  version: 1,
  scope: 'user' as const,
  identity: {
    nickname: '测试用户',
    ageGroup: 'young_adult',
    occupation: '学生'
  },
  personality: {
    mbtiTendency: 'intuitive',
    workStyle: 'deep_work',
    planningStyle: 'flexible',
    motivationStyle: 'achievement',
    feedbackStyle: 'direct',
    stressResponse: 'problem_focused',
    selfDescription: '喜欢学习新知识'
  },
  rhythm: {
    energyPeak: 'morning',
    typicalStudyHours: '2-4h',
    sleepPattern: 'regular',
    preferredSessionLength: 45,
    breakPreference: 'short_breaks',
    weeklyActiveDays: 5
  },
  goals: {
    primaryGoal: '通过考试',
    secondaryGoals: ['提高效率', '养成习惯'],
    targetExams: ['期末考试'],
    targetDate: '2026-06-30',
    careerDirection: '技术领域'
  },
  preferences: {
    encouragementStyle: 'specific',
    reminderFrequency: 'daily',
    detailLevel: 'concise',
    languageStyle: 'friendly'
  },
  boundaries: {
    tabooTopics: [],
    triggerWords: [],
    dontMention: [],
    sensitiveAreas: []
  },
  learning: {
    strongSubjects: ['数学'],
    weakSubjects: ['英语'],
    learningStyle: 'visual',
    commonBlockers: ['拖延'],
    effectiveStrategies: ['番茄钟']
  },
  emotional: {
    currentMoodTrend: 'stable',
    motivationLevel: 'high',
    supportNeeds: ['鼓励'],
    recentWins: ['完成作业']
  },
  meta: {
    createdAt: '2026-01-01',
    updatedAt: '2026-06-01',
    totalEventsProcessed: 10,
    sourceBreakdown: {
      manual: 5,
      conversation: 3,
      behavior: 2
    }
  },
  ...overrides
})

const createMockEvent = (overrides?: Partial<MemoryEvent>): MemoryEvent => ({
  id: 'event-1',
  type: 'conversation',
  content: '用户表达了想要提高学习效率的愿望',
  scope: 'user',
  status: 'active',
  importance: 0.7,
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-06-01T10:00:00Z',
  metadata: {},
  ...overrides
})

describe('MemoryContextPreview', () => {
  it('renders memory context preview component', () => {
    const profile = createMockProfile()
    const events = [createMockEvent()]
    
    render(<MemoryContextPreview profile={profile} events={events} />)
    
    expect(screen.getByText('记忆上下文')).toBeInTheDocument()
  })

  it('shows active event count', () => {
    const profile = createMockProfile()
    const events = [
      createMockEvent({ id: 'event-1', status: 'active' }),
      createMockEvent({ id: 'event-2', status: 'active' }),
      createMockEvent({ id: 'event-3', status: 'archived' })
    ]
    
    render(<MemoryContextPreview profile={profile} events={events} />)
    
    expect(screen.getByText('2 个活跃事件')).toBeInTheDocument()
  })

  it('shows profile information when available', () => {
    const profile = createMockProfile()
    const events = [createMockEvent()]
    
    render(<MemoryContextPreview profile={profile} events={events} />)
    
    expect(screen.getByText(/画像信息/)).toBeInTheDocument()
  })

  it('shows event context when available', () => {
    const profile = createMockProfile()
    const events = [createMockEvent()]
    
    render(<MemoryContextPreview profile={profile} events={events} />)
    
    expect(screen.getAllByText(/记忆事件/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows placeholder when no memory data', () => {
    const profile = createMockProfile()
    const events: MemoryEvent[] = []
    
    render(<MemoryContextPreview profile={profile} events={events} />)
    
    expect(screen.getByText(/暂无记忆数据/)).toBeInTheDocument()
  })

  it('renders with different modes', () => {
    const profile = createMockProfile()
    const events = [createMockEvent()]
    
    const { rerender } = render(
      <MemoryContextPreview profile={profile} events={events} mode="chat" />
    )
    expect(screen.getByText('记忆上下文')).toBeInTheDocument()

    rerender(<MemoryContextPreview profile={profile} events={events} mode="silent_suggestion" />)
    expect(screen.getByText('记忆上下文')).toBeInTheDocument()

    rerender(<MemoryContextPreview profile={profile} events={events} mode="reflection" />)
    expect(screen.getByText('记忆上下文')).toBeInTheDocument()
  })

  it('renders with personaId', () => {
    const profile = createMockProfile()
    const events = [createMockEvent()]
    
    render(
      <MemoryContextPreview 
        profile={profile} 
        events={events} 
        personaId="exam_prep" 
      />
    )
    
    expect(screen.getByText('记忆上下文')).toBeInTheDocument()
  })

  it('renders with currentTask', () => {
    const profile = createMockProfile()
    const events = [createMockEvent()]
    
    render(
      <MemoryContextPreview 
        profile={profile} 
        events={events} 
        currentTask="完成数学作业" 
      />
    )
    
    expect(screen.getByText('记忆上下文')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const profile = createMockProfile()
    const events = [createMockEvent()]
    
    render(<MemoryContextPreview profile={profile} events={events} />)
    
    const container = document.querySelector('.memory-context-preview')
    expect(container).toBeInTheDocument()
  })

  it('handles empty profile gracefully', () => {
    const emptyProfile: MemoryProfile = {
      version: 1,
      scope: 'user',
      identity: {},
      personality: {},
      rhythm: {},
      goals: {},
      preferences: {},
      boundaries: {},
      learning: {},
      emotional: {},
      meta: {
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        totalEventsProcessed: 0,
        sourceBreakdown: { manual: 0, conversation: 0, behavior: 0 }
      }
    }
    const events: MemoryEvent[] = []
    
    render(<MemoryContextPreview profile={emptyProfile} events={events} />)
    
    expect(screen.getByText('记忆上下文')).toBeInTheDocument()
  })
})
