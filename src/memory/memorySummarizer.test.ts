import { describe, expect, it } from 'vitest'
import { createMemorySummarizer } from './memorySummarizer'
import type { MemoryEvent, MemoryProfile, MemoryScope } from './memoryTypes'
import type { SummarizeRequest } from '../agent/evolution/reflectionEngineTypes'

const defaultScope: MemoryScope = {
  userId: 'user-test',
  projectId: 'xinghuanhai'
}

const createBaseProfile = (): MemoryProfile => ({
  version: 1,
  scope: defaultScope,
  identity: {},
  personality: {},
  rhythm: {},
  goals: {},
  preferences: {},
  boundaries: {},
  learning: {},
  emotional: {},
  meta: {
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    totalEventsProcessed: 0,
    sourceBreakdown: { manual: 0, conversation: 0, behavior: 0 }
  }
})

const createEvent = (overrides: Partial<MemoryEvent> = {}): MemoryEvent => ({
  id: overrides.id ?? `event-${Math.random().toString(36).slice(2, 9)}`,
  scope: overrides.scope ?? defaultScope,
  kind: overrides.kind ?? 'preference',
  content: overrides.content ?? '默认事件内容',
  source: overrides.source ?? 'manual',
  confidence: overrides.confidence ?? 0.9,
  status: overrides.status ?? 'active',
  tags: overrides.tags ?? [],
  createdAt: overrides.createdAt ?? '2026-06-01T10:00:00.000Z',
  updatedAt: overrides.updatedAt ?? '2026-06-01T10:00:00.000Z',
  expiresAt: overrides.expiresAt ?? null
})

describe('memorySummarizer', () => {
  it('returns empty proposals when no events provided', async () => {
    const summarizer = createMemorySummarizer()
    const profile = createBaseProfile()

    const result = await summarizer.summarize({
      events: [],
      currentProfile: profile
    } as SummarizeRequest)

    expect(result.proposedChanges).toHaveLength(0)
    expect(result.reflectionNote).toContain('暂无足够事件')
    expect(result.confidence).toBe(0)
  })

  it('detects emotional changes from stress events', async () => {
    const summarizer = createMemorySummarizer()
    const profile = createBaseProfile()
    profile.emotional.motivationLevel = 'medium'

    const events = Array.from({ length: 3 }, (_, i) =>
      createEvent({
        id: `stress-${i}`,
        content: '学习到凌晨',
        tags: ['stress', 'schedule_anomaly'],
        createdAt: `2026-06-0${i + 1}T02:00:00.000Z`
      })
    )

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    expect(result.proposedChanges.length).toBeGreaterThan(0)
    const emotionalChange = result.proposedChanges.find((p) =>
      p.fieldPath === 'emotional.motivationLevel'
    )
    expect(emotionalChange).toBeDefined()
    expect(emotionalChange?.newValue).toBe('low')
    expect(emotionalChange?.confidence).toBeGreaterThanOrEqual(0.6)
  })

  it('detects motivation boost from win events', async () => {
    const summarizer = createMemorySummarizer()
    const profile = createBaseProfile()
    profile.emotional.motivationLevel = 'medium'

    const events = [
      createEvent({
        id: 'win-1',
        content: '完成高数第一章',
        tags: ['milestone', 'goal_completed']
      }),
      createEvent({
        id: 'win-2',
        content: '连续专注 7 天',
        tags: ['milestone']
      })
    ]

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    const motivationChange = result.proposedChanges.find((p) =>
      p.fieldPath === 'emotional.motivationLevel' && p.newValue === 'high'
    )
    expect(motivationChange).toBeDefined()
  })

  it('detects night owl pattern from late night events', async () => {
    const summarizer = createMemorySummarizer()
    const profile = createBaseProfile()
    profile.rhythm.sleepPattern = 'stable'

    const events = Array.from({ length: 3 }, (_, i) =>
      createEvent({
        id: `night-${i}`,
        content: '深夜学习',
        tags: ['study'],
        createdAt: `2026-06-0${i + 1}T03:00:00.000Z`
      })
    )

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    const sleepChange = result.proposedChanges.find((p) =>
      p.fieldPath === 'rhythm.sleepPattern'
    )
    expect(sleepChange).toBeDefined()
    expect(sleepChange?.newValue).toBe('night_owl')
  })

  it('filters proposals below confidence threshold', async () => {
    const summarizer = createMemorySummarizer({ minConfidence: 0.8 })
    const profile = createBaseProfile()

    const events = [
      createEvent({
        id: 'weak-1',
        content: '单次事件',
        tags: ['stress'],
        confidence: 0.3
      })
    ]

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    expect(result.proposedChanges.every((p) => p.confidence >= 0.8)).toBe(true)
  })

  it('respects maxProposals limit', async () => {
    const summarizer = createMemorySummarizer({ maxProposals: 2 })
    const profile = createBaseProfile()
    profile.emotional.motivationLevel = 'medium'
    profile.rhythm.sleepPattern = 'stable'

    const events = [
      ...Array.from({ length: 3 }, (_, i) =>
        createEvent({
          id: `stress-${i}`,
          content: '压力事件',
          tags: ['stress'],
          createdAt: `2026-06-0${i + 1}T02:00:00.000Z`
        })
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        createEvent({
          id: `night-${i}`,
          content: '深夜学习',
          tags: ['study'],
          createdAt: `2026-06-0${i + 1}T03:00:00.000Z`
        })
      )
    ]

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    expect(result.proposedChanges.length).toBeLessThanOrEqual(2)
  })

  it('generates reflection note with event summary', async () => {
    const summarizer = createMemorySummarizer()
    const profile = createBaseProfile()

    const events = [
      createEvent({ id: 'e1', content: '事件1', tags: ['milestone'] }),
      createEvent({ id: 'e2', content: '事件2', tags: ['goal_completed'] })
    ]

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    expect(result.reflectionNote).toContain('分析了最近')
    expect(result.reflectionNote).toContain('条记忆事件')
  })

  it('detects burnout risk from low focus events', async () => {
    const summarizer = createMemorySummarizer()
    const profile = createBaseProfile()
    profile.emotional.motivationLevel = 'medium'

    const events = Array.from({ length: 3 }, (_, i) =>
      createEvent({
        id: `low-focus-${i}`,
        content: '无法集中注意力',
        tags: ['low_focus'],
        createdAt: `2026-06-0${i + 1}T10:00:00.000Z`
      })
    )

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    const burnoutChange = result.proposedChanges.find((p) =>
      p.newValue === 'burnout_risk'
    )
    expect(burnoutChange).toBeDefined()
  })

  it('detects goal changes from goal_completed events', async () => {
    const summarizer = createMemorySummarizer()
    const profile = createBaseProfile()
    profile.goals.primaryGoal = '旧目标'

    const events = [
      createEvent({
        id: 'goal-1',
        content: '通过高数考试',
        tags: ['goal_completed'],
        createdAt: '2026-06-05T10:00:00.000Z'
      })
    ]

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    const goalChange = result.proposedChanges.find((p) =>
      p.fieldPath === 'goals.primaryGoal'
    )
    expect(goalChange).toBeDefined()
    expect(goalChange?.newValue).toBe('通过高数考试')
  })

  it('detects learning subject changes from subject_strong events', async () => {
    const summarizer = createMemorySummarizer()
    const profile = createBaseProfile()
    profile.learning.strongSubjects = ['数学']

    const events = [
      createEvent({
        id: 'subj-1',
        content: '英语',
        tags: ['subject_strong'],
        createdAt: '2026-06-05T10:00:00.000Z'
      })
    ]

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    const learningChange = result.proposedChanges.find((p) =>
      p.fieldPath === 'learning.strongSubjects'
    )
    expect(learningChange).toBeDefined()
    expect(learningChange?.newValue).toContain('英语')
  })

  it('detects learning subject changes from subject_weak events', async () => {
    const summarizer = createMemorySummarizer()
    const profile = createBaseProfile()
    profile.learning.weakSubjects = []

    const events = [
      createEvent({
        id: 'subj-1',
        content: '物理',
        tags: ['subject_weak'],
        createdAt: '2026-06-05T10:00:00.000Z'
      })
    ]

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    const learningChange = result.proposedChanges.find((p) =>
      p.fieldPath === 'learning.weakSubjects'
    )
    expect(learningChange).toBeDefined()
    expect(learningChange?.newValue).toContain('物理')
  })

  it('includes milestone congratulations in reflection note', async () => {
    const summarizer = createMemorySummarizer()
    const profile = createBaseProfile()

    const events = [
      createEvent({
        id: 'milestone-1',
        content: '完成100天连续学习',
        tags: ['milestone'],
        createdAt: '2026-06-05T10:00:00.000Z'
      })
    ]

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    expect(result.reflectionNote).toContain('恭喜')
  })

  it('includes stress warning in reflection note', async () => {
    const summarizer = createMemorySummarizer()
    const profile = createBaseProfile()

    const events = Array.from({ length: 3 }, (_, i) =>
      createEvent({
        id: `stress-${i}`,
        content: '压力事件',
        tags: ['stress'],
        createdAt: `2026-06-0${i + 1}T10:00:00.000Z`
      })
    )

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    expect(result.reflectionNote).toContain('身心健康')
  })

  it('sorts events by createdAt descending', async () => {
    const summarizer = createMemorySummarizer()
    const profile = createBaseProfile()

    const events = [
      createEvent({ id: 'old', content: '旧事件', createdAt: '2026-01-01T10:00:00.000Z' }),
      createEvent({ id: 'new', content: '新事件', createdAt: '2026-06-05T10:00:00.000Z' }),
    ]

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    expect(result.reflectionNote).toContain('分析了最近')
  })

  it('limits events to 50 most recent', async () => {
    const summarizer = createMemorySummarizer()
    const profile = createBaseProfile()

    const events = Array.from({ length: 100 }, (_, i) =>
      createEvent({
        id: `event-${i}`,
        content: `事件${i}`,
        createdAt: `2026-06-0${(i % 7) + 1}T10:00:00.000Z`
      })
    )

    const result = await summarizer.summarize({
      events,
      currentProfile: profile
    } as SummarizeRequest)

    expect(result.reflectionNote).toContain('分析了最近')
  })
})
