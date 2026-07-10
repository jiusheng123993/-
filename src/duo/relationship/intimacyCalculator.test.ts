import { describe, it, expect } from 'vitest'
import {
  calculateIntimacyScore,
  calculateSynergyScore,
  getIntimacyFactors,
  getSynergyFactors,
  updateStreakDays
} from './intimacyCalculator'
import type { RelationshipSpace, SpaceActivity } from './relationshipTypes'
import { DEFAULT_SPACE_SETTINGS, DEFAULT_SPACE_STATS } from './relationshipTypes'

function createMockSpace(overrides: Partial<RelationshipSpace> = {}): RelationshipSpace {
  return {
    id: 'sp_test',
    type: 'couple',
    name: 'Test Space',
    ownerId: 'user1',
    members: [
      { userId: 'user1', role: 'owner', joinedAt: '2026-01-01T00:00:00Z' },
      { userId: 'user2', role: 'member', joinedAt: '2026-01-01T00:00:00Z' }
    ],
    settings: { ...DEFAULT_SPACE_SETTINGS },
    stats: { ...DEFAULT_SPACE_STATS },
    anniversaries: [],
    sharedGoals: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides
  }
}

function createActivity(
  type: SpaceActivity['type'],
  actorId: string,
  daysAgo: number = 0,
  payload: Record<string, unknown> = {}
): SpaceActivity {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  return {
    id: `act_${Math.random().toString(36).slice(2)}`,
    spaceId: 'sp_test',
    type,
    actorId,
    payload,
    createdAt: date.toISOString()
  }
}

describe('intimacyCalculator', () => {
  describe('calculateIntimacyScore', () => {
    it('should return 0 for empty space with no activities', () => {
      const space = createMockSpace()
      const score = calculateIntimacyScore(space, [])
      expect(score).toBe(0)
    })

    it('should increase with interactions', () => {
      const space = createMockSpace()
      const activities = [
        createActivity('task_push', 'user1', 1),
        createActivity('task_accept', 'user2', 1),
        createActivity('habit_check', 'user1', 0),
        createActivity('focus_start', 'user2', 0)
      ]
      const score = calculateIntimacyScore(space, activities)
      expect(score).toBeGreaterThan(0)
    })

    it('should increase with focus time', () => {
      const spaceNoFocus = createMockSpace()
      const spaceWithFocus = createMockSpace({
        stats: { ...DEFAULT_SPACE_STATS, totalSharedFocus: 600 }
      })
      const activities = [createActivity('task_push', 'user1', 0)]
      const scoreNoFocus = calculateIntimacyScore(spaceNoFocus, activities)
      const scoreWithFocus = calculateIntimacyScore(spaceWithFocus, activities)
      expect(scoreWithFocus).toBeGreaterThan(scoreNoFocus)
    })

    it('should increase with streak days', () => {
      const spaceNoStreak = createMockSpace()
      const spaceWithStreak = createMockSpace({
        stats: { ...DEFAULT_SPACE_STATS, streakDays: 10 }
      })
      const scoreNoStreak = calculateIntimacyScore(spaceNoStreak, [])
      const scoreWithStreak = calculateIntimacyScore(spaceWithStreak, [])
      expect(scoreWithStreak).toBeGreaterThan(scoreNoStreak)
    })

    it('should increase with anniversaries', () => {
      const spaceNoAnn = createMockSpace()
      const spaceWithAnn = createMockSpace({
        anniversaries: [
          { id: 'ann1', name: '纪念日', date: '2026-06-15', repeat: 'yearly', remindDays: 7 }
        ]
      })
      const scoreNoAnn = calculateIntimacyScore(spaceNoAnn, [])
      const scoreWithAnn = calculateIntimacyScore(spaceWithAnn, [])
      expect(scoreWithAnn).toBeGreaterThanOrEqual(scoreNoAnn)
    })

    it('should increase with goal progress', () => {
      const spaceNoGoal = createMockSpace()
      const spaceWithGoal = createMockSpace({
        sharedGoals: [
          { id: 'goal1', name: '共同目标', targetDate: '2026-12-31', progress: 80, contributors: ['user1', 'user2'] }
        ]
      })
      const scoreNoGoal = calculateIntimacyScore(spaceNoGoal, [])
      const scoreWithGoal = calculateIntimacyScore(spaceWithGoal, [])
      expect(scoreWithGoal).toBeGreaterThan(scoreNoGoal)
    })

    it('should not exceed 100', () => {
      const space = createMockSpace({
        stats: { ...DEFAULT_SPACE_STATS, totalSharedFocus: 10000, streakDays: 365, totalSharedTasks: 500 },
        anniversaries: [
          { id: 'ann1', name: '纪念日', date: '2026-06-15', repeat: 'yearly', remindDays: 7 }
        ],
        sharedGoals: [
          { id: 'goal1', name: '目标', targetDate: '2026-12-31', progress: 100, contributors: ['user1'] }
        ]
      })
      const activities = Array.from({ length: 50 }, (_, i) =>
        createActivity('task_push', 'user1', i % 7)
      )
      const score = calculateIntimacyScore(space, activities)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should only count recent activities (30 days)', () => {
      const space = createMockSpace()
      const recentActivities = [createActivity('task_push', 'user1', 5)]
      const oldActivities = [createActivity('task_push', 'user1', 60)]
      const scoreRecent = calculateIntimacyScore(space, recentActivities)
      const scoreOld = calculateIntimacyScore(space, oldActivities)
      expect(scoreRecent).toBeGreaterThan(scoreOld)
    })
  })

  describe('calculateSynergyScore', () => {
    it('should return 0 for empty space with no activities', () => {
      const space = createMockSpace({ type: 'study_buddy' })
      const score = calculateSynergyScore(space, [])
      expect(score).toBe(0)
    })

    it('should increase with collaboration activities', () => {
      const space = createMockSpace({ type: 'study_buddy' })
      const activities = [
        createActivity('task_push', 'user1', 1),
        createActivity('task_accept', 'user2', 1),
        createActivity('task_complete', 'user1', 0),
        createActivity('habit_check', 'user2', 0)
      ]
      const score = calculateSynergyScore(space, activities)
      expect(score).toBeGreaterThan(0)
    })

    it('should increase with consistency (active days)', () => {
      const space = createMockSpace({ type: 'study_buddy' })
      const oneDayActivities = [createActivity('task_push', 'user1', 0)]
      const multiDayActivities = [
        createActivity('task_push', 'user1', 0),
        createActivity('task_push', 'user1', 1),
        createActivity('task_push', 'user1', 2),
        createActivity('task_push', 'user1', 3)
      ]
      const scoreOneDay = calculateSynergyScore(space, oneDayActivities)
      const scoreMultiDay = calculateSynergyScore(space, multiDayActivities)
      expect(scoreMultiDay).toBeGreaterThan(scoreOneDay)
    })

    it('should not exceed 100', () => {
      const space = createMockSpace({
        type: 'study_buddy',
        stats: { ...DEFAULT_SPACE_STATS, totalSharedTasks: 500 },
        sharedGoals: [
          { id: 'goal1', name: '目标', targetDate: '2026-12-31', progress: 100, contributors: ['user1'] }
        ]
      })
      const activities = Array.from({ length: 50 }, (_, i) =>
        createActivity('task_accept', 'user1', i % 14)
      )
      const score = calculateSynergyScore(space, activities)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('getIntimacyFactors', () => {
    it('should return all factor scores', () => {
      const space = createMockSpace({
        stats: { ...DEFAULT_SPACE_STATS, streakDays: 5, totalSharedFocus: 120 }
      })
      const activities = [createActivity('task_push', 'user1', 0)]
      const factors = getIntimacyFactors(space, activities)
      expect(factors).toHaveProperty('interactionScore')
      expect(factors).toHaveProperty('focusScore')
      expect(factors).toHaveProperty('streakScore')
      expect(factors).toHaveProperty('anniversaryScore')
      expect(factors).toHaveProperty('goalScore')
      expect(typeof factors.interactionScore).toBe('number')
    })
  })

  describe('getSynergyFactors', () => {
    it('should return all factor scores', () => {
      const space = createMockSpace({ type: 'study_buddy' })
      const activities = [createActivity('task_accept', 'user1', 0)]
      const factors = getSynergyFactors(space, activities)
      expect(factors).toHaveProperty('collaborationScore')
      expect(factors).toHaveProperty('consistencyScore')
      expect(factors).toHaveProperty('supportScore')
      expect(factors).toHaveProperty('achievementScore')
    })
  })

  describe('updateStreakDays', () => {
    it('should return 0 if no recent activities', () => {
      const space = createMockSpace()
      const result = updateStreakDays(space, [])
      expect(result).toBe(0)
    })

    it('should maintain streak if activity today', () => {
      const space = createMockSpace({
        stats: { ...DEFAULT_SPACE_STATS, streakDays: 5 }
      })
      const activities = [createActivity('task_push', 'user1', 0)]
      const result = updateStreakDays(space, activities)
      expect(result).toBeGreaterThanOrEqual(5)
    })

    it('should reset streak if no activity for 2+ days', () => {
      const space = createMockSpace({
        stats: { ...DEFAULT_SPACE_STATS, streakDays: 10 }
      })
      const activities = [createActivity('task_push', 'user1', 5)]
      const result = updateStreakDays(space, activities)
      expect(result).toBe(0)
    })
  })
})
