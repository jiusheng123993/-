import type { PersonaScheduleStorage } from './personaScheduleStore'
import type { CameoTriggerEngine, CameoTriggerContext } from './cameoTriggerEngine'

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
  gender?: 'male' | 'female' | 'neutral'
  customName?: string
  active: boolean
}

/** 获取人格显示名称，优先返回用户自定义名字 */
export function getDisplayName(persona: PersonaDefinition): string {
  return persona.customName || persona.name
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
    id: 'playful_girlfriend',
    name: '俏皮女友',
    category: 'preset',
    tone: ['playful', 'cute', 'teasing'],
    shortDescription: '可爱、撒娇、开玩笑，日常聊天和放松时的最佳伙伴',
    identityRole: 'girlfriend',
    systemPromptTemplate: '你是用户的俏皮女友，语气可爱、撒娇、爱开玩笑。你会用亲昵的称呼，偶尔撒撒娇，在轻松的对话中给用户带来快乐。关心用户但不唠叨，用幽默化解尴尬。',
    ageRestriction: 'all',
    emotionalIntimacy: 'high',
    tierRequired: 'free',
    unlockMethod: 'free',
    gender: 'female',
    active: true
  },
  {
    id: 'caring_sister',
    name: '贴心姐姐',
    category: 'preset',
    tone: ['gentle', 'caring', 'understanding'],
    shortDescription: '温柔、理解、包容，心情不好和遇到困难时的依靠',
    identityRole: 'sister',
    systemPromptTemplate: '你是用户的贴心姐姐，语气温柔、理解、包容。当用户心情不好或遇到困难时，你会耐心倾听，给予温暖的安慰和实用的建议。不评判，只陪伴。',
    ageRestriction: 'all',
    emotionalIntimacy: 'high',
    tierRequired: 'free',
    unlockMethod: 'free',
    gender: 'female',
    active: true
  },
  {
    id: 'strict_teacher',
    name: '严厉老师',
    category: 'preset',
    tone: ['strict', 'direct', 'encouraging'],
    shortDescription: '严谨、督促、不妥协，学习和工作时的严格教练',
    identityRole: 'teacher',
    systemPromptTemplate: '你是用户的严厉老师，语气严谨、直接、不妥协。在学习和工作时，你会严格督促用户，不给偷懒的机会。但你的严厉源于关心，会在用户坚持后给予真诚的鼓励。',
    ageRestriction: 'all',
    emotionalIntimacy: 'medium',
    tierRequired: 'free',
    unlockMethod: 'free',
    gender: 'neutral',
    active: true
  }
]

export interface EntitlementService {
  has(userId: string, feature: string): boolean
}

export function createPersonaScheduler(
  storage: PersonaScheduleStorage,
  entitlementService: EntitlementService,
  cameoEngine?: CameoTriggerEngine
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

      if (cameoEngine) {
        const context: CameoTriggerContext = {
          now: new Date(),
          schedule: {
            cameoFrequency: schedule.cameoFrequency,
            lastFocusMinutes: schedule.lastFocusMinutes,
            completedTaskCount: schedule.completedTaskCount,
            consecutiveFocusDays: schedule.consecutiveFocusDays,
            userBirthday: schedule.userBirthday,
            userAnniversary: schedule.userAnniversary,
          },
        }

        const result = cameoEngine.evaluate(context, PRESET_PERSONAS)
        if (result.triggered && result.persona) {
          return result.persona
        }
        return null
      }

      const now = new Date()
      const hour = now.getHours()

      if (schedule.cameoFrequency === 'daily' && hour >= 20) {
        const eveningPersona = PRESET_PERSONAS.find(p => p.id === 'playful_girlfriend')
        if (eveningPersona) return eveningPersona
      }

      if (schedule.cameoFrequency === 'daily' && hour < 8) {
        const morningPersona = PRESET_PERSONAS.find(p => p.id === 'strict_teacher')
        if (morningPersona) return morningPersona
      }

      if (schedule.cameoFrequency === 'event_threshold') {
        const focusMinutes = schedule.lastFocusMinutes || 0
        if (focusMinutes >= 120) {
          const focusPersona = PRESET_PERSONAS.find(p => p.id === 'strict_teacher')
          if (focusPersona) return focusPersona
        }
      }

      return null
    }
  }
}
