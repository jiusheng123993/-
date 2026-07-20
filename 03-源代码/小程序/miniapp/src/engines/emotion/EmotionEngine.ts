import {
  EMOTION_SCENES,
  type EmotionScene,
  type EmotionTrigger,
  type EmotionResponse
} from '../../data/petKnowledge/emotionScenes'
import { getStorage, setStorage } from '../../utils/storage'

export type { EmotionScene, EmotionTrigger, EmotionResponse }

export interface EmotionEngineContext {
  petName: string
  petId: string
  species: 'dog' | 'cat'
  isDeceased: boolean
  deceasedDate?: string
  consecutiveAnomalyDays: number
  streakDays: number
  isNewUser: boolean
  recentFoodQueryCount: number
  recentSymptomCheckCount: number
  daysSinceLoss?: number
  isBirthday?: boolean
  isHoliday?: boolean
  isRecovery?: boolean
}

export interface EmotionMatchResult {
  scene: EmotionScene
  response: EmotionResponse
  priority: number
  reason: string
}

interface EmotionCooldownEntry {
  sceneId: string
  triggeredAt: number
}

const COOLDOWN_KEY = 'emotion_cooldown'
const COOLDOWN_MS: Record<string, number> = {
  grief: 24 * 60 * 60 * 1000,
  anxiety: 12 * 60 * 60 * 1000,
  celebration: 6 * 60 * 60 * 1000,
  daily_care: 4 * 60 * 60 * 1000,
  health_concern: 8 * 60 * 60 * 1000
}

const CATEGORY_PRIORITY: Record<string, number> = {
  grief: 100,
  health_concern: 80,
  anxiety: 60,
  celebration: 40,
  daily_care: 20
}

function getCooldowns(): EmotionCooldownEntry[] {
  return getStorage<EmotionCooldownEntry[]>(COOLDOWN_KEY) || []
}

function saveCooldowns(cooldowns: EmotionCooldownEntry[]): void {
  setStorage(COOLDOWN_KEY, cooldowns)
}

function isOnCooldown(sceneId: string, category: string): boolean {
  const cooldowns = getCooldowns()
  const entry = cooldowns.find((c) => c.sceneId === sceneId)
  if (!entry) return false
  const cooldownMs = COOLDOWN_MS[category] || 6 * 60 * 60 * 1000
  return Date.now() - entry.triggeredAt < cooldownMs
}

function markTriggered(sceneId: string): void {
  const cooldowns = getCooldowns()
  const existing = cooldowns.findIndex((c) => c.sceneId === sceneId)
  if (existing !== -1) {
    cooldowns[existing].triggeredAt = Date.now()
  } else {
    cooldowns.push({ sceneId, triggeredAt: Date.now() })
  }
  if (cooldowns.length > 50) {
    cooldowns.splice(0, cooldowns.length - 50)
  }
  saveCooldowns(cooldowns)
}

function calculateDaysSinceLoss(deceasedDate: string): number {
  const loss = new Date(deceasedDate)
  const now = new Date()
  return Math.floor((now.getTime() - loss.getTime()) / (24 * 60 * 60 * 1000))
}

function evaluateTrigger(
  trigger: EmotionTrigger,
  ctx: EmotionEngineContext
): boolean {
  switch (trigger.type) {
    case 'time_after_loss': {
      if (!ctx.isDeceased || ctx.daysSinceLoss === undefined) return false
      const min = trigger.params.daysAfterLoss as number
      const max = trigger.params.daysAfterLossMax as number | undefined
      if (max !== undefined) {
        return ctx.daysSinceLoss >= min && ctx.daysSinceLoss <= max
      }
      const tolerance = 2
      return Math.abs(ctx.daysSinceLoss - min) <= tolerance
    }
    case 'anniversary': {
      const eventType = trigger.params.eventType as string
      if (eventType === 'pet_birthday') return !!ctx.isBirthday
      if (eventType === 'holiday_or_birthday') return !!ctx.isHoliday || !!ctx.isBirthday
      return false
    }
    case 'health_event': {
      const subtype = trigger.params.eventSubtype as string
      if (subtype === 'illness') return ctx.consecutiveAnomalyDays >= 3
      if (subtype === 'recovery') return !!ctx.isRecovery
      return false
    }
    case 'checkin_streak': {
      const targetStreak = trigger.params.streakDays as number
      return ctx.streakDays >= targetStreak
    }
    case 'user_input': {
      return false
    }
    default:
      return false
  }
}

export function matchEmotionScenes(
  ctx: EmotionEngineContext
): EmotionMatchResult[] {
  const results: EmotionMatchResult[] = []

  if (ctx.isDeceased && ctx.daysSinceLoss === undefined && ctx.deceasedDate) {
    ctx = {
      ...ctx,
      daysSinceLoss: calculateDaysSinceLoss(ctx.deceasedDate)
    }
  }

  for (const scene of EMOTION_SCENES) {
    if (isOnCooldown(scene.id, scene.category)) continue

    const anyTriggerMatched = scene.triggerConditions.some((trigger) =>
      evaluateTrigger(trigger, ctx)
    )

    if (!anyTriggerMatched) continue

    const responseIndex = Math.floor(Math.random() * scene.responses.length)
    const response = scene.responses[responseIndex]

    const priority = CATEGORY_PRIORITY[scene.category] || 0

    let reason = ''
    if (scene.category === 'grief') {
      reason = `宠物离世${ctx.daysSinceLoss}天`
    } else if (scene.id === 'anxiety_pet_sick') {
      reason = `连续${ctx.consecutiveAnomalyDays}天异常打卡`
    } else if (scene.id === 'anxiety_new_pet') {
      reason = '新手养宠焦虑'
    } else if (scene.id === 'celebration_checkin_7') {
      reason = `连续打卡${ctx.streakDays}天`
    } else if (scene.id === 'celebration_recovery') {
      reason = '宠物康复'
    } else if (scene.id === 'celebration_birthday') {
      reason = '宠物生日'
    } else {
      reason = scene.name
    }

    results.push({ scene, response, priority, reason })
  }

  results.sort((a, b) => b.priority - a.priority)

  return results
}

export function getTopEmotionMatch(
  ctx: EmotionEngineContext
): EmotionMatchResult | null {
  const matches = matchEmotionScenes(ctx)
  if (matches.length === 0) return null
  const top = matches[0]
  markTriggered(top.scene.id)
  return top
}

export function matchByKeywords(
  input: string,
  ctx: EmotionEngineContext
): EmotionMatchResult | null {
  for (const scene of EMOTION_SCENES) {
    if (isOnCooldown(scene.id, scene.category)) continue
    const matched = scene.triggerKeywords.some((keyword) =>
      input.includes(keyword)
    )
    if (!matched) continue

    const responseIndex = Math.floor(Math.random() * scene.responses.length)
    const response = scene.responses[responseIndex]
    markTriggered(scene.id)
    return {
      scene,
      response,
      priority: CATEGORY_PRIORITY[scene.category] || 0,
      reason: `关键词匹配: ${scene.name}`
    }
  }
  return null
}

export function formatResponseContent(
  content: string,
  petName: string
): string {
  return content.replace(/\{petName\}/g, petName)
}

export function formatSuggestions(
  suggestions: string[],
  petName: string
): string[] {
  return suggestions.map((s) => s.replace(/\{petName\}/g, petName))
}

export function buildEmotionContext(
  petId: string,
  petName: string,
  species: 'dog' | 'cat',
  options: Partial<EmotionEngineContext> = {}
): EmotionEngineContext {
  return {
    petName,
    petId,
    species,
    isDeceased: false,
    consecutiveAnomalyDays: 0,
    streakDays: 0,
    isNewUser: false,
    recentFoodQueryCount: 0,
    recentSymptomCheckCount: 0,
    ...options
  }
}

export function detectNewUserAnxiety(
  ctx: EmotionEngineContext
): boolean {
  return (
    ctx.isNewUser &&
    (ctx.recentFoodQueryCount >= 3 || ctx.recentSymptomCheckCount >= 2)
  )
}

export function detectIllnessAnxiety(
  ctx: EmotionEngineContext
): boolean {
  return ctx.consecutiveAnomalyDays >= 3
}
