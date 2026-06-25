import { describe, expect, it } from 'vitest'
import {
  createDecisionModel,
  updateDecisionModel,
  addDecisionEvidence,
  addRejectionPattern,
  summarizeDecisionModel
} from '../profile/decisionModel'
import type { MemoryAtom } from '../core/memoryBodyTypes'

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

describe('decisionModel', () => {
  describe('createDecisionModel', () => {
    it('creates a default decision model', () => {
      const model = createDecisionModel()
      expect(model.qualityBar).toBe('')
      expect(model.tradeoffPreference).toBe('')
      expect(model.riskTolerance).toBe('')
      expect(model.confirmationStyle).toBe('')
      expect(model.implementationBias).toBe('')
      expect(model.rejectionPatterns).toEqual([])
      expect(model.decisionEvidenceAtomIds).toEqual([])
      expect(model.updatedAt).toBeTruthy()
    })

    it('creates a decision model with input values', () => {
      const model = createDecisionModel({
        qualityBar: '高质量',
        tradeoffPreference: '完整性优先',
        riskTolerance: '中等',
        confirmationStyle: '快速确认',
        implementationBias: '分阶段实现',
        rejectionPatterns: ['简化方案'],
        decisionEvidenceAtomIds: ['atom-1']
      })
      expect(model.qualityBar).toBe('高质量')
      expect(model.tradeoffPreference).toBe('完整性优先')
      expect(model.riskTolerance).toBe('中等')
      expect(model.confirmationStyle).toBe('快速确认')
      expect(model.implementationBias).toBe('分阶段实现')
      expect(model.rejectionPatterns).toEqual(['简化方案'])
      expect(model.decisionEvidenceAtomIds).toEqual(['atom-1'])
    })
  })

  describe('updateDecisionModel', () => {
    it('updates specific fields', () => {
      const model = createDecisionModel()
      const updated = updateDecisionModel(model, {
        qualityBar: '极高',
        riskTolerance: '低'
      })
      expect(updated.qualityBar).toBe('极高')
      expect(updated.riskTolerance).toBe('低')
      expect(updated.tradeoffPreference).toBe('')
      expect(updated.updatedAt >= model.updatedAt).toBe(true)
    })
  })

  describe('addDecisionEvidence', () => {
    it('adds an evidence atom id', () => {
      const model = createDecisionModel()
      const updated = addDecisionEvidence(model, baseAtom)
      expect(updated.decisionEvidenceAtomIds).toContain('atom-1')
    })

    it('does not add duplicate atom ids', () => {
      const model = createDecisionModel({
        decisionEvidenceAtomIds: ['atom-1']
      })
      const updated = addDecisionEvidence(model, baseAtom)
      expect(updated.decisionEvidenceAtomIds).toEqual(['atom-1'])
    })
  })

  describe('addRejectionPattern', () => {
    it('adds a rejection pattern', () => {
      const model = createDecisionModel()
      const updated = addRejectionPattern(model, '简化方案')
      expect(updated.rejectionPatterns).toContain('简化方案')
    })

    it('does not add duplicate patterns', () => {
      const model = createDecisionModel({
        rejectionPatterns: ['简化方案']
      })
      const updated = addRejectionPattern(model, '简化方案')
      expect(updated.rejectionPatterns).toEqual(['简化方案'])
    })
  })

  describe('summarizeDecisionModel', () => {
    it('summarizes a populated model', () => {
      const model = createDecisionModel({
        qualityBar: '高质量',
        tradeoffPreference: '完整性优先',
        riskTolerance: '中等',
        confirmationStyle: '快速确认',
        implementationBias: '分阶段实现',
        rejectionPatterns: ['简化方案']
      })
      const summary = summarizeDecisionModel(model)
      expect(summary).toContain('质量标准: 高质量')
      expect(summary).toContain('权衡偏好: 完整性优先')
      expect(summary).toContain('风险容忍: 中等')
      expect(summary).toContain('确认风格: 快速确认')
      expect(summary).toContain('实现倾向: 分阶段实现')
      expect(summary).toContain('拒绝模式: 简化方案')
    })

    it('summarizes an empty model', () => {
      const model = createDecisionModel()
      const summary = summarizeDecisionModel(model)
      expect(summary).toBe('')
    })
  })
})
