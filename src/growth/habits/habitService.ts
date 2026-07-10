export interface Habit {
  id: string
  name: string
  icon: string
  category: 'health' | 'learning' | 'work' | 'life' | 'mindfulness'
  target: number
  unit: string
  color: string
  isActive: boolean
}

export interface HabitRecord {
  habitId: string
  date: string
  value: number
  completed: boolean
}

export interface HabitState {
  habits: Habit[]
  records: HabitRecord[]
  currentStreak: Record<string, number>
  bestStreak: Record<string, number>
}

export const DEFAULT_HABITS: Omit<Habit, 'isActive'>[] = [
  {
    id: 'drink-water',
    name: '喝水',
    icon: '💧',
    category: 'health',
    target: 8,
    unit: '杯',
    color: '#3b82f6'
  },
  {
    id: 'exercise',
    name: '运动',
    icon: '🏃',
    category: 'health',
    target: 30,
    unit: '分钟',
    color: '#10b981'
  },
  {
    id: 'read',
    name: '阅读',
    icon: '📖',
    category: 'learning',
    target: 30,
    unit: '分钟',
    color: '#8b5cf6'
  },
  {
    id: 'meditate',
    name: '冥想',
    icon: '🧘',
    category: 'mindfulness',
    target: 10,
    unit: '分钟',
    color: '#f59e0b'
  },
  {
    id: 'sleep-early',
    name: '早睡',
    icon: '😴',
    category: 'health',
    target: 1,
    unit: '次',
    color: '#6366f1'
  },
  {
    id: 'journal',
    name: '写日记',
    icon: '✍️',
    category: 'mindfulness',
    target: 1,
    unit: '篇',
    color: '#ec4899'
  },
  {
    id: 'code',
    name: '编程',
    icon: '💻',
    category: 'work',
    target: 60,
    unit: '分钟',
    color: '#06b6d4'
  },
  {
    id: 'walk',
    name: '散步',
    icon: '🚶',
    category: 'health',
    target: 5000,
    unit: '步',
    color: '#84cc16'
  },
  {
    id: 'gratitude',
    name: '感恩',
    icon: '🙏',
    category: 'mindfulness',
    target: 1,
    unit: '次',
    color: '#f97316'
  },
  {
    id: 'study',
    name: '学习',
    icon: '📚',
    category: 'learning',
    target: 60,
    unit: '分钟',
    color: '#a855f7'
  }
]

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function createInitialHabitState(): HabitState {
  return {
    habits: DEFAULT_HABITS.map((h) => ({ ...h, isActive: true })),
    records: [],
    currentStreak: {},
    bestStreak: {}
  }
}

export function toggleHabit(state: HabitState, habitId: string, date: string): HabitState {
  const habit = state.habits.find((h) => h.id === habitId)
  if (!habit) return state

  const existingRecord = state.records.find(
    (r) => r.habitId === habitId && r.date === date
  )

  let newRecords: HabitRecord[]
  if (existingRecord) {
    newRecords = state.records.filter((r) => !(r.habitId === habitId && r.date === date))
  } else {
    newRecords = [
      ...state.records,
      { habitId, date, value: habit.target, completed: true }
    ]
  }

  const newState = { ...state, records: newRecords }
  return recalculateStreaks(newState)
}

export function updateHabitProgress(
  state: HabitState,
  habitId: string,
  date: string,
  value: number
): HabitState {
  const existingIndex = state.records.findIndex(
    (r) => r.habitId === habitId && r.date === date
  )

  let newRecords: HabitRecord[]
  const habit = state.habits.find((h) => h.id === habitId)
  const completed = habit ? value >= habit.target : false

  if (existingIndex >= 0) {
    newRecords = [...state.records]
    newRecords[existingIndex] = { habitId, date, value, completed }
  } else {
    newRecords = [...state.records, { habitId, date, value, completed }]
  }

  return recalculateStreaks({ ...state, records: newRecords })
}

function recalculateStreaks(state: HabitState): HabitState {
  const currentStreak: Record<string, number> = {}
  const bestStreak: Record<string, number> = { ...state.bestStreak }

  for (const habit of state.habits) {
    const habitRecords = state.records
      .filter((r) => r.habitId === habit.id && r.completed)
      .map((r) => r.date)
      .sort()
      .reverse()

    let streak = 0
    const today = getTodayDateString()
    const yesterday = getDateOffset(-1)

    if (habitRecords[0] === today || habitRecords[0] === yesterday) {
      streak = 1
      const startDate = habitRecords[0]
      for (let i = 1; i < habitRecords.length; i++) {
        const expectedDate = getDateOffset(-i, new Date(startDate))
        if (habitRecords[i] === expectedDate) {
          streak++
        } else {
          break
        }
      }
    }

    currentStreak[habit.id] = streak
    bestStreak[habit.id] = Math.max(bestStreak[habit.id] || 0, streak)
  }

  return { ...state, currentStreak, bestStreak }
}

function getDateOffset(offset: number, from?: Date): string {
  const d = from ? new Date(from) : new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export function getTodayHabitRecords(state: HabitState, date?: string): HabitRecord[] {
  const today = date || getTodayDateString()
  return state.records.filter((r) => r.date === today)
}

export function getHabitCompletionRate(state: HabitState, date?: string): number {
  const todayRecords = getTodayHabitRecords(state, date)
  const activeHabits = state.habits.filter((h) => h.isActive)
  if (activeHabits.length === 0) return 0
  const completed = todayRecords.filter((r) => r.completed).length
  return Math.round((completed / activeHabits.length) * 100)
}

export function addCustomHabit(
  state: HabitState,
  habit: Omit<Habit, 'isActive'>
): HabitState {
  return {
    ...state,
    habits: [...state.habits, { ...habit, isActive: true }]
  }
}

export function removeHabit(state: HabitState, habitId: string): HabitState {
  return {
    ...state,
    habits: state.habits.filter((h) => h.id !== habitId),
    records: state.records.filter((r) => r.habitId !== habitId)
  }
}

export interface HabitStore {
  load: () => HabitState
  save: (state: HabitState) => void
}

export function createHabitBrowserStore(storageKey = 'habit-state'): HabitStore {
  return {
    load: () => {
      const stored = window.localStorage.getItem(storageKey)
      if (!stored) return createInitialHabitState()
      try {
        return JSON.parse(stored) as HabitState
      } catch {
        return createInitialHabitState()
      }
    },
    save: (state) => {
      window.localStorage.setItem(storageKey, JSON.stringify(state))
    }
  }
}