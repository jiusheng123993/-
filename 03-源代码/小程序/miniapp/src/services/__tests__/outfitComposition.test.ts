import { describe, it, expect } from 'vitest'
import {
  buildOutfitPreview,
  toggleSlotInOutfit,
  clearAllSlots,
  getEquippedCount,
  getEmptySlots,
  getSlotLabel,
  isOutfitEmpty,
  areOutfitsEqual,
  mergeOutfitSlots,
} from '../outfitComposition'
import type { OutfitSlotMap, AccessorySlot } from '../../types/wardrobeTypes'

describe('outfitComposition', () => {
  describe('toggleSlotInOutfit', () => {
    it('should add accessory to empty slot', () => {
      const result = toggleSlotInOutfit({}, 'head', 'hat_baseball')
      expect(result.head).toBe('hat_baseball')
    })

    it('should remove accessory when toggling same accessory', () => {
      const slots: OutfitSlotMap = { head: 'hat_baseball' }
      const result = toggleSlotInOutfit(slots, 'head', 'hat_baseball')
      expect(result.head).toBeUndefined()
    })

    it('should replace accessory when toggling different accessory in same slot', () => {
      const slots: OutfitSlotMap = { head: 'hat_bowler' }
      const result = toggleSlotInOutfit(slots, 'head', 'hat_baseball')
      expect(result.head).toBe('hat_baseball')
    })

    it('should remove slot when accessoryId is null', () => {
      const slots: OutfitSlotMap = { head: 'hat_baseball' }
      const result = toggleSlotInOutfit(slots, 'head', null)
      expect(result.head).toBeUndefined()
    })

    it('should not mutate original slots', () => {
      const slots: OutfitSlotMap = { head: 'hat_baseball' }
      toggleSlotInOutfit(slots, 'neck', 'bell_small')
      expect(slots.neck).toBeUndefined()
    })
  })

  describe('clearAllSlots', () => {
    it('should return empty object', () => {
      const result = clearAllSlots({ head: 'hat_baseball', neck: 'bell_small' })
      expect(Object.keys(result)).toHaveLength(0)
    })
  })

  describe('getEquippedCount', () => {
    it('should return 0 for empty outfit', () => {
      expect(getEquippedCount({})).toBe(0)
    })

    it('should count equipped slots', () => {
      const slots: OutfitSlotMap = { head: 'hat_baseball', neck: 'bell_small' }
      expect(getEquippedCount(slots)).toBe(2)
    })
  })

  describe('getEmptySlots', () => {
    it('should return all slots when outfit is empty', () => {
      const empty = getEmptySlots({})
      expect(empty).toEqual(['head', 'neck', 'back', 'body', 'feet'])
    })

    it('should return only unfilled slots', () => {
      const slots: OutfitSlotMap = { head: 'hat_baseball', feet: 'socks_small' }
      const empty = getEmptySlots(slots)
      expect(empty).toEqual(['neck', 'back', 'body'])
    })
  })

  describe('getSlotLabel', () => {
    it('should return Chinese label for known slot', () => {
      expect(getSlotLabel('head')).toBe('头部')
      expect(getSlotLabel('feet')).toBe('足部')
    })
  })

  describe('isOutfitEmpty', () => {
    it('should return true for empty outfit', () => {
      expect(isOutfitEmpty({})).toBe(true)
    })

    it('should return false for non-empty outfit', () => {
      expect(isOutfitEmpty({ head: 'hat_baseball' })).toBe(false)
    })
  })

  describe('areOutfitsEqual', () => {
    it('should return true for identical outfits', () => {
      const a: OutfitSlotMap = { head: 'hat_baseball', neck: 'bell_small' }
      const b: OutfitSlotMap = { neck: 'bell_small', head: 'hat_baseball' }
      expect(areOutfitsEqual(a, b)).toBe(true)
    })

    it('should return false for different outfits', () => {
      const a: OutfitSlotMap = { head: 'hat_baseball' }
      const b: OutfitSlotMap = { head: 'hat_bowler' }
      expect(areOutfitsEqual(a, b)).toBe(false)
    })

    it('should return false for different slot counts', () => {
      const a: OutfitSlotMap = { head: 'hat_baseball' }
      const b: OutfitSlotMap = { head: 'hat_baseball', neck: 'bell_small' }
      expect(areOutfitsEqual(a, b)).toBe(false)
    })
  })

  describe('mergeOutfitSlots', () => {
    it('should merge base with override', () => {
      const base: OutfitSlotMap = { head: 'hat_baseball', neck: 'bell_small' }
      const override: Partial<OutfitSlotMap> = { head: 'hat_bowler', feet: 'socks_small' }
      const result = mergeOutfitSlots(base, override)
      expect(result.head).toBe('hat_bowler')
      expect(result.neck).toBe('bell_small')
      expect(result.feet).toBe('socks_small')
    })
  })

  describe('buildOutfitPreview', () => {
    it('should return empty svgContent for empty outfit', () => {
      const preview = buildOutfitPreview({}, 'dog')
      expect(preview.svgContent).toBe('')
      expect(preview.layers).toEqual([])
    })

    it('should return slotSummary with equipped status', () => {
      const preview = buildOutfitPreview({}, 'dog')
      expect(preview.slotSummary.head.equipped).toBe(false)
      expect(preview.slotSummary.head.accessoryName).toBeNull()
    })
  })
})
