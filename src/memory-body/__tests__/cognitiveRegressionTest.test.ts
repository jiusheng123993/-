import { describe, expect, it } from 'vitest'
import {
  createRegressionTestSuite,
  runRegressionTest,
  runRegressionTestSuite,
  validateCognitiveConsistency,
  REGRESSION_TEST_CASES
} from '../regression/cognitiveRegressionTest'
import { createSnapshot } from '../timeMachine/cognitiveTimeMachine'
import type { MemoryAtom, MemoryBodyState, MemoryScenario } from '../core/memoryBodyTypes'

function createAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
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
    scenarios: ['chat', 'general'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    accessCount: 5,
    contradictionOf: [],
    ...overrides
  }
}

function createState(overrides: Partial<MemoryBodyState> = {}): MemoryBodyState {
  return {
    userId: 'user-1',
    projectId: 'project-1',
    version: 1,
    atoms: [createAtom()],
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

const chatScenarios: MemoryScenario[] = ['chat', 'general']

describe('CognitiveRegressionTest', () => {
  describe('REGRESSION_TEST_CASES', () => {
    it('should define all 5 regression test cases', () => {
      expect(REGRESSION_TEST_CASES).toHaveLength(5)
    })

    it('should have unique IDs for all test cases', () => {
      const ids = REGRESSION_TEST_CASES.map(tc => tc.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('should cover all 5 regression categories', () => {
      const categories = new Set(REGRESSION_TEST_CASES.map(tc => tc.category))
      expect(categories.size).toBe(5)
      expect(categories.has('correction_cleanup')).toBe(true)
      expect(categories.has('preference_persistence')).toBe(true)
      expect(categories.has('forget_cleanup')).toBe(true)
      expect(categories.has('rule_priority')).toBe(true)
      expect(categories.has('emotion_stability')).toBe(true)
    })
  })

  describe('createRegressionTestSuite', () => {
    it('should create a suite with all test cases', () => {
      const suite = createRegressionTestSuite('认知回归测试套件')

      expect(suite.name).toBe('认知回归测试套件')
      expect(suite.testCases).toHaveLength(5)
      expect(suite.results).toHaveLength(0)
      expect(suite.summary.total).toBe(0)
      expect(suite.summary.passed).toBe(0)
      expect(suite.summary.failed).toBe(0)
    })
  })

  describe('runRegressionTest - correction_cleanup', () => {
    it('should pass when corrected atom replaces old content in prompt', () => {
      const stateBefore = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢西瓜', object: '西瓜', lifecycle: 'active' })
        ]
      })
      const stateAfter = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢芒果', object: '芒果', lifecycle: 'corrected' })
        ]
      })

      const result = runRegressionTest(
        REGRESSION_TEST_CASES[0],
        stateBefore,
        stateAfter,
        chatScenarios
      )

      expect(result.passed).toBe(true)
      expect(result.testCase.category).toBe('correction_cleanup')
      expect(result.evidence.snapshots).toHaveLength(2)
      expect(result.evidence.diffs).toHaveLength(1)
      expect(result.evidence.promptResults).toHaveLength(2)
    })

    it('should fail when no corrected atoms exist', () => {
      const stateBefore = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢西瓜', lifecycle: 'active' })
        ]
      })
      const stateAfter = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢西瓜', lifecycle: 'active' })
        ]
      })

      const result = runRegressionTest(
        REGRESSION_TEST_CASES[0],
        stateBefore,
        stateAfter,
        chatScenarios
      )

      expect(result.passed).toBe(false)
    })
  })

  describe('runRegressionTest - preference_persistence', () => {
    it('should pass when confirmed preference persists in prompt', () => {
      const stateBefore = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户要求完整方案', lifecycle: 'confirmed', type: 'preference' })
        ]
      })
      const stateAfter = createState({
        atoms: [
          createAtom({
            id: 'a1',
            content: '用户要求完整方案',
            lifecycle: 'stable',
            type: 'preference',
            evidence: [
              { id: 'ev-1', source: 'chat', sourceText: '我要完整方案', timestamp: new Date().toISOString(), confidence: 0.9 },
              { id: 'ev-2', source: 'chat', sourceText: '不要简化版', timestamp: new Date().toISOString(), confidence: 0.9 },
              { id: 'ev-3', source: 'chat', sourceText: '完整方案更好', timestamp: new Date().toISOString(), confidence: 0.9 }
            ]
          })
        ]
      })

      const result = runRegressionTest(
        REGRESSION_TEST_CASES[1],
        stateBefore,
        stateAfter,
        chatScenarios
      )

      expect(result.passed).toBe(true)
      expect(result.testCase.category).toBe('preference_persistence')
    })

    it('should fail when no confirmed or stable atoms exist', () => {
      const stateBefore = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户要求完整方案', lifecycle: 'draft' })
        ]
      })
      const stateAfter = createState({
        atoms: [
          createAtom({ id: 'a1', content: '简化 MVP', lifecycle: 'draft' })
        ]
      })

      const result = runRegressionTest(
        REGRESSION_TEST_CASES[1],
        stateBefore,
        stateAfter,
        chatScenarios
      )

      expect(result.passed).toBe(false)
    })
  })

  describe('runRegressionTest - forget_cleanup', () => {
    it('should pass when forbidden atoms are excluded from prompt', () => {
      const stateBefore = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'active' })
        ]
      })
      const stateAfter = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'forbidden' })
        ]
      })

      const result = runRegressionTest(
        REGRESSION_TEST_CASES[2],
        stateBefore,
        stateAfter,
        chatScenarios
      )

      expect(result.passed).toBe(true)
      expect(result.testCase.category).toBe('forget_cleanup')
    })

    it('should fail when no forbidden atoms exist', () => {
      const stateBefore = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'active' })
        ]
      })
      const stateAfter = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'active' })
        ]
      })

      const result = runRegressionTest(
        REGRESSION_TEST_CASES[2],
        stateBefore,
        stateAfter,
        chatScenarios
      )

      expect(result.passed).toBe(false)
    })
  })

  describe('runRegressionTest - rule_priority', () => {
    it('should pass when rule atoms appear in prompt', () => {
      const stateBefore = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', type: 'preference', lifecycle: 'active' })
        ]
      })
      const stateAfter = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', type: 'preference', lifecycle: 'active' }),
          createAtom({ id: 'a2', content: '所有代码必须通过 lint 检查', type: 'rule', layer: 'rule', lifecycle: 'active' })
        ]
      })

      const result = runRegressionTest(
        REGRESSION_TEST_CASES[3],
        stateBefore,
        stateAfter,
        chatScenarios
      )

      expect(result.passed).toBe(true)
      expect(result.testCase.category).toBe('rule_priority')
    })

    it('should pass when rule atoms override preference atoms', () => {
      const stateBefore = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢快速开发', type: 'preference', lifecycle: 'active' })
        ]
      })
      const stateAfter = createState({
        atoms: [
          createAtom({ id: 'a1', content: '所有代码必须通过 lint 检查', type: 'rule', layer: 'rule', lifecycle: 'active' })
        ]
      })

      const result = runRegressionTest(
        REGRESSION_TEST_CASES[3],
        stateBefore,
        stateAfter,
        chatScenarios
      )

      expect(result.passed).toBe(true)
    })

    it('should fail when no rule atoms exist', () => {
      const stateBefore = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', type: 'preference', lifecycle: 'active' })
        ]
      })
      const stateAfter = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', type: 'preference', lifecycle: 'active' })
        ]
      })

      const result = runRegressionTest(
        REGRESSION_TEST_CASES[3],
        stateBefore,
        stateAfter,
        chatScenarios
      )

      expect(result.passed).toBe(false)
    })
  })

  describe('runRegressionTest - emotion_stability', () => {
    it('should pass when emotional atoms remain stable', () => {
      const stateBefore = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户今天心情好', type: 'emotion', layer: 'emotional', lifecycle: 'draft' })
        ]
      })
      const stateAfter = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户今天心情好', type: 'emotion', layer: 'emotional', lifecycle: 'draft' })
        ]
      })

      const result = runRegressionTest(
        REGRESSION_TEST_CASES[4],
        stateBefore,
        stateAfter,
        chatScenarios
      )

      expect(result.passed).toBe(true)
      expect(result.testCase.category).toBe('emotion_stability')
    })

    it('should pass when no emotional atoms exist', () => {
      const stateBefore = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', type: 'preference', lifecycle: 'active' })
        ]
      })
      const stateAfter = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', type: 'preference', lifecycle: 'active' })
        ]
      })

      const result = runRegressionTest(
        REGRESSION_TEST_CASES[4],
        stateBefore,
        stateAfter,
        chatScenarios
      )

      expect(result.passed).toBe(true)
    })

    it('should fail when temporary emotion upgrades to stable', () => {
      const stateBefore = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户今天心情好', type: 'emotion', layer: 'emotional', lifecycle: 'draft' })
        ]
      })
      const stateAfter = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户今天心情好', type: 'emotion', layer: 'emotional', lifecycle: 'stable' })
        ]
      })

      const result = runRegressionTest(
        REGRESSION_TEST_CASES[4],
        stateBefore,
        stateAfter,
        chatScenarios
      )

      expect(result.passed).toBe(false)
    })
  })

  describe('runRegressionTestSuite', () => {
    it('should run all test cases and compute summary', () => {
      const suite = createRegressionTestSuite('完整回归测试')

      const stateBefore = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢西瓜', object: '西瓜', lifecycle: 'active' }),
          createAtom({ id: 'a2', content: '用户要求完整方案', lifecycle: 'confirmed', type: 'preference' }),
          createAtom({ id: 'a3', content: '用户喜欢咖啡', lifecycle: 'active' }),
          createAtom({ id: 'a4', content: '用户喜欢快速开发', type: 'preference', lifecycle: 'active' }),
          createAtom({ id: 'a5', content: '用户今天心情好', type: 'emotion', layer: 'emotional', lifecycle: 'draft' })
        ]
      })

      const stateAfter = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢芒果', object: '芒果', lifecycle: 'corrected' }),
          createAtom({ id: 'a2', content: '用户要求完整方案', lifecycle: 'stable', type: 'preference' }),
          createAtom({ id: 'a3', content: '用户喜欢咖啡', lifecycle: 'forbidden' }),
          createAtom({ id: 'a4', content: '所有代码必须通过 lint 检查', type: 'rule', layer: 'rule', lifecycle: 'active' }),
          createAtom({ id: 'a5', content: '用户今天心情好', type: 'emotion', layer: 'emotional', lifecycle: 'draft' })
        ]
      })

      const result = runRegressionTestSuite(suite, stateBefore, stateAfter, chatScenarios)

      expect(result.results).toHaveLength(5)
      expect(result.summary.total).toBe(5)
      expect(result.summary.passed).toBeGreaterThanOrEqual(0)
      expect(result.summary.failed).toBeGreaterThanOrEqual(0)
      expect(result.summary.passed + result.summary.failed).toBe(5)
    })
  })

  describe('validateCognitiveConsistency', () => {
    it('should return consistent for single snapshot', () => {
      const state = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'active' })
        ]
      })
      const snapshot = createSnapshot(state, '单快照')

      const result = validateCognitiveConsistency([snapshot], chatScenarios)

      expect(result.consistent).toBe(true)
      expect(result.issues).toHaveLength(0)
      expect(result.timeline).toHaveLength(0)
    })

    it('should detect removal of confirmed atoms across snapshots', () => {
      const state1 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed' })
        ]
      })
      const state2 = createState({
        atoms: [
          createAtom({ id: 'a2', content: '用户喜欢茶', lifecycle: 'active' })
        ]
      })

      const snapshots = [
        createSnapshot(state1, '快照1'),
        createSnapshot(state2, '快照2')
      ]

      const result = validateCognitiveConsistency(snapshots, chatScenarios)

      expect(result.consistent).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues[0]).toContain('已确认/稳定的记忆')
    })

    it('should detect downgrade of confirmed atoms to draft', () => {
      const state1 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed' })
        ]
      })
      const state2 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'draft' })
        ]
      })

      const snapshots = [
        createSnapshot(state1, '快照1'),
        createSnapshot(state2, '快照2')
      ]

      const result = validateCognitiveConsistency(snapshots, chatScenarios)

      expect(result.consistent).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues[0]).toContain('降级为 draft')
    })

    it('should return consistent for stable evolution', () => {
      const state1 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'active' })
        ]
      })
      const state2 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed' })
        ]
      })

      const snapshots = [
        createSnapshot(state1, '快照1'),
        createSnapshot(state2, '快照2')
      ]

      const result = validateCognitiveConsistency(snapshots, chatScenarios)

      expect(result.consistent).toBe(true)
    })

    it('should build timeline for multiple snapshots', () => {
      const state1 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'draft' })
        ]
      })
      const state2 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'active' })
        ]
      })
      const state3 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed' })
        ]
      })

      const snapshots = [
        createSnapshot(state1, '初始'),
        createSnapshot(state2, '激活'),
        createSnapshot(state3, '确认')
      ]

      const result = validateCognitiveConsistency(snapshots, chatScenarios)

      expect(result.consistent).toBe(true)
      expect(result.timeline).toHaveLength(3)
      expect(result.timeline[0].snapshotLabel).toBe('初始')
      expect(result.timeline[1].snapshotLabel).toBe('激活')
      expect(result.timeline[2].snapshotLabel).toBe('确认')
    })
  })
})
