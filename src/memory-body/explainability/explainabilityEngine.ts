import type { MemoryAtom, MemoryEvidence, MemoryLifecycle } from '../core/memoryBodyTypes'
import { scoreMemoryQuality, type MemoryQualityScore } from '../quality/memoryQuality'
import { calculateMemoryEconomy, type MemoryEconomy } from '../economy/memoryEconomy'

export interface MemoryProvenance {
  atomId: string
  source: string
  sourceType: MemoryAtom['source']
  firstRecordedAt: string
  evidenceChain: MemoryEvidence[]
  totalEvidence: number
}

export interface MemoryReinforcement {
  atomId: string
  reinforcedCount: number
  lastReinforcedAt: string
  reinforcementHistory: { timestamp: string; source: string }[]
}

export interface MemoryConfirmation {
  atomId: string
  confirmed: boolean
  confirmedAt?: string
  confirmedBy?: string
}

export interface MemoryUsageRecord {
  atomId: string
  usedInResponse: boolean
  lastUsedAt?: string
  usageCount: number
  usageContexts: string[]
}

export interface MemoryConflict {
  atomId: string
  hasConflicts: boolean
  conflictingAtomIds: string[]
  conflictDescription: string
}

export interface MemoryPromptDecision {
  atomId: string
  included: boolean
  reason: string
  qualityScore: MemoryQualityScore
  economyScore: MemoryEconomy
}

export interface AtomExplanation {
  provenance: MemoryProvenance
  reinforcement: MemoryReinforcement
  confirmation: MemoryConfirmation
  usage: MemoryUsageRecord
  conflict: MemoryConflict
  promptDecision: MemoryPromptDecision
  summary: string
}

export interface ExplainabilityEngineInput {
  atom: MemoryAtom
  allAtoms?: MemoryAtom[]
  usedInPrompt?: boolean
  promptReason?: string
}

function buildProvenance(atom: MemoryAtom): MemoryProvenance {
  return {
    atomId: atom.id,
    source: atom.content,
    sourceType: atom.source,
    firstRecordedAt: atom.createdAt,
    evidenceChain: atom.evidence,
    totalEvidence: atom.evidence.length
  }
}

function buildReinforcement(atom: MemoryAtom): MemoryReinforcement {
  const reinforcementHistory = atom.evidence
    .filter(e => e.confidence >= 0.6)
    .map(e => ({ timestamp: e.timestamp, source: e.sourceText }))

  return {
    atomId: atom.id,
    reinforcedCount: reinforcementHistory.length,
    lastReinforcedAt: reinforcementHistory.length > 0
      ? reinforcementHistory[reinforcementHistory.length - 1].timestamp
      : atom.createdAt,
    reinforcementHistory
  }
}

function buildConfirmation(atom: MemoryAtom): MemoryConfirmation {
  const confirmedLifecycles: MemoryLifecycle[] = ['confirmed', 'stable', 'protected']
  return {
    atomId: atom.id,
    confirmed: confirmedLifecycles.includes(atom.lifecycle),
    confirmedAt: confirmedLifecycles.includes(atom.lifecycle) ? atom.updatedAt : undefined
  }
}

function buildUsageRecord(atom: MemoryAtom, usedInPrompt?: boolean, promptReason?: string): MemoryUsageRecord {
  return {
    atomId: atom.id,
    usedInResponse: usedInPrompt ?? false,
    lastUsedAt: atom.lastAccessedAt !== atom.createdAt ? atom.lastAccessedAt : undefined,
    usageCount: atom.accessCount,
    usageContexts: usedInPrompt && promptReason ? [promptReason] : []
  }
}

function buildConflict(atom: MemoryAtom, allAtoms?: MemoryAtom[]): MemoryConflict {
  if (!allAtoms || allAtoms.length === 0) {
    return {
      atomId: atom.id,
      hasConflicts: atom.contradictionOf.length > 0,
      conflictingAtomIds: atom.contradictionOf,
      conflictDescription: atom.contradictionOf.length > 0
        ? `与 ${atom.contradictionOf.length} 条记忆存在冲突`
        : ''
    }
  }

  const conflictingAtoms = allAtoms.filter(other =>
    other.id !== atom.id &&
    atom.contradictionOf.includes(other.id)
  )

  return {
    atomId: atom.id,
    hasConflicts: conflictingAtoms.length > 0,
    conflictingAtomIds: conflictingAtoms.map(a => a.id),
    conflictDescription: conflictingAtoms.length > 0
      ? `与以下记忆冲突：${conflictingAtoms.map(a => a.content).join('；')}`
      : ''
  }
}

function buildPromptDecision(
  atom: MemoryAtom,
  usedInPrompt?: boolean,
  promptReason?: string
): MemoryPromptDecision {
  const qualityScore = scoreMemoryQuality(atom)
  const economyScore = calculateMemoryEconomy(atom)

  return {
    atomId: atom.id,
    included: usedInPrompt ?? false,
    reason: promptReason ?? (usedInPrompt ? '符合当前场景需求' : '未达到当前场景的优先级阈值'),
    qualityScore,
    economyScore
  }
}

function buildSummary(explanation: AtomExplanation): string {
  const parts: string[] = []

  parts.push(`记忆来源：${explanation.provenance.sourceType}，首次记录于 ${explanation.provenance.firstRecordedAt}`)

  if (explanation.reinforcement.reinforcedCount > 0) {
    parts.push(`被强化 ${explanation.reinforcement.reinforcedCount} 次`)
  }

  if (explanation.confirmation.confirmed) {
    parts.push('已被用户确认')
  } else {
    parts.push('尚未被用户确认')
  }

  if (explanation.usage.usageCount > 0) {
    parts.push(`已被使用 ${explanation.usage.usageCount} 次`)
  }

  if (explanation.conflict.hasConflicts) {
    parts.push(explanation.conflict.conflictDescription)
  }

  parts.push(
    explanation.promptDecision.included
      ? `已进入 prompt（质量 ${explanation.promptDecision.qualityScore.overallScore.toFixed(2)}，经济 ${explanation.promptDecision.economyScore.valueScore.toFixed(2)}）`
      : `未进入 prompt（${explanation.promptDecision.reason}）`
  )

  return parts.join('。')
}

export function explainAtom(input: ExplainabilityEngineInput): AtomExplanation {
  const { atom, allAtoms, usedInPrompt, promptReason } = input

  const provenance = buildProvenance(atom)
  const reinforcement = buildReinforcement(atom)
  const confirmation = buildConfirmation(atom)
  const usage = buildUsageRecord(atom, usedInPrompt, promptReason)
  const conflict = buildConflict(atom, allAtoms)
  const promptDecision = buildPromptDecision(atom, usedInPrompt, promptReason)

  const explanation: AtomExplanation = {
    provenance,
    reinforcement,
    confirmation,
    usage,
    conflict,
    promptDecision,
    summary: ''
  }

  explanation.summary = buildSummary(explanation)
  return explanation
}

export interface BatchExplainInput {
  atoms: MemoryAtom[]
  allAtoms?: MemoryAtom[]
  usedAtomIds?: string[]
  promptReasons?: Record<string, string>
}

export function explainAtoms(input: BatchExplainInput): AtomExplanation[] {
  const { atoms, allAtoms, usedAtomIds, promptReasons } = input
  const usedSet = new Set(usedAtomIds ?? [])

  return atoms.map(atom => explainAtom({
    atom,
    allAtoms: allAtoms ?? atoms,
    usedInPrompt: usedSet.has(atom.id),
    promptReason: promptReasons?.[atom.id]
  }))
}

export interface ExplainabilitySummary {
  totalAtoms: number
  confirmedCount: number
  unconfirmedCount: number
  usedInPromptCount: number
  conflictCount: number
  averageQuality: number
  averageEconomy: number
  topReinforced: { atomId: string; count: number }[]
  needsAttention: { atomId: string; reason: string }[]
}

export function summarizeExplainability(explanations: AtomExplanation[]): ExplainabilitySummary {
  const confirmedCount = explanations.filter(e => e.confirmation.confirmed).length
  const usedInPromptCount = explanations.filter(e => e.promptDecision.included).length
  const conflictCount = explanations.filter(e => e.conflict.hasConflicts).length

  const totalQuality = explanations.reduce((sum, e) => sum + e.promptDecision.qualityScore.overallScore, 0)
  const totalEconomy = explanations.reduce((sum, e) => sum + e.promptDecision.economyScore.valueScore, 0)

  const topReinforced = explanations
    .filter(e => e.reinforcement.reinforcedCount > 0)
    .sort((a, b) => b.reinforcement.reinforcedCount - a.reinforcement.reinforcedCount)
    .slice(0, 5)
    .map(e => ({ atomId: e.provenance.atomId, count: e.reinforcement.reinforcedCount }))

  const needsAttention: { atomId: string; reason: string }[] = []
  for (const e of explanations) {
    if (!e.confirmation.confirmed && e.reinforcement.reinforcedCount >= 3) {
      needsAttention.push({ atomId: e.provenance.atomId, reason: '多次强化但未确认' })
    }
    if (e.conflict.hasConflicts && e.promptDecision.included) {
      needsAttention.push({ atomId: e.provenance.atomId, reason: '存在冲突但仍进入 prompt' })
    }
    if (e.promptDecision.qualityScore.overallScore < 0.3 && e.promptDecision.included) {
      needsAttention.push({ atomId: e.provenance.atomId, reason: '质量过低但仍进入 prompt' })
    }
  }

  return {
    totalAtoms: explanations.length,
    confirmedCount,
    unconfirmedCount: explanations.length - confirmedCount,
    usedInPromptCount,
    conflictCount,
    averageQuality: explanations.length > 0 ? totalQuality / explanations.length : 0,
    averageEconomy: explanations.length > 0 ? totalEconomy / explanations.length : 0,
    topReinforced,
    needsAttention
  }
}
