import { beforeEach, describe, expect, it } from 'vitest'
import { createEntitlementService } from './entitlementService'
import { createSubscriptionProvider } from './subscriptionProvider'

describe('SubscriptionProvider', () => {
  let entitlementService: ReturnType<typeof createEntitlementService>
  let provider: ReturnType<typeof createSubscriptionProvider>

  beforeEach(() => {
    entitlementService = createEntitlementService()
    provider = createSubscriptionProvider(entitlementService)
  })

  it('should activate study_monthly and grant study entitlement', () => {
    provider.activate('user-123', 'study_monthly', 'order-123')
    expect(entitlementService.has('user-123', 'study')).toBe(true)
  })

  it('should activate agent_monthly and grant all bundled entitlements', () => {
    provider.activate('user-123', 'agent_monthly', 'order-123')
    expect(entitlementService.has('user-123', 'agent')).toBe(true)
    expect(entitlementService.has('user-123', 'study')).toBe(true)
    expect(entitlementService.has('user-123', 'avatar_rpm')).toBe(true)
    expect(entitlementService.has('user-123', 'memory_sync')).toBe(true)
  })

  it('should deactivate by code', () => {
    provider.activate('user-123', 'study_monthly', 'order-123')
    provider.deactivate('user-123', 'study')
    expect(entitlementService.has('user-123', 'study')).toBe(false)
  })

  it('should report active status with expireAt', () => {
    provider.activate('user-123', 'study_monthly', 'order-123')
    const status = provider.getStatus('user-123', 'study')
    expect(status.active).toBe(true)
    expect(status.expireAt).toBeTruthy()
    expect(status.orderId).toBe('order-123')
  })

  it('should report inactive status when no entitlement', () => {
    const status = provider.getStatus('user-123', 'study')
    expect(status.active).toBe(false)
    expect(status.expireAt).toBeNull()
  })

  it('should renew: revoke old then activate new', () => {
    provider.activate('user-123', 'study_monthly', 'order-old')
    const oldExpire = provider.getStatus('user-123', 'study').expireAt!

    provider.renew('user-123', 'study_yearly', 'order-new')
    const newStatus = provider.getStatus('user-123', 'study')
    expect(newStatus.active).toBe(true)
    expect(newStatus.expireAt).not.toBe(oldExpire)
    expect(newStatus.orderId).toBe('order-new')

    // 旧订阅已被替换，不应出现重复权益
    const allStudy = entitlementService.list('user-123').filter((e) => e.code === 'study')
    expect(allStudy.length).toBe(1)
  })

  it('should throw on unknown productId', () => {
    expect(() => provider.activate('user-123', 'unknown_product', 'order-1')).toThrow()
    expect(() => provider.renew('user-123', 'unknown_product', 'order-1')).toThrow()
  })

  it('should reject invalid params', () => {
    expect(() => provider.activate('', 'study_monthly', 'order-1')).toThrow()
    expect(() => provider.activate('user-1', '', 'order-1')).toThrow()
    expect(() => provider.activate('user-1', 'study_monthly', '')).toThrow()
  })

  it('should map period to correct source label', () => {
    provider.activate('user-1', 'study_monthly', 'order-m')
    const monthlyEntitlement = entitlementService.list('user-1').find((e) => e.code === 'study')
    expect(monthlyEntitlement?.source).toBe('sub_monthly')

    provider.deactivate('user-1', 'study')
    provider.activate('user-1', 'study_yearly', 'order-y')
    const yearlyEntitlement = entitlementService.list('user-1').find((e) => e.code === 'study')
    expect(yearlyEntitlement?.source).toBe('sub_yearly')
  })

  it('should grant pack quantity for ai_pack_100', () => {
    provider.activate('user-1', 'ai_pack_100', 'order-pack')
    const result = entitlementService.consume('user-1', 'ai_quota', 50)
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(50)
  })
})
