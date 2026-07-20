/**
 * OrderService - 订单生命周期服务
 *
 * 职责：
 * - 管理订单的创建、支付确认、退款、查询
 * - 状态机：pending → paid → refunded ；任意状态 → failed
 * - 强参数校验：拒绝空 userId/productId、非正金额
 * - 幂等支付：重复 markAsPaid 同一订单不会覆盖原回执
 *
 * 设计要点：
 * - 订单 ID = `order-{timestamp}-{base36 random}`，全局唯一
 * - 内存存储，持久化由后续 OrderStorage 适配（与 EntitlementStorage 同模式）
 * - 不直接调用支付网关，由上层组合 PaymentAdapter 完成支付动作后通知此服务
 */

import type { CreateOrderParams, Order, OrderStatus } from './orderTypes'
import type { OrderStorageAdapter } from './entitlementStorageAdapter'

export interface OrderService {
  createOrder(params: CreateOrderParams): Order
  markAsPaid(orderId: string, channelTradeNo: string, rawReceipt?: string): Order
  markAsRefunded(orderId: string): Order
  markAsFailed(orderId: string): Order
  getOrderById(orderId: string): Order | undefined
  getOrdersByUser(userId: string): Order[]
  loadFromStorage(userId: string): Promise<void>
  syncToStorage(orderId: string): Promise<void>
}

function generateOrderId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.floor(Math.random() * 0xffffff)
    .toString(36)
    .padStart(5, '0')
  return `order-${ts}-${rand}`
}

export function createOrderService(
  storageAdapter?: OrderStorageAdapter
): OrderService {
  const orders = new Map<string, Order>()

  const requireOrder = (orderId: string): Order => {
    const order = orders.get(orderId)
    if (!order) throw new Error(`OrderService: order not found: ${orderId}`)
    return order
  }

  const persistOrder = (orderId: string): void => {
    if (!storageAdapter) return
    const order = orders.get(orderId)
    if (!order) return
    storageAdapter.save(order).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`OrderService persist failed for order ${orderId}: ${message}`)
    })
  }

  const persistStatus = (
    orderId: string,
    status: OrderStatus,
    extra?: { channelTradeNo?: string; receipt?: string }
  ): void => {
    if (!storageAdapter) return
    storageAdapter.updateStatus(orderId, status, extra).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`OrderService status persist failed for order ${orderId}: ${message}`)
    })
  }

  return {
    createOrder(params: CreateOrderParams): Order {
      if (!params || !params.userId) {
        throw new Error('OrderService.createOrder: userId is required')
      }
      if (!params.productId) {
        throw new Error('OrderService.createOrder: productId is required')
      }
      if (!Number.isFinite(params.amount) || params.amount <= 0) {
        throw new Error('OrderService.createOrder: amount must be positive integer cents')
      }
      if (!params.channel) {
        throw new Error('OrderService.createOrder: channel is required')
      }

      const order: Order = {
        id: generateOrderId(),
        userId: params.userId,
        productId: params.productId,
        amount: params.amount,
        channel: params.channel,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
      orders.set(order.id, order)
      persistOrder(order.id)
      return order
    },

    markAsPaid(orderId: string, channelTradeNo: string, rawReceipt?: string): Order {
      const order = requireOrder(orderId)
      if (order.status === 'paid') {
        return order
      }
      if (order.status !== 'pending') {
        throw new Error(
          `OrderService.markAsPaid: cannot transition from ${order.status} to paid`
        )
      }
      order.status = 'paid'
      order.channelTradeNo = channelTradeNo
      order.rawReceipt = rawReceipt
      order.paidAt = new Date().toISOString()
      persistStatus(orderId, 'paid', {
        channelTradeNo,
        receipt: rawReceipt
      })
      return order
    },

    markAsRefunded(orderId: string): Order {
      const order = requireOrder(orderId)
      if (order.status !== 'paid') {
        throw new Error(
          `OrderService.markAsRefunded: only paid orders can be refunded (current: ${order.status})`
        )
      }
      order.status = 'refunded'
      order.refundedAt = new Date().toISOString()
      persistStatus(orderId, 'refunded')
      return order
    },

    markAsFailed(orderId: string): Order {
      const order = requireOrder(orderId)
      if (order.status === 'paid' || order.status === 'refunded') {
        throw new Error(
          `OrderService.markAsFailed: cannot fail a ${order.status} order`
        )
      }
      order.status = 'failed'
      persistStatus(orderId, 'failed')
      return order
    },

    getOrderById(orderId: string): Order | undefined {
      if (!orderId) return undefined
      return orders.get(orderId)
    },

    getOrdersByUser(userId: string): Order[] {
      if (!userId) return []
      return Array.from(orders.values())
        .filter((o) => o.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },

    async loadFromStorage(userId: string): Promise<void> {
      if (!userId) return
      if (!storageAdapter) return

      const storedOrders = await storageAdapter.loadByUser(userId)
      for (const order of storedOrders) {
        orders.set(order.id, order)
      }
    },

    async syncToStorage(orderId: string): Promise<void> {
      if (!orderId) return
      if (!storageAdapter) return

      const order = orders.get(orderId)
      if (!order) return

      await storageAdapter.save(order)
    }
  }
}
