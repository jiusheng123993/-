import { describe, it, expect, beforeEach } from 'vitest'
import {
  createPersistentEntitlementService,
  persistentEntitlementService
} from './persistentEntitlementService'

describe('PersistentEntitlementService', () => {
  let service: ReturnType<typeof createPersistentEntitlementService>

  beforeEach(() => {
    window.localStorage.clear()
    service = createPersistentEntitlementService()
  })

  it('should grant entitlement and persist it', () => {
    service.grant('user-1', {
      code: 'study',
      source: 'purchase',
      expireAt: null
    })

    expect(service.has('user-1', 'study')).toBe(true)
    expect(service.list('user-1')).toHaveLength(1)

    const raw = window.localStorage.getItem('growthos-entitlements-user-1')
    expect(raw).toBeTruthy()
  })

  it('should consume quota and persist remaining amount', () => {
    service.grant('user-1', {
      code: 'ai_quota',
      source: 'ai_pack',
      remaining: 10,
      expireAt: null
    })

    const result = service.consume('user-1', 'ai_quota', 3)

    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(7)
    expect(service.list('user-1')[0].remaining).toBe(7)
  })

  it('should return failed consume result when quota is missing', () => {
    const result = service.consume('user-1', 'ai_quota')

    expect(result.ok).toBe(false)
  })

  it('should revoke entitlements and persist changes', () => {
    service.grant('user-1', {
      code: 'study',
      source: 'purchase',
      expireAt: null
    })
    expect(service.has('user-1', 'study')).toBe(true)

    service.revoke('user-1', e => e.code === 'study')

    expect(service.has('user-1', 'study')).toBe(false)
    expect(service.list('user-1')).toHaveLength(0)
  })

  it('should load entitlements from storage', async () => {
    service.grant('user-1', {
      code: 'study',
      source: 'purchase',
      expireAt: null
    })

    const newService = createPersistentEntitlementService()
    await newService.loadForUser('user-1')

    expect(newService.has('user-1', 'study')).toBe(true)
  })

  it('should saveForUser explicitly', async () => {
    service.grant('user-1', {
      code: 'agent',
      source: 'purchase',
      expireAt: null
    })

    await expect(service.saveForUser('user-1')).resolves.toBeUndefined()

    const raw = window.localStorage.getItem('growthos-entitlements-user-1')
    expect(raw).toBeTruthy()
  })

  it('should support scope-specific has checks', () => {
    service.grant('user-1', {
      code: 'theme_pack',
      source: 'purchase',
      scope: 'cream-dopamine',
      expireAt: null
    })

    expect(service.has('user-1', 'theme_pack', 'cream-dopamine')).toBe(true)
    expect(service.has('user-1', 'theme_pack', 'unknown-theme')).toBe(false)
  })

  it('should expose singleton instance', () => {
    expect(persistentEntitlementService).toBeDefined()
    expect(typeof persistentEntitlementService.grant).toBe('function')
    expect(typeof persistentEntitlementService.has).toBe('function')
    expect(typeof persistentEntitlementService.loadForUser).toBe('function')
  })
})
