export type RequirementGravityLevel =
  | 'casual_preference'
  | 'repeated_preference'
  | 'hard_boundary'
  | 'product_principle'
  | 'engineering_principle'
  | 'trust_critical_signal'

export type RequirementGravitySignal =
  | 'preference'
  | 'complete_solution'
  | 'correction_signal'
  | 'project_rule'
  | 'verification_required'
  | 'trust_repair'
  | 'hard_boundary'

export interface RequirementGravityResult {
  level: RequirementGravityLevel
  score: number
  signals: RequirementGravitySignal[]
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword))
}

export function classifyRequirementGravity(input: string): RequirementGravityResult {
  const text = input.trim()
  const signals: RequirementGravitySignal[] = []

  if (includesAny(text, ['我说错了', '不是', '纠正', '应该是'])) signals.push('correction_signal')
  if (includesAny(text, ['完整方案', '完全体', '最完整', '不要简化', '不是简化'])) signals.push('complete_solution')
  if (includesAny(text, ['项目规则', '全局规则', '按照规则'])) signals.push('project_rule')
  if (includesAny(text, ['测试验证', '验证', '构建', 'lint', 'typecheck'])) signals.push('verification_required')
  if (includesAny(text, ['又忘了', '理解错了', '为什么没修改', '不够完善'])) signals.push('trust_repair')
  if (includesAny(text, ['必须', '禁止', '不要', '不允许'])) signals.push('hard_boundary')
  if (includesAny(text, ['喜欢', '偏好'])) signals.push('preference')

  if (signals.includes('correction_signal') && signals.includes('complete_solution')) {
    return { level: 'product_principle', score: 0.95, signals: ['correction_signal', 'complete_solution'] }
  }

  if (signals.includes('project_rule') || signals.includes('verification_required')) {
    return {
      level: 'engineering_principle',
      score: 0.9,
      signals: signals.filter(signal => signal === 'project_rule' || signal === 'verification_required')
    }
  }

  if (signals.includes('trust_repair')) return { level: 'trust_critical_signal', score: 0.88, signals: ['trust_repair'] }
  if (signals.includes('hard_boundary')) return { level: 'hard_boundary', score: 0.82, signals: ['hard_boundary'] }
  if (signals.includes('preference')) return { level: 'casual_preference', score: 0.4, signals: ['preference'] }
  return { level: 'casual_preference', score: 0.2, signals: [] }
}
