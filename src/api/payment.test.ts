import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createOrder, getOrder, getUserOrders } from './payment'

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
    it('should create order successfully', async () => {
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
        userId: 'user-123',
        productId: 'study_monthly',
        channel: 'wechat'
      })

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('should throw error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid product' })
      })

      await expect(createOrder({
        userId: 'user-123',
        productId: 'invalid',
        channel: 'wechat'
      })).rejects.toThrow('Invalid product')
    })
  })

  describe('getOrder', () => {
    it('should get order by id', async () => {
      const mockOrder = {
        orderId: 'order-123',
        status: 'paid'
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder
      })

      const result = await getOrder('order-123')
      expect(result).toEqual(mockOrder)
    })

    it('should throw error when order not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      })

      await expect(getOrder('invalid')).rejects.toThrow('Failed to get order')
    })
  })

  describe('getUserOrders', () => {
    it('should get user orders', async () => {
      const mockOrders = [
        { orderId: 'order-1', status: 'paid' },
        { orderId: 'order-2', status: 'pending' }
      ]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrders
      })

      const result = await getUserOrders('user-123')
      expect(result).toEqual(mockOrders)
    })

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      })

      await expect(getUserOrders('user-123')).rejects.toThrow('Failed to get orders')
    })
  })
})
