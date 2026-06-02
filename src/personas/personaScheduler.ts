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

      return null
    }
  }
}
