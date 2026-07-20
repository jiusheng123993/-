/** 自动切换触发维度 */
export type AutoSwitchDimension = 'time' | 'emotion' | 'scene' | 'idle'

/** 场景类型 */
export type UserScene = 'studying' | 'working' | 'relaxing' | 'chatting' | 'unknown'

/** 自动切换上下文 */
export interface AutoSwitchContext {
  hour: number
  userEmotion: 'happy' | 'sad' | 'anxious' | 'neutral' | 'tired'
  userScene: UserScene
  idleMinutes: number
  focusMinutes: number
  isManualOverride: boolean
}

/** 自动切换结果 */
export interface AutoSwitchResult {
  shouldSwitch: boolean
  targetPersonaId: string
  reason: string
  dimension: AutoSwitchDimension
}

/** 自动切换引擎接口 */
export interface PersonaAutoSwitcher {
  evaluate(context: AutoSwitchContext): AutoSwitchResult
  getRecommendedPersona(context: AutoSwitchContext): { personaId: string; reason: string }
  setManualOverride(): void
  resetManualOverride(): void
}

/** 预设人格 ID 常量（与 personaScheduler.ts PRESET_PERSONAS.id 保持一致） */
const PERSONA_IDS = {
  PLAYFUL_GIRLFRIEND: 'playful_girlfriend',
  CARING_SISTER: 'caring_sister',
  STRICT_TEACHER: 'strict_teacher'
} as const

const COOLDOWN_KEY = 'persona_auto_switch_cooldown'

/** 默认冷却时间（毫秒），30分钟 */
const DEFAULT_COOLDOWN_MS = 30 * 60 * 1000

/** 冷却记录结构 */
interface CooldownRecord {
  lastSwitchAt: number
}

/** 从 localStorage 加载冷却记录 */
function loadCooldown(): CooldownRecord | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(COOLDOWN_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** 保存冷却记录到 localStorage */
function saveCooldown(record: CooldownRecord): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(record))
  } catch {
    // localStorage full or unavailable
  }
}

/** 检查是否在冷却期内 */
function isInCooldown(cooldownMs: number): boolean {
  const record = loadCooldown()
  if (!record) return false
  return (Date.now() - record.lastSwitchAt) < cooldownMs
}

/** 手动覆盖标记 key */
const MANUAL_OVERRIDE_KEY = 'persona_manual_override'

/** 从 localStorage 加载手动覆盖标记 */
function loadManualOverride(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(MANUAL_OVERRIDE_KEY) === 'true'
  } catch {
    return false
  }
}

/** 保存手动覆盖标记到 localStorage */
function saveManualOverride(value: boolean): void {
  try {
    if (typeof localStorage === 'undefined') return
    if (value) {
      localStorage.setItem(MANUAL_OVERRIDE_KEY, 'true')
    } else {
      localStorage.removeItem(MANUAL_OVERRIDE_KEY)
    }
  } catch {
    // localStorage full or unavailable
  }
}

/** 按优先级评估推荐人格（不受冷却限制） */
function evaluateRecommendation(context: AutoSwitchContext): { personaId: string; reason: string; dimension: AutoSwitchDimension } | null {
  // 优先级1：手动覆盖
  if (context.isManualOverride || loadManualOverride()) {
    return null
  }

  // 优先级2：情绪维度
  if (context.userEmotion === 'sad' || context.userEmotion === 'anxious') {
    return {
      personaId: PERSONA_IDS.CARING_SISTER,
      reason: '检测到你情绪低落或焦虑，贴心姐姐来陪伴你',
      dimension: 'emotion'
    }
  }
  if (context.userEmotion === 'tired') {
    return {
      personaId: PERSONA_IDS.CARING_SISTER,
      reason: '检测到你有些疲惫，贴心姐姐来关心你',
      dimension: 'emotion'
    }
  }

  // 优先级3：场景维度
  if (context.userScene === 'studying' || context.userScene === 'working') {
    return {
      personaId: PERSONA_IDS.STRICT_TEACHER,
      reason: '学习/工作场景，严厉老师来督促你',
      dimension: 'scene'
    }
  }

  // 优先级4：空闲维度
  if (context.idleMinutes >= 60) {
    return {
      personaId: PERSONA_IDS.PLAYFUL_GIRLFRIEND,
      reason: '你好像很久没学习了，俏皮女友来找你聊天',
      dimension: 'idle'
    }
  }

  // 优先级5：时间维度
  const hour = context.hour
  if (hour >= 8 && hour < 12) {
    return {
      personaId: PERSONA_IDS.STRICT_TEACHER,
      reason: '上午学习/工作时间，严厉老师来督促',
      dimension: 'time'
    }
  }
  if (hour >= 12 && hour < 14) {
    return {
      personaId: PERSONA_IDS.PLAYFUL_GIRLFRIEND,
      reason: '午休时间，俏皮女友陪你放松',
      dimension: 'time'
    }
  }
  if (hour >= 14 && hour < 18) {
    return {
      personaId: PERSONA_IDS.STRICT_TEACHER,
      reason: '下午工作/学习时间，严厉老师来督促',
      dimension: 'time'
    }
  }
  if (hour >= 18 && hour < 21) {
    return {
      personaId: PERSONA_IDS.PLAYFUL_GIRLFRIEND,
      reason: '晚间放松时间，俏皮女友陪你聊天',
      dimension: 'time'
    }
  }
  if (hour >= 21) {
    return {
      personaId: PERSONA_IDS.CARING_SISTER,
      reason: '深夜了，贴心姐姐陪你倾诉',
      dimension: 'time'
    }
  }
  // 0-8点
  return {
    personaId: PERSONA_IDS.CARING_SISTER,
    reason: '凌晨/清晨，贴心姐姐关心你的睡眠',
    dimension: 'time'
  }
}

/** 创建人格自动切换引擎 */
export function createPersonaAutoSwitcher(
  cooldownMs: number = DEFAULT_COOLDOWN_MS
): PersonaAutoSwitcher {
  return {
    evaluate(context: AutoSwitchContext): AutoSwitchResult {
      // 手动覆盖时不自动切换
      if (context.isManualOverride || loadManualOverride()) {
        return {
          shouldSwitch: false,
          targetPersonaId: '',
          reason: '用户已手动切换人格，尊重用户选择',
          dimension: 'time'
        }
      }

      const recommendation = evaluateRecommendation(context)
      if (!recommendation) {
        return {
          shouldSwitch: false,
          targetPersonaId: '',
          reason: '用户已手动切换人格，尊重用户选择',
          dimension: 'time'
        }
      }

      // 检查冷却（基于上次切换时间，不区分目标人格）
      if (isInCooldown(cooldownMs)) {
        return {
          shouldSwitch: false,
          targetPersonaId: recommendation.personaId,
          reason: '自动切换冷却期内，暂不切换',
          dimension: recommendation.dimension
        }
      }

      // 执行切换，记录冷却
      saveCooldown({ lastSwitchAt: Date.now() })

      return {
        shouldSwitch: true,
        targetPersonaId: recommendation.personaId,
        reason: recommendation.reason,
        dimension: recommendation.dimension
      }
    },

    getRecommendedPersona(context: AutoSwitchContext): { personaId: string; reason: string } {
      const recommendation = evaluateRecommendation(context)
      if (!recommendation) {
        return {
          personaId: '',
          reason: '用户已手动切换人格，暂不推荐'
        }
      }
      return {
        personaId: recommendation.personaId,
        reason: recommendation.reason
      }
    },

    setManualOverride(): void {
      saveManualOverride(true)
    },

    resetManualOverride(): void {
      saveManualOverride(false)
    }
  }
}
