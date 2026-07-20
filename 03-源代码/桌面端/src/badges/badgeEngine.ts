import { BADGE_DEFINITIONS, type Badge, type BadgeCollection } from './badgeTypes'

export interface BadgeProgressInput {
  totalFocusSessions: number
  streakDays: number
  completedTasks: number
  usedPersonas: string[]
  themeSwitches: number
  hasMemoryProfile: boolean
  hasAvatar: boolean
  cycleDaysRecorded: number
  earlyBirdSessions: number
  nightOwlSessions: number
}

export function evaluateBadges(input: BadgeProgressInput): BadgeCollection {
  const badges: Badge[] = BADGE_DEFINITIONS.map((def) => {
    let progress: number

    switch (def.id) {
      case 'first-focus':
      case 'focus-10':
      case 'focus-50':
      case 'focus-100':
        progress = Math.min(input.totalFocusSessions, def.target)
        break
      case 'streak-3':
      case 'streak-7':
      case 'streak-30':
      case 'streak-100':
        progress = Math.min(input.streakDays, def.target)
        break
      case 'task-10':
      case 'task-50':
      case 'task-100':
        progress = Math.min(input.completedTasks, def.target)
        break
      case 'early-bird':
        progress = Math.min(input.earlyBirdSessions, def.target)
        break
      case 'night-owl':
        progress = Math.min(input.nightOwlSessions, def.target)
        break
      case 'multi-persona':
        progress = Math.min(input.usedPersonas.length, def.target)
        break
      case 'theme-collector':
        progress = Math.min(input.themeSwitches, def.target)
        break
      case 'memory-keeper':
        progress = input.hasMemoryProfile ? 1 : 0
        break
      case 'avatar-creator':
        progress = input.hasAvatar ? 1 : 0
        break
      case 'cycle-master':
        progress = Math.min(input.cycleDaysRecorded, def.target)
        break
      default:
        progress = 0
    }

    const isUnlocked = progress >= def.target

    return {
      ...def,
      progress,
      isUnlocked,
      unlockedAt: isUnlocked ? new Date().toISOString() : undefined
    }
  })

  const unlocked = badges.filter((b) => b.isUnlocked)
  const recentlyUnlocked = unlocked.slice(-3).reverse()

  return {
    badges,
    totalUnlocked: unlocked.length,
    totalCount: badges.length,
    recentlyUnlocked
  }
}

export function getBadgeById(id: string): Badge | undefined {
  const def = BADGE_DEFINITIONS.find((b) => b.id === id)
  if (!def) return undefined
  return { ...def, progress: 0, isUnlocked: false }
}
