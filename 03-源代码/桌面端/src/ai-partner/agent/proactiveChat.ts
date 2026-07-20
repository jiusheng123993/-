/** 主动对话触发条件类型 */
export type ProactiveTrigger =
  | 'morning_greeting'
  | 'evening_checkin'
  | 'focus_break_reminder'
  | 'emotion_care'
  | 'idle_too_long'
  | 'achievement_celebration'

/** 主动对话消息 */
export interface ProactiveMessage {
  id: string
  personaId: string
  content: string
  trigger: ProactiveTrigger
  timestamp: string
  read: boolean
}

/** 主动对话检查上下文 */
export interface ProactiveCheckContext {
  hour: number
  focusMinutes: number
  userEmotion: 'happy' | 'sad' | 'anxious' | 'neutral'
  idleMinutes: number
  hasAchievement: boolean
}

/** 主动对话引擎接口 */
export interface ProactiveChatEngine {
  checkTriggers(context: ProactiveCheckContext): ProactiveMessage[]
  markAsRead(messageId: string): void
  getUnreadMessages(): ProactiveMessage[]
  getAllMessages(): ProactiveMessage[]
  clearMessages(): void
}

const STORAGE_KEY = 'proactive_chat_messages'
const COOLDOWN_KEY = 'proactive_chat_cooldown'

/** 同一触发类型冷却时间（毫秒），默认2小时 */
const DEFAULT_TRIGGER_COOLDOWN_MS = 2 * 60 * 60 * 1000

/** 触发规则定义 */
interface TriggerRule {
  trigger: ProactiveTrigger
  condition: (ctx: ProactiveCheckContext) => boolean
  personaId: string
  contentGenerator: (ctx: ProactiveCheckContext) => string
}

/** 内置触发规则 */
const TRIGGER_RULES: TriggerRule[] = [
  {
    trigger: 'morning_greeting',
    condition: (ctx) => ctx.hour >= 8 && ctx.hour < 9,
    personaId: 'strict_teacher',
    contentGenerator: () => '早上好！新的一天开始了，今天也要加油哦！有什么学习计划吗？'
  },
  {
    trigger: 'evening_checkin',
    condition: (ctx) => ctx.hour >= 21 && ctx.hour < 22,
    personaId: 'playful_girlfriend',
    contentGenerator: () => '晚上好呀～今天辛苦啦！有没有什么想跟我聊聊的？'
  },
  {
    trigger: 'focus_break_reminder',
    condition: (ctx) => ctx.focusMinutes >= 45,
    personaId: 'caring_sister',
    contentGenerator: (ctx) => `你已经专注了${ctx.focusMinutes}分钟了，该休息一下啦～起来活动活动，喝杯水吧。`
  },
  {
    trigger: 'emotion_care',
    condition: (ctx) => ctx.userEmotion === 'sad' || ctx.userEmotion === 'anxious',
    personaId: 'caring_sister',
    contentGenerator: () => '我感觉到你好像不太开心，想聊聊吗？我一直在这里陪着你。'
  },
  {
    trigger: 'idle_too_long',
    condition: (ctx) => ctx.idleMinutes >= 120,
    personaId: 'playful_girlfriend',
    contentGenerator: () => '好久没见到你啦～在忙什么呢？要不要休息一下聊聊天？'
  },
  {
    trigger: 'achievement_celebration',
    condition: (ctx) => ctx.hasAchievement,
    personaId: 'playful_girlfriend',
    contentGenerator: () => '太棒啦！恭喜你完成了目标！🎉 你真的很厉害，继续加油！'
  }
]

/** 从 localStorage 加载消息 */
function loadMessages(): ProactiveMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

/** 保存消息到 localStorage */
function saveMessages(messages: ProactiveMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {
    // localStorage full or unavailable
  }
}

/** 从 localStorage 加载冷却记录 */
function loadCooldowns(): Record<string, number> {
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/** 保存冷却记录到 localStorage */
function saveCooldowns(cooldowns: Record<string, number>): void {
  try {
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(cooldowns))
  } catch {
    // localStorage full or unavailable
  }
}

/** 检查触发类型是否在冷却中 */
function isInCooldown(trigger: ProactiveTrigger, cooldowns: Record<string, number>, cooldownMs: number): boolean {
  const lastTriggerAt = cooldowns[trigger]
  if (!lastTriggerAt) return false
  return (Date.now() - lastTriggerAt) < cooldownMs
}

/** 创建主动对话引擎 */
export function createProactiveChatEngine(
  cooldownMs: number = DEFAULT_TRIGGER_COOLDOWN_MS
): ProactiveChatEngine {
  return {
    checkTriggers(context: ProactiveCheckContext): ProactiveMessage[] {
      const cooldowns = loadCooldowns()
      const newMessages: ProactiveMessage[] = []

      for (const rule of TRIGGER_RULES) {
        // 检查冷却
        if (isInCooldown(rule.trigger, cooldowns, cooldownMs)) {
          continue
        }

        // 检查条件
        if (!rule.condition(context)) {
          continue
        }

        const message: ProactiveMessage = {
          id: `proactive-${rule.trigger}-${Date.now()}`,
          personaId: rule.personaId,
          content: rule.contentGenerator(context),
          trigger: rule.trigger,
          timestamp: new Date().toISOString(),
          read: false
        }

        newMessages.push(message)

        // 更新冷却记录
        cooldowns[rule.trigger] = Date.now()
      }

      if (newMessages.length > 0) {
        // 追加到已有消息
        const existing = loadMessages()
        const all = [...existing, ...newMessages]
        saveMessages(all)
        saveCooldowns(cooldowns)
      }

      return newMessages
    },

    markAsRead(messageId: string): void {
      const messages = loadMessages()
      const updated = messages.map(m =>
        m.id === messageId ? { ...m, read: true } : m
      )
      saveMessages(updated)
    },

    getUnreadMessages(): ProactiveMessage[] {
      return loadMessages().filter(m => !m.read)
    },

    getAllMessages(): ProactiveMessage[] {
      return loadMessages()
    },

    clearMessages(): void {
      saveMessages([])
      saveCooldowns({})
    }
  }
}
