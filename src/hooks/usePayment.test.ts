import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePayment } from './usePayment'
import { initiatePayment, waitForPayment } from '../services/paymentService'

vi.mock('../services/paymentService')

describe('usePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have initial idle state', () => {
    const { result } = renderHook(() => usePayment('user-123'))
    expect(result.current.status).toBe('idle')
    expect(result.current.orderId).toBeUndefined()
    expect(result.current.error).toBeUndefined()
  })

  it('should fail when userId is not provided', async () => {
    const { result } = renderHook(() => usePayment(undefined))

    await act(async () => {
      await result.current.startPayment('study_monthly', 'wechat')
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.error).toBe('Please login first')
  })

  it('should start payment flow successfully', async () => {
    vi.mocked(initiatePayment).mockResolvedValueOnce({
      orderId: 'order-123',
      paymentParams: { appId: 'test' }
    })
    vi.mocked(waitForPayment).mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => usePayment('user-123'))

    await act(async () => {
      await result.current.startPayment('study_monthly', 'wechat')
    })

    expect(initiatePayment).toHaveBeenCalledWith('user-123', 'study_monthly', 'wechat')
    expect(result.current.status).toBe('success')
    expect(result.current.orderId).toBe('order-123')
  })

  it('should handle payment failure', async () => {
    vi.mocked(initiatePayment).mockResolvedValueOnce({
      orderId: 'order-123',
      paymentParams: {}
    })
    vi.mocked(waitForPayment).mockResolvedValueOnce({
      success: false,
      error: 'Payment cancelled'
    })

    const { result } = renderHook(() => usePayment('user-123'))

    await act(async () => {
      await result.current.startPayment('study_monthly', 'wechat')
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.error).toBe('Payment cancelled')
  })

  it('should handle payment initiation error', async () => {
    vi.mocked(initiatePayment).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => usePayment('user-123'))

    await act(async () => {
      await result.current.startPayment('study_monthly', 'wechat')
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.error).toBe('Network error')
  })

  it('should reset state', async () => {
    vi.mocked(initiatePayment).mockResolvedValueOnce({
      orderId: 'order-123',
      paymentParams: {}
    })
    vi.mocked(waitForPayment).mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => usePayment('user-123'))

    await act(async () => {
      await result.current.startPayment('study_monthly', 'wechat')
    })

    expect(result.current.status).toBe('success')

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.orderId).toBeUndefined()
  })
})
