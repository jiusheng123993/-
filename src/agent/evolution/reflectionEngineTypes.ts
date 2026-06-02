import type { MemoryEvent, MemoryProfile } from '../../memory/memoryTypes'

export type ReflectionTriggerType = 'cron' | 'event_threshold' | 'manual'

export type EventThresholdCategory =
  | 'schedule_anomaly'
  | 'goal_completed'
  | 'no_reflection'
  | 'low_focus'
  | 'exam_countdown'

export interface EventThreshold {
  category: EventThresholdCategory
  count: number
  windowDays: number
  description: string
}

export interface ReflectionTrigger {
  type: ReflectionTriggerType
  cronSchedule?: string
  eventThresholds: EventThreshold[]
}

export interface ProfileChangeProposal {
  fieldPath: string
  oldValue: unknown
  newValue: unknown
  reasoning: string
  evidenceEventIds: string[]
  confidence: number
}

export interface SummarizeRequest {
  events: MemoryEvent[]
  currentProfile: MemoryProfile
}

export interface SummarizeResult {
  proposedChanges: ProfileChangeProposal[]
  reflectionNote: string
  confidence: number
}

export interface ReflectionEngine {
  shouldTrigger(events: MemoryEvent[], lastReflectionAt: string, now: string): boolean
  executeReflection(profile: MemoryProfile, events: MemoryEvent[]): Promise<SummarizeResult>
  getDefaultTriggers(): ReflectionTrigger[]
}
