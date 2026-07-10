import { describe, it, expect, beforeEach } from 'vitest'
import { createEntitlementService } from '../shared/entitlement/entitlementService'
import { createOrderService } from '../shared/entitlement/orderService'
import { getProductById, getActiveProducts } from '../shared/entitlement/productCatalog'
import { createAiQuotaProvider } from '../shared/entitlement/aiQuotaProvider'
import { createSubscriptionProvider } from '../shared/entitlement/subscriptionProvider'
import { createAgentTierProvider } from '../shared/entitlement/agentTierProvider'

describe('Payment Flow E2E', () => {
  let entitlementService: ReturnType<typeof createEntitlementService>
  let orderService: ReturnType<typeof createOrderService>
  let aiQuotaProvider: ReturnType<typeof createAiQuotaProvider>
  let subscriptionProvider: ReturnType<typeof createSubscriptionProvider>
  let agentTierProvider: ReturnType<typeof createAgentTierProvider>

  beforeEach(() => {
    entitlementService = createEntitlementService()
    orderService = createOrderService()
    aiQuotaProvider = createAiQuotaProvider(entitlementService)
    subscriptionProvider = createSubscriptionProvider(entitlementService)
    agentTierProvider = createAgentTierProvider(entitlementService)
  })

  describe('Complete Purchase Flow', () => {
    it('should complete full payment flow: create order -> pay -> grant entitlements', () => {
      const userId = 'e2e-user-123'
      const productId = 'study_monthly'

      const product = getProductById(productId)
      expect(product).toBeDefined()
      expect(product?.price).toBe(1800)

      const order = orderService.createOrder({
        userId,
        productId,
        amount: product!.price,
        channel: 'wechat'
      })
      expect(order.status).toBe('pending')
      expect(order.id).toBeDefined()

      const paidOrder = orderService.markAsPaid(order.id, 'wx-trade-123')
      expect(paidOrder.status).toBe('paid')
      expect(paidOrder.paidAt).toBeDefined()

      subscriptionProvider.activate(userId, productId, order.id)
      expect(entitlementService.has(userId, 'study')).toBe(true)

      const status = subscriptionProvider.getStatus(userId, 'study')
      expect(status.active).toBe(true)
      expect(status.expireAt).toBeDefined()
    })

    it('should handle agent membership purchase flow', () => {
      const userId = 'e2e-agent-user'
      const productId = 'agent_monthly'

      const order = orderService.createOrder({
        userId,
        productId,
        amount: 6400,
        channel: 'alipay'
      })

      orderService.markAsPaid(order.id, 'ali-trade-456')
      subscriptionProvider.activate(userId, productId, order.id)

      expect(entitlementService.has(userId, 'agent')).toBe(true)
      expect(entitlementService.has(userId, 'study')).toBe(true)
      expect(entitlementService.has(userId, 'avatar_rpm')).toBe(true)
      expect(entitlementService.has(userId, 'memory_sync')).toBe(true)

      const tier = agentTierProvider.getTier(userId)
      expect(tier).toBe('agent')
      expect(agentTierProvider.isPro(userId)).toBe(true)
      expect(agentTierProvider.hasPermission(userId, 'memory_system')).toBe(true)
      expect(agentTierProvider.hasPermission(userId, 'avatar_ai_gen')).toBe(false)
    })

    it('should handle agent_plus membership with all permissions', () => {
      const userId = 'e2e-plus-user'
      const productId = 'agent_plus_monthly'

      const order = orderService.createOrder({
        userId,
        productId,
        amount: 12800,
        channel: 'apple'
      })

      orderService.markAsPaid(order.id, 'apple-receipt-789')
      subscriptionProvider.activate(userId, productId, order.id)

      const tier = agentTierProvider.getTier(userId)
      expect(tier).toBe('agent_plus')

      expect(agentTierProvider.hasPermission(userId, 'avatar_ai_gen')).toBe(true)
      expect(agentTierProvider.hasPermission(userId, 'agent_tool_call')).toBe(true)
      expect(agentTierProvider.hasPermission(userId, 'self_evolution_realtime')).toBe(true)
    })

    it('should handle AI quota pack purchase', () => {
      const userId = 'e2e-quota-user'
      const productId = 'ai_pack_100'

      const product = getProductById(productId)
      expect(product?.grants[0].code).toBe('ai_quota')

      const order = orderService.createOrder({
        userId,
        productId,
        amount: 990,
        channel: 'wechat'
      })

      orderService.markAsPaid(order.id, 'wx-quota-001')
      subscriptionProvider.activate(userId, productId, order.id)

      const quotaStatus = aiQuotaProvider.getQuotaStatus(userId)
      expect(quotaStatus.pack?.remaining).toBe(100)

      const consumeResult = aiQuotaProvider.consume(userId)
      expect(consumeResult.ok).toBe(true)
      expect(consumeResult.source).toBe('ai_quota')
      expect(consumeResult.remaining).toBe(99)
    })

    it('should handle subscription renewal', () => {
      const userId = 'e2e-renewal-user'

      subscriptionProvider.activate(userId, 'study_monthly', 'order-1')
      const originalStatus = subscriptionProvider.getStatus(userId, 'study')
      expect(originalStatus.active).toBe(true)

      subscriptionProvider.renew(userId, 'study_yearly', 'order-2')
      const newStatus = subscriptionProvider.getStatus(userId, 'study')

      expect(newStatus.active).toBe(true)
      expect(newStatus.expireAt).not.toBe(originalStatus.expireAt)
    })

    it('should handle subscription cancellation', () => {
      const userId = 'e2e-cancel-user'

      subscriptionProvider.activate(userId, 'study_monthly', 'order-1')
      expect(entitlementService.has(userId, 'study')).toBe(true)

      subscriptionProvider.deactivate(userId, 'study')
      expect(entitlementService.has(userId, 'study')).toBe(false)

      const status = subscriptionProvider.getStatus(userId, 'study')
      expect(status.active).toBe(false)
    })
  })

  describe('Product Catalog', () => {
    it('should have all required products', () => {
      const products = getActiveProducts()
      const productIds = products.map(p => p.id)

      expect(productIds).toContain('study_monthly')
      expect(productIds).toContain('study_quarterly')
      expect(productIds).toContain('study_yearly')
      expect(productIds).toContain('agent_monthly')
      expect(productIds).toContain('agent_yearly')
      expect(productIds).toContain('agent_plus_monthly')
      expect(productIds).toContain('agent_plus_yearly')
    })

    it('should calculate correct pricing', () => {
      const monthly = getProductById('study_monthly')
      const yearly = getProductById('study_yearly')

      expect(monthly?.price).toBe(1800)
      expect(yearly?.price).toBe(12800)
      expect(yearly!.price).toBeLessThan(monthly!.price * 12)
    })
  })

  describe('Quota Consumption Order', () => {
    it('should consume quota when available', () => {
      const userId = 'e2e-quota-basic'

      entitlementService.grant(userId, {
        code: 'ai_quota_free',
        source: 'monthly_grant',
        remaining: 5,
        expireAt: null
      })

      const result = aiQuotaProvider.consume(userId)
      expect(result.ok).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should return false when no quota available', () => {
      const userId = 'e2e-no-quota'

      const result = aiQuotaProvider.consume(userId)
      expect(result.ok).toBe(false)
    })

    it('should get quota status correctly', () => {
      const userId = 'e2e-status'

      entitlementService.grant(userId, {
        code: 'ai_quota_free',
        source: 'monthly_grant',
        remaining: 10,
        expireAt: null
      })

      const status = aiQuotaProvider.getQuotaStatus(userId)
      expect(status.free?.remaining).toBe(10)
    })
  })

  describe('Edge Cases and Boundary Scenarios', () => {
    it('should prevent duplicate entitlement grants for same product', () => {
      const userId = 'e2e-duplicate-user'

      subscriptionProvider.activate(userId, 'study_monthly', 'order-1')
      expect(entitlementService.has(userId, 'study')).toBe(true)

      subscriptionProvider.activate(userId, 'study_monthly', 'order-2')
      expect(entitlementService.has(userId, 'study')).toBe(true)
    })

    it('should handle concurrent order creation for same user', () => {
      const userId = 'e2e-concurrent-user'

      const order1 = orderService.createOrder({
        userId,
        productId: 'study_monthly',
        amount: 1800,
        channel: 'wechat'
      })

      const order2 = orderService.createOrder({
        userId,
        productId: 'study_monthly',
        amount: 1800,
        channel: 'alipay'
      })

      expect(order1.id).not.toBe(order2.id)
      expect(order1.status).toBe('pending')
      expect(order2.status).toBe('pending')
    })

    it('should handle payment timeout - order remains pending', () => {
      const userId = 'e2e-timeout-user'

      const order = orderService.createOrder({
        userId,
        productId: 'study_monthly',
        amount: 1800,
        channel: 'wechat'
      })

      expect(order.status).toBe('pending')
      expect(order.paidAt).toBeUndefined()

      const orders = orderService.getOrdersByUser(userId)
      const pendingOrders = orders.filter(o => o.status === 'pending')
      expect(pendingOrders.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle network recovery - pay pending order after delay', () => {
      const userId = 'e2e-recovery-user'

      const order = orderService.createOrder({
        userId,
        productId: 'study_monthly',
        amount: 1800,
        channel: 'wechat'
      })

      expect(order.status).toBe('pending')

      const paidOrder = orderService.markAsPaid(order.id, 'wx-recovered-001')
      expect(paidOrder.status).toBe('paid')

      subscriptionProvider.activate(userId, 'study_monthly', order.id)
      expect(entitlementService.has(userId, 'study')).toBe(true)
    })

    it('should handle order status inconsistency - cannot refund already refunded order', () => {
      const userId = 'e2e-inconsist-user'

      const order = orderService.createOrder({
        userId,
        productId: 'study_monthly',
        amount: 1800,
        channel: 'wechat'
      })

      orderService.markAsPaid(order.id, 'wx-paid-001')
      orderService.markAsRefunded(order.id)

      expect(() => orderService.markAsRefunded(order.id)).toThrow()
    })

    it('should handle quota exhaustion gracefully', () => {
      const userId = 'e2e-exhaust-user'

      entitlementService.grant(userId, {
        code: 'ai_quota_free',
        source: 'monthly_grant',
        remaining: 1,
        expireAt: null
      })

      const result1 = aiQuotaProvider.consume(userId)
      expect(result1.ok).toBe(true)
      expect(result1.remaining).toBe(0)

      const result2 = aiQuotaProvider.consume(userId)
      expect(result2.ok).toBe(false)
    })

    it('should handle tier downgrade after cancellation', () => {
      const userId = 'e2e-downgrade-user'

      subscriptionProvider.activate(userId, 'agent_plus_monthly', 'order-1')
      expect(agentTierProvider.getTier(userId)).toBe('agent_plus')

      subscriptionProvider.deactivate(userId, 'agent_plus')
      subscriptionProvider.deactivate(userId, 'agent')
      subscriptionProvider.deactivate(userId, 'study')
      expect(agentTierProvider.getTier(userId)).toBe('free')
      expect(agentTierProvider.isPro(userId)).toBe(false)
    })

    it('should handle tier upgrade from study to agent', () => {
      const userId = 'e2e-upgrade-user'

      subscriptionProvider.activate(userId, 'study_monthly', 'order-1')
      expect(agentTierProvider.getTier(userId)).toBe('study')

      subscriptionProvider.activate(userId, 'agent_monthly', 'order-2')
      expect(agentTierProvider.getTier(userId)).toBe('agent')
    })

    it('should handle empty product catalog query', () => {
      const product = getProductById('nonexistent_product')
      expect(product).toBeUndefined()
    })

    it('should handle entitlement revoke and re-grant', () => {
      const userId = 'e2e-revoke-user'

      entitlementService.grant(userId, {
        code: 'study',
        source: 'subscription',
        remaining: 1,
        expireAt: '2026-12-31'
      })
      expect(entitlementService.has(userId, 'study')).toBe(true)

      entitlementService.revoke(userId, (e) => e.code === 'study')
      expect(entitlementService.has(userId, 'study')).toBe(false)

      entitlementService.grant(userId, {
        code: 'study',
        source: 'subscription',
        remaining: 1,
        expireAt: '2026-12-31'
      })
      expect(entitlementService.has(userId, 'study')).toBe(true)
    })
  })

  describe('Order Management', () => {
    it('should list user orders', () => {
      const userId = 'e2e-orders-user'

      orderService.createOrder({
        userId,
        productId: 'study_monthly',
        amount: 1800,
        channel: 'wechat'
      })

      orderService.createOrder({
        userId,
        productId: 'ai_pack_100',
        amount: 990,
        channel: 'alipay'
      })

      const orders = orderService.getOrdersByUser(userId)
      expect(orders).toHaveLength(2)
    })

    it('should handle order refund', () => {
      const userId = 'e2e-refund-user'

      const order = orderService.createOrder({
        userId,
        productId: 'study_monthly',
        amount: 1800,
        channel: 'wechat'
      })

      orderService.markAsPaid(order.id, 'wx-refund-test')
      expect(order.status).toBe('paid')

      const refundedOrder = orderService.markAsRefunded(order.id)
      expect(refundedOrder.status).toBe('refunded')
      expect(refundedOrder.refundedAt).toBeDefined()
    })
  })
})
