import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initiatePayment, waitForPayment, pollPaymentStatus } from './paymentService'

vi.mock('./websocket', () => ({
  paymentWebSocket: {
    onPaymentStatus: vi.fn(() => vi.fn())
  }
}))

vi.mock('../api/payment', () => ({
  createOrder: vi.fn(),
  getOrder: vi.fn()
}))

describe('PaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initiatePayment', () => {
    it('should initiate payment and return orderId', async () => {
      const { createOrder } = await import('../api/payment')
      vi.mocked(createOrder).mockResolvedValue({
        orderId: 'order-123',
        paymentParams: { appId: 'test' }
      })

      const result = await initiatePayment('user-123', 'study_monthly', 'wechat')
      expect(result.orderId).toBe('order-123')
      expect(result.paymentParams).toEqual({ appId: 'test' })
    })

    it('should throw error when API fails', async () => {
      const { createOrder } = await import('../api/payment')
      vi.mocked(createOrder).mockRejectedValue(new Error('Network error'))

      await expect(initiatePayment('user-123', 'study_monthly', 'wechat'))
        .rejects.toThrow('Network error')
    })
  })

  describe('waitForPayment', () => {
    it('should resolve with success when payment is paid', async () => {
      const { paymentWebSocket } = await import('./websocket')
      vi.mocked(paymentWebSocket.onPaymentStatus).mockImplementation((cb) => {
        setTimeout(() => {
          cb({
            type: 'payment_status',
            orderId: 'order-123',
            status: 'paid'
          })
        }, 10)
        return vi.fn()
      })

      const result = await waitForPayment('order-123', 1000)
      expect(result.success).toBe(true)
      expect(result.orderId).toBe('order-123')
    })

    it('should resolve with failure when payment fails', async () => {
      const { paymentWebSocket } = await import('./websocket')
      vi.mocked(paymentWebSocket.onPaymentStatus).mockImplementation((cb) => {
        setTimeout(() => {
          cb({
            type: 'payment_status',
            orderId: 'order-123',
            status: 'failed',
            error: 'Payment cancelled'
          })
        }, 10)
        return vi.fn()
      })

      const result = await waitForPayment('order-123', 1000)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Payment cancelled')
    })

    it('should timeout when payment takes too long', async () => {
      const { paymentWebSocket } = await import('./websocket')
      vi.mocked(paymentWebSocket.onPaymentStatus).mockImplementation(() => vi.fn())

      const result = await waitForPayment('order-123', 50)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Payment timeout')
    })
  })

  describe('pollPaymentStatus', () => {
    it('should return success when order is paid', async () => {
      const { getOrder } = await import('../api/payment')
      vi.mocked(getOrder)
        .mockResolvedValueOnce({ status: 'pending' })
        .mockResolvedValueOnce({ status: 'paid' })

      const result = await pollPaymentStatus('order-123', 10, 3)
      expect(result.success).toBe(true)
    })

    it('should return failure when order fails', async () => {
      const { getOrder } = await import('../api/payment')
      vi.mocked(getOrder).mockResolvedValue({ status: 'failed' })

      const result = await pollPaymentStatus('order-123', 10, 3)
      expect(result.success).toBe(false)
    })

    it('should timeout after max attempts', async () => {
      const { getOrder } = await import('../api/payment')
      vi.mocked(getOrder).mockResolvedValue({ status: 'pending' })

      const result = await pollPaymentStatus('order-123', 5, 3)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Payment timeout')
    })
  })
})
