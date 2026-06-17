export interface PaymentStatusMessage {
  type: 'payment_status'
  orderId: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  tradeNo?: string
  error?: string
}

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

export interface RealtimeMessage {
  id: string
  type: RealtimeMessageType
  spaceId: string
  senderId: string
  targetId?: string
  payload: Record<string, unknown>
  timestamp: string
}

export interface PresenceState {
  userId: string
  spaceId: string
  status: 'online' | 'away' | 'offline'
  lastSeen: string
  currentActivity?: string
}

interface WebSocketLike {
  readyState: number
  send(data: string): void
  close(): void
}

interface ClientInfo {
  ws: WebSocketLike
  userId: string
  spaceIds: Set<string>
}

const clients = new Map<string, Set<WebSocketLike>>()
const clientInfos = new Map<WebSocketLike, ClientInfo>()
const spaceClients = new Map<string, Set<WebSocketLike>>()
const presenceMap = new Map<string, PresenceState>()

export function addClient(userId: string, ws: WebSocketLike): void {
  if (!clients.has(userId)) {
    clients.set(userId, new Set())
  }
  clients.get(userId)!.add(ws)

  const info: ClientInfo = { ws, userId, spaceIds: new Set() }
  clientInfos.set(ws, info)
}

export function removeClient(userId: string, ws: WebSocketLike): void {
  clients.get(userId)?.delete(ws)

  const info = clientInfos.get(ws)
  if (info) {
    info.spaceIds.forEach(spaceId => {
      spaceClients.get(spaceId)?.delete(ws)
    })
    clientInfos.delete(ws)
  }
}

export function subscribeToSpace(userId: string, ws: WebSocketLike, spaceId: string): void {
  const info = clientInfos.get(ws)
  if (!info) return

  info.spaceIds.add(spaceId)

  if (!spaceClients.has(spaceId)) {
    spaceClients.set(spaceId, new Set())
  }
  spaceClients.get(spaceId)!.add(ws)
}

export function unsubscribeFromSpace(userId: string, ws: WebSocketLike, spaceId: string): void {
  const info = clientInfos.get(ws)
  if (info) {
    info.spaceIds.delete(spaceId)
  }
  spaceClients.get(spaceId)?.delete(ws)
}

export function broadcastToUser(userId: string, message: PaymentStatusMessage | RealtimeMessage): void {
  const userClients = clients.get(userId)
  if (!userClients) return

  const data = JSON.stringify(message)
  for (const client of userClients) {
    if (client.readyState === 1) {
      client.send(data)
    }
  }
}

export function broadcastToSpace(spaceId: string, message: RealtimeMessage, excludeUserId?: string): void {
  const members = spaceClients.get(spaceId)
  if (!members) return

  const data = JSON.stringify(message)
  for (const ws of members) {
    if (ws.readyState !== 1) continue
    const info = clientInfos.get(ws)
    if (info && excludeUserId && info.userId === excludeUserId) continue
    ws.send(data)
  }
}

export function sendToUser(userId: string, message: RealtimeMessage): void {
  broadcastToUser(userId, message)
}

export function updatePresence(userId: string, spaceId: string, status: PresenceState['status'], currentActivity?: string): void {
  const key = `${spaceId}:${userId}`
  const presence: PresenceState = {
    userId,
    spaceId,
    status,
    lastSeen: new Date().toISOString(),
    currentActivity
  }
  presenceMap.set(key, presence)

  broadcastToSpace(spaceId, {
    id: `presence_${Date.now()}`,
    type: 'presence_update',
    spaceId,
    senderId: userId,
    payload: { status, currentActivity: currentActivity ?? null }
  }, userId)
}

export function getPresence(spaceId: string): PresenceState[] {
  const result: PresenceState[] = []
  presenceMap.forEach(p => {
    if (p.spaceId === spaceId) result.push(p)
  })
  return result
}

export function getClientCount(userId: string): number {
  return clients.get(userId)?.size || 0
}

export function getSpaceClientCount(spaceId: string): number {
  return spaceClients.get(spaceId)?.size || 0
}
