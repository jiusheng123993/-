import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockGetStorage,
  mockSetStorage,
} = vi.hoisted(() => ({
  mockGetStorage: vi.fn<() => unknown>(() => null),
  mockSetStorage: vi.fn(),
}))

vi.mock('../../utils/storage', () => ({
  getStorage: mockGetStorage,
  setStorage: mockSetStorage,
}))

vi.mock('../../data/petKnowledge/emotionScenes', () => ({
  EMOTION_SCENES: [
    {
      id: 'test_grief',
      name: '测试悲伤',
      category: 'grief',
      triggerKeywords: ['离世', '走了'],
      triggerConditions: [
        { type: 'time_after_loss', params: { daysAfterLoss: 0, daysAfterLossMax: 3 } },
      ],
      responses: [
        {
          id: 'r1',
          tone: 'gentle',
          content: '{petName}已经离开了',
          suggestions: ['给{petName}写一封信', '纪念{petName}'],
        },
      ],
      followUpScenes: [],
    },
    {
      id: 'test_anxiety',
      name: '测试焦虑',
      category: 'anxiety',
      triggerKeywords: ['担心', '害怕'],
      triggerConditions: [
        { type: 'checkin_streak', params: { streakDays: 7 } },
      ],
      responses: [
        {
          id: 'r2',
          tone: 'empathetic',
          content: '{petName}最近状态不太好',
          suggestions: ['观察{petName}的饮食', '记录{petName}的症状'],
        },
      ],
      followUpScenes: [],
    },
  ],
  EmotionTrigger: undefined,
  EmotionResponse: undefined,
  EmotionScene: undefined,
}))

import {
  useEmotionStore,
  incrementFoodQueryCount,
  incrementSymptomCheckCount,
  isNewUser,
  getRecentFoodQueryCount,
  getRecentSymptomCheckCount,
} from '../emotionStore'

const defaultCtx = {
  petName: '小白',
  petId: 'pet1',
  species: 'dog' as const,
  isDeceased: false,
  consecutiveAnomalyDays: 0,
  streakDays: 0,
  isNewUser: false,
  recentFoodQueryCount: 0,
  recentSymptomCheckCount: 0,
}

const griefCtx = {
  ...defaultCtx,
  isDeceased: true,
  deceasedDate: new Date().toISOString(),
  daysSinceLoss: 1,
}

const streakCtx = {
  ...defaultCtx,
  streakDays: 7,
}

describe('emotionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetStorage.mockReturnValue(null)
    useEmotionStore.setState({
      activeCard: null,
      formattedContent: '',
      formattedSuggestions: [],
      isCardVisible: false,
    })
  })

  describe('初始状态', () => {
    it('activeCard 为 null', () => {
      expect(useEmotionStore.getState().activeCard).toBeNull()
    })

    it('formattedContent 为空字符串', () => {
      expect(useEmotionStore.getState().formattedContent).toBe('')
    })

    it('formattedSuggestions 为空数组', () => {
      expect(useEmotionStore.getState().formattedSuggestions).toEqual([])
    })

    it('isCardVisible 为 false', () => {
      expect(useEmotionStore.getState().isCardVisible).toBe(false)
    })
  })

  describe('evaluateContext', () => {
    it('匹配成功时设置 activeCard、formattedContent、formattedSuggestions、isCardVisible', () => {
      useEmotionStore.getState().evaluateContext(griefCtx)

      const state = useEmotionStore.getState()
      expect(state.activeCard).not.toBeNull()
      expect(state.activeCard?.scene.id).toBe('test_grief')
      expect(state.formattedContent).toContain('小白')
      expect(state.formattedSuggestions.length).toBeGreaterThan(0)
      expect(state.isCardVisible).toBe(true)
    })

    it('匹配失败时状态不变', () => {
      useEmotionStore.getState().evaluateContext(defaultCtx)

      const state = useEmotionStore.getState()
      expect(state.activeCard).toBeNull()
      expect(state.formattedContent).toBe('')
      expect(state.formattedSuggestions).toEqual([])
      expect(state.isCardVisible).toBe(false)
    })

    it('格式化内容替换 petName 占位符', () => {
      useEmotionStore.getState().evaluateContext(griefCtx)

      const state = useEmotionStore.getState()
      expect(state.formattedContent).toBe('小白已经离开了')
      expect(state.formattedSuggestions).toEqual(['给小白写一封信', '纪念小白'])
    })

    it('连续打卡触发焦虑场景', () => {
      useEmotionStore.getState().evaluateContext(streakCtx)

      const state = useEmotionStore.getState()
      expect(state.activeCard).not.toBeNull()
      expect(state.activeCard?.scene.id).toBe('test_anxiety')
      expect(state.formattedContent).toContain('小白')
    })
  })

  describe('evaluateInput', () => {
    it('关键词匹配成功时设置状态', () => {
      useEmotionStore.getState().evaluateInput('我家宠物离世了', defaultCtx)

      const state = useEmotionStore.getState()
      expect(state.activeCard).not.toBeNull()
      expect(state.activeCard?.scene.id).toBe('test_grief')
      expect(state.formattedContent).toContain('小白')
      expect(state.isCardVisible).toBe(true)
    })

    it('关键词匹配焦虑场景', () => {
      useEmotionStore.getState().evaluateInput('我很担心', defaultCtx)

      const state = useEmotionStore.getState()
      expect(state.activeCard).not.toBeNull()
      expect(state.activeCard?.scene.id).toBe('test_anxiety')
    })

    it('无匹配关键词时状态不变', () => {
      useEmotionStore.getState().evaluateInput('今天天气不错', defaultCtx)

      const state = useEmotionStore.getState()
      expect(state.activeCard).toBeNull()
      expect(state.formattedContent).toBe('')
      expect(state.formattedSuggestions).toEqual([])
      expect(state.isCardVisible).toBe(false)
    })

    it('格式化建议替换 petName 占位符', () => {
      useEmotionStore.getState().evaluateInput('离世', defaultCtx)

      const state = useEmotionStore.getState()
      expect(state.formattedSuggestions).toEqual(['给小白写一封信', '纪念小白'])
    })
  })

  describe('dismissCard', () => {
    it('隐藏卡片并清空 activeCard', () => {
      useEmotionStore.getState().evaluateContext(griefCtx)
      expect(useEmotionStore.getState().isCardVisible).toBe(true)

      useEmotionStore.getState().dismissCard()

      const state = useEmotionStore.getState()
      expect(state.isCardVisible).toBe(false)
      expect(state.activeCard).toBeNull()
    })

    it('不清空 formattedContent 和 formattedSuggestions', () => {
      useEmotionStore.getState().evaluateContext(griefCtx)

      useEmotionStore.getState().dismissCard()

      const state = useEmotionStore.getState()
      expect(state.formattedContent).toBe('小白已经离开了')
      expect(state.formattedSuggestions).toEqual(['给小白写一封信', '纪念小白'])
    })
  })

  describe('clearAll', () => {
    it('重置所有状态为初始值', () => {
      useEmotionStore.getState().evaluateContext(griefCtx)
      expect(useEmotionStore.getState().isCardVisible).toBe(true)

      useEmotionStore.getState().clearAll()

      const state = useEmotionStore.getState()
      expect(state.activeCard).toBeNull()
      expect(state.formattedContent).toBe('')
      expect(state.formattedSuggestions).toEqual([])
      expect(state.isCardVisible).toBe(false)
    })
  })

  describe('incrementFoodQueryCount', () => {
    it('storage 为空时初始化并递增 foodQueryCount', () => {
      mockGetStorage.mockReturnValue(null)

      incrementFoodQueryCount()

      expect(mockSetStorage).toHaveBeenCalledWith('emotion_behavior', expect.objectContaining({
        foodQueryCount: 1,
        symptomCheckCount: 0,
        firstSeenAt: expect.any(String),
        lastUpdatedAt: expect.any(String),
      }))
    })

    it('storage 有数据时递增 foodQueryCount', () => {
      const existing = {
        foodQueryCount: 5,
        symptomCheckCount: 2,
        firstSeenAt: '2025-01-01T00:00:00.000Z',
        lastUpdatedAt: '2025-01-02T00:00:00.000Z',
      }
      mockGetStorage.mockReturnValue(existing)

      incrementFoodQueryCount()

      expect(mockSetStorage).toHaveBeenCalledWith('emotion_behavior', expect.objectContaining({
        foodQueryCount: 6,
        symptomCheckCount: 2,
        firstSeenAt: '2025-01-01T00:00:00.000Z',
        lastUpdatedAt: expect.any(String),
      }))
    })

    it('已有 firstSeenAt 时不覆盖', () => {
      const existing = {
        foodQueryCount: 1,
        symptomCheckCount: 0,
        firstSeenAt: '2025-01-01T00:00:00.000Z',
        lastUpdatedAt: '2025-01-01T00:00:00.000Z',
      }
      mockGetStorage.mockReturnValue(existing)

      incrementFoodQueryCount()

      expect(mockSetStorage).toHaveBeenCalledWith('emotion_behavior', expect.objectContaining({
        firstSeenAt: '2025-01-01T00:00:00.000Z',
      }))
    })

    it('首次写入时设置 firstSeenAt', () => {
      mockGetStorage.mockReturnValue(null)

      incrementFoodQueryCount()

      expect(mockSetStorage).toHaveBeenCalledWith('emotion_behavior', expect.objectContaining({
        firstSeenAt: expect.any(String),
      }))
    })
  })

  describe('incrementSymptomCheckCount', () => {
    it('storage 为空时初始化并递增 symptomCheckCount', () => {
      mockGetStorage.mockReturnValue(null)

      incrementSymptomCheckCount()

      expect(mockSetStorage).toHaveBeenCalledWith('emotion_behavior', expect.objectContaining({
        foodQueryCount: 0,
        symptomCheckCount: 1,
        firstSeenAt: expect.any(String),
        lastUpdatedAt: expect.any(String),
      }))
    })

    it('storage 有数据时递增 symptomCheckCount', () => {
      const existing = {
        foodQueryCount: 3,
        symptomCheckCount: 4,
        firstSeenAt: '2025-01-01T00:00:00.000Z',
        lastUpdatedAt: '2025-01-02T00:00:00.000Z',
      }
      mockGetStorage.mockReturnValue(existing)

      incrementSymptomCheckCount()

      expect(mockSetStorage).toHaveBeenCalledWith('emotion_behavior', expect.objectContaining({
        foodQueryCount: 3,
        symptomCheckCount: 5,
        firstSeenAt: '2025-01-01T00:00:00.000Z',
        lastUpdatedAt: expect.any(String),
      }))
    })
  })

  describe('isNewUser', () => {
    it('firstSeenAt 为 null 时返回 true', () => {
      mockGetStorage.mockReturnValue({
        foodQueryCount: 0,
        symptomCheckCount: 0,
        firstSeenAt: null,
        lastUpdatedAt: null,
      })

      expect(isNewUser()).toBe(true)
    })

    it('firstSeenAt 在 7 天以内时返回 true', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 3)
      mockGetStorage.mockReturnValue({
        foodQueryCount: 1,
        symptomCheckCount: 0,
        firstSeenAt: recentDate.toISOString(),
        lastUpdatedAt: recentDate.toISOString(),
      })

      expect(isNewUser()).toBe(true)
    })

    it('firstSeenAt 超过 7 天时返回 false', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10)
      mockGetStorage.mockReturnValue({
        foodQueryCount: 5,
        symptomCheckCount: 2,
        firstSeenAt: oldDate.toISOString(),
        lastUpdatedAt: oldDate.toISOString(),
      })

      expect(isNewUser()).toBe(false)
    })

    it('firstSeenAt 恰好 7 天时返回 true', () => {
      const exactDate = new Date()
      exactDate.setDate(exactDate.getDate() - 7)
      mockGetStorage.mockReturnValue({
        foodQueryCount: 1,
        symptomCheckCount: 0,
        firstSeenAt: exactDate.toISOString(),
        lastUpdatedAt: exactDate.toISOString(),
      })

      expect(isNewUser()).toBe(true)
    })

    it('storage 为 null 时返回 true', () => {
      mockGetStorage.mockReturnValue(null)

      expect(isNewUser()).toBe(true)
    })
  })

  describe('getRecentFoodQueryCount', () => {
    it('返回 storage 中的 foodQueryCount', () => {
      mockGetStorage.mockReturnValue({
        foodQueryCount: 7,
        symptomCheckCount: 3,
        firstSeenAt: '2025-01-01T00:00:00.000Z',
        lastUpdatedAt: '2025-01-02T00:00:00.000Z',
      })

      expect(getRecentFoodQueryCount()).toBe(7)
    })

    it('storage 为 null 时返回 0', () => {
      mockGetStorage.mockReturnValue(null)

      expect(getRecentFoodQueryCount()).toBe(0)
    })
  })

  describe('getRecentSymptomCheckCount', () => {
    it('返回 storage 中的 symptomCheckCount', () => {
      mockGetStorage.mockReturnValue({
        foodQueryCount: 2,
        symptomCheckCount: 9,
        firstSeenAt: '2025-01-01T00:00:00.000Z',
        lastUpdatedAt: '2025-01-02T00:00:00.000Z',
      })

      expect(getRecentSymptomCheckCount()).toBe(9)
    })

    it('storage 为 null 时返回 0', () => {
      mockGetStorage.mockReturnValue(null)

      expect(getRecentSymptomCheckCount()).toBe(0)
    })
  })

  describe('状态流转', () => {
    it('evaluateContext 后 dismissCard 再 evaluateContext 恢复卡片', () => {
      useEmotionStore.getState().evaluateContext(griefCtx)
      expect(useEmotionStore.getState().isCardVisible).toBe(true)

      useEmotionStore.getState().dismissCard()
      expect(useEmotionStore.getState().isCardVisible).toBe(false)
      expect(useEmotionStore.getState().activeCard).toBeNull()

      useEmotionStore.getState().evaluateContext(griefCtx)
      expect(useEmotionStore.getState().isCardVisible).toBe(true)
      expect(useEmotionStore.getState().activeCard).not.toBeNull()
    })

    it('evaluateInput 后 clearAll 完全重置', () => {
      useEmotionStore.getState().evaluateInput('离世', defaultCtx)
      expect(useEmotionStore.getState().isCardVisible).toBe(true)

      useEmotionStore.getState().clearAll()
      const state = useEmotionStore.getState()
      expect(state.activeCard).toBeNull()
      expect(state.formattedContent).toBe('')
      expect(state.formattedSuggestions).toEqual([])
      expect(state.isCardVisible).toBe(false)
    })

    it('连续 evaluateContext 后者覆盖前者', () => {
      useEmotionStore.getState().evaluateContext(griefCtx)
      expect(useEmotionStore.getState().activeCard?.scene.id).toBe('test_grief')

      useEmotionStore.getState().evaluateContext(streakCtx)
      expect(useEmotionStore.getState().activeCard?.scene.id).toBe('test_anxiety')
    })

    it('dismissCard 后 clearAll 幂等', () => {
      useEmotionStore.getState().evaluateContext(griefCtx)
      useEmotionStore.getState().dismissCard()
      useEmotionStore.getState().clearAll()

      const state = useEmotionStore.getState()
      expect(state.activeCard).toBeNull()
      expect(state.formattedContent).toBe('')
      expect(state.formattedSuggestions).toEqual([])
      expect(state.isCardVisible).toBe(false)
    })
  })
})
