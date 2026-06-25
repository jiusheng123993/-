import { describe, expect, it } from 'vitest'
import {
  createMetaCognitionModel,
  updateMetaCognitionModel,
  addKnownFact,
  addUncertainAssumption,
  addMissingContext,
  addAmbiguitySignal,
  evaluateActionMode,
  summarizeMetaCognitionModel
} from '../profile/metaCognitionModel'

describe('metaCognitionModel', () => {
  describe('createMetaCognitionModel', () => {
    it('creates a default meta cognition model', () => {
      const model = createMetaCognitionModel()
      expect(model.knownFacts).toEqual([])
      expect(model.uncertainAssumptions).toEqual([])
      expect(model.confidenceCalibration).toBe(0.5)
      expect(model.missingContext).toEqual([])
      expect(model.ambiguitySignals).toEqual([])
      expect(model.shouldAskUser).toBe(false)
      expect(model.shouldActDirectly).toBe(true)
      expect(model.updatedAt).toBeTruthy()
    })

    it('creates a meta cognition model with input values', () => {
      const model = createMetaCognitionModel({
        knownFacts: ['用户偏好完整方案'],
        uncertainAssumptions: ['用户可能接受分阶段'],
        confidenceCalibration: 0.7,
        missingContext: ['当前项目阶段'],
        ambiguitySignals: ['"完整"含义不明确'],
        shouldAskUser: true,
        shouldActDirectly: false
      })
      expect(model.knownFacts).toEqual(['用户偏好完整方案'])
      expect(model.uncertainAssumptions).toEqual(['用户可能接受分阶段'])
      expect(model.confidenceCalibration).toBe(0.7)
      expect(model.missingContext).toEqual(['当前项目阶段'])
      expect(model.ambiguitySignals).toEqual(['"完整"含义不明确'])
      expect(model.shouldAskUser).toBe(true)
      expect(model.shouldActDirectly).toBe(false)
    })

    it('clamps confidenceCalibration to 0-1 range', () => {
      const high = createMetaCognitionModel({ confidenceCalibration: 1.5 })
      expect(high.confidenceCalibration).toBe(1)

      const low = createMetaCognitionModel({ confidenceCalibration: -0.5 })
      expect(low.confidenceCalibration).toBe(0)
    })
  })

  describe('updateMetaCognitionModel', () => {
    it('updates specific fields', () => {
      const model = createMetaCognitionModel()
      const updated = updateMetaCognitionModel(model, {
        confidenceCalibration: 0.8,
        shouldAskUser: true
      })
      expect(updated.confidenceCalibration).toBe(0.8)
      expect(updated.shouldAskUser).toBe(true)
      expect(updated.updatedAt >= model.updatedAt).toBe(true)
    })

    it('clamps confidenceCalibration on update', () => {
      const model = createMetaCognitionModel()
      const updated = updateMetaCognitionModel(model, { confidenceCalibration: 2 })
      expect(updated.confidenceCalibration).toBe(1)
    })
  })

  describe('addKnownFact', () => {
    it('adds a known fact', () => {
      const model = createMetaCognitionModel()
      const updated = addKnownFact(model, '用户偏好完整方案')
      expect(updated.knownFacts).toContain('用户偏好完整方案')
    })

    it('does not add duplicate facts', () => {
      const model = createMetaCognitionModel({
        knownFacts: ['用户偏好完整方案']
      })
      const updated = addKnownFact(model, '用户偏好完整方案')
      expect(updated.knownFacts).toEqual(['用户偏好完整方案'])
    })
  })

  describe('addUncertainAssumption', () => {
    it('adds an uncertain assumption', () => {
      const model = createMetaCognitionModel()
      const updated = addUncertainAssumption(model, '用户可能接受分阶段')
      expect(updated.uncertainAssumptions).toContain('用户可能接受分阶段')
    })

    it('does not add duplicate assumptions', () => {
      const model = createMetaCognitionModel({
        uncertainAssumptions: ['用户可能接受分阶段']
      })
      const updated = addUncertainAssumption(model, '用户可能接受分阶段')
      expect(updated.uncertainAssumptions).toEqual(['用户可能接受分阶段'])
    })
  })

  describe('addMissingContext', () => {
    it('adds missing context', () => {
      const model = createMetaCognitionModel()
      const updated = addMissingContext(model, '当前项目阶段')
      expect(updated.missingContext).toContain('当前项目阶段')
    })

    it('does not add duplicate context', () => {
      const model = createMetaCognitionModel({
        missingContext: ['当前项目阶段']
      })
      const updated = addMissingContext(model, '当前项目阶段')
      expect(updated.missingContext).toEqual(['当前项目阶段'])
    })
  })

  describe('addAmbiguitySignal', () => {
    it('adds an ambiguity signal', () => {
      const model = createMetaCognitionModel()
      const updated = addAmbiguitySignal(model, '"完整"含义不明确')
      expect(updated.ambiguitySignals).toContain('"完整"含义不明确')
    })

    it('does not add duplicate signals', () => {
      const model = createMetaCognitionModel({
        ambiguitySignals: ['"完整"含义不明确']
      })
      const updated = addAmbiguitySignal(model, '"完整"含义不明确')
      expect(updated.ambiguitySignals).toEqual(['"完整"含义不明确'])
    })
  })

  describe('evaluateActionMode', () => {
    it('suggests asking user when ambiguity and low confidence', () => {
      const model = createMetaCognitionModel({
        ambiguitySignals: ['"完整"含义不明确'],
        confidenceCalibration: 0.3
      })
      const result = evaluateActionMode(model)
      expect(result.shouldAskUser).toBe(true)
      expect(result.shouldActDirectly).toBe(false)
      expect(result.reason).toContain('歧义信号')
    })

    it('suggests asking user when missing context and uncertain assumptions', () => {
      const model = createMetaCognitionModel({
        missingContext: ['当前项目阶段'],
        uncertainAssumptions: ['用户可能接受分阶段'],
        confidenceCalibration: 0.6
      })
      const result = evaluateActionMode(model)
      expect(result.shouldAskUser).toBe(true)
      expect(result.shouldActDirectly).toBe(false)
      expect(result.reason).toContain('缺少上下文')
    })

    it('suggests acting directly with risk note when partial uncertainty', () => {
      const model = createMetaCognitionModel({
        ambiguitySignals: ['"完整"含义不明确'],
        confidenceCalibration: 0.6
      })
      const result = evaluateActionMode(model)
      expect(result.shouldAskUser).toBe(false)
      expect(result.shouldActDirectly).toBe(true)
      expect(result.reason).toContain('标注风险')
    })

    it('suggests acting directly when cognition is clear', () => {
      const model = createMetaCognitionModel({
        knownFacts: ['用户偏好完整方案'],
        confidenceCalibration: 0.8
      })
      const result = evaluateActionMode(model)
      expect(result.shouldAskUser).toBe(false)
      expect(result.shouldActDirectly).toBe(true)
      expect(result.reason).toContain('认知状态清晰')
    })
  })

  describe('summarizeMetaCognitionModel', () => {
    it('summarizes a populated model', () => {
      const model = createMetaCognitionModel({
        knownFacts: ['用户偏好完整方案'],
        uncertainAssumptions: ['用户可能接受分阶段'],
        confidenceCalibration: 0.7,
        missingContext: ['当前项目阶段'],
        ambiguitySignals: ['"完整"含义不明确'],
        shouldAskUser: true,
        shouldActDirectly: false
      })
      const summary = summarizeMetaCognitionModel(model)
      expect(summary).toContain('置信度校准: 0.7')
      expect(summary).toContain('已知事实: 1项')
      expect(summary).toContain('不确定假设: 1项')
      expect(summary).toContain('缺失上下文: 1项')
      expect(summary).toContain('歧义信号: 1项')
      expect(summary).toContain('建议询问用户')
    })

    it('summarizes a model that should act directly', () => {
      const model = createMetaCognitionModel({
        shouldAskUser: false,
        shouldActDirectly: true
      })
      const summary = summarizeMetaCognitionModel(model)
      expect(summary).toContain('可直接执行')
    })
  })
})
