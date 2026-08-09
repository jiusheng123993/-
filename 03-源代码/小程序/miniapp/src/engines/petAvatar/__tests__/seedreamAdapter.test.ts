/**
 * seedreamAdapter 测试
 * 验证 AI 图像生成适配器的 stub 模式、真实 API 调用和安全降级
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SeedreamAdapter, seedreamAdapter } from '../seedreamAdapter'
import { getPetFaceDataUri } from '../svgRenderer'
import type { ExpressionConfig } from '../expressionEngine'

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
}))

vi.mock('../svgRenderer', () => ({
  getPetFaceDataUri: vi.fn(() => 'data:image/svg+xml;base64,stubdata'),
}))

vi.mock('../expressionEngine', () => ({
  EXPRESSION_MAP: {
    happy: { expression: 'happy', label: '开心', color: '#4CAF50', eyes: 'happy', mouth: 'smile', accessory: 'blush', animation: 'bounce' },
    worried: { expression: 'worried', label: '担心', color: '#FF9800', eyes: 'half', mouth: 'frown', accessory: 'cold_bubble', animation: 'pulse' },
    concerned: { expression: 'concerned', label: '关注', color: '#FF5722', eyes: 'round', mouth: 'worried', accessory: 'hospital', animation: 'shake' },
    anxious: { expression: 'anxious', label: '紧急', color: '#F44336', eyes: 'wide', mouth: 'gasp', accessory: 'sweat', animation: 'flash' },
    sleepy: { expression: 'sleepy', label: '瞌睡', color: '#9E9E9E', eyes: 'closed', mouth: 'zzz', accessory: 'drool', animation: 'float' },
    proud: { expression: 'proud', label: '骄傲', color: '#FFD700', eyes: 'sparkle', mouth: 'big_smile', accessory: 'crown', animation: 'glow' },
    excited: { expression: 'excited', label: '兴奋', color: '#FF69B4', eyes: 'star', mouth: 'open_smile', accessory: 'confetti', animation: 'jump' },
    scared: { expression: 'scared', label: '惊恐', color: '#E91E63', eyes: 'shocked', mouth: 'gasp', accessory: 'warning', animation: 'tremble' },
  },
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    request: mockRequest,
    getStorageSync: vi.fn(() => 'mock_token'),
  },
}))

const happyExpression: ExpressionConfig = {
  expression: 'happy',
  label: '开心',
  color: '#4CAF50',
  eyes: 'happy',
  mouth: 'smile',
  accessory: 'blush',
  animation: 'bounce',
}

const excitedExpression: ExpressionConfig = {
  expression: 'excited',
  label: '兴奋',
  color: '#FF69B4',
  eyes: 'star',
  mouth: 'open_smile',
  accessory: 'confetti',
  animation: 'jump',
}

const worriedExpression: ExpressionConfig = {
  expression: 'worried',
  label: '担心',
  color: '#FF9800',
  eyes: 'half',
  mouth: 'frown',
  accessory: 'cold_bubble',
  animation: 'pulse',
}

const sleepyExpression: ExpressionConfig = {
  expression: 'sleepy',
  label: '瞌睡',
  color: '#9E9E9E',
  eyes: 'closed',
  mouth: 'zzz',
  accessory: 'drool',
  animation: 'float',
}

const TEST_PET_ID = 'test-pet-001'

describe('SeedreamAdapter', () => {
  beforeEach(() => {
    vi.mocked(getPetFaceDataUri).mockClear()
    vi.mocked(getPetFaceDataUri).mockReturnValue('data:image/svg+xml;base64,stubdata')
    mockRequest.mockReset()
  })

  describe('constructor', () => {
    it('defaults useStub to true', async () => {
      const adapter = new SeedreamAdapter()
      const result = adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression })
      // stub 模式明确失败，避免把丑陋的 SVG 简笔画脸当生成结果保存
      await expect(result).resolves.toEqual({ success: false, error: 'AI 形象生成服务暂不可用，请稍后重试' })
    })

    it('can set useStub to false', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: { success: true, data: { url: 'https://cdn.example.com/avatar.png', isPlaceholder: false } } })
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression })
      expect(result.success).toBe(true)
    })
  })

  describe('generatePetImage with stub', () => {
    it('returns failure with error for dog species', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression })
      expect(result.success).toBe(false)
      expect(result.error).toBe('AI 形象生成服务暂不可用，请稍后重试')
    })

    it('returns failure with error for cat species', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'cat', expression: happyExpression })
      expect(result.success).toBe(false)
    })

    it('does not call getPetFaceDataUri in stub mode', async () => {
      const adapter = new SeedreamAdapter(true)
      await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: excitedExpression })
      expect(getPetFaceDataUri).not.toHaveBeenCalled()
    })

    it('does not call getPetFaceDataUri for cat species', async () => {
      const adapter = new SeedreamAdapter(true)
      await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'cat', expression: worriedExpression })
      expect(getPetFaceDataUri).not.toHaveBeenCalled()
    })

    it('returns failure for cartoon style', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression, style: 'cartoon' })
      expect(result.success).toBe(false)
    })

    it('returns failure for realistic style', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'cat', expression: excitedExpression, style: 'realistic' })
      expect(result.success).toBe(false)
    })

    it('passes breed and color through without error in stub mode', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression, breed: '金毛', color: '金' })
      expect(result.success).toBe(false)
    })
  })

  describe('generatePetImage without stub', () => {
    it('returns real image when API succeeds', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: { success: true, data: { url: 'https://cdn.example.com/avatar.png', isPlaceholder: false } } })
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generatePetImage({ petId: 'pet-001', species: 'dog', expression: happyExpression })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('https://cdn.example.com/avatar.png')
    })

    it('returns failure when API fails (no ugly stub fallback)', async () => {
      mockRequest.mockRejectedValue(new Error('Network error'))
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression })
      expect(result.success).toBe(false)
    })

    it('returns failure when API returns error', async () => {
      mockRequest.mockResolvedValue({ statusCode: 500, data: { error: 'Internal error' } })
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'cat', expression: excitedExpression })
      expect(result.success).toBe(false)
    })

    it('returns failure on 402 payment required', async () => {
      mockRequest.mockResolvedValue({ statusCode: 402, data: {} })
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression })
      expect(result.success).toBe(false)
    })

    it('returns failure on 429 rate limit', async () => {
      mockRequest.mockResolvedValue({ statusCode: 429, data: {} })
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression })
      expect(result.success).toBe(false)
    })
  })

  describe('generateAchievementImage', () => {
    it('returns failure in stub mode (no ugly SVG face)', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generateAchievementImage('streak7', '旺财', 'dog')
      expect(result.success).toBe(false)
    })

    it('does not call getPetFaceDataUri in stub mode', async () => {
      const adapter = new SeedreamAdapter(true)
      await adapter.generateAchievementImage('streak7', '旺财', 'dog')
      expect(getPetFaceDataUri).not.toHaveBeenCalled()
    })

    it('does not call getPetFaceDataUri for cat species in stub mode', async () => {
      const adapter = new SeedreamAdapter(true)
      await adapter.generateAchievementImage('vaccine', '咪咪', 'cat')
      expect(getPetFaceDataUri).not.toHaveBeenCalled()
    })

    it('returns real image when API succeeds with useStub false', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: { success: true, imageUrl: 'https://cdn.example.com/achievement.png' } })
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generateAchievementImage('streak7', '旺财', 'dog')
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('https://cdn.example.com/achievement.png')
    })

    it('returns failure when API fails with useStub false', async () => {
      mockRequest.mockRejectedValue(new Error('Network error'))
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generateAchievementImage('streak7', '旺财', 'dog')
      expect(result.success).toBe(false)
    })
  })

  describe('seedreamAdapter singleton', () => {
    it('is an instance of SeedreamAdapter', () => {
      expect(seedreamAdapter).toBeInstanceOf(SeedreamAdapter)
    })

    it('behaves as useStub=true by default', async () => {
      const result = await seedreamAdapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression })
      expect(result.success).toBe(false)
    })
  })

  describe('different expression configs', () => {
    it('handles worried expression without generating SVG face', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: worriedExpression })
      expect(result.success).toBe(false)
      expect(getPetFaceDataUri).not.toHaveBeenCalled()
    })

    it('handles sleepy expression without generating SVG face', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'cat', expression: sleepyExpression })
      expect(result.success).toBe(false)
      expect(getPetFaceDataUri).not.toHaveBeenCalled()
    })
  })
})
