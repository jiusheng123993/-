/**
 * 紧急规则测试
 * 验证紧急程度判断规则的正确性
 */
import { describe, it, expect } from 'vitest'
import { URGENCY_RULES } from './urgencyRules'

describe('urgencyRules', () => {
  it('URGENCY_RULES 数组不为空', () => {
    expect(URGENCY_RULES.length).toBeGreaterThan(0)
  })

  it('每条规则都有必需的字段', () => {
    const requiredFields = ['id', 'name', 'category', 'triggerConditions', 'baseUrgency', 'description', 'advice']
    URGENCY_RULES.forEach((rule) => {
      requiredFields.forEach((field) => {
        expect(rule).toHaveProperty(field)
      })
    })
  })

  it('triggerConditions 不为空', () => {
    URGENCY_RULES.forEach((rule) => {
      expect(rule.triggerConditions.length).toBeGreaterThan(0)
    })
  })

  it('症状组合类规则 vomiting_diarrhea_combo 存在', () => {
    const rule = URGENCY_RULES.find((r) => r.id === 'vomiting_diarrhea_combo')
    expect(rule).toBeDefined()
    expect(rule?.category).toBe('symptom_combination')
  })

  it('持续时间类规则 vomiting_over_24h 存在', () => {
    const rule = URGENCY_RULES.find((r) => r.id === 'vomiting_over_24h')
    expect(rule).toBeDefined()
    expect(rule?.category).toBe('duration')
  })

  it('物种特异规则 cat_lily_exposure 存在', () => {
    const rule = URGENCY_RULES.find((r) => r.id === 'cat_lily_exposure')
    expect(rule).toBeDefined()
    expect(rule?.category).toBe('species_specific')
  })

  it('年龄规则 juvenile_orange_escalation 存在', () => {
    const rule = URGENCY_RULES.find((r) => r.id === 'juvenile_orange_escalation')
    expect(rule).toBeDefined()
    expect(rule?.category).toBe('age_specific')
  })

  it('品种规则 deep_chested_breed_bloat 存在', () => {
    const rule = URGENCY_RULES.find((r) => r.id === 'deep_chested_breed_bloat')
    expect(rule).toBeDefined()
    expect(rule?.category).toBe('breed_specific')
  })

  it('规则 ID 唯一性', () => {
    const ids = URGENCY_RULES.map((rule) => rule.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('baseUrgency 值在有效范围内', () => {
    const validUrgency = ['green', 'yellow', 'orange', 'red']
    URGENCY_RULES.forEach((rule) => {
      expect(validUrgency).toContain(rule.baseUrgency)
    })
  })
})
