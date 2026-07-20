export interface PaymentStatusMessage {
  type: 'payment_status'
  orderId: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  tradeNo?: string
  error?: string
}

type PaymentStatusCallback = (data: PaymentStatusMessage) => void

class PaymentWebSocket {
  private ws: WebSocket | null = null
  private callbacks: Set<PaymentStatusCallback> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private currentUserId: string | null = null
  private messageQueue: PaymentStatusMessage[] = []

  connect(userId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.currentUserId === userId) {
      return
    }

    this.disconnect()
    this.currentUserId = userId

    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:3000'}/ws/payment?userId=${userId}`
    
    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected')
        this.reconnectAttempts = 0
        this.flushMessageQueue()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as PaymentStatusMessage
          if (data.type === 'payment_status') {
            this.callbacks.forEach((cb) => cb(data))
          }
        } catch (e) {
          console.error('[WebSocket] Failed to parse message', e)
        }
      }

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected')
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error', error)
      }
    } catch (error) {
      console.error('[WebSocket] Failed to connect', error)
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.currentUserId) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
      setTimeout(() => {
        if (this.currentUserId) {
          this.connect(this.currentUserId)
        }
      }, delay)
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message))
      }
    }
  }

  onPaymentStatus(callback: PaymentStatusCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  send(message: PaymentStatusMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      this.messageQueue.push(message)
    }
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
    this.currentUserId = null
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const paymentWebSocket = new PaymentWebSocket()
