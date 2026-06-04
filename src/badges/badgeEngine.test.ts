import { describe, it, expect } from 'vitest'
import { evaluateBadges, getBadgeById } from './badgeEngine'

describe('badgeEngine', () => {
  const baseInput = {
    totalFocusSessions: 0,
    streakDays: 0,
    completedTasks: 0,
    usedPersonas: [],
    themeSwitches: 0,
    hasMemoryProfile: false,
    hasAvatar: false,
    cycleDaysRecorded: 0,
    earlyBirdSessions: 0,
    nightOwlSessions: 0
  }

  it('returns all badges with zero progress for empty input', () => {
    const result = evaluateBadges(baseInput)
    expect(result.totalCount).toBeGreaterThan(0)
    expect(result.totalUnlocked).toBe(0)
    result.badges.forEach((badge) => {
      expect(badge.progress).toBe(0)
      expect(badge.isUnlocked).toBe(false)
    })
  })

  it('unlocks first-focus badge with 1 focus session', () => {
    const result = evaluateBadges({ ...baseInput, totalFocusSessions: 1 })
    const badge = result.badges.find((b) => b.id === 'first-focus')
    expect(badge?.isUnlocked).toBe(true)
    expect(badge?.progress).toBe(1)
  })

  it('unlocks focus-10 badge with 10 focus sessions', () => {
    const result = evaluateBadges({ ...baseInput, totalFocusSessions: 10 })
    const badge = result.badges.find((b) => b.id === 'focus-10')
    expect(badge?.isUnlocked).toBe(true)
  })

  it('unlocks streak-3 badge with 3 streak days', () => {
    const result = evaluateBadges({ ...baseInput, streakDays: 3 })
    const badge = result.badges.find((b) => b.id === 'streak-3')
    expect(badge?.isUnlocked).toBe(true)
  })

  it('unlocks streak-7 badge with 7 streak days', () => {
    const result = evaluateBadges({ ...baseInput, streakDays: 7 })
    const badge = result.badges.find((b) => b.id === 'streak-7')
    expect(badge?.isUnlocked).toBe(true)
  })

  it('unlocks task-10 badge with 10 completed tasks', () => {
    const result = evaluateBadges({ ...baseInput, completedTasks: 10 })
    const badge = result.badges.find((b) => b.id === 'task-10')
    expect(badge?.isUnlocked).toBe(true)
  })

  it('unlocks multi-persona badge with 3 personas', () => {
    const result = evaluateBadges({
      ...baseInput,
      usedPersonas: ['exam-student', 'office-worker', 'creator']
    })
    const badge = result.badges.find((b) => b.id === 'multi-persona')
    expect(badge?.isUnlocked).toBe(true)
  })

  it('unlocks memory-keeper badge when hasMemoryProfile is true', () => {
    const result = evaluateBadges({ ...baseInput, hasMemoryProfile: true })
    const badge = result.badges.find((b) => b.id === 'memory-keeper')
    expect(badge?.isUnlocked).toBe(true)
  })

  it('unlocks avatar-creator badge when hasAvatar is true', () => {
    const result = evaluateBadges({ ...baseInput, hasAvatar: true })
    const badge = result.badges.find((b) => b.id === 'avatar-creator')
    expect(badge?.isUnlocked).toBe(true)
  })

  it('shows progress but not unlocked when below target', () => {
    const result = evaluateBadges({ ...baseInput, totalFocusSessions: 5 })
    const badge = result.badges.find((b) => b.id === 'focus-10')
    expect(badge?.isUnlocked).toBe(false)
    expect(badge?.progress).toBe(5)
  })

  it('returns recentlyUnlocked in reverse order', () => {
    const result = evaluateBadges({
      ...baseInput,
      totalFocusSessions: 10,
      streakDays: 7,
      completedTasks: 10
    })
    expect(result.recentlyUnlocked.length).toBeLessThanOrEqual(3)
    expect(result.totalUnlocked).toBeGreaterThanOrEqual(3)
  })

  it('getBadgeById returns undefined for unknown id', () => {
    expect(getBadgeById('nonexistent')).toBeUndefined()
  })

  it('getBadgeById returns badge definition for known id', () => {
    const badge = getBadgeById('first-focus')
    expect(badge).toBeDefined()
    expect(badge?.name).toBe('初次专注')
  })
})
