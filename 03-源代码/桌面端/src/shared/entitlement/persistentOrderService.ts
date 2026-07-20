/**
 * PersistentOrderService - 持久化订单服务
 *
 * 职责：
 * - 封装 OrderService + 持久化存储
 * - 自动同步订单数据到 localStorage
 * - 支持订单统计和分析
 *
 * 设计要点：
 * - 每次创建/更新订单后自动保存
 * - 启动时自动加载历史订单
 * - 提供订单统计接口
 */

import { createOrderService } from './orderService'
import type { CreateOrderParams, Order } from './orderTypes'

export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  pendingCount: number
  paidCount: number
  refundedCount: number
  failedCount: number
}

export interface PersistentOrderService {
  createOrder(params: CreateOrderParams): Order
  markAsPaid(orderId: string, channelTradeNo: string, rawReceipt?: string): Order
  markAsRefunded(orderId: string): Order
  markAsFailed(orderId: string): Order
  getOrderById(orderId: string): Order | undefined
  getOrdersByUser(userId: string): Order[]
  getAllOrders(): Order[]
  getStats(): OrderStats
  loadFromStorage(): Promise<void>
  saveToStorage(): Promise<void>
}

const ORDER_STORAGE_KEY = 'growthos-orders'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function createPersistentOrderService(): PersistentOrderService {
  const orderService = createOrderService()
  const ordersMap = new Map<string, Order>()

  const save = (): void => {
    if (!isBrowser()) return
    const orders = Array.from(ordersMap.values())
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders))
  }

  const load = (): Order[] => {
    if (!isBrowser()) return []
    const raw = window.localStorage.getItem(ORDER_STORAGE_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw) as Order[]
    } catch {
      return []
    }
  }

  return {
    createOrder(params: CreateOrderParams): Order {
      const order = orderService.createOrder(params)
      ordersMap.set(order.id, order)
      save()
      return order
    },

    markAsPaid(orderId: string, channelTradeNo: string, rawReceipt?: string): Order {
      const order = orderService.markAsPaid(orderId, channelTradeNo, rawReceipt)
      ordersMap.set(order.id, order)
      save()
      return order
    },

    markAsRefunded(orderId: string): Order {
      const order = orderService.markAsRefunded(orderId)
      ordersMap.set(order.id, order)
      save()
      return order
    },

    markAsFailed(orderId: string): Order {
      const order = orderService.markAsFailed(orderId)
      ordersMap.set(order.id, order)
      save()
      return order
    },

    getOrderById(orderId: string): Order | undefined {
      return ordersMap.get(orderId)
    },

    getOrdersByUser(userId: string): Order[] {
      return Array.from(ordersMap.values())
        .filter((o) => o.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },

    getAllOrders(): Order[] {
      return Array.from(ordersMap.values())
    },

    getStats(): OrderStats {
      const orders = Array.from(ordersMap.values())
      const stats: OrderStats = {
        totalOrders: orders.length,
        totalRevenue: 0,
        pendingCount: 0,
        paidCount: 0,
        refundedCount: 0,
        failedCount: 0
      }

      for (const order of orders) {
        switch (order.status) {
          case 'pending':
            stats.pendingCount++
            break
          case 'paid':
            stats.paidCount++
            stats.totalRevenue += order.amount
            break
          case 'refunded':
            stats.refundedCount++
            break
          case 'failed':
            stats.failedCount++
            break
        }
      }

      return stats
    },

    async loadFromStorage(): Promise<void> {
      const orders = load()
      for (const order of orders) {
        ordersMap.set(order.id, order)
      }
    },

    async saveToStorage(): Promise<void> {
      save()
    }
  }
}

export const persistentOrderService = createPersistentOrderService()
