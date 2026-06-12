import type { PersonaDefinition } from './personaScheduler'
import type { AvatarAiGenQuotaProvider } from '../entitlement/avatarAiGenProvider'
import type { IAvatarAIProvider } from '../avatar/avatarAIProvider'
import type { AvatarStyle } from '../avatar/avatarTypes'

export type PersonaAvatarGenResult = {
  success: boolean
  avatarUrl?: string
  thumbnailUrl?: string
  prompt?: string
  error?: string
  remaining?: number
}

export type PersonaAvatarGenConfig = {
  quotaProvider: AvatarAiGenQuotaProvider
  aiProvider: IAvatarAIProvider
  getPersonaById: (id: string) => PersonaDefinition | undefined
}

export interface IPersonaAvatarGen {
  generate(personaId: string, userId: string, style?: AvatarStyle): Promise<PersonaAvatarGenResult>
  getRemaining(userId: string): number
  getTotalUsed(userId: string): number
}

const TONE_STYLE_MAP: Record<string, string> = {
  'gentle': '柔和温暖',
  'sharp': '锐利干练',
  'humorous': '幽默风趣',
  'rational': '理性冷静',
  'energetic': '活力四射',
  'lazy': '慵懒随性',
  'caring': '关怀体贴',
  'direct': '直率坦诚',
  'philosophical': '哲思深邃',
  'playful': '俏皮可爱',
  'professional': '专业严谨'
}

const IDENTITY_STYLE_MAP: Record<string, string> = {
  'senior_student': '高年级学长/学姐',
  'coach': '教练/导师',
  'sister': '温柔姐姐',
  'brother': '可靠哥哥',
  'friend': '知心朋友',
  'study_partner': '学习搭档',
  'secretary': '得力秘书',
  'wise_elder': '智慧长者'
}

function buildAvatarPrompt(persona: PersonaDefinition): string {
  const toneDesc = persona.tone.map(t => TONE_STYLE_MAP[t] || t).join('、')
  const identityDesc = IDENTITY_STYLE_MAP[persona.identityRole] || persona.identityRole

  return [
    `一个${identityDesc}角色的头像`,
    `性格：${toneDesc}`,
    `风格：${persona.shortDescription}`,
    `角色名：${persona.name}`,
    `高质量、精美、适合作为AI陪伴角色的头像`
  ].join('，')
}

export function createPersonaAvatarGen(config: PersonaAvatarGenConfig): IPersonaAvatarGen {
  const { quotaProvider, aiProvider, getPersonaById } = config

  return {
    async generate(personaId, userId, style = 'anime') {
      const persona = getPersonaById(personaId)
      if (!persona) {
        return { success: false, error: `Persona不存在: ${personaId}` }
      }

      const prompt = buildAvatarPrompt(persona)

      const quotaResult = quotaProvider.consume(userId)
      if (!quotaResult.ok) {
        return {
          success: false,
          error: '本月AI头像生成次数已用完，请升级会员获取更多次数',
          remaining: quotaResult.remaining ?? 0
        }
      }

      try {
        const request = await aiProvider.generate(prompt, style, '2d_sticker')

        if (request.status === 'completed' && request.result) {
          return {
            success: true,
            avatarUrl: request.result.stickerUrl || request.result.thumbnailUrl,
            thumbnailUrl: request.result.thumbnailUrl,
            prompt,
            remaining: quotaResult.remaining
          }
        }

        if (request.status === 'failed') {
          return {
            success: false,
            error: request.error || 'AI头像生成失败',
            remaining: quotaResult.remaining
          }
        }

        return {
          success: false,
          error: `生成状态异常: ${request.status}`,
          remaining: quotaResult.remaining
        }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'AI头像生成异常',
          remaining: quotaResult.remaining
        }
      }
    },

    getRemaining(userId) {
      return quotaProvider.getRemaining(userId)
    },

    getTotalUsed(userId) {
      return quotaProvider.getTotalUsed(userId)
    }
  }
}
