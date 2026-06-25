import type { MemoryAtom, MemoryScope } from '../types'

export type ProductMetricId =
  | 'total_atoms'
  | 'active_atoms'
  | 'stable_atoms'
  | 'confirmed_atoms'
  | 'archived_atoms'
  | 'transient_atoms'
  | 'confirmation_rate'
  | 'correction_rate'
  | 'forget_rate'
  | 'conflict_rate'
  | 'average_confidence'
  | 'average_quality'
  | 'scope_distribution'
  | 'sensitivity_distribution'
  | 'scenario_distribution'
  | 'user_satisfaction'
  | 'prompt_efficiency'
  | 'trust_score'
  | 'stale_ratio'
  | 'evidence_richness'

export interface MetricValue {
  metricId: ProductMetricId
  label: string
  value: number
  unit: string
  trend: 'improving' | 'declining' | 'stable' | 'unknown'
  target?: number
  threshold?: { min?: number; max?: number }
}

export interface MemoryProductMetricsInput {
  atoms: MemoryAtom[]
  previousMetrics?: MemoryProductMetricsResult
}

export interface MemoryProductMetricsResult {
  timestamp: string
  metrics: MetricValue[]
  summary: string
  healthScore: number
  recommendations: string[]
}

const METRIC_LABELS: Record<ProductMetricId, string> = {
  total_atoms: '记忆总数',
  active_atoms: '活跃记忆数',
  stable_atoms: '稳定记忆数',
  confirmed_atoms: '已确认记忆数',
  archived_atoms: '归档记忆数',
  transient_atoms: '临时记忆数',
  confirmation_rate: '确认率',
  correction_rate: '纠正率',
  forget_rate: '遗忘率',
  conflict_rate: '冲突率',
  average_confidence: '平均置信度',
  average_quality: '平均质量分',
  scope_distribution: '范围分布均衡度',
  sensitivity_distribution: '敏感度分布',
  scenario_distribution: '场景分布',
  user_satisfaction: '用户满意度',
  prompt_efficiency: 'Prompt 效率',
  trust_score: '信任评分',
  stale_ratio: '过期比例',
  evidence_richness: '证据丰富度',
}

function safeRatio(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 100) / 100
}

function detectTrend(
  metricId: ProductMetricId,
  current: number,
  previous?: MemoryProductMetricsResult
): MetricValue['trend'] {
  if (!previous) return 'unknown'
  const prevMetric = previous.metrics.find((m) => m.metricId === metricId)
  if (!prevMetric) return 'unknown'
  const diff = current - prevMetric.value
  if (Math.abs(diff) < 0.01) return 'stable'
  return diff > 0 ? 'improving' : 'declining'
}

export function computeTotalAtoms(atoms: MemoryAtom[]): MetricValue {
  return {
    metricId: 'total_atoms',
    label: METRIC_LABELS.total_atoms,
    value: atoms.length,
    unit: '条',
    trend: 'unknown',
    target: undefined,
  }
}

export function computeActiveAtoms(atoms: MemoryAtom[]): MetricValue {
  const active = atoms.filter((a) => a.lifecycle === 'active').length
  return {
    metricId: 'active_atoms',
    label: METRIC_LABELS.active_atoms,
    value: active,
    unit: '条',
    trend: 'unknown',
  }
}

export function computeStableAtoms(atoms: MemoryAtom[]): MetricValue {
  const stable = atoms.filter((a) => a.lifecycle === 'stable').length
  return {
    metricId: 'stable_atoms',
    label: METRIC_LABELS.stable_atoms,
    value: stable,
    unit: '条',
    trend: 'unknown',
  }
}

export function computeConfirmedAtoms(atoms: MemoryAtom[]): MetricValue {
  const confirmed = atoms.filter((a) => a.lifecycle === 'confirmed').length
  return {
    metricId: 'confirmed_atoms',
    label: METRIC_LABELS.confirmed_atoms,
    value: confirmed,
    unit: '条',
    trend: 'unknown',
  }
}

export function computeArchivedAtoms(atoms: MemoryAtom[]): MetricValue {
  const archived = atoms.filter((a) => a.lifecycle === 'archived').length
  return {
    metricId: 'archived_atoms',
    label: METRIC_LABELS.archived_atoms,
    value: archived,
    unit: '条',
    trend: 'unknown',
  }
}

export function computeTransientAtoms(atoms: MemoryAtom[]): MetricValue {
  const transient = atoms.filter((a) => a.lifecycle === 'transient').length
  return {
    metricId: 'transient_atoms',
    label: METRIC_LABELS.transient_atoms,
    value: transient,
    unit: '条',
    trend: 'unknown',
  }
}

export function computeConfirmationRate(atoms: MemoryAtom[]): MetricValue {
  const confirmed = atoms.filter((a) => a.lifecycle === 'confirmed').length
  const total = atoms.filter((a) => a.lifecycle !== 'transient').length
  return {
    metricId: 'confirmation_rate',
    label: METRIC_LABELS.confirmation_rate,
    value: safeRatio(confirmed, total),
    unit: '%',
    trend: 'unknown',
    target: 0.6,
  }
}

export function computeCorrectionRate(atoms: MemoryAtom[]): MetricValue {
  const corrected = atoms.filter((a) => a.status === 'corrected').length
  const total = atoms.length
  return {
    metricId: 'correction_rate',
    label: METRIC_LABELS.correction_rate,
    value: safeRatio(corrected, total),
    unit: '%',
    trend: 'unknown',
    threshold: { max: 0.3 },
  }
}

export function computeForgetRate(atoms: MemoryAtom[]): MetricValue {
  const forgotten = atoms.filter((a) => a.status === 'forgotten').length
  const total = atoms.length
  return {
    metricId: 'forget_rate',
    label: METRIC_LABELS.forget_rate,
    value: safeRatio(forgotten, total),
    unit: '%',
    trend: 'unknown',
  }
}

export function computeConflictRate(atoms: MemoryAtom[]): MetricValue {
  const conflicted = atoms.filter((a) => a.status === 'conflict').length
  const total = atoms.length
  return {
    metricId: 'conflict_rate',
    label: METRIC_LABELS.conflict_rate,
    value: safeRatio(conflicted, total),
    unit: '%',
    trend: 'unknown',
    threshold: { max: 0.1 },
  }
}

export function computeAverageConfidence(atoms: MemoryAtom[]): MetricValue {
  if (atoms.length === 0) {
    return {
      metricId: 'average_confidence',
      label: METRIC_LABELS.average_confidence,
      value: 0,
      unit: '',
      trend: 'unknown',
      target: 0.7,
    }
  }
  const avg = atoms.reduce((sum, a) => sum + a.confidence, 0) / atoms.length
  return {
    metricId: 'average_confidence',
    label: METRIC_LABELS.average_confidence,
    value: Math.round(avg * 100) / 100,
    unit: '',
    trend: 'unknown',
    target: 0.7,
  }
}

export function computeAverageQuality(atoms: MemoryAtom[]): MetricValue {
  if (atoms.length === 0) {
    return {
      metricId: 'average_quality',
      label: METRIC_LABELS.average_quality,
      value: 0,
      unit: '',
      trend: 'unknown',
      target: 0.7,
    }
  }
  const avg = atoms.reduce((sum, a) => sum + (a.quality ?? 0.5), 0) / atoms.length
  return {
    metricId: 'average_quality',
    label: METRIC_LABELS.average_quality,
    value: Math.round(avg * 100) / 100,
    unit: '',
    trend: 'unknown',
    target: 0.7,
  }
}

export function computeScopeDistribution(atoms: MemoryAtom[]): MetricValue {
  if (atoms.length === 0) {
    return {
      metricId: 'scope_distribution',
      label: METRIC_LABELS.scope_distribution,
      value: 0,
      unit: '',
      trend: 'unknown',
    }
  }
  const scopes: MemoryScope[] = ['global', 'project', 'session', 'personal']
  const counts = scopes.map((s) => atoms.filter((a) => a.scope === s).length)
  const maxCount = Math.max(...counts)
  const total = atoms.length
  const balance = 1 - (maxCount / total)
  return {
    metricId: 'scope_distribution',
    label: METRIC_LABELS.scope_distribution,
    value: Math.round(balance * 100) / 100,
    unit: '',
    trend: 'unknown',
    target: 0.5,
  }
}

export function computeSensitivityDistribution(atoms: MemoryAtom[]): MetricValue {
  if (atoms.length === 0) {
    return {
      metricId: 'sensitivity_distribution',
      label: METRIC_LABELS.sensitivity_distribution,
      value: 0,
      unit: '',
      trend: 'unknown',
    }
  }
  const publicCount = atoms.filter((a) => a.sensitivity === 'public').length
  const total = atoms.length
  return {
    metricId: 'sensitivity_distribution',
    label: METRIC_LABELS.sensitivity_distribution,
    value: safeRatio(publicCount, total),
    unit: '%',
    trend: 'unknown',
  }
}

export function computeScenarioDistribution(atoms: MemoryAtom[]): MetricValue {
  if (atoms.length === 0) {
    return {
      metricId: 'scenario_distribution',
      label: METRIC_LABELS.scenario_distribution,
      value: 0,
      unit: '',
      trend: 'unknown',
    }
  }
  const scenarios = new Set(atoms.map((a) => a.scenario))
  return {
    metricId: 'scenario_distribution',
    label: METRIC_LABELS.scenario_distribution,
    value: scenarios.size,
    unit: '个场景',
    trend: 'unknown',
  }
}

export function computeUserSatisfaction(atoms: MemoryAtom[]): MetricValue {
  const confirmed = atoms.filter((a) => a.lifecycle === 'confirmed').length
  const corrected = atoms.filter((a) => a.status === 'corrected').length
  const total = atoms.filter((a) => a.lifecycle !== 'transient').length
  if (total === 0) {
    return {
      metricId: 'user_satisfaction',
      label: METRIC_LABELS.user_satisfaction,
      value: 0,
      unit: '%',
      trend: 'unknown',
      target: 0.8,
    }
  }
  const satisfaction = (confirmed - corrected * 0.5) / total
  return {
    metricId: 'user_satisfaction',
    label: METRIC_LABELS.user_satisfaction,
    value: Math.round(Math.max(0, satisfaction) * 100) / 100,
    unit: '%',
    trend: 'unknown',
    target: 0.8,
  }
}

export function computePromptEfficiency(atoms: MemoryAtom[]): MetricValue {
  const activeNonTransient = atoms.filter(
    (a) => a.lifecycle !== 'transient' && a.lifecycle !== 'archived'
  ).length
  const total = atoms.length
  return {
    metricId: 'prompt_efficiency',
    label: METRIC_LABELS.prompt_efficiency,
    value: safeRatio(activeNonTransient, total),
    unit: '%',
    trend: 'unknown',
    target: 0.5,
  }
}

export function computeTrustScore(atoms: MemoryAtom[]): MetricValue {
  if (atoms.length === 0) {
    return {
      metricId: 'trust_score',
      label: METRIC_LABELS.trust_score,
      value: 0,
      unit: '',
      trend: 'unknown',
      target: 0.8,
    }
  }
  const confirmed = atoms.filter((a) => a.lifecycle === 'confirmed').length
  const corrected = atoms.filter((a) => a.status === 'corrected').length
  const conflicted = atoms.filter((a) => a.status === 'conflict').length
  const total = atoms.length
  const trust = (confirmed - corrected * 0.5 - conflicted * 0.3) / total
  return {
    metricId: 'trust_score',
    label: METRIC_LABELS.trust_score,
    value: Math.round(Math.max(0, trust) * 100) / 100,
    unit: '',
    trend: 'unknown',
    target: 0.8,
  }
}

export function computeStaleRatio(atoms: MemoryAtom[]): MetricValue {
  if (atoms.length === 0) {
    return {
      metricId: 'stale_ratio',
      label: METRIC_LABELS.stale_ratio,
      value: 0,
      unit: '%',
      trend: 'unknown',
      threshold: { max: 0.2 },
    }
  }
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const stale = atoms.filter(
    (a) => new Date(a.updatedAt) < thirtyDaysAgo && a.lifecycle !== 'archived'
  ).length
  return {
    metricId: 'stale_ratio',
    label: METRIC_LABELS.stale_ratio,
    value: safeRatio(stale, atoms.length),
    unit: '%',
    trend: 'unknown',
    threshold: { max: 0.2 },
  }
}

export function computeEvidenceRichness(atoms: MemoryAtom[]): MetricValue {
  if (atoms.length === 0) {
    return {
      metricId: 'evidence_richness',
      label: METRIC_LABELS.evidence_richness,
      value: 0,
      unit: '',
      trend: 'unknown',
      target: 2,
    }
  }
  const avgEvidence = atoms.reduce((sum, a) => sum + (a.evidence?.length ?? 0), 0) / atoms.length
  return {
    metricId: 'evidence_richness',
    label: METRIC_LABELS.evidence_richness,
    value: Math.round(avgEvidence * 100) / 100,
    unit: '条/记忆',
    trend: 'unknown',
    target: 2,
  }
}

export function computeHealthScore(metrics: MetricValue[]): number {
  const scores: number[] = []

  for (const m of metrics) {
    let score = 0.5

    if (m.target !== undefined) {
      score = Math.min(1, m.value / m.target)
    }

    if (m.threshold?.max !== undefined && m.value > m.threshold.max) {
      score = Math.max(0, 1 - (m.value - m.threshold.max) / m.threshold.max)
    }

    if (m.threshold?.min !== undefined && m.value < m.threshold.min) {
      score = Math.max(0, m.value / m.threshold.min)
    }

    scores.push(score)
  }

  if (scores.length === 0) return 0
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length
  return Math.round(avg * 100) / 100
}

export function generateRecommendations(metrics: MetricValue[]): string[] {
  const recommendations: string[] = []

  for (const m of metrics) {
    if (m.threshold?.max !== undefined && m.value > m.threshold.max) {
      recommendations.push(`${m.label} 过高 (${m.value}${m.unit})，建议检查并清理`)
    }
    if (m.target !== undefined && m.value < m.target * 0.5) {
      recommendations.push(`${m.label} 偏低 (${m.value}${m.unit})，目标 ${m.target}${m.unit}`)
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('所有指标在健康范围内')
  }

  return recommendations
}

export function computeMemoryProductMetrics(
  input: MemoryProductMetricsInput
): MemoryProductMetricsResult {
  const { atoms, previousMetrics } = input

  const baseMetrics: MetricValue[] = [
    computeTotalAtoms(atoms),
    computeActiveAtoms(atoms),
    computeStableAtoms(atoms),
    computeConfirmedAtoms(atoms),
    computeArchivedAtoms(atoms),
    computeTransientAtoms(atoms),
    computeConfirmationRate(atoms),
    computeCorrectionRate(atoms),
    computeForgetRate(atoms),
    computeConflictRate(atoms),
    computeAverageConfidence(atoms),
    computeAverageQuality(atoms),
    computeScopeDistribution(atoms),
    computeSensitivityDistribution(atoms),
    computeScenarioDistribution(atoms),
    computeUserSatisfaction(atoms),
    computePromptEfficiency(atoms),
    computeTrustScore(atoms),
    computeStaleRatio(atoms),
    computeEvidenceRichness(atoms),
  ]

  const metrics = baseMetrics.map((m) => ({
    ...m,
    trend: detectTrend(m.metricId, m.value, previousMetrics),
  }))

  const healthScore = computeHealthScore(metrics)
  const recommendations = generateRecommendations(metrics)

  const summaryParts: string[] = []
  summaryParts.push(`记忆产品指标报告`)
  summaryParts.push(`健康评分: ${healthScore}/1.0`)
  summaryParts.push(`记忆总数: ${atoms.length}`)
  summaryParts.push(`确认率: ${metrics.find((m) => m.metricId === 'confirmation_rate')?.value ?? 0}`)
  summaryParts.push(`信任评分: ${metrics.find((m) => m.metricId === 'trust_score')?.value ?? 0}`)

  return {
    timestamp: new Date().toISOString(),
    metrics,
    summary: summaryParts.join('\n'),
    healthScore,
    recommendations,
  }
}

export function summarizeProductMetrics(result: MemoryProductMetricsResult): string {
  const lines: string[] = [result.summary]
  lines.push('')
  lines.push('建议:')
  for (const r of result.recommendations) {
    lines.push(`  - ${r}`)
  }
  return lines.join('\n')
}
