import { describe, it, expect } from 'vitest'
import {
  buildMetricsDashboard,
  getDashboardSection,
  getDashboardAlerts,
  summarizeDashboard,
} from '../dashboard/metricsDashboard'
import { computeMemoryProductMetrics } from '../metrics/memoryProductMetrics'
import type { MemoryAtom, MemoryScope } from '../types'

const scope: MemoryScope = { userId: 'user-1', projectId: 'project-1' }
const now = '2026-06-25T00:00:00.000Z'

function makeAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: `atom-${Math.random().toString(36).slice(2, 8)}`,
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

// ─── buildMetricsDashboard ──────────────────────────────────

describe('buildMetricsDashboard', () => {
  it('builds dashboard with all sections', () => {
    const atoms = [
      makeAtom({ lifecycle: 'confirmed', confidence: 0.9 }),
      makeAtom({ lifecycle: 'active', confidence: 0.7 }),
    ]
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    expect(dashboard.sections.length).toBe(6)
    expect(dashboard.sections.map(s => s.section)).toEqual([
      'overview', 'quality', 'performance', 'safety', 'growth', 'engagement',
    ])
    expect(dashboard.timestamp).toBeTruthy()
    expect(dashboard.scope).toEqual(scope)
  })

  it('computes overall health score between 0 and 1', () => {
    const atoms = [
      makeAtom({ lifecycle: 'confirmed', confidence: 0.9 }),
      makeAtom({ lifecycle: 'active', confidence: 0.7 }),
    ]
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    expect(dashboard.overallHealthScore).toBeGreaterThanOrEqual(0)
    expect(dashboard.overallHealthScore).toBeLessThanOrEqual(1)
  })

  it('detects stable trend without previous metrics', () => {
    const atoms = [makeAtom()]
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    expect(dashboard.overallTrend).toBe('stable')
  })

  it('generates alerts for metrics outside thresholds', () => {
    const atoms = Array.from({ length: 10 }, (_, i) =>
      makeAtom({
        id: `atom-${i}`,
        lifecycle: 'active',
        confidence: 0.2,
        contradictionOf: i < 5 ? ['other'] : [],
      })
    )
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    expect(dashboard.alerts.length).toBeGreaterThan(0)
  })

  it('generates recommendations for draft-heavy state', () => {
    const atoms = Array.from({ length: 25 }, (_, i) =>
      makeAtom({ id: `atom-${i}`, lifecycle: 'draft' })
    )
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    const draftRec = dashboard.recommendations.find(r => r.includes('草稿'))
    expect(draftRec).toBeDefined()
  })

  it('generates recommendations for conflict-heavy state', () => {
    const atoms = Array.from({ length: 10 }, (_, i) =>
      makeAtom({
        id: `atom-${i}`,
        lifecycle: 'active',
        contradictionOf: ['other'],
      })
    )
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    const conflictRec = dashboard.recommendations.find(r => r.includes('冲突'))
    expect(conflictRec).toBeDefined()
  })

  it('generates recommendations for low-confidence active atoms', () => {
    const atoms = Array.from({ length: 15 }, (_, i) =>
      makeAtom({ id: `atom-${i}`, lifecycle: 'active', confidence: 0.2 })
    )
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    const lowConfRec = dashboard.recommendations.find(r => r.includes('低置信度'))
    expect(lowConfRec).toBeDefined()
  })

  it('returns healthy recommendation when all is well', () => {
    const atoms = [
      makeAtom({
        lifecycle: 'confirmed',
        confidence: 0.9,
        evidence: [
          { id: 'ev-1', source: 'chat', sourceText: '用户明确表示喜欢 TypeScript', confidence: 0.9, timestamp: now },
        ],
      }),
    ]
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    expect(dashboard.recommendations).toContain('当前所有指标正常，无需特别关注')
  })

  it('handles empty atoms gracefully', () => {
    const metrics = computeMemoryProductMetrics({ atoms: [] })
    const dashboard = buildMetricsDashboard({ metrics, atoms: [], scope })

    expect(dashboard.sections.length).toBe(6)
    expect(dashboard.overallHealthScore).toBeGreaterThanOrEqual(0)
  })

  it('includes summary text', () => {
    const atoms = [makeAtom()]
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    expect(dashboard.summary).toContain('仪表盘')
    expect(dashboard.summary).toContain('健康度')
  })
})

// ─── getDashboardSection ────────────────────────────────────

describe('getDashboardSection', () => {
  it('returns the requested section', () => {
    const atoms = [makeAtom()]
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    const section = getDashboardSection(dashboard, 'quality')
    expect(section).not.toBeNull()
    expect(section!.section).toBe('quality')
    expect(section!.metrics.length).toBeGreaterThan(0)
  })

  it('returns null for non-existent section', () => {
    const atoms = [makeAtom()]
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    const section = getDashboardSection(dashboard, 'nonexistent' as keyof typeof dashboard.sections)
    expect(section).toBeNull()
  })
})

// ─── getDashboardAlerts ─────────────────────────────────────

describe('getDashboardAlerts', () => {
  it('returns all alerts when no level filter', () => {
    const atoms = Array.from({ length: 10 }, (_, i) =>
      makeAtom({ id: `atom-${i}`, lifecycle: 'active', confidence: 0.2 })
    )
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    const alerts = getDashboardAlerts(dashboard)
    expect(alerts.length).toBeGreaterThan(0)
  })

  it('filters alerts by level', () => {
    const atoms = Array.from({ length: 10 }, (_, i) =>
      makeAtom({ id: `atom-${i}`, lifecycle: 'active', confidence: 0.2 })
    )
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    const criticalAlerts = getDashboardAlerts(dashboard, 'critical')
    expect(criticalAlerts.every(a => a.level === 'critical')).toBe(true)
  })

  it('returns empty array when no alerts match level', () => {
    const atoms = [makeAtom({
      lifecycle: 'confirmed',
      confidence: 0.9,
      evidence: [
        { id: 'ev-1', source: 'chat', sourceText: '用户明确表示喜欢 TypeScript', confidence: 0.9, timestamp: now },
      ],
    })]
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    const criticalAlerts = getDashboardAlerts(dashboard, 'critical')
    expect(criticalAlerts).toHaveLength(0)
  })
})

// ─── summarizeDashboard ─────────────────────────────────────

describe('summarizeDashboard', () => {
  it('returns formatted dashboard summary', () => {
    const atoms = [makeAtom()]
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    const summary = summarizeDashboard(dashboard)
    expect(summary).toContain('记忆系统仪表盘')
    expect(summary).toContain('整体健康度')
    expect(summary).toContain('总览')
    expect(summary).toContain('质量')
  })

  it('includes recommendations in summary', () => {
    const atoms = [makeAtom()]
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    const summary = summarizeDashboard(dashboard)
    expect(summary).toContain('建议')
  })

  it('includes alert counts', () => {
    const atoms = [makeAtom()]
    const metrics = computeMemoryProductMetrics({ atoms })
    const dashboard = buildMetricsDashboard({ metrics, atoms, scope })

    const summary = summarizeDashboard(dashboard)
    expect(summary).toContain('告警')
  })
})
