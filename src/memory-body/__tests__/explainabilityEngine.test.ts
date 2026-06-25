import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import {
  explainAtom,
  explainAtoms,
  summarizeExplainability
} from '../explainability/explainabilityEngine'

const scope = { userId: 'user-1', projectId: 'project-1' }
const timestamp = '2026-06-24T00:00:00.000Z'

function createAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  const id = overrides.id ?? 'atom-1'
  return {
    id,
    scope: overrides.scope ?? scope,
    layer: overrides.layer ?? 'semantic',
    type: overrides.type ?? 'preference',
    subject: overrides.subject ?? 'user',
    predicate: overrides.predicate ?? 'likes',
    object: overrides.object ?? 'test',
    content: overrides.content ?? '测试记忆',
    source: overrides.source ?? 'chat',
    confidence: overrides.confidence ?? 0.78,
    strength: overrides.strength ?? 0.5,
    emotionalWeight: overrides.emotionalWeight ?? 0.1,
    sensitivity: overrides.sensitivity ?? 'personal',
    lifecycle: overrides.lifecycle ?? 'active',
    evidence: overrides.evidence ?? [{
      id: `evidence-${id}`,
      source: 'chat',
      sourceText: '测试证据',
      timestamp,
      confidence: 0.8
    }],
    tags: overrides.tags ?? [],
    scenarios: overrides.scenarios ?? ['chat'],
    createdAt: overrides.createdAt ?? timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
    lastAccessedAt: overrides.lastAccessedAt ?? timestamp,
    accessCount: overrides.accessCount ?? 1,
    contradictionOf: overrides.contradictionOf ?? []
  }
}

describe('ExplainabilityEngine', () => {
  describe('explainAtom', () => {
    it('should build provenance from atom', () => {
      const atom = createAtom({
        id: 'atom-1',
        content: '用户喜欢简洁的代码风格',
        source: 'chat',
        createdAt: '2026-06-01T00:00:00.000Z',
        evidence: [
          { id: 'ev-1', source: 'chat', sourceText: '用户说喜欢简洁代码', timestamp: '2026-06-01T00:00:00.000Z', confidence: 0.8 }
        ]
      })
      const explanation = explainAtom({ atom })
      expect(explanation.provenance.atomId).toBe('atom-1')
      expect(explanation.provenance.sourceType).toBe('chat')
      expect(explanation.provenance.firstRecordedAt).toBe('2026-06-01T00:00:00.000Z')
      expect(explanation.provenance.totalEvidence).toBe(1)
    })

    it('should build reinforcement from evidence', () => {
      const atom = createAtom({
        id: 'atom-1',
        evidence: [
          { id: 'ev-1', source: 'chat', sourceText: '第一次提到', timestamp: '2026-06-01T00:00:00.000Z', confidence: 0.8 },
          { id: 'ev-2', source: 'chat', sourceText: '第二次确认', timestamp: '2026-06-02T00:00:00.000Z', confidence: 0.9 }
        ]
      })
      const explanation = explainAtom({ atom })
      expect(explanation.reinforcement.reinforcedCount).toBe(2)
      expect(explanation.reinforcement.lastReinforcedAt).toBe('2026-06-02T00:00:00.000Z')
    })

    it('should not count low confidence evidence as reinforcement', () => {
      const atom = createAtom({
        id: 'atom-1',
        evidence: [
          { id: 'ev-1', source: 'chat', sourceText: '低置信度', timestamp: '2026-06-01T00:00:00.000Z', confidence: 0.3 }
        ]
      })
      const explanation = explainAtom({ atom })
      expect(explanation.reinforcement.reinforcedCount).toBe(0)
    })

    it('should detect confirmed lifecycle', () => {
      const atom = createAtom({ lifecycle: 'confirmed' })
      const explanation = explainAtom({ atom })
      expect(explanation.confirmation.confirmed).toBe(true)
    })

    it('should detect stable lifecycle as confirmed', () => {
      const atom = createAtom({ lifecycle: 'stable' })
      const explanation = explainAtom({ atom })
      expect(explanation.confirmation.confirmed).toBe(true)
    })

    it('should detect protected lifecycle as confirmed', () => {
      const atom = createAtom({ lifecycle: 'protected' })
      const explanation = explainAtom({ atom })
      expect(explanation.confirmation.confirmed).toBe(true)
    })

    it('should detect unconfirmed lifecycle', () => {
      const atom = createAtom({ lifecycle: 'active' })
      const explanation = explainAtom({ atom })
      expect(explanation.confirmation.confirmed).toBe(false)
    })

    it('should record usage when used in prompt', () => {
      const atom = createAtom({ id: 'atom-1', accessCount: 5 })
      const explanation = explainAtom({ atom, usedInPrompt: true, promptReason: '匹配当前场景' })
      expect(explanation.usage.usedInResponse).toBe(true)
      expect(explanation.usage.usageCount).toBe(5)
      expect(explanation.usage.usageContexts).toContain('匹配当前场景')
    })

    it('should record not used when not in prompt', () => {
      const atom = createAtom({ id: 'atom-1' })
      const explanation = explainAtom({ atom, usedInPrompt: false })
      expect(explanation.usage.usedInResponse).toBe(false)
    })

    it('should detect conflicts from contradictionOf', () => {
      const atom = createAtom({
        id: 'atom-1',
        contradictionOf: ['atom-2', 'atom-3']
      })
      const explanation = explainAtom({ atom })
      expect(explanation.conflict.hasConflicts).toBe(true)
      expect(explanation.conflict.conflictingAtomIds).toEqual(['atom-2', 'atom-3'])
    })

    it('should detect no conflicts', () => {
      const atom = createAtom({ id: 'atom-1', contradictionOf: [] })
      const explanation = explainAtom({ atom })
      expect(explanation.conflict.hasConflicts).toBe(false)
    })

    it('should build prompt decision with quality and economy', () => {
      const atom = createAtom({ id: 'atom-1' })
      const explanation = explainAtom({ atom, usedInPrompt: true, promptReason: '高质量匹配' })
      expect(explanation.promptDecision.included).toBe(true)
      expect(explanation.promptDecision.reason).toBe('高质量匹配')
      expect(explanation.promptDecision.qualityScore).toBeDefined()
      expect(explanation.promptDecision.economyScore).toBeDefined()
    })

    it('should generate summary string', () => {
      const atom = createAtom({
        id: 'atom-1',
        content: '用户偏好 TypeScript',
        lifecycle: 'confirmed',
        accessCount: 3
      })
      const explanation = explainAtom({ atom, usedInPrompt: true })
      expect(explanation.summary).toBeTruthy()
      expect(typeof explanation.summary).toBe('string')
      expect(explanation.summary.length).toBeGreaterThan(0)
    })
  })

  describe('explainAtoms', () => {
    it('should explain multiple atoms', () => {
      const atoms = [
        createAtom({ id: 'atom-1' }),
        createAtom({ id: 'atom-2' })
      ]
      const explanations = explainAtoms({ atoms })
      expect(explanations).toHaveLength(2)
    })

    it('should mark used atoms based on usedAtomIds', () => {
      const atoms = [
        createAtom({ id: 'atom-1' }),
        createAtom({ id: 'atom-2' })
      ]
      const explanations = explainAtoms({ atoms, usedAtomIds: ['atom-1'] })
      expect(explanations[0].promptDecision.included).toBe(true)
      expect(explanations[1].promptDecision.included).toBe(false)
    })

    it('should use promptReasons for specific atoms', () => {
      const atoms = [createAtom({ id: 'atom-1' })]
      const explanations = explainAtoms({
        atoms,
        usedAtomIds: ['atom-1'],
        promptReasons: { 'atom-1': '自定义原因' }
      })
      expect(explanations[0].promptDecision.reason).toBe('自定义原因')
    })
  })

  describe('summarizeExplainability', () => {
    it('should count confirmed and unconfirmed', () => {
      const atoms = [
        createAtom({ id: 'atom-1', lifecycle: 'confirmed' }),
        createAtom({ id: 'atom-2', lifecycle: 'active' })
      ]
      const explanations = explainAtoms({ atoms })
      const summary = summarizeExplainability(explanations)
      expect(summary.confirmedCount).toBe(1)
      expect(summary.unconfirmedCount).toBe(1)
    })

    it('should count used in prompt', () => {
      const atoms = [
        createAtom({ id: 'atom-1' }),
        createAtom({ id: 'atom-2' })
      ]
      const explanations = explainAtoms({ atoms, usedAtomIds: ['atom-1'] })
      const summary = summarizeExplainability(explanations)
      expect(summary.usedInPromptCount).toBe(1)
    })

    it('should count conflicts', () => {
      const atoms = [
        createAtom({ id: 'atom-1', contradictionOf: ['atom-2'] }),
        createAtom({ id: 'atom-2' })
      ]
      const explanations = explainAtoms({ atoms })
      const summary = summarizeExplainability(explanations)
      expect(summary.conflictCount).toBe(1)
    })

    it('should calculate average quality and economy', () => {
      const atoms = [
        createAtom({ id: 'atom-1' }),
        createAtom({ id: 'atom-2' })
      ]
      const explanations = explainAtoms({ atoms })
      const summary = summarizeExplainability(explanations)
      expect(summary.averageQuality).toBeGreaterThan(0)
      expect(summary.averageEconomy).toBeGreaterThan(0)
    })

    it('should identify top reinforced atoms', () => {
      const atoms = [
        createAtom({
          id: 'atom-1',
          evidence: [
            { id: 'ev-1', source: 'chat', sourceText: 'a', timestamp: '2026-06-01T00:00:00.000Z', confidence: 0.8 },
            { id: 'ev-2', source: 'chat', sourceText: 'b', timestamp: '2026-06-02T00:00:00.000Z', confidence: 0.9 },
            { id: 'ev-3', source: 'chat', sourceText: 'c', timestamp: '2026-06-03T00:00:00.000Z', confidence: 0.7 }
          ]
        }),
        createAtom({ id: 'atom-2' })
      ]
      const explanations = explainAtoms({ atoms })
      const summary = summarizeExplainability(explanations)
      expect(summary.topReinforced.length).toBeGreaterThan(0)
      expect(summary.topReinforced[0].atomId).toBe('atom-1')
      expect(summary.topReinforced[0].count).toBe(3)
    })

    it('should flag atoms needing attention', () => {
      const atoms = [
        createAtom({
          id: 'atom-1',
          lifecycle: 'active',
          evidence: [
            { id: 'ev-1', source: 'chat', sourceText: 'a', timestamp: '2026-06-01T00:00:00.000Z', confidence: 0.8 },
            { id: 'ev-2', source: 'chat', sourceText: 'b', timestamp: '2026-06-02T00:00:00.000Z', confidence: 0.9 },
            { id: 'ev-3', source: 'chat', sourceText: 'c', timestamp: '2026-06-03T00:00:00.000Z', confidence: 0.7 }
          ]
        })
      ]
      const explanations = explainAtoms({ atoms, usedAtomIds: ['atom-1'] })
      const summary = summarizeExplainability(explanations)
      const attentionItem = summary.needsAttention.find(a => a.atomId === 'atom-1' && a.reason.includes('多次强化但未确认'))
      expect(attentionItem).toBeDefined()
    })

    it('should handle empty explanations', () => {
      const summary = summarizeExplainability([])
      expect(summary.totalAtoms).toBe(0)
      expect(summary.averageQuality).toBe(0)
      expect(summary.averageEconomy).toBe(0)
    })
  })
})
