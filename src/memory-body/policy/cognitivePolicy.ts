import type { MemoryAtom, MemoryScope } from '../types'

/**
 * CognitivePolicy — 设计文档 Architecture - Governance & Safety
 *
 * 认知治理策略：定义记忆系统的全局行为规则。
 * 与 AntiOverfittingPolicy（防过拟合）互补，CognitivePolicy 关注更广泛的治理策略：
 * - 记忆生命周期管理策略
 * - 跨场景记忆共享策略
 * - 敏感记忆处理策略
 * - 记忆质量门禁策略
 * - 认知预算分配策略
 */

export type PolicyDomain =
  | 'lifecycle'
  | 'cross_scenario'
  | 'sensitivity'
  | 'quality_gate'
  | 'budget_allocation'
  | 'evidence_requirement'
  | 'retention'
  | 'sharing'

export type PolicySeverity = 'strict' | 'moderate' | 'relaxed'

export interface PolicyRule {
  id: string
  domain: PolicyDomain
  name: string
  description: string
  severity: PolicySeverity
  enabled: boolean
  /** 规则评估函数返回的判定条件描述 */
  condition: string
  /** 违规时的处理动作 */
  action: 'block' | 'warn' | 'downgrade' | 'quarantine' | 'require_review' | 'limit_scope'
}

export interface PolicyEvaluationInput {
  atom: MemoryAtom
  targetScope?: MemoryScope
  targetScenario?: string
  evidenceCount: number
  crossScenarioCount: number
  daysSinceCreation: number
  daysSinceLastAccess: number
  hasConflict: boolean
  isUserConfirmed: boolean
}

export interface PolicyViolation {
  ruleId: string
  domain: PolicyDomain
  atomId: string
  description: string
  severity: PolicySeverity
  action: PolicyRule['action']
  recommendation: string
}

export interface PolicyEvaluationResult {
  passed: boolean
  violations: PolicyViolation[]
  warnings: PolicyViolation[]
  effectiveActions: PolicyRule['action'][]
  summary: string
}

// ─── 默认策略规则 ───────────────────────────────────────────

const DEFAULT_POLICY_RULES: PolicyRule[] = [
  {
    id: 'policy-lifecycle-001',
    domain: 'lifecycle',
    name: '临时记忆不得自动升级',
    description: 'lifecycle 为 transient 的记忆不得自动升级为 active 或 stable，必须经过用户确认',
    severity: 'strict',
    enabled: true,
    condition: 'atom.lifecycle === "transient" 且非用户手动确认',
    action: 'block'
  },
  {
    id: 'policy-lifecycle-002',
    domain: 'lifecycle',
    name: '长期未访问记忆降级',
    description: '超过 90 天未访问的 active 记忆应降级为 weakening',
    severity: 'moderate',
    enabled: true,
    condition: 'atom.lifecycle === "active" 且 daysSinceLastAccess > 90',
    action: 'downgrade'
  },
  {
    id: 'policy-cross-scenario-001',
    domain: 'cross_scenario',
    name: '单场景记忆限制跨场景推广',
    description: '仅在单个场景出现的记忆不应自动推广到全局',
    severity: 'strict',
    enabled: true,
    condition: 'crossScenarioCount < 2 且 targetScope 为全局',
    action: 'limit_scope'
  },
  {
    id: 'policy-cross-scenario-002',
    domain: 'cross_scenario',
    name: '情绪场景记忆隔离',
    description: 'emotional_support 场景的记忆不应影响 goal_planning 场景',
    severity: 'moderate',
    enabled: true,
    condition: 'atom 来自 emotional_support 场景但用于 goal_planning',
    action: 'warn'
  },
  {
    id: 'policy-sensitivity-001',
    domain: 'sensitivity',
    name: '敏感记忆强制审查',
    description: 'sensitivity 为 sensitive 或 forbidden 的记忆必须进入审查队列',
    severity: 'strict',
    enabled: true,
    condition: 'atom.sensitivity === "sensitive" || atom.sensitivity === "forbidden"',
    action: 'require_review'
  },
  {
    id: 'policy-sensitivity-002',
    domain: 'sensitivity',
    name: '禁止记忆隔离',
    description: 'forbidden 记忆不得进入任何 prompt 上下文',
    severity: 'strict',
    enabled: true,
    condition: 'atom.sensitivity === "forbidden" 且尝试进入 prompt',
    action: 'block'
  },
  {
    id: 'policy-quality-001',
    domain: 'quality_gate',
    name: '低置信度记忆质量门禁',
    description: 'confidence < 0.3 的记忆不得标记为 stable',
    severity: 'strict',
    enabled: true,
    condition: 'atom.confidence < 0.3 且 atom.lifecycle === "stable"',
    action: 'downgrade'
  },
  {
    id: 'policy-quality-002',
    domain: 'quality_gate',
    name: '无证据记忆限制',
    description: 'evidenceCount === 0 的记忆不得进入 confirmed 状态',
    severity: 'strict',
    enabled: true,
    condition: 'evidenceCount === 0 且 atom.lifecycle === "confirmed"',
    action: 'downgrade'
  },
  {
    id: 'policy-evidence-001',
    domain: 'evidence_requirement',
    name: '稳定记忆最低证据要求',
    description: 'stable 记忆至少需要 3 条证据',
    severity: 'moderate',
    enabled: true,
    condition: 'atom.lifecycle === "stable" 且 evidenceCount < 3',
    action: 'downgrade'
  },
  {
    id: 'policy-retention-001',
    domain: 'retention',
    name: '过期草稿清理',
    description: 'draft 状态超过 30 天的记忆应归档',
    severity: 'moderate',
    enabled: true,
    condition: 'atom.lifecycle === "draft" 且 daysSinceCreation > 30',
    action: 'downgrade'
  },
  {
    id: 'policy-sharing-001',
    domain: 'sharing',
    name: '跨项目记忆共享限制',
    description: 'private 敏感度的记忆不得跨项目共享',
    severity: 'strict',
    enabled: true,
    condition: 'atom.sensitivity === "private" 且跨项目使用',
    action: 'block'
  },
  {
    id: 'policy-budget-001',
    domain: 'budget_allocation',
    name: '冲突记忆预算限制',
    description: '存在冲突的记忆在解决前限制 prompt 预算',
    severity: 'moderate',
    enabled: true,
    condition: 'hasConflict === true',
    action: 'limit_scope'
  }
]

// ─── 策略评估 ───────────────────────────────────────────────

/**
 * 评估单条记忆是否违反认知策略
 */
export function evaluateAtomPolicy(
  input: PolicyEvaluationInput,
  rules: PolicyRule[] = DEFAULT_POLICY_RULES
): PolicyEvaluationResult {
  const violations: PolicyViolation[] = []
  const warnings: PolicyViolation[] = []

  for (const rule of rules) {
    if (!rule.enabled) continue

    const violation = checkRule(rule, input)
    if (!violation) continue

    if (rule.severity === 'strict') {
      violations.push(violation)
    } else {
      warnings.push(violation)
    }
  }

  const effectiveActions = [
    ...new Set([
      ...violations.map(v => v.action),
      ...warnings.map(v => v.action)
    ])
  ]

  const passed = violations.length === 0

  const summary = passed
    ? warnings.length > 0
      ? `通过（${warnings.length} 条警告）`
      : '全部策略通过'
    : `未通过：${violations.length} 条违规，${warnings.length} 条警告`

  return { passed, violations, warnings, effectiveActions, summary }
}

function checkRule(rule: PolicyRule, input: PolicyEvaluationInput): PolicyViolation | null {
  const { atom, evidenceCount, crossScenarioCount, daysSinceCreation, daysSinceLastAccess, hasConflict } = input

  switch (rule.id) {
    case 'policy-lifecycle-001':
      if (atom.lifecycle === 'transient' && !input.isUserConfirmed) {
        return makeViolation(rule, atom.id, '临时记忆未经过用户确认，禁止自动升级')
      }
      break

    case 'policy-lifecycle-002':
      if (atom.lifecycle === 'active' && daysSinceLastAccess > 90) {
        return makeViolation(rule, atom.id, `记忆已 ${daysSinceLastAccess} 天未访问，建议降级`)
      }
      break

    case 'policy-cross-scenario-001':
      if (crossScenarioCount < 2 && input.targetScope && !input.targetScope.projectId) {
        return makeViolation(rule, atom.id, `记忆仅在 ${crossScenarioCount} 个场景出现，不应推广到全局`)
      }
      break

    case 'policy-cross-scenario-002':
      if (input.targetScenario === 'goal_planning' &&
        atom.scenarios?.includes('emotional_support')) {
        return makeViolation(rule, atom.id, '情绪场景记忆不应用于目标规划场景')
      }
      break

    case 'policy-sensitivity-001':
      if (atom.sensitivity === 'sensitive' || atom.sensitivity === 'forbidden') {
        return makeViolation(rule, atom.id, `敏感记忆（${atom.sensitivity}）必须进入审查队列`)
      }
      break

    case 'policy-sensitivity-002':
      if (atom.sensitivity === 'forbidden') {
        return makeViolation(rule, atom.id, 'forbidden 记忆禁止进入 prompt 上下文')
      }
      break

    case 'policy-quality-001':
      if (atom.confidence < 0.3 && atom.lifecycle === 'stable') {
        return makeViolation(rule, atom.id, `置信度 ${atom.confidence} 过低，不应标记为 stable`)
      }
      break

    case 'policy-quality-002':
      if (evidenceCount === 0 && atom.lifecycle === 'confirmed') {
        return makeViolation(rule, atom.id, '无证据记忆不应标记为 confirmed')
      }
      break

    case 'policy-evidence-001':
      if (atom.lifecycle === 'stable' && evidenceCount < 3) {
        return makeViolation(rule, atom.id, `stable 记忆仅有 ${evidenceCount} 条证据，需要至少 3 条`)
      }
      break

    case 'policy-retention-001':
      if (atom.lifecycle === 'draft' && daysSinceCreation > 30) {
        return makeViolation(rule, atom.id, `草稿已存在 ${daysSinceCreation} 天，应归档`)
      }
      break

    case 'policy-sharing-001':
      if (atom.sensitivity === 'private' && input.targetScope &&
        input.targetScope.projectId !== atom.scope.projectId) {
        return makeViolation(rule, atom.id, 'private 记忆不得跨项目共享')
      }
      break

    case 'policy-budget-001':
      if (hasConflict) {
        return makeViolation(rule, atom.id, '存在冲突的记忆在解决前限制 prompt 预算')
      }
      break
  }

  return null
}

function makeViolation(rule: PolicyRule, atomId: string, description: string): PolicyViolation {
  return {
    ruleId: rule.id,
    domain: rule.domain,
    atomId,
    description,
    severity: rule.severity,
    action: rule.action,
    recommendation: `[${rule.name}] ${description}。建议：${rule.action === 'block' ? '阻止操作' : rule.action === 'downgrade' ? '降级处理' : rule.action === 'warn' ? '记录警告' : rule.action === 'require_review' ? '进入审查队列' : '限制范围'}`
  }
}

// ─── 策略管理 ───────────────────────────────────────────────

/**
 * 获取所有策略规则
 */
export function getAllPolicyRules(): PolicyRule[] {
  return [...DEFAULT_POLICY_RULES]
}

/**
 * 按领域获取策略规则
 */
export function getPolicyRulesByDomain(domain: PolicyDomain): PolicyRule[] {
  return DEFAULT_POLICY_RULES.filter(r => r.domain === domain)
}

/**
 * 创建自定义策略规则（返回新规则列表）
 */
export function createCustomPolicy(
  existingRules: PolicyRule[],
  newRule: Omit<PolicyRule, 'id'> & { id?: string }
): PolicyRule[] {
  const id = newRule.id ?? `policy-custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const rule: PolicyRule = { ...newRule, id }
  return [...existingRules, rule]
}

/**
 * 禁用/启用策略规则
 */
export function togglePolicyRule(
  rules: PolicyRule[],
  ruleId: string,
  enabled: boolean
): PolicyRule[] {
  return rules.map(r => r.id === ruleId ? { ...r, enabled } : r)
}

/**
 * 批量评估多条记忆
 */
export function evaluateAtomsPolicy(
  inputs: PolicyEvaluationInput[],
  rules?: PolicyRule[]
): { results: PolicyEvaluationResult[]; overallPassed: boolean; summary: string } {
  const results = inputs.map(input => evaluateAtomPolicy(input, rules))
  const overallPassed = results.every(r => r.passed)
  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0)
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0)

  return {
    results,
    overallPassed,
    summary: overallPassed
      ? `全部 ${inputs.length} 条记忆通过策略检查（${totalWarnings} 条警告）`
      : `${inputs.length} 条记忆中 ${results.filter(r => !r.passed).length} 条未通过（${totalViolations} 条违规，${totalWarnings} 条警告）`
  }
}

/**
 * 生成策略摘要（面向用户）
 */
export function summarizePolicyResult(result: PolicyEvaluationResult): string {
  const lines: string[] = []

  if (result.passed && result.warnings.length === 0) {
    return '✓ 认知策略全部通过'
  }

  if (!result.passed) {
    lines.push(`✗ ${result.violations.length} 条策略违规：`)
    for (const v of result.violations) {
      lines.push(`  • [${v.domain}] ${v.description}`)
    }
  }

  if (result.warnings.length > 0) {
    lines.push(`⚠ ${result.warnings.length} 条策略警告：`)
    for (const w of result.warnings) {
      lines.push(`  • [${w.domain}] ${w.description}`)
    }
  }

  return lines.join('\n')
}
