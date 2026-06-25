import type { MemoryAtom, MemorySensitivity } from '../core/memoryBodyTypes'

export interface ConstitutionPrinciple {
  id: string
  title: string
  description: string
  category: 'ownership' | 'transparency' | 'safety' | 'governance' | 'quality'
}

export const CONSTITUTION_PRINCIPLES: ConstitutionPrinciple[] = [
  {
    id: 'user_ownership',
    title: '用户拥有记忆所有权',
    description: '用户对自己的记忆数据拥有完全所有权，可以查看、纠正、删除、导出',
    category: 'ownership'
  },
  {
    id: 'user_control',
    title: '用户可以查看、纠正、删除、导出',
    description: '系统必须提供完整的记忆管理能力，用户随时可以操作自己的记忆',
    category: 'ownership'
  },
  {
    id: 'sensitive_default_no_record',
    title: '敏感内容默认不记',
    description: 'sensitive 和 private 级别的记忆默认不记录，除非用户明确确认',
    category: 'safety'
  },
  {
    id: 'high_risk_inference_confirm',
    title: '高风险推断必须确认',
    description: '任何可能影响用户决策、安全、隐私的推断必须经过用户确认才能生效',
    category: 'safety'
  },
  {
    id: 'temporary_emotion_no_permanent',
    title: '临时情绪不得永久化',
    description: '单次情绪表达不得被推断为长期性格特征，情绪类记忆默认短期有效',
    category: 'quality'
  },
  {
    id: 'project_personal_isolation',
    title: '项目记忆和个人记忆隔离',
    description: '项目工程规则类记忆与个人偏好记忆必须隔离，不得跨场景混用',
    category: 'governance'
  },
  {
    id: 'memory_usage_explainable',
    title: '记忆使用必须可解释',
    description: '每条被使用的记忆必须能说明来源、证据、使用原因',
    category: 'transparency'
  },
  {
    id: 'user_correction_priority',
    title: '用户最新纠正优先',
    description: '用户最新明确纠正优先于历史记忆和模型推断，系统必须立即响应纠正',
    category: 'governance'
  },
  {
    id: 'avoid_overfitting',
    title: '系统必须避免过度拟合',
    description: '不得将单次偏好扩展为全局偏好，不得将项目偏好无确认扩展为个人偏好',
    category: 'quality'
  },
  {
    id: 'forbidden_no_prompt',
    title: 'forbidden 记忆不得进入 prompt',
    description: '标记为 forbidden 的记忆在任何情况下都不得进入 prompt 上下文',
    category: 'safety'
  }
]

export interface ConstitutionViolation {
  principleId: string
  atomId: string
  reason: string
  severity: 'warning' | 'error' | 'critical'
}

export interface ConstitutionCheckResult {
  compliant: boolean
  violations: ConstitutionViolation[]
}

function isTemporaryEmotion(atom: MemoryAtom): boolean {
  return atom.type === 'emotion' && atom.layer === 'emotional' && atom.strength < 0.5
}

function isHighRiskInference(atom: MemoryAtom): boolean {
  return atom.confidence < 0.4 && atom.lifecycle !== 'draft' && atom.lifecycle !== 'confirmed'
}

function isSensitiveUnconfirmed(atom: MemoryAtom): boolean {
  const highSensitivity: MemorySensitivity[] = ['sensitive', 'private']
  return highSensitivity.includes(atom.sensitivity) && atom.lifecycle !== 'confirmed' && atom.lifecycle !== 'protected'
}

function isForbiddenInPrompt(atom: MemoryAtom): boolean {
  return atom.sensitivity === 'forbidden'
}

export function checkAtomAgainstConstitution(atom: MemoryAtom): ConstitutionCheckResult {
  const violations: ConstitutionViolation[] = []

  if (isForbiddenInPrompt(atom)) {
    violations.push({
      principleId: 'forbidden_no_prompt',
      atomId: atom.id,
      reason: `记忆 ${atom.id} 标记为 forbidden，不得进入 prompt`,
      severity: 'critical'
    })
  }

  if (isSensitiveUnconfirmed(atom)) {
    violations.push({
      principleId: 'sensitive_default_no_record',
      atomId: atom.id,
      reason: `敏感记忆 ${atom.id}（${atom.sensitivity}）未经用户确认`,
      severity: 'error'
    })
  }

  if (isHighRiskInference(atom)) {
    violations.push({
      principleId: 'high_risk_inference_confirm',
      atomId: atom.id,
      reason: `低置信度推断 ${atom.id}（confidence: ${atom.confidence}）未经确认`,
      severity: 'warning'
    })
  }

  if (isTemporaryEmotion(atom)) {
    violations.push({
      principleId: 'temporary_emotion_no_permanent',
      atomId: atom.id,
      reason: `情绪记忆 ${atom.id} 强度过低（${atom.strength}），不应永久化`,
      severity: 'warning'
    })
  }

  return {
    compliant: violations.length === 0,
    violations
  }
}

export function checkAtomsAgainstConstitution(atoms: MemoryAtom[]): ConstitutionCheckResult {
  const allViolations: ConstitutionViolation[] = []

  for (const atom of atoms) {
    const result = checkAtomAgainstConstitution(atom)
    allViolations.push(...result.violations)
  }

  return {
    compliant: allViolations.length === 0,
    violations: allViolations
  }
}

export interface CrossContextCheckInput {
  atom: MemoryAtom
  sourceScope: { userId: string; projectId: string }
  targetScope: { userId: string; projectId: string }
}

export function checkCrossContextIsolation(input: CrossContextCheckInput): ConstitutionCheckResult {
  const violations: ConstitutionViolation[] = []
  const { atom, sourceScope, targetScope } = input

  if (sourceScope.projectId !== targetScope.projectId) {
    const projectScopedTypes = ['preference', 'boundary', 'habit', 'interaction_style']
    if (projectScopedTypes.includes(atom.type)) {
      violations.push({
        principleId: 'project_personal_isolation',
        atomId: atom.id,
        reason: `项目级记忆 ${atom.id}（type: ${atom.type}）从项目 ${sourceScope.projectId} 跨到项目 ${targetScope.projectId}`,
        severity: 'error'
      })
    }
  }

  if (sourceScope.userId !== targetScope.userId) {
    violations.push({
      principleId: 'project_personal_isolation',
      atomId: atom.id,
      reason: `记忆 ${atom.id} 跨用户使用：从 ${sourceScope.userId} 到 ${targetScope.userId}`,
      severity: 'critical'
    })
  }

  return {
    compliant: violations.length === 0,
    violations
  }
}

export interface CorrectionPriorityInput {
  existingAtom: MemoryAtom
  correctionAtom: MemoryAtom
}

export function checkCorrectionPriority(input: CorrectionPriorityInput): ConstitutionCheckResult {
  const violations: ConstitutionViolation[] = []
  const { existingAtom, correctionAtom } = input

  const correctionTime = new Date(correctionAtom.updatedAt).getTime()
  const existingTime = new Date(existingAtom.updatedAt).getTime()

  if (correctionTime < existingTime) {
    violations.push({
      principleId: 'user_correction_priority',
      atomId: existingAtom.id,
      reason: `纠正记忆 ${correctionAtom.id}（${correctionAtom.updatedAt}）早于现有记忆 ${existingAtom.id}（${existingAtom.updatedAt}），纠正应优先`,
      severity: 'warning'
    })
  }

  return {
    compliant: violations.length === 0,
    violations
  }
}

export interface OverfittingCheckInput {
  atom: MemoryAtom
  evidenceCount: number
  isCrossScenario: boolean
}

export function checkOverfitting(input: OverfittingCheckInput): ConstitutionCheckResult {
  const violations: ConstitutionViolation[] = []
  const { atom, evidenceCount, isCrossScenario } = input

  if (evidenceCount <= 1 && atom.lifecycle === 'stable') {
    violations.push({
      principleId: 'avoid_overfitting',
      atomId: atom.id,
      reason: `记忆 ${atom.id} 仅 ${evidenceCount} 条证据但已标记为 stable，存在过拟合风险`,
      severity: 'warning'
    })
  }

  if (isCrossScenario && atom.lifecycle === 'stable' && atom.type === 'preference') {
    violations.push({
      principleId: 'avoid_overfitting',
      atomId: atom.id,
      reason: `偏好记忆 ${atom.id} 跨场景使用但未经确认，存在过度泛化风险`,
      severity: 'warning'
    })
  }

  return {
    compliant: violations.length === 0,
    violations
  }
}

export interface ConstitutionSummary {
  totalPrinciples: number
  categories: { category: string; count: number }[]
  principles: { id: string; title: string; category: string }[]
}

export function summarizeConstitution(): ConstitutionSummary {
  const categoryCount: Record<string, number> = {}
  for (const p of CONSTITUTION_PRINCIPLES) {
    categoryCount[p.category] = (categoryCount[p.category] ?? 0) + 1
  }

  return {
    totalPrinciples: CONSTITUTION_PRINCIPLES.length,
    categories: Object.entries(categoryCount).map(([category, count]) => ({ category, count })),
    principles: CONSTITUTION_PRINCIPLES.map(p => ({ id: p.id, title: p.title, category: p.category }))
  }
}

export function getPrincipleById(id: string): ConstitutionPrinciple | undefined {
  return CONSTITUTION_PRINCIPLES.find(p => p.id === id)
}

export function getPrinciplesByCategory(category: ConstitutionPrinciple['category']): ConstitutionPrinciple[] {
  return CONSTITUTION_PRINCIPLES.filter(p => p.category === category)
}
