import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SeedreamAdapter, seedreamAdapter } from '../seedreamAdapter'
import { getPetFaceDataUri } from '../svgRenderer'
import type { ExpressionConfig } from '../expressionEngine'

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

describe('SeedreamAdapter', () => {
  beforeEach(() => {
    vi.mocked(getPetFaceDataUri).mockClear()
    vi.mocked(getPetFaceDataUri).mockReturnValue('data:image/svg+xml;base64,stubdata')
  })

  describe('constructor', () => {
    it('defaults useStub to true', async () => {
      const adapter = new SeedreamAdapter()
      const result = adapter.generatePetImage({ species: 'dog', expression: happyExpression })
      await expect(result).resolves.toEqual({ success: true, imageUrl: 'data:image/svg+xml;base64,stubdata' })
    })

    it('can set useStub to false', async () => {
      const adapter = new SeedreamAdapter(false)
      const result = adapter.generatePetImage({ species: 'dog', expression: happyExpression })
      await expect(result).resolves.toEqual({ success: false, error: 'Seedream API 尚未接入' })
    })
  })

  describe('generatePetImage with stub', () => {
    it('returns success with dataUri for dog species', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ species: 'dog', expression: happyExpression })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })

    it('returns success with dataUri for cat species', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ species: 'cat', expression: happyExpression })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })

    it('calls getPetFaceDataUri with correct expression, species and size 256', async () => {
      const adapter = new SeedreamAdapter(true)
      await adapter.generatePetImage({ species: 'dog', expression: excitedExpression })
      expect(getPetFaceDataUri).toHaveBeenCalledWith(excitedExpression, 'dog', 256)
    })

    it('calls getPetFaceDataUri with cat species', async () => {
      const adapter = new SeedreamAdapter(true)
      await adapter.generatePetImage({ species: 'cat', expression: worriedExpression })
      expect(getPetFaceDataUri).toHaveBeenCalledWith(worriedExpression, 'cat', 256)
    })

    it('returns dataUri for cartoon style', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ species: 'dog', expression: happyExpression, style: 'cartoon' })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })

    it('returns dataUri for realistic style', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ species: 'cat', expression: excitedExpression, style: 'realistic' })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })

    it('passes breed and color through without error in stub mode', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ species: 'dog', expression: happyExpression, breed: '金毛', color: '金' })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })
  })

  describe('generatePetImage without stub', () => {
    it('returns success=false with error message', async () => {
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generatePetImage({ species: 'dog', expression: happyExpression })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Seedream API 尚未接入')
      expect(result.imageUrl).toBeUndefined()
    })

    it('does not call getPetFaceDataUri when useStub is false', async () => {
      const adapter = new SeedreamAdapter(false)
      await adapter.generatePetImage({ species: 'cat', expression: excitedExpression })
      expect(getPetFaceDataUri).not.toHaveBeenCalled()
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

    it('returns success=false with error when useStub is false', async () => {
      const adapter = new SeedreamAdapter(false)
      const result = await adapter.generateAchievementImage('streak7', '旺财', 'dog')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Seedream API 尚未接入')
      expect(result.imageUrl).toBeUndefined()
    })
  })

  describe('seedreamAdapter singleton', () => {
    it('is an instance of SeedreamAdapter', () => {
      expect(seedreamAdapter).toBeInstanceOf(SeedreamAdapter)
    })

    it('behaves as useStub=true by default', async () => {
      const result = await seedreamAdapter.generatePetImage({ species: 'dog', expression: happyExpression })
      expect(result.success).toBe(true)
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,stubdata')
    })
  })

  describe('different expression configs', () => {
    it('handles worried expression', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ species: 'dog', expression: worriedExpression })
      expect(result.success).toBe(true)
      expect(getPetFaceDataUri).toHaveBeenCalledWith(worriedExpression, 'dog', 256)
    })

    it('handles sleepy expression', async () => {
      const adapter = new SeedreamAdapter(true)
      const result = await adapter.generatePetImage({ species: 'cat', expression: sleepyExpression })
      expect(result.success).toBe(true)
      expect(getPetFaceDataUri).toHaveBeenCalledWith(sleepyExpression, 'cat', 256)
    })
  })
})
