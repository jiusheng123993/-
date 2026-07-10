import { createStorageService } from '../../shared/data/storageFactory'

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

const storage = createStorageService<MoodJournalState>('xinghuanhai-moodjournal-state', { entries: [] })

export function getEntries(): MoodEntry[] {
  return storage.load().entries
}

export function getEntryByDate(date: string): MoodEntry | undefined {
  return storage.load().entries.find((e) => e.date === date)
}

export function addEntry(entry: Omit<MoodEntry, 'id'>): MoodEntry {
  const state = storage.load()
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
  storage.save(state)
  return newEntry
}

export function updateEntry(id: string, updates: Partial<MoodEntry>): MoodEntry | null {
  const state = storage.load()
  const index = state.entries.findIndex((e) => e.id === id)
  if (index === -1) return null
  state.entries[index] = { ...state.entries[index], ...updates }
  state.entries.sort((a, b) => b.date.localeCompare(a.date))
  storage.save(state)
  return state.entries[index]
}

export function deleteEntry(id: string): boolean {
  const state = storage.load()
  const index = state.entries.findIndex((e) => e.id === id)
  if (index === -1) return false
  state.entries.splice(index, 1)
  storage.save(state)
  return true
}

export function getMoodStats(): MoodStats {
  const entries = storage.load().entries
  const now = new Date()

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let totalScore = 0
  const totalEntries = entries.length
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

export interface MoodTrend {
  direction: 'up' | 'down' | 'stable'
  change: number
  recentScores: number[]
}

export interface MoodInsights {
  averageScore: number
  trend: MoodTrend
  dominantTags: string[]
  lowMoodDays: number
  streakDays: number
  needsCare: boolean
  encouragementMessage?: string
}

export function getRecentMoods(days: number = 7): MoodEntry[] {
  const entries = storage.load().entries
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - days + 1)
  startDate.setHours(0, 0, 0, 0)

  return entries
    .filter((e) => new Date(e.date) >= startDate)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function getMoodTrend(days: number = 7): MoodTrend {
  const recentMoods = getRecentMoods(days)
  if (recentMoods.length < 2) {
    return { direction: 'stable', change: 0, recentScores: recentMoods.map((e) => e.score) }
  }

  const firstHalf = recentMoods.slice(0, Math.floor(recentMoods.length / 2))
  const secondHalf = recentMoods.slice(Math.floor(recentMoods.length / 2))

  const firstAvg = firstHalf.reduce((sum, e) => sum + e.score, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, e) => sum + e.score, 0) / secondHalf.length

  const change = Math.round((secondAvg - firstAvg) * 10) / 10

  let direction: 'up' | 'down' | 'stable' = 'stable'
  if (change > 1) direction = 'up'
  else if (change < -1) direction = 'down'

  return {
    direction,
    change,
    recentScores: recentMoods.map((e) => e.score),
  }
}

export function hasLowMoodWarning(): boolean {
  const stats = getMoodStats()
  return stats.lowStreakDays >= 3
}

export function getMoodInsights(): MoodInsights {
  const stats = getMoodStats()
  const trend = getMoodTrend(7)
  const needsCare = hasLowMoodWarning()

  let encouragementMessage: string | undefined
  if (needsCare) {
    const messages = [
      '我注意到你最近情绪有点低落，记得照顾好自己。如果需要倾诉，我随时在这里。',
      '连续几天情绪较低迷了，建议适当休息一下，做一些让自己放松的事情。',
      '无论学习多忙，都要记得关注自己的情绪健康。你已经很努力了。',
    ]
    encouragementMessage = messages[Math.floor(Math.random() * messages.length)]
  }

  return {
    averageScore: stats.averageScore,
    trend,
    dominantTags: stats.tagStats.slice(0, 3).map((t) => t.tag),
    lowMoodDays: stats.lowStreakDays,
    streakDays: stats.streakDays,
    needsCare,
    encouragementMessage,
  }
}

export function getEncouragementMessage(): string | null {
  const insights = getMoodInsights()
  if (!insights.needsCare) return null
  return insights.encouragementMessage || null
}
