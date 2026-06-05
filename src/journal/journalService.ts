export interface JournalEntry {
  id: string
  date: string
  type: 'daily' | 'weekly' | 'monthly'
  mood: 'great' | 'good' | 'neutral' | 'bad' | 'terrible'
  moodScore: number
  title: string
  content: string
  highlights: string[]
  challenges: string[]
  lessons: string[]
  tomorrowPlan: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface JournalState {
  entries: JournalEntry[]
  currentStreak: number
  totalEntries: number
  lastEntryDate: string | null
}

export const MOOD_OPTIONS: { value: JournalEntry['mood']; label: string; emoji: string; score: number }[] = [
  { value: 'great', label: '太棒了', emoji: '😄', score: 5 },
  { value: 'good', label: '不错', emoji: '🙂', score: 4 },
  { value: 'neutral', label: '一般', emoji: '😐', score: 3 },
  { value: 'bad', label: '不太好', emoji: '😔', score: 2 },
  { value: 'terrible', label: '很糟糕', emoji: '😢', score: 1 }
]

export function createInitialJournalState(): JournalState {
  return {
    entries: [],
    currentStreak: 0,
    totalEntries: 0,
    lastEntryDate: null
  }
}

export type JournalStore = {
  load: () => JournalState
  save: (state: JournalState) => void
}

const isJournalState = (state: unknown): state is JournalState => {
  if (!state || typeof state !== 'object') return false
  const candidate = state as Partial<JournalState>
  return Array.isArray(candidate.entries) && typeof candidate.currentStreak === 'number' && typeof candidate.totalEntries === 'number'
}

export const createJournalBrowserStore = (storageKey = 'journal-state'): JournalStore => ({
  load: () => {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return createInitialJournalState()
    try {
      const parsed = JSON.parse(stored) as unknown
      return isJournalState(parsed) ? parsed : createInitialJournalState()
    } catch {
      return createInitialJournalState()
    }
  },
  save: (state) => {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  }
})

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getWeekStartDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + 1)
  return d.toISOString().slice(0, 10)
}

export function getMonthStartDate(): string {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

export function createJournalEntry(
  state: JournalState,
  entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
): JournalState {
  const id = `journal-${Date.now()}`
  const now = new Date().toISOString()
  const newEntry: JournalEntry = {
    ...entry,
    id,
    createdAt: now,
    updatedAt: now
  }

  const newEntries = [newEntry, ...state.entries]
  const newState = {
    ...state,
    entries: newEntries,
    totalEntries: state.totalEntries + 1,
    lastEntryDate: entry.date
  }

  return recalculateJournalStreak(newState)
}

export function updateJournalEntry(
  state: JournalState,
  id: string,
  updates: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>
): JournalState {
  const newEntries = state.entries.map((entry) =>
    entry.id === id
      ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
      : entry
  )
  return { ...state, entries: newEntries }
}

export function deleteJournalEntry(state: JournalState, id: string): JournalState {
  const newEntries = state.entries.filter((e) => e.id !== id)
  return {
    ...state,
    entries: newEntries,
    totalEntries: Math.max(0, state.totalEntries - 1)
  }
}

export function getEntryByDate(
  state: JournalState,
  date: string,
  type: JournalEntry['type'] = 'daily'
): JournalEntry | undefined {
  return state.entries.find((e) => e.date === date && e.type === type)
}

export function getEntriesByType(
  state: JournalState,
  type: JournalEntry['type']
): JournalEntry[] {
  return state.entries.filter((e) => e.type === type)
}

export function getEntriesByDateRange(
  state: JournalState,
  startDate: string,
  endDate: string
): JournalEntry[] {
  return state.entries.filter((e) => e.date >= startDate && e.date <= endDate)
}

export function getMoodStats(
  state: JournalState,
  days: number = 30
): { date: string; mood: JournalEntry['mood']; score: number }[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  return state.entries
    .filter((e) => e.type === 'daily' && e.date >= cutoffStr)
    .map((e) => ({ date: e.date, mood: e.mood, score: e.moodScore }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function getAverageMoodScore(state: JournalState, days: number = 7): number {
  const recentEntries = state.entries
    .filter((e) => e.type === 'daily')
    .slice(0, days)

  if (recentEntries.length === 0) return 0
  const total = recentEntries.reduce((sum, e) => sum + e.moodScore, 0)
  return Math.round((total / recentEntries.length) * 10) / 10
}

export function getWeeklyReflection(state: JournalState): {
  weekStart: string
  entries: JournalEntry[]
  avgMood: number
  totalHighlights: number
  totalChallenges: number
} {
  const weekStart = getWeekStartDate()
  const today = getTodayDateString()
  const weekEntries = getEntriesByDateRange(state, weekStart, today)

  const scores = weekEntries.filter((e) => e.type === 'daily')
  const avgMood = scores.length > 0
    ? Math.round((scores.reduce((s, e) => s + e.moodScore, 0) / scores.length) * 10) / 10
    : 0

  return {
    weekStart,
    entries: weekEntries,
    avgMood,
    totalHighlights: weekEntries.reduce((s, e) => s + e.highlights.length, 0),
    totalChallenges: weekEntries.reduce((s, e) => s + e.challenges.length, 0)
  }
}

function recalculateJournalStreak(state: JournalState): JournalState {
  const today = getTodayDateString()
  let streak = 0
  const dates = [...new Set(
    state.entries
      .filter((e) => e.type === 'daily')
      .map((e) => e.date)
  )].sort().reverse()

  if (dates.length === 0) return { ...state, currentStreak: 0 }

  if (dates[0] === today || dates[0] === getDateOffset(-1)) {
    streak = 1
    for (let i = 1; i < dates.length; i++) {
      const expected = getDateOffset(-i, new Date(dates[0]))
      if (dates[i] === expected) {
        streak++
      } else {
        break
      }
    }
  }

  return { ...state, currentStreak: streak }
}

function getDateOffset(offset: number, from?: Date): string {
  const d = from ? new Date(from) : new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
