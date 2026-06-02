import { describe, expect, it, beforeEach } from 'vitest'
import { createReflectionTierProvider } from './reflectionTierProvider'
import type { EntitlementService, ReflectionTierProvider } from './reflectionTierProvider'

describe('reflectionTierProvider', () => {
  let provider: ReflectionTierProvider
  let mockEntitlement: EntitlementService

  beforeEach(() => {
    mockEntitlement = {
      has(_userId: string, _feature: string) {
        return false
      }
    }
    provider = createReflectionTierProvider(mockEntitlement)
  })

  describe('getReflectionTier', () => {
    it('returns none for free users', () => {
      expect(provider.getReflectionTier('user-1')).toBe('none')
    })

    it('returns l1_teaser for study tier', () => {
      mockEntitlement = {
        has(_userId: string, feature: string) {
          return feature === 'study'
        }
      }
      provider = createReflectionTierProvider(mockEntitlement)
      expect(provider.getReflectionTier('user-1')).toBe('l1_teaser')
    })

    it('returns l2_weekly for agent tier', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent'
        }
      }
      provider = createReflectionTierProvider(mockEntitlement)
      expect(provider.getReflectionTier('user-1')).toBe('l2_weekly')
    })

    it('returns l4_realtime for agent_plus tier', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent_plus'
        }
      }
      provider = createReflectionTierProvider(mockEntitlement)
      expect(provider.getReflectionTier('user-1')).toBe('l4_realtime')
    })

    it('prioritizes highest tier', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent_plus' || feature === 'agent'
        }
      }
      provider = createReflectionTierProvider(mockEntitlement)
      expect(provider.getReflectionTier('user-1')).toBe('l4_realtime')
    })
  })

  describe('canAccessWeeklyRitual', () => {
    it('allows agent tier', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent'
        }
      }
      provider = createReflectionTierProvider(mockEntitlement)
      expect(provider.canAccessWeeklyRitual('user-1')).toBe(true)
    })

    it('allows agent_plus tier', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent_plus'
        }
      }
      provider = createReflectionTierProvider(mockEntitlement)
      expect(provider.canAccessWeeklyRitual('user-1')).toBe(true)
    })

    it('denies free tier', () => {
      expect(provider.canAccessWeeklyRitual('user-1')).toBe(false)
    })
  })

  describe('canAccessRealtimeReflection', () => {
    it('allows agent_plus tier', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent_plus'
        }
      }
      provider = createReflectionTierProvider(mockEntitlement)
      expect(provider.canAccessRealtimeReflection('user-1')).toBe(true)
    })

    it('denies agent tier', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent'
        }
      }
      provider = createReflectionTierProvider(mockEntitlement)
      expect(provider.canAccessRealtimeReflection('user-1')).toBe(false)
    })

    it('denies free tier', () => {
      expect(provider.canAccessRealtimeReflection('user-1')).toBe(false)
    })
  })

  describe('canAccessSelfEvolution', () => {
    it('allows agent tier', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent'
        }
      }
      provider = createReflectionTierProvider(mockEntitlement)
      expect(provider.canAccessSelfEvolution('user-1')).toBe(true)
    })

    it('allows agent_plus tier', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent_plus'
        }
      }
      provider = createReflectionTierProvider(mockEntitlement)
      expect(provider.canAccessSelfEvolution('user-1')).toBe(true)
    })

    it('denies free tier', () => {
      expect(provider.canAccessSelfEvolution('user-1')).toBe(false)
    })
  })

  describe('getReflectionFrequency', () => {
    it('returns none for free users', () => {
      expect(provider.getReflectionFrequency('user-1')).toBe('none')
    })

    it('returns weekly for agent tier', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent'
        }
      }
      provider = createReflectionTierProvider(mockEntitlement)
      expect(provider.getReflectionFrequency('user-1')).toBe('weekly')
    })

    it('returns realtime for agent_plus tier', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent_plus'
        }
      }
      provider = createReflectionTierProvider(mockEntitlement)
      expect(provider.getReflectionFrequency('user-1')).toBe('realtime')
    })
  })
})
