import { describe, it, expect } from 'vitest'
import {
  evaluateAtomPolicy,
  evaluateAtomsPolicy,
  getAllPolicyRules,
  getPolicyRulesByDomain,
  createCustomPolicy,
  togglePolicyRule,
  summarizePolicyResult,
} from '../policy/cognitivePolicy'
import type { MemoryAtom, MemoryScope } from '../types'
import type { PolicyRule, PolicyEvaluationInput } from '../policy/cognitivePolicy'

const scope: MemoryScope = { userId: 'user-1', projectId: 'project-1' }
const now = '2026-06-25T00:00:00.000Z'

function makeAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: 'atom-1',
    scope,
    layer: 'semantic',
    type: 'preference',
    subject: 'user',
    predicate: 'likes',
    object: 'TypeScript',
    content: '用户喜欢 TypeScript',
    source: 'chat',
    confidence: 0.8,
    strength: 0.7,
    emotionalWeight: 0.2,
    sensitivity: 'personal',
    lifecycle: 'active',
    evidence: [],
    tags: ['coding'],
    scenarios: ['chat'],
    createdAt: now,
    updatedAt: now,
    lastAccessedAt: now,
    accessCount: 0,
    contradictionOf: [],
    ...overrides,
  }
}

function makeInput(overrides: Partial<PolicyEvaluationInput> = {}): PolicyEvaluationInput {
  return {
    atom: makeAtom(),
    evidenceCount: 3,
    crossScenarioCount: 2,
    daysSinceCreation: 10,
    daysSinceLastAccess: 5,
    hasConflict: false,
    isUserConfirmed: true,
    ...overrides,
  }
}

// ─── evaluateAtomPolicy ─────────────────────────────────────

describe('evaluateAtomPolicy', () => {
  it('passes for a healthy atom with all conditions met', () => {
    const result = evaluateAtomPolicy(makeInput())
    expect(result.passed).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('detects transient lifecycle without user confirmation', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ lifecycle: 'transient' }),
      isUserConfirmed: false,
    }))
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.ruleId === 'policy-lifecycle-001')).toBe(true)
  })

  it('detects long-unaccessed active memory', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ lifecycle: 'active' }),
      daysSinceLastAccess: 100,
    }))
    expect(result.warnings.some(v => v.ruleId === 'policy-lifecycle-002')).toBe(true)
  })

  it('detects single-scenario global promotion', () => {
    const result = evaluateAtomPolicy(makeInput({
      crossScenarioCount: 1,
      targetScope: { userId: 'user-1', projectId: '' },
    }))
    expect(result.violations.some(v => v.ruleId === 'policy-cross-scenario-001')).toBe(true)
  })

  it('detects emotional support memory used in goal planning', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ scenarios: ['emotional_support'] }),
      targetScenario: 'goal_planning',
    }))
    expect(result.warnings.some(v => v.ruleId === 'policy-cross-scenario-002')).toBe(true)
  })

  it('detects sensitive memory requiring review', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ sensitivity: 'sensitive' }),
    }))
    expect(result.violations.some(v => v.ruleId === 'policy-sensitivity-001')).toBe(true)
  })

  it('detects forbidden memory blocking', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ sensitivity: 'forbidden' }),
    }))
    expect(result.violations.some(v => v.ruleId === 'policy-sensitivity-002')).toBe(true)
  })

  it('detects low confidence stable memory', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ confidence: 0.2, lifecycle: 'stable' }),
    }))
    expect(result.violations.some(v => v.ruleId === 'policy-quality-001')).toBe(true)
  })

  it('detects confirmed memory without evidence', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ lifecycle: 'confirmed' }),
      evidenceCount: 0,
    }))
    expect(result.violations.some(v => v.ruleId === 'policy-quality-002')).toBe(true)
  })

  it('detects stable memory with insufficient evidence', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ lifecycle: 'stable' }),
      evidenceCount: 1,
    }))
    expect(result.warnings.some(v => v.ruleId === 'policy-evidence-001')).toBe(true)
  })

  it('detects stale draft memory', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ lifecycle: 'draft' }),
      daysSinceCreation: 40,
    }))
    expect(result.warnings.some(v => v.ruleId === 'policy-retention-001')).toBe(true)
  })

  it('detects private memory cross-project sharing', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ sensitivity: 'private', scope: { userId: 'user-1', projectId: 'proj-a' } }),
      targetScope: { userId: 'user-1', projectId: 'proj-b' },
    }))
    expect(result.violations.some(v => v.ruleId === 'policy-sharing-001')).toBe(true)
  })

  it('detects conflict memory budget limit', () => {
    const result = evaluateAtomPolicy(makeInput({
      hasConflict: true,
    }))
    expect(result.warnings.some(v => v.ruleId === 'policy-budget-001')).toBe(true)
  })

  it('returns effective actions from violations and warnings', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ sensitivity: 'forbidden', lifecycle: 'transient' }),
      isUserConfirmed: false,
    }))
    expect(result.effectiveActions.length).toBeGreaterThan(0)
    expect(result.effectiveActions).toContain('block')
  })

  it('passes with warnings only (no strict violations)', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ lifecycle: 'active' }),
      daysSinceLastAccess: 100,
      hasConflict: true,
    }))
    expect(result.passed).toBe(true)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.violations).toHaveLength(0)
  })

  it('respects disabled rules', () => {
    const rules = getAllPolicyRules().map(r =>
      r.id === 'policy-lifecycle-001' ? { ...r, enabled: false } : r
    )
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ lifecycle: 'transient' }),
      isUserConfirmed: false,
    }), rules)
    expect(result.passed).toBe(true)
  })
})

// ─── evaluateAtomsPolicy ────────────────────────────────────

describe('evaluateAtomsPolicy', () => {
  it('evaluates multiple atoms and returns overall result', () => {
    const inputs = [
      makeInput({ atom: makeAtom({ id: 'a1', lifecycle: 'active' }) }),
      makeInput({ atom: makeAtom({ id: 'a2', lifecycle: 'active' }) }),
    ]
    const result = evaluateAtomsPolicy(inputs)
    expect(result.results).toHaveLength(2)
    expect(result.overallPassed).toBe(true)
    expect(result.summary).toContain('全部')
  })

  it('reports failure when any atom fails', () => {
    const inputs = [
      makeInput({ atom: makeAtom({ id: 'a1', lifecycle: 'active' }) }),
      makeInput({ atom: makeAtom({ id: 'a2', sensitivity: 'forbidden' }) }),
    ]
    const result = evaluateAtomsPolicy(inputs)
    expect(result.overallPassed).toBe(false)
    expect(result.summary).toContain('未通过')
  })

  it('handles empty input array', () => {
    const result = evaluateAtomsPolicy([])
    expect(result.results).toHaveLength(0)
    expect(result.overallPassed).toBe(true)
  })
})

// ─── getAllPolicyRules ──────────────────────────────────────

describe('getAllPolicyRules', () => {
  it('returns all default policy rules', () => {
    const rules = getAllPolicyRules()
    expect(rules.length).toBeGreaterThan(0)
    expect(rules.every(r => typeof r.id === 'string')).toBe(true)
    expect(rules.every(r => typeof r.domain === 'string')).toBe(true)
  })

  it('returns a copy, not the original reference', () => {
    const rules1 = getAllPolicyRules()
    const rules2 = getAllPolicyRules()
    expect(rules1).not.toBe(rules2)
    expect(rules1).toEqual(rules2)
  })
})

// ─── getPolicyRulesByDomain ─────────────────────────────────

describe('getPolicyRulesByDomain', () => {
  it('filters rules by domain', () => {
    const lifecycleRules = getPolicyRulesByDomain('lifecycle')
    expect(lifecycleRules.length).toBeGreaterThan(0)
    expect(lifecycleRules.every(r => r.domain === 'lifecycle')).toBe(true)
  })

  it('returns empty array for unknown domain', () => {
    const rules = getPolicyRulesByDomain('nonexistent' as PolicyRule['domain'])
    expect(rules).toHaveLength(0)
  })
})

// ─── createCustomPolicy ─────────────────────────────────────

describe('createCustomPolicy', () => {
  it('adds a new custom rule to existing rules', () => {
    const existing = getAllPolicyRules()
    const newRule: Omit<PolicyRule, 'id'> = {
      domain: 'lifecycle',
      name: '自定义规则',
      description: '测试自定义规则',
      severity: 'moderate',
      enabled: true,
      condition: 'custom condition',
      action: 'warn',
    }
    const updated = createCustomPolicy(existing, newRule)
    expect(updated.length).toBe(existing.length + 1)
    expect(updated[updated.length - 1].name).toBe('自定义规则')
    expect(updated[updated.length - 1].id).toMatch(/^policy-custom-/)
  })

  it('uses provided id when specified', () => {
    const existing = getAllPolicyRules()
    const newRule: Omit<PolicyRule, 'id'> & { id: string } = {
      id: 'my-custom-rule',
      domain: 'lifecycle',
      name: '自定义规则',
      description: '测试',
      severity: 'moderate',
      enabled: true,
      condition: 'custom',
      action: 'warn',
    }
    const updated = createCustomPolicy(existing, newRule)
    expect(updated[updated.length - 1].id).toBe('my-custom-rule')
  })
})

// ─── togglePolicyRule ───────────────────────────────────────

describe('togglePolicyRule', () => {
  it('disables a rule by id', () => {
    const rules = getAllPolicyRules()
    const updated = togglePolicyRule(rules, 'policy-lifecycle-001', false)
    const toggled = updated.find(r => r.id === 'policy-lifecycle-001')
    expect(toggled!.enabled).toBe(false)
  })

  it('enables a disabled rule', () => {
    const rules = getAllPolicyRules().map(r =>
      r.id === 'policy-lifecycle-001' ? { ...r, enabled: false } : r
    )
    const updated = togglePolicyRule(rules, 'policy-lifecycle-001', true)
    const toggled = updated.find(r => r.id === 'policy-lifecycle-001')
    expect(toggled!.enabled).toBe(true)
  })

  it('does not modify other rules', () => {
    const rules = getAllPolicyRules()
    const updated = togglePolicyRule(rules, 'policy-lifecycle-001', false)
    const other = updated.find(r => r.id === 'policy-lifecycle-002')
    expect(other!.enabled).toBe(true)
  })

  it('returns same array when ruleId not found', () => {
    const rules = getAllPolicyRules()
    const updated = togglePolicyRule(rules, 'nonexistent', false)
    expect(updated).toEqual(rules)
  })
})

// ─── summarizePolicyResult ──────────────────────────────────

describe('summarizePolicyResult', () => {
  it('returns success message when all passed with no warnings', () => {
    const result = evaluateAtomPolicy(makeInput())
    const summary = summarizePolicyResult(result)
    expect(summary).toContain('✓')
    expect(summary).toContain('全部通过')
  })

  it('returns violation details when not passed', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ sensitivity: 'forbidden' }),
    }))
    const summary = summarizePolicyResult(result)
    expect(summary).toContain('✗')
    expect(summary).toContain('违规')
  })

  it('returns warning details when warnings exist', () => {
    const result = evaluateAtomPolicy(makeInput({
      atom: makeAtom({ lifecycle: 'active' }),
      daysSinceLastAccess: 100,
    }))
    const summary = summarizePolicyResult(result)
    expect(summary).toContain('⚠')
    expect(summary).toContain('警告')
  })
})
