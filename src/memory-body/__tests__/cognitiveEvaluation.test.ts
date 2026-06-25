import { describe, expect, it } from 'vitest'
import {
  evaluateCognitiveState,
  compareEvaluations,
  getEvaluationGrade,
  summarizeEvaluation
} from '../evaluation/cognitiveEvaluation'
import type { MemoryAtom, MemoryBodyState } from '../core/memoryBodyTypes'

function createTestAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: `atom-${Math.random().toString(36).slice(2, 7)}`,
    scope: 'user',
    layer: 'preference',
    type: 'preference',
    subject: 'user',
    predicate: 'likes',
    object: 'coffee',
    content: '用户喜欢咖啡',
    source: { type: 'chat', timestamp: new Date().toISOString() },
    confidence: 0.8,
    strength: 0.7,
    emotionalWeight: 0.3,
    sensitivity: 'low',
    lifecycle: 'active',
    evidence: [],
    tags: ['food', 'preference'],
    scenarios: ['general'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    accessCount: 5,
    contradictionOf: [],
    ...overrides
  }
}

function createTestState(atoms: MemoryAtom[]): MemoryBodyState {
  return {
    atoms,
    version: 1,
    lastSyncAt: new Date().toISOString()
  }
}

describe('CognitiveEvaluation', () => {
  describe('evaluateCognitiveState', () => {
    it('should evaluate an empty state', () => {
      const state = createTestState([])
      const result = evaluateCognitiveState(state)

      expect(result.id).toMatch(/^eval-/)
      expect(result.atomCount).toBe(0)
      expect(result.metrics).toHaveLength(10)
      expect(result.overallScore).toBeDefined()
      expect(result.recommendations).toBeDefined()
    })

    it('should evaluate a state with confirmed atoms', () => {
      const atoms = [
        createTestAtom({ lifecycle: 'confirmed', confidence: 0.9 }),
        createTestAtom({ lifecycle: 'confirmed', confidence: 0.8 }),
        createTestAtom({ lifecycle: 'stable', confidence: 0.95 })
      ]
      const state = createTestState(atoms)
      const result = evaluateCognitiveState(state)

      expect(result.atomCount).toBe(3)
      expect(result.activeAtomCount).toBe(3)
      expect(result.confirmationCount).toBe(3)
      expect(result.overallScore).toBeDefined()
    })

    it('should calculate accuracy correctly', () => {
      const atoms = [
        createTestAtom({ lifecycle: 'confirmed' }),
        createTestAtom({ lifecycle: 'draft' }),
        createTestAtom({ lifecycle: 'active' }),
        createTestAtom({ lifecycle: 'contradicted' })
      ]
      const state = createTestState(atoms)
      const result = evaluateCognitiveState(state)

      const accuracyMetric = result.metrics.find(m => m.metric === 'accuracy')
      expect(accuracyMetric).toBeDefined()
      expect(accuracyMetric!.score).toBe(0.25)
    })

    it('should calculate coverage based on atom types', () => {
      const atoms = [
        createTestAtom({ type: 'preference' }),
        createTestAtom({ type: 'boundary' }),
        createTestAtom({ type: 'goal' })
      ]
      const state = createTestState(atoms)
      const result = evaluateCognitiveState(state)

      const coverageMetric = result.metrics.find(m => m.metric === 'coverage')
      expect(coverageMetric).toBeDefined()
      expect(coverageMetric!.score).toBe(0.3)
    })

    it('should detect stale atoms', () => {
      const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
      const atoms = [
        createTestAtom({ lastAccessedAt: oldDate }),
        createTestAtom({ lastAccessedAt: new Date().toISOString() })
      ]
      const state = createTestState(atoms)
      const result = evaluateCognitiveState(state)

      expect(result.staleAtomCount).toBe(1)
    })

    it('should count forbidden atoms', () => {
      const atoms = [
        createTestAtom({ lifecycle: 'forbidden' }),
        createTestAtom({ lifecycle: 'forbidden' }),
        createTestAtom({ lifecycle: 'active' })
      ]
      const state = createTestState(atoms)
      const result = evaluateCognitiveState(state)

      expect(result.forbiddenAtomCount).toBe(2)
      expect(result.forgetCount).toBe(2)
    })

    it('should count atoms with contradictions', () => {
      const atoms = [
        createTestAtom({ contradictionOf: ['atom-other'] }),
        createTestAtom({ contradictionOf: [] })
      ]
      const state = createTestState(atoms)
      const result = evaluateCognitiveState(state)

      expect(result.conflictCount).toBe(1)
    })

    it('should generate recommendations for low accuracy', () => {
      const atoms = [
        createTestAtom({ lifecycle: 'draft' }),
        createTestAtom({ lifecycle: 'contradicted' })
      ]
      const state = createTestState(atoms)
      const result = evaluateCognitiveState(state)

      const accuracyRecs = result.recommendations.filter(r => r.category === 'accuracy')
      expect(accuracyRecs.length).toBeGreaterThan(0)
      expect(accuracyRecs[0].priority).toBe('high')
    })

    it('should generate recommendations for large atom count', () => {
      const atoms = Array.from({ length: 501 }, (_, i) =>
        createTestAtom({ id: `atom-${i}`, lifecycle: 'active' })
      )
      const state = createTestState(atoms)
      const result = evaluateCognitiveState(state)

      const economyRecs = result.recommendations.filter(r => r.category === 'economy')
      expect(economyRecs.length).toBeGreaterThan(0)
    })

    it('should calculate average confidence and strength', () => {
      const atoms = [
        createTestAtom({ confidence: 0.5, strength: 0.3 }),
        createTestAtom({ confidence: 0.9, strength: 0.7 })
      ]
      const state = createTestState(atoms)
      const result = evaluateCognitiveState(state)

      expect(result.averageConfidence).toBe(0.7)
      expect(result.averageStrength).toBe(0.5)
    })

    it('should have all 10 metrics', () => {
      const state = createTestState([createTestAtom()])
      const result = evaluateCognitiveState(state)

      const metricNames = result.metrics.map(m => m.metric)
      expect(metricNames).toContain('accuracy')
      expect(metricNames).toContain('coverage')
      expect(metricNames).toContain('user_satisfaction')
      expect(metricNames).toContain('correction_rate')
      expect(metricNames).toContain('confirmation_rate')
      expect(metricNames).toContain('forget_rate')
      expect(metricNames).toContain('conflict_rate')
      expect(metricNames).toContain('staleness')
      expect(metricNames).toContain('prompt_efficiency')
      expect(metricNames).toContain('trust_score')
    })
  })

  describe('compareEvaluations', () => {
    it('should detect improving trends', () => {
      const atoms1 = [createTestAtom({ lifecycle: 'draft', confidence: 0.3 })]
      const atoms2 = [createTestAtom({ lifecycle: 'confirmed', confidence: 0.9 })]
      const prev = evaluateCognitiveState(createTestState(atoms1))
      const curr = evaluateCognitiveState(createTestState(atoms2))

      const trends = compareEvaluations(prev, curr)

      const accuracyTrend = trends.find(t => t.metric === 'accuracy')
      expect(accuracyTrend).toBeDefined()
      expect(accuracyTrend!.direction).toBe('improving')
    })

    it('should detect stable trends', () => {
      const atoms = [createTestAtom({ lifecycle: 'confirmed', confidence: 0.8 })]
      const prev = evaluateCognitiveState(createTestState(atoms))
      const curr = evaluateCognitiveState(createTestState(atoms))

      const trends = compareEvaluations(prev, curr)

      for (const trend of trends) {
        expect(trend.direction).toBe('stable')
      }
    })

    it('should detect declining trends', () => {
      const atoms1 = [createTestAtom({ lifecycle: 'confirmed', confidence: 0.9 })]
      const atoms2 = [createTestAtom({ lifecycle: 'draft', confidence: 0.3 })]
      const prev = evaluateCognitiveState(createTestState(atoms1))
      const curr = evaluateCognitiveState(createTestState(atoms2))

      const trends = compareEvaluations(prev, curr)

      const accuracyTrend = trends.find(t => t.metric === 'accuracy')
      expect(accuracyTrend).toBeDefined()
      expect(accuracyTrend!.direction).toBe('declining')
    })

    it('should return all 10 trend entries', () => {
      const atoms = [createTestAtom()]
      const prev = evaluateCognitiveState(createTestState(atoms))
      const curr = evaluateCognitiveState(createTestState(atoms))

      const trends = compareEvaluations(prev, curr)

      expect(trends).toHaveLength(10)
    })
  })

  describe('getEvaluationGrade', () => {
    it('should return A for score >= 0.9', () => {
      expect(getEvaluationGrade(0.9)).toBe('A')
      expect(getEvaluationGrade(0.95)).toBe('A')
      expect(getEvaluationGrade(1.0)).toBe('A')
    })

    it('should return B for score >= 0.7', () => {
      expect(getEvaluationGrade(0.7)).toBe('B')
      expect(getEvaluationGrade(0.85)).toBe('B')
    })

    it('should return C for score >= 0.5', () => {
      expect(getEvaluationGrade(0.5)).toBe('C')
      expect(getEvaluationGrade(0.65)).toBe('C')
    })

    it('should return D for score >= 0.3', () => {
      expect(getEvaluationGrade(0.3)).toBe('D')
      expect(getEvaluationGrade(0.45)).toBe('D')
    })

    it('should return F for score < 0.3', () => {
      expect(getEvaluationGrade(0.2)).toBe('F')
      expect(getEvaluationGrade(0)).toBe('F')
    })
  })

  describe('summarizeEvaluation', () => {
    it('should summarize an evaluation result', () => {
      const atoms = [createTestAtom({ lifecycle: 'confirmed', confidence: 0.9 })]
      const state = createTestState(atoms)
      const result = evaluateCognitiveState(state)

      const summary = summarizeEvaluation(result)

      expect(summary.grade).toBeDefined()
      expect(summary.overallScore).toBe(result.overallScore)
      expect(summary.topStrength).toBeDefined()
      expect(summary.topWeakness).toBeDefined()
      expect(summary.recommendationCount).toBe(result.recommendations.length)
      expect(summary.highPriorityCount).toBeDefined()
    })
  })
})
