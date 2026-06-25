import { useMemo, type FC } from 'react'
import { buildMetricsDashboard, getDashboardSection, getDashboardAlerts } from '../memory-body/dashboard/metricsDashboard'
import type { DashboardSectionData, AlertLevel, DashboardSection } from '../memory-body/dashboard/metricsDashboard'
import type { MemoryProductMetricsResult } from '../memory-body/metrics/memoryProductMetrics'
import type { MemoryAtom, MemoryScope } from '../memory-body/core/memoryBodyTypes'
import './MetricsDashboardUI.css'

interface MetricsDashboardUIProps {
  metrics: MemoryProductMetricsResult
  previousMetrics?: MemoryProductMetricsResult
  atoms: MemoryAtom[]
  scope: MemoryScope
  onClose?: () => void
}

const SECTION_LABELS: Record<DashboardSection, string> = {
  overview: '总览',
  quality: '质量',
  performance: '性能',
  safety: '安全',
  growth: '增长',
  engagement: '参与度'
}

const TREND_ICONS: Record<string, string> = {
  improving: '↑',
  declining: '↓',
  stable: '→'
}

const ALERT_COLORS: Record<AlertLevel, string> = {
  ok: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444'
}

const SECTION_ORDER: DashboardSection[] = ['overview', 'quality', 'performance', 'safety', 'growth', 'engagement']

function RingProgress({ score, size = 64, strokeWidth = 6 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(1, Math.max(0, score)))

  const color = score >= 0.7 ? '#10B981' : score >= 0.4 ? '#F59E0B' : '#EF4444'

  return (
    <svg width={size} height={size} className="md-ring" viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={size * 0.22}
        fontWeight={600}
      >
        {Math.round(score * 100)}
      </text>
    </svg>
  )
}

function TrendArrow({ trend }: { trend: string }) {
  const icon = TREND_ICONS[trend] ?? '→'
  const color = trend === 'improving' ? '#10B981' : trend === 'declining' ? '#EF4444' : '#9CA3AF'
  return <span className="md-trend-arrow" style={{ color }}>{icon}</span>
}

function AlertBadge({ count, level }: { count: number; level: AlertLevel }) {
  if (count === 0) return null
  return (
    <span className="md-alert-badge" style={{ backgroundColor: ALERT_COLORS[level] }}>
      {count}
    </span>
  )
}

function SectionCard({ section }: { section: DashboardSectionData }) {
  const criticalCount = section.alerts.filter(a => a.level === 'critical').length
  const warningCount = section.alerts.filter(a => a.level === 'warning').length

  return (
    <div className="md-section-card">
      <div className="md-section-card-header">
        <div className="md-section-card-title-row">
          <h3 className="md-section-card-title">{section.label}</h3>
          <div className="md-section-card-badges">
            {criticalCount > 0 && <AlertBadge count={criticalCount} level="critical" />}
            {warningCount > 0 && <AlertBadge count={warningCount} level="warning" />}
          </div>
        </div>
        <RingProgress score={section.healthScore} size={56} strokeWidth={5} />
      </div>
      <p className="md-section-card-summary">{section.summary}</p>
      <div className="md-section-metrics">
        {section.metrics.map(m => (
          <div key={m.metricId} className="md-metric-row">
            <span className="md-metric-label">{m.label}</span>
            <span className="md-metric-value">
              <TrendArrow trend={m.trend} />
              <span className="md-metric-number">{m.value}{m.unit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const MetricsDashboardUI: FC<MetricsDashboardUIProps> = ({
  metrics,
  previousMetrics,
  atoms,
  scope,
  onClose: _onClose
}) => {
  const dashboard = useMemo(
    () => buildMetricsDashboard({ metrics, previousMetrics, atoms, scope }),
    [metrics, previousMetrics, atoms, scope]
  )

  const criticalAlerts = useMemo(() => getDashboardAlerts(dashboard, 'critical'), [dashboard])
  const warningAlerts = useMemo(() => getDashboardAlerts(dashboard, 'warning'), [dashboard])

  const overallTrendLabel = dashboard.overallTrend === 'improving' ? '改善中' : dashboard.overallTrend === 'declining' ? '下降中' : '稳定'

  if (metrics.metrics.length === 0) {
    return (
      <div className="md-container">
        <div className="md-empty">
          <div className="md-empty-icon">📊</div>
          <p className="md-empty-title">暂无指标数据</p>
          <p className="md-empty-desc">记忆系统尚未生成产品指标，请先确保有足够的记忆数据。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="md-container">
      {/* 顶部整体健康评分 */}
      <div className="md-overall-header">
        <div className="md-overall-score-section">
          <RingProgress score={dashboard.overallHealthScore} size={88} strokeWidth={7} />
          <div className="md-overall-info">
            <h2 className="md-overall-title">整体健康评分</h2>
            <p className="md-overall-trend">
              趋势：<span className={`md-trend-text md-trend-${dashboard.overallTrend}`}>
                {TREND_ICONS[dashboard.overallTrend]} {overallTrendLabel}
              </span>
            </p>
            <p className="md-overall-summary">{dashboard.summary}</p>
          </div>
        </div>
        <div className="md-overall-alerts">
          {criticalAlerts.length > 0 && (
            <div className="md-alert-summary md-alert-summary-critical">
              <span className="md-alert-dot" style={{ backgroundColor: ALERT_COLORS.critical }} />
              严重告警 {criticalAlerts.length} 项
            </div>
          )}
          {warningAlerts.length > 0 && (
            <div className="md-alert-summary md-alert-summary-warning">
              <span className="md-alert-dot" style={{ backgroundColor: ALERT_COLORS.warning }} />
              警告 {warningAlerts.length} 项
            </div>
          )}
          {criticalAlerts.length === 0 && warningAlerts.length === 0 && (
            <div className="md-alert-summary md-alert-summary-ok">
              <span className="md-alert-dot" style={{ backgroundColor: ALERT_COLORS.ok }} />
              无告警
            </div>
          )}
        </div>
      </div>

      {/* 分区卡片网格 */}
      <div className="md-sections-grid">
        {SECTION_ORDER.map(sectionKey => {
          const section = getDashboardSection(dashboard, sectionKey)
          if (!section) return null
          return <SectionCard key={sectionKey} section={section} />
        })}
      </div>

      {/* 告警列表 */}
      {dashboard.alerts.length > 0 && (
        <div className="md-alerts-panel">
          <h3 className="md-panel-title">告警列表</h3>
          <div className="md-alerts-list">
            {dashboard.alerts
              .sort((a, b) => {
                const order: Record<AlertLevel, number> = { critical: 0, warning: 1, ok: 2 }
                return order[a.level] - order[b.level]
              })
              .map(alert => (
                <div key={alert.id} className={`md-alert-item md-alert-item-${alert.level}`}>
                  <span className="md-alert-level-dot" style={{ backgroundColor: ALERT_COLORS[alert.level] }} />
                  <div className="md-alert-content">
                    <span className="md-alert-section-label">{SECTION_LABELS[alert.section]}</span>
                    <span className="md-alert-message">{alert.message}</span>
                  </div>
                  <span className="md-alert-recommendation">{alert.recommendation}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 建议列表 */}
      {dashboard.recommendations.length > 0 && (
        <div className="md-recommendations-panel">
          <h3 className="md-panel-title">建议</h3>
          <ul className="md-recommendations-list">
            {dashboard.recommendations.map((rec, i) => (
              <li key={i} className="md-recommendation-item">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
