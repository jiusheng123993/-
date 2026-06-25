import { describe, expect, it } from 'vitest'
import {
  createAgentIdentity,
  createContinuityCheckpoint,
  buildHandoffContext,
  validateContinuity,
  buildMultiAgentContinuityReport,
  generateContinuityBrief
} from '../continuity/multiAgentContinuity'
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

describe('MultiAgentContinuity', () => {
  describe('createAgentIdentity', () => {
    it('should create an agent identity with required fields', () => {
      const identity = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')

      expect(identity.agentId).toBe('agent-1')
      expect(identity.agentName).toBe('CodeAgent')
      expect(identity.sessionId).toBe('session-001')
      expect(identity.startedAt).toBeDefined()
    })

    it('should accept custom startedAt', () => {
      const startedAt = '2026-01-01T00:00:00.000Z'
      const identity = createAgentIdentity('agent-1', 'CodeAgent', 'session-001', startedAt)

      expect(identity.startedAt).toBe(startedAt)
    })
  })

  describe('createContinuityCheckpoint', () => {
    it('should create a checkpoint with snapshot and prompt context', () => {
      const agent = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const state = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed' })
        ]
      })

      const checkpoint = createContinuityCheckpoint(agent, state, chatScenarios)

      expect(checkpoint.id).toBeDefined()
      expect(checkpoint.agent.agentId).toBe('agent-1')
      expect(checkpoint.snapshot).toBeDefined()
      expect(checkpoint.snapshot.atomCount).toBe(1)
      expect(checkpoint.promptContext).toBeDefined()
      expect(checkpoint.profile).toBeDefined()
    })

    it('should create unique checkpoint IDs', () => {
      const agent = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const state = createState()

      const cp1 = createContinuityCheckpoint(agent, state, chatScenarios)
      const cp2 = createContinuityCheckpoint(agent, state, chatScenarios)

      expect(cp1.id).not.toBe(cp2.id)
    })
  })

  describe('buildHandoffContext', () => {
    it('should build a complete handoff context between two agents', () => {
      const fromAgent = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const toAgent = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')
      const state = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed', type: 'preference' }),
          createAtom({ id: 'a2', content: '完成登录模块', lifecycle: 'active', type: 'goal' }),
          createAtom({ id: 'a3', content: '所有代码必须通过 lint', lifecycle: 'active', type: 'rule', layer: 'rule' })
        ]
      })

      const handoff = buildHandoffContext(fromAgent, toAgent, state)

      expect(handoff.fromAgent.agentId).toBe('agent-1')
      expect(handoff.toAgent.agentId).toBe('agent-2')
      expect(handoff.handoffTimestamp).toBeDefined()
      expect(handoff.cognitiveSnapshot).toBeDefined()
      expect(handoff.profileSummary).toBeDefined()
      expect(handoff.constitutionSummary).toBeDefined()
      expect(handoff.explainabilitySummary).toBeDefined()
      expect(handoff.reflectionSummary).toBeDefined()
      expect(handoff.activeAtomIds.length).toBeGreaterThan(0)
      expect(handoff.keyInsights.length).toBeGreaterThan(0)
      expect(handoff.pendingActions.length).toBeGreaterThan(0)
    })

    it('should identify pending goals', () => {
      const fromAgent = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const toAgent = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')
      const state = createState({
        atoms: [
          createAtom({ id: 'a1', content: '完成登录模块', lifecycle: 'active', type: 'goal' })
        ]
      })

      const handoff = buildHandoffContext(fromAgent, toAgent, state)

      expect(handoff.pendingActions).toContain('目标待完成: 完成登录模块')
    })

    it('should identify key preference insights', () => {
      const fromAgent = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const toAgent = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')
      const state = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed', type: 'preference' })
        ]
      })

      const handoff = buildHandoffContext(fromAgent, toAgent, state)

      expect(handoff.keyInsights).toContain('关键偏好: 用户喜欢咖啡')
    })

    it('should flag sensitive memories as risks', () => {
      const fromAgent = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const toAgent = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')
      const state = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户密码相关', lifecycle: 'active', sensitivity: 'sensitive' })
        ]
      })

      const handoff = buildHandoffContext(fromAgent, toAgent, state)

      expect(handoff.riskFlags.some(f => f.includes('敏感记忆'))).toBe(true)
    })
  })

  describe('validateContinuity', () => {
    it('should pass when no changes between checkpoints', () => {
      const agent1 = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const agent2 = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')
      const state = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed' })
        ]
      })

      const cp1 = createContinuityCheckpoint(agent1, state, chatScenarios)
      const cp2 = createContinuityCheckpoint(agent2, state, chatScenarios)

      const result = validateContinuity(cp1, cp2)

      expect(result.passed).toBe(true)
      expect(result.gaps).toHaveLength(0)
      expect(result.consistencyScore).toBe(1)
    })

    it('should detect missing confirmed memories', () => {
      const agent1 = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const agent2 = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')
      const state1 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed' }),
          createAtom({ id: 'a2', content: '用户喜欢茶', lifecycle: 'confirmed' })
        ]
      })
      const state2 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed' })
        ]
      })

      const cp1 = createContinuityCheckpoint(agent1, state1, chatScenarios)
      const cp2 = createContinuityCheckpoint(agent2, state2, chatScenarios)

      const result = validateContinuity(cp1, cp2)

      expect(result.passed).toBe(false)
      expect(result.gaps.length).toBeGreaterThan(0)
      expect(result.gaps.some(g => g.type === 'missing_memory')).toBe(true)
      expect(result.consistencyScore).toBeLessThan(1)
    })

    it('should detect lost preferences', () => {
      const agent1 = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const agent2 = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')
      const state1 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'active', type: 'preference' })
        ]
      })
      const state2 = createState({
        atoms: []
      })

      const cp1 = createContinuityCheckpoint(agent1, state1, chatScenarios)
      const cp2 = createContinuityCheckpoint(agent2, state2, chatScenarios)

      const result = validateContinuity(cp1, cp2)

      expect(result.gaps.some(g => g.type === 'lost_preference')).toBe(true)
    })

    it('should detect forgotten rules', () => {
      const agent1 = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const agent2 = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')
      const state1 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '所有代码必须通过 lint', lifecycle: 'active', type: 'rule', layer: 'rule' })
        ]
      })
      const state2 = createState({
        atoms: []
      })

      const cp1 = createContinuityCheckpoint(agent1, state1, chatScenarios)
      const cp2 = createContinuityCheckpoint(agent2, state2, chatScenarios)

      const result = validateContinuity(cp1, cp2)

      expect(result.gaps.some(g => g.type === 'rule_forgotten')).toBe(true)
    })

    it('should detect downgraded confidence', () => {
      const agent1 = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const agent2 = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')
      const state1 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'active', confidence: 0.9 })
        ]
      })
      const state2 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'active', confidence: 0.5 })
        ]
      })

      const cp1 = createContinuityCheckpoint(agent1, state1, chatScenarios)
      const cp2 = createContinuityCheckpoint(agent2, state2, chatScenarios)

      const result = validateContinuity(cp1, cp2)

      expect(result.gaps.some(g => g.type === 'downgraded_confidence')).toBe(true)
    })

    it('should detect context drift when confirmed memory degrades', () => {
      const agent1 = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const agent2 = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')
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

      const cp1 = createContinuityCheckpoint(agent1, state1, chatScenarios)
      const cp2 = createContinuityCheckpoint(agent2, state2, chatScenarios)

      const result = validateContinuity(cp1, cp2)

      expect(result.gaps.some(g => g.type === 'context_drift')).toBe(true)
    })
  })

  describe('buildMultiAgentContinuityReport', () => {
    it('should return empty report for no checkpoints', () => {
      const report = buildMultiAgentContinuityReport([])

      expect(report.handoffChain).toHaveLength(0)
      expect(report.overallConsistency).toBe(1)
    })

    it('should build report for single checkpoint', () => {
      const agent = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const state = createState()
      const cp = createContinuityCheckpoint(agent, state, chatScenarios)

      const report = buildMultiAgentContinuityReport([cp])

      expect(report.handoffChain).toHaveLength(1)
      expect(report.validations).toHaveLength(0)
      expect(report.overallConsistency).toBe(1)
    })

    it('should build report for multiple checkpoints with consistency score', () => {
      const agent1 = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const agent2 = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')
      const agent3 = createAgentIdentity('agent-3', 'TestAgent', 'session-003')

      const state = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed' })
        ]
      })

      const cp1 = createContinuityCheckpoint(agent1, state, chatScenarios)
      const cp2 = createContinuityCheckpoint(agent2, state, chatScenarios)
      const cp3 = createContinuityCheckpoint(agent3, state, chatScenarios)

      const report = buildMultiAgentContinuityReport([cp1, cp2, cp3])

      expect(report.handoffChain).toHaveLength(3)
      expect(report.validations).toHaveLength(2)
      expect(report.overallConsistency).toBeGreaterThanOrEqual(0)
      expect(report.overallConsistency).toBeLessThanOrEqual(1)
    })

    it('should detect issues when consistency drops', () => {
      const agent1 = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const agent2 = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')

      const state1 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed' }),
          createAtom({ id: 'a2', content: '用户喜欢茶', lifecycle: 'confirmed' })
        ]
      })
      const state2 = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed' })
        ]
      })

      const cp1 = createContinuityCheckpoint(agent1, state1, chatScenarios)
      const cp2 = createContinuityCheckpoint(agent2, state2, chatScenarios)

      const report = buildMultiAgentContinuityReport([cp1, cp2])

      expect(report.issues.length).toBeGreaterThan(0)
      expect(report.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('generateContinuityBrief', () => {
    it('should generate a human-readable brief', () => {
      const fromAgent = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const toAgent = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')
      const state = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed', type: 'preference' }),
          createAtom({ id: 'a2', content: '完成登录模块', lifecycle: 'active', type: 'goal' })
        ]
      })

      const handoff = buildHandoffContext(fromAgent, toAgent, state)
      const brief = generateContinuityBrief(handoff)

      expect(brief).toContain('Agent 交接简报')
      expect(brief).toContain('CodeAgent')
      expect(brief).toContain('ReviewAgent')
      expect(brief).toContain('认知画像摘要')
      expect(brief).toContain('活跃记忆')
      expect(brief).toContain('关键洞察')
      expect(brief).toContain('待处理事项')
      expect(brief).toContain('风险标记')
      expect(brief).toContain('宪章状态')
      expect(brief).toContain('可解释性')
      expect(brief).toContain('反思摘要')
    })

    it('should handle empty pending actions gracefully', () => {
      const fromAgent = createAgentIdentity('agent-1', 'CodeAgent', 'session-001')
      const toAgent = createAgentIdentity('agent-2', 'ReviewAgent', 'session-002')
      const state = createState({
        atoms: [
          createAtom({ id: 'a1', content: '用户喜欢咖啡', lifecycle: 'confirmed', type: 'preference' })
        ]
      })

      const handoff = buildHandoffContext(fromAgent, toAgent, state)
      const brief = generateContinuityBrief(handoff)

      expect(brief).toContain('(无)')
    })
  })
})
