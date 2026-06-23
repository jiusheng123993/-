import { describe, expect, it } from 'vitest'
import { classifyRequirementGravity } from '../gravity/requirementGravity'

describe('requirementGravity', () => {
  it('classifies complete-plan corrections as product principles and correction signals', () => {
    expect(classifyRequirementGravity('我说错了，是要做就做最完整的方案')).toEqual({
      level: 'product_principle',
      score: 0.95,
      signals: ['correction_signal', 'complete_solution']
    })
  })

  it('classifies engineering process requirements as engineering principles', () => {
    expect(classifyRequirementGravity('修改也要按照项目规则，必须测试验证')).toEqual({
      level: 'engineering_principle',
      score: 0.9,
      signals: ['project_rule', 'verification_required']
    })
  })

  it('classifies simple food preference as casual preference', () => {
    expect(classifyRequirementGravity('我喜欢吃西瓜')).toEqual({
      level: 'casual_preference',
      score: 0.4,
      signals: ['preference']
    })
  })
})
