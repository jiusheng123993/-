import { describe, it, expect, beforeEach } from 'vitest'
import { grantEntitlements } from './entitlementService'

describe('Server EntitlementService', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
  })

  describe('grantEntitlements', () => {
    it('should grant entitlements for valid product', () => {
      const granted = grantEntitlements('user-1', 'study_monthly')

      expect(granted.length).toBeGreaterThan(0)
      expect(granted[0].source).toBe('purchase')
      expect(granted[0].orderId).toBe('study_monthly')
    })

    it('should throw error for unknown product', () => {
      expect(() => grantEntitlements('user-1', 'invalid-product')).toThrow(
        'Product not found: invalid-product'
      )
    })

    it('should grant agent_plus entitlements with all permissions', () => {
      const granted = grantEntitlements('user-1', 'agent_plus_monthly')

      expect(granted.length).toBeGreaterThan(0)
      const codes = granted.map(g => g.code)
      expect(codes).toContain('agent_plus')
    })

    it('should grant ai_quota for quota pack', () => {
      const granted = grantEntitlements('user-1', 'ai_pack_100')

      expect(granted.length).toBeGreaterThan(0)
      const quotaGrant = granted.find(g => g.code === 'ai_quota')
      expect(quotaGrant).toBeDefined()
      expect(quotaGrant?.remaining).toBe(100)
    })

    it('should set grantedAt timestamp', () => {
      const granted = grantEntitlements('user-1', 'study_monthly')

      expect(granted[0].grantedAt).toBeDefined()
      expect(new Date(granted[0].grantedAt!).getTime()).toBeGreaterThan(0)
    })
  })
})
