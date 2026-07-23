import type {
  RealtimeConnectionState,
  RealtimeConfig,
  RealtimeEventHandler,
  RealtimeMessage,
  PresenceState
} from '../../duo/relationship/realtimeTypes'
import { DEFAULT_REALTIME_CONFIG, REALTIME_CONSTRAINTS } from '../../duo/relationship/realtimeTypes'

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
let ws: WebSocket | null = null
let reconnectAttempts = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
const messageQueue: RealtimeMessage[] = []
const presenceMap = new Map<string, PresenceState>()

function getWsUrl(): string {
  const base = import.meta.env.VITE_WS_URL || 'ws://localhost:3000'
  return `${base}/ws/realtime`
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

function startHeartbeat(): void {
  stopHeartbeat()
  heartbeatTimer = setInterval(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'ping' }))
    }
  }, config.heartbeatIntervalMs)
}

function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
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
      doConnect(currentUserId, subscribedSpaces)
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

function doConnect(userId: string, spaceIds: string[]): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.close()
  }

  const url = new URL(getWsUrl())
  url.searchParams.set('userId', userId)
  if (spaceIds.length > 0) {
    url.searchParams.set('spaceIds', spaceIds.join(','))
  }

  try {
    setConnectionState('connecting')
    ws = new WebSocket(url.toString())

    ws.onopen = () => {
      setConnectionState('connected')
      reconnectAttempts = 0
      startHeartbeat()
      flushMessageQueue()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string)

        if (data.type === 'presence_list' && data.spaceId) {
          const presences = data.presences as PresenceState[]
          presences.forEach(p => {
            const key = `${p.spaceId}:${p.userId}`
            presenceMap.set(key, p)
            emitPresenceChange(p)
          })
          return
        }

        if (data.type === 'presence_update') {
          const presence: PresenceState = {
            userId: data.senderId,
            spaceId: data.spaceId,
            status: data.payload.status as PresenceState['status'],
            lastSeen: data.timestamp || new Date().toISOString(),
            currentActivity: data.payload.currentActivity as string | undefined
          }
          const key = `${presence.spaceId}:${presence.userId}`
          presenceMap.set(key, presence)
          emitPresenceChange(presence)
          return
        }

        if (data.type && data.spaceId && data.senderId) {
          const message: RealtimeMessage = {
            id: data.id,
            type: data.type,
            spaceId: data.spaceId,
            senderId: data.senderId,
            targetId: data.targetId,
            payload: data.payload || {},
            timestamp: data.timestamp || new Date().toISOString()
          }
          emitMessage(message)
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onclose = () => {
      stopHeartbeat()
      if (connectionState === 'connected') {
        scheduleReconnect()
      } else {
        setConnectionState('disconnected')
      }
    }

    ws.onerror = () => {
      stopHeartbeat()
      if (connectionState === 'connecting') {
        setConnectionState('error')
        emitError(new Error('WebSocket connection failed'))
        scheduleReconnect()
      }
    }
  } catch (err) {
    setConnectionState('error')
    emitError(err instanceof Error ? err : new Error('WebSocket connection failed'))
    scheduleReconnect()
  }
}

function flushMessageQueue(): void {
  while (messageQueue.length > 0) {
    const message = messageQueue.shift()
    if (message && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }
}

export function createWebSocketRealtimeProvider(overrides?: Partial<RealtimeConfig>): IRealtimeProvider {
  config = { ...DEFAULT_REALTIME_CONFIG, ...overrides }
  presenceMap.clear()
  connectionState = 'disconnected'
  currentUserId = null
  subscribedSpaces = []
  reconnectAttempts = 0
  handlers.clear()
  stopHeartbeat()
  clearReconnect()
  if (ws) {
    ws.close()
    ws = null
  }

  return {
    connect: (userId, spaceIds) => {
      if (connectionState === 'connected' || connectionState === 'connecting') {
        return
      }
      currentUserId = userId
      subscribedSpaces = spaceIds
      doConnect(userId, spaceIds)
    },

    disconnect: () => {
      stopHeartbeat()
      clearReconnect()
      if (ws) {
        ws.close()
        ws = null
      }
      currentUserId = null
      subscribedSpaces = []
      messageQueue.length = 0
      presenceMap.clear()
      setConnectionState('disconnected')
    },

    send: (messageData) => {
      if (connectionState !== 'connected' || !ws) {
        return false
      }
      const message = {
        ...messageData,
        id: `cli_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date().toISOString()
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message))
        return true
      }
      messageQueue.push(message as RealtimeMessage)
      return false
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
      if (!currentUserId || !ws || ws.readyState !== WebSocket.OPEN) return
      subscribedSpaces.forEach(spaceId => {
        ws!.send(JSON.stringify({
          action: 'presence_update',
          spaceId,
          status,
          currentActivity
        }))
        const presence: PresenceState = {
          userId: currentUserId!,
          spaceId,
          status,
          lastSeen: new Date().toISOString(),
          currentActivity
        }
        const key = `${spaceId}:${currentUserId}`
        presenceMap.set(key, presence)
        emitPresenceChange(presence)
      })
    }
  }
}

export const websocketRealtimeProvider = createWebSocketRealtimeProvider()
