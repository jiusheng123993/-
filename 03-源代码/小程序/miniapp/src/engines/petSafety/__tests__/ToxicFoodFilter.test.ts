/**
 * ToxicFoodFilter 测试
 * 验证有毒食物过滤器的精确匹配、别名匹配、模糊匹配和品种警告
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ToxicFoodFilter,
  convertDataSourceToEngine,
  getDefaultFoodData,
  type EngineFoodSafetyItem,
  type ToxicFoodFilterResult,
} from '../ToxicFoodFilter'

vi.mock('../../../data/petKnowledge/foodSafety', () => ({
  FOOD_SAFETY_DATA: [
    {
      id: 'chocolate',
      name: '巧克力',
      aliases: ['朱古力'],
      safetyLevel: 'toxic',
      speciesApplicable: ['dog', 'cat'],
      dangerousCompounds: ['可可碱', '咖啡因'],
      symptoms: ['呕吐', '腹泻', '心跳加速'],
      detail: '巧克力含有可可碱，对宠物有毒',
    },
    {
      id: 'grape',
      name: '葡萄',
      aliases: ['葡萄干'],
      safetyLevel: 'dangerous',
      speciesApplicable: ['dog', 'cat'],
      dangerousCompounds: ['未知毒素'],
      symptoms: ['肾衰竭'],
      detail: '葡萄可导致肾衰竭',
    },
    {
      id: 'chicken',
      name: '鸡肉',
      aliases: ['鸡胸肉'],
      safetyLevel: 'safe',
      speciesApplicable: ['dog', 'cat'],
      dangerousCompounds: [],
      symptoms: [],
      detail: '煮熟的鸡肉通常安全',
    },
    {
      id: 'avocado',
      name: '牛油果',
      aliases: ['鳄梨'],
      safetyLevel: 'caution',
      speciesApplicable: ['dog', 'cat'],
      dangerousCompounds: ['persin'],
      symptoms: ['呕吐'],
      detail: '牛油果含有persin',
    },
    {
      id: 'milk',
      name: '牛奶',
      aliases: ['鲜奶'],
      safetyLevel: 'caution',
      speciesApplicable: ['dog', 'cat'],
      dangerousCompounds: [],
      symptoms: ['腹泻'],
      detail: '乳糖不耐受',
    },
  ],
}))

describe('ToxicFoodFilter', () => {
  let filter: ToxicFoodFilter

  beforeEach(() => {
    filter = new ToxicFoodFilter()
  })

  describe('constructor', () => {
    it('creates instance with default food data', () => {
      const instance = new ToxicFoodFilter()
      const result = instance.filter('巧克力', 'dog')
      expect(result.found).toBe(true)
      expect(result.safetyLevel).toBe('toxic')
    })

    it('creates instance with custom food data', () => {
      const customData: EngineFoodSafetyItem[] = [
        {
          id: 'custom-food',
          name: '测试食物',
          aliases: ['测试别名'],
          safetyLevel: 'dangerous',
          speciesSafety: { dog: 'dangerous', cat: 'dangerous' },
          dangerousCompounds: ['测试毒素'],
          symptoms: ['测试症状'],
          breedWarnings: [],
          description: '测试描述',
        },
      ]
      const instance = new ToxicFoodFilter(customData)
      const result = instance.filter('测试食物', 'dog')
      expect(result.found).toBe(true)
      expect(result.matchedItem?.id).toBe('custom-food')
    })

    it('custom data does not include default items', () => {
      const customData: EngineFoodSafetyItem[] = [
        {
          id: 'custom-food',
          name: '测试食物',
          aliases: [],
          safetyLevel: 'safe',
          speciesSafety: { dog: 'safe' },
          dangerousCompounds: [],
          symptoms: [],
          breedWarnings: [],
          description: '测试',
        },
      ]
      const instance = new ToxicFoodFilter(customData)
      const result = instance.filter('巧克力', 'dog')
      expect(result.found).toBe(false)
    })
  })

  describe('convertDataSourceToEngine', () => {
    it('converts data source items to engine format', () => {
      const items = [
        {
          id: 'chocolate',
          name: '巧克力',
          aliases: ['朱古力'],
          safetyLevel: 'toxic' as const,
          speciesApplicable: ['dog', 'cat'] as ('dog' | 'cat')[],
          dangerousCompounds: ['可可碱'],
          symptoms: ['呕吐'],
          detail: '有毒',
        },
      ]
      const result = convertDataSourceToEngine(items)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('chocolate')
      expect(result[0].name).toBe('巧克力')
      expect(result[0].aliases).toEqual(['朱古力'])
      expect(result[0].safetyLevel).toBe('toxic')
      expect(result[0].dangerousCompounds).toEqual(['可可碱'])
      expect(result[0].symptoms).toEqual(['呕吐'])
      expect(result[0].description).toBe('有毒')
      expect(result[0].breedWarnings).toEqual([])
    })

    it('applies species safety overrides from SPECIES_SAFETY_OVERRIDES', () => {
      const items = [
        {
          id: 'grape',
          name: '葡萄',
          aliases: [],
          safetyLevel: 'dangerous' as const,
          speciesApplicable: ['dog', 'cat'] as ('dog' | 'cat')[],
          dangerousCompounds: [],
          symptoms: [],
          detail: '葡萄',
        },
      ]
      const result = convertDataSourceToEngine(items)
      expect(result[0].speciesSafety.dog).toBe('toxic')
      expect(result[0].speciesSafety.cat).toBe('dangerous')
    })

    it('uses item safetyLevel as speciesSafety when no override exists', () => {
      const items = [
        {
          id: 'chicken',
          name: '鸡肉',
          aliases: [],
          safetyLevel: 'safe' as const,
          speciesApplicable: ['dog', 'cat'] as ('dog' | 'cat')[],
          dangerousCompounds: [],
          symptoms: [],
          detail: '安全',
        },
      ]
      const result = convertDataSourceToEngine(items)
      expect(result[0].speciesSafety.dog).toBe('safe')
      expect(result[0].speciesSafety.cat).toBe('safe')
    })

    it('defaults dangerousCompounds and symptoms to empty arrays when undefined', () => {
      const items = [
        {
          id: 'test',
          name: '测试',
          aliases: [],
          safetyLevel: 'safe' as const,
          speciesApplicable: ['dog'] as ('dog' | 'cat')[],
          detail: '测试',
        },
      ]
      const result = convertDataSourceToEngine(items)
      expect(result[0].dangerousCompounds).toEqual([])
      expect(result[0].symptoms).toEqual([])
    })
  })

  describe('getDefaultFoodData', () => {
    it('returns converted engine items from FOOD_SAFETY_DATA', () => {
      const data = getDefaultFoodData()
      expect(data.length).toBeGreaterThan(0)
      for (const item of data) {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('name')
        expect(item).toHaveProperty('speciesSafety')
        expect(item).toHaveProperty('breedWarnings')
        expect(item).toHaveProperty('description')
      }
    })
  })

  describe('filter - exact match', () => {
    it('finds chocolate by exact name', () => {
      const result = filter.filter('巧克力', 'dog')
      expect(result.found).toBe(true)
      expect(result.matchedItem?.id).toBe('chocolate')
      expect(result.safetyLevel).toBe('toxic')
    })

    it('finds grape by exact name', () => {
      const result = filter.filter('葡萄', 'dog')
      expect(result.found).toBe(true)
      expect(result.matchedItem?.id).toBe('grape')
    })

    it('finds chicken by exact name', () => {
      const result = filter.filter('鸡肉', 'cat')
      expect(result.found).toBe(true)
      expect(result.matchedItem?.id).toBe('chicken')
      expect(result.safetyLevel).toBe('safe')
    })
  })

  describe('filter - alias match', () => {
    it('finds chocolate by alias 朱古力', () => {
      const result = filter.filter('朱古力', 'dog')
      expect(result.found).toBe(true)
      expect(result.matchedItem?.id).toBe('chocolate')
    })

    it('finds grape by alias 葡萄干', () => {
      const result = filter.filter('葡萄干', 'dog')
      expect(result.found).toBe(true)
      expect(result.matchedItem?.id).toBe('grape')
    })

    it('finds chicken by alias 鸡胸肉', () => {
      const result = filter.filter('鸡胸肉', 'cat')
      expect(result.found).toBe(true)
      expect(result.matchedItem?.id).toBe('chicken')
    })
  })

  describe('filter - case insensitive and normalization', () => {
    it('matches regardless of case for latin characters', () => {
      const customData: EngineFoodSafetyItem[] = [
        {
          id: 'chocolate-en',
          name: 'Chocolate',
          aliases: ['COCOA'],
          safetyLevel: 'toxic',
          speciesSafety: { dog: 'toxic', cat: 'toxic' },
          dangerousCompounds: [],
          symptoms: [],
          breedWarnings: [],
          description: 'test',
        },
      ]
      const instance = new ToxicFoodFilter(customData)
      const result = instance.filter('CHOCOLATE', 'dog')
      expect(result.found).toBe(true)
    })

    it('normalizes spaces and matches', () => {
      const result = filter.filter(' 巧 克 力 ', 'dog')
      expect(result.found).toBe(true)
      expect(result.matchedItem?.id).toBe('chocolate')
    })

    it('normalizes dashes and underscores', () => {
      const customData: EngineFoodSafetyItem[] = [
        {
          id: 'raw-fish',
          name: '生鱼',
          aliases: ['生鱼片'],
          safetyLevel: 'caution',
          speciesSafety: { dog: 'caution', cat: 'dangerous' },
          dangerousCompounds: [],
          symptoms: [],
          breedWarnings: [],
          description: '生鱼',
        },
      ]
      const instance = new ToxicFoodFilter(customData)
      const result = instance.filter('生 鱼', 'cat')
      expect(result.found).toBe(true)
    })

    it('normalizes parentheses (full-width and half-width)', () => {
      const customData: EngineFoodSafetyItem[] = [
        {
          id: 'test-food',
          name: '测试（食物）',
          aliases: [],
          safetyLevel: 'safe',
          speciesSafety: { dog: 'safe' },
          dangerousCompounds: [],
          symptoms: [],
          breedWarnings: [],
          description: '测试',
        },
      ]
      const instance = new ToxicFoodFilter(customData)
      const result = instance.filter('测试(食物)', 'dog')
      expect(result.found).toBe(true)
    })
  })

  describe('filter - not found', () => {
    it('returns found=false with caution level for unknown food', () => {
      const result = filter.filter('外星食物', 'dog')
      expect(result.found).toBe(false)
      expect(result.safetyLevel).toBe('caution')
      expect(result.breedWarnings).toEqual([])
    })

    it('returns speciesWarning for unknown food', () => {
      const result = filter.filter('外星食物', 'cat')
      expect(result.found).toBe(false)
      expect(result.speciesWarning).toContain('未在食物安全库中找到')
    })

    it('does not return matchedItem when not found', () => {
      const result = filter.filter('不存在', 'dog')
      expect(result.matchedItem).toBeUndefined()
    })
  })

  describe('filter - species-specific safety', () => {
    it('grape is toxic for dog due to species override', () => {
      const result = filter.filter('葡萄', 'dog')
      expect(result.found).toBe(true)
      expect(result.safetyLevel).toBe('toxic')
    })

    it('grape is dangerous for cat due to species override', () => {
      const result = filter.filter('葡萄', 'cat')
      expect(result.found).toBe(true)
      expect(result.safetyLevel).toBe('dangerous')
    })

    it('avocado is caution for dog due to species override', () => {
      const result = filter.filter('牛油果', 'dog')
      expect(result.safetyLevel).toBe('caution')
    })

    it('avocado is dangerous for cat due to species override', () => {
      const result = filter.filter('牛油果', 'cat')
      expect(result.safetyLevel).toBe('dangerous')
    })

    it('milk is caution for both dog and cat', () => {
      const dogResult = filter.filter('牛奶', 'dog')
      const catResult = filter.filter('牛奶', 'cat')
      expect(dogResult.safetyLevel).toBe('caution')
      expect(catResult.safetyLevel).toBe('caution')
    })
  })

  describe('filter - breed warnings', () => {
    it('returns breed warnings when breed matches', () => {
      const customData: EngineFoodSafetyItem[] = [
        {
          id: 'test-food',
          name: '测试食物',
          aliases: [],
          safetyLevel: 'dangerous',
          speciesSafety: { dog: 'dangerous' },
          dangerousCompounds: [],
          symptoms: [],
          breedWarnings: [{ breed: '柯基', note: '柯基对该食物更敏感' }],
          description: '测试',
        },
      ]
      const instance = new ToxicFoodFilter(customData)
      const result = instance.filter('测试食物', 'dog', '柯基')
      expect(result.breedWarnings).toContain('柯基对该食物更敏感')
    })

    it('returns no breed warnings when breed does not match', () => {
      const customData: EngineFoodSafetyItem[] = [
        {
          id: 'test-food',
          name: '测试食物',
          aliases: [],
          safetyLevel: 'dangerous',
          speciesSafety: { dog: 'dangerous' },
          dangerousCompounds: [],
          symptoms: [],
          breedWarnings: [{ breed: '柯基', note: '柯基对该食物更敏感' }],
          description: '测试',
        },
      ]
      const instance = new ToxicFoodFilter(customData)
      const result = instance.filter('测试食物', 'dog', '金毛')
      expect(result.breedWarnings).toEqual([])
    })

    it('returns no breed warnings when breed is not provided', () => {
      const customData: EngineFoodSafetyItem[] = [
        {
          id: 'test-food',
          name: '测试食物',
          aliases: [],
          safetyLevel: 'dangerous',
          speciesSafety: { dog: 'dangerous' },
          dangerousCompounds: [],
          symptoms: [],
          breedWarnings: [{ breed: '柯基', note: '柯基对该食物更敏感' }],
          description: '测试',
        },
      ]
      const instance = new ToxicFoodFilter(customData)
      const result = instance.filter('测试食物', 'dog')
      expect(result.breedWarnings).toEqual([])
    })
  })

  describe('filter - small breed risk', () => {
    it('small breed + chocolate triggers extra warning', () => {
      const result = filter.filter('巧克力', 'dog', '吉娃娃')
      expect(result.breedWarnings).toContain('小型犬对该类食物更敏感，即使少量也可能造成严重中毒，请格外注意')
    })

    it('small breed + grape triggers extra warning', () => {
      const result = filter.filter('葡萄', 'dog', '博美')
      expect(result.breedWarnings).toContain('小型犬对该类食物更敏感，即使少量也可能造成严重中毒，请格外注意')
    })

    it('small breed + safe food does not trigger extra warning', () => {
      const result = filter.filter('鸡肉', 'dog', '吉娃娃')
      expect(result.breedWarnings).not.toContain('小型犬对该类食物更敏感，即使少量也可能造成严重中毒，请格外注意')
    })

    it('normal breed + chocolate does not trigger small breed warning', () => {
      const result = filter.filter('巧克力', 'dog', '金毛')
      expect(result.breedWarnings).not.toContain('小型犬对该类食物更敏感，即使少量也可能造成严重中毒，请格外注意')
    })

    it('no breed provided does not trigger small breed warning', () => {
      const result = filter.filter('巧克力', 'dog')
      expect(result.breedWarnings).toEqual([])
    })

    it('茶杯 breed triggers small breed warning for chocolate', () => {
      const result = filter.filter('巧克力', 'dog', '茶杯泰迪')
      expect(result.breedWarnings).toContain('小型犬对该类食物更敏感，即使少量也可能造成严重中毒，请格外注意')
    })

    it('迷你 breed triggers small breed warning for grape', () => {
      const result = filter.filter('葡萄', 'dog', '迷你雪纳瑞')
      expect(result.breedWarnings).toContain('小型犬对该类食物更敏感，即使少量也可能造成严重中毒，请格外注意')
    })
  })

  describe('filter - speciesWarning', () => {
    it('returns species warning when species safety is toxic but general is not', () => {
      const result = filter.filter('葡萄', 'dog')
      expect(result.speciesWarning).toBe('该食物对狗有严重危害')
    })

    it('returns species warning for cat when species safety is toxic but general is not', () => {
      const customData: EngineFoodSafetyItem[] = [
        {
          id: 'garlic',
          name: '大蒜',
          aliases: [],
          safetyLevel: 'dangerous',
          speciesSafety: { cat: 'toxic', dog: 'dangerous' },
          dangerousCompounds: [],
          symptoms: [],
          breedWarnings: [],
          description: '大蒜',
        },
      ]
      const instance = new ToxicFoodFilter(customData)
      const result = instance.filter('大蒜', 'cat')
      expect(result.speciesWarning).toBe('该食物对猫有严重危害')
    })

    it('returns species warning when species safety is dangerous and general is caution', () => {
      const result = filter.filter('牛油果', 'cat')
      expect(result.speciesWarning).toBe('该食物对猫风险较高')
    })

    it('returns no species warning when species safety matches general level', () => {
      const result = filter.filter('鸡肉', 'dog')
      expect(result.speciesWarning).toBeUndefined()
    })

    it('returns no species warning when species safety equals general level even if both are toxic', () => {
      const result = filter.filter('巧克力', 'dog')
      expect(result.speciesWarning).toBeUndefined()
    })
  })

  describe('filter - fuzzy match', () => {
    it('matches partial input via substring matching', () => {
      const result = filter.filter('巧克', 'dog')
      expect(result.found).toBe(true)
      expect(result.matchedItem?.id).toBe('chocolate')
    })

    it('matches when input contains the food name', () => {
      const result = filter.filter('黑巧克力蛋糕', 'dog')
      expect(result.found).toBe(true)
      expect(result.matchedItem?.id).toBe('chocolate')
    })
  })
})
