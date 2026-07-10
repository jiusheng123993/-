import { beforeEach, describe, expect, it } from 'vitest'
import { createEntitlementStorage } from './entitlementStorage'
import type { Entitlement } from './entitlementTypes'

const sampleEntitlement = (overrides: Partial<Entitlement> = {}): Entitlement => ({
  code: 'study',
  source: 'sub_monthly',
  expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  grantedAt: new Date().toISOString(),
  ...overrides
})

describe('EntitlementStorage', () => {
  let storage: ReturnType<typeof createEntitlementStorage>

  beforeEach(async () => {
    storage = createEntitlementStorage('test-entitlement-storage')
    await storage.clear()
  })

  it('should save and load entitlements', async () => {
    const userId = 'user-123'
    const entitlements: Entitlement[] = [sampleEntitlement()]

    await storage.save(userId, entitlements)
    const loaded = await storage.load(userId)

    expect(loaded).toHaveLength(1)
    expect(loaded[0].code).toBe('study')
    expect(loaded[0].source).toBe('sub_monthly')
  })

  it('should return empty array for non-existent user', async () => {
    const loaded = await storage.load('non-existent-user')
    expect(loaded).toEqual([])
  })

  it('should clear all data under the namespace', async () => {
    await storage.save('user-1', [sampleEntitlement()])
    await storage.save('user-2', [sampleEntitlement({ code: 'agent' })])
    await storage.clear()
    expect(await storage.load('user-1')).toEqual([])
    expect(await storage.load('user-2')).toEqual([])
  })

  it('should overwrite previous snapshot for the same user', async () => {
    await storage.save('user-1', [sampleEntitlement({ code: 'study' })])
    await storage.save('user-1', [
      sampleEntitlement({ code: 'agent' }),
      sampleEntitlement({ code: 'agent_plus' })
    ])
    const loaded = await storage.load('user-1')
    expect(loaded).toHaveLength(2)
    expect(loaded.map((e) => e.code)).toEqual(['agent', 'agent_plus'])
  })

  it('should isolate different storage namespaces', async () => {
    const other = createEntitlementStorage('other-namespace')
    await other.clear()

    await storage.save('user-1', [sampleEntitlement()])
    expect(await other.load('user-1')).toEqual([])

    await other.clear()
  })

  it('should tolerate corrupted JSON without throwing', async () => {
    localStorage.setItem('test-entitlement-storage-user-broken', '{not valid json')
    const loaded = await storage.load('user-broken')
    expect(loaded).toEqual([])
  })

  it('should reject empty userId on save', async () => {
    await expect(storage.save('', [sampleEntitlement()])).rejects.toThrow()
  })

  it('should reject non-array entitlements on save', async () => {
    // @ts-expect-error intentionally invalid
    await expect(storage.save('user-1', null)).rejects.toThrow()
  })

  it('should remove a single user record', async () => {
    await storage.save('user-1', [sampleEntitlement()])
    await storage.save('user-2', [sampleEntitlement({ code: 'agent' })])
    await storage.remove('user-1')
    expect(await storage.load('user-1')).toEqual([])
    expect(await storage.load('user-2')).toHaveLength(1)
  })
})
