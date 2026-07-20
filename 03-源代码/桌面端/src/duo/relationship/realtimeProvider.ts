import type {
  RealtimeConnectionState,
  RealtimeConfig,
  RealtimeEventHandler,
  RealtimeMessage,
  PresenceState
} from './realtimeTypes'
import { DEFAULT_REALTIME_CONFIG, REALTIME_CONSTRAINTS } from './realtimeTypes'

type InternalMessage = RealtimeMessage & { receivedAt: string }

export type IRealtimeProvider = {
  connect: (userId: string, spaceIds: string[]) => void
  disconnect: () => void
  send: (message: Omit<RealtimeMessage, 'id' | 'timestamp'>) => boolean
  getConnectionState: () => RealtimeConnectionState
  getPresence: (spaceId: string) => PresenceState[]
  on: (handler: Partial<RealtimeEventHandler>) => void
  off: (handler: Partial<RealtimeEventHandler>) => void
  updatePresence: (status: PresenceState['status'], currentActivity?: string) => void
}

const handlers = new Set<Partial<RealtimeEventHandler>>()
let connectionState: RealtimeConnectionState = 'disconnected'
let currentUserId: string | null = null
let subscribedSpaces: string[] = []
let config: RealtimeConfig = { ...DEFAULT_REALTIME_CONFIG }
let pollingTimer: ReturnType<typeof setInterval> | null = null
let reconnectAttempts = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let messageQueue: InternalMessage[] = []
const presenceMap = new Map<string, PresenceState>()

function generateMessageId(): string {
  return `rtm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function setConnectionState(state: RealtimeConnectionState): void {
  connectionState = state
  handlers.forEach(h => h.onConnectionChange?.(state))
}

function emitMessage(message: RealtimeMessage): void {
  handlers.forEach(h => h.onMessage?.(message))
}

function emitPresenceChange(presence: PresenceState): void {
  handlers.forEach(h => h.onPresenceChange?.(presence))
}

function emitError(error: Error): void {
  handlers.forEach(h => h.onError?.(error))
}

function processIncomingMessages(): void {
  const now = Date.now()
  const stored = loadMessageQueue()
  const unexpired = stored.filter(
    m => now - new Date(m.receivedAt).getTime() < REALTIME_CONSTRAINTS.MESSAGE_EXPIRY_MS
  )
  const newMessages = unexpired.filter(m => !messageQueue.some(q => q.id === m.id))
  messageQueue = unexpired.slice(-config.messageQueueSize)
  saveMessageQueue(messageQueue)
  newMessages.forEach(m => {
    const message: RealtimeMessage = {
      id: m.id,
      type: m.type,
      spaceId: m.spaceId,
      senderId: m.senderId,
      targetId: m.targetId,
      payload: m.payload,
      timestamp: m.timestamp
    }
    emitMessage(message)
  })
}

function pollPresence(): void {
  if (!currentUserId) return
  subscribedSpaces.forEach(spaceId => {
    const stored = loadPresenceForSpace(spaceId)
    stored.forEach(p => {
      const key = `${p.spaceId}:${p.userId}`
      const prev = presenceMap.get(key)
      if (!prev || prev.status !== p.status || prev.currentActivity !== p.currentActivity) {
        presenceMap.set(key, p)
        emitPresenceChange(p)
      }
    })
  })
}

function startPolling(): void {
  if (pollingTimer) return
  setConnectionState('connected')
  pollingTimer = setInterval(() => {
    processIncomingMessages()
    pollPresence()
  }, config.pollingIntervalMs)
  processIncomingMessages()
  pollPresence()
}

function stopPolling(): void {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

function scheduleReconnect(): void {
  if (reconnectAttempts >= config.reconnectMaxRetries) {
    setConnectionState('error')
    emitError(new Error(`Max reconnect attempts (${config.reconnectMaxRetries}) reached`))
    return
  }
  const delay = Math.min(
    config.reconnectBaseDelayMs * Math.pow(2, reconnectAttempts),
    REALTIME_CONSTRAINTS.MAX_RECONNECT_DELAY_MS
  )
  reconnectAttempts++
  setConnectionState('reconnecting')
  reconnectTimer = setTimeout(() => {
    if (currentUserId && subscribedSpaces.length > 0) {
      try {
        startPolling()
        reconnectAttempts = 0
      } catch {
        scheduleReconnect()
      }
    }
  }, delay)
}

function clearReconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  reconnectAttempts = 0
}

function loadMessageQueue(): InternalMessage[] {
  try {
    const raw = localStorage.getItem('xinghuanhai_realtime_messages')
    if (!raw) return []
    return JSON.parse(raw) as InternalMessage[]
  } catch {
    return []
  }
}

function saveMessageQueue(queue: InternalMessage[]): void {
  localStorage.setItem('xinghuanhai_realtime_messages', JSON.stringify(queue))
}

function loadPresenceForSpace(spaceId: string): PresenceState[] {
  try {
    const raw = localStorage.getItem(`xinghuanhai_presence_${spaceId}`)
    if (!raw) return []
    return JSON.parse(raw) as PresenceState[]
  } catch {
    return []
  }
}

function savePresenceForSpace(spaceId: string, presences: PresenceState[]): void {
  localStorage.setItem(`xinghuanhai_presence_${spaceId}`, JSON.stringify(presences))
}

export function createRealtimeProvider(overrides?: Partial<RealtimeConfig>): IRealtimeProvider {
  config = { ...DEFAULT_REALTIME_CONFIG, ...overrides }
  messageQueue = []
  presenceMap.clear()
  connectionState = 'disconnected'
  currentUserId = null
  subscribedSpaces = []
  reconnectAttempts = 0
  handlers.clear()
  stopPolling()
  clearReconnect()

  return {
    connect: (userId, spaceIds) => {
      if (connectionState === 'connected' || connectionState === 'connecting') {
        return
      }
      currentUserId = userId
      subscribedSpaces = spaceIds
      setConnectionState('connecting')
      try {
        if (config.mode === 'polling') {
          startPolling()
        } else {
          startPolling()
        }
        clearReconnect()
      } catch (err) {
        setConnectionState('error')
        emitError(err instanceof Error ? err : new Error('Connection failed'))
        scheduleReconnect()
      }
    },

    disconnect: () => {
      stopPolling()
      clearReconnect()
      currentUserId = null
      subscribedSpaces = []
      messageQueue = []
      presenceMap.clear()
      setConnectionState('disconnected')
    },

    send: (messageData) => {
      if (connectionState !== 'connected') {
        return false
      }
      const message: InternalMessage = {
        ...messageData,
        id: generateMessageId(),
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString()
      }
      const queue = loadMessageQueue()
      queue.push(message)
      const trimmed = queue.slice(-config.messageQueueSize)
      saveMessageQueue(trimmed)
      return true
    },

    getConnectionState: () => connectionState,

    getPresence: (spaceId) => {
      const result: PresenceState[] = []
      presenceMap.forEach(p => {
        if (p.spaceId === spaceId) result.push(p)
      })
      return result
    },

    on: (handler) => {
      handlers.add(handler)
    },

    off: (handler) => {
      handlers.delete(handler)
    },

    updatePresence: (status, currentActivity) => {
      if (!currentUserId) return
      subscribedSpaces.forEach(spaceId => {
        const presence: PresenceState = {
          userId: currentUserId!,
          spaceId,
          status,
          lastSeen: new Date().toISOString(),
          currentActivity
        }
        const key = `${spaceId}:${currentUserId}`
        presenceMap.set(key, presence)
        const stored = loadPresenceForSpace(spaceId)
        const idx = stored.findIndex(p => p.userId === currentUserId)
        if (idx >= 0) {
          stored[idx] = presence
        } else {
          stored.push(presence)
        }
        savePresenceForSpace(spaceId, stored)
        emitPresenceChange(presence)
      })
    }
  }
}

export const realtimeProvider = createRealtimeProvider()
