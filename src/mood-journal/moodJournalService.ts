export interface MoodEntry {
  id: string
  date: string
  score: number
  note?: string
  tags: string[]
}

export interface MoodJournalState {
  entries: MoodEntry[]
}

export interface MoodStats {
  averageScore: number
  totalEntries: number
  streakDays: number
  lowStreakDays: number
  weeklyStats: { date: string; score: number }[]
  monthlyStats: { date: string; score: number }[]
  tagStats: { tag: string; count: number; avgScore: number }[]
}

const STORAGE_KEY = 'xinghuanhai-moodjournal-state'

function loadState(): MoodJournalState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { entries: [] }
}

function saveState(state: MoodJournalState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getEntries(): MoodEntry[] {
  return loadState().entries
}

export function getEntryByDate(date: string): MoodEntry | undefined {
  return loadState().entries.find((e) => e.date === date)
}

export function addEntry(entry: Omit<MoodEntry, 'id'>): MoodEntry {
  const state = loadState()
  const existing = state.entries.findIndex((e) => e.date === entry.date)
  const newEntry: MoodEntry = {
    ...entry,
    id: crypto.randomUUID(),
  }
  if (existing !== -1) {
    state.entries[existing] = newEntry
  } else {
    state.entries.unshift(newEntry)
  }
  state.entries.sort((a, b) => b.date.localeCompare(a.date))
  saveState(state)
  return newEntry
}

export function updateEntry(id: string, updates: Partial<MoodEntry>): MoodEntry | null {
  const state = loadState()
  const index = state.entries.findIndex((e) => e.id === id)
  if (index === -1) return null
  state.entries[index] = { ...state.entries[index], ...updates }
  state.entries.sort((a, b) => b.date.localeCompare(a.date))
  saveState(state)
  return state.entries[index]
}

export function deleteEntry(id: string): boolean {
  const state = loadState()
  const index = state.entries.findIndex((e) => e.id === id)
  if (index === -1) return false
  state.entries.splice(index, 1)
  saveState(state)
  return true
}

export function getMoodStats(): MoodStats {
  const entries = loadState().entries
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let totalScore = 0
  let totalEntries = entries.length
  let streakDays = 0
  let lowStreakDays = 0

  const sortedByDate = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  for (const entry of sortedByDate) {
    const expectedDate = new Date(now)
    expectedDate.setDate(now.getDate() - streakDays)
    const expectedStr = expectedDate.toISOString().slice(0, 10)
    if (entry.date === expectedStr) {
      streakDays++
    } else if (entry.date < expectedStr) {
      break
    }
  }

  let currentLowStreak = 0
  for (const entry of sortedByDate) {
    if (entry.score <= 4) {
      currentLowStreak++
      if (currentLowStreak > lowStreakDays) {
        lowStreakDays = currentLowStreak
      }
    } else {
      currentLowStreak = 0
    }
  }

  for (const entry of entries) {
    totalScore += entry.score
  }

  const weeklyStats: { date: string; score: number }[] = []
  const weeklyMap: Record<string, number[]> = {}
  for (const entry of entries) {
    const entryDate = new Date(entry.date)
    if (entryDate >= weekStart) {
      if (!weeklyMap[entry.date]) weeklyMap[entry.date] = []
      weeklyMap[entry.date].push(entry.score)
    }
  }
  for (const [date, scores] of Object.entries(weeklyMap)) {
    weeklyStats.push({
      date,
      score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    })
  }
  weeklyStats.sort((a, b) => a.date.localeCompare(b.date))

  const monthlyStats: { date: string; score: number }[] = []
  const monthlyMap: Record<string, number[]> = {}
  for (const entry of entries) {
    const entryDate = new Date(entry.date)
    if (entryDate >= monthStart) {
      if (!monthlyMap[entry.date]) monthlyMap[entry.date] = []
      monthlyMap[entry.date].push(entry.score)
    }
  }
  for (const [date, scores] of Object.entries(monthlyMap)) {
    monthlyStats.push({
      date,
      score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    })
  }
  monthlyStats.sort((a, b) => a.date.localeCompare(b.date))

  const tagMap: Record<string, { count: number; totalScore: number }> = {}
  for (const entry of entries) {
    for (const tag of entry.tags) {
      if (!tagMap[tag]) tagMap[tag] = { count: 0, totalScore: 0 }
      tagMap[tag].count++
      tagMap[tag].totalScore += entry.score
    }
  }
  const tagStats = Object.entries(tagMap)
    .map(([tag, stats]) => ({
      tag,
      count: stats.count,
      avgScore: Math.round((stats.totalScore / stats.count) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    averageScore: totalEntries > 0 ? Math.round((totalScore / totalEntries) * 10) / 10 : 0,
    totalEntries,
    streakDays,
    lowStreakDays,
    weeklyStats,
    monthlyStats,
    tagStats,
  }
}

export function getTodayEntry(): MoodEntry | undefined {
  const todayStr = new Date().toISOString().slice(0, 10)
  return getEntryByDate(todayStr)
}

export const MOOD_EMOJIS: Record<number, string> = {
  1: '😭',
  2: '😢',
  3: '😞',
  4: '😕',
  5: '😐',
  6: '🙂',
  7: '😊',
  8: '😄',
  9: '🥳',
  10: '🌟',
}

export const MOOD_LABELS: Record<number, string> = {
  1: '非常低落',
  2: '很难过',
  3: '有点沮丧',
  4: '不太好',
  5: '一般般',
  6: '还行',
  7: '挺不错',
  8: '很开心',
  9: '超级棒',
  10: '完美',
}

export const MOOD_TAGS = [
  '焦虑', '压力', '疲惫', '充实', '开心', '平静',
  '烦躁', '迷茫', '自信', '感恩', '孤独', '期待',
  '考试', '学习', '运动', '社交', '休息', '阅读',
]
