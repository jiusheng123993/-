import { describe, it, expect } from 'vitest'
import {
  validatePetName,
  validateWeight,
  validateBirthDate,
  validateFoodSearch,
  validateSymptomSelection,
} from '../boundaryValidation'

describe('边界值校验', () => {
  describe('宠物名称校验', () => {
    it('F5.1 名称为空应返回错误', () => {
      expect(validatePetName('')).toBe('请输入宠物名称')
      expect(validatePetName('   ')).toBe('请输入宠物名称')
    })

    it('F5.2 名称超长(>50字符)应返回错误', () => {
      const longName = 'a'.repeat(51)
      expect(validatePetName(longName)).toBe('宠物名称不能超过50个字符')
      // 边界：刚好50字符应通过
      const exact50 = 'a'.repeat(50)
      expect(validatePetName(exact50)).toBeNull()
    })

    it('F5.3 名称含特殊字符应返回错误', () => {
      expect(validatePetName('小白@')).toBe('宠物名称包含不允许的特殊字符')
      expect(validatePetName('dog#name')).toBe('宠物名称包含不允许的特殊字符')
      expect(validatePetName('乖乖<script>')).toBe('宠物名称包含不允许的特殊字符')
      // 允许的字符应通过
      expect(validatePetName('小白')).toBeNull()
      expect(validatePetName('Max')).toBeNull()
      expect(validatePetName('大毛 (橘猫)')).toBe('宠物名称包含不允许的特殊字符')
      // 中划线、下划线、点应通过
      expect(validatePetName('dog-001')).toBeNull()
      expect(validatePetName('cat_002')).toBeNull()
      expect(validatePetName('Pro.Max')).toBeNull()
    })
  })

  describe('体重校验', () => {
    it('F5.4 体重为0或负数应返回错误', () => {
      expect(validateWeight(0)).toBe('请输入有效体重')
      expect(validateWeight(-1)).toBe('请输入有效体重')
      expect(validateWeight(-0.5)).toBe('请输入有效体重')
      expect(validateWeight('0')).toBe('请输入有效体重')
      expect(validateWeight('-5')).toBe('请输入有效体重')
      // 正常值应通过
      expect(validateWeight(5)).toBeNull()
      expect(validateWeight(0.1)).toBeNull()
      expect(validateWeight('3.5')).toBeNull()
    })

    it('F5.5 体重超过999.99kg应返回错误', () => {
      expect(validateWeight(1000)).toBe('体重不能超过999.99kg')
      expect(validateWeight(999.999)).toBe('体重不能超过999.99kg')
      expect(validateWeight('1000')).toBe('体重不能超过999.99kg')
      // 边界：刚好999.99应通过
      expect(validateWeight(999.99)).toBeNull()
      expect(validateWeight(999.9)).toBeNull()
      expect(validateWeight('999.99')).toBeNull()
    })

    it('体重为非数字应返回错误', () => {
      expect(validateWeight('abc')).toBe('请输入有效体重')
      expect(validateWeight('')).toBe('请输入有效体重')
      expect(validateWeight(NaN)).toBe('请输入有效体重')
    })
  })

  describe('日期校验', () => {
    it('F5.6 出生日期为未来日期应返回错误', () => {
      const futureDate = '2099-12-31'
      expect(validateBirthDate(futureDate)).toBe('出生日期不能晚于今天')
    })

    it('出生日期为今天应通过', () => {
      const today = new Date().toISOString().slice(0, 10)
      expect(validateBirthDate(today)).toBeNull()
    })

    it('出生日期为过去日期应通过', () => {
      expect(validateBirthDate('2020-01-01')).toBeNull()
      expect(validateBirthDate('2023-06-15')).toBeNull()
    })

    it('出生日期为空应返回错误', () => {
      expect(validateBirthDate('')).toBe('请选择出生日期')
    })

    it('出生日期格式不正确应返回错误', () => {
      expect(validateBirthDate('invalid-date')).toBe('出生日期格式不正确')
      expect(validateBirthDate('2020-13-01')).toBe('出生日期格式不正确')
    })
  })

  describe('食物搜索校验', () => {
    it('F5.7 搜索关键词为空应返回错误', () => {
      expect(validateFoodSearch('')).toBe('请输入食物名称')
      expect(validateFoodSearch('   ')).toBe('请输入食物名称')
    })

    it('F5.8 搜索关键词超长(>100字符)应返回错误', () => {
      const longKeyword = 'a'.repeat(101)
      expect(validateFoodSearch(longKeyword)).toBe('食物名称不能超过100个字符')
      // 边界：刚好100字符应通过
      const exact100 = 'a'.repeat(100)
      expect(validateFoodSearch(exact100)).toBeNull()
    })

    it('正常搜索关键词应通过', () => {
      expect(validateFoodSearch('巧克力')).toBeNull()
      expect(validateFoodSearch('葡萄')).toBeNull()
      expect(validateFoodSearch('chicken')).toBeNull()
    })
  })

  describe('症状初筛校验', () => {
    it('F5.9 未选择任何症状应返回错误', () => {
      expect(validateSymptomSelection([])).toBe('请至少选择一个症状')
      expect(validateSymptomSelection(null as unknown as string[])).toBe('请至少选择一个症状')
    })

    it('选择至少一个症状应通过', () => {
      expect(validateSymptomSelection(['vomiting'])).toBeNull()
      expect(validateSymptomSelection(['vomiting', 'diarrhea'])).toBeNull()
    })
  })
})