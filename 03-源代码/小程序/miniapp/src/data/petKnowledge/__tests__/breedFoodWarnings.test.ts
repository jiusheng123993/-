/**
 * 品种食物禁忌数据测试
 * 验证品种-食物禁忌映射的正确性
 */
import { describe, it, expect } from 'vitest'
import {
  BREED_FOOD_WARNINGS,
  getBreedFoodWarnings,
  getFoodBreedWarnings,
  getBreedFoodWarning,
  hasBreedFoodWarning,
  getBreedSizeCategory,
  getSizeBasedWarnings,
} from '../breedFoodWarnings'

describe('breedFoodWarnings', () => {
  describe('BREED_FOOD_WARNINGS', () => {
    it('should have at least 20 warning entries', () => {
      expect(BREED_FOOD_WARNINGS.length).toBeGreaterThanOrEqual(20)
    })

    it('all entries should have required fields', () => {
      for (const w of BREED_FOOD_WARNINGS) {
        expect(w.breedId).toBeTruthy()
        expect(w.breedName).toBeTruthy()
        expect(w.foodId).toBeTruthy()
        expect(w.foodName).toBeTruthy()
        expect(['info', 'caution', 'dangerous', 'toxic']).toContain(w.warningLevel)
        expect(w.reason).toBeTruthy()
        expect(w.recommendation).toBeTruthy()
      }
    })
  })

  describe('getBreedFoodWarnings', () => {
    it('should return warnings for a specific breed', () => {
      const warnings = getBreedFoodWarnings('chihuahua')
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings.every((w) => w.breedId === 'chihuahua')).toBe(true)
    })

    it('should return empty array for unknown breed', () => {
      const warnings = getBreedFoodWarnings('unknown_breed')
      expect(warnings).toEqual([])
    })
  })

  describe('getFoodBreedWarnings', () => {
    it('should return warnings for a specific food', () => {
      const warnings = getFoodBreedWarnings('chocolate')
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings.every((w) => w.foodId === 'chocolate')).toBe(true)
    })

    it('should return empty array for unknown food', () => {
      const warnings = getFoodBreedWarnings('unknown_food')
      expect(warnings).toEqual([])
    })
  })

  describe('getBreedFoodWarning', () => {
    it('should return specific breed-food warning', () => {
      const warning = getBreedFoodWarning('chihuahua', 'chocolate')
      expect(warning).toBeDefined()
      expect(warning?.breedId).toBe('chihuahua')
      expect(warning?.foodId).toBe('chocolate')
      expect(warning?.warningLevel).toBe('toxic')
    })

    it('should return undefined for non-existent combination', () => {
      const warning = getBreedFoodWarning('chihuahua', 'unknown_food')
      expect(warning).toBeUndefined()
    })
  })

  describe('hasBreedFoodWarning', () => {
    it('should return true for existing breed-food combination', () => {
      expect(hasBreedFoodWarning('chihuahua', 'chocolate')).toBe(true)
    })

    it('should return false for non-existent combination', () => {
      expect(hasBreedFoodWarning('chihuahua', 'unknown_food')).toBe(false)
    })
  })

  describe('getBreedSizeCategory', () => {
    it('should return toy for chihuahua', () => {
      expect(getBreedSizeCategory('chihuahua')).toBe('toy')
    })

    it('should return large for golden retriever', () => {
      expect(getBreedSizeCategory('golden_retriever')).toBe('large')
    })

    it('should return unknown for unrecognized breed', () => {
      expect(getBreedSizeCategory('unknown_breed')).toBe('unknown')
    })
  })

  describe('getSizeBasedWarnings', () => {
    it('should return toxic warning for toy breed with chocolate', () => {
      const warning = getSizeBasedWarnings('chihuahua', 'chocolate', '巧克力')
      expect(warning).toBeDefined()
      expect(warning?.warningLevel).toBe('toxic')
    })

    it('should return caution warning for large breed with high calorie food', () => {
      const warning = getSizeBasedWarnings('golden_retriever', 'high_calorie', '高热量食物')
      expect(warning).toBeDefined()
      expect(warning?.warningLevel).toBe('caution')
    })

    it('should return undefined for medium breed with safe food', () => {
      const warning = getSizeBasedWarnings('border_collie', 'chicken', '鸡肉')
      expect(warning).toBeUndefined()
    })
  })
})