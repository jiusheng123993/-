import { describe, expect, it, beforeEach } from 'vitest'
import { createPersonaProvider } from './personaProvider'
import type { EntitlementService, PersonaProvider } from './personaProvider'

describe('personaProvider', () => {
  let provider: PersonaProvider
  let mockEntitlement: EntitlementService

  beforeEach(() => {
    mockEntitlement = {
      has(_userId: string, _feature: string) {
        return false
      },
      consume(_userId: string, _feature: string, _amount: number) {
        return { ok: false }
      }
    }
    provider = createPersonaProvider(mockEntitlement)
  })

  describe('canUsePreset', () => {
    it('allows agent tier users', () => {
      mockEntitlement = {
        has(_userId: string, feature: string) {
          return feature === 'agent'
        },
        consume() { return { ok: false } }
      }
      provider = createPersonaProvider(mockEntitlement)
      expect(provider.canUsePreset('user-1', 'any')).toBe(true)
    })

    it('allows agent_plus tier users', () => {
      mockEntitlement = {
        has(_userId: string, feature: string) {
          return feature === 'agent_plus'
        },
        consume() { return { ok: false } }
      }
      provider = createPersonaProvider(mockEntitlement)
      expect(provider.canUsePreset('user-1', 'any')).toBe(true)
    })

    it('denies users without agent tier', () => {
      expect(provider.canUsePreset('user-1', 'any')).toBe(false)
    })
  })

  describe('canUseCameo', () => {
    it('allows agent_plus users', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent_plus'
        },
        consume() { return { ok: false } }
      }
      provider = createPersonaProvider(mockEntitlement)
      expect(provider.canUseCameo('user-1', 'cameo_1')).toBe(true)
    })

    it('allows users with specific cameo entitlement', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'persona_cameo_cameo_1'
        },
        consume() { return { ok: false } }
      }
      provider = createPersonaProvider(mockEntitlement)
      expect(provider.canUseCameo('user-1', 'cameo_1')).toBe(true)
    })

    it('denies users without cameo entitlement', () => {
      expect(provider.canUseCameo('user-1', 'cameo_1')).toBe(false)
    })
  })

  describe('canCreateCustom', () => {
    it('allows agent tier', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent'
        },
        consume() { return { ok: false } }
      }
      provider = createPersonaProvider(mockEntitlement)
      expect(provider.canCreateCustom('user-1')).toBe(true)
    })

    it('denies free tier', () => {
      expect(provider.canCreateCustom('user-1')).toBe(false)
    })
  })

  describe('getCustomSlotCount', () => {
    it('returns 3 for agent_plus', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent_plus'
        },
        consume() { return { ok: false } }
      }
      provider = createPersonaProvider(mockEntitlement)
      expect(provider.getCustomSlotCount('user-1')).toBe(3)
    })

    it('returns 1 for agent', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent'
        },
        consume() { return { ok: false } }
      }
      provider = createPersonaProvider(mockEntitlement)
      expect(provider.getCustomSlotCount('user-1')).toBe(1)
    })

    it('returns 0 for free tier', () => {
      expect(provider.getCustomSlotCount('user-1')).toBe(0)
    })
  })

  describe('canGenerateAvatar', () => {
    it('allows agent_plus with quota', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent_plus'
        },
        consume() { return { ok: true } }
      }
      provider = createPersonaProvider(mockEntitlement)
      expect(provider.canGenerateAvatar('user-1')).toBe(true)
    })

    it('denies without agent_plus', () => {
      expect(provider.canGenerateAvatar('user-1')).toBe(false)
    })

    it('denies when quota exhausted', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent_plus'
        },
        consume() { return { ok: false } }
      }
      provider = createPersonaProvider(mockEntitlement)
      expect(provider.canGenerateAvatar('user-1')).toBe(false)
    })
  })

  describe('getAvailablePresets', () => {
    it('returns preset list for agent users', () => {
      mockEntitlement = {
        has(userId: string, feature: string) {
          return feature === 'agent'
        },
        consume() { return { ok: false } }
      }
      provider = createPersonaProvider(mockEntitlement)
      const presets = provider.getAvailablePresets('user-1')
      expect(presets).toHaveLength(6)
      expect(presets).toContain('senior_buddy')
      expect(presets).toContain('gentle_sister')
    })

    it('returns empty list for non-agent users', () => {
      expect(provider.getAvailablePresets('user-1')).toEqual([])
    })
  })
})
