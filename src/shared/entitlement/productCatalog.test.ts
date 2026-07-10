import { describe, expect, it } from 'vitest'
import {
  getActiveProducts,
  getProductById,
  getProductsByType,
  productCatalog
} from './productCatalog'

describe('ProductCatalog', () => {
  it('should contain all required subscription products', () => {
    const productIds = productCatalog.map((p) => p.id)
    expect(productIds).toContain('study_monthly')
    expect(productIds).toContain('study_quarterly')
    expect(productIds).toContain('study_yearly')
    expect(productIds).toContain('agent_monthly')
    expect(productIds).toContain('agent_yearly')
    expect(productIds).toContain('agent_plus_monthly')
    expect(productIds).toContain('agent_plus_yearly')
  })

  it('should contain AI pack and avatar pack products', () => {
    const productIds = productCatalog.map((p) => p.id)
    expect(productIds).toContain('ai_pack_100')
    expect(productIds).toContain('ai_pack_unlimited')
    expect(productIds).toContain('avatar_ai_gen_pack_10')
  })

  it('should get product by id with full meta', () => {
    const product = getProductById('study_monthly')
    expect(product).toBeDefined()
    expect(product?.name).toBe('学习会员·月付')
    expect(product?.price).toBe(1800)
    expect(product?.period).toBe('month')
    expect(product?.grants[0].code).toBe('study')
  })

  it('should return undefined for non-existent product', () => {
    expect(getProductById('non_existent')).toBeUndefined()
  })

  it('should filter only active and currently visible products', () => {
    const active = getActiveProducts()
    expect(active.length).toBeGreaterThan(0)
    expect(active.every((p) => p.active)).toBe(true)
  })

  it('should yearly subscription cheaper than 12x monthly', () => {
    const monthly = getProductById('study_monthly')
    const yearly = getProductById('study_yearly')
    expect(yearly!.price).toBeLessThan(monthly!.price * 12)
  })

  it('Agent yearly should be cheaper than 12x Agent monthly', () => {
    const monthly = getProductById('agent_monthly')
    const yearly = getProductById('agent_yearly')
    expect(yearly!.price).toBeLessThan(monthly!.price * 12)
  })

  it('Agent PLUS should include both agent and study grants', () => {
    const plus = getProductById('agent_plus_monthly')
    expect(plus).toBeDefined()
    const grantCodes = plus!.grants.map((g) => g.code)
    expect(grantCodes).toContain('agent_plus')
    expect(grantCodes).toContain('agent')
    expect(grantCodes).toContain('study')
  })

  it('should expose group filter by type', () => {
    const subs = getProductsByType('subscription')
    expect(subs.every((p) => p.type === 'subscription')).toBe(true)
    expect(subs.length).toBeGreaterThan(0)

    const packs = getProductsByType('pack')
    expect(packs.every((p) => p.type === 'pack')).toBe(true)
    expect(packs.length).toBeGreaterThan(0)
  })

  it('every product must declare at least one payment channel', () => {
    productCatalog.forEach((p) => {
      expect(p.channel.length).toBeGreaterThan(0)
    })
  })

  it('every product must declare at least one grant', () => {
    productCatalog.forEach((p) => {
      expect(p.grants.length).toBeGreaterThan(0)
    })
  })

  it('all prices must be positive integers (cents)', () => {
    productCatalog.forEach((p) => {
      expect(Number.isInteger(p.price)).toBe(true)
      expect(p.price).toBeGreaterThan(0)
    })
  })

  it('product ids must be unique', () => {
    const ids = productCatalog.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
