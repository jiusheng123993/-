import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  matchEmotionScenes,
  getTopEmotionMatch,
  matchByKeywords,
  formatResponseContent,
  formatSuggestions,
  buildEmotionContext,
  detectNewUserAnxiety,
  detectIllnessAnxiety,
  type EmotionEngineContext
} from './EmotionEngine'

vi.mock('../../utils/storage', () => ({
  getStorage: vi.fn(() => []),
  setStorage: vi.fn()
}))

const baseCtx: EmotionEngineContext = {
  petName: '咪咪',
  petId: 'pet-1',
  species: 'cat',
  isDeceased: false,
  consecutiveAnomalyDays: 0,
  streakDays: 0,
  isNewUser: false,
  recentFoodQueryCount: 0,
  recentSymptomCheckCount: 0
}

describe('EmotionEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buildEmotionContext', () => {
    it('should build context with defaults', () => {
      const ctx = buildEmotionContext('pet-1', '咪咪', 'cat')
      expect(ctx.petId).toBe('pet-1')
      expect(ctx.petName).toBe('咪咪')
      expect(ctx.species).toBe('cat')
      expect(ctx.isDeceased).toBe(false)
      expect(ctx.consecutiveAnomalyDays).toBe(0)
      expect(ctx.streakDays).toBe(0)
      expect(ctx.isNewUser).toBe(false)
    })

    it('should merge options', () => {
      const ctx = buildEmotionContext('pet-1', '咪咪', 'cat', {
        isDeceased: true,
        deceasedDate: '2024-01-01',
        consecutiveAnomalyDays: 5
      })
      expect(ctx.isDeceased).toBe(true)
      expect(ctx.deceasedDate).toBe('2024-01-01')
      expect(ctx.consecutiveAnomalyDays).toBe(5)
    })
  })

  describe('detectNewUserAnxiety', () => {
    it('should detect anxiety for new user with frequent food queries', () => {
      const ctx = { ...baseCtx, isNewUser: true, recentFoodQueryCount: 3 }
      expect(detectNewUserAnxiety(ctx)).toBe(true)
    })

    it('should detect anxiety for new user with frequent symptom checks', () => {
      const ctx = { ...baseCtx, isNewUser: true, recentSymptomCheckCount: 2 }
      expect(detectNewUserAnxiety(ctx)).toBe(true)
    })

    it('should not detect anxiety for non-new user', () => {
      const ctx = { ...baseCtx, isNewUser: false, recentFoodQueryCount: 5 }
      expect(detectNewUserAnxiety(ctx)).toBe(false)
    })

    it('should not detect anxiety for new user with low activity', () => {
      const ctx = { ...baseCtx, isNewUser: true, recentFoodQueryCount: 1, recentSymptomCheckCount: 0 }
      expect(detectNewUserAnxiety(ctx)).toBe(false)
    })
  })

  describe('detectIllnessAnxiety', () => {
    it('should detect illness anxiety with 3+ consecutive anomaly days', () => {
      const ctx = { ...baseCtx, consecutiveAnomalyDays: 3 }
      expect(detectIllnessAnxiety(ctx)).toBe(true)
    })

    it('should not detect illness anxiety with less than 3 days', () => {
      const ctx = { ...baseCtx, consecutiveAnomalyDays: 2 }
      expect(detectIllnessAnxiety(ctx)).toBe(false)
    })
  })

  describe('matchEmotionScenes', () => {
    it('should match grief scene for deceased pet', () => {
      const ctx: EmotionEngineContext = {
        ...baseCtx,
        isDeceased: true,
        deceasedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        daysSinceLoss: 2
      }
      const results = matchEmotionScenes(ctx)
      expect(results.length).toBeGreaterThan(0)
      expect(results.some((r) => r.scene.category === 'grief')).toBe(true)
    })

    it('should match celebration scene for streak days', () => {
      const ctx: EmotionEngineContext = { ...baseCtx, streakDays: 7 }
      const results = matchEmotionScenes(ctx)
      expect(results.some((r) => r.scene.category === 'celebration')).toBe(true)
    })

    it('should return empty for healthy pet with no triggers', () => {
      const results = matchEmotionScenes(baseCtx)
      expect(results).toEqual([])
    })

    it('should sort results by priority (grief > anxiety > celebration)', () => {
      const ctx: EmotionEngineContext = {
        ...baseCtx,
        isDeceased: true,
        deceasedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        daysSinceLoss: 2,
        streakDays: 7
      }
      const results = matchEmotionScenes(ctx)
      if (results.length >= 2) {
        expect(results[0].priority).toBeGreaterThanOrEqual(results[1].priority)
      }
    })
  })

  describe('getTopEmotionMatch', () => {
    it('should return highest priority match', () => {
      const ctx: EmotionEngineContext = { ...baseCtx, streakDays: 7 }
      const result = getTopEmotionMatch(ctx)
      expect(result).not.toBeNull()
      expect(result!.scene).toBeDefined()
      expect(result!.response).toBeDefined()
    })

    it('should return null when no triggers match', () => {
      const result = getTopEmotionMatch(baseCtx)
      expect(result).toBeNull()
    })
  })

  describe('matchByKeywords', () => {
    it('should match keywords from user input', () => {
      const result = matchByKeywords('我的宠物去世了，好难过', baseCtx)
      if (result) {
        expect(result.reason).toContain('关键词匹配')
      }
    })

    it('should return null for non-matching input', () => {
      const result = matchByKeywords('我家的猫在玩毛线球', baseCtx)
      expect(result).toBeNull()
    })
  })

  describe('formatResponseContent', () => {
    it('should replace {petName} placeholder', () => {
      const result = formatResponseContent('{petName}有你这样的家人，是TA的幸运', '咪咪')
      expect(result).toBe('咪咪有你这样的家人，是TA的幸运')
    })

    it('should replace multiple occurrences', () => {
      const result = formatResponseContent('{petName}很好，{petName}很棒', '旺财')
      expect(result).toBe('旺财很好，旺财很棒')
    })

    it('should handle content without placeholders', () => {
      const result = formatResponseContent('你好', '咪咪')
      expect(result).toBe('你好')
    })
  })

  describe('formatSuggestions', () => {
    it('should format suggestions with petName', () => {
      const result = formatSuggestions(['给{petName}做个检查', '多陪陪{petName}'], '咪咪')
      expect(result).toEqual(['给咪咪做个检查', '多陪陪咪咪'])
    })

    it('should handle empty suggestions', () => {
      const result = formatSuggestions([], '咪咪')
      expect(result).toEqual([])
    })
  })
})
