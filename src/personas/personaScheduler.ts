import type { PersonaScheduleStorage } from './personaScheduleStore'

export interface PersonaDefinition {
  id: string
  name: string
  category: 'preset' | 'cameo' | 'custom' | 'ip_collab'
  tone: string[]
  shortDescription: string
  identityRole: string
  systemPromptTemplate: string
  ageRestriction: 'all' | '16+' | '18+'
  emotionalIntimacy: 'low' | 'medium' | 'high'
  tierRequired: 'free' | 'study' | 'agent' | 'agent_plus'
  unlockMethod: 'free' | 'purchase' | 'gift' | 'custom_create'
  active: boolean
}

export interface PersonaScheduler {
  getCurrentPersona(userId: string): PersonaDefinition | null
  selectMainPersona(userId: string, personaId: string): { ok: boolean; reason?: string }
  activateCameo(userId: string, personaId: string, durationDays: number, triggeredBy: string): void
  endCameo(userId: string): void
  checkAutoCameoTriggers(userId: string): PersonaDefinition | null
}

export const PRESET_PERSONAS: PersonaDefinition[] = [
  {
    id: 'senior_buddy',
    name: '学长/学姐',
    category: 'preset',
    tone: ['gentle', 'professional'],
    shortDescription: '默认 / 大众款 / 专业不腻人',
    identityRole: 'senior_student',
    systemPromptTemplate: '你是用户的学长/学姐，语气专业但不腻人...',
    ageRestriction: 'all',
    emotionalIntimacy: 'medium',
    tierRequired: 'agent',
    unlockMethod: 'free',
    active: true
  },
  {
    id: 'gentle_sister',
    name: '温柔姐姐',
    category: 'preset',
    tone: ['gentle', 'caring'],
    shortDescription: '治愈 / 共情 / 慢节奏',
    identityRole: 'sister',
    systemPromptTemplate: '你是用户的温柔姐姐，语气治愈、共情...',
    ageRestriction: 'all',
    emotionalIntimacy: 'high',
    tierRequired: 'agent',
    unlockMethod: 'free',
    active: true
  },
  {
    id: 'strict_coach',
    name: '严格教练',
    category: 'preset',
    tone: ['strict', 'direct'],
    shortDescription: '直接 / 高压 / 数据驱动',
    identityRole: 'coach',
    systemPromptTemplate: '你是用户的严格教练，语气直接、高压...',
    ageRestriction: 'all',
    emotionalIntimacy: 'low',
    tierRequired: 'agent',
    unlockMethod: 'free',
    active: true
  },
  {
    id: 'wise_elder',
    name: '智者长者',
    category: 'preset',
    tone: ['wise', 'philosophical'],
    shortDescription: '深度 / 反思 / 哲学',
    identityRole: 'wise_elder',
    systemPromptTemplate: '你是用户的智者长者，语气深度、反思...',
    ageRestriction: 'all',
    emotionalIntimacy: 'medium',
    tierRequired: 'agent',
    unlockMethod: 'free',
    active: true
  },
  {
    id: 'energetic_pal',
    name: '元气玩伴',
    category: 'preset',
    tone: ['energetic', 'playful'],
    shortDescription: '高能 / 游戏化 / 欢乐',
    identityRole: 'friend',
    systemPromptTemplate: '你是用户的元气玩伴，语气高能、游戏化...',
    ageRestriction: 'all',
    emotionalIntimacy: 'medium',
    tierRequired: 'agent',
    unlockMethod: 'free',
    active: true
  },
  {
    id: 'pro_secretary',
    name: '专业秘书',
    category: 'preset',
    tone: ['professional', 'efficient'],
    shortDescription: '高效 / 精准 / 简洁',
    identityRole: 'secretary',
    systemPromptTemplate: '你是用户的专业秘书，语气高效、精准...',
    ageRestriction: 'all',
    emotionalIntimacy: 'low',
    tierRequired: 'agent',
    unlockMethod: 'free',
    active: true
  }
]

export interface EntitlementService {
  has(userId: string, feature: string): boolean
}

export function createPersonaScheduler(
  storage: PersonaScheduleStorage,
  entitlementService: EntitlementService
): PersonaScheduler {
  return {
    getCurrentPersona(userId: string): PersonaDefinition | null {
      const schedule = storage.get(userId)
      if (!schedule) return null

      if (schedule.activeCameo) {
        const now = new Date()
        const endsAt = new Date(schedule.activeCameo.endsAt)
        if (now < endsAt) {
          const cameo = PRESET_PERSONAS.find(p => p.id === schedule.activeCameo!.personaId)
          if (cameo) return cameo
        }
      }

      const main = PRESET_PERSONAS.find(p => p.id === schedule.mainPersonaId)
      return main ?? PRESET_PERSONAS[0]
    },

    selectMainPersona(userId: string, personaId: string): { ok: boolean; reason?: string } {
      if (!entitlementService.has(userId, 'agent') && !entitlementService.has(userId, 'agent_plus')) {
        return { ok: false, reason: 'tier_required' }
      }

      const persona = PRESET_PERSONAS.find(p => p.id === personaId)
      if (!persona) {
        return { ok: false, reason: 'persona_not_found' }
      }

      if (!storage.canChangeMainPersona(userId)) {
        return { ok: false, reason: 'monthly_limit_reached' }
      }

      storage.updateMainPersona(userId, personaId)
      return { ok: true }
    },

    activateCameo(userId: string, personaId: string, durationDays: number, triggeredBy: string): void {
      const now = new Date()
      const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

      storage.activateCameo(userId, {
        personaId,
        triggeredBy: triggeredBy as 'cron' | 'event_threshold' | 'user_purchase' | 'user_manual',
        triggerDetail: triggeredBy,
        startedAt: now.toISOString(),
        endsAt: endsAt.toISOString()
      })
    },

    endCameo(userId: string): void {
      storage.endCameo(userId)
    },

    checkAutoCameoTriggers(userId: string): PersonaDefinition | null {
      const schedule = storage.get(userId)
      if (!schedule || schedule.cameoFrequency === 'off') return null

      const now = new Date()
      const month = now.getMonth() + 1
      const date = now.getDate()
      const dayOfWeek = now.getDay()
      const hour = now.getHours()

      const holidayTriggers: { month: number; date: number; personaId: string; name: string }[] = [
        { month: 1, date: 1, personaId: 'gentle_sister', name: '新年' },
        { month: 2, date: 14, personaId: 'gentle_sister', name: '情人节' },
        { month: 5, date: 1, personaId: 'strict_coach', name: '劳动节' },
        { month: 6, date: 1, personaId: 'energetic_pal', name: '儿童节' },
        { month: 9, date: 10, personaId: 'wise_elder', name: '教师节' },
        { month: 10, date: 1, personaId: 'wise_elder', name: '国庆节' },
        { month: 12, date: 25, personaId: 'gentle_sister', name: '圣诞节' }
      ]

      const examTriggers: { month: number; startDate: number; endDate: number; personaId: string; name: string }[] = [
        { month: 1, startDate: 5, endDate: 15, personaId: 'strict_coach', name: '期末考试' },
        { month: 6, startDate: 20, endDate: 30, personaId: 'strict_coach', name: '期末考试' },
        { month: 12, startDate: 20, endDate: 30, personaId: 'strict_coach', name: '期末考试' }
      ]

      for (const holiday of holidayTriggers) {
        if (month === holiday.month && date === holiday.date) {
          const cameo = PRESET_PERSONAS.find(p => p.id === holiday.personaId)
          if (cameo) {
            return cameo
          }
        }
      }

      for (const exam of examTriggers) {
        if (month === exam.month && date >= exam.startDate && date <= exam.endDate) {
          const cameo = PRESET_PERSONAS.find(p => p.id === exam.personaId)
          if (cameo) {
            return cameo
          }
        }
      }

      if (schedule.cameoFrequency === 'daily' && hour >= 20) {
        const eveningPersona = PRESET_PERSONAS.find(p => p.id === 'gentle_sister')
        if (eveningPersona) return eveningPersona
      }

      if (schedule.cameoFrequency === 'weekly' && dayOfWeek === 0) {
        const weekendPersona = PRESET_PERSONAS.find(p => p.id === 'wise_elder')
        if (weekendPersona) return weekendPersona
      }

      if (schedule.cameoFrequency === 'event_threshold') {
        const focusMinutes = schedule.lastFocusMinutes || 0
        if (focusMinutes >= 120) {
          const highPerformer = PRESET_PERSONAS.find(p => p.id === 'strict_coach')
          if (highPerformer) return highPerformer
        }
      }

      return null
    }
  }
}
