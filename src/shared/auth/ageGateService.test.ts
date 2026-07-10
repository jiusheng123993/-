import { describe, expect, it, beforeEach } from 'vitest'
import { createAgeGateService } from './ageGateService'
import type { AgeGateService } from './ageGateService'

describe('ageGateService', () => {
  let service: AgeGateService

  beforeEach(() => {
    service = createAgeGateService()
  })

  describe('verifyAge and getAgeGroup', () => {
    it('returns minor for unverified users', () => {
      expect(service.getAgeGroup('unknown')).toBe('minor')
    })

    it('returns minor for age under 16', () => {
      service.verifyAge('user-1', 15, 'id_card')
      expect(service.getAgeGroup('user-1')).toBe('minor')
    })

    it('returns teen for age 16-17', () => {
      service.verifyAge('user-1', 16, 'id_card')
      expect(service.getAgeGroup('user-1')).toBe('teen')

      service.verifyAge('user-2', 17, 'wechat_realname')
      expect(service.getAgeGroup('user-2')).toBe('teen')
    })

    it('returns adult for age 18+', () => {
      service.verifyAge('user-1', 18, 'id_card')
      expect(service.getAgeGroup('user-1')).toBe('adult')

      service.verifyAge('user-2', 25, 'apple_family')
      expect(service.getAgeGroup('user-2')).toBe('adult')
    })
  })

  describe('canAccessFeature', () => {
    it('allows learning for all ages', () => {
      expect(service.canAccessFeature('unknown', 'learning')).toBe(true)

      service.verifyAge('user-1', 10, 'id_card')
      expect(service.canAccessFeature('user-1', 'learning')).toBe(true)

      service.verifyAge('user-2', 20, 'id_card')
      expect(service.canAccessFeature('user-2', 'learning')).toBe(true)
    })

    it('allows agent for teens and adults', () => {
      service.verifyAge('teen', 16, 'id_card')
      expect(service.canAccessFeature('teen', 'agent')).toBe(true)

      service.verifyAge('adult', 20, 'id_card')
      expect(service.canAccessFeature('adult', 'agent')).toBe(true)
    })

    it('denies agent for minors', () => {
      service.verifyAge('minor', 10, 'id_card')
      expect(service.canAccessFeature('minor', 'agent')).toBe(false)
    })

    it('allows custom_persona only for adults', () => {
      service.verifyAge('adult', 20, 'id_card')
      expect(service.canAccessFeature('adult', 'custom_persona')).toBe(true)

      service.verifyAge('teen', 16, 'id_card')
      expect(service.canAccessFeature('teen', 'custom_persona')).toBe(false)
    })

    it('allows emotional_persona only for adults', () => {
      service.verifyAge('adult', 20, 'id_card')
      expect(service.canAccessFeature('adult', 'emotional_persona')).toBe(true)

      service.verifyAge('teen', 16, 'id_card')
      expect(service.canAccessFeature('teen', 'emotional_persona')).toBe(false)
    })
  })

  describe('canUsePersona', () => {
    it('allows learning persona for all ages', () => {
      expect(service.canUsePersona('unknown', 'learning')).toBe(true)

      service.verifyAge('minor', 10, 'id_card')
      expect(service.canUsePersona('minor', 'learning')).toBe(true)
    })

    it('allows emotional persona only for adults', () => {
      service.verifyAge('adult', 20, 'id_card')
      expect(service.canUsePersona('adult', 'emotional')).toBe(true)

      service.verifyAge('teen', 16, 'id_card')
      expect(service.canUsePersona('teen', 'emotional')).toBe(false)
    })

    it('allows custom persona only for adults', () => {
      service.verifyAge('adult', 20, 'id_card')
      expect(service.canUsePersona('adult', 'custom')).toBe(true)

      service.verifyAge('teen', 16, 'id_card')
      expect(service.canUsePersona('teen', 'custom')).toBe(false)
    })
  })

  describe('isTimeRestricted', () => {
    it('returns false for adults', () => {
      service.verifyAge('adult', 20, 'id_card')
      expect(service.isTimeRestricted('adult')).toBe(false)
    })

    it('returns true for minors', () => {
      service.verifyAge('minor', 10, 'id_card')
      expect(service.isTimeRestricted('minor')).toBe(true)
    })
  })

  describe('getDailyTimeLimit', () => {
    it('returns 0 for adults (unlimited)', () => {
      service.verifyAge('adult', 20, 'id_card')
      expect(service.getDailyTimeLimit('adult')).toBe(0)
    })

    it('returns 60 for teens', () => {
      service.verifyAge('teen', 16, 'id_card')
      expect(service.getDailyTimeLimit('teen')).toBe(60)
    })

    it('returns 0 for minors', () => {
      service.verifyAge('minor', 10, 'id_card')
      expect(service.getDailyTimeLimit('minor')).toBe(0)
    })
  })
})
