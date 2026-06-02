import type { MemoryEvent, MemoryProfile } from '../../memory/memoryTypes'
import type {
  ReflectionEngine,
  ReflectionTrigger,
  EventThreshold,
  EventThresholdCategory,
  SummarizeResult,
  ProfileChangeProposal,
  ReflectionTriggerType,
} from './reflectionEngineTypes'
import { EvolutionEntry } from './evolutionRitualTypes'

const DEFAULT_TRIGGERS: ReflectionTrigger[] = [
  {
    type: 'cron',
    cronSchedule: '0 21 * * 0',
    eventThresholds: [],
  },
  {
    type: 'event_threshold',
    eventThresholds: [
      {
        category: 'schedule_anomaly',
        count: 3,
        windowDays: 7,
        description: '凌晨2点后仍在记录',
      },
      {
        category: 'goal_completed',
        count: 1,
        windowDays: 30,
        description: '目标达成',
      },
      {
        category: 'no_reflection',
        count: 1,
        windowDays: 7,
        description: '连续7天无复盘',
      },
      {
        category: 'low_focus',
        count: 5,
        windowDays: 7,
        description: '连续5天专注时长低于目标的50%',
      },
      {
        category: 'exam_countdown',
        count: 1,
        windowDays: 1,
        description: '考试倒计时归零',
      },
    ],
  },
]

function isSundayAt21(date: Date): boolean {
  const day = date.getUTCDay()
  const hour = date.getUTCHours()
  return day === 0 && hour === 21
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr)
}

function isWithinWindow(eventDate: Date, now: Date, windowDays: number): boolean {
  const diffMs = now.getTime() - eventDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= windowDays
}

function countEventsByCategory(
  events: MemoryEvent[],
  category: EventThresholdCategory,
  now: Date,
  windowDays: number
): number {
  return events.filter((event) => {
    const eventDate = parseDate(event.createdAt)
    return isWithinWindow(eventDate, now, windowDays) && event.tags.includes(category)
  }).length
}

function checkScheduleAnomaly(events: MemoryEvent[], now: Date, threshold: EventThreshold): boolean {
  const recentEvents = events.filter((event) => {
    if (!isWithinWindow(parseDate(event.createdAt), now, threshold.windowDays)) return false
    if (!event.tags.includes('schedule_anomaly')) return false
    const hour = parseDate(event.createdAt).getUTCHours()
    return hour >= 2 && hour < 6
  })
  return recentEvents.length >= threshold.count
}

function checkGoalCompleted(events: MemoryEvent[], now: Date, threshold: EventThreshold): boolean {
  return countEventsByCategory(events, 'goal_completed', now, threshold.windowDays) >= threshold.count
}

function checkNoReflection(lastReflectionAt: string, now: Date, threshold: EventThreshold): boolean {
  const lastReflectionDate = parseDate(lastReflectionAt)
  const diffMs = now.getTime() - lastReflectionDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= threshold.windowDays
}

function checkLowFocus(events: MemoryEvent[], now: Date, threshold: EventThreshold): boolean {
  const recentLowFocusEvents = events.filter((event) => {
    if (!isWithinWindow(parseDate(event.createdAt), now, threshold.windowDays)) return false
    return event.tags.includes('low_focus')
  })
  return recentLowFocusEvents.length >= threshold.count
}

function checkExamCountdown(events: MemoryEvent[], now: Date, threshold: EventThreshold): boolean {
  return countEventsByCategory(events, 'exam_countdown', now, threshold.windowDays) >= threshold.count
}

function checkEventThresholds(
  events: MemoryEvent[],
  lastReflectionAt: string,
  now: Date,
  thresholds: EventThreshold[]
): boolean {
  for (const threshold of thresholds) {
    switch (threshold.category) {
      case 'schedule_anomaly':
        if (checkScheduleAnomaly(events, now, threshold)) return true
        break
      case 'goal_completed':
        if (checkGoalCompleted(events, now, threshold)) return true
        break
      case 'no_reflection':
        if (checkNoReflection(lastReflectionAt, now, threshold)) return true
        break
      case 'low_focus':
        if (checkLowFocus(events, now, threshold)) return true
        break
      case 'exam_countdown':
        if (checkExamCountdown(events, now, threshold)) return true
        break
    }
  }
  return false
}

function shouldTriggerImpl(
  events: MemoryEvent[],
  lastReflectionAt: string,
  now: string
): boolean {
  const nowDate = parseDate(now)

  for (const trigger of DEFAULT_TRIGGERS) {
    if (trigger.type === 'cron' && trigger.cronSchedule) {
      if (isSundayAt21(nowDate)) return true
    }

    if (trigger.type === 'event_threshold' && trigger.eventThresholds.length > 0) {
      if (checkEventThresholds(events, lastReflectionAt, nowDate, trigger.eventThresholds)) {
        return true
      }
    }
  }

  return false
}

async function executeReflectionImpl(
  profile: MemoryProfile,
  events: MemoryEvent[]
): Promise<SummarizeResult> {
  const recentEvents = events.slice(-20)

  const proposedChanges: ProfileChangeProposal[] = [
    {
      fieldPath: 'emotional.motivationLevel',
      oldValue: profile.emotional.motivationLevel ?? 'medium',
      newValue: 'high',
      reasoning: '基于最近的学习表现和专注时长，建议提升动力等级',
      evidenceEventIds: recentEvents.slice(0, 3).map((e) => e.id),
      confidence: 0.75,
    },
  ]

  const filteredProposals = proposedChanges.filter((p) => p.confidence >= 0.6)

  return {
    proposedChanges: filteredProposals,
    reflectionNote: '这是一个占位反思结果。实际实现将调用 AI 进行深度分析。',
    confidence: 0.75,
  }
}

function getDefaultTriggersImpl(): ReflectionTrigger[] {
  return DEFAULT_TRIGGERS
}

function createEntryImpl(
  triggerType: ReflectionTriggerType,
  triggerDetail: string,
  events: MemoryEvent[],
  userId: string
): EvolutionEntry {
  const now = new Date().toISOString()
  const proposedChanges: ProfileChangeProposal[] = events.slice(0, 3).map((event, i) => ({
    fieldPath: `dynamicContext.${i}`,
    oldValue: null,
    newValue: event.content,
    reasoning: `Based on recent activity: ${event.content.substring(0, 50)}...`,
    evidenceEventIds: [event.id],
    confidence: 0.7 + Math.random() * 0.25
  }))

  return {
    id: `evo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    userId,
    triggeredBy: triggerType,
    triggerDetail,
    proposedChanges,
    userDecision: 'pending',
    finalChanges: [],
    reflectionNote: '',
    createdAt: now
  }
}

export const reflectionEngine: ReflectionEngine = {
  shouldTrigger: shouldTriggerImpl,
  executeReflection: executeReflectionImpl,
  getDefaultTriggers: getDefaultTriggersImpl,
  createEntry: createEntryImpl,
}

export { isSundayAt21, checkEventThresholds, countEventsByCategory }
