import { describe, it, expect } from 'vitest'
import {
  computeTotalAtoms,
  computeActiveAtoms,
  computeStableAtoms,
  computeConfirmedAtoms,
  computeArchivedAtoms,
  computeTransientAtoms,
  computeConfirmationRate,
  computeCorrectionRate,
  computeForgetRate,
  computeConflictRate,
  computeAverageConfidence,
  computeAverageQuality,
  computeScopeDistribution,
  computeSensitivityDistribution,
  computeScenarioDistribution,
  computeUserSatisfaction,
  computePromptEfficiency,
  computeTrustScore,
  computeStaleRatio,
  computeEvidenceRichness,
  computeMemoryProductMetrics,
  summarizeProductMetrics,
} from '../metrics/memoryProductMetrics'
import type { MemoryAtom } from '../types'

function makeAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: `atom-${Math.random().toString(36).slice(2, 8)}`,
    content: '用户偏好 TypeScript',
    kind: 'preference',
    scope: 'project',
    scenario: 'coding',
    lifecycle: 'active',
    status: 'active',
    confidence: 0.7,
    sensitivity: 'public',
    source: 'chat',
    evidence: [{ source: 'chat', content: '用户说喜欢 TS', timestamp: new Date().toISOString() }],
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    quality: 0.6,
    ...overrides,
  }
}

describe('computeTotalAtoms', () => {
  it('counts all atoms', () => {
    const atoms = [makeAtom(), makeAtom(), makeAtom()]
    expect(computeTotalAtoms(atoms).value).toBe(3)
  })

  it('returns 0 for empty array', () => {
    expect(computeTotalAtoms([]).value).toBe(0)
  })
})

describe('computeActiveAtoms', () => {
  it('counts only active atoms', () => {
    const atoms = [
      makeAtom({ lifecycle: 'active' }),
      makeAtom({ lifecycle: 'stable' }),
      makeAtom({ lifecycle: 'active' }),
    ]
    expect(computeActiveAtoms(atoms).value).toBe(2)
  })
})

describe('computeStableAtoms', () => {
  it('counts only stable atoms', () => {
    const atoms = [
      makeAtom({ lifecycle: 'stable' }),
      makeAtom({ lifecycle: 'active' }),
      makeAtom({ lifecycle: 'stable' }),
    ]
    expect(computeStableAtoms(atoms).value).toBe(2)
  })
})

describe('computeConfirmedAtoms', () => {
  it('counts only confirmed atoms', () => {
    const atoms = [
      makeAtom({ lifecycle: 'confirmed' }),
      makeAtom({ lifecycle: 'active' }),
      makeAtom({ lifecycle: 'confirmed' }),
    ]
    expect(computeConfirmedAtoms(atoms).value).toBe(2)
  })
})

describe('computeArchivedAtoms', () => {
  it('counts only archived atoms', () => {
    const atoms = [
      makeAtom({ lifecycle: 'archived' }),
      makeAtom({ lifecycle: 'active' }),
    ]
    expect(computeArchivedAtoms(atoms).value).toBe(1)
  })
})

describe('computeTransientAtoms', () => {
  it('counts only transient atoms', () => {
    const atoms = [
      makeAtom({ lifecycle: 'transient' }),
      makeAtom({ lifecycle: 'active' }),
    ]
    expect(computeTransientAtoms(atoms).value).toBe(1)
  })
})

describe('computeConfirmationRate', () => {
  it('calculates ratio of confirmed to non-transient atoms', () => {
    const atoms = [
      makeAtom({ lifecycle: 'confirmed' }),
      makeAtom({ lifecycle: 'active' }),
      makeAtom({ lifecycle: 'transient' }),
    ]
    expect(computeConfirmationRate(atoms).value).toBe(0.5)
  })

  it('returns 0 when no non-transient atoms', () => {
    const atoms = [makeAtom({ lifecycle: 'transient' })]
    expect(computeConfirmationRate(atoms).value).toBe(0)
  })
})

describe('computeCorrectionRate', () => {
  it('calculates ratio of corrected atoms', () => {
    const atoms = [
      makeAtom({ status: 'corrected' }),
      makeAtom({ status: 'active' }),
    ]
    expect(computeCorrectionRate(atoms).value).toBe(0.5)
  })
})

describe('computeForgetRate', () => {
  it('calculates ratio of forgotten atoms', () => {
    const atoms = [
      makeAtom({ status: 'forgotten' }),
      makeAtom({ status: 'active' }),
    ]
    expect(computeForgetRate(atoms).value).toBe(0.5)
  })
})

describe('computeConflictRate', () => {
  it('calculates ratio of conflicted atoms', () => {
    const atoms = [
      makeAtom({ status: 'conflict' }),
      makeAtom({ status: 'active' }),
    ]
    expect(computeConflictRate(atoms).value).toBe(0.5)
  })
})

describe('computeAverageConfidence', () => {
  it('calculates average confidence', () => {
    const atoms = [
      makeAtom({ confidence: 0.5 }),
      makeAtom({ confidence: 0.9 }),
    ]
    expect(computeAverageConfidence(atoms).value).toBe(0.7)
  })

  it('returns 0 for empty array', () => {
    expect(computeAverageConfidence([]).value).toBe(0)
  })
})

describe('computeAverageQuality', () => {
  it('calculates average quality', () => {
    const atoms = [
      makeAtom({ quality: 0.5 }),
      makeAtom({ quality: 0.9 }),
    ]
    expect(computeAverageQuality(atoms).value).toBe(0.7)
  })

  it('returns 0 for empty array', () => {
    expect(computeAverageQuality([]).value).toBe(0)
  })
})

describe('computeScopeDistribution', () => {
  it('returns high balance for even distribution', () => {
    const atoms = [
      makeAtom({ scope: 'global' }),
      makeAtom({ scope: 'project' }),
      makeAtom({ scope: 'session' }),
      makeAtom({ scope: 'personal' }),
    ]
    const result = computeScopeDistribution(atoms)
    expect(result.value).toBeGreaterThan(0.5)
  })

  it('returns 0 for empty array', () => {
    expect(computeScopeDistribution([]).value).toBe(0)
  })
})

describe('computeSensitivityDistribution', () => {
  it('calculates public ratio', () => {
    const atoms = [
      makeAtom({ sensitivity: 'public' }),
      makeAtom({ sensitivity: 'internal' }),
    ]
    expect(computeSensitivityDistribution(atoms).value).toBe(0.5)
  })
})

describe('computeScenarioDistribution', () => {
  it('counts unique scenarios', () => {
    const atoms = [
      makeAtom({ scenario: 'coding' }),
      makeAtom({ scenario: 'learning' }),
      makeAtom({ scenario: 'coding' }),
    ]
    expect(computeScenarioDistribution(atoms).value).toBe(2)
  })
})

describe('computeUserSatisfaction', () => {
  it('calculates satisfaction score', () => {
    const atoms = [
      makeAtom({ lifecycle: 'confirmed' }),
      makeAtom({ lifecycle: 'confirmed' }),
      makeAtom({ lifecycle: 'active', status: 'corrected' }),
    ]
    const result = computeUserSatisfaction(atoms)
    expect(result.value).toBeGreaterThan(0)
    expect(result.value).toBeLessThanOrEqual(1)
  })
})

describe('computePromptEfficiency', () => {
  it('calculates ratio of active non-transient atoms', () => {
    const atoms = [
      makeAtom({ lifecycle: 'active' }),
      makeAtom({ lifecycle: 'transient' }),
      makeAtom({ lifecycle: 'archived' }),
    ]
    expect(computePromptEfficiency(atoms).value).toBeCloseTo(1 / 3, 2)
  })
})

describe('computeTrustScore', () => {
  it('calculates trust score', () => {
    const atoms = [
      makeAtom({ lifecycle: 'confirmed' }),
      makeAtom({ lifecycle: 'confirmed' }),
      makeAtom({ status: 'corrected' }),
    ]
    const result = computeTrustScore(atoms)
    expect(result.value).toBeGreaterThan(0)
    expect(result.value).toBeLessThanOrEqual(1)
  })

  it('returns 0 for empty array', () => {
    expect(computeTrustScore([]).value).toBe(0)
  })
})

describe('computeStaleRatio', () => {
  it('detects stale atoms', () => {
    const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    const atoms = [
      makeAtom({ updatedAt: oldDate, lifecycle: 'active' }),
      makeAtom(),
    ]
    expect(computeStaleRatio(atoms).value).toBe(0.5)
  })

  it('returns 0 for empty array', () => {
    expect(computeStaleRatio([]).value).toBe(0)
  })
})

describe('computeEvidenceRichness', () => {
  it('calculates average evidence count', () => {
    const atoms = [
      makeAtom({ evidence: [{ source: 'chat', content: 'a', timestamp: new Date().toISOString() }, { source: 'chat', content: 'b', timestamp: new Date().toISOString() }] }),
      makeAtom({ evidence: [] }),
    ]
    expect(computeEvidenceRichness(atoms).value).toBe(1)
  })

  it('returns 0 for empty array', () => {
    expect(computeEvidenceRichness([]).value).toBe(0)
  })
})

describe('computeHealthScore', () => {
  it('calculates health score from metrics', () => {
    const atoms = [
      makeAtom({ lifecycle: 'confirmed', confidence: 0.9, quality: 0.8 }),
      makeAtom({ lifecycle: 'active', confidence: 0.7, quality: 0.6 }),
    ]
    const result = computeMemoryProductMetrics({ atoms })
    expect(result.healthScore).toBeGreaterThan(0)
    expect(result.healthScore).toBeLessThanOrEqual(1)
  })
})

describe('generateRecommendations', () => {
  it('generates recommendations for metrics outside thresholds', () => {
    const atoms = Array.from({ length: 10 }, (_, i) =>
      makeAtom({
        status: i < 5 ? 'conflict' : 'active',
        lifecycle: 'active',
      })
    )
    const result = computeMemoryProductMetrics({ atoms })
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  it('returns healthy message when all metrics are fine', () => {
    const atoms = [
      makeAtom({ lifecycle: 'confirmed', confidence: 0.9, quality: 0.8, scope: 'global' }),
      makeAtom({ lifecycle: 'confirmed', confidence: 0.9, quality: 0.8, scope: 'project' }),
      makeAtom({ lifecycle: 'confirmed', confidence: 0.9, quality: 0.8, scope: 'session' }),
      makeAtom({ lifecycle: 'confirmed', confidence: 0.9, quality: 0.8, scope: 'personal' }),
    ]
    const result = computeMemoryProductMetrics({ atoms })
    expect(result.recommendations).toContain('所有指标在健康范围内')
  })
})

describe('computeMemoryProductMetrics', () => {
  it('returns all 20 metrics', () => {
    const atoms = [makeAtom()]
    const result = computeMemoryProductMetrics({ atoms })
    expect(result.metrics).toHaveLength(20)
  })

  it('includes timestamp', () => {
    const result = computeMemoryProductMetrics({ atoms: [] })
    expect(result.timestamp).toBeTruthy()
  })

  it('detects trends when previous metrics provided', () => {
    const atoms = [makeAtom()]
    const previous = computeMemoryProductMetrics({ atoms: [] })
    const result = computeMemoryProductMetrics({ atoms, previousMetrics: previous })
    const trends = result.metrics.map((m) => m.trend)
    expect(trends.every((t) => t !== 'unknown')).toBe(true)
  })

  it('marks trends as unknown without previous metrics', () => {
    const atoms = [makeAtom()]
    const result = computeMemoryProductMetrics({ atoms })
    const trends = result.metrics.map((m) => m.trend)
    expect(trends.every((t) => t === 'unknown')).toBe(true)
  })
})

describe('summarizeProductMetrics', () => {
  it('returns summary string with recommendations', () => {
    const atoms = [makeAtom()]
    const result = computeMemoryProductMetrics({ atoms })
    const summary = summarizeProductMetrics(result)
    expect(summary).toContain('健康评分')
    expect(summary).toContain('建议')
  })
})
