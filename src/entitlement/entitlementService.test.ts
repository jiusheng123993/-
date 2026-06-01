import { beforeEach, describe, expect, it } from 'vitest'
import { createEntitlementService } from './entitlementService'

describe('EntitlementService', () => {
  let service: ReturnType<typeof createEntitlementService>
  const userId = 'user-123'

  beforeEach(() => {
    service = createEntitlementService()
  })

  it('should return false for non-existent entitlement', () => {
    expect(service.has(userId, 'study')).toBe(false)
  })

  it('should return true for granted entitlement', () => {
    service.grant(userId, {
      code: 'study',
      source: 'sub_monthly',
      expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    expect(service.has(userId, 'study')).toBe(true)
  })

  it('should return false for expired entitlement', () => {
    service.grant(userId, {
      code: 'study',
      source: 'sub_monthly',
      expireAt: new Date(Date.now() - 1000).toISOString()
    })
    expect(service.has(userId, 'study')).toBe(false)
  })

  it('should treat null expireAt as永久 (permanent)', () => {
    service.grant(userId, {
      code: 'study',
      source: 'one_time_purchase',
      expireAt: null
    })
    expect(service.has(userId, 'study')).toBe(true)
  })

  it('should consume quota correctly', () => {
    service.grant(userId, {
      code: 'ai_quota',
      source: 'ai_pack',
      expireAt: null,
      remaining: 10
    })
    const result = service.consume(userId, 'ai_quota', 1)
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it('should reject consume when quota is insufficient', () => {
    service.grant(userId, {
      code: 'ai_quota',
      source: 'ai_pack',
      expireAt: null,
      remaining: 2
    })
    const result = service.consume(userId, 'ai_quota', 5)
    expect(result.ok).toBe(false)
    expect(result.remaining).toBe(2)
  })

  it('should reject consume for non-existent quota', () => {
    const result = service.consume(userId, 'ai_quota', 1)
    expect(result.ok).toBe(false)
  })

  it('should reject consume with non-positive n', () => {
    service.grant(userId, {
      code: 'ai_quota',
      source: 'ai_pack',
      expireAt: null,
      remaining: 10
    })
    expect(service.consume(userId, 'ai_quota', 0).ok).toBe(false)
    expect(service.consume(userId, 'ai_quota', -1).ok).toBe(false)
  })

  it('should list all entitlements for user', () => {
    service.grant(userId, { code: 'study', source: 'sub_monthly', expireAt: null })
    service.grant(userId, { code: 'ai_quota', source: 'ai_pack', expireAt: null, remaining: 100 })
    const entitlements = service.list(userId)
    expect(entitlements).toHaveLength(2)
  })

  it('should return empty list for unknown user', () => {
    expect(service.list('unknown-user')).toEqual([])
  })

  it('should revoke entitlements by predicate', () => {
    service.grant(userId, { code: 'study', source: 'sub_monthly', expireAt: null })
    service.grant(userId, { code: 'ai_quota', source: 'ai_pack', expireAt: null, remaining: 100 })
    service.revoke(userId, (e) => e.code === 'ai_quota')
    expect(service.has(userId, 'ai_quota')).toBe(false)
    expect(service.has(userId, 'study')).toBe(true)
  })

  it('should isolate entitlements between users', () => {
    service.grant('user-A', { code: 'study', source: 'sub_monthly', expireAt: null })
    expect(service.has('user-A', 'study')).toBe(true)
    expect(service.has('user-B', 'study')).toBe(false)
  })

  it('should match scope when provided', () => {
    service.grant(userId, {
      code: 'theme_<id>',
      source: 'one_time_purchase',
      expireAt: null,
      scope: 'huawei-pura-violet'
    })
    expect(service.has(userId, 'theme_<id>', 'huawei-pura-violet')).toBe(true)
    expect(service.has(userId, 'theme_<id>', 'minimal-premium')).toBe(false)
  })

  it('should reject grant with invalid params', () => {
    expect(() => service.grant('', { code: 'study', source: 'sub_monthly', expireAt: null })).toThrow()
  })

  it('should auto fill grantedAt on grant', () => {
    service.grant(userId, { code: 'study', source: 'sub_monthly', expireAt: null })
    const list = service.list(userId)
    expect(list[0].grantedAt).toBeTruthy()
    expect(() => new Date(list[0].grantedAt)).not.toThrow()
  })
})
