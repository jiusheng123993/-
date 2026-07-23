import type { MemoryScope } from './memoryTypes'

export type MemoryEventSource = 'behavior' | 'conversation' | 'manual_input'

export type MemoryEventCategory =
  | 'task_completion' | 'task_delay' | 'task_creation'
  | 'focus_session' | 'focus_skip'
  | 'plan_followed' | 'plan_deviation'
  | 'conversation_insight'
  | 'milestone_achieved' | 'streak_broken' | 'streak_restored'
  | 'schedule_anomaly' | 'energy_shift'
  | 'goal_change' | 'preference_change'
  | 'user_correction'

export interface MemoryEvent {
  id: string
  source: MemoryEventSource
  category: MemoryEventCategory
  timestamp: string
  summary: string
  metadata?: Record<string, unknown>
  tags?: string[]
  processed: boolean
  processedAt?: string
}

export interface EventFilter {
  from?: string
  to?: string
  categories?: MemoryEventCategory[]
  tags?: string[]
  keyword?: string
  unprocessedOnly?: boolean
  limit?: number
}

export type MemoryEventStore = {
  addEvent: (event: Omit<MemoryEvent, 'id' | 'processed'>) => string
  getEvent: (id: string) => MemoryEvent | undefined
  getEvents: (filter?: EventFilter) => MemoryEvent[]
  updateEvent: (id: string, patch: Partial<Pick<MemoryEvent, 'summary' | 'metadata' | 'tags'>>) => MemoryEvent | undefined
  markEventsProcessed: (ids: string[]) => void
  deleteEvents: (ids: string[]) => number
  countEvents: (filter?: EventFilter) => number
}

const STORAGE_KEY = 'xinghuanhai_memory_events'

function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function matchesFilter(event: MemoryEvent, filter: EventFilter): boolean {
  if (filter.from && event.timestamp < filter.from) return false
  if (filter.to && event.timestamp > filter.to) return false
  if (filter.categories !== undefined && filter.categories.length === 0) return false
  if (filter.categories && filter.categories.length > 0 && !filter.categories.includes(event.category)) return false
  if (filter.tags !== undefined && filter.tags.length === 0) return false
  if (filter.tags && filter.tags.length > 0) {
    const eventTags = event.tags ?? []
    if (!filter.tags.some((tag) => eventTags.includes(tag))) return false
  }
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase()
    if (!event.summary.toLowerCase().includes(kw)) return false
  }
  if (filter.unprocessedOnly && event.processed) return false
  return true
}

export function createInMemoryEventStore(initialEvents: MemoryEvent[] = []): MemoryEventStore {
  let events = [...initialEvents]
  let nextId = 1

  const internalGenerateId = (): string => {
    return `evt_mem_${nextId++}`
  }

  return {
    addEvent: (eventData) => {
      const id = internalGenerateId()
      const event: MemoryEvent = {
        ...eventData,
        id,
        processed: false,
      }
      events.push(event)
      return id
    },

    getEvent: (id) => {
      return events.find((e) => e.id === id)
    },

    getEvents: (filter) => {
      let result = events
      if (filter) {
        result = result.filter((e) => matchesFilter(e, filter))
      }
      result = [...result].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      if (filter?.limit !== undefined && filter.limit >= 0) {
        result = result.slice(0, filter.limit)
      }
      return result
    },

    updateEvent: (id, patch) => {
      const idx = events.findIndex((e) => e.id === id)
      if (idx === -1) return undefined
      events[idx] = { ...events[idx], ...patch }
      return events[idx]
    },

    markEventsProcessed: (ids) => {
      const idSet = new Set(ids)
      const now = new Date().toISOString()
      events = events.map((e) => {
        if (idSet.has(e.id) && !e.processed) {
          return { ...e, processed: true, processedAt: now }
        }
        return e
      })
    },

    deleteEvents: (ids) => {
      const idSet = new Set(ids)
      const before = events.length
      events = events.filter((e) => !idSet.has(e.id))
      return before - events.length
    },

    countEvents: (filter) => {
      if (!filter) return events.length
      return events.filter((e) => matchesFilter(e, filter)).length
    },
  }
}

export function createBrowserEventStore(
  storage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void } = typeof window !== 'undefined' ? window.localStorage : { getItem: () => null, setItem: () => {} },
  storageKey: string = STORAGE_KEY
): MemoryEventStore {
  const loadEvents = (): MemoryEvent[] => {
    try {
      const raw = storage.getItem(storageKey)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const persistEvents = (events: MemoryEvent[]) => {
    storage.setItem(storageKey, JSON.stringify(events))
  }

  let events = loadEvents()

  return {
    addEvent: (eventData) => {
      const id = generateId()
      const event: MemoryEvent = {
        ...eventData,
        id,
        processed: false,
      }
      events.push(event)
      persistEvents(events)
      return id
    },

    getEvent: (id) => {
      return events.find((e) => e.id === id)
    },

    getEvents: (filter) => {
      let result = events
      if (filter) {
        result = result.filter((e) => matchesFilter(e, filter))
      }
      result = [...result].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      if (filter?.limit !== undefined && filter.limit >= 0) {
        result = result.slice(0, filter.limit)
      }
      return result
    },

    updateEvent: (id, patch) => {
      const idx = events.findIndex((e) => e.id === id)
      if (idx === -1) return undefined
      events[idx] = { ...events[idx], ...patch }
      persistEvents(events)
      return events[idx]
    },

    markEventsProcessed: (ids) => {
      const idSet = new Set(ids)
      const now = new Date().toISOString()
      events = events.map((e) => {
        if (idSet.has(e.id) && !e.processed) {
          return { ...e, processed: true, processedAt: now }
        }
        return e
      })
      persistEvents(events)
    },

    deleteEvents: (ids) => {
      const idSet = new Set(ids)
      const before = events.length
      events = events.filter((e) => !idSet.has(e.id))
      persistEvents(events)
      return before - events.length
    },

    countEvents: (filter) => {
      if (!filter) return events.length
      return events.filter((e) => matchesFilter(e, filter)).length
    },
  }
}

export function convertLegacyEvent(
  legacy: {
    id: string
    kind: string
    content: string
    source: string
    tags: string[]
    createdAt: string
  },
  scope: MemoryScope
): Omit<MemoryEvent, 'id' | 'processed'> {
  const categoryMap: Record<string, MemoryEventCategory> = {
    preference: 'preference_change',
    goal: 'goal_change',
    habit: 'focus_session',
    context: 'task_completion',
    constraint: 'user_correction',
    system: 'user_correction',
  }

  const sourceMap: Record<string, MemoryEventSource> = {
    manual: 'manual_input',
    chat: 'conversation',
    workspace: 'behavior',
    review: 'behavior',
    system: 'behavior',
  }

  return {
    source: sourceMap[legacy.source] ?? 'behavior',
    category: categoryMap[legacy.kind] ?? 'task_completion',
    timestamp: legacy.createdAt,
    summary: legacy.content,
    tags: [...legacy.tags, `legacy_kind:${legacy.kind}`, `scope:${scope.userId}:${scope.projectId}`],
  }
}
