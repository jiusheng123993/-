export interface PaymentStatusMessage {
  type: 'payment_status'
  orderId: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  tradeNo?: string
  error?: string
}

interface WebSocketLike {
  readyState: number
  send(data: string): void
  close(): void
}

const clients = new Map<string, Set<WebSocketLike>>()

export function addClient(userId: string, ws: WebSocketLike): void {
  if (!clients.has(userId)) {
    clients.set(userId, new Set())
  }
  clients.get(userId)!.add(ws)
}

export function removeClient(userId: string, ws: WebSocketLike): void {
  clients.get(userId)?.delete(ws)
}

export function broadcastToUser(userId: string, message: PaymentStatusMessage): void {
  const userClients = clients.get(userId)
  if (!userClients) return

  const data = JSON.stringify(message)
  for (const client of userClients) {
    if (client.readyState === 1) {
      client.send(data)
    }
  }
}

export function getClientCount(userId: string): number {
  return clients.get(userId)?.size || 0
}
