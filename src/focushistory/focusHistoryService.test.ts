import { describe, it, expect } from 'vitest'
import { createFocusHistoryService } from './focusHistoryService'

interface FocusSession {
  id: string
  taskTitle: string
  minutes: number
  rewardPoints: number
  completedAt: string
}

function createMockWorkspaceState(sessions: FocusSession[] = []) {
  return { focusSessions: sessions }
}

function createSession(overrides: Partial<{
  id: string
  taskTitle: string
  minutes: number
  rewardPoints: number
  completedAt: string
}> = {}) {
  return {
    id: overrides.id || 'session-1',
    taskTitle: overrides.taskTitle || '默认任务',
    minutes: overrides.minutes ?? 25,
    rewardPoints: overrides.rewardPoints ?? 10,
    completedAt: overrides.completedAt || new Date().toISOString()
  }
}

describe('focusHistoryService', () => {
  describe('getHistory', () => {
    it('returns empty array when no sessions', () => {
      const service = createFocusHistoryService(() => createMockWorkspaceState([]))
      expect(service.getHistory(7)).toEqual([])
    })

    it('returns sessions within date range', () => {
      const now = new Date()
      const session = createSession({ completedAt: now.toISOString() })
      const service = createFocusHistoryService(() => createMockWorkspaceState([session]))
      const history = service.getHistory(7)
      expect(history).toHaveLength(1)
      expect(history[0].taskTitle).toBe('默认任务')
      expect(history[0].minutes).toBe(25)
    })

    it('filters out sessions older than days', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10)
      const oldSession = createSession({ completedAt: oldDate.toISOString() })
      const service = createFocusHistoryService(() => createMockWorkspaceState([oldSession]))
      expect(service.getHistory(7)).toEqual([])
    })

    it('handles missing taskTitle', () => {
      const session = createSession({ taskTitle: 'temp' })
      const partialSession = { ...session } as Partial<FocusSession>
      delete partialSession.taskTitle
      const service = createFocusHistoryService(() => createMockWorkspaceState([partialSession as FocusSession]))
      const history = service.getHistory(7)
      expect(history[0].taskTitle).toBe('未知任务')
    })

    it('handles missing minutes and rewardPoints', () => {
      const session = createSession({ minutes: 0, rewardPoints: 0 })
      const partialSession = { ...session } as Partial<FocusSession>
      delete partialSession.minutes
      delete partialSession.rewardPoints
      const service = createFocusHistoryService(() => createMockWorkspaceState([partialSession as FocusSession]))
      const history = service.getHistory(7)
      expect(history[0].minutes).toBe(0)
      expect(history[0].rewardPoints).toBe(0)
    })

    it('sorts by completedAt descending', () => {
      const older = new Date()
      older.setHours(older.getHours() - 1)
      const newer = new Date()
      const s1 = createSession({ id: 's1', completedAt: older.toISOString() })
      const s2 = createSession({ id: 's2', completedAt: newer.toISOString() })
      const service = createFocusHistoryService(() => createMockWorkspaceState([s1, s2]))
      const history = service.getHistory(7)
      expect(history[0].id).toBe('s2')
      expect(history[1].id).toBe('s1')
    })

    it('extracts dayOfWeek and hourOfDay from completedAt', () => {
      const date = new Date('2026-06-01T14:30:00.000Z')
      const session = createSession({ completedAt: date.toISOString() })
      const service = createFocusHistoryService(() => createMockWorkspaceState([session]))
      const history = service.getHistory(30)
      expect(history[0].dayOfWeek).toBe(date.getDay())
      expect(history[0].hourOfDay).toBe(date.getHours())
    })
  })

  describe('getHeatmapData', () => {
    it('returns 168 entries (7 days x 24 hours)', () => {
      const service = createFocusHistoryService(() => createMockWorkspaceState([]))
      const data = service.getHeatmapData(7)
      expect(data).toHaveLength(168)
    })

    it('counts sessions per day-hour cell', () => {
      const date = new Date('2026-06-01T14:00:00.000Z')
      const s1 = createSession({ id: 's1', completedAt: date.toISOString() })
      const s2 = createSession({ id: 's2', completedAt: date.toISOString() })
      const service = createFocusHistoryService(() => createMockWorkspaceState([s1, s2]))
      const data = service.getHeatmapData(30)
      const cell = data.find((d) => d.day === date.getDay() && d.hour === date.getHours())
      expect(cell).toBeDefined()
      expect(cell!.count).toBe(2)
    })

    it('returns zero count for empty cells', () => {
      const service = createFocusHistoryService(() => createMockWorkspaceState([]))
      const data = service.getHeatmapData(7)
      const allZero = data.every((d) => d.count === 0)
      expect(allZero).toBe(true)
    })
  })

  describe('getDayOfWeekStats', () => {
    it('returns 7 entries for each day of week', () => {
      const service = createFocusHistoryService(() => createMockWorkspaceState([]))
      const stats = service.getDayOfWeekStats()
      expect(stats).toHaveLength(7)
    })

    it('aggregates minutes and count per day', () => {
      const date = new Date()
      const s1 = createSession({ id: 's1', minutes: 25, completedAt: date.toISOString() })
      const s2 = createSession({ id: 's2', minutes: 30, completedAt: date.toISOString() })
      const service = createFocusHistoryService(() => createMockWorkspaceState([s1, s2]))
      const stats = service.getDayOfWeekStats()
      const dayStat = stats.find((s) => s.day === date.getDay())
      expect(dayStat).toBeDefined()
      expect(dayStat!.totalMinutes).toBe(55)
      expect(dayStat!.count).toBe(2)
    })
  })

  describe('getHourOfDayStats', () => {
    it('returns 24 entries for each hour', () => {
      const service = createFocusHistoryService(() => createMockWorkspaceState([]))
      const stats = service.getHourOfDayStats()
      expect(stats).toHaveLength(24)
    })

    it('aggregates minutes and count per hour', () => {
      const date = new Date()
      const session = createSession({ minutes: 25, completedAt: date.toISOString() })
      const service = createFocusHistoryService(() => createMockWorkspaceState([session]))
      const stats = service.getHourOfDayStats()
      const hourStat = stats.find((s) => s.hour === date.getHours())
      expect(hourStat).toBeDefined()
      expect(hourStat!.totalMinutes).toBe(25)
      expect(hourStat!.count).toBe(1)
    })
  })

  describe('getStreakData', () => {
    it('returns empty array when no sessions', () => {
      const service = createFocusHistoryService(() => createMockWorkspaceState([]))
      expect(service.getStreakData()).toEqual([])
    })

    it('aggregates minutes per date', () => {
      const date = new Date('2026-06-01T14:00:00.000Z')
      const s1 = createSession({ id: 's1', minutes: 25, completedAt: date.toISOString() })
      const s2 = createSession({ id: 's2', minutes: 30, completedAt: date.toISOString() })
      const service = createFocusHistoryService(() => createMockWorkspaceState([s1, s2]))
      const data = service.getStreakData()
      expect(data).toHaveLength(1)
      expect(data[0].minutes).toBe(55)
    })

    it('sorts by date ascending', () => {
      const d1 = new Date('2026-06-01T14:00:00.000Z')
      const d2 = new Date('2026-06-02T14:00:00.000Z')
      const s1 = createSession({ id: 's1', completedAt: d1.toISOString() })
      const s2 = createSession({ id: 's2', completedAt: d2.toISOString() })
      const service = createFocusHistoryService(() => createMockWorkspaceState([s2, s1]))
      const data = service.getStreakData()
      expect(data[0].date).toBe('2026-06-01')
      expect(data[1].date).toBe('2026-06-02')
    })
  })

  describe('getEfficiencyTrend', () => {
    it('returns empty array when no sessions', () => {
      const service = createFocusHistoryService(() => createMockWorkspaceState([]))
      expect(service.getEfficiencyTrend(7)).toEqual([])
    })

    it('calculates average minutes per session per date', () => {
      const date = new Date('2026-06-01T14:00:00.000Z')
      const s1 = createSession({ id: 's1', minutes: 25, completedAt: date.toISOString() })
      const s2 = createSession({ id: 's2', minutes: 35, completedAt: date.toISOString() })
      const service = createFocusHistoryService(() => createMockWorkspaceState([s1, s2]))
      const trend = service.getEfficiencyTrend(30)
      expect(trend).toHaveLength(1)
      expect(trend[0].avgMinutes).toBe(30)
    })

    it('sorts by date ascending', () => {
      const d1 = new Date('2026-06-01T14:00:00.000Z')
      const d2 = new Date('2026-06-02T14:00:00.000Z')
      const s1 = createSession({ id: 's1', completedAt: d1.toISOString() })
      const s2 = createSession({ id: 's2', completedAt: d2.toISOString() })
      const service = createFocusHistoryService(() => createMockWorkspaceState([s2, s1]))
      const trend = service.getEfficiencyTrend(30)
      expect(trend[0].date).toBe('2026-06-01')
      expect(trend[1].date).toBe('2026-06-02')
    })
  })
})