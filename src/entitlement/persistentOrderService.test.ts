import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPersistentOrderService, persistentOrderService } from './persistentOrderService'

describe('PersistentOrderService', () => {
  let service: ReturnType<typeof createPersistentOrderService>

  beforeEach(() => {
    window.localStorage.clear()
    service = createPersistentOrderService()
  })

  it('should create order and persist to localStorage', () => {
    const order = service.createOrder({
      userId: 'user-1',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })

    expect(order.id).toBeDefined()
    expect(order.status).toBe('pending')
    expect(service.getOrderById(order.id)).toEqual(order)

    const raw = window.localStorage.getItem('growthos-orders')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!)).toHaveLength(1)
  })

  it('should mark order as paid and update stats', () => {
    const order = service.createOrder({
      userId: 'user-1',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })

    const paidOrder = service.markAsPaid(order.id, 'trade-123')

    expect(paidOrder.status).toBe('paid')
    expect(paidOrder.channelTradeNo).toBe('trade-123')

    const stats = service.getStats()
    expect(stats.totalOrders).toBe(1)
    expect(stats.paidCount).toBe(1)
    expect(stats.totalRevenue).toBe(1800)
  })

  it('should mark order as refunded', () => {
    const order = service.createOrder({
      userId: 'user-1',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })
    service.markAsPaid(order.id, 'trade-123')

    const refundedOrder = service.markAsRefunded(order.id)

    expect(refundedOrder.status).toBe('refunded')
    expect(service.getStats().refundedCount).toBe(1)
  })

  it('should mark order as failed', () => {
    const order = service.createOrder({
      userId: 'user-1',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })

    const failedOrder = service.markAsFailed(order.id)

    expect(failedOrder.status).toBe('failed')
    expect(service.getStats().failedCount).toBe(1)
  })

  it('should list orders by user sorted by createdAt desc', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    const first = service.createOrder({
      userId: 'user-1',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })

    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'))
    const second = service.createOrder({
      userId: 'user-1',
      productId: 'ai_pack_100',
      amount: 990,
      channel: 'alipay'
    })

    vi.setSystemTime(new Date('2026-01-03T00:00:00.000Z'))
    service.createOrder({
      userId: 'user-2',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })

    const orders = service.getOrdersByUser('user-1')

    expect(orders).toHaveLength(2)
    expect(orders[0].id).toBe(second.id)
    expect(orders[1].id).toBe(first.id)

    vi.useRealTimers()
  })

  it('should load orders from localStorage', async () => {
    const order = service.createOrder({
      userId: 'user-1',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })

    const newService = createPersistentOrderService()
    await newService.loadFromStorage()

    expect(newService.getOrderById(order.id)).toEqual(order)
  })

  it('should handle invalid localStorage data gracefully', async () => {
    window.localStorage.setItem('growthos-orders', 'invalid-json')

    await expect(service.loadFromStorage()).resolves.toBeUndefined()
    expect(service.getAllOrders()).toHaveLength(0)
  })

  it('should expose singleton instance', () => {
    expect(persistentOrderService).toBeDefined()
    expect(typeof persistentOrderService.createOrder).toBe('function')
    expect(typeof persistentOrderService.getStats).toBe('function')
  })
})
