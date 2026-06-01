import { describe, it, expect, beforeEach } from 'vitest'
import { createMemorySyncProvider } from './memorySyncProvider'
import { createEntitlementService } from './entitlementService'

describe('MemorySyncProvider', () => {
  let provider: ReturnType<typeof createMemorySyncProvider>
  let entitlementService: ReturnType<typeof createEntitlementService>

  beforeEach(() => {
    entitlementService = createEntitlementService()
    provider = createMemorySyncProvider(entitlementService)
  })

  it('should return false for user without access', () => {
    expect(provider.hasAccess('user-123')).toBe(false)
  })

  it('should return true for user with memory_sync entitlement', () => {
    entitlementService.grant('user-123', {
      code: 'memory_sync',
      source: 'sub_monthly',
      expireAt: null
    })

    expect(provider.hasAccess('user-123')).toBe(true)
  })

  it('should return true for user with agent entitlement', () => {
    entitlementService.grant('user-123', {
      code: 'agent',
      source: 'sub_monthly',
      expireAt: null
    })

    expect(provider.hasAccess('user-123')).toBe(true)
  })

  it('should return true for user with agent_plus entitlement', () => {
    entitlementService.grant('user-123', {
      code: 'agent_plus',
      source: 'sub_monthly',
      expireAt: null
    })

    expect(provider.hasAccess('user-123')).toBe(true)
  })

  it('should provide default 100MB for agent member', () => {
    entitlementService.grant('user-123', {
      code: 'agent',
      source: 'sub_monthly',
      expireAt: null
    })

    const info = provider.getStorageInfo('user-123')
    expect(info.limit).toBe(100 * 1024 * 1024)
  })

  it('should provide 1GB for agent_plus member', () => {
    entitlementService.grant('user-123', {
      code: 'agent_plus',
      source: 'sub_monthly',
      expireAt: null
    })

    const info = provider.getStorageInfo('user-123')
    expect(info.limit).toBe(1024 * 1024 * 1024)
  })

  it('should consume storage within limit', () => {
    entitlementService.grant('user-123', {
      code: 'agent',
      source: 'sub_monthly',
      expireAt: null
    })

    const success = provider.consumeStorage('user-123', 50 * 1024 * 1024)
    expect(success).toBe(true)

    const info = provider.getStorageInfo('user-123')
    expect(info.used).toBe(50 * 1024 * 1024)
  })

  it('should reject storage when exceeding limit', () => {
    entitlementService.grant('user-123', {
      code: 'agent',
      source: 'sub_monthly',
      expireAt: null
    })

    provider.consumeStorage('user-123', 90 * 1024 * 1024)
    const success = provider.consumeStorage('user-123', 20 * 1024 * 1024)

    expect(success).toBe(false)
  })

  it('should reject storage for user without access', () => {
    const success = provider.consumeStorage('user-123', 1000)
    expect(success).toBe(false)
  })

  it('should release storage', () => {
    entitlementService.grant('user-123', {
      code: 'agent',
      source: 'sub_monthly',
      expireAt: null
    })

    provider.consumeStorage('user-123', 50 * 1024 * 1024)
    provider.releaseStorage('user-123', 30 * 1024 * 1024)

    const info = provider.getStorageInfo('user-123')
    expect(info.used).toBe(20 * 1024 * 1024)
  })

  it('should not go below 0 when releasing storage', () => {
    entitlementService.grant('user-123', {
      code: 'agent',
      source: 'sub_monthly',
      expireAt: null
    })

    provider.consumeStorage('user-123', 10 * 1024 * 1024)
    provider.releaseStorage('user-123', 50 * 1024 * 1024)

    const info = provider.getStorageInfo('user-123')
    expect(info.used).toBe(0)
  })
})
