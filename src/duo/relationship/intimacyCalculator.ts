import type { RelationshipSpace, SpaceActivity } from './relationshipTypes'

export type IntimacyFactors = {
  interactionScore: number
  focusScore: number
  streakScore: number
  anniversaryScore: number
  goalScore: number
}

export type SynergyFactors = {
  collaborationScore: number
  consistencyScore: number
  supportScore: number
  achievementScore: number
}

const WEIGHTS = {
  INTERACTION: 0.25,
  FOCUS: 0.20,
  STREAK: 0.20,
  ANNIVERSARY: 0.15,
  GOAL: 0.20,
  COLLABORATION: 0.30,
  CONSISTENCY: 0.25,
  SUPPORT: 0.25,
  ACHIEVEMENT: 0.20
}

const MAX_SCORE = 100

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

function getRecentActivities(activities: SpaceActivity[], days: number): SpaceActivity[] {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return activities.filter(a => new Date(a.createdAt) >= cutoff)
}

function calculateInteractionScore(activities: SpaceActivity[]): number {
  const recent = getRecentActivities(activities, 30)
  const interactionTypes = ['task_push', 'task_accept', 'habit_check', 'focus_start', 'focus_end']
  const interactions = recent.filter(a => interactionTypes.includes(a.type))
  const score = Math.min(interactions.length * 2, 30)
  return score
}

function calculateFocusScore(totalFocusMinutes: number): number {
  const hours = totalFocusMinutes / 60
  return Math.min(hours * 0.5, 25)
}

function calculateStreakScore(streakDays: number): number {
  return Math.min(streakDays * 1.5, 20)
}

function calculateAnniversaryScore(anniversaries: RelationshipSpace['anniversaries']): number {
  const now = new Date()
  let score = 0
  anniversaries.forEach(ann => {
    const daysUntil = daysBetween(now.toISOString(), ann.date)
    if (daysUntil >= 0 && daysUntil <= ann.remindDays) {
      score += 5
    }
    if (ann.repeat === 'yearly') {
      score += 2
    }
  })
  return Math.min(score, 15)
}

function calculateGoalScore(goals: RelationshipSpace['sharedGoals']): number {
  let score = 0
  goals.forEach(goal => {
    score += goal.progress * 0.1
    if (goal.progress >= 100) {
      score += 5
    }
  })
  return Math.min(score, 20)
}

function calculateCollaborationScore(activities: SpaceActivity[]): number {
  const recent = getRecentActivities(activities, 30)
  const collabTypes = ['task_push', 'task_accept', 'task_complete', 'habit_check']
  const collabs = recent.filter(a => collabTypes.includes(a.type))
  return Math.min(collabs.length * 1.5, 30)
}

function calculateConsistencyScore(activities: SpaceActivity[]): number {
  const recent = getRecentActivities(activities, 14)
  const daysWithActivity = new Set<string>()
  recent.forEach(a => {
    const date = new Date(a.createdAt).toISOString().split('T')[0]
    daysWithActivity.add(date)
  })
  return Math.min(daysWithActivity.size * 2, 25)
}

function calculateSupportScore(activities: SpaceActivity[]): number {
  const recent = getRecentActivities(activities, 30)
  const supportTypes = ['task_accept', 'habit_check', 'focus_pk_accept']
  const supports = recent.filter(a => supportTypes.includes(a.type))
  return Math.min(supports.length * 2, 25)
}

function calculateAchievementScore(goals: RelationshipSpace['sharedGoals'], stats: RelationshipSpace['stats']): number {
  let score = 0
  const completedGoals = goals.filter(g => g.progress >= 100).length
  score += completedGoals * 5
  score += Math.min(stats.totalSharedTasks * 0.5, 10)
  return Math.min(score, 20)
}

export function calculateIntimacyScore(
  space: RelationshipSpace,
  activities: SpaceActivity[]
): number {
  const factors: IntimacyFactors = {
    interactionScore: calculateInteractionScore(activities),
    focusScore: calculateFocusScore(space.stats.totalSharedFocus),
    streakScore: calculateStreakScore(space.stats.streakDays),
    anniversaryScore: calculateAnniversaryScore(space.anniversaries),
    goalScore: calculateGoalScore(space.sharedGoals)
  }
  const total =
    factors.interactionScore * WEIGHTS.INTERACTION +
    factors.focusScore * WEIGHTS.FOCUS +
    factors.streakScore * WEIGHTS.STREAK +
    factors.anniversaryScore * WEIGHTS.ANNIVERSARY +
    factors.goalScore * WEIGHTS.GOAL
  return Math.min(Math.round(total * 10) / 10, MAX_SCORE)
}

export function calculateSynergyScore(
  space: RelationshipSpace,
  activities: SpaceActivity[]
): number {
  const factors: SynergyFactors = {
    collaborationScore: calculateCollaborationScore(activities),
    consistencyScore: calculateConsistencyScore(activities),
    supportScore: calculateSupportScore(activities),
    achievementScore: calculateAchievementScore(space.sharedGoals, space.stats)
  }
  const total =
    factors.collaborationScore * WEIGHTS.COLLABORATION +
    factors.consistencyScore * WEIGHTS.CONSISTENCY +
    factors.supportScore * WEIGHTS.SUPPORT +
    factors.achievementScore * WEIGHTS.ACHIEVEMENT
  return Math.min(Math.round(total * 10) / 10, MAX_SCORE)
}

export function getIntimacyFactors(
  space: RelationshipSpace,
  activities: SpaceActivity[]
): IntimacyFactors {
  return {
    interactionScore: calculateInteractionScore(activities),
    focusScore: calculateFocusScore(space.stats.totalSharedFocus),
    streakScore: calculateStreakScore(space.stats.streakDays),
    anniversaryScore: calculateAnniversaryScore(space.anniversaries),
    goalScore: calculateGoalScore(space.sharedGoals)
  }
}

export function getSynergyFactors(
  space: RelationshipSpace,
  activities: SpaceActivity[]
): SynergyFactors {
  return {
    collaborationScore: calculateCollaborationScore(activities),
    consistencyScore: calculateConsistencyScore(activities),
    supportScore: calculateSupportScore(activities),
    achievementScore: calculateAchievementScore(space.sharedGoals, space.stats)
  }
}

export function updateStreakDays(
  space: RelationshipSpace,
  activities: SpaceActivity[]
): number {
  const recent = getRecentActivities(activities, 3)
  if (recent.length === 0) {
    return 0
  }
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const activityDays = new Set(
    recent.map(a => new Date(a.createdAt).toISOString().split('T')[0])
  )
  if (activityDays.has(today) || activityDays.has(yesterday)) {
    return space.stats.streakDays + (activityDays.has(today) && !activityDays.has(yesterday) ? 1 : 0)
  }
  return 0
}
