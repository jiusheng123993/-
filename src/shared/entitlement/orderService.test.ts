import { beforeEach, describe, expect, it } from 'vitest'
import { createOrderService } from './orderService'

describe('OrderService', () => {
  let orderService: ReturnType<typeof createOrderService>

  beforeEach(() => {
    orderService = createOrderService()
  })

  it('should create order with pending status', () => {
    const order = orderService.createOrder({
      userId: 'user-123',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })

    expect(order.status).toBe('pending')
    expect(order.id).toBeTruthy()
    expect(order.createdAt).toBeTruthy()
    expect(order.userId).toBe('user-123')
    expect(order.productId).toBe('study_monthly')
    expect(order.amount).toBe(1800)
    expect(order.channel).toBe('wechat')
  })

  it('should mark order as paid', () => {
    const order = orderService.createOrder({
      userId: 'user-123',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })

    const paidOrder = orderService.markAsPaid(order.id, 'wx-pay-123')
    expect(paidOrder.status).toBe('paid')
    expect(paidOrder.paidAt).toBeTruthy()
    expect(paidOrder.channelTradeNo).toBe('wx-pay-123')
  })

  it('should be idempotent when marking already-paid order', () => {
    const order = orderService.createOrder({
      userId: 'user-123',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })

    const first = orderService.markAsPaid(order.id, 'wx-pay-123')
    const second = orderService.markAsPaid(order.id, 'wx-pay-456')
    expect(second.status).toBe('paid')
    expect(second.channelTradeNo).toBe('wx-pay-123')
    expect(second.paidAt).toBe(first.paidAt)
  })

  it('should throw when marking non-existent order as paid', () => {
    expect(() => orderService.markAsPaid('non-existent', 'wx-123')).toThrow()
  })

  it('should throw when marking refunded order as paid', () => {
    const order = orderService.createOrder({
      userId: 'user-123',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })
    orderService.markAsPaid(order.id, 'wx-pay-123')
    orderService.markAsRefunded(order.id)

    expect(() => orderService.markAsPaid(order.id, 'wx-pay-456')).toThrow()
  })

  it('should mark order as refunded', () => {
    const order = orderService.createOrder({
      userId: 'user-123',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })
    orderService.markAsPaid(order.id, 'wx-pay-123')

    const refunded = orderService.markAsRefunded(order.id)
    expect(refunded.status).toBe('refunded')
    expect(refunded.refundedAt).toBeTruthy()
  })

  it('should throw when refunding non-paid order', () => {
    const order = orderService.createOrder({
      userId: 'user-123',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })
    expect(() => orderService.markAsRefunded(order.id)).toThrow()
  })

  it('should throw when refunding non-existent order', () => {
    expect(() => orderService.markAsRefunded('non-existent')).toThrow()
  })

  it('should get order by id', () => {
    const created = orderService.createOrder({
      userId: 'user-123',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })

    const found = orderService.getOrderById(created.id)
    expect(found?.id).toBe(created.id)
  })

  it('should return undefined for non-existent order id', () => {
    expect(orderService.getOrderById('non-existent')).toBeUndefined()
  })

  it('should get orders by user', () => {
    orderService.createOrder({
      userId: 'user-123',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })
    orderService.createOrder({
      userId: 'user-123',
      productId: 'ai_pack_100',
      amount: 990,
      channel: 'alipay'
    })
    orderService.createOrder({
      userId: 'user-456',
      productId: 'study_monthly',
      amount: 1800,
      channel: 'wechat'
    })

    const orders = orderService.getOrdersByUser('user-123')
    expect(orders).toHaveLength(2)
    expect(orders.every((o) => o.userId === 'user-123')).toBe(true)
  })

  it('should return empty array for user with no orders', () => {
    expect(orderService.getOrdersByUser('unknown-user')).toEqual([])
  })

  it('should reject createOrder with invalid params', () => {
    expect(() => orderService.createOrder({ userId: '', productId: 'study_monthly', amount: 1800, channel: 'wechat' })).toThrow()
    expect(() => orderService.createOrder({ userId: 'user-123', productId: '', amount: 1800, channel: 'wechat' })).toThrow()
    expect(() => orderService.createOrder({ userId: 'user-123', productId: 'study_monthly', amount: 0, channel: 'wechat' })).toThrow()
    expect(() => orderService.createOrder({ userId: 'user-123', productId: 'study_monthly', amount: -100, channel: 'wechat' })).toThrow()
  })

  it('should generate unique order ids', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      const order = orderService.createOrder({
        userId: 'user-123',
        productId: 'study_monthly',
        amount: 1800,
        channel: 'wechat'
      })
      ids.add(order.id)
    }
    expect(ids.size).toBe(100)
  })
})
