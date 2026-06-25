import type { MemoryAtom, MemoryScope } from '../types'
import type { MemoryProductMetricsResult, MetricValue } from '../metrics/memoryProductMetrics'

/**
 * MetricsDashboard — 设计文档 Architecture - Experience & Explainability
 *
 * 指标仪表盘：聚合记忆系统的多维度指标，提供面向用户和面向系统的健康视图。
 * 与 MemoryProductMetrics（产品指标计算）互补，MetricsDashboard 关注：
 * - 指标聚合与趋势分析
 * - 健康评分与告警
 * - 时间序列对比
 * - 面向用户的摘要生成
 */

export type DashboardSection =
  | 'overview'
  | 'quality'
  | 'performance'
  | 'safety'
  | 'growth'
  | 'engagement'

export type AlertLevel = 'ok' | 'warning' | 'critical'

export interface DashboardAlert {
  id: string
  section: DashboardSection
  level: AlertLevel
  metricId: string
  message: string
  recommendation: string
  triggeredAt: string
}

export interface DashboardSectionData {
  section: DashboardSection
  label: string
  metrics: MetricValue[]
  alerts: DashboardAlert[]
  healthScore: number
  summary: string
}

export interface MetricsDashboardInput {
  metrics: MemoryProductMetricsResult
  previousMetrics?: MemoryProductMetricsResult
  atoms: MemoryAtom[]
  scope: MemoryScope
}

export interface MetricsDashboardResult {
  timestamp: string
  scope: MemoryScope
  sections: DashboardSectionData[]
  overallHealthScore: number
  overallTrend: 'improving' | 'declining' | 'stable'
  alerts: DashboardAlert[]
  summary: string
  recommendations: string[]
}

// ─── 分区定义 ───────────────────────────────────────────────

const SECTION_CONFIG: Record<DashboardSection, { label: string; metricIds: string[] }> = {
  overview: {
    label: '总览',
    metricIds: ['total_atoms', 'active_atoms', 'stable_atoms', 'confirmed_atoms', 'archived_atoms', 'transient_atoms']
  },
  quality: {
    label: '质量',
    metricIds: ['average_confidence', 'average_quality', 'confirmation_rate', 'correction_rate', 'conflict_rate', 'evidence_richness']
  },
  performance: {
    label: '性能',
    metricIds: ['prompt_efficiency', 'stale_ratio']
  },
  safety: {
    label: '安全',
    metricIds: ['sensitivity_distribution', 'forget_rate']
  },
  growth: {
    label: '增长',
    metricIds: ['scope_distribution', 'scenario_distribution']
  },
  engagement: {
    label: '参与度',
    metricIds: ['user_satisfaction', 'trust_score']
  }
}

// ─── 告警阈值 ───────────────────────────────────────────────

interface AlertThreshold {
  metricId: string
  warningMin?: number
  warningMax?: number
  criticalMin?: number
  criticalMax?: number
  direction: 'higher_better' | 'lower_better'
}

const ALERT_THRESHOLDS: AlertThreshold[] = [
  { metricId: 'confirmation_rate', warningMin: 0.3, direction: 'higher_better' },
  { metricId: 'correction_rate', warningMax: 0.5, criticalMax: 0.7, direction: 'lower_better' },
  { metricId: 'conflict_rate', warningMax: 0.2, criticalMax: 0.4, direction: 'lower_better' },
  { metricId: 'average_confidence', warningMin: 0.5, criticalMin: 0.3, direction: 'higher_better' },
  { metricId: 'average_quality', warningMin: 0.5, criticalMin: 0.3, direction: 'higher_better' },
  { metricId: 'stale_ratio', warningMax: 0.3, criticalMax: 0.5, direction: 'lower_better' },
  { metricId: 'trust_score', warningMin: 0.5, criticalMin: 0.3, direction: 'higher_better' },
  { metricId: 'user_satisfaction', warningMin: 0.5, criticalMin: 0.3, direction: 'higher_better' },
  { metricId: 'prompt_efficiency', warningMin: 0.5, criticalMin: 0.3, direction: 'higher_better' },
  { metricId: 'evidence_richness', warningMin: 0.3, criticalMin: 0.1, direction: 'higher_better' }
]

// ─── 核心函数 ───────────────────────────────────────────────

/**
 * 构建指标仪表盘
 */
export function buildMetricsDashboard(input: MetricsDashboardInput): MetricsDashboardResult {
  const { metrics, previousMetrics, atoms, scope } = input
  const sections: DashboardSectionData[] = []
  const allAlerts: DashboardAlert[] = []

  for (const [section, config] of Object.entries(SECTION_CONFIG) as [DashboardSection, typeof SECTION_CONFIG[DashboardSection]][]) {
    const sectionMetrics = metrics.metrics.filter(m => config.metricIds.includes(m.metricId))
    const sectionAlerts = generateAlerts(sectionMetrics, section)
    allAlerts.push(...sectionAlerts)

    const healthScore = computeSectionHealthScore(sectionMetrics, sectionAlerts)
    const summary = generateSectionSummary(section, sectionMetrics, sectionAlerts, healthScore)

    sections.push({
      section,
      label: config.label,
      metrics: sectionMetrics,
      alerts: sectionAlerts,
      healthScore,
      summary
    })
  }

  const overallHealthScore = computeOverallHealthScore(sections)
  const overallTrend = detectOverallTrend(metrics, previousMetrics)

  const recommendations = generateRecommendations(sections, allAlerts, atoms)

  return {
    timestamp: new Date().toISOString(),
    scope,
    sections,
    overallHealthScore,
    overallTrend,
    alerts: allAlerts,
    summary: generateDashboardSummary(sections, overallHealthScore, overallTrend),
    recommendations
  }
}

function generateAlerts(sectionMetrics: MetricValue[], section: DashboardSection): DashboardAlert[] {
  const alerts: DashboardAlert[] = []

  for (const metric of sectionMetrics) {
    const threshold = ALERT_THRESHOLDS.find(t => t.metricId === metric.metricId)
    if (!threshold) continue

    let level: AlertLevel = 'ok'

    if (threshold.direction === 'higher_better') {
      if (threshold.criticalMin !== undefined && metric.value < threshold.criticalMin) {
        level = 'critical'
      } else if (threshold.warningMin !== undefined && metric.value < threshold.warningMin) {
        level = 'warning'
      }
    } else {
      if (threshold.criticalMax !== undefined && metric.value > threshold.criticalMax) {
        level = 'critical'
      } else if (threshold.warningMax !== undefined && metric.value > threshold.warningMax) {
        level = 'warning'
      }
    }

    if (level !== 'ok') {
      alerts.push({
        id: `alert-${section}-${metric.metricId}-${Date.now()}`,
        section,
        level,
        metricId: metric.metricId,
        message: `${metric.label} 当前值 ${metric.value}${metric.unit}，${level === 'critical' ? '严重' : ''}偏离正常范围`,
        recommendation: level === 'critical'
          ? `需要立即关注 ${metric.label}，当前值 ${metric.value}${metric.unit}`
          : `建议关注 ${metric.label}，当前值 ${metric.value}${metric.unit}`,
        triggeredAt: new Date().toISOString()
      })
    }
  }

  return alerts
}

function computeSectionHealthScore(metrics: MetricValue[], alerts: DashboardAlert[]): number {
  if (metrics.length === 0) return 1

  const criticalCount = alerts.filter(a => a.level === 'critical').length
  const warningCount = alerts.filter(a => a.level === 'warning').length

  const baseScore = metrics.reduce((sum, m) => {
    // 简单归一化：假设大多数指标在 0-1 范围
    return sum + Math.min(1, Math.max(0, m.value))
  }, 0) / metrics.length

  const penalty = criticalCount * 0.3 + warningCount * 0.1
  return Math.max(0, Math.round((baseScore - penalty) * 100) / 100)
}

function computeOverallHealthScore(sections: DashboardSectionData[]): number {
  if (sections.length === 0) return 1
  return Math.round(sections.reduce((sum, s) => sum + s.healthScore, 0) / sections.length * 100) / 100
}

function detectOverallTrend(
  current: MemoryProductMetricsResult,
  previous?: MemoryProductMetricsResult
): 'improving' | 'declining' | 'stable' {
  if (!previous) return 'stable'

  const improving = current.metrics.filter(m => m.trend === 'improving').length
  const declining = current.metrics.filter(m => m.trend === 'declining').length

  if (improving > declining * 1.5) return 'improving'
  if (declining > improving * 1.5) return 'declining'
  return 'stable'
}

function generateSectionSummary(
  section: DashboardSection,
  metrics: MetricValue[],
  alerts: DashboardAlert[],
  healthScore: number
): string {
  const criticalAlerts = alerts.filter(a => a.level === 'critical')
  const warningAlerts = alerts.filter(a => a.level === 'warning')

  if (criticalAlerts.length > 0) {
    return `${SECTION_CONFIG[section].label}健康度 ${Math.round(healthScore * 100)}%，${criticalAlerts.length} 项严重告警`
  }
  if (warningAlerts.length > 0) {
    return `${SECTION_CONFIG[section].label}健康度 ${Math.round(healthScore * 100)}%，${warningAlerts.length} 项警告`
  }
  return `${SECTION_CONFIG[section].label}健康度 ${Math.round(healthScore * 100)}%，一切正常`
}

function generateDashboardSummary(
  sections: DashboardSectionData[],
  overallHealthScore: number,
  overallTrend: string
): string {
  const trendLabel = overallTrend === 'improving' ? '上升' : overallTrend === 'declining' ? '下降' : '稳定'
  const criticalSections = sections.filter(s => s.alerts.some(a => a.level === 'critical'))

  if (criticalSections.length > 0) {
    return `仪表盘整体健康度 ${Math.round(overallHealthScore * 100)}%，趋势${trendLabel}。${criticalSections.length} 个分区存在严重告警：${criticalSections.map(s => s.label).join('、')}`
  }

  return `仪表盘整体健康度 ${Math.round(overallHealthScore * 100)}%，趋势${trendLabel}。所有分区运行正常。`
}

function generateRecommendations(
  sections: DashboardSectionData[],
  alerts: DashboardAlert[],
  atoms: MemoryAtom[]
): string[] {
  const recommendations: string[] = []

  const criticalAlerts = alerts.filter(a => a.level === 'critical')
  for (const alert of criticalAlerts) {
    recommendations.push(`[严重] ${alert.recommendation}`)
  }

  // 基于原子数据生成额外建议
  const draftCount = atoms.filter(a => a.lifecycle === 'draft').length
  if (draftCount > 20) {
    recommendations.push(`有 ${draftCount} 条草稿记忆，建议清理或确认`)
  }

  const conflictAtoms = atoms.filter(a => a.contradictionOf.length > 0)
  if (conflictAtoms.length > 5) {
    recommendations.push(`有 ${conflictAtoms.length} 条记忆存在冲突，建议审查解决`)
  }

  const lowConfAtoms = atoms.filter(a => a.confidence < 0.3 && a.lifecycle === 'active')
  if (lowConfAtoms.length > 10) {
    recommendations.push(`有 ${lowConfAtoms.length} 条低置信度活跃记忆，建议确认或归档`)
  }

  if (recommendations.length === 0) {
    recommendations.push('当前所有指标正常，无需特别关注')
  }

  return recommendations
}

/**
 * 获取分区数据
 */
export function getDashboardSection(
  dashboard: MetricsDashboardResult,
  section: DashboardSection
): DashboardSectionData | null {
  return dashboard.sections.find(s => s.section === section) ?? null
}

/**
 * 获取所有告警（可按级别过滤）
 */
export function getDashboardAlerts(
  dashboard: MetricsDashboardResult,
  level?: AlertLevel
): DashboardAlert[] {
  if (!level) return dashboard.alerts
  return dashboard.alerts.filter(a => a.level === level)
}

/**
 * 生成仪表盘文本摘要（面向用户）
 */
export function summarizeDashboard(dashboard: MetricsDashboardResult): string {
  const lines: string[] = [
    `═══ 记忆系统仪表盘 ═══`,
    `整体健康度：${Math.round(dashboard.overallHealthScore * 100)}% | 趋势：${dashboard.overallTrend === 'improving' ? '↑ 改善中' : dashboard.overallTrend === 'declining' ? '↓ 下降中' : '→ 稳定'}`,
    `告警：${dashboard.alerts.filter(a => a.level === 'critical').length} 严重 / ${dashboard.alerts.filter(a => a.level === 'warning').length} 警告`,
    ''
  ]

  for (const section of dashboard.sections) {
    lines.push(`【${section.label}】健康度 ${Math.round(section.healthScore * 100)}%`)
    for (const metric of section.metrics.slice(0, 3)) {
      const trendIcon = metric.trend === 'improving' ? '↑' : metric.trend === 'declining' ? '↓' : '→'
      lines.push(`  ${trendIcon} ${metric.label}: ${metric.value}${metric.unit}`)
    }
    if (section.alerts.length > 0) {
      lines.push(`  ⚠ ${section.alerts.length} 条告警`)
    }
    lines.push('')
  }

  if (dashboard.recommendations.length > 0) {
    lines.push('【建议】')
    for (const rec of dashboard.recommendations.slice(0, 3)) {
      lines.push(`  • ${rec}`)
    }
  }

  return lines.join('\n')
}
