import { describe, it, expect } from 'vitest'
import {
  generateCognitiveDiff,
  generateCognitiveDiffFromSnapshotDiff,
  formatCognitiveDiffForUser
} from '../diff/cognitiveDiff'
import type { CognitiveDiffSummary } from '../diff/cognitiveDiff'
import type { CognitiveSnapshot } from '../timeMachine/cognitiveTimeMachine'
import type { MemoryAtom, MemoryBodyState } from '../core/memoryBodyTypes'
import type { ReflectionResult } from '../reflection/reflectionEngine'

function makeAtom(overrides: Partial<MemoryAtom> & { id: string }): MemoryAtom {
  return {
    scope: { userId: 'u1', projectId: 'p1' },
    layer: 'semantic',
    type: 'preference',
    subject: 'user',
    predicate: 'likes',
    object: 'coffee',
    content: '用户喜欢咖啡',
    source: 'chat',
    confidence: 0.8,
    strength: 0.7,
    emotionalWeight: 0.3,
    sensitivity: 'personal',
    lifecycle: 'active',
    evidence: [],
    tags: [],
    scenarios: ['chat'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    lastAccessedAt: '2026-01-01T00:00:00.000Z',
    accessCount: 1,
    contradictionOf: [],
    ...overrides
  }
}

function makeState(atoms: MemoryAtom[]): MemoryBodyState {
  return {
    version: 1,
    atoms,
    entities: [],
    relations: [],
    beliefs: [],
    meta: {
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      totalInteractions: 0,
      totalCorrections: 0,
      maturityLevel: 1
    }
  }
}

function makeSnapshot(id: string, label: string, atoms: MemoryAtom[]): CognitiveSnapshot {
  return {
    id,
    label,
    timestamp: new Date().toISOString(),
    state: makeState(atoms),
    atomCount: atoms.length
  }
}

describe('generateCognitiveDiff', () => {
  it('detects new understanding', () => {
    const prev = makeSnapshot('s1', 'before', [])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', content: '用户喜欢咖啡' })
    ])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    expect(result.changes).toHaveLength(1)
    expect(result.changes[0].type).toBe('new_understanding')
    expect(result.changes[0].atomContent).toBe('用户喜欢咖啡')
    expect(result.counts.new_understanding).toBe(1)
    expect(result.totalChanges).toBe(1)
  })

  it('detects strengthened understanding', () => {
    const prev = makeSnapshot('s1', 'before', [
      makeAtom({ id: 'a1', lifecycle: 'active', confidence: 0.6 })
    ])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', lifecycle: 'confirmed', confidence: 0.9 })
    ])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    expect(result.changes).toHaveLength(1)
    expect(result.changes[0].type).toBe('strengthened_understanding')
    expect(result.counts.strengthened_understanding).toBe(1)
  })

  it('detects weakened confidence', () => {
    const prev = makeSnapshot('s1', 'before', [
      makeAtom({ id: 'a1', confidence: 0.9 })
    ])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', confidence: 0.5 })
    ])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    expect(result.changes).toHaveLength(1)
    expect(result.changes[0].type).toBe('weakened_confidence')
    expect(result.counts.weakened_confidence).toBe(1)
  })

  it('does not flag tiny confidence drops as weakened', () => {
    const prev = makeSnapshot('s1', 'before', [
      makeAtom({ id: 'a1', confidence: 0.9 })
    ])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', confidence: 0.88 })
    ])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    expect(result.changes.filter(c => c.type === 'weakened_confidence')).toHaveLength(0)
  })

  it('detects archived understanding', () => {
    const prev = makeSnapshot('s1', 'before', [
      makeAtom({ id: 'a1', lifecycle: 'active' })
    ])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', lifecycle: 'archived' })
    ])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    expect(result.changes).toHaveLength(1)
    expect(result.changes[0].type).toBe('archived_understanding')
    expect(result.counts.archived_understanding).toBe(1)
  })

  it('detects needs confirmation for draft atoms', () => {
    const prev = makeSnapshot('s1', 'before', [])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', lifecycle: 'draft', confidence: 0.3 })
    ])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    const confirmChanges = result.changes.filter(c => c.type === 'needs_confirmation')
    expect(confirmChanges).toHaveLength(1)
    expect(result.counts.needs_confirmation).toBe(1)
  })

  it('detects needs confirmation for low-confidence active atoms', () => {
    const prev = makeSnapshot('s1', 'before', [
      makeAtom({ id: 'a1', lifecycle: 'active', confidence: 0.3 })
    ])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', lifecycle: 'active', confidence: 0.3 })
    ])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    const confirmChanges = result.changes.filter(c => c.type === 'needs_confirmation')
    expect(confirmChanges).toHaveLength(1)
  })

  it('does not flag high-confidence active atoms as needs confirmation', () => {
    const prev = makeSnapshot('s1', 'before', [
      makeAtom({ id: 'a1', lifecycle: 'active', confidence: 0.8 })
    ])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', lifecycle: 'active', confidence: 0.8 })
    ])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    const confirmChanges = result.changes.filter(c => c.type === 'needs_confirmation')
    expect(confirmChanges).toHaveLength(0)
  })

  it('detects trust repair triggered from reflection result', () => {
    const prev = makeSnapshot('s1', 'before', [
      makeAtom({ id: 'a1', content: '用户喜欢咖啡' })
    ])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', content: '用户喜欢咖啡' })
    ])

    const reflectionResult: ReflectionResult = {
      changes: [],
      conflicts: [],
      insights: [
        {
          type: 'risk',
          description: '可能存在误解',
          relatedAtomIds: ['a1'],
          confidence: 0.7
        }
      ],
      summary: 'test',
      confidence: 0.8,
      generatedAt: new Date().toISOString()
    }

    const result = generateCognitiveDiff({
      previousSnapshot: prev,
      currentSnapshot: curr,
      reflectionResult
    })

    const trustChanges = result.changes.filter(c => c.type === 'trust_repair_triggered')
    expect(trustChanges).toHaveLength(1)
    expect(result.counts.trust_repair_triggered).toBe(1)
  })

  it('handles empty snapshots', () => {
    const prev = makeSnapshot('s1', 'before', [])
    const curr = makeSnapshot('s2', 'after', [])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    expect(result.changes).toHaveLength(0)
    expect(result.totalChanges).toBe(0)
    expect(result.highlights).toEqual(['本次会话无显著认知变化'])
  })

  it('generates correct counts for mixed changes', () => {
    const prev = makeSnapshot('s1', 'before', [
      makeAtom({ id: 'a1', lifecycle: 'active', confidence: 0.6 }),
      makeAtom({ id: 'a2', lifecycle: 'active', confidence: 0.9 })
    ])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', lifecycle: 'confirmed', confidence: 0.9 }),
      makeAtom({ id: 'a2', lifecycle: 'archived' }),
      makeAtom({ id: 'a3', content: '新偏好', lifecycle: 'active', confidence: 0.7 })
    ])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    expect(result.counts.new_understanding).toBe(1)
    expect(result.counts.strengthened_understanding).toBe(1)
    expect(result.counts.archived_understanding).toBe(1)
    expect(result.totalChanges).toBe(3)
  })

  it('sets needsUserAttention when important or critical changes exist', () => {
    const prev = makeSnapshot('s1', 'before', [])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', lifecycle: 'draft', confidence: 0.3 })
    ])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    expect(result.needsUserAttention).toBe(true)
    expect(result.attentionItems.length).toBeGreaterThan(0)
  })

  it('sets needsUserAttention false when no important changes', () => {
    const prev = makeSnapshot('s1', 'before', [])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', lifecycle: 'active', confidence: 0.8 })
    ])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    expect(result.needsUserAttention).toBe(false)
  })

  it('uses custom session label', () => {
    const prev = makeSnapshot('s1', 'before', [])
    const curr = makeSnapshot('s2', 'after', [])

    const result = generateCognitiveDiff({
      previousSnapshot: prev,
      currentSnapshot: curr,
      sessionLabel: '测试会话'
    })

    expect(result.sessionLabel).toBe('测试会话')
  })

  it('generates highlights for all change types', () => {
    const prev = makeSnapshot('s1', 'before', [])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', content: '新', lifecycle: 'active', confidence: 0.8 }),
      makeAtom({ id: 'a2', content: '草稿', lifecycle: 'draft', confidence: 0.3 })
    ])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    expect(result.highlights).toContain('新增 1 条理解')
    expect(result.highlights).toContain('1 条理解需要用户确认')
  })

  it('marks weakened_confidence as important when delta > 0.3', () => {
    const prev = makeSnapshot('s1', 'before', [
      makeAtom({ id: 'a1', confidence: 0.9 })
    ])
    const curr = makeSnapshot('s2', 'after', [
      makeAtom({ id: 'a1', confidence: 0.4 })
    ])

    const result = generateCognitiveDiff({ previousSnapshot: prev, currentSnapshot: curr })

    expect(result.changes[0].severity).toBe('important')
  })
})

describe('generateCognitiveDiffFromSnapshotDiff', () => {
  it('converts added atoms to new_understanding', () => {
    const atom = makeAtom({ id: 'a1', content: '新记忆' })
    const snapshotDiff = {
      addedAtoms: [atom],
      removedAtoms: [],
      modifiedAtoms: [],
      summary: '新增 1 条记忆',
      oldSnapshotId: 's1',
      newSnapshotId: 's2'
    }

    const result = generateCognitiveDiffFromSnapshotDiff(snapshotDiff)

    expect(result.changes).toHaveLength(1)
    expect(result.changes[0].type).toBe('new_understanding')
    expect(result.counts.new_understanding).toBe(1)
  })

  it('converts removed atoms to archived_understanding', () => {
    const atom = makeAtom({ id: 'a1', content: '旧记忆' })
    const snapshotDiff = {
      addedAtoms: [],
      removedAtoms: [atom],
      modifiedAtoms: [],
      summary: '移除 1 条记忆',
      oldSnapshotId: 's1',
      newSnapshotId: 's2'
    }

    const result = generateCognitiveDiffFromSnapshotDiff(snapshotDiff)

    expect(result.changes).toHaveLength(1)
    expect(result.changes[0].type).toBe('archived_understanding')
    expect(result.counts.archived_understanding).toBe(1)
  })

  it('converts strengthened modified atoms', () => {
    const oldAtom = makeAtom({ id: 'a1', lifecycle: 'active', confidence: 0.6 })
    const newAtom = makeAtom({ id: 'a1', lifecycle: 'confirmed', confidence: 0.9 })
    const snapshotDiff = {
      addedAtoms: [],
      removedAtoms: [],
      modifiedAtoms: [
        { atomId: 'a1', changes: ['lifecycle'], oldAtom, newAtom }
      ],
      summary: '修改 1 条记忆',
      oldSnapshotId: 's1',
      newSnapshotId: 's2'
    }

    const result = generateCognitiveDiffFromSnapshotDiff(snapshotDiff)

    expect(result.changes).toHaveLength(1)
    expect(result.changes[0].type).toBe('strengthened_understanding')
  })

  it('converts confidence drop modified atoms', () => {
    const oldAtom = makeAtom({ id: 'a1', lifecycle: 'active', confidence: 0.9 })
    const newAtom = makeAtom({ id: 'a1', lifecycle: 'active', confidence: 0.5 })
    const snapshotDiff = {
      addedAtoms: [],
      removedAtoms: [],
      modifiedAtoms: [
        { atomId: 'a1', changes: ['confidence'], oldAtom, newAtom }
      ],
      summary: '修改 1 条记忆',
      oldSnapshotId: 's1',
      newSnapshotId: 's2'
    }

    const result = generateCognitiveDiffFromSnapshotDiff(snapshotDiff)

    expect(result.changes).toHaveLength(1)
    expect(result.changes[0].type).toBe('weakened_confidence')
  })

  it('handles empty diff', () => {
    const snapshotDiff = {
      addedAtoms: [],
      removedAtoms: [],
      modifiedAtoms: [],
      summary: '无变化',
      oldSnapshotId: 's1',
      newSnapshotId: 's2'
    }

    const result = generateCognitiveDiffFromSnapshotDiff(snapshotDiff)

    expect(result.changes).toHaveLength(0)
    expect(result.totalChanges).toBe(0)
  })

  it('includes trust repair from reflection result', () => {
    const snapshotDiff = {
      addedAtoms: [],
      removedAtoms: [],
      modifiedAtoms: [],
      summary: '无变化',
      oldSnapshotId: 's1',
      newSnapshotId: 's2'
    }

    const reflectionResult: ReflectionResult = {
      changes: [],
      conflicts: [],
      insights: [
        {
          type: 'risk',
          description: '风险发现',
          relatedAtomIds: ['a1'],
          confidence: 0.8
        }
      ],
      summary: 'test',
      confidence: 0.7,
      generatedAt: new Date().toISOString()
    }

    const result = generateCognitiveDiffFromSnapshotDiff(snapshotDiff, 'test', reflectionResult)

    expect(result.changes).toHaveLength(1)
    expect(result.changes[0].type).toBe('trust_repair_triggered')
  })
})

describe('formatCognitiveDiffForUser', () => {
  it('formats empty summary', () => {
    const summary: CognitiveDiffSummary = {
      sessionLabel: '测试',
      generatedAt: new Date().toISOString(),
      changes: [],
      counts: {
        new_understanding: 0,
        strengthened_understanding: 0,
        weakened_confidence: 0,
        archived_understanding: 0,
        needs_confirmation: 0,
        trust_repair_triggered: 0
      },
      totalChanges: 0,
      highlights: ['本次会话无显著认知变化'],
      needsUserAttention: false,
      attentionItems: []
    }

    const text = formatCognitiveDiffForUser(summary)

    expect(text).toContain('认知变化摘要')
    expect(text).toContain('无显著认知变化')
  })

  it('formats summary with changes', () => {
    const summary: CognitiveDiffSummary = {
      sessionLabel: '测试会话',
      generatedAt: new Date().toISOString(),
      changes: [
        {
          type: 'new_understanding',
          atomId: 'a1',
          atomContent: '用户喜欢咖啡',
          atomType: 'preference',
          currentLifecycle: 'active',
          currentConfidence: 0.8,
          description: '新增理解：用户喜欢咖啡',
          severity: 'notice'
        },
        {
          type: 'needs_confirmation',
          atomId: 'a2',
          atomContent: '用户可能喜欢茶',
          atomType: 'preference',
          currentLifecycle: 'draft',
          currentConfidence: 0.3,
          description: '需要确认：用户可能喜欢茶',
          severity: 'important'
        }
      ],
      counts: {
        new_understanding: 1,
        strengthened_understanding: 0,
        weakened_confidence: 0,
        archived_understanding: 0,
        needs_confirmation: 1,
        trust_repair_triggered: 0
      },
      totalChanges: 2,
      highlights: ['新增 1 条理解', '1 条理解需要用户确认'],
      needsUserAttention: true,
      attentionItems: ['需要确认：用户可能喜欢茶']
    }

    const text = formatCognitiveDiffForUser(summary)

    expect(text).toContain('新增理解：用户喜欢咖啡')
    expect(text).toContain('需要确认：用户可能喜欢茶')
    expect(text).toContain('建议关注')
  })

  it('formats critical changes separately', () => {
    const summary: CognitiveDiffSummary = {
      sessionLabel: '测试',
      generatedAt: new Date().toISOString(),
      changes: [
        {
          type: 'trust_repair_triggered',
          atomId: 'a1',
          atomContent: '用户喜欢咖啡',
          atomType: 'preference',
          currentLifecycle: 'active',
          currentConfidence: 0.8,
          description: '触发信任修复：用户喜欢咖啡',
          severity: 'critical'
        }
      ],
      counts: {
        new_understanding: 0,
        strengthened_understanding: 0,
        weakened_confidence: 0,
        archived_understanding: 0,
        needs_confirmation: 0,
        trust_repair_triggered: 1
      },
      totalChanges: 1,
      highlights: ['1 条理解触发信任修复'],
      needsUserAttention: true,
      attentionItems: ['触发信任修复：用户喜欢咖啡']
    }

    const text = formatCognitiveDiffForUser(summary)

    expect(text).toContain('需要立即关注')
    expect(text).toContain('触发信任修复')
  })
})
