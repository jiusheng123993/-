import type { MemoryAtom } from '../core/memoryBodyTypes'

export interface MemoryQualityScore {
  valueScore: number
  evidenceScore: number
  stabilityScore: number
  riskScore: number
  reviewNeed: number
  overallScore: number
}

function roundScore(score: number): number {
  return Math.round(Math.max(0, Math.min(1, score)) * 100) / 100
}

function sensitivityRisk(atom: MemoryAtom): number {
  if (atom.sensitivity === 'forbidden') return 1
  if (atom.sensitivity === 'private') return 0.9
  if (atom.sensitivity === 'sensitive') return 0.8
  if (atom.sensitivity === 'personal') return 0.35
  return 0.15
}

function lifecycleStability(atom: MemoryAtom): number {
  if (atom.lifecycle === 'stable' || atom.lifecycle === 'protected') return 0.95
  if (atom.lifecycle === 'confirmed') return 0.85
  if (atom.lifecycle === 'active') return 0.6
  if (atom.lifecycle === 'draft') return 0.25
  if (atom.lifecycle === 'weakening') return 0.35
  return 0.1
}

function evidenceQuality(atom: MemoryAtom): number {
  if (atom.evidence.length === 0) return 0
  return roundScore(atom.evidence.reduce((sum, evidence) => sum + evidence.confidence, 0) / atom.evidence.length)
}

export function scoreMemoryQuality(atom: MemoryAtom): MemoryQualityScore {
  const evidenceScore = evidenceQuality(atom)
  const stabilityScore = lifecycleStability(atom)
  const riskScore = sensitivityRisk(atom)
  const accessScore = Math.min(atom.accessCount, 5) / 5
  const scenarioScore = atom.scenarios?.length ? 1 : 0
  const tagScore = atom.tags.length ? 1 : 0
  const valueScore = roundScore(
    atom.confidence * 0.3 +
    atom.strength * 0.3 +
    accessScore * 0.1 +
    scenarioScore * 0.08 +
    tagScore * 0.06 +
    evidenceScore * 0.2
  )
  const reviewNeed = roundScore(
    (atom.lifecycle === 'draft' ? 0.45 : 0.05) +
    (evidenceScore < 0.4 ? 0.25 : 0) +
    (riskScore >= 0.8 ? 0.2 : 0) +
    (atom.lifecycle === 'confirmed' || atom.lifecycle === 'stable' || atom.lifecycle === 'protected' ? 0.05 : 0)
  )
  const overallScore = roundScore(
    valueScore * 0.4 +
    evidenceScore * 0.25 +
    stabilityScore * 0.3 -
    riskScore * 0.14 -
    reviewNeed * 0.04
  )

  return {
    valueScore,
    evidenceScore,
    stabilityScore,
    riskScore,
    reviewNeed,
    overallScore
  }
}
