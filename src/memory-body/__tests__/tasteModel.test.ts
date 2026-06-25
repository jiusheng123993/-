import { describe, expect, it } from 'vitest'
import {
  createTasteModel,
  updateTasteModel,
  addUnacceptablePattern,
  summarizeTasteModel
} from '../profile/tasteModel'

describe('tasteModel', () => {
  describe('createTasteModel', () => {
    it('creates a default taste model', () => {
      const model = createTasteModel()
      expect(model.visualTaste).toBe('')
      expect(model.interactionTaste).toBe('')
      expect(model.productTaste).toBe('')
      expect(model.writingTaste).toBe('')
      expect(model.architectureTaste).toBe('')
      expect(model.unacceptablePatterns).toEqual([])
      expect(model.updatedAt).toBeTruthy()
    })

    it('creates a taste model with input values', () => {
      const model = createTasteModel({
        visualTaste: '柔和高端',
        interactionTaste: '快速响应',
        productTaste: '完整功能',
        writingTaste: '技术文档风格',
        architectureTaste: '模块化',
        unacceptablePatterns: ['默认样板样式']
      })
      expect(model.visualTaste).toBe('柔和高端')
      expect(model.interactionTaste).toBe('快速响应')
      expect(model.productTaste).toBe('完整功能')
      expect(model.writingTaste).toBe('技术文档风格')
      expect(model.architectureTaste).toBe('模块化')
      expect(model.unacceptablePatterns).toEqual(['默认样板样式'])
    })
  })

  describe('updateTasteModel', () => {
    it('updates specific fields', () => {
      const model = createTasteModel()
      const updated = updateTasteModel(model, {
        visualTaste: '极简编辑',
        writingTaste: '简洁风格'
      })
      expect(updated.visualTaste).toBe('极简编辑')
      expect(updated.writingTaste).toBe('简洁风格')
      expect(updated.interactionTaste).toBe('')
      expect(updated.updatedAt >= model.updatedAt).toBe(true)
    })
  })

  describe('addUnacceptablePattern', () => {
    it('adds an unacceptable pattern', () => {
      const model = createTasteModel()
      const updated = addUnacceptablePattern(model, '默认样板样式')
      expect(updated.unacceptablePatterns).toContain('默认样板样式')
    })

    it('does not add duplicate patterns', () => {
      const model = createTasteModel({
        unacceptablePatterns: ['默认样板样式']
      })
      const updated = addUnacceptablePattern(model, '默认样板样式')
      expect(updated.unacceptablePatterns).toEqual(['默认样板样式'])
    })
  })

  describe('summarizeTasteModel', () => {
    it('summarizes a populated model', () => {
      const model = createTasteModel({
        visualTaste: '柔和高端',
        interactionTaste: '快速响应',
        productTaste: '完整功能',
        writingTaste: '技术文档风格',
        architectureTaste: '模块化',
        unacceptablePatterns: ['默认样板样式']
      })
      const summary = summarizeTasteModel(model)
      expect(summary).toContain('视觉品味: 柔和高端')
      expect(summary).toContain('交互品味: 快速响应')
      expect(summary).toContain('产品品味: 完整功能')
      expect(summary).toContain('写作品味: 技术文档风格')
      expect(summary).toContain('架构品味: 模块化')
      expect(summary).toContain('不可接受模式: 默认样板样式')
    })

    it('summarizes an empty model', () => {
      const model = createTasteModel()
      const summary = summarizeTasteModel(model)
      expect(summary).toBe('')
    })
  })
})
