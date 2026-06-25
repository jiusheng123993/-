import { describe, expect, it } from 'vitest'
import {
  createTrustModel,
  updateTrustModel,
  recordTrustBreak,
  recordTrustRepair,
  addSensitiveFailureMode,
  addPatienceSignal,
  summarizeTrustModel
} from '../profile/trustModel'

describe('trustModel', () => {
  describe('createTrustModel', () => {
    it('creates a default trust model with trustLevel 0.5', () => {
      const model = createTrustModel()
      expect(model.trustLevel).toBe(0.5)
      expect(model.trustBreakEvents).toEqual([])
      expect(model.trustRepairActions).toEqual([])
      expect(model.sensitiveFailureModes).toEqual([])
      expect(model.userPatienceSignals).toEqual([])
      expect(model.requiredProofStyle).toBe('')
      expect(model.updatedAt).toBeTruthy()
    })

    it('creates a trust model with input values', () => {
      const model = createTrustModel({
        trustLevel: 0.8,
        trustBreakEvents: ['遗忘偏好'],
        trustRepairActions: ['承认错误'],
        sensitiveFailureModes: ['误解需求'],
        userPatienceSignals: ['重复纠正'],
        requiredProofStyle: '展示修改内容'
      })
      expect(model.trustLevel).toBe(0.8)
      expect(model.trustBreakEvents).toEqual(['遗忘偏好'])
      expect(model.trustRepairActions).toEqual(['承认错误'])
      expect(model.sensitiveFailureModes).toEqual(['误解需求'])
      expect(model.userPatienceSignals).toEqual(['重复纠正'])
      expect(model.requiredProofStyle).toBe('展示修改内容')
    })

    it('clamps trustLevel to 0-1 range', () => {
      const high = createTrustModel({ trustLevel: 1.5 })
      expect(high.trustLevel).toBe(1)

      const low = createTrustModel({ trustLevel: -0.5 })
      expect(low.trustLevel).toBe(0)
    })
  })

  describe('updateTrustModel', () => {
    it('updates specific fields', () => {
      const model = createTrustModel()
      const updated = updateTrustModel(model, {
        trustLevel: 0.7,
        requiredProofStyle: '展示diff'
      })
      expect(updated.trustLevel).toBe(0.7)
      expect(updated.requiredProofStyle).toBe('展示diff')
      expect(updated.updatedAt >= model.updatedAt).toBe(true)
    })

    it('clamps trustLevel on update', () => {
      const model = createTrustModel()
      const updated = updateTrustModel(model, { trustLevel: 2 })
      expect(updated.trustLevel).toBe(1)
    })
  })

  describe('recordTrustBreak', () => {
    it('records a trust break event and reduces trust level', () => {
      const model = createTrustModel({ trustLevel: 0.8 })
      const updated = recordTrustBreak(model, '遗忘重要偏好')
      expect(updated.trustLevel).toBe(0.65)
      expect(updated.trustBreakEvents).toContain('遗忘重要偏好')
    })

    it('does not go below 0', () => {
      const model = createTrustModel({ trustLevel: 0.05 })
      const updated = recordTrustBreak(model, '严重误解')
      expect(updated.trustLevel).toBe(0)
    })
  })

  describe('recordTrustRepair', () => {
    it('records a trust repair action and increases trust level', () => {
      const model = createTrustModel({ trustLevel: 0.5 })
      const updated = recordTrustRepair(model, '承认并修复错误')
      expect(updated.trustLevel).toBe(0.6)
      expect(updated.trustRepairActions).toContain('承认并修复错误')
    })

    it('does not exceed 1', () => {
      const model = createTrustModel({ trustLevel: 0.95 })
      const updated = recordTrustRepair(model, '完美修复')
      expect(updated.trustLevel).toBe(1)
    })
  })

  describe('addSensitiveFailureMode', () => {
    it('adds a sensitive failure mode', () => {
      const model = createTrustModel()
      const updated = addSensitiveFailureMode(model, '误解需求')
      expect(updated.sensitiveFailureModes).toContain('误解需求')
    })

    it('does not add duplicates', () => {
      const model = createTrustModel({
        sensitiveFailureModes: ['误解需求']
      })
      const updated = addSensitiveFailureMode(model, '误解需求')
      expect(updated.sensitiveFailureModes).toEqual(['误解需求'])
    })
  })

  describe('addPatienceSignal', () => {
    it('adds a patience signal', () => {
      const model = createTrustModel()
      const updated = addPatienceSignal(model, '重复纠正')
      expect(updated.userPatienceSignals).toContain('重复纠正')
    })

    it('does not add duplicates', () => {
      const model = createTrustModel({
        userPatienceSignals: ['重复纠正']
      })
      const updated = addPatienceSignal(model, '重复纠正')
      expect(updated.userPatienceSignals).toEqual(['重复纠正'])
    })
  })

  describe('summarizeTrustModel', () => {
    it('summarizes a populated model', () => {
      const model = createTrustModel({
        trustLevel: 0.7,
        trustBreakEvents: ['遗忘偏好'],
        trustRepairActions: ['承认错误'],
        sensitiveFailureModes: ['误解需求'],
        requiredProofStyle: '展示修改内容'
      })
      const summary = summarizeTrustModel(model)
      expect(summary).toContain('信任等级: 0.7')
      expect(summary).toContain('证明风格: 展示修改内容')
      expect(summary).toContain('信任破裂事件: 1次')
      expect(summary).toContain('信任修复行动: 1次')
      expect(summary).toContain('敏感失败模式: 误解需求')
    })
  })
})
