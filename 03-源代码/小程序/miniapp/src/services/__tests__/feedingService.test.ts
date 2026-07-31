/**
 * 喂养服务测试
 */
import { describe, it, expect, vi } from 'vitest'
import type { PetProfile } from '../petService'
import type { ChronicRecord } from '../../types/chronicTypes'
import type { FeedingProfile, PersonalizedFeedingAdvice } from '../feedingService'

vi.mock('../chronicService', () => ({
  getChronicRecords: vi.fn(() => []),
}))

import { buildFeedingProfile, generatePersonalizedAdvice, getMealPlan } from '../feedingService'

function makePet(overrides: Partial<PetProfile> = {}): PetProfile {
  const now = new Date()
  return {
    id: 'pet_001',
    userId: 'user_001',
    name: '小黄',
    species: 'dog',
    breed: '金毛',
    breedId: 'breed_001',
    gender: 'male',
    birthDate: new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()).toISOString().slice(0, 10),
    weight: 25,
    coatColor: '金色',
    photos: [],
    isNeutered: false,
    microchipId: '',
    notes: '',
    isDeceased: false,
    allergies: [],
    medications: [],
    chronicConditions: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides,
  }
}

function makeChronicRecord(overrides: Partial<ChronicRecord> = {}): ChronicRecord {
  return {
    id: 'cr_001',
    petId: 'pet_001',
    condition: '关节炎',
    diagnosedDate: '2024-06-01',
    severity: 'moderate',
    status: 'active',
    medications: [],
    vetName: '李医生',
    vetContact: '13800138000',
    nextCheckupDate: '2025-06-01',
    notes: '',
    symptoms: ['跛行'],
    createdAt: '2024-06-01',
    updatedAt: '2024-06-01',
    ...overrides,
  }
}

function monthsAgo(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().slice(0, 10)
}

function yearsAgo(years: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d.toISOString().slice(0, 10)
}

describe('feedingService', () => {
  describe('buildFeedingProfile', () => {
    it('should calculate ageMonths correctly for a 6-month-old puppy', () => {
      const pet = makePet({ birthDate: monthsAgo(6), species: 'dog' })
      const profile = buildFeedingProfile(pet, [])
      expect(profile.ageMonths).toBe(6)
    })

    it('should calculate ageMonths correctly for a 2-year-old dog (24 months)', () => {
      const pet = makePet({ birthDate: yearsAgo(2), species: 'dog' })
      const profile = buildFeedingProfile(pet, [])
      const expected = 2 * 12
      expect(profile.ageMonths).toBe(expected)
    })

    it('should set isPuppyKitten=true for dog < 12 months', () => {
      const pet = makePet({ birthDate: monthsAgo(6), species: 'dog' })
      const profile = buildFeedingProfile(pet, [])
      expect(profile.isPuppyKitten).toBe(true)
    })

    it('should set isPuppyKitten=true for cat < 12 months', () => {
      const pet = makePet({ birthDate: monthsAgo(6), species: 'cat' })
      const profile = buildFeedingProfile(pet, [])
      expect(profile.isPuppyKitten).toBe(true)
    })

    it('should set isSenior=true for dog >= 84 months (7 years)', () => {
      const pet = makePet({ birthDate: monthsAgo(84), species: 'dog' })
      const profile = buildFeedingProfile(pet, [])
      expect(profile.isSenior).toBe(true)
    })

    it('should set isSenior=true for cat >= 120 months (10 years)', () => {
      const pet = makePet({ birthDate: monthsAgo(120), species: 'cat' })
      const profile = buildFeedingProfile(pet, [])
      expect(profile.isSenior).toBe(true)
    })

    it('should filter chronic records to only active ones', () => {
      const active = makeChronicRecord({ id: 'cr_act', status: 'active' })
      const managed = makeChronicRecord({ id: 'cr_mgd', status: 'managed' })
      const resolved = makeChronicRecord({ id: 'cr_res', status: 'resolved' })
      const pet = makePet()
      const profile = buildFeedingProfile(pet, [active, managed, resolved])
      expect(profile.chronicConditions).toHaveLength(1)
      expect(profile.chronicConditions[0].id).toBe('cr_act')
    })

    it('should use provided allergies array', () => {
      const pet = makePet()
      const allergies = ['鸡肉', '谷物']
      const profile = buildFeedingProfile(pet, [], allergies)
      expect(profile.allergies).toEqual(['鸡肉', '谷物'])
    })

    it('should use provided isNeutered flag', () => {
      const pet = makePet()
      const profile = buildFeedingProfile(pet, [], undefined, true)
      expect(profile.isNeutered).toBe(true)
    })

    it('should default isNeutered to false', () => {
      const pet = makePet()
      const profile = buildFeedingProfile(pet, [])
      expect(profile.isNeutered).toBe(false)
    })

    it('should set bodyCondition to normal by default', () => {
      const pet = makePet()
      const profile = buildFeedingProfile(pet, [])
      expect(profile.bodyCondition).toBe('normal')
    })

    it('should use pet.weight when provided', () => {
      const pet = makePet({ weight: 25 })
      const profile = buildFeedingProfile(pet, [])
      expect(profile.weight).toBe(25)
    })

    it('should default weight to 0 when pet.weight is undefined', () => {
      const pet = makePet({ weight: undefined as unknown as number })
      const profile = buildFeedingProfile(pet, [])
      expect(profile.weight).toBe(0)
    })
  })

  describe('generatePersonalizedAdvice', () => {
    function makeProfile(overrides: Partial<FeedingProfile> = {}): FeedingProfile {
      return {
        pet: makePet(),
        ageMonths: 24,
        weight: 25,
        bodyCondition: 'normal',
        chronicConditions: [],
        allergies: [],
        isPuppyKitten: false,
        isSenior: false,
        isNeutered: false,
        ...overrides,
      }
    }

    it('should always include daily_amount advice with high priority', () => {
      const profile = makeProfile()
      const advice = generatePersonalizedAdvice(profile)
      const daily = advice.find(a => a.type === 'daily_amount')
      expect(daily).toBeDefined()
      expect(daily!.priority).toBe('high')
    })

    it('should include meal_frequency advice for puppy/kitten', () => {
      const profile = makeProfile({ isPuppyKitten: true })
      const advice = generatePersonalizedAdvice(profile)
      const meal = advice.find(a => a.type === 'meal_frequency' && a.title.includes('幼'))
      expect(meal).toBeDefined()
    })

    it('should include meal_frequency advice for senior pet', () => {
      const profile = makeProfile({ isSenior: true })
      const advice = generatePersonalizedAdvice(profile)
      const meal = advice.find(a => a.type === 'meal_frequency' && a.title.includes('老年'))
      expect(meal).toBeDefined()
    })

    it('should include food_type advice for neutered pet', () => {
      const profile = makeProfile({ isNeutered: true })
      const advice = generatePersonalizedAdvice(profile)
      const foodType = advice.find(a => a.type === 'food_type' && a.title.includes('绝育'))
      expect(foodType).toBeDefined()
    })

    it('should include breed_specific advice for known breed (金毛)', () => {
      const profile = makeProfile({ pet: makePet({ breed: '金毛' }) })
      const advice = generatePersonalizedAdvice(profile)
      const breed = advice.find(a => a.type === 'breed_specific')
      expect(breed).toBeDefined()
      expect(breed!.title).toContain('金毛')
    })

    it('should NOT include breed_specific for unknown breed', () => {
      const profile = makeProfile({ pet: makePet({ breed: '未知品种' }) })
      const advice = generatePersonalizedAdvice(profile)
      const breed = advice.find(a => a.type === 'breed_specific')
      expect(breed).toBeUndefined()
    })

    it('should include chronic advice for active chronic conditions', () => {
      const profile = makeProfile({
        chronicConditions: [makeChronicRecord({ condition: '关节炎', status: 'active' })],
      })
      const advice = generatePersonalizedAdvice(profile)
      const chronic = advice.find(a => a.type === 'chronic')
      expect(chronic).toBeDefined()
      expect(chronic!.title).toContain('关节炎')
    })

    it('should include warning for chronic condition avoid foods', () => {
      const profile = makeProfile({
        chronicConditions: [makeChronicRecord({ condition: '关节炎', status: 'active' })],
      })
      const advice = generatePersonalizedAdvice(profile)
      const avoidWarning = advice.find(
        a => a.type === 'warning' && a.title.includes('避免')
      )
      expect(avoidWarning).toBeDefined()
    })

    it('should include allergy warning when allergies present', () => {
      const profile = makeProfile({ allergies: ['鸡肉'] })
      const advice = generatePersonalizedAdvice(profile)
      const allergy = advice.find(a => a.type === 'allergy')
      expect(allergy).toBeDefined()
      expect(allergy!.content).toContain('鸡肉')
    })

    it('should include warning when recentAppetite is poor', () => {
      const profile = makeProfile()
      const advice = generatePersonalizedAdvice(profile, 'poor')
      const appetiteWarning = advice.find(
        a => a.type === 'warning' && a.title.includes('食欲')
      )
      expect(appetiteWarning).toBeDefined()
    })

    it('should NOT include appetite warning when recentAppetite is normal', () => {
      const profile = makeProfile()
      const advice = generatePersonalizedAdvice(profile, 'normal')
      const appetiteWarning = advice.find(
        a => a.type === 'warning' && a.title.includes('食欲')
      )
      expect(appetiteWarning).toBeUndefined()
    })

    it('should include warning when recentStool is loose', () => {
      const profile = makeProfile()
      const advice = generatePersonalizedAdvice(profile, undefined, 'loose')
      const stoolWarning = advice.find(
        a => a.type === 'warning' && a.title.includes('软便')
      )
      expect(stoolWarning).toBeDefined()
    })

    it('should include supplement advice when recentStool is hard', () => {
      const profile = makeProfile()
      const advice = generatePersonalizedAdvice(profile, undefined, 'hard')
      const stoolSuppl = advice.find(
        a => a.type === 'supplement' && a.title.includes('便秘')
      )
      expect(stoolSuppl).toBeDefined()
    })

    it('should always include supplement advice at the end', () => {
      const profile = makeProfile()
      const advice = generatePersonalizedAdvice(profile)
      const last = advice[advice.length - 1]
      expect(last.type).toBe('supplement')
      expect(last.priority).toBe('low')
      expect(last.title).toBe('推荐营养补充')
    })
  })

  describe('getMealPlan', () => {
    function makeProfile(overrides: Partial<FeedingProfile> = {}): FeedingProfile {
      return {
        pet: makePet(),
        ageMonths: 24,
        weight: 25,
        bodyCondition: 'normal',
        chronicConditions: [],
        allergies: [],
        isPuppyKitten: false,
        isSenior: false,
        isNeutered: false,
        ...overrides,
      }
    }

    it('should return 4 meals for puppy/kitten', () => {
      const profile = makeProfile({ isPuppyKitten: true })
      const plan = getMealPlan(profile)
      expect(plan).toHaveLength(4)
    })

    it('should return 2 meals for senior pet', () => {
      const profile = makeProfile({ isSenior: true })
      const plan = getMealPlan(profile)
      expect(plan).toHaveLength(2)
    })

    it('should return 2 meals for normal adult pet', () => {
      const profile = makeProfile()
      const plan = getMealPlan(profile)
      expect(plan).toHaveLength(2)
    })

    it('should have each meal contain time, label, ratio properties', () => {
      const profile = makeProfile({ isPuppyKitten: true })
      const plan = getMealPlan(profile)
      for (const meal of plan) {
        expect(meal).toHaveProperty('time')
        expect(meal).toHaveProperty('label')
        expect(meal).toHaveProperty('ratio')
        expect(typeof meal.time).toBe('string')
        expect(typeof meal.label).toBe('string')
        expect(typeof meal.ratio).toBe('string')
      }
    })
  })
})