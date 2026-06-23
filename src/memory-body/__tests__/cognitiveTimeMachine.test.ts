import { describe, expect, it } from 'vitest'
import {
  createSnapshot,
  getSnapshot,
  compareSnapshots,
  rollbackToSnapshot,
  traceMisunderstanding,
  type CognitiveSnapshot
} from '../timeMachine/cognitiveTimeMachine'
import type { MemoryAtom, MemoryBodyState } from '../core/memoryBodyTypes'

function createTestAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: 'test-1',
    scope: { userId: 'user-1', projectId: 'project-1' },
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
    evidence: [
      { id: 'ev-1', source: 'chat', sourceText: '我喜欢咖啡', timestamp: new Date().toISOString(), confidence: 0.8 }
    ],
    tags: ['food', 'preference'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    accessCount: 5,
    contradictionOf: [],
    ...overrides
  }
}

function createTestState(overrides: Partial<MemoryBodyState> = {}): MemoryBodyState {
  return {
    userId: 'user-1',
    projectId: 'project-1',
    version: 1,
    atoms: [createTestAtom()],
    entities: [],
    relations: [],
    beliefs: [],
    meta: {
      cognitiveProfileVersion: 1,
      lastUpdated: new Date().toISOString()
    },
    ...overrides
  }
}

describe('CognitiveTimeMachine', () => {
  describe('createSnapshot', () => {
    it('should create a snapshot from current state', () => {
      const state = createTestState()
      const snapshot = createSnapshot(state, '初始状态快照')

      expect(snapshot.id).toBeDefined()
      expect(snapshot.label).toBe('初始状态快照')
      expect(snapshot.state).toEqual(state)
      expect(snapshot.timestamp).toBeDefined()
      expect(snapshot.atomCount).toBe(1)
    })

    it('should create snapshots with unique IDs', () => {
      const state = createTestState()
      const s1 = createSnapshot(state, '快照1')
      const s2 = createSnapshot(state, '快照2')

      expect(s1.id).not.toBe(s2.id)
    })

    it('should record correct atom count', () => {
      const state = createTestState({
        atoms: [createTestAtom({ id: 'a1' }), createTestAtom({ id: 'a2' }), createTestAtom({ id: 'a3' })]
      })
      const snapshot = createSnapshot(state, '三个原子')

      expect(snapshot.atomCount).toBe(3)
    })
  })

  describe('getSnapshot', () => {
    it('should retrieve a stored snapshot by ID', () => {
      const state = createTestState()
      const created = createSnapshot(state, '测试快照')

      const retrieved = getSnapshot(created.id)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(created.id)
      expect(retrieved!.label).toBe('测试快照')
    })

    it('should return null for unknown snapshot ID', () => {
      const retrieved = getSnapshot('nonexistent-id')
      expect(retrieved).toBeNull()
    })
  })

  describe('compareSnapshots', () => {
    it('should detect added atoms between two snapshots', () => {
      const oldState = createTestState({
        atoms: [createTestAtom({ id: 'a1', content: '旧记忆' })]
      })
      const newState = createTestState({
        atoms: [
          createTestAtom({ id: 'a1', content: '旧记忆' }),
          createTestAtom({ id: 'a2', content: '新记忆' })
        ]
      })

      const oldSnapshot = createSnapshot(oldState, '旧快照')
      const newSnapshot = createSnapshot(newState, '新快照')

      const diff = compareSnapshots(oldSnapshot, newSnapshot)

      expect(diff.addedAtoms).toHaveLength(1)
      expect(diff.addedAtoms[0].id).toBe('a2')
      expect(diff.removedAtoms).toHaveLength(0)
      expect(diff.modifiedAtoms).toHaveLength(0)
    })

    it('should detect removed atoms between two snapshots', () => {
      const oldState = createTestState({
        atoms: [
          createTestAtom({ id: 'a1', content: '记忆1' }),
          createTestAtom({ id: 'a2', content: '记忆2' })
        ]
      })
      const newState = createTestState({
        atoms: [createTestAtom({ id: 'a1', content: '记忆1' })]
      })

      const oldSnapshot = createSnapshot(oldState, '旧快照')
      const newSnapshot = createSnapshot(newState, '新快照')

      const diff = compareSnapshots(oldSnapshot, newSnapshot)

      expect(diff.removedAtoms).toHaveLength(1)
      expect(diff.removedAtoms[0].id).toBe('a2')
      expect(diff.addedAtoms).toHaveLength(0)
    })

    it('should detect modified atoms between two snapshots', () => {
      const oldState = createTestState({
        atoms: [createTestAtom({ id: 'a1', content: '用户喜欢茶', lifecycle: 'active' })]
      })
      const newState = createTestState({
        atoms: [createTestAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed' })]
      })

      const oldSnapshot = createSnapshot(oldState, '旧快照')
      const newSnapshot = createSnapshot(newState, '新快照')

      const diff = compareSnapshots(oldSnapshot, newSnapshot)

      expect(diff.modifiedAtoms).toHaveLength(1)
      expect(diff.modifiedAtoms[0].atomId).toBe('a1')
      expect(diff.modifiedAtoms[0].changes).toContain('content')
      expect(diff.modifiedAtoms[0].changes).toContain('lifecycle')
    })

    it('should detect all three types of changes simultaneously', () => {
      const oldState = createTestState({
        atoms: [
          createTestAtom({ id: 'a1', content: '保持不变' }),
          createTestAtom({ id: 'a2', content: '被删除' }),
          createTestAtom({ id: 'a3', content: '旧内容' })
        ]
      })
      const newState = createTestState({
        atoms: [
          createTestAtom({ id: 'a1', content: '保持不变' }),
          createTestAtom({ id: 'a3', content: '新内容' }),
          createTestAtom({ id: 'a4', content: '新增' })
        ]
      })

      const oldSnapshot = createSnapshot(oldState, '旧快照')
      const newSnapshot = createSnapshot(newState, '新快照')

      const diff = compareSnapshots(oldSnapshot, newSnapshot)

      expect(diff.addedAtoms).toHaveLength(1)
      expect(diff.addedAtoms[0].id).toBe('a4')
      expect(diff.removedAtoms).toHaveLength(1)
      expect(diff.removedAtoms[0].id).toBe('a2')
      expect(diff.modifiedAtoms).toHaveLength(1)
      expect(diff.modifiedAtoms[0].atomId).toBe('a3')
    })

    it('should return summary text describing the diff', () => {
      const oldState = createTestState({
        atoms: [createTestAtom({ id: 'a1', content: '旧' })]
      })
      const newState = createTestState({
        atoms: [createTestAtom({ id: 'a1', content: '新' }), createTestAtom({ id: 'a2', content: '新增' })]
      })

      const oldSnapshot = createSnapshot(oldState, '旧')
      const newSnapshot = createSnapshot(newState, '新')

      const diff = compareSnapshots(oldSnapshot, newSnapshot)

      expect(diff.summary).toBeDefined()
      expect(diff.summary).toContain('新增')
      expect(diff.summary).toContain('修改')
    })
  })

  describe('rollbackToSnapshot', () => {
    it('should restore state from a snapshot', () => {
      const originalState = createTestState({
        atoms: [createTestAtom({ id: 'a1', content: '原始记忆' })]
      })
      const snapshot = createSnapshot(originalState, '备份')

      const currentState = createTestState({
        atoms: [createTestAtom({ id: 'a1', content: '被修改的记忆' })]
      })

      const restored = rollbackToSnapshot(currentState, snapshot)

      expect(restored.state.atoms).toHaveLength(1)
      expect(restored.state.atoms[0].content).toBe('原始记忆')
    })

    it('should create a rollback audit record', () => {
      const originalState = createTestState({
        atoms: [createTestAtom({ id: 'a1', content: '原始' })]
      })
      const snapshot = createSnapshot(originalState, '备份')

      const currentState = createTestState({
        atoms: [createTestAtom({ id: 'a1', content: '修改后' })]
      })

      const result = rollbackToSnapshot(currentState, snapshot)

      expect(result.auditRecord).toBeDefined()
      expect(result.auditRecord!.action).toBe('rollback')
      expect(result.auditRecord!.snapshotId).toBe(snapshot.id)
    })
  })

  describe('traceMisunderstanding', () => {
    it('should trace how a misunderstanding occurred through snapshots', () => {
      const snapshots: CognitiveSnapshot[] = [
        createSnapshot(createTestState({
          atoms: [createTestAtom({ id: 'a1', content: '用户喜欢茶', lifecycle: 'draft', confidence: 0.5 })]
        }), '初始推断'),
        createSnapshot(createTestState({
          atoms: [createTestAtom({ id: 'a1', content: '用户喜欢茶', lifecycle: 'active', confidence: 0.7 })]
        }), '置信度提升'),
        createSnapshot(createTestState({
          atoms: [createTestAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'corrected', confidence: 0.9 })]
        }), '用户纠正')
      ]

      const trace = traceMisunderstanding('a1', snapshots)

      expect(trace.atomId).toBe('a1')
      expect(trace.timeline).toHaveLength(3)
      expect(trace.timeline[0].content).toBe('用户喜欢茶')
      expect(trace.timeline[0].lifecycle).toBe('draft')
      expect(trace.timeline[1].lifecycle).toBe('active')
      expect(trace.timeline[2].content).toBe('用户喜欢咖啡')
      expect(trace.timeline[2].lifecycle).toBe('corrected')
    })

    it('should return empty timeline for unknown atom', () => {
      const snapshots: CognitiveSnapshot[] = [
        createSnapshot(createTestState({
          atoms: [createTestAtom({ id: 'a1', content: '记忆' })]
        }), '快照')
      ]

      const trace = traceMisunderstanding('unknown-id', snapshots)

      expect(trace.atomId).toBe('unknown-id')
      expect(trace.timeline).toHaveLength(0)
    })

    it('should identify the correction point in the timeline', () => {
      const snapshots: CognitiveSnapshot[] = [
        createSnapshot(createTestState({
          atoms: [createTestAtom({ id: 'a1', content: '错误', lifecycle: 'active' })]
        }), '错误状态'),
        createSnapshot(createTestState({
          atoms: [createTestAtom({ id: 'a1', content: '正确', lifecycle: 'corrected' })]
        }), '已纠正')
      ]

      const trace = traceMisunderstanding('a1', snapshots)

      expect(trace.correctionPoint).toBeDefined()
      expect(trace.correctionPoint!.snapshotLabel).toBe('已纠正')
      expect(trace.correctionPoint!.fromContent).toBe('错误')
      expect(trace.correctionPoint!.toContent).toBe('正确')
    })
  })
})
