import { createStorageService } from '../data/storageFactory'

export interface ScheduleEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  endTime?: string
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  repeatEndDate?: string
  reminderMinutes: number
  color: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface ScheduleState {
  events: ScheduleEvent[]
}

const storage = createStorageService<ScheduleState>('xinghuanhai-schedule-state', { events: [] })

const EVENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6'
]

function generateId(): string {
  return crypto.randomUUID()
}

export function createScheduleService() {
  const state = storage.load()

  const persist = () => storage.save(state)

  return {
    getState(): ScheduleState {
      return state
    },

    getEventsByDate(date: string): ScheduleEvent[] {
      return state.events
        .filter(e => e.date === date)
        .sort((a, b) => a.time.localeCompare(b.time))
    },

    getTodayEvents(): ScheduleEvent[] {
      const today = new Date().toISOString().slice(0, 10)
      return this.getEventsByDate(today)
    },

    getUpcomingEvents(days: number = 7): ScheduleEvent[] {
      const today = new Date().toISOString().slice(0, 10)
      const future = new Date()
      future.setDate(future.getDate() + days)
      const futureStr = future.toISOString().slice(0, 10)

      return state.events
        .filter(e => e.date >= today && e.date <= futureStr)
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date)
          return a.time.localeCompare(b.time)
        })
    },

    getEventsForMonth(year: number, month: number): ScheduleEvent[] {
      const prefix = `${year}-${String(month).padStart(2, '0')}`
      return state.events
        .filter(e => e.date.startsWith(prefix))
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    },

    getDueReminders(): ScheduleEvent[] {
      const now = new Date()
      const todayStr = now.toISOString().slice(0, 10)
      const nowMinutes = now.getHours() * 60 + now.getMinutes()

      return state.events.filter(e => {
        if (e.completed) return false
        if (e.date !== todayStr) return false
        const [h, m] = e.time.split(':').map(Number)
        const eventMinutes = h * 60 + m
        const reminderTime = eventMinutes - e.reminderMinutes
        return nowMinutes >= reminderTime && nowMinutes < eventMinutes + 5
      })
    },

    addEvent(event: Omit<ScheduleEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>): ScheduleEvent {
      const now = new Date().toISOString()
      const newEvent: ScheduleEvent = {
        ...event,
        id: generateId(),
        completed: false,
        createdAt: now,
        updatedAt: now
      }
      state.events.push(newEvent)
      persist()
      return newEvent
    },

    updateEvent(id: string, updates: Partial<Omit<ScheduleEvent, 'id' | 'createdAt'>>): ScheduleEvent | null {
      const index = state.events.findIndex(e => e.id === id)
      if (index === -1) return null
      state.events[index] = {
        ...state.events[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      persist()
      return state.events[index]
    },

    deleteEvent(id: string): boolean {
      const index = state.events.findIndex(e => e.id === id)
      if (index === -1) return false
      state.events.splice(index, 1)
      persist()
      return true
    },

    toggleComplete(id: string): ScheduleEvent | null {
      const event = state.events.find(e => e.id === id)
      if (!event) return null
      return this.updateEvent(id, { completed: !event.completed })
    },

    getEventById(id: string): ScheduleEvent | undefined {
      return state.events.find(e => e.id === id)
    },

    getStats(): { total: number; today: number; upcoming: number; completed: number } {
      const today = new Date().toISOString().slice(0, 10)
      const future = new Date()
      future.setDate(future.getDate() + 7)
      const futureStr = future.toISOString().slice(0, 10)

      return {
        total: state.events.length,
        today: state.events.filter(e => e.date === today).length,
        upcoming: state.events.filter(e => e.date > today && e.date <= futureStr).length,
        completed: state.events.filter(e => e.completed).length
      }
    },

    getEventColors(): string[] {
      return EVENT_COLORS
    }
  }
}

export type ScheduleService = ReturnType<typeof createScheduleService>

export const REPEAT_LABELS: Record<ScheduleEvent['repeat'], string> = {
  none: '不重复',
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
  yearly: '每年'
}

export const REMINDER_OPTIONS = [
  { value: 0, label: '准时' },
  { value: 5, label: '5分钟前' },
  { value: 10, label: '10分钟前' },
  { value: 15, label: '15分钟前' },
  { value: 30, label: '30分钟前' },
  { value: 60, label: '1小时前' },
  { value: 1440, label: '1天前' }
]

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function getWeekdayLabel(dateStr: string): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = new Date(dateStr + 'T00:00:00')
  return weekdays[d.getDay()]
}

export function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10)
}

export function isPast(dateStr: string, timeStr: string): boolean {
  const now = new Date()
  const eventDate = new Date(`${dateStr}T${timeStr}:00`)
  return eventDate < now
}