import type { PersonaDefinition } from './personaScheduler'
import type { MemoryObserver } from '../memory/memoryObserver'
import type { MemoryStore } from '../memory/memoryTypes'

export type CameoTriggerType = 'holiday' | 'exam_season' | 'birthday' | 'anniversary' | 'daily_evening' | 'weekend' | 'focus_streak' | 'task_milestone' | 'mood_low'

export interface CameoTriggerRule {
  type: CameoTriggerType
  personaId: string
  condition: (context: CameoTriggerContext) => boolean
  priority: number
  requiresEntitlement?: string
}

export interface CameoTriggerContext {
  now: Date
  schedule: {
    cameoFrequency: 'daily' | 'weekly' | 'event_threshold' | 'off'
    lastFocusMinutes?: number
    completedTaskCount?: number
    consecutiveFocusDays?: number
    userBirthday?: string
    userAnniversary?: string
  }
  memoryEvents?: {
    recentMoodLow: boolean
    recentTaskCompleted: boolean
    recentFocusCompleted: boolean
  }
}

export interface CameoTriggerResult {
  triggered: boolean
  persona: PersonaDefinition | null
  triggerType: CameoTriggerType | null
  triggerDetail: string
}

export interface CameoTriggerEngine {
  evaluate(context: CameoTriggerContext, personas: PersonaDefinition[]): CameoTriggerResult
  getActiveRules(): CameoTriggerRule[]
  addRule(rule: CameoTriggerRule): void
  removeRule(type: CameoTriggerType): void
}

const HOLIDAY_DATES: { month: number; date: number; personaId: string; name: string }[] = [
  { month: 1, date: 1, personaId: 'caring_sister', name: '新年' },
  { month: 2, date: 14, personaId: 'playful_girlfriend', name: '情人节' },
  { month: 5, date: 1, personaId: 'strict_teacher', name: '劳动节' },
  { month: 6, date: 1, personaId: 'playful_girlfriend', name: '儿童节' },
  { month: 9, date: 10, personaId: 'strict_teacher', name: '教师节' },
  { month: 10, date: 1, personaId: 'caring_sister', name: '国庆节' },
  { month: 12, date: 25, personaId: 'playful_girlfriend', name: '圣诞节' },
]

const EXAM_SEASONS: { month: number; startDate: number; endDate: number; personaId: string; name: string }[] = [
  { month: 1, startDate: 5, endDate: 15, personaId: 'strict_teacher', name: '期末考试' },
  { month: 6, startDate: 20, endDate: 30, personaId: 'strict_teacher', name: '期末考试' },
  { month: 12, startDate: 20, endDate: 30, personaId: 'strict_teacher', name: '期末考试' },
]

function isHolidayMatch(now: Date): { personaId: string; name: string } | null {
  const month = now.getMonth() + 1
  const date = now.getDate()

  for (const holiday of HOLIDAY_DATES) {
    if (month === holiday.month && date === holiday.date) {
      return { personaId: holiday.personaId, name: holiday.name }
    }
  }
  return null
}

function isExamSeasonMatch(now: Date): { personaId: string; name: string } | null {
  const month = now.getMonth() + 1
  const date = now.getDate()

  for (const exam of EXAM_SEASONS) {
    if (month === exam.month && date >= exam.startDate && date <= exam.endDate) {
      return { personaId: exam.personaId, name: exam.name }
    }
  }
  return null
}

function isBirthdayMatch(now: Date, birthday?: string): boolean {
  if (!birthday) return false
  const birth = new Date(birthday)
  return now.getMonth() === birth.getMonth() && now.getDate() === birth.getDate()
}

function isAnniversaryMatch(now: Date, anniversary?: string): boolean {
  if (!anniversary) return false
  const anni = new Date(anniversary)
  return now.getMonth() === anni.getMonth() && now.getDate() === anni.getDate()
}

function isDailyEveningMatch(now: Date, frequency: string): boolean {
  return frequency === 'daily' && now.getHours() >= 20
}

function isWeekendMatch(now: Date, frequency: string): boolean {
  return frequency === 'weekly' && now.getDay() === 0
}

function isFocusStreakMatch(context: CameoTriggerContext): boolean {
  const { schedule } = context
  if (schedule.cameoFrequency !== 'event_threshold') return false

  const focusMinutes = schedule.lastFocusMinutes || 0
  return focusMinutes >= 120
}

function isTaskMilestoneMatch(context: CameoTriggerContext): boolean {
  const { schedule } = context
  if (schedule.cameoFrequency !== 'event_threshold') return false

  const taskCount = schedule.completedTaskCount || 0
  return taskCount >= 10 && taskCount % 10 === 0
}

function isMoodLowMatch(context: CameoTriggerContext): boolean {
  const { memoryEvents } = context
  return memoryEvents?.recentMoodLow === true
}

const DEFAULT_RULES: CameoTriggerRule[] = [
  {
    type: 'holiday',
    personaId: 'caring_sister',
    condition: (ctx) => isHolidayMatch(ctx.now) !== null,
    priority: 100,
    requiresEntitlement: 'agent',
  },
  {
    type: 'exam_season',
    personaId: 'strict_teacher',
    condition: (ctx) => isExamSeasonMatch(ctx.now) !== null,
    priority: 95,
    requiresEntitlement: 'agent',
  },
  {
    type: 'birthday',
    personaId: 'caring_sister',
    condition: (ctx) => isBirthdayMatch(ctx.now, ctx.schedule.userBirthday),
    priority: 90,
    requiresEntitlement: 'agent',
  },
  {
    type: 'anniversary',
    personaId: 'playful_girlfriend',
    condition: (ctx) => isAnniversaryMatch(ctx.now, ctx.schedule.userAnniversary),
    priority: 85,
    requiresEntitlement: 'agent',
  },
  {
    type: 'daily_evening',
    personaId: 'playful_girlfriend',
    condition: (ctx) => isDailyEveningMatch(ctx.now, ctx.schedule.cameoFrequency),
    priority: 50,
  },
  {
    type: 'weekend',
    personaId: 'playful_girlfriend',
    condition: (ctx) => isWeekendMatch(ctx.now, ctx.schedule.cameoFrequency),
    priority: 45,
  },
  {
    type: 'focus_streak',
    personaId: 'strict_teacher',
    condition: (ctx) => isFocusStreakMatch(ctx),
    priority: 70,
    requiresEntitlement: 'agent',
  },
  {
    type: 'task_milestone',
    personaId: 'playful_girlfriend',
    condition: (ctx) => isTaskMilestoneMatch(ctx),
    priority: 65,
    requiresEntitlement: 'agent',
  },
  {
    type: 'mood_low',
    personaId: 'caring_sister',
    condition: (ctx) => isMoodLowMatch(ctx),
    priority: 80,
    requiresEntitlement: 'agent',
  },
]

export function createCameoTriggerEngine(
  initialRules?: CameoTriggerRule[]
): CameoTriggerEngine {
  const rules: CameoTriggerRule[] = initialRules ? [...initialRules] : [...DEFAULT_RULES]

  rules.sort((a, b) => b.priority - a.priority)

  return {
    evaluate(context: CameoTriggerContext, personas: PersonaDefinition[]): CameoTriggerResult {
      if (context.schedule.cameoFrequency === 'off') {
        return { triggered: false, persona: null, triggerType: null, triggerDetail: '' }
      }

      for (const rule of rules) {
        if (!rule.condition(context)) continue

        const persona = personas.find(p => p.id === rule.personaId)
        if (!persona) continue

        let triggerDetail = `cameo_${rule.type}`

        if (rule.type === 'holiday') {
          const match = isHolidayMatch(context.now)
          if (match) triggerDetail = `${match.name}客串`
        } else if (rule.type === 'exam_season') {
          const match = isExamSeasonMatch(context.now)
          if (match) triggerDetail = `${match.name}客串`
        } else if (rule.type === 'birthday') {
          triggerDetail = '生日客串'
        } else if (rule.type === 'anniversary') {
          triggerDetail = '纪念日客串'
        } else if (rule.type === 'focus_streak') {
          triggerDetail = `专注${context.schedule.lastFocusMinutes || 0}分钟客串`
        } else if (rule.type === 'task_milestone') {
          triggerDetail = `完成${context.schedule.completedTaskCount || 0}个任务客串`
        } else if (rule.type === 'mood_low') {
          triggerDetail = '情绪关怀客串'
        }

        return {
          triggered: true,
          persona,
          triggerType: rule.type,
          triggerDetail,
        }
      }

      return { triggered: false, persona: null, triggerType: null, triggerDetail: '' }
    },

    getActiveRules(): CameoTriggerRule[] {
      return [...rules]
    },

    addRule(rule: CameoTriggerRule): void {
      const existingIndex = rules.findIndex(r => r.type === rule.type)
      if (existingIndex >= 0) {
        rules[existingIndex] = rule
      } else {
        rules.push(rule)
      }
      rules.sort((a, b) => b.priority - a.priority)
    },

    removeRule(type: CameoTriggerType): void {
      const index = rules.findIndex(r => r.type === type)
      if (index >= 0) {
        rules.splice(index, 1)
      }
    },
  }
}

const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000

function hasRecentEvent(
  store: MemoryStore,
  scope: { userId: string; projectId: string },
  category: string,
  windowMs: number = RECENT_WINDOW_MS
): boolean {
  const now = Date.now()
  const events = store.listEvents(scope)
  return events.some(
    (e) =>
      e.category === category &&
      e.status === 'active' &&
      now - new Date(e.createdAt).getTime() < windowMs
  )
}

export function buildTriggerContextFromMemoryObserver(
  observer: MemoryObserver | null,
  baseContext: CameoTriggerContext,
  memoryStore?: MemoryStore | null,
  scope?: { userId: string; projectId: string }
): CameoTriggerContext {
  if (!memoryStore || !scope) {
    return {
      ...baseContext,
      memoryEvents: {
        recentMoodLow: false,
        recentTaskCompleted: false,
        recentFocusCompleted: false,
      },
    }
  }

  return {
    ...baseContext,
    memoryEvents: {
      recentMoodLow: hasRecentEvent(memoryStore, scope, 'mood_low'),
      recentTaskCompleted: hasRecentEvent(memoryStore, scope, 'task_completed'),
      recentFocusCompleted: hasRecentEvent(memoryStore, scope, 'focus_completed'),
    },
  }
}

export { HOLIDAY_DATES, EXAM_SEASONS, DEFAULT_RULES }
