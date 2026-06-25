import type { MemoryAtom, MemoryScenario } from '../core/memoryBodyTypes'

export type SandboxStatus =
  | 'candidate'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'promoted'

export interface SandboxedAtom {
  atom: MemoryAtom
  status: SandboxStatus
  reason: string
  addedAt: string
  reviewedAt?: string
  expiresAt?: string
  reviewCount: number
  promotionCriteria: PromotionCriteria
}

export interface PromotionCriteria {
  minConfidence: number
  minEvidenceCount: number
  minReinforcementCount: number
  maxAgeDays: number
  requireUserConfirmation: boolean
}

export interface MemorySandbox {
  id: string
  atoms: SandboxedAtom[]
  maxCapacity: number
  autoPromoteEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface SandboxPromotionResult {
  promoted: SandboxedAtom[]
  rejected: SandboxedAtom[]
  expired: SandboxedAtom[]
}

export interface SandboxSummary {
  totalCandidates: number
  underReview: number
  approved: number
  rejected: number
  expired: number
  promoted: number
  capacityUsage: string
}

const DEFAULT_PROMOTION_CRITERIA: PromotionCriteria = {
  minConfidence: 0.6,
  minEvidenceCount: 2,
  minReinforcementCount: 1,
  maxAgeDays: 30,
  requireUserConfirmation: true
}

const DEFAULT_MAX_CAPACITY = 50

function generateSandboxId(): string {
  return `sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createMemorySandbox(
  overrides: Partial<{
    maxCapacity: number
    autoPromoteEnabled: boolean
  }> = {}
): MemorySandbox {
  return {
    id: generateSandboxId(),
    atoms: [],
    maxCapacity: overrides.maxCapacity || DEFAULT_MAX_CAPACITY,
    autoPromoteEnabled: overrides.autoPromoteEnabled || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export function addToSandbox(
  sandbox: MemorySandbox,
  atom: MemoryAtom,
  reason: string,
  promotionCriteria?: Partial<PromotionCriteria>
): { sandbox: MemorySandbox; sandboxed: SandboxedAtom | null } {
  if (sandbox.atoms.length >= sandbox.maxCapacity) {
    return { sandbox, sandboxed: null }
  }

  const exists = sandbox.atoms.some(s => s.atom.id === atom.id)
  if (exists) return { sandbox, sandboxed: null }

  const sandboxed: SandboxedAtom = {
    atom: {
      ...atom,
      lifecycle: 'draft'
    },
    status: 'candidate',
    reason,
    addedAt: new Date().toISOString(),
    reviewCount: 0,
    promotionCriteria: {
      ...DEFAULT_PROMOTION_CRITERIA,
      ...promotionCriteria
    }
  }

  return {
    sandbox: {
      ...sandbox,
      atoms: [...sandbox.atoms, sandboxed],
      updatedAt: new Date().toISOString()
    },
    sandboxed
  }
}

export function reviewSandboxedAtom(
  sandbox: MemorySandbox,
  atomId: string,
  decision: 'approved' | 'rejected'
): MemorySandbox {
  return {
    ...sandbox,
    atoms: sandbox.atoms.map(s =>
      s.atom.id === atomId
        ? {
            ...s,
            status: decision,
            reviewedAt: new Date().toISOString(),
            reviewCount: s.reviewCount + 1
          }
        : s
    ),
    updatedAt: new Date().toISOString()
  }
}

export function promoteSandboxedAtom(
  sandbox: MemorySandbox,
  atomId: string
): { sandbox: MemorySandbox; promotedAtom: MemoryAtom | null } {
  const entry = sandbox.atoms.find(s => s.atom.id === atomId)
  if (!entry || entry.status !== 'approved') {
    return { sandbox, promotedAtom: null }
  }

  const promotedAtom: MemoryAtom = {
    ...entry.atom,
    lifecycle: 'active',
    updatedAt: new Date().toISOString()
  }

  return {
    sandbox: {
      ...sandbox,
      atoms: sandbox.atoms.map(s =>
        s.atom.id === atomId ? { ...s, status: 'promoted' } : s
      ),
      updatedAt: new Date().toISOString()
    },
    promotedAtom
  }
}

export function checkPromotionEligibility(
  entry: SandboxedAtom
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = []
  const atom = entry.atom

  if (atom.confidence < entry.promotionCriteria.minConfidence) {
    reasons.push(`Confidence ${atom.confidence} below minimum ${entry.promotionCriteria.minConfidence}`)
  }

  if (atom.evidence.length < entry.promotionCriteria.minEvidenceCount) {
    reasons.push(`Evidence count ${atom.evidence.length} below minimum ${entry.promotionCriteria.minEvidenceCount}`)
  }

  if (atom.accessCount < entry.promotionCriteria.minReinforcementCount) {
    reasons.push(`Reinforcement count ${atom.accessCount} below minimum ${entry.promotionCriteria.minReinforcementCount}`)
  }

  const ageInDays = (Date.now() - new Date(atom.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  if (ageInDays > entry.promotionCriteria.maxAgeDays) {
    reasons.push(`Age ${ageInDays.toFixed(0)} days exceeds maximum ${entry.promotionCriteria.maxAgeDays}`)
  }

  return {
    eligible: reasons.length === 0,
    reasons
  }
}

export function autoPromoteEligible(
  sandbox: MemorySandbox
): SandboxPromotionResult {
  const promoted: SandboxedAtom[] = []
  const rejected: SandboxedAtom[] = []
  const expired: SandboxedAtom[] = []

  const now = Date.now()

  for (const entry of sandbox.atoms) {
    if (entry.status !== 'candidate' && entry.status !== 'under_review') continue

    if (entry.expiresAt && new Date(entry.expiresAt).getTime() < now) {
      expired.push({ ...entry, status: 'expired' })
      continue
    }

    const { eligible } = checkPromotionEligibility(entry)
    if (eligible) {
      promoted.push({ ...entry, status: 'approved' })
    } else {
      rejected.push(entry)
    }
  }

  return { promoted, rejected, expired }
}

export function expireStaleCandidates(
  sandbox: MemorySandbox,
  maxAgeDays: number = 14
): MemorySandbox {
  const now = Date.now()
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000

  return {
    ...sandbox,
    atoms: sandbox.atoms.map(s => {
      if (s.status !== 'candidate') return s
      const age = now - new Date(s.addedAt).getTime()
      if (age > maxAge) {
        return { ...s, status: 'expired' as SandboxStatus }
      }
      return s
    }),
    updatedAt: new Date().toISOString()
  }
}

export function getSandboxedAtomsByStatus(
  sandbox: MemorySandbox,
  status: SandboxStatus
): SandboxedAtom[] {
  return sandbox.atoms.filter(s => s.status === status)
}

export function getSandboxedAtomsForScenario(
  sandbox: MemorySandbox,
  scenario: MemoryScenario
): SandboxedAtom[] {
  return sandbox.atoms.filter(s => {
    const scenarios = s.atom.scenarios || ['general']
    return scenarios.includes(scenario)
  })
}

export function removeFromSandbox(
  sandbox: MemorySandbox,
  atomId: string
): MemorySandbox {
  return {
    ...sandbox,
    atoms: sandbox.atoms.filter(s => s.atom.id !== atomId),
    updatedAt: new Date().toISOString()
  }
}

export function clearSandbox(sandbox: MemorySandbox): MemorySandbox {
  return {
    ...sandbox,
    atoms: [],
    updatedAt: new Date().toISOString()
  }
}

export function summarizeSandbox(sandbox: MemorySandbox): SandboxSummary {
  const candidates = sandbox.atoms.filter(s => s.status === 'candidate').length
  const underReview = sandbox.atoms.filter(s => s.status === 'under_review').length
  const approved = sandbox.atoms.filter(s => s.status === 'approved').length
  const rejected = sandbox.atoms.filter(s => s.status === 'rejected').length
  const expired = sandbox.atoms.filter(s => s.status === 'expired').length
  const promoted = sandbox.atoms.filter(s => s.status === 'promoted').length

  return {
    totalCandidates: candidates,
    underReview,
    approved,
    rejected,
    expired,
    promoted,
    capacityUsage: `${sandbox.atoms.length}/${sandbox.maxCapacity}`
  }
}
