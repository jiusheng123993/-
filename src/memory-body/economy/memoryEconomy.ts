import type { MemoryAtom } from '../core/memoryBodyTypes'

export type RetentionPolicy = 'keep' | 'review' | 'decay' | 'sandbox' | 'delete'

export interface MemoryEconomy {
  valueScore: number
  costScore: number
  riskScore: number
  usageFrequency: number
  correctionCost: number
  retentionPolicy: RetentionPolicy
  deletionPriority: number
}

export const DEFAULT_MEMORY_ECONOMY: MemoryEconomy = {
  valueScore: 0.5,
  costScore: 0.5,
  riskScore: 0.5,
  usageFrequency: 0,
  correctionCost: 0,
  retentionPolicy: 'review',
  deletionPriority: 0.5
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function calculateValueScore(atom: MemoryAtom): number {
  const confidenceWeight = 0.35
  const evidenceWeight = 0.25
  const accessWeight = 0.25
  const strengthWeight = 0.15

  const confidenceScore = atom.confidence
  const evidenceScore = Math.min(atom.evidence.length / 5, 1)
  const accessScore = Math.min(atom.accessCount / 20, 1)
  const strengthScore = atom.strength

  return clamp(
    confidenceWeight * confidenceScore +
    evidenceWeight * evidenceScore +
    accessWeight * accessScore +
    strengthWeight * strengthScore,
    0,
    1
  )
}

function calculateCostScore(atom: MemoryAtom): number {
  const contradictionWeight = 0.3
  const stalenessWeight = 0.3
  const complexityWeight = 0.2
  const correctionWeight = 0.2

  const contradictionScore = Math.min(atom.contradictionOf.length / 5, 1)

  const now = Date.now()
  const createdAt = new Date(atom.createdAt).getTime()
  const lastAccessedAt = new Date(atom.lastAccessedAt).getTime()
  const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24)
  const idleInDays = (now - lastAccessedAt) / (1000 * 60 * 60 * 24)
  const stalenessScore = clamp((ageInDays / 90) * 0.5 + (idleInDays / 30) * 0.5, 0, 1)

  const contentLength = atom.content.length
  const complexityScore = Math.min(contentLength / 500, 1)

  const correctionScore = atom.confidence * 0.5 + Math.min(atom.evidence.length / 5, 1) * 0.5

  return clamp(
    contradictionWeight * contradictionScore +
    stalenessWeight * stalenessScore +
    complexityWeight * complexityScore +
    correctionWeight * correctionScore,
    0,
    1
  )
}

function calculateRiskScore(atom: MemoryAtom): number {
  const sensitivityMap: Record<string, number> = {
    low: 0.1,
    medium: 0.4,
    high: 0.7,
    critical: 0.95
  }

  const lifecycleRiskMap: Record<string, number> = {
    active: 0.1,
    draft: 0.3,
    review: 0.4,
    archived: 0.2,
    forbidden: 0.9,
    corrected: 0.5,
    sandbox: 0.6
  }

  const sensitivityScore = sensitivityMap[atom.sensitivity] ?? 0.3
  const lifecycleScore = lifecycleRiskMap[atom.lifecycle] ?? 0.3
  const contradictionScore = Math.min(atom.contradictionOf.length / 5, 1)

  return clamp(
    sensitivityScore * 0.4 +
    lifecycleScore * 0.35 +
    contradictionScore * 0.25,
    0,
    1
  )
}

function calculateUsageFrequency(atom: MemoryAtom): number {
  const now = Date.now()
  const createdAt = new Date(atom.createdAt).getTime()
  const ageInDays = Math.max((now - createdAt) / (1000 * 60 * 60 * 24), 1)
  return atom.accessCount / ageInDays
}

function calculateCorrectionCost(atom: MemoryAtom): number {
  const confidenceScore = atom.confidence
  const evidenceScore = Math.min(atom.evidence.length / 5, 1)
  return clamp(confidenceScore * 0.6 + evidenceScore * 0.4, 0, 1)
}

function determineRetentionPolicy(economy: Omit<MemoryEconomy, 'retentionPolicy' | 'deletionPriority'>): RetentionPolicy {
  const { valueScore, riskScore, costScore } = economy

  if (riskScore >= 0.7) return 'sandbox'
  if (valueScore <= 0.1 && costScore >= 0.7) return 'delete'
  if (valueScore <= 0.3) return 'decay'
  if (valueScore >= 0.7 && riskScore <= 0.3) return 'keep'
  return 'review'
}

function calculateDeletionPriority(economy: Omit<MemoryEconomy, 'retentionPolicy' | 'deletionPriority'>): number {
  const { valueScore, costScore, riskScore } = economy
  return clamp((costScore + riskScore - valueScore + 1) / 3, 0, 1)
}

export function calculateMemoryEconomy(atom: MemoryAtom): MemoryEconomy {
  const valueScore = calculateValueScore(atom)
  const costScore = calculateCostScore(atom)
  const riskScore = calculateRiskScore(atom)
  const usageFrequency = calculateUsageFrequency(atom)
  const correctionCost = calculateCorrectionCost(atom)

  const base = { valueScore, costScore, riskScore, usageFrequency, correctionCost }
  const retentionPolicy = determineRetentionPolicy(base)
  const deletionPriority = calculateDeletionPriority(base)

  return {
    ...base,
    retentionPolicy,
    deletionPriority
  }
}

export function getRetentionPolicy(economy: MemoryEconomy): RetentionPolicy {
  return determineRetentionPolicy({
    valueScore: economy.valueScore,
    costScore: economy.costScore,
    riskScore: economy.riskScore,
    usageFrequency: economy.usageFrequency,
    correctionCost: economy.correctionCost
  })
}

export function getDeletionPriority(economy: MemoryEconomy): number {
  return calculateDeletionPriority({
    valueScore: economy.valueScore,
    costScore: economy.costScore,
    riskScore: economy.riskScore,
    usageFrequency: economy.usageFrequency,
    correctionCost: economy.correctionCost
  })
}
