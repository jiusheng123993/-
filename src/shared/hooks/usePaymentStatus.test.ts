import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePaymentStatus } from './usePaymentStatus'
import { paymentWebSocket } from '../services/websocket'

vi.mock('../services/websocket', () => ({
  paymentWebSocket: {
    onPaymentStatus: vi.fn(() => vi.fn())
  }
}))

describe('usePaymentStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return null when orderId is undefined', () => {
    const { result } = renderHook(() => usePaymentStatus(undefined))
    expect(result.current).toBeNull()
  })

  it('should register WebSocket callback', () => {
    const { result } = renderHook(() => usePaymentStatus('order-123'))

    expect(paymentWebSocket.onPaymentStatus).toHaveBeenCalled()
    expect(result.current).toBeNull()
  })

  it('should update status when payment is paid', () => {
    const mockCallback = vi.fn()
    vi.mocked(paymentWebSocket.onPaymentStatus).mockReturnValueOnce(mockCallback)

    const { result } = renderHook(() => usePaymentStatus('order-123'))

    const callback = vi.mocked(paymentWebSocket.onPaymentStatus).mock.calls[0][0]
    
    act(() => {
      callback({
        type: 'payment_status',
        orderId: 'order-123',
        status: 'paid',
        tradeNo: 'trade-123'
      })
    })

    expect(result.current).toEqual({
      orderId: 'order-123',
      status: 'paid',
      tradeNo: 'trade-123'
    })
  })

  it('should not update status for different orderId', () => {
    const mockCallback = vi.fn()
    vi.mocked(paymentWebSocket.onPaymentStatus).mockReturnValueOnce(mockCallback)

    renderHook(() => usePaymentStatus('order-123'))

    const callback = vi.mocked(paymentWebSocket.onPaymentStatus).mock.calls[0][0]
    
    act(() => {
      callback({
        type: 'payment_status',
        orderId: 'order-456',
        status: 'paid'
      })
    })
  })

  it('should unsubscribe on unmount', () => {
    const unsubscribe = vi.fn()
    vi.mocked(paymentWebSocket.onPaymentStatus).mockReturnValueOnce(unsubscribe)

    const { unmount } = renderHook(() => usePaymentStatus('order-123'))
    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
})
