import { describe, expect, it } from 'vitest'
import {
  createTemporalUserModel,
  updateTemporalUserModel,
  recordChange,
  addStableTrait,
  addEmergingPattern,
  decayPattern,
  archiveOldPreference,
  summarizeTemporalUserModel
} from '../profile/temporalUserModel'

describe('temporalUserModel', () => {
  describe('createTemporalUserModel', () => {
    it('creates a default temporal user model', () => {
      const model = createTemporalUserModel()
      expect(model.stableTraits).toEqual([])
      expect(model.recentChanges).toEqual([])
      expect(model.oldPreferences).toEqual([])
      expect(model.emergingPatterns).toEqual([])
      expect(model.decayedPatterns).toEqual([])
      expect(model.changeEvents).toEqual([])
      expect(model.updatedAt).toBeTruthy()
    })

    it('creates a temporal user model with input values', () => {
      const model = createTemporalUserModel({
        stableTraits: ['偏好完整方案'],
        emergingPatterns: ['开始接受分阶段'],
        oldPreferences: ['喜欢简单方案'],
        decayedPatterns: ['快速原型']
      })
      expect(model.stableTraits).toEqual(['偏好完整方案'])
      expect(model.emergingPatterns).toEqual(['开始接受分阶段'])
      expect(model.oldPreferences).toEqual(['喜欢简单方案'])
      expect(model.decayedPatterns).toEqual(['快速原型'])
    })
  })

  describe('updateTemporalUserModel', () => {
    it('updates specific fields', () => {
      const model = createTemporalUserModel()
      const updated = updateTemporalUserModel(model, {
        stableTraits: ['偏好完整方案']
      })
      expect(updated.stableTraits).toEqual(['偏好完整方案'])
      expect(updated.updatedAt >= model.updatedAt).toBe(true)
    })
  })

  describe('recordChange', () => {
    it('records a change event and adds to recentChanges', () => {
      const model = createTemporalUserModel()
      const event = {
        timestamp: '2026-06-24T00:00:00.000Z',
        field: 'preference',
        oldValue: '简单方案',
        newValue: '完整方案',
        reason: '用户多次强调'
      }
      const updated = recordChange(model, event)
      expect(updated.changeEvents).toHaveLength(1)
      expect(updated.changeEvents[0]).toEqual(event)
      expect(updated.recentChanges).toHaveLength(1)
      expect(updated.recentChanges[0]).toEqual(event)
    })

    it('caps recentChanges at 20 entries', () => {
      let model = createTemporalUserModel()
      for (let i = 0; i < 25; i++) {
        model = recordChange(model, {
          timestamp: `2026-06-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
          field: 'preference',
          oldValue: `old-${i}`,
          newValue: `new-${i}`,
          reason: `reason-${i}`
        })
      }
      expect(model.changeEvents).toHaveLength(25)
      expect(model.recentChanges).toHaveLength(20)
    })
  })

  describe('addStableTrait', () => {
    it('adds a stable trait', () => {
      const model = createTemporalUserModel()
      const updated = addStableTrait(model, '偏好完整方案')
      expect(updated.stableTraits).toContain('偏好完整方案')
    })

    it('does not add duplicate traits', () => {
      const model = createTemporalUserModel({
        stableTraits: ['偏好完整方案']
      })
      const updated = addStableTrait(model, '偏好完整方案')
      expect(updated.stableTraits).toEqual(['偏好完整方案'])
    })
  })

  describe('addEmergingPattern', () => {
    it('adds an emerging pattern', () => {
      const model = createTemporalUserModel()
      const updated = addEmergingPattern(model, '开始接受分阶段')
      expect(updated.emergingPatterns).toContain('开始接受分阶段')
    })

    it('does not add duplicate patterns', () => {
      const model = createTemporalUserModel({
        emergingPatterns: ['开始接受分阶段']
      })
      const updated = addEmergingPattern(model, '开始接受分阶段')
      expect(updated.emergingPatterns).toEqual(['开始接受分阶段'])
    })
  })

  describe('decayPattern', () => {
    it('moves a pattern from emerging to decayed', () => {
      const model = createTemporalUserModel({
        emergingPatterns: ['快速原型']
      })
      const updated = decayPattern(model, '快速原型')
      expect(updated.emergingPatterns).not.toContain('快速原型')
      expect(updated.decayedPatterns).toContain('快速原型')
    })

    it('handles non-existent pattern gracefully', () => {
      const model = createTemporalUserModel()
      const updated = decayPattern(model, '不存在的模式')
      expect(updated.emergingPatterns).toEqual([])
      expect(updated.decayedPatterns).toContain('不存在的模式')
    })
  })

  describe('archiveOldPreference', () => {
    it('archives an old preference', () => {
      const model = createTemporalUserModel()
      const updated = archiveOldPreference(model, '喜欢简单方案')
      expect(updated.oldPreferences).toContain('喜欢简单方案')
    })

    it('does not add duplicate old preferences', () => {
      const model = createTemporalUserModel({
        oldPreferences: ['喜欢简单方案']
      })
      const updated = archiveOldPreference(model, '喜欢简单方案')
      expect(updated.oldPreferences).toEqual(['喜欢简单方案'])
    })
  })

  describe('summarizeTemporalUserModel', () => {
    it('summarizes a populated model', () => {
      const model = createTemporalUserModel({
        stableTraits: ['偏好完整方案'],
        emergingPatterns: ['开始接受分阶段'],
        decayedPatterns: ['快速原型'],
        recentChanges: [{
          timestamp: '2026-06-24T00:00:00.000Z',
          field: 'preference',
          oldValue: '简单方案',
          newValue: '完整方案',
          reason: '用户多次强调'
        }]
      })
      const summary = summarizeTemporalUserModel(model)
      expect(summary).toContain('稳定特质: 偏好完整方案')
      expect(summary).toContain('新兴模式: 开始接受分阶段')
      expect(summary).toContain('已衰减模式: 快速原型')
      expect(summary).toContain('最近变化: 1项')
    })

    it('summarizes an empty model', () => {
      const model = createTemporalUserModel()
      const summary = summarizeTemporalUserModel(model)
      expect(summary).toBe('')
    })
  })
})
