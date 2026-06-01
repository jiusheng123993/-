import { describe, it, expect } from 'vitest'
import { paymentWebSocket } from './websocket'

describe('PaymentWebSocket', () => {
  describe('exported instance', () => {
    it('should have required methods', () => {
      expect(typeof paymentWebSocket.connect).toBe('function')
      expect(typeof paymentWebSocket.onPaymentStatus).toBe('function')
      expect(typeof paymentWebSocket.disconnect).toBe('function')
      expect(typeof paymentWebSocket.send).toBe('function')
      expect(typeof paymentWebSocket.isConnected).toBe('function')
    })

    it('should have empty callbacks set initially', () => {
      expect(paymentWebSocket.disconnect()).toBeUndefined()
    })
  })
})
