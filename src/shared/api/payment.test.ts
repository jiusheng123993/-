import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createOrder, getOrder, getUserOrders, refundOrder } from './payment'
import { devSessionToAuthSession, defaultDevUserSession } from '../auth/devAuthSession'

const defaultAuthSession = devSessionToAuthSession(defaultDevUserSession)

describe('Payment API', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    vi.stubGlobal('import.meta', { env: { VITE_API_URL: '' } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('createOrder', () => {
    it('should create order successfully with auth header', async () => {
      const mockResponse = {
        orderId: 'order-123',
        amount: 1800,
        status: 'pending'
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await createOrder({
        userId: 'dev-user-001',
        productId: 'study_monthly',
        channel: 'wechat'
      }, defaultAuthSession)

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer dev-user:dev-user-001'
          }
        })
      )
    })

    it('should throw error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid product' })
      })

      await expect(createOrder({
        userId: 'dev-user-001',
        productId: 'invalid',
        channel: 'wechat'
      }, defaultAuthSession)).rejects.toThrow('Invalid product')
    })
  })

  describe('getOrder', () => {
    it('should get order by id with auth header', async () => {
      const mockOrder = {
        orderId: 'order-123',
        status: 'paid'
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder
      })

      const result = await getOrder('order-123', defaultAuthSession)
      expect(result).toEqual(mockOrder)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders/order-123'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer dev-user:dev-user-001' }
        })
      )
    })

    it('should throw response error when order not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Order not found' })
      })

      await expect(getOrder('invalid', defaultAuthSession)).rejects.toThrow('Order not found')
    })
  })

  describe('getUserOrders', () => {
    it('should get user orders with auth header', async () => {
      const mockOrders = [
        { orderId: 'order-1', status: 'paid' },
        { orderId: 'order-2', status: 'pending' }
      ]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrders
      })

      const result = await getUserOrders('dev-user-001', defaultAuthSession)
      expect(result).toEqual(mockOrders)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders/user/dev-user-001'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer dev-user:dev-user-001' }
        })
      )
    })

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Forbidden' })
      })

      await expect(getUserOrders('dev-user-002', defaultAuthSession)).rejects.toThrow('Forbidden')
    })
  })

  describe('refundOrder', () => {
    it('should refund order with auth header', async () => {
      const mockOrder = { orderId: 'order-123', status: 'refunded' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder
      })

      const result = await refundOrder('order-123', defaultAuthSession)

      expect(result).toEqual(mockOrder)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders/order-123/refund'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer dev-user:dev-user-001'
          }
        })
      )
    })
  })
})
