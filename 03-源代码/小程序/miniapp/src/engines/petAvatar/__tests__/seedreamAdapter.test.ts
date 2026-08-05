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
      await expect(result).resolves.toEqual({ success: true, imageUrl: 'data:image/svg+xml;base64,stubdata' })
    })

    it('can set useStub to false', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: { success: true, data: { url: 'https://cdn.example.com/avatar.png', isPlaceholder: false } } })
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression })
      expect(result.success).toBe(true)
    })
  })

  describe('generatePetImage with stub', () => {
    it('returns success with dataUri for dog species', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })

    it('returns success with dataUri for cat species', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'cat', expression: happyExpression })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })

    it('calls getPetFaceDataUri with correct expression, species and size 256', async () => {
      const adapter = new SeedreamAdapter(true)
      await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: excitedExpression })
      expect(getPetFaceDataUri).toHaveBeenCalledWith(excitedExpression, 'dog', 256)
    })

    it('calls getPetFaceDataUri with cat species', async () => {
      const adapter = new SeedreamAdapter(true)
      await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'cat', expression: worriedExpression })
      expect(getPetFaceDataUri).toHaveBeenCalledWith(worriedExpression, 'cat', 256)
    })

    it('returns dataUri for cartoon style', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression, style: 'cartoon' })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })

    it('returns dataUri for realistic style', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'cat', expression: excitedExpression, style: 'realistic' })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })

    it('passes breed and color through without error in stub mode', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression, breed: '金毛', color: '金' })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
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

    it('falls back to stub when API fails', async () => {
      mockRequest.mockRejectedValue(new Error('Network error'))
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })

    it('falls back to stub when API returns error', async () => {
      mockRequest.mockResolvedValue({ statusCode: 500, data: { error: 'Internal error' } })
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'cat', expression: excitedExpression })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })

    it('handles 402 payment required', async () => {
      mockRequest.mockResolvedValue({ statusCode: 402, data: {} })
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })

    it('handles 429 rate limit', async () => {
      mockRequest.mockResolvedValue({ statusCode: 429, data: {} })
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })
  })

  describe('generateAchievementImage', () => {
    it('returns success with dataUri in stub mode', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generateAchievementImage('streak7', '旺财', 'dog')
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })

    it('calls getPetFaceDataUri with excited expression and correct species in stub mode', async () => {
      const adapter = new SeedreamAdapter(true)
      await adapter.generateAchievementImage('streak7', '旺财', 'dog')
      const excitedFromMap = { expression: 'excited', label: '兴奋', color: '#FF69B4', eyes: 'star', mouth: 'open_smile', accessory: 'confetti', animation: 'jump' }
      expect(getPetFaceDataUri).toHaveBeenCalledWith(excitedFromMap, 'dog', 256)
    })

    it('calls getPetFaceDataUri with cat species in stub mode', async () => {
      const adapter = new SeedreamAdapter(true)
      await adapter.generateAchievementImage('vaccine', '咪咪', 'cat')
      const excitedFromMap = { expression: 'excited', label: '兴奋', color: '#FF69B4', eyes: 'star', mouth: 'open_smile', accessory: 'confetti', animation: 'jump' }
      expect(getPetFaceDataUri).toHaveBeenCalledWith(excitedFromMap, 'cat', 256)
    })

    it('returns real image when API succeeds with useStub false', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: { success: true, imageUrl: 'https://cdn.example.com/achievement.png' } })
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generateAchievementImage('streak7', '旺财', 'dog')
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('https://cdn.example.com/achievement.png')
    })

    it('falls back to stub when API fails with useStub false', async () => {
      mockRequest.mockRejectedValue(new Error('Network error'))
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generateAchievementImage('streak7', '旺财', 'dog')
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })
  })

  describe('seedreamAdapter singleton', () => {
    it('is an instance of SeedreamAdapter', () => {
      expect(seedreamAdapter).toBeInstanceOf(SeedreamAdapter)
    })

    it('behaves as useStub=true by default', async () => {
      const result = await seedreamAdapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: happyExpression })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })
  })

  describe('different expression configs', () => {
    it('handles worried expression', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'dog', expression: worriedExpression })
      expect(result.success).toBe(true)
      expect(getPetFaceDataUri).toHaveBeenCalledWith(worriedExpression, 'dog', 256)
    })

    it('handles sleepy expression', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ petId: TEST_PET_ID, species: 'cat', expression: sleepyExpression })
      expect(result.success).toBe(true)
      expect(getPetFaceDataUri).toHaveBeenCalledWith(sleepyExpression, 'cat', 256)
    })
  })
})
