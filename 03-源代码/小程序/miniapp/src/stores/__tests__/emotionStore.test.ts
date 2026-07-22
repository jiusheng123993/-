import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { EmotionIntervention, EmotionSceneType } from '../../engines/emotion'

const { mockEmotion, mockStorage } = vi.hoisted(() => ({
  mockEmotion: {
    detectSickAnxiety: vi.fn(),
    getSickAnxietyMessage: vi.fn(() => '理解你的担心'),
    getSickAnxietyLevel: vi.fn(() => 'mild' as const),
    detectNewOwnerAnxiety: vi.fn(),
    getNewOwnerAnxietyMessage: vi.fn(() => '新手家长你好'),
    createIntervention: vi.fn(() => ({
      id: 'intervention-1',
      type: 'sick_anxiety' as EmotionSceneType,
      userId: 'user1',
      message: '理解你的担心',
      context: {},
      petId: 'pet1',
      createdAt: Date.now(),
      userResponded: false,
      anxietyLevel: 'mild' as const,
      requiresCrisisReferral: false,
    }) as EmotionIntervention),
  },
  mockStorage: {
    getStorageArray: vi.fn(() => []),
    setStorage: vi.fn(),
  },
}))

vi.mock('../../engines/emotion', () => mockEmotion)
vi.mock('../../utils/storage', () => mockStorage)

import { useEmotionStore } from '../emotionStore'

describe('emotionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEmotionStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have no active intervention', () => {
      const state = useEmotionStore.getState()
      expect(state.activeIntervention).toBeNull()
    })

    it('should have empty dismissedIds', () => {
      const state = useEmotionStore.getState()
      expect(state.dismissedIds).toEqual([])
    })

    it('should have empty checkRecords', () => {
      const state = useEmotionStore.getState()
      expect(state.checkRecords).toEqual([])
    })

    it('should have isLoading as false', () => {
      const state = useEmotionStore.getState()
      expect(state.isLoading).toBe(false)
    })
  })

  describe('checkSickAnxiety', () => {
    it('should set activeIntervention when anxiety detected', () => {
      mockEmotion.detectSickAnxiety.mockReturnValue(true)
      mockEmotion.createIntervention.mockReturnValue({
        id: 'intv-sick-1',
        type: 'sick_anxiety' as EmotionSceneType,
        userId: 'user1',
        message: '理解你的担心',
        context: {},
        petId: 'pet1',
        createdAt: Date.now(),
        userResponded: false,
        anxietyLevel: 'mild' as const,
        requiresCrisisReferral: false,
      } as EmotionIntervention)

      useEmotionStore.getState().checkSickAnxiety(
        'pet1', '小橘', 3, 5, ['呕吐', '腹泻'], 0, 'user1',
      )

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).not.toBeNull()
      expect(state.activeIntervention!.id).toBe('intv-sick-1')
      expect(state.activeIntervention!.type).toBe('sick_anxiety')
      expect(state.checkRecords).toHaveLength(1)
      expect(state.checkRecords[0].type).toBe('sick_anxiety')
      expect(state.checkRecords[0].petId).toBe('pet1')
      expect(mockEmotion.detectSickAnxiety).toHaveBeenCalledWith({
        petId: 'pet1',
        petName: '小橘',
        consecutiveAnomalyDays: 3,
        userOpenFrequency: 5,
        lastAnomalyItems: ['呕吐', '腹泻'],
        previousRecoveryCount: 0,
      })
      expect(mockEmotion.getSickAnxietyMessage).toHaveBeenCalled()
      expect(mockEmotion.getSickAnxietyLevel).toHaveBeenCalled()
      expect(mockEmotion.createIntervention).toHaveBeenCalledWith(
        'sick_anxiety', 'user1', '理解你的担心',
        expect.any(Object), 'pet1', 'mild',
      )
      expect(mockStorage.setStorage).toHaveBeenCalled()
    })

    it('should do nothing when detectSickAnxiety returns false', () => {
      mockEmotion.detectSickAnxiety.mockReturnValue(false)

      useEmotionStore.getState().checkSickAnxiety(
        'pet1', '小橘', 0, 1, [], 0, 'user1',
      )

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).toBeNull()
      expect(state.checkRecords).toEqual([])
      expect(mockEmotion.getSickAnxietyMessage).not.toHaveBeenCalled()
      expect(mockEmotion.createIntervention).not.toHaveBeenCalled()
    })

    it('should skip if recently checked within cooldown', () => {
      useEmotionStore.setState({
        checkRecords: [
          { type: 'sick_anxiety' as EmotionSceneType, petId: 'pet1', checkedAt: Date.now() - 1000 },
        ],
      })

      useEmotionStore.getState().checkSickAnxiety(
        'pet1', '小橘', 3, 5, ['呕吐'], 0, 'user1',
      )

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).toBeNull()
      expect(mockEmotion.detectSickAnxiety).not.toHaveBeenCalled()
    })

    it('should proceed if check record is older than cooldown', () => {
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000
      useEmotionStore.setState({
        checkRecords: [
          { type: 'sick_anxiety' as EmotionSceneType, petId: 'pet1', checkedAt: oldTimestamp },
        ],
      })
      mockEmotion.detectSickAnxiety.mockReturnValue(true)
      mockEmotion.createIntervention.mockReturnValue({
        id: 'intv-sick-2',
        type: 'sick_anxiety' as EmotionSceneType,
        userId: 'user1',
        message: '理解你的担心',
        context: {},
        petId: 'pet1',
        createdAt: Date.now(),
        userResponded: false,
        anxietyLevel: 'mild' as const,
        requiresCrisisReferral: false,
      } as EmotionIntervention)

      useEmotionStore.getState().checkSickAnxiety(
        'pet1', '小橘', 3, 5, ['呕吐'], 0, 'user1',
      )

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).not.toBeNull()
      expect(mockEmotion.detectSickAnxiety).toHaveBeenCalled()
    })

    it('should skip if intervention was dismissed', () => {
      mockEmotion.detectSickAnxiety.mockReturnValue(true)
      mockEmotion.createIntervention.mockReturnValue({
        id: 'intv-sick-dismissed',
        type: 'sick_anxiety' as EmotionSceneType,
        userId: 'user1',
        message: '理解你的担心',
        context: {},
        petId: 'pet1',
        createdAt: Date.now(),
        userResponded: false,
        anxietyLevel: 'mild' as const,
        requiresCrisisReferral: false,
      } as EmotionIntervention)
      useEmotionStore.setState({
        dismissedIds: ['intv-sick-dismissed'],
      })

      useEmotionStore.getState().checkSickAnxiety(
        'pet1', '小橘', 3, 5, ['呕吐'], 0, 'user1',
      )

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).toBeNull()
      expect(state.checkRecords).toEqual([])
    })

    it('should not skip for different petId even if same type was recently checked', () => {
      useEmotionStore.setState({
        checkRecords: [
          { type: 'sick_anxiety' as EmotionSceneType, petId: 'pet1', checkedAt: Date.now() - 1000 },
        ],
      })
      mockEmotion.detectSickAnxiety.mockReturnValue(true)
      mockEmotion.createIntervention.mockReturnValue({
        id: 'intv-sick-pet2',
        type: 'sick_anxiety' as EmotionSceneType,
        userId: 'user1',
        message: '理解你的担心',
        context: {},
        petId: 'pet2',
        createdAt: Date.now(),
        userResponded: false,
        anxietyLevel: 'mild' as const,
        requiresCrisisReferral: false,
      } as EmotionIntervention)

      useEmotionStore.getState().checkSickAnxiety(
        'pet2', '小白', 3, 5, ['呕吐'], 0, 'user1',
      )

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).not.toBeNull()
      expect(mockEmotion.detectSickAnxiety).toHaveBeenCalled()
    })
  })

  describe('checkNewOwnerAnxiety', () => {
    it('should set activeIntervention when anxiety detected', () => {
      mockEmotion.detectNewOwnerAnxiety.mockReturnValue(true)
      mockEmotion.createIntervention.mockReturnValue({
        id: 'intv-new-1',
        type: 'new_owner_anxiety' as EmotionSceneType,
        userId: 'user1',
        message: '新手家长你好',
        context: {},
        createdAt: Date.now(),
        userResponded: false,
        anxietyLevel: 'mild' as const,
        requiresCrisisReferral: false,
      } as EmotionIntervention)

      useEmotionStore.getState().checkNewOwnerAnxiety(
        'user1', 10, 2, 1, 30, false, '小橘', 'cat',
      )

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).not.toBeNull()
      expect(state.activeIntervention!.id).toBe('intv-new-1')
      expect(state.activeIntervention!.type).toBe('new_owner_anxiety')
      expect(state.checkRecords).toHaveLength(1)
      expect(state.checkRecords[0].type).toBe('new_owner_anxiety')
      expect(mockEmotion.detectNewOwnerAnxiety).toHaveBeenCalledWith({
        userId: 'user1',
        accountAgeDays: 10,
        foodQueryCount: 2,
        symptomCheckCount: 1,
        petAgeDays: 30,
        hasVaccineSchedule: false,
      })
      expect(mockEmotion.getNewOwnerAnxietyMessage).toHaveBeenCalledWith(
        expect.any(Object), 'cat', '小橘',
      )
      expect(mockEmotion.createIntervention).toHaveBeenCalledWith(
        'new_owner_anxiety', 'user1', '新手家长你好',
        expect.any(Object), undefined, 'mild',
      )
    })

    it('should do nothing when detectNewOwnerAnxiety returns false', () => {
      mockEmotion.detectNewOwnerAnxiety.mockReturnValue(false)

      useEmotionStore.getState().checkNewOwnerAnxiety(
        'user1', 10, 1, 0, 30, true, '小橘', 'cat',
      )

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).toBeNull()
      expect(state.checkRecords).toEqual([])
      expect(mockEmotion.getNewOwnerAnxietyMessage).not.toHaveBeenCalled()
      expect(mockEmotion.createIntervention).not.toHaveBeenCalled()
    })

    it('should skip if recently checked within 7-day cooldown', () => {
      useEmotionStore.setState({
        checkRecords: [
          { type: 'new_owner_anxiety' as EmotionSceneType, checkedAt: Date.now() - 1000 },
        ],
      })

      useEmotionStore.getState().checkNewOwnerAnxiety(
        'user1', 10, 5, 3, 30, false, '小橘', 'cat',
      )

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).toBeNull()
      expect(mockEmotion.detectNewOwnerAnxiety).not.toHaveBeenCalled()
    })

    it('should proceed if check record is older than 7-day cooldown', () => {
      const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000
      useEmotionStore.setState({
        checkRecords: [
          { type: 'new_owner_anxiety' as EmotionSceneType, checkedAt: oldTimestamp },
        ],
      })
      mockEmotion.detectNewOwnerAnxiety.mockReturnValue(true)
      mockEmotion.createIntervention.mockReturnValue({
        id: 'intv-new-2',
        type: 'new_owner_anxiety' as EmotionSceneType,
        userId: 'user1',
        message: '新手家长你好',
        context: {},
        createdAt: Date.now(),
        userResponded: false,
        anxietyLevel: 'mild' as const,
        requiresCrisisReferral: false,
      } as EmotionIntervention)

      useEmotionStore.getState().checkNewOwnerAnxiety(
        'user1', 10, 5, 3, 30, false, '小橘', 'cat',
      )

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).not.toBeNull()
      expect(mockEmotion.detectNewOwnerAnxiety).toHaveBeenCalled()
    })

    it('should skip if intervention was dismissed', () => {
      mockEmotion.detectNewOwnerAnxiety.mockReturnValue(true)
      mockEmotion.createIntervention.mockReturnValue({
        id: 'intv-new-dismissed',
        type: 'new_owner_anxiety' as EmotionSceneType,
        userId: 'user1',
        message: '新手家长你好',
        context: {},
        createdAt: Date.now(),
        userResponded: false,
        anxietyLevel: 'mild' as const,
        requiresCrisisReferral: false,
      } as EmotionIntervention)
      useEmotionStore.setState({
        dismissedIds: ['intv-new-dismissed'],
      })

      useEmotionStore.getState().checkNewOwnerAnxiety(
        'user1', 10, 5, 3, 30, false, '小橘', 'cat',
      )

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).toBeNull()
      expect(state.checkRecords).toEqual([])
    })

    it('should determine severe level when queryTotal >= 15', () => {
      mockEmotion.detectNewOwnerAnxiety.mockReturnValue(true)
      mockEmotion.createIntervention.mockReturnValue({
        id: 'intv-new-severe',
        type: 'new_owner_anxiety' as EmotionSceneType,
        userId: 'user1',
        message: '新手家长你好',
        context: {},
        createdAt: Date.now(),
        userResponded: false,
        anxietyLevel: 'severe' as const,
        requiresCrisisReferral: false,
      } as EmotionIntervention)

      useEmotionStore.getState().checkNewOwnerAnxiety(
        'user1', 10, 10, 8, 30, false, '小橘', 'cat',
      )

      expect(mockEmotion.createIntervention).toHaveBeenCalledWith(
        'new_owner_anxiety', 'user1', '新手家长你好',
        expect.any(Object), undefined, 'severe',
      )
    })

    it('should determine moderate level when queryTotal >= 8', () => {
      mockEmotion.detectNewOwnerAnxiety.mockReturnValue(true)
      mockEmotion.createIntervention.mockReturnValue({
        id: 'intv-new-moderate',
        type: 'new_owner_anxiety' as EmotionSceneType,
        userId: 'user1',
        message: '新手家长你好',
        context: {},
        createdAt: Date.now(),
        userResponded: false,
        anxietyLevel: 'moderate' as const,
        requiresCrisisReferral: false,
      } as EmotionIntervention)

      useEmotionStore.getState().checkNewOwnerAnxiety(
        'user1', 10, 5, 4, 30, false, '小橘', 'cat',
      )

      expect(mockEmotion.createIntervention).toHaveBeenCalledWith(
        'new_owner_anxiety', 'user1', '新手家长你好',
        expect.any(Object), undefined, 'moderate',
      )
    })

    it('should determine mild level when queryTotal < 8', () => {
      mockEmotion.detectNewOwnerAnxiety.mockReturnValue(true)
      mockEmotion.createIntervention.mockReturnValue({
        id: 'intv-new-mild',
        type: 'new_owner_anxiety' as EmotionSceneType,
        userId: 'user1',
        message: '新手家长你好',
        context: {},
        createdAt: Date.now(),
        userResponded: false,
        anxietyLevel: 'mild' as const,
        requiresCrisisReferral: false,
      } as EmotionIntervention)

      useEmotionStore.getState().checkNewOwnerAnxiety(
        'user1', 10, 2, 1, 30, false, '小橘', 'cat',
      )

      expect(mockEmotion.createIntervention).toHaveBeenCalledWith(
        'new_owner_anxiety', 'user1', '新手家长你好',
        expect.any(Object), undefined, 'mild',
      )
    })
  })

  describe('dismissIntervention', () => {
    it('should clear activeIntervention and add to dismissedIds', () => {
      useEmotionStore.setState({
        activeIntervention: {
          id: 'intv-1',
          type: 'sick_anxiety' as EmotionSceneType,
          userId: 'user1',
          message: '理解你的担心',
          context: {},
          petId: 'pet1',
          createdAt: Date.now(),
          userResponded: false,
          anxietyLevel: 'mild' as const,
          requiresCrisisReferral: false,
        },
        dismissedIds: [],
      })

      useEmotionStore.getState().dismissIntervention()

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).toBeNull()
      expect(state.dismissedIds).toEqual(['intv-1'])
      expect(mockStorage.setStorage).toHaveBeenCalled()
    })

    it('should append to existing dismissedIds', () => {
      useEmotionStore.setState({
        activeIntervention: {
          id: 'intv-2',
          type: 'sick_anxiety' as EmotionSceneType,
          userId: 'user1',
          message: '理解你的担心',
          context: {},
          petId: 'pet1',
          createdAt: Date.now(),
          userResponded: false,
          anxietyLevel: 'mild' as const,
          requiresCrisisReferral: false,
        },
        dismissedIds: ['intv-1'],
      })

      useEmotionStore.getState().dismissIntervention()

      const state = useEmotionStore.getState()
      expect(state.dismissedIds).toEqual(['intv-1', 'intv-2'])
    })

    it('should do nothing when no active intervention', () => {
      useEmotionStore.setState({
        activeIntervention: null,
        dismissedIds: [],
      })

      useEmotionStore.getState().dismissIntervention()

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).toBeNull()
      expect(state.dismissedIds).toEqual([])
      expect(mockStorage.setStorage).not.toHaveBeenCalled()
    })
  })

  describe('respondToIntervention', () => {
    it('should set userResponded to true', () => {
      const originalIntervention: EmotionIntervention = {
        id: 'intv-1',
        type: 'sick_anxiety' as EmotionSceneType,
        userId: 'user1',
        message: '理解你的担心',
        context: {},
        petId: 'pet1',
        createdAt: Date.now(),
        userResponded: false,
        anxietyLevel: 'mild' as const,
        requiresCrisisReferral: false,
      }
      useEmotionStore.setState({ activeIntervention: originalIntervention })

      useEmotionStore.getState().respondToIntervention()

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).not.toBeNull()
      expect(state.activeIntervention!.userResponded).toBe(true)
    })

    it('should do nothing when no active intervention', () => {
      useEmotionStore.setState({ activeIntervention: null })

      useEmotionStore.getState().respondToIntervention()

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).toBeNull()
    })

    it('should preserve other intervention fields when setting userResponded', () => {
      useEmotionStore.setState({
        activeIntervention: {
          id: 'intv-1',
          type: 'new_owner_anxiety' as EmotionSceneType,
          userId: 'user1',
          message: '新手家长你好',
          context: { foodQueryCount: 5 },
          createdAt: 1234567890,
          userResponded: false,
          anxietyLevel: 'moderate' as const,
          requiresCrisisReferral: false,
        },
      })

      useEmotionStore.getState().respondToIntervention()

      const state = useEmotionStore.getState()
      expect(state.activeIntervention!.id).toBe('intv-1')
      expect(state.activeIntervention!.type).toBe('new_owner_anxiety')
      expect(state.activeIntervention!.userId).toBe('user1')
      expect(state.activeIntervention!.message).toBe('新手家长你好')
      expect(state.activeIntervention!.createdAt).toBe(1234567890)
      expect(state.activeIntervention!.anxietyLevel).toBe('moderate')
      expect(state.activeIntervention!.userResponded).toBe(true)
    })
  })

  describe('clearExpiredRecords', () => {
    it('should remove records older than 7 days', () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000
      useEmotionStore.setState({
        checkRecords: [
          { type: 'sick_anxiety' as EmotionSceneType, petId: 'pet1', checkedAt: eightDaysAgo },
          { type: 'new_owner_anxiety' as EmotionSceneType, checkedAt: eightDaysAgo - 1000 },
        ],
      })

      useEmotionStore.getState().clearExpiredRecords()

      const state = useEmotionStore.getState()
      expect(state.checkRecords).toEqual([])
      expect(mockStorage.setStorage).toHaveBeenCalledWith(
        'emotion_check_records', [],
      )
    })

    it('should keep recent records', () => {
      const recentTimestamp = Date.now() - 1000
      const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000
      const recentRecord = { type: 'sick_anxiety' as EmotionSceneType, petId: 'pet1', checkedAt: recentTimestamp }
      const sixDayRecord = { type: 'new_owner_anxiety' as EmotionSceneType, checkedAt: sixDaysAgo }
      const oldRecord = { type: 'sick_anxiety' as EmotionSceneType, petId: 'pet2', checkedAt: eightDaysAgo }

      useEmotionStore.setState({
        checkRecords: [recentRecord, sixDayRecord, oldRecord],
      })

      useEmotionStore.getState().clearExpiredRecords()

      const state = useEmotionStore.getState()
      expect(state.checkRecords).toHaveLength(2)
      expect(state.checkRecords).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ checkedAt: recentTimestamp }),
          expect.objectContaining({ checkedAt: sixDaysAgo }),
        ]),
      )
    })

    it('should handle empty checkRecords', () => {
      useEmotionStore.setState({ checkRecords: [] })

      useEmotionStore.getState().clearExpiredRecords()

      const state = useEmotionStore.getState()
      expect(state.checkRecords).toEqual([])
    })
  })

  describe('reset', () => {
    it('should clear all state', () => {
      useEmotionStore.setState({
        activeIntervention: {
          id: 'intv-1',
          type: 'sick_anxiety' as EmotionSceneType,
          userId: 'user1',
          message: '理解你的担心',
          context: {},
          petId: 'pet1',
          createdAt: Date.now(),
          userResponded: false,
          anxietyLevel: 'mild' as const,
          requiresCrisisReferral: false,
        },
        dismissedIds: ['intv-1', 'intv-2'],
        checkRecords: [
          { type: 'sick_anxiety' as EmotionSceneType, petId: 'pet1', checkedAt: Date.now() },
        ],
        isLoading: true,
      })

      useEmotionStore.getState().reset()

      const state = useEmotionStore.getState()
      expect(state.activeIntervention).toBeNull()
      expect(state.dismissedIds).toEqual([])
      expect(state.checkRecords).toEqual([])
      expect(state.isLoading).toBe(false)
    })
  })
})
