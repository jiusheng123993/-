import { describe, it, expect, beforeEach } from 'vitest'
import { createEntitlementService } from '../entitlement/entitlementService'
import { createOrderService } from '../entitlement/orderService'
import { getProductById, getActiveProducts } from '../entitlement/productCatalog'
import { createAiQuotaProvider } from '../entitlement/aiQuotaProvider'
import { createSubscriptionProvider } from '../entitlement/subscriptionProvider'
import { createAgentTierProvider } from '../entitlement/agentTierProvider'

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
