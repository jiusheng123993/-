import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import {
  reflectOnMemoryChanges,
  reflectOnSession,
  summarizeReflection
} from '../reflection/reflectionEngine'

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

describe('ReflectionEngine', () => {
  describe('reflectOnMemoryChanges', () => {
    it('should detect new atoms', () => {
      const previous: MemoryAtom[] = []
      const current = [createAtom({ id: 'atom-1', content: '新记忆' })]
      const result = reflectOnMemoryChanges({ previousAtoms: previous, currentAtoms: current })
      expect(result.changes).toHaveLength(1)
      expect(result.changes[0].changeType).toBe('new')
      expect(result.changes[0].atomId).toBe('atom-1')
    })

    it('should detect strengthened lifecycle', () => {
      const previous = [createAtom({ id: 'atom-1', lifecycle: 'active' })]
      const current = [createAtom({ id: 'atom-1', lifecycle: 'confirmed' })]
      const result = reflectOnMemoryChanges({ previousAtoms: previous, currentAtoms: current })
      const strengthened = result.changes.find(c => c.changeType === 'strengthened' && c.before === 'active')
      expect(strengthened).toBeDefined()
    })

    it('should detect weakened lifecycle', () => {
      const previous = [createAtom({ id: 'atom-1', lifecycle: 'stable' })]
      const current = [createAtom({ id: 'atom-1', lifecycle: 'active' })]
      const result = reflectOnMemoryChanges({ previousAtoms: previous, currentAtoms: current })
      const weakened = result.changes.find(c => c.changeType === 'weakened' && c.before === 'stable')
      expect(weakened).toBeDefined()
    })

    it('should detect archived lifecycle', () => {
      const previous = [createAtom({ id: 'atom-1', lifecycle: 'active' })]
      const current = [createAtom({ id: 'atom-1', lifecycle: 'archived' })]
      const result = reflectOnMemoryChanges({ previousAtoms: previous, currentAtoms: current })
      const archived = result.changes.find(c => c.changeType === 'archived')
      expect(archived).toBeDefined()
    })

    it('should detect corrected lifecycle', () => {
      const previous = [createAtom({ id: 'atom-1', lifecycle: 'active' })]
      const current = [createAtom({ id: 'atom-1', lifecycle: 'contradicted' })]
      const result = reflectOnMemoryChanges({ previousAtoms: previous, currentAtoms: current })
      const corrected = result.changes.find(c => c.changeType === 'corrected')
      expect(corrected).toBeDefined()
    })

    it('should detect significant confidence changes', () => {
      const previous = [createAtom({ id: 'atom-1', confidence: 0.5 })]
      const current = [createAtom({ id: 'atom-1', confidence: 0.8 })]
      const result = reflectOnMemoryChanges({ previousAtoms: previous, currentAtoms: current })
      const confidenceChange = result.changes.find(c => c.before === '0.50' && c.after === '0.80')
      expect(confidenceChange).toBeDefined()
    })

    it('should ignore small confidence changes', () => {
      const previous = [createAtom({ id: 'atom-1', confidence: 0.5 })]
      const current = [createAtom({ id: 'atom-1', confidence: 0.55 })]
      const result = reflectOnMemoryChanges({ previousAtoms: previous, currentAtoms: current })
      const confidenceChanges = result.changes.filter(c => c.before?.includes('0.5'))
      expect(confidenceChanges).toHaveLength(0)
    })

    it('should detect removed atoms', () => {
      const previous = [createAtom({ id: 'atom-1', content: '旧记忆' })]
      const current: MemoryAtom[] = []
      const result = reflectOnMemoryChanges({ previousAtoms: previous, currentAtoms: current })
      const archived = result.changes.find(c => c.changeType === 'archived' && c.atomId === 'atom-1')
      expect(archived).toBeDefined()
    })

    it('should detect conflicts between atoms', () => {
      const atoms = [
        createAtom({ id: 'atom-1', content: '喜欢西瓜', contradictionOf: ['atom-2'] }),
        createAtom({ id: 'atom-2', content: '不喜欢西瓜', contradictionOf: ['atom-1'] })
      ]
      const result = reflectOnMemoryChanges({ previousAtoms: [], currentAtoms: atoms })
      expect(result.conflicts.length).toBeGreaterThan(0)
    })

    it('should classify high severity conflicts', () => {
      const atoms = [
        createAtom({ id: 'atom-1', content: '偏好A', contradictionOf: ['atom-2'], confidence: 0.9 }),
        createAtom({ id: 'atom-2', content: '偏好B', contradictionOf: ['atom-1'], confidence: 0.9 })
      ]
      const result = reflectOnMemoryChanges({ previousAtoms: [], currentAtoms: atoms })
      const highConflict = result.conflicts.find(c => c.severity === 'high')
      expect(highConflict).toBeDefined()
    })

    it('should generate insights for new memories', () => {
      const current = [
        createAtom({ id: 'atom-1' }),
        createAtom({ id: 'atom-2' })
      ]
      const result = reflectOnMemoryChanges({ previousAtoms: [], currentAtoms: current })
      const newInsight = result.insights.find(i => i.type === 'pattern' && i.description.includes('新增'))
      expect(newInsight).toBeDefined()
    })

    it('should generate insights for corrections', () => {
      const previous = [createAtom({ id: 'atom-1', lifecycle: 'active' })]
      const current = [createAtom({ id: 'atom-1', lifecycle: 'contradicted' })]
      const result = reflectOnMemoryChanges({ previousAtoms: previous, currentAtoms: current })
      const correctionInsight = result.insights.find(i => i.type === 'shift' && i.description.includes('纠正'))
      expect(correctionInsight).toBeDefined()
    })

    it('should generate risk insight for high severity conflicts', () => {
      const atoms = [
        createAtom({ id: 'atom-1', contradictionOf: ['atom-2'], confidence: 0.9 }),
        createAtom({ id: 'atom-2', contradictionOf: ['atom-1'], confidence: 0.9 })
      ]
      const result = reflectOnMemoryChanges({ previousAtoms: [], currentAtoms: atoms })
      const riskInsight = result.insights.find(i => i.type === 'risk')
      expect(riskInsight).toBeDefined()
    })

    it('should generate summary string', () => {
      const current = [createAtom({ id: 'atom-1', content: '测试记忆' })]
      const result = reflectOnMemoryChanges({ previousAtoms: [], currentAtoms: current })
      expect(result.summary).toBeTruthy()
      expect(typeof result.summary).toBe('string')
    })

    it('should handle no changes gracefully', () => {
      const atoms = [createAtom({ id: 'atom-1' })]
      const result = reflectOnMemoryChanges({ previousAtoms: atoms, currentAtoms: atoms })
      expect(result.summary).toBe('本次反思未发现显著变化')
    })
  })

  describe('reflectOnSession', () => {
    it('should detect correction events', () => {
      const atoms = [createAtom({ id: 'atom-1' })]
      const sessionEvents = [
        { type: 'correction', description: '用户纠正了偏好', timestamp: '2026-06-24T10:00:00.000Z' }
      ]
      const result = reflectOnSession({ atoms, sessionEvents })
      const correction = result.changes.find(c => c.changeType === 'corrected')
      expect(correction).toBeDefined()
    })

    it('should detect confirmation events', () => {
      const atoms = [createAtom({ id: 'atom-1' })]
      const sessionEvents = [
        { type: 'confirmation', description: '用户确认了记忆', timestamp: '2026-06-24T10:00:00.000Z' }
      ]
      const result = reflectOnSession({ atoms, sessionEvents })
      const confirmation = result.changes.find(c => c.changeType === 'strengthened')
      expect(confirmation).toBeDefined()
    })

    it('should detect new preference events', () => {
      const atoms = [createAtom({ id: 'atom-1' })]
      const sessionEvents = [
        { type: 'new_preference', description: '用户表达了新偏好', timestamp: '2026-06-24T10:00:00.000Z' }
      ]
      const result = reflectOnSession({ atoms, sessionEvents })
      const newPref = result.changes.find(c => c.changeType === 'new')
      expect(newPref).toBeDefined()
    })

    it('should handle empty session events', () => {
      const atoms = [createAtom({ id: 'atom-1' })]
      const result = reflectOnSession({ atoms, sessionEvents: [] })
      expect(result.changes).toHaveLength(0)
      expect(result.summary).toContain('未产生显著认知变化')
    })
  })

  describe('summarizeReflection', () => {
    it('should count changes by type', () => {
      const atoms = [
        createAtom({ id: 'atom-1' }),
        createAtom({ id: 'atom-2' })
      ]
      const result = reflectOnMemoryChanges({ previousAtoms: [], currentAtoms: atoms })
      const summary = summarizeReflection(result)
      expect(summary.totalChanges).toBe(2)
      expect(summary.changeBreakdown['new']).toBe(2)
    })

    it('should count conflicts', () => {
      const atoms = [
        createAtom({ id: 'atom-1', contradictionOf: ['atom-2'], confidence: 0.9 }),
        createAtom({ id: 'atom-2', contradictionOf: ['atom-1'], confidence: 0.9 })
      ]
      const result = reflectOnMemoryChanges({ previousAtoms: [], currentAtoms: atoms })
      const summary = summarizeReflection(result)
      expect(summary.totalConflicts).toBeGreaterThan(0)
      expect(summary.highSeverityConflicts).toBeGreaterThan(0)
    })

    it('should count insights by type', () => {
      const atoms = [
        createAtom({ id: 'atom-1' }),
        createAtom({ id: 'atom-2' })
      ]
      const result = reflectOnMemoryChanges({ previousAtoms: [], currentAtoms: atoms })
      const summary = summarizeReflection(result)
      expect(summary.totalInsights).toBeGreaterThan(0)
      expect(summary.insightTypes['pattern']).toBeGreaterThan(0)
    })

    it('should include overall confidence', () => {
      const atoms = [createAtom({ id: 'atom-1' })]
      const result = reflectOnMemoryChanges({ previousAtoms: [], currentAtoms: atoms })
      const summary = summarizeReflection(result)
      expect(summary.overallConfidence).toBeGreaterThan(0)
    })
  })
})
