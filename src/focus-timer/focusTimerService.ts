export interface FocusSession {
  id: string
  subject: string
  durationMinutes: number
  startedAt: string
  completedAt: string
  completed: boolean
}

export interface FocusTimerState {
  sessions: FocusSession[]
  defaultDuration: number
}

export interface FocusStats {
  todayMinutes: number
  weekMinutes: number
  monthMinutes: number
  totalSessions: number
  completedSessions: number
  dailyStats: { date: string; minutes: number }[]
  subjectStats: { subject: string; minutes: number; sessions: number }[]
}

const STORAGE_KEY = 'xinghuanhai-focustimer-state'

function loadState(): FocusTimerState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { sessions: [], defaultDuration: 25 }
}

function saveState(state: FocusTimerState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getSessions(): FocusSession[] {
  return loadState().sessions
}

export function getDefaultDuration(): number {
  return loadState().defaultDuration
}

export function setDefaultDuration(minutes: number): void {
  const state = loadState()
  state.defaultDuration = minutes
  saveState(state)
}

export function addSession(session: Omit<FocusSession, 'id'>): FocusSession {
  const state = loadState()
  const newSession: FocusSession = {
    ...session,
    id: crypto.randomUUID(),
  }
  state.sessions.unshift(newSession)
  saveState(state)
  return newSession
}

export function updateSession(id: string, updates: Partial<FocusSession>): FocusSession | null {
  const state = loadState()
  const index = state.sessions.findIndex((s) => s.id === id)
  if (index === -1) return null
  state.sessions[index] = { ...state.sessions[index], ...updates }
  saveState(state)
  return state.sessions[index]
}

export function deleteSession(id: string): boolean {
  const state = loadState()
  const index = state.sessions.findIndex((s) => s.id === id)
  if (index === -1) return false
  state.sessions.splice(index, 1)
  saveState(state)
  return true
}

export function getFocusStats(): FocusStats {
  const sessions = loadState().sessions
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let todayMinutes = 0
  let weekMinutes = 0
  let monthMinutes = 0
  let completedSessions = 0

  const dailyMap: Record<string, number> = {}
  const subjectMap: Record<string, { minutes: number; sessions: number }> = {}

  for (const s of sessions) {
    if (!s.completed) continue
    completedSessions++

    const dateStr = s.startedAt.slice(0, 10)
    const startedDate = new Date(s.startedAt)

    if (dateStr === todayStr) {
      todayMinutes += s.durationMinutes
    }

    if (startedDate >= weekStart) {
      weekMinutes += s.durationMinutes
    }

    if (startedDate >= monthStart) {
      monthMinutes += s.durationMinutes
    }

    dailyMap[dateStr] = (dailyMap[dateStr] || 0) + s.durationMinutes

    if (s.subject) {
      if (!subjectMap[s.subject]) {
        subjectMap[s.subject] = { minutes: 0, sessions: 0 }
      }
      subjectMap[s.subject].minutes += s.durationMinutes
      subjectMap[s.subject].sessions++
    }
  }

  const dailyStats = Object.entries(dailyMap)
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const subjectStats = Object.entries(subjectMap)
    .map(([subject, stats]) => ({ subject, ...stats }))
    .sort((a, b) => b.minutes - a.minutes)

  return {
    todayMinutes,
    weekMinutes,
    monthMinutes,
    totalSessions: sessions.length,
    completedSessions,
    dailyStats,
    subjectStats,
  }
}

export function getTodaySessions(): FocusSession[] {
  const sessions = loadState().sessions
  const todayStr = new Date().toISOString().slice(0, 10)
  return sessions.filter((s) => s.startedAt.slice(0, 10) === todayStr)
}
