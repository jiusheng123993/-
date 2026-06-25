import type { MemoryAtom, MemoryScenario } from '../core/memoryBodyTypes'

export type ContractClause =
  | 'usable_in_chat'
  | 'usable_in_planning'
  | 'usable_in_coding'
  | 'usable_in_recommendation'
  | 'usable_in_emotional_support'
  | 'requires_confirmation'
  | 'auto_expire'
  | 'scenario_locked'
  | 'confidence_threshold'
  | 'max_usage_count'
  | 'review_required'
  | 'forbidden_in_production'

export interface ContractTerm {
  clause: ContractClause
  value: string | number | boolean
  description: string
}

export interface MemoryContract {
  id: string
  atomId: string
  terms: ContractTerm[]
  allowedScenarios: MemoryScenario[]
  excludedScenarios: MemoryScenario[]
  requiresConfirmation: boolean
  confidenceThreshold: number
  maxUsageCount: number
  currentUsageCount: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ContractValidationResult {
  valid: boolean
  violations: ContractViolation[]
}

export interface ContractViolation {
  clause: ContractClause
  reason: string
  severity: 'warning' | 'block'
}

const DEFAULT_ALLOWED_SCENARIOS: MemoryScenario[] = [
  'general', 'chat', 'study', 'focus', 'goal_planning',
  'emotional_support', 'food_recommendation', 'reflection', 'knowledge_graph'
]

function generateContractId(): string {
  return `contract-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createMemoryContract(
  atomId: string,
  overrides: Partial<{
    allowedScenarios: MemoryScenario[]
    excludedScenarios: MemoryScenario[]
    requiresConfirmation: boolean
    confidenceThreshold: number
    maxUsageCount: number
    expiresAt: string | null
  }> = {}
): MemoryContract {
  return {
    id: generateContractId(),
    atomId,
    terms: [],
    allowedScenarios: overrides.allowedScenarios ?? [...DEFAULT_ALLOWED_SCENARIOS],
    excludedScenarios: overrides.excludedScenarios ?? [],
    requiresConfirmation: overrides.requiresConfirmation ?? false,
    confidenceThreshold: overrides.confidenceThreshold ?? 0.3,
    maxUsageCount: overrides.maxUsageCount ?? 100,
    currentUsageCount: 0,
    expiresAt: overrides.expiresAt ?? null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export function addContractTerm(
  contract: MemoryContract,
  clause: ContractClause,
  value: string | number | boolean,
  description: string
): MemoryContract {
  const existing = contract.terms.find(t => t.clause === clause)
  if (existing) {
    return {
      ...contract,
      terms: contract.terms.map(t =>
        t.clause === clause ? { ...t, value, description } : t
      ),
      updatedAt: new Date().toISOString()
    }
  }

  return {
    ...contract,
    terms: [...contract.terms, { clause, value, description }],
    updatedAt: new Date().toISOString()
  }
}

export function removeContractTerm(
  contract: MemoryContract,
  clause: ContractClause
): MemoryContract {
  return {
    ...contract,
    terms: contract.terms.filter(t => t.clause !== clause),
    updatedAt: new Date().toISOString()
  }
}

export function allowScenario(
  contract: MemoryContract,
  scenario: MemoryScenario
): MemoryContract {
  if (contract.allowedScenarios.includes(scenario)) return contract
  return {
    ...contract,
    allowedScenarios: [...contract.allowedScenarios, scenario],
    excludedScenarios: contract.excludedScenarios.filter(s => s !== scenario),
    updatedAt: new Date().toISOString()
  }
}

export function excludeScenario(
  contract: MemoryContract,
  scenario: MemoryScenario
): MemoryContract {
  if (contract.excludedScenarios.includes(scenario)) return contract
  return {
    ...contract,
    allowedScenarios: contract.allowedScenarios.filter(s => s !== scenario),
    excludedScenarios: [...contract.excludedScenarios, scenario],
    updatedAt: new Date().toISOString()
  }
}

export function setRequiresConfirmation(
  contract: MemoryContract,
  requires: boolean
): MemoryContract {
  return {
    ...contract,
    requiresConfirmation: requires,
    updatedAt: new Date().toISOString()
  }
}

export function setConfidenceThreshold(
  contract: MemoryContract,
  threshold: number
): MemoryContract {
  return {
    ...contract,
    confidenceThreshold: Math.max(0, Math.min(1, threshold)),
    updatedAt: new Date().toISOString()
  }
}

export function setMaxUsageCount(
  contract: MemoryContract,
  maxCount: number
): MemoryContract {
  return {
    ...contract,
    maxUsageCount: Math.max(0, maxCount),
    updatedAt: new Date().toISOString()
  }
}

export function setExpiration(
  contract: MemoryContract,
  expiresAt: string | null
): MemoryContract {
  return {
    ...contract,
    expiresAt,
    updatedAt: new Date().toISOString()
  }
}

export function recordUsage(contract: MemoryContract): MemoryContract {
  return {
    ...contract,
    currentUsageCount: contract.currentUsageCount + 1,
    updatedAt: new Date().toISOString()
  }
}

export function deactivateContract(contract: MemoryContract): MemoryContract {
  return {
    ...contract,
    isActive: false,
    updatedAt: new Date().toISOString()
  }
}

export function activateContract(contract: MemoryContract): MemoryContract {
  return {
    ...contract,
    isActive: true,
    updatedAt: new Date().toISOString()
  }
}

export function validateContract(
  contract: MemoryContract,
  atom: MemoryAtom,
  scenario: MemoryScenario
): ContractValidationResult {
  const violations: ContractViolation[] = []

  if (!contract.isActive) {
    violations.push({
      clause: 'usable_in_chat',
      reason: 'Contract is not active',
      severity: 'block'
    })
  }

  if (contract.excludedScenarios.includes(scenario)) {
    violations.push({
      clause: 'scenario_locked',
      reason: `Scenario "${scenario}" is excluded by contract`,
      severity: 'block'
    })
  }

  if (!contract.allowedScenarios.includes(scenario)) {
    violations.push({
      clause: 'scenario_locked',
      reason: `Scenario "${scenario}" is not in allowed list`,
      severity: 'block'
    })
  }

  if (atom.confidence < contract.confidenceThreshold) {
    violations.push({
      clause: 'confidence_threshold',
      reason: `Atom confidence ${atom.confidence} is below threshold ${contract.confidenceThreshold}`,
      severity: 'warning'
    })
  }

  if (contract.maxUsageCount > 0 && contract.currentUsageCount >= contract.maxUsageCount) {
    violations.push({
      clause: 'max_usage_count',
      reason: `Usage count ${contract.currentUsageCount} has reached max ${contract.maxUsageCount}`,
      severity: 'block'
    })
  }

  if (contract.expiresAt && new Date(contract.expiresAt) < new Date()) {
    violations.push({
      clause: 'auto_expire',
      reason: `Contract expired at ${contract.expiresAt}`,
      severity: 'block'
    })
  }

  if (contract.requiresConfirmation && atom.lifecycle !== 'confirmed') {
    violations.push({
      clause: 'requires_confirmation',
      reason: 'Memory requires user confirmation before use',
      severity: 'warning'
    })
  }

  const hasBlockViolation = violations.some(v => v.severity === 'block')
  return {
    valid: !hasBlockViolation,
    violations
  }
}

export function buildContractFromAtom(
  atom: MemoryAtom,
  overrides: Partial<{
    allowedScenarios: MemoryScenario[]
    excludedScenarios: MemoryScenario[]
    requiresConfirmation: boolean
    confidenceThreshold: number
    maxUsageCount: number
  }> = {}
): MemoryContract {
  const excludedScenarios: MemoryScenario[] = []

  if (atom.sensitivity === 'sensitive' || atom.sensitivity === 'private') {
    excludedScenarios.push('knowledge_graph')
  }

  if (atom.sensitivity === 'forbidden') {
    return createMemoryContract(atom.id, {
      allowedScenarios: [],
      excludedScenarios: [...DEFAULT_ALLOWED_SCENARIOS],
      requiresConfirmation: true,
      confidenceThreshold: 1.0,
      maxUsageCount: 0,
      ...overrides
    })
  }

  if (atom.lifecycle === 'draft') {
    return createMemoryContract(atom.id, {
      allowedScenarios: ['general'],
      excludedScenarios: ['goal_planning', 'focus', 'study'],
      requiresConfirmation: true,
      confidenceThreshold: 0.5,
      maxUsageCount: 3,
      ...overrides
    })
  }

  return createMemoryContract(atom.id, {
    excludedScenarios,
    requiresConfirmation: atom.lifecycle !== 'confirmed' && atom.lifecycle !== 'stable' && atom.lifecycle !== 'protected',
    confidenceThreshold: atom.lifecycle === 'stable' || atom.lifecycle === 'protected' ? 0.5 : 0.3,
    ...overrides
  })
}

export function summarizeContract(contract: MemoryContract): {
  id: string
  atomId: string
  isActive: boolean
  termCount: number
  allowedScenarioCount: number
  excludedScenarioCount: number
  requiresConfirmation: boolean
  confidenceThreshold: number
  usageRatio: string
  isExpired: boolean
  violationRisk: 'low' | 'medium' | 'high'
} {
  const isExpired = contract.expiresAt ? new Date(contract.expiresAt) < new Date() : false
  const usageRatio = contract.maxUsageCount > 0
    ? `${contract.currentUsageCount}/${contract.maxUsageCount}`
    : `${contract.currentUsageCount}/∞`

  let violationRisk: 'low' | 'medium' | 'high' = 'low'
  if (!contract.isActive || isExpired) {
    violationRisk = 'high'
  } else if (
    contract.currentUsageCount >= contract.maxUsageCount * 0.8 ||
    contract.excludedScenarios.length > 3
  ) {
    violationRisk = 'medium'
  }

  return {
    id: contract.id,
    atomId: contract.atomId,
    isActive: contract.isActive,
    termCount: contract.terms.length,
    allowedScenarioCount: contract.allowedScenarios.length,
    excludedScenarioCount: contract.excludedScenarios.length,
    requiresConfirmation: contract.requiresConfirmation,
    confidenceThreshold: contract.confidenceThreshold,
    usageRatio,
    isExpired,
    violationRisk
  }
}
