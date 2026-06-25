import type { MemoryAtom, MemoryBodyState } from '../core/memoryBodyTypes'

export type EvaluationMetric =
  | 'accuracy'
  | 'coverage'
  | 'user_satisfaction'
  | 'correction_rate'
  | 'confirmation_rate'
  | 'forget_rate'
  | 'conflict_rate'
  | 'staleness'
  | 'prompt_efficiency'
  | 'trust_score'

export interface MetricScore {
  metric: EvaluationMetric
  score: number
  weight: number
  description: string
}

export interface CognitiveEvaluationResult {
  id: string
  evaluatedAt: string
  metrics: MetricScore[]
  overallScore: number
  atomCount: number
  activeAtomCount: number
  forbiddenAtomCount: number
  averageConfidence: number
  averageStrength: number
  conflictCount: number
  correctionCount: number
  confirmationCount: number
  forgetCount: number
  staleAtomCount: number
  recommendations: EvaluationRecommendation[]
}

export interface EvaluationRecommendation {
  priority: 'high' | 'medium' | 'low'
  category: string
  description: string
  suggestedAction: string
}

export interface EvaluationTrend {
  metric: EvaluationMetric
  previousScore: number
  currentScore: number
  change: number
  direction: 'improving' | 'declining' | 'stable'
}

const DEFAULT_METRIC_WEIGHTS: Record<EvaluationMetric, number> = {
  accuracy: 0.20,
  coverage: 0.15,
  user_satisfaction: 0.15,
  correction_rate: 0.10,
  confirmation_rate: 0.10,
  forget_rate: 0.05,
  conflict_rate: 0.10,
  staleness: 0.05,
  prompt_efficiency: 0.05,
  trust_score: 0.05
}

function generateEvaluationId(): string {
  return `eval-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function calculateAccuracy(atoms: MemoryAtom[]): number {
  if (atoms.length === 0) return 1.0
  const accurate = atoms.filter(a =>
    a.lifecycle === 'confirmed' || a.lifecycle === 'stable' || a.lifecycle === 'protected'
  )
  return accurate.length / atoms.length
}

function calculateCoverage(atoms: MemoryAtom[]): number {
  if (atoms.length === 0) return 0
  const types = new Set(atoms.map(a => a.type))
  const allTypes: string[] = [
    'preference', 'boundary', 'goal', 'habit', 'emotion',
    'identity', 'relationship', 'interaction_style', 'event', 'insight'
  ]
  return types.size / allTypes.length
}

function calculateUserSatisfaction(atoms: MemoryAtom[]): number {
  if (atoms.length === 0) return 0.5
  const confirmed = atoms.filter(a => a.lifecycle === 'confirmed' || a.lifecycle === 'protected')
  const corrected = atoms.filter(a => a.lifecycle === 'contradicted')
  const total = confirmed.length + corrected.length
  if (total === 0) return 0.5
  return confirmed.length / total
}

function calculateCorrectionRate(atoms: MemoryAtom[]): number {
  if (atoms.length === 0) return 0
  const corrected = atoms.filter(a => a.lifecycle === 'contradicted')
  return corrected.length / atoms.length
}

function calculateConfirmationRate(atoms: MemoryAtom[]): number {
  if (atoms.length === 0) return 0
  const confirmed = atoms.filter(a =>
    a.lifecycle === 'confirmed' || a.lifecycle === 'stable' || a.lifecycle === 'protected'
  )
  return confirmed.length / atoms.length
}

function calculateForgetRate(atoms: MemoryAtom[]): number {
  if (atoms.length === 0) return 0
  const forgotten = atoms.filter(a => a.lifecycle === 'forbidden')
  return forgotten.length / atoms.length
}

function calculateConflictRate(atoms: MemoryAtom[]): number {
  if (atoms.length === 0) return 0
  const conflicted = atoms.filter(a => a.contradictionOf.length > 0)
  return conflicted.length / atoms.length
}

function calculateStaleness(atoms: MemoryAtom[]): number {
  if (atoms.length === 0) return 0
  const now = Date.now()
  const staleThreshold = 30 * 24 * 60 * 60 * 1000
  const stale = atoms.filter(a => {
    const lastAccess = new Date(a.lastAccessedAt).getTime()
    return (now - lastAccess) > staleThreshold
  })
  return stale.length / atoms.length
}

function calculatePromptEfficiency(atoms: MemoryAtom[]): number {
  if (atoms.length === 0) return 1.0
  const active = atoms.filter(a =>
    a.lifecycle === 'active' || a.lifecycle === 'confirmed' ||
    a.lifecycle === 'stable' || a.lifecycle === 'protected'
  )
  if (active.length === 0) return 0
  const highValue = active.filter(a => a.confidence >= 0.5 && a.strength >= 0.5)
  return highValue.length / active.length
}

function calculateTrustScore(atoms: MemoryAtom[]): number {
  if (atoms.length === 0) return 0.5
  const accuracy = calculateAccuracy(atoms)
  const satisfaction = calculateUserSatisfaction(atoms)
  const conflictRate = calculateConflictRate(atoms)
  return Math.max(0, (accuracy * 0.4 + satisfaction * 0.4 - conflictRate * 0.2))
}

function generateRecommendations(
  metrics: MetricScore[],
  state: MemoryBodyState
): EvaluationRecommendation[] {
  const recommendations: EvaluationRecommendation[] = []

  const accuracyMetric = metrics.find(m => m.metric === 'accuracy')
  if (accuracyMetric && accuracyMetric.score < 0.5) {
    recommendations.push({
      priority: 'high',
      category: 'accuracy',
      description: `Low accuracy score (${(accuracyMetric.score * 100).toFixed(0)}%). Many atoms are not confirmed or stable.`,
      suggestedAction: 'Review and confirm or correct unverified atoms through MemoryNegotiation.'
    })
  }

  const coverageMetric = metrics.find(m => m.metric === 'coverage')
  if (coverageMetric && coverageMetric.score < 0.3) {
    recommendations.push({
      priority: 'medium',
      category: 'coverage',
      description: `Low type coverage (${(coverageMetric.score * 100).toFixed(0)}%). Missing memory types.`,
      suggestedAction: 'Consider expanding memory extraction to cover more atom types.'
    })
  }

  const stalenessMetric = metrics.find(m => m.metric === 'staleness')
  if (stalenessMetric && stalenessMetric.score > 0.3) {
    recommendations.push({
      priority: 'medium',
      category: 'staleness',
      description: `High staleness (${(stalenessMetric.score * 100).toFixed(0)}%). Many atoms not accessed recently.`,
      suggestedAction: 'Run memory decay cycle to archive or weaken stale atoms.'
    })
  }

  const conflictMetric = metrics.find(m => m.metric === 'conflict_rate')
  if (conflictMetric && conflictMetric.score > 0.2) {
    recommendations.push({
      priority: 'high',
      category: 'conflict',
      description: `High conflict rate (${(conflictMetric.score * 100).toFixed(0)}%). Many atoms have contradictions.`,
      suggestedAction: 'Resolve contradictions through TrustRepairProtocol or user confirmation.'
    })
  }

  const forgetMetric = metrics.find(m => m.metric === 'forget_rate')
  if (forgetMetric && forgetMetric.score > 0.3) {
    recommendations.push({
      priority: 'low',
      category: 'forget',
      description: `High forget rate (${(forgetMetric.score * 100).toFixed(0)}%). Many atoms are forbidden.`,
      suggestedAction: 'Review forbidden atoms to ensure they are correctly classified.'
    })
  }

  if (state.atoms.length > 500) {
    recommendations.push({
      priority: 'medium',
      category: 'economy',
      description: `Large atom count (${state.atoms.length}). May impact performance.`,
      suggestedAction: 'Apply MemoryEconomy to prioritize retention and cleanup.'
    })
  }

  return recommendations
}

export function evaluateCognitiveState(state: MemoryBodyState): CognitiveEvaluationResult {
  const atoms = state.atoms

  const metricCalculators: Record<EvaluationMetric, (atoms: MemoryAtom[]) => number> = {
    accuracy: calculateAccuracy,
    coverage: calculateCoverage,
    user_satisfaction: calculateUserSatisfaction,
    correction_rate: calculateCorrectionRate,
    confirmation_rate: calculateConfirmationRate,
    forget_rate: calculateForgetRate,
    conflict_rate: calculateConflictRate,
    staleness: calculateStaleness,
    prompt_efficiency: calculatePromptEfficiency,
    trust_score: calculateTrustScore
  }

  const metrics: MetricScore[] = (Object.keys(metricCalculators) as EvaluationMetric[]).map(metric => ({
    metric,
    score: Math.round(metricCalculators[metric](atoms) * 100) / 100,
    weight: DEFAULT_METRIC_WEIGHTS[metric],
    description: getMetricDescription(metric)
  }))

  const overallScore = metrics.reduce((sum, m) => sum + m.score * m.weight, 0)

  const recommendations = generateRecommendations(metrics, state)

  return {
    id: generateEvaluationId(),
    evaluatedAt: new Date().toISOString(),
    metrics,
    overallScore: Math.round(overallScore * 100) / 100,
    atomCount: atoms.length,
    activeAtomCount: atoms.filter(a =>
      a.lifecycle === 'active' || a.lifecycle === 'confirmed' ||
      a.lifecycle === 'stable' || a.lifecycle === 'protected'
    ).length,
    forbiddenAtomCount: atoms.filter(a => a.lifecycle === 'forbidden').length,
    averageConfidence: atoms.length > 0
      ? Math.round(atoms.reduce((s, a) => s + a.confidence, 0) / atoms.length * 100) / 100
      : 0,
    averageStrength: atoms.length > 0
      ? Math.round(atoms.reduce((s, a) => s + a.strength, 0) / atoms.length * 100) / 100
      : 0,
    conflictCount: atoms.filter(a => a.contradictionOf.length > 0).length,
    correctionCount: atoms.filter(a => a.lifecycle === 'contradicted').length,
    confirmationCount: atoms.filter(a =>
      a.lifecycle === 'confirmed' || a.lifecycle === 'stable' || a.lifecycle === 'protected'
    ).length,
    forgetCount: atoms.filter(a => a.lifecycle === 'forbidden').length,
    staleAtomCount: atoms.filter(a => {
      const now = Date.now()
      const lastAccess = new Date(a.lastAccessedAt).getTime()
      return (now - lastAccess) > 30 * 24 * 60 * 60 * 1000
    }).length,
    recommendations
  }
}

function getMetricDescription(metric: EvaluationMetric): string {
  const descriptions: Record<EvaluationMetric, string> = {
    accuracy: 'Proportion of atoms that are confirmed, stable, or protected',
    coverage: 'Diversity of atom types covered',
    user_satisfaction: 'Ratio of confirmed to corrected atoms',
    correction_rate: 'Proportion of atoms that have been contradicted',
    confirmation_rate: 'Proportion of atoms that are confirmed or higher',
    forget_rate: 'Proportion of atoms that are forbidden',
    conflict_rate: 'Proportion of atoms with contradictions',
    staleness: 'Proportion of atoms not accessed in 30 days',
    prompt_efficiency: 'Proportion of active atoms with high confidence and strength',
    trust_score: 'Composite trust score based on accuracy, satisfaction, and conflict rate'
  }
  return descriptions[metric]
}

export function compareEvaluations(
  previous: CognitiveEvaluationResult,
  current: CognitiveEvaluationResult
): EvaluationTrend[] {
  return current.metrics.map(currentMetric => {
    const previousMetric = previous.metrics.find(m => m.metric === currentMetric.metric)
    const previousScore = previousMetric?.score || 0
    const change = Math.round((currentMetric.score - previousScore) * 100) / 100

    let direction: 'improving' | 'declining' | 'stable'
    if (change > 0.05) direction = 'improving'
    else if (change < -0.05) direction = 'declining'
    else direction = 'stable'

    return {
      metric: currentMetric.metric,
      previousScore,
      currentScore: currentMetric.score,
      change,
      direction
    }
  })
}

export function getEvaluationGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 0.9) return 'A'
  if (score >= 0.7) return 'B'
  if (score >= 0.5) return 'C'
  if (score >= 0.3) return 'D'
  return 'F'
}

export function summarizeEvaluation(result: CognitiveEvaluationResult): {
  grade: string
  overallScore: number
  topStrength: string
  topWeakness: string
  recommendationCount: number
  highPriorityCount: number
} {
  const sortedByScore = [...result.metrics].sort((a, b) => b.score - a.score)
  const topStrength = sortedByScore[0]?.metric || 'accuracy'
  const topWeakness = sortedByScore[sortedByScore.length - 1]?.metric || 'staleness'

  return {
    grade: getEvaluationGrade(result.overallScore),
    overallScore: result.overallScore,
    topStrength,
    topWeakness,
    recommendationCount: result.recommendations.length,
    highPriorityCount: result.recommendations.filter(r => r.priority === 'high').length
  }
}
