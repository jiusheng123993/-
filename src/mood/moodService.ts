export interface MoodEntry {
  id: string
  mood: 1 | 2 | 3 | 4 | 5
  note: string
  tags: string[]
  date: string
  createdAt: string
}

export interface MoodState {
  entries: MoodEntry[]
}

const STORAGE_KEY = 'xinghuanhai-mood-state'

const moodEmojis = ['😢', '😕', '😐', '🙂', '😄']
const moodLabels = ['很差', '较差', '一般', '不错', '很棒']

function loadState(): MoodState {
  if (typeof window === 'undefined') return { entries: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { entries: [] }
}

function saveState(state: MoodState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export interface MoodService {
  getState(): MoodState
  addMood(mood: MoodEntry['mood'], note?: string, tags?: string[]): MoodEntry
  removeMood(id: string): void
  getTodayMood(): MoodEntry | null
  getMoodTrend(days: number): { date: string; avgMood: number; count: number }[]
  getMoodStats(days: number): { avgMood: number; totalEntries: number; mostCommonMood: number }
}

export function createMoodService(): MoodService {
  const getState = (): MoodState => loadState()

  const save = (state: MoodState): void => saveState(state)

  const addMood = (mood: MoodEntry['mood'], note: string = '', tags: string[] = []): MoodEntry => {
    const state = getState()
    const today = new Date().toISOString().split('T')[0]
    const existingIndex = state.entries.findIndex((e) => e.date === today)
    
    let entries: MoodEntry[]
    if (existingIndex >= 0) {
      entries = [...state.entries]
      entries[existingIndex] = {
        ...entries[existingIndex],
        mood,
        note,
        tags,
        createdAt: new Date().toISOString()
      }
    } else {
      const entry: MoodEntry = {
        id: crypto.randomUUID(),
        mood,
        note,
        tags,
        date: today,
        createdAt: new Date().toISOString()
      }
      entries = [entry, ...state.entries]
    }
    
    save({ entries })
    return entries.find((e) => e.date === today)!
  }

  const removeMood = (id: string): void => {
    const state = getState()
    save({ entries: state.entries.filter((e) => e.id !== id) })
  }

  const getTodayMood = (): MoodEntry | null => {
    const state = getState()
    const today = new Date().toISOString().split('T')[0]
    return state.entries.find((e) => e.date === today) || null
  }

  const getMoodTrend = (days: number) => {
    const state = getState()
    const result: { date: string; avgMood: number; count: number }[] = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayEntries = state.entries.filter((e) => e.date === dateStr)
      
      if (dayEntries.length > 0) {
        const avgMood = dayEntries.reduce((sum, e) => sum + e.mood, 0) / dayEntries.length
        result.push({ date: dateStr, avgMood: Math.round(avgMood * 10) / 10, count: dayEntries.length })
      } else {
        result.push({ date: dateStr, avgMood: 0, count: 0 })
      }
    }

    return result
  }

  const getMoodStats = (days: number) => {
    const state = getState()
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - days)
    const startStr = startDate.toISOString().split('T')[0]

    const recentEntries = state.entries.filter((e) => e.date >= startStr)
    
    if (recentEntries.length === 0) {
      return { avgMood: 0, totalEntries: 0, mostCommonMood: 3 }
    }

    const avgMood = recentEntries.reduce((sum, e) => sum + e.mood, 0) / recentEntries.length
    
    const moodCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    recentEntries.forEach((e) => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1
    })
    
    let mostCommonMood = 3
    let maxCount = 0
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count
        mostCommonMood = parseInt(mood)
      }
    })

    return {
      avgMood: Math.round(avgMood * 10) / 10,
      totalEntries: recentEntries.length,
      mostCommonMood
    }
  }

  return {
    getState,
    addMood,
    removeMood,
    getTodayMood,
    getMoodTrend,
    getMoodStats
  }
}

export { moodEmojis, moodLabels }