export interface FocusHistoryEntry {
  id: string
  taskTitle: string
  minutes: number
  rewardPoints: number
  completedAt: string
  dayOfWeek: number
  hourOfDay: number
}

interface FocusSession {
  id: string
  taskTitle?: string
  minutes?: number
  rewardPoints?: number
  completedAt: string
}

interface WorkspaceState {
  focusSessions?: FocusSession[]
}

export interface FocusHistoryService {
  getHistory(days: number): FocusHistoryEntry[]
  getHeatmapData(days: number): { day: number; hour: number; count: number }[]
  getDayOfWeekStats(): { day: number; totalMinutes: number; count: number }[]
  getHourOfDayStats(): { hour: number; totalMinutes: number; count: number }[]
  getStreakData(): { date: string; minutes: number }[]
  getEfficiencyTrend(days: number): { date: string; avgMinutes: number }[]
}

export function createFocusHistoryService(getWorkspaceState: () => WorkspaceState): FocusHistoryService {
  const getHistory = (days: number): FocusHistoryEntry[] => {
    const workspaceState = getWorkspaceState()
    const sessions = workspaceState.focusSessions || []
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    
    return sessions
      .filter((s) => new Date(s.completedAt) >= cutoff)
      .map((s) => ({
        id: s.id,
        taskTitle: s.taskTitle || '未知任务',
        minutes: s.minutes || 0,
        rewardPoints: s.rewardPoints || 0,
        completedAt: s.completedAt,
        dayOfWeek: new Date(s.completedAt).getDay(),
        hourOfDay: new Date(s.completedAt).getHours()
      }))
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  }

  const getHeatmapData = (days: number) => {
    const history = getHistory(days)
    const heatmap: Record<string, number> = {}
    
    history.forEach((entry: FocusHistoryEntry) => {
      const key = `${entry.dayOfWeek}-${entry.hourOfDay}`
      heatmap[key] = (heatmap[key] || 0) + 1
    })
    
    const result: { day: number; hour: number; count: number }[] = []
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        result.push({ day, hour, count: heatmap[`${day}-${hour}`] || 0 })
      }
    }
    return result
  }

  const getDayOfWeekStats = () => {
    const history = getHistory(30)
    const stats: Record<number, { totalMinutes: number; count: number }> = {}
    
    for (let i = 0; i < 7; i++) {
      stats[i] = { totalMinutes: 0, count: 0 }
    }
    
    history.forEach((entry: FocusHistoryEntry) => {
      stats[entry.dayOfWeek].totalMinutes += entry.minutes
      stats[entry.dayOfWeek].count += 1
    })
    
    return Object.entries(stats).map(([day, data]) => ({
      day: parseInt(day),
      totalMinutes: data.totalMinutes,
      count: data.count
    }))
  }

  const getHourOfDayStats = () => {
    const history = getHistory(30)
    const stats: Record<number, { totalMinutes: number; count: number }> = {}
    
    for (let i = 0; i < 24; i++) {
      stats[i] = { totalMinutes: 0, count: 0 }
    }
    
    history.forEach((entry: FocusHistoryEntry) => {
      stats[entry.hourOfDay].totalMinutes += entry.minutes
      stats[entry.hourOfDay].count += 1
    })
    
    return Object.entries(stats).map(([hour, data]) => ({
      hour: parseInt(hour),
      totalMinutes: data.totalMinutes,
      count: data.count
    }))
  }

  const getStreakData = () => {
    const history = getHistory(30)
    const daily: Record<string, number> = {}
    
    history.forEach((entry: FocusHistoryEntry) => {
      const date = entry.completedAt.split('T')[0]
      daily[date] = (daily[date] || 0) + entry.minutes
    })
    
    return Object.entries(daily)
      .map(([date, minutes]) => ({ date, minutes }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const getEfficiencyTrend = (days: number) => {
    const history = getHistory(days)
    const daily: Record<string, { total: number; count: number }> = {}
    
    history.forEach((entry: FocusHistoryEntry) => {
      const date = entry.completedAt.split('T')[0]
      if (!daily[date]) daily[date] = { total: 0, count: 0 }
      daily[date].total += entry.minutes
      daily[date].count += 1
    })
    
    return Object.entries(daily)
      .map(([date, data]) => ({
        date,
        avgMinutes: data.count > 0 ? Math.round(data.total / data.count) : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  return {
    getHistory,
    getHeatmapData,
    getDayOfWeekStats,
    getHourOfDayStats,
    getStreakData,
    getEfficiencyTrend
  }
}