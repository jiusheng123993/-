import { describe, expect, it } from 'vitest'
import type { MemoryAtom, MemoryBodyState } from '../core/memoryBodyTypes'
import {
  createCognitiveProfile,
  updateCognitiveProfile,
  addPreference,
  addGoal,
  addSafetyBoundary,
  addScenario,
  addMisunderstandingMemory,
  addEvidenceAtom,
  recordEvolution,
  setReflectionSummary,
  buildCognitiveProfileFromState,
  summarizeCognitiveProfile
} from '../profile/cognitiveProfile'
import { createMisunderstandingMemory } from '../profile/misunderstandingMemory'
import { createDecisionModel } from '../profile/decisionModel'
import { createTasteModel } from '../profile/tasteModel'
import { createTrustModel } from '../profile/trustModel'

const baseAtom: MemoryAtom = {
  id: 'atom-1',
  scope: { userId: 'user-1', projectId: 'project-1' },
  layer: 'semantic',
  type: 'preference',
  subject: 'user',
  predicate: 'prefers',
  object: '完整方案',
  content: '用户偏好完整方案，不接受简化版',
  source: 'chat',
  confidence: 0.8,
  strength: 0.8,
  emotionalWeight: 0.3,
  sensitivity: 'personal',
  lifecycle: 'confirmed',
  evidence: [{
    id: 'evidence-1',
    source: 'chat',
    sourceText: '要做就做最完整的方案',
    timestamp: '2026-06-23T00:00:00.000Z',
    confidence: 0.9
  }],
  tags: ['complete-solution'],
  scenarios: ['chat', 'goal_planning'],
  createdAt: '2026-06-23T00:00:00.000Z',
  updatedAt: '2026-06-23T00:00:00.000Z',
  lastAccessedAt: '2026-06-23T00:00:00.000Z',
  accessCount: 3,
  contradictionOf: []
}

const baseScope = { userId: 'user-1', projectId: 'project-1' }

describe('cognitiveProfile', () => {
  describe('createCognitiveProfile', () => {
    it('creates a cognitive profile with required scope', () => {
      const profile = createCognitiveProfile({ scope: baseScope })
      expect(profile.id).toBeTruthy()
      expect(profile.id).toMatch(/^cognitive-profile-/)
      expect(profile.scope).toEqual(baseScope)
      expect(profile.identityModel).toBe('')
      expect(profile.preferenceModel).toEqual([])
      expect(profile.decisionModel).toBeDefined()
      expect(profile.tasteModel).toBeDefined()
      expect(profile.goalModel).toEqual([])
      expect(profile.trustModel).toBeDefined()
      expect(profile.relationshipModel).toBe('')
      expect(profile.emotionModel).toBe('')
      expect(profile.temporalUserModel).toBeDefined()
      expect(profile.scenarioModel).toEqual([])
      expect(profile.safetyBoundary).toEqual([])
      expect(profile.reflectionSummary).toBe('')
      expect(profile.evolutionHistory).toEqual([])
      expect(profile.misunderstandingMemories).toEqual([])
      expect(profile.metaCognitionModel).toBeDefined()
      expect(profile.evidenceAtomIds).toEqual([])
      expect(profile.createdAt).toBeTruthy()
      expect(profile.updatedAt).toBeTruthy()
    })

    it('creates a cognitive profile with full input', () => {
      const profile = createCognitiveProfile({
        scope: baseScope,
        identityModel: '全栈开发者',
        preferenceModel: ['完整方案优先'],
        decisionModel: createDecisionModel({ qualityBar: '高质量' }),
        tasteModel: createTasteModel({ visualTaste: '柔和高端' }),
        goalModel: ['完成 Phase 8'],
        trustModel: createTrustModel({ trustLevel: 0.8 }),
        relationshipModel: '协作开发',
        emotionModel: '积极',
        scenarioModel: ['开发'],
        safetyBoundary: ['不修改核心逻辑'],
        reflectionSummary: '用户偏好完整方案',
        evolutionHistory: ['初始创建'],
        misunderstandingMemories: [],
        evidenceAtomIds: ['atom-1']
      })
      expect(profile.identityModel).toBe('全栈开发者')
      expect(profile.preferenceModel).toEqual(['完整方案优先'])
      expect(profile.decisionModel.qualityBar).toBe('高质量')
      expect(profile.tasteModel.visualTaste).toBe('柔和高端')
      expect(profile.goalModel).toEqual(['完成 Phase 8'])
      expect(profile.trustModel.trustLevel).toBe(0.8)
      expect(profile.relationshipModel).toBe('协作开发')
      expect(profile.emotionModel).toBe('积极')
      expect(profile.scenarioModel).toEqual(['开发'])
      expect(profile.safetyBoundary).toEqual(['不修改核心逻辑'])
      expect(profile.reflectionSummary).toBe('用户偏好完整方案')
      expect(profile.evolutionHistory).toEqual(['初始创建'])
      expect(profile.evidenceAtomIds).toEqual(['atom-1'])
    })

    it('generates unique ids', () => {
      const p1 = createCognitiveProfile({ scope: baseScope })
      const p2 = createCognitiveProfile({ scope: baseScope })
      expect(p1.id).not.toBe(p2.id)
    })
  })

  describe('updateCognitiveProfile', () => {
    it('updates specific fields', () => {
      const profile = createCognitiveProfile({ scope: baseScope })
      const updated = updateCognitiveProfile(profile, {
        identityModel: '全栈开发者',
        relationshipModel: '协作开发'
      })
      expect(updated.identityModel).toBe('全栈开发者')
      expect(updated.relationshipModel).toBe('协作开发')
      expect(updated.updatedAt >= profile.updatedAt).toBe(true)
    })
  })

  describe('addPreference', () => {
    it('adds a preference', () => {
      const profile = createCognitiveProfile({ scope: baseScope })
      const updated = addPreference(profile, '完整方案优先')
      expect(updated.preferenceModel).toContain('完整方案优先')
    })

    it('does not add duplicate preferences', () => {
      const profile = createCognitiveProfile({
        scope: baseScope,
        preferenceModel: ['完整方案优先']
      })
      const updated = addPreference(profile, '完整方案优先')
      expect(updated.preferenceModel).toEqual(['完整方案优先'])
    })
  })

  describe('addGoal', () => {
    it('adds a goal', () => {
      const profile = createCognitiveProfile({ scope: baseScope })
      const updated = addGoal(profile, '完成 Phase 8')
      expect(updated.goalModel).toContain('完成 Phase 8')
    })

    it('does not add duplicate goals', () => {
      const profile = createCognitiveProfile({
        scope: baseScope,
        goalModel: ['完成 Phase 8']
      })
      const updated = addGoal(profile, '完成 Phase 8')
      expect(updated.goalModel).toEqual(['完成 Phase 8'])
    })
  })

  describe('addSafetyBoundary', () => {
    it('adds a safety boundary', () => {
      const profile = createCognitiveProfile({ scope: baseScope })
      const updated = addSafetyBoundary(profile, '不修改核心逻辑')
      expect(updated.safetyBoundary).toContain('不修改核心逻辑')
    })

    it('does not add duplicate boundaries', () => {
      const profile = createCognitiveProfile({
        scope: baseScope,
        safetyBoundary: ['不修改核心逻辑']
      })
      const updated = addSafetyBoundary(profile, '不修改核心逻辑')
      expect(updated.safetyBoundary).toEqual(['不修改核心逻辑'])
    })
  })

  describe('addScenario', () => {
    it('adds a scenario', () => {
      const profile = createCognitiveProfile({ scope: baseScope })
      const updated = addScenario(profile, '开发')
      expect(updated.scenarioModel).toContain('开发')
    })

    it('does not add duplicate scenarios', () => {
      const profile = createCognitiveProfile({
        scope: baseScope,
        scenarioModel: ['开发']
      })
      const updated = addScenario(profile, '开发')
      expect(updated.scenarioModel).toEqual(['开发'])
    })
  })

  describe('addMisunderstandingMemory', () => {
    it('adds a misunderstanding memory', () => {
      const profile = createCognitiveProfile({ scope: baseScope })
      const memory = createMisunderstandingMemory({
        userSaid: '做最完整的方案',
        assistantInterpreted: '做最完整的阶段',
        userCorrection: '不是最完整阶段，而是最完整方案',
        lesson: '遇到"完整"时优先理解为终局方案完整性'
      })
      const updated = addMisunderstandingMemory(profile, memory)
      expect(updated.misunderstandingMemories).toHaveLength(1)
      expect(updated.misunderstandingMemories[0]).toEqual(memory)
    })
  })

  describe('addEvidenceAtom', () => {
    it('adds an evidence atom id', () => {
      const profile = createCognitiveProfile({ scope: baseScope })
      const updated = addEvidenceAtom(profile, baseAtom)
      expect(updated.evidenceAtomIds).toContain('atom-1')
    })

    it('does not add duplicate atom ids', () => {
      const profile = createCognitiveProfile({
        scope: baseScope,
        evidenceAtomIds: ['atom-1']
      })
      const updated = addEvidenceAtom(profile, baseAtom)
      expect(updated.evidenceAtomIds).toEqual(['atom-1'])
    })
  })

  describe('recordEvolution', () => {
    it('records an evolution entry', () => {
      const profile = createCognitiveProfile({ scope: baseScope })
      const updated = recordEvolution(profile, 'Phase 8 完成')
      expect(updated.evolutionHistory).toContain('Phase 8 完成')
    })
  })

  describe('setReflectionSummary', () => {
    it('sets the reflection summary', () => {
      const profile = createCognitiveProfile({ scope: baseScope })
      const updated = setReflectionSummary(profile, '用户偏好完整方案')
      expect(updated.reflectionSummary).toBe('用户偏好完整方案')
    })
  })

  describe('buildCognitiveProfileFromState', () => {
    it('builds profile from MemoryBodyState', () => {
      const state: MemoryBodyState = {
        version: 1,
        scope: baseScope,
        atoms: [
          { ...baseAtom, id: 'atom-pref', type: 'preference', content: '偏好完整方案' },
          { ...baseAtom, id: 'atom-goal', type: 'goal', content: '完成 Phase 8' },
          { ...baseAtom, id: 'atom-boundary', type: 'boundary', content: '不修改核心逻辑' },
          { ...baseAtom, id: 'atom-identity', type: 'identity', content: '全栈开发者' }
        ],
        entities: [],
        relations: [],
        beliefs: [],
        meta: {
          createdAt: '2026-06-23T00:00:00.000Z',
          updatedAt: '2026-06-23T00:00:00.000Z',
          totalInteractions: 10,
          totalCorrections: 2,
          maturityLevel: 3
        }
      }
      const profile = buildCognitiveProfileFromState(state)
      expect(profile.identityModel).toContain('全栈开发者')
      expect(profile.preferenceModel).toContain('偏好完整方案')
      expect(profile.goalModel).toContain('完成 Phase 8')
      expect(profile.safetyBoundary).toContain('不修改核心逻辑')
      expect(profile.evidenceAtomIds).toHaveLength(4)
    })

    it('merges with existing profile', () => {
      const existing = createCognitiveProfile({
        scope: baseScope,
        preferenceModel: ['已有偏好'],
        goalModel: ['已有目标']
      })
      const state: MemoryBodyState = {
        version: 1,
        scope: baseScope,
        atoms: [
          { ...baseAtom, id: 'atom-pref', type: 'preference', content: '新偏好' }
        ],
        entities: [],
        relations: [],
        beliefs: [],
        meta: {
          createdAt: '2026-06-23T00:00:00.000Z',
          updatedAt: '2026-06-23T00:00:00.000Z',
          totalInteractions: 10,
          totalCorrections: 2,
          maturityLevel: 3
        }
      }
      const profile = buildCognitiveProfileFromState(state, existing)
      expect(profile.preferenceModel).toContain('已有偏好')
      expect(profile.preferenceModel).toContain('新偏好')
      expect(profile.goalModel).toContain('已有目标')
    })
  })

  describe('summarizeCognitiveProfile', () => {
    it('summarizes a populated profile', () => {
      const profile = createCognitiveProfile({
        scope: baseScope,
        identityModel: '全栈开发者',
        preferenceModel: ['完整方案优先'],
        goalModel: ['完成 Phase 8'],
        safetyBoundary: ['不修改核心逻辑'],
        relationshipModel: '协作开发',
        emotionModel: '积极',
        reflectionSummary: '用户偏好完整方案',
        evidenceAtomIds: ['atom-1', 'atom-2']
      })
      const summary = summarizeCognitiveProfile(profile)
      expect(summary).toContain('身份: 全栈开发者')
      expect(summary).toContain('偏好: 完整方案优先')
      expect(summary).toContain('目标: 完成 Phase 8')
      expect(summary).toContain('安全边界: 不修改核心逻辑')
      expect(summary).toContain('关系: 协作开发')
      expect(summary).toContain('情绪: 积极')
      expect(summary).toContain('反思: 用户偏好完整方案')
      expect(summary).toContain('证据原子: 2个')
    })

    it('summarizes a minimal profile', () => {
      const profile = createCognitiveProfile({ scope: baseScope })
      const summary = summarizeCognitiveProfile(profile)
      expect(summary).toContain('证据原子: 0个')
    })
  })
})
