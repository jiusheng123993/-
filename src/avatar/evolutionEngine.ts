import type { AvatarDefinition, AvatarEvolutionRule } from './avatarTypes'
import { EVOLUTION_RULES } from './avatarTypes'

export type EvolutionCheckResult = {
  newlyUnlocked: AvatarEvolutionRule[]
  newLevel: number
}

function calculateLevel(avatar: AvatarDefinition): number {
  const { totalFocusMinutes, totalTasksCompleted, streakDays } = avatar.evolution
  const focusLevel = Math.floor(totalFocusMinutes / 120)
  const taskLevel = Math.floor(totalTasksCompleted / 10)
  const streakLevel = Math.floor(streakDays / 7)
  return Math.max(1, focusLevel + taskLevel + streakLevel)
}

function isRuleUnlocked(rule: AvatarEvolutionRule, avatar: AvatarDefinition): boolean {
  const { evolution } = avatar
  switch (rule.trigger.type) {
    case 'focus_minutes':
      return evolution.totalFocusMinutes >= rule.trigger.threshold
    case 'tasks_completed':
      return evolution.totalTasksCompleted >= rule.trigger.threshold
    case 'streak_days':
      return evolution.streakDays >= rule.trigger.threshold
    case 'special_event':
      return checkSpecialEvent(rule.trigger.threshold)
    default:
      return false
  }
}

function isAlreadyClaimed(rule: AvatarEvolutionRule, avatar: AvatarDefinition): boolean {
  const { unlockedDecorations, unlockedEffects, unlockedAnimations } = avatar.evolution
  const assetId = rule.reward.assetId
  return (
    unlockedDecorations.includes(assetId) ||
    unlockedEffects.includes(assetId) ||
    unlockedAnimations.includes(assetId)
  )
}

function checkSpecialEvent(_threshold: number): boolean {
  return false
}

export function checkEvolutionRules(avatar: AvatarDefinition): EvolutionCheckResult {
  const newlyUnlocked: AvatarEvolutionRule[] = []

  for (const rule of EVOLUTION_RULES) {
    if (isRuleUnlocked(rule, avatar) && !isAlreadyClaimed(rule, avatar)) {
      newlyUnlocked.push(rule)
    }
  }

  const newLevel = calculateLevel(avatar)

  return { newlyUnlocked, newLevel }
}

export function applyEvolutionRewards(
  avatar: AvatarDefinition,
  rewards: AvatarEvolutionRule[]
): AvatarDefinition['evolution'] {
  const evolution = { ...avatar.evolution }
  const newDecorations = [...evolution.unlockedDecorations]
  const newEffects = [...evolution.unlockedEffects]
  const newAnimations = [...evolution.unlockedAnimations]

  rewards.forEach(rule => {
    switch (rule.reward.type) {
      case 'decoration':
        if (!newDecorations.includes(rule.reward.assetId)) {
          newDecorations.push(rule.reward.assetId)
        }
        break
      case 'effect':
        if (!newEffects.includes(rule.reward.assetId)) {
          newEffects.push(rule.reward.assetId)
        }
        break
      case 'animation':
        if (!newAnimations.includes(rule.reward.assetId)) {
          newAnimations.push(rule.reward.assetId)
        }
        break
    }
  })

  return {
    ...evolution,
    level: calculateLevel(avatar),
    unlockedDecorations: newDecorations,
    unlockedEffects: newEffects,
    unlockedAnimations: newAnimations
  }
}

export function updateEvolutionStats(
  avatar: AvatarDefinition,
  stats: {
    focusMinutes?: number
    tasksCompleted?: number
    streakDays?: number
  }
): AvatarDefinition['evolution'] {
  return {
    ...avatar.evolution,
    totalFocusMinutes: avatar.evolution.totalFocusMinutes + (stats.focusMinutes || 0),
    totalTasksCompleted: avatar.evolution.totalTasksCompleted + (stats.tasksCompleted || 0),
    streakDays: stats.streakDays !== undefined ? stats.streakDays : avatar.evolution.streakDays
  }
}

export function getEvolutionProgress(avatar: AvatarDefinition): Array<{
  rule: AvatarEvolutionRule
  current: number
  target: number
  percentage: number
  unlocked: boolean
}> {
  return EVOLUTION_RULES.map(rule => {
    let current = 0
    switch (rule.trigger.type) {
      case 'focus_minutes':
        current = avatar.evolution.totalFocusMinutes
        break
      case 'tasks_completed':
        current = avatar.evolution.totalTasksCompleted
        break
      case 'streak_days':
        current = avatar.evolution.streakDays
        break
    }
    const percentage = Math.min(100, Math.round((current / rule.trigger.threshold) * 100))
    return {
      rule,
      current,
      target: rule.trigger.threshold,
      percentage,
      unlocked: isAlreadyClaimed(rule, avatar)
    }
  })
}
