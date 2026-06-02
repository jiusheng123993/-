import type { LocalStorageLike, MemoryEvent, MemoryFact, MemoryScope, MemoryState, MemoryStore } from './memoryTypes'
import type { MemoryProfile } from './memoryProfile'

const defaultMemoryStorageKey = 'growth-workbench-memory-state'

const sameScope = (left: MemoryScope, right: MemoryScope) => left.userId === right.userId && left.projectId === right.projectId

const cloneMemoryState = (state: MemoryState): MemoryState => structuredClone(state)

const normalizeConfidence = (confidence: number) => Math.max(0, Math.min(1, confidence))

const normalizeEvent = (event: MemoryEvent): MemoryEvent => ({
  ...event,
  confidence: normalizeConfidence(event.confidence),
  tags: Array.from(new Set(event.tags))
})

const isActiveAt = (event: MemoryEvent, now?: string) => {
  if (event.status !== 'active') return false
  if (!now || !event.expiresAt) return true
  return event.expiresAt > now
}

const toFact = (event: MemoryEvent): MemoryFact => ({
  eventId: event.id,
  kind: event.kind,
  content: event.content,
  confidence: event.confidence,
  tags: event.tags,
  updatedAt: event.updatedAt
})

const sortFacts = (facts: MemoryFact[]) => [...facts].sort((left, right) => right.confidence - left.confidence || right.updatedAt.localeCompare(left.updatedAt))

const isMemoryState = (state: unknown): state is MemoryState => {
  if (!state || typeof state !== 'object') return false
  const candidate = state as Partial<MemoryState>
  return Array.isArray(candidate.events) && Array.isArray(candidate.profiles) && candidate.settings?.mode === 'local-first'
}

export const createInitialMemoryState = (): MemoryState => ({
  events: [],
  profiles: [],
  settings: {
    mode: 'local-first',
    provider: 'local'
  }
})

export const deriveMemoryProfile = (scope: MemoryScope, events: MemoryEvent[], generatedAt: string): MemoryProfile => {
  const activeEvents = events.filter((event) => sameScope(event.scope, scope) && isActiveAt(event, generatedAt))
  const staticFacts = sortFacts(activeEvents.filter((event) => event.kind === 'preference' || event.kind === 'goal' || event.kind === 'habit').map(toFact))
  const dynamicContext = sortFacts(activeEvents.filter((event) => event.kind === 'context').map(toFact))
  const constraints = sortFacts(activeEvents.filter((event) => event.kind === 'constraint' || event.kind === 'system').map(toFact))

  return {
    scope,
    staticFacts,
    dynamicContext,
    constraints,
    generatedAt
  }
}

export const buildMemoryPromptContext = (profile: MemoryProfile, events: MemoryEvent[]) => {
  const activeContents = new Set(events.filter((event) => event.status === 'active').map((event) => event.content))
  const formatFacts = (facts: MemoryFact[]) => facts.filter((fact) => activeContents.has(fact.content)).map((fact) => `- ${fact.content}`)
  const sections = [
    ['长期画像', formatFacts(profile.staticFacts)],
    ['近期上下文', formatFacts(profile.dynamicContext)],
    ['限制条件', formatFacts(profile.constraints)]
  ] as const

  return sections
    .filter(([, lines]) => lines.length > 0)
    .map(([title, lines]) => `${title}\n${lines.join('\n')}`)
    .join('\n\n')
}

export const createInMemoryMemoryStore = (initialState = createInitialMemoryState()): MemoryStore => {
  let state = cloneMemoryState(initialState)

  return {
    load: () => cloneMemoryState(state),
    save: (nextState) => {
      state = cloneMemoryState(nextState)
    },
    appendEvent: (event) => {
      state = {
        ...state,
        events: [...state.events.filter((storedEvent) => storedEvent.id !== event.id), normalizeEvent(event)]
      }
    },
    listEvents: (scope) => state.events.filter((event) => sameScope(event.scope, scope) && event.status === 'active'),
    forgetEvent: (eventId, forgottenAt) => {
      let changed = false
      state = {
        ...state,
        events: state.events.map((event) => {
          if (event.id !== eventId || event.status !== 'active') return event
          changed = true
          return { ...event, status: 'forgotten', updatedAt: forgottenAt }
        })
      }
      return changed
    },
    clearExpired: (now) => {
      let expiredCount = 0
      state = {
        ...state,
        events: state.events.map((event) => {
          if (event.status !== 'active' || !event.expiresAt || event.expiresAt > now) return event
          expiredCount += 1
          return { ...event, status: 'expired', updatedAt: now }
        })
      }
      return expiredCount
    }
  }
}

export const createBrowserMemoryStore = (storage: LocalStorageLike = window.localStorage, storageKey = defaultMemoryStorageKey): MemoryStore => {
  const loadState = () => {
    const stored = storage.getItem(storageKey)
    if (!stored) return createInitialMemoryState()
    const parsed = JSON.parse(stored) as unknown
    return isMemoryState(parsed) ? parsed : createInitialMemoryState()
  }

  const persistState = (state: MemoryState) => storage.setItem(storageKey, JSON.stringify(state))
  const memoryStore = createInMemoryMemoryStore(loadState())

  return {
    load: memoryStore.load,
    save: (state) => {
      memoryStore.save(state)
      persistState(memoryStore.load())
    },
    appendEvent: (event) => {
      memoryStore.appendEvent(event)
      persistState(memoryStore.load())
    },
    listEvents: memoryStore.listEvents,
    forgetEvent: (eventId, forgottenAt) => {
      const changed = memoryStore.forgetEvent(eventId, forgottenAt)
      persistState(memoryStore.load())
      return changed
    },
    clearExpired: (now) => {
      const expiredCount = memoryStore.clearExpired(now)
      persistState(memoryStore.load())
      return expiredCount
    }
  }
}
