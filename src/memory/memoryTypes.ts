export type MemoryProviderId = 'local' | 'browser' | 'cloud' | 'supermemory'

export type MemoryMode = 'local-first' | 'cloud-sync'

export type MemoryKind = 'preference' | 'goal' | 'habit' | 'context' | 'constraint' | 'system'

export type MemorySource = 'manual' | 'chat' | 'workspace' | 'review' | 'system'

export type MemoryStatus = 'active' | 'forgotten' | 'expired'

export type MemoryScope = {
  userId: string
  projectId: string
}

export type MemoryEvent = {
  id: string
  scope: MemoryScope
  kind: MemoryKind
  content: string
  source: MemorySource
  confidence: number
  status: MemoryStatus
  tags: string[]
  createdAt: string
  updatedAt: string
  expiresAt: string | null
}

export type MemoryFact = {
  eventId: string
  kind: MemoryKind
  content: string
  confidence: number
  tags: string[]
  updatedAt: string
}

export type MemoryProfile = {
  scope: MemoryScope
  staticFacts: MemoryFact[]
  dynamicContext: MemoryFact[]
  constraints: MemoryFact[]
  generatedAt: string
}

export type MemorySettings = {
  mode: MemoryMode
  provider: MemoryProviderId
}

export type MemoryState = {
  events: MemoryEvent[]
  profiles: MemoryProfile[]
  settings: MemorySettings
}

export type MemoryStore = {
  load: () => MemoryState
  save: (state: MemoryState) => void
  appendEvent: (event: MemoryEvent) => void
  listEvents: (scope: MemoryScope) => MemoryEvent[]
  forgetEvent: (eventId: string, forgottenAt: string) => boolean
  clearExpired: (now: string) => number
}

export type LocalStorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}
