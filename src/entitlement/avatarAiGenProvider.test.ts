import { describe, it, expect, beforeEach } from 'vitest'
import { createAvatarAiGenQuotaProvider } from './avatarAiGenProvider'
import { createEntitlementService } from './entitlementService'

describe('AvatarAiGenQuotaProvider', () => {
  let provider: ReturnType<typeof createAvatarAiGenQuotaProvider>
  let entitlementService: ReturnType<typeof createEntitlementService>

  beforeEach(() => {
    entitlementService = createEntitlementService()
    provider = createAvatarAiGenQuotaProvider(entitlementService)
  })

  it('should return 0 for user without quota', () => {
    expect(provider.getRemaining('user-123')).toBe(0)
  })

  it('should consume quota from entitlement', () => {
    entitlementService.grant('user-123', {
      code: 'avatar_ai_gen',
      source: 'one_time_purchase',
      remaining: 10,
      expireAt: null
    })

    const result = provider.consume('user-123')
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it('should return false when quota exhausted', () => {
    entitlementService.grant('user-123', {
      code: 'avatar_ai_gen',
      source: 'one_time_purchase',
      remaining: 1,
      expireAt: null
    })

    provider.consume('user-123')
    const result = provider.consume('user-123')
    expect(result.ok).toBe(false)
  })

  it('should provide unlimited quota for agent_plus', () => {
    entitlementService.grant('user-123', {
      code: 'agent_plus',
      source: 'sub_monthly',
      expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

    const result = provider.consume('user-123')
    expect(result.ok).toBe(true)
    expect(result.remaining).toBeLessThanOrEqual(5000)
  })

  it('should track total used count', () => {
    entitlementService.grant('user-123', {
      code: 'avatar_ai_gen',
      source: 'one_time_purchase',
      remaining: 10,
      expireAt: null
    })

    provider.consume('user-123')
    provider.consume('user-123')

    expect(provider.getTotalUsed('user-123')).toBe(2)
  })

  it('should get remaining from entitlement', () => {
    entitlementService.grant('user-123', {
      code: 'avatar_ai_gen',
      source: 'one_time_purchase',
      remaining: 5,
      expireAt: null
    })

    expect(provider.getRemaining('user-123')).toBe(5)
  })

  it('should return remaining for agent_plus user', () => {
    entitlementService.grant('user-123', {
      code: 'agent_plus',
      source: 'sub_monthly',
      expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

    const remaining = provider.getRemaining('user-123')
    expect(remaining).toBe(5000)
  })
})
