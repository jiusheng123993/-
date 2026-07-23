export type RealtimeConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export type RealtimeMessageType =
  | 'task_push'
  | 'task_accept'
  | 'task_reject'
  | 'task_complete'
  | 'habit_check'
  | 'focus_start'
  | 'focus_end'
  | 'focus_pk_invite'
  | 'focus_pk_accept'
  | 'focus_pk_reject'
  | 'focus_pk_complete'
  | 'ranking_update'
  | 'member_join'
  | 'member_leave'
  | 'space_update'
  | 'anniversary_remind'
  | 'goal_progress'
  | 'presence_update'

export type RealtimeMessage = {
  id: string
  type: RealtimeMessageType
  spaceId: string
  senderId: string
  targetId?: string
  payload: Record<string, unknown>
  timestamp: string
}

export type PresenceState = {
  userId: string
  spaceId: string
  status: 'online' | 'away' | 'offline'
  lastSeen: string
  currentActivity?: string
}

export type RealtimeConfig = {
  mode: 'websocket' | 'polling'
  pollingIntervalMs: number
  reconnectMaxRetries: number
  reconnectBaseDelayMs: number
  heartbeatIntervalMs: number
  messageQueueSize: number
}

export type RealtimeEventHandler = {
  onMessage: (message: RealtimeMessage) => void
  onPresenceChange: (presence: PresenceState) => void
  onConnectionChange: (state: RealtimeConnectionState) => void
  onError: (error: Error) => void
}

export const DEFAULT_REALTIME_CONFIG: RealtimeConfig = {
  mode: 'polling',
  pollingIntervalMs: 5000,
  reconnectMaxRetries: 5,
  reconnectBaseDelayMs: 1000,
  heartbeatIntervalMs: 30000,
  messageQueueSize: 100
}

export const REALTIME_CONSTRAINTS = {
  MAX_RECONNECT_DELAY_MS: 30000,
  MIN_POLLING_INTERVAL_MS: 2000,
  MAX_POLLING_INTERVAL_MS: 30000,
  MESSAGE_EXPIRY_MS: 86400000
} as const
