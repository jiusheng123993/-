/**
 * 头像服务测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { memoryStore, mockGeneratePetImage, mockApiPut } = vi.hoisted(() => {
  const memoryStore = new Map<string, unknown>()
  return {
    memoryStore,
    mockGeneratePetImage: vi.fn(),
    mockApiPut: vi.fn(),
  }
})

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: vi.fn((key: string) => memoryStore.get(key) ?? ''),
    setStorageSync: vi.fn((key: string, value: unknown) => { memoryStore.set(key, value) }),
    removeStorageSync: vi.fn((key: string) => { memoryStore.delete(key) }),
    clearStorageSync: vi.fn(),
    request: vi.fn(() => Promise.resolve({ statusCode: 200, data: {} })),
  },
}))

vi.mock('../api', () => ({
  api: {
    put: mockApiPut,
  },
}))

vi.mock('../../engines/petAvatar/seedreamAdapter', () => ({
  seedreamAdapter: {
    generatePetImage: mockGeneratePetImage,
  },
}))

vi.mock('../../constants', () => ({
  AVATAR_FREE_GENERATIONS: 1,
  AVATAR_MEMBER_GENERATIONS: -1,
}))

import {
  getGenerationCount,
  canGenerateAvatar,
  getAvatarCustomization,
  saveAvatarCustomization,
  generateAvatarImage,
  getPetDiary,
  incrementGenerationCount,
} from '../avatarService'

describe('avatarService', () => {
  beforeEach(() => {
    memoryStore.clear()
    vi.clearAllMocks()
    mockApiPut.mockResolvedValue({})
    mockGeneratePetImage.mockResolvedValue({ success: false, error: 'stub' })
  })

  describe('getGenerationCount', () => {
    it('returns 0 when no count stored', () => {
      expect(getGenerationCount()).toBe(0)
    })

    it('returns stored count', () => {
      memoryStore.set('xhh_avatar_gen_count', 3)
      expect(getGenerationCount()).toBe(3)
    })
  })

  describe('incrementGenerationCount', () => {
    it('increments from 0 to 1', () => {
      incrementGenerationCount()
      expect(getGenerationCount()).toBe(1)
    })

    it('increments from existing count', () => {
      memoryStore.set('xhh_avatar_gen_count', 2)
      incrementGenerationCount()
      expect(getGenerationCount()).toBe(3)
    })
  })

  describe('canGenerateAvatar', () => {
    it('allows member to generate', () => {
      expect(canGenerateAvatar(true)).toBe(true)
    })

    it('allows free user with 0 generations', () => {
      expect(canGenerateAvatar(false)).toBe(true)
    })

    it('blocks free user after using free quota', () => {
      memoryStore.set('xhh_avatar_gen_count', 1)
      expect(canGenerateAvatar(false)).toBe(false)
    })
  })

  describe('getAvatarCustomization', () => {
    it('returns null when no customization stored', () => {
      expect(getAvatarCustomization()).toBeNull()
    })

    it('returns stored customization', () => {
      const custom = { species: 'dog' as const, style: 'cartoon' as const, baseColor: '#FFD93D' }
      memoryStore.set('xhh_avatar_custom', custom)
      expect(getAvatarCustomization()).toEqual(custom)
    })
  })

  describe('saveAvatarCustomization', () => {
    it('saves to local storage', async () => {
      const custom = {
        species: 'cat' as const,
        style: 'cartoon' as const,
        baseColor: '#FFF8E7',
        generatedAt: '2025-01-01',
        cartoonUrl: 'https://example.com/avatar.png',
      }
      await saveAvatarCustomization(custom)
      expect(memoryStore.get('xhh_avatar_custom')).toEqual(custom)
    })

    it('calls API when pet ID is set in storage', async () => {
      memoryStore.set('xhh_current_pet_id', 'pet-123')
      const custom = {
        species: 'cat' as const,
        style: 'cartoon' as const,
        baseColor: '#FFF8E7',
        generatedAt: '2025-01-01',
        cartoonUrl: 'https://example.com/avatar.png',
      }
      await saveAvatarCustomization(custom)
      expect(memoryStore.get('xhh_avatar_custom')).toEqual(custom)
      expect(mockApiPut).toHaveBeenCalledWith('/api/pets/pet-123', {
        avatarStyle: 'cartoon',
        avatarCartoonUrl: 'https://example.com/avatar.png',
        avatarGeneratedAt: '2025-01-01',
      })
    })

    it('skips API when no pet ID in storage', async () => {
      const custom = {
        species: 'dog' as const,
        style: 'cartoon' as const,
        baseColor: '#FFD93D',
      }
      await saveAvatarCustomization(custom)
      expect(memoryStore.get('xhh_avatar_custom')).toEqual(custom)
      expect(mockApiPut).not.toHaveBeenCalled()
    })

    it('saves to local storage even when API fails', async () => {
      memoryStore.set('xhh_current_pet_id', 'pet-456')
      mockApiPut.mockRejectedValue(new Error('API error'))
      const custom = {
        species: 'dog' as const,
        style: 'cartoon' as const,
        baseColor: '#FFD93D',
      }
      await saveAvatarCustomization(custom)
      expect(memoryStore.get('xhh_avatar_custom')).toEqual(custom)
    })
  })

  describe('generateAvatarImage', () => {
    it('generates avatar and returns result on success', async () => {
      mockGeneratePetImage.mockResolvedValue({
        success: true,
        imageUrl: 'data:image/svg+xml,...',
      })
      const result = await generateAvatarImage('test-pet-001', 'dog', '旺财', 'cartoon')
      expect(result).not.toBeNull()
      expect(result!.success).toBe(true)
      expect(mockGeneratePetImage).toHaveBeenCalled()
    })

    it('returns null when generation fails', async () => {
      mockGeneratePetImage.mockResolvedValue({
        success: false,
        error: 'API error',
      })
      const result = await generateAvatarImage('test-pet-001', 'dog', '旺财', 'cartoon')
      expect(result).toBeNull()
    })
  })

  describe('getPetDiary', () => {
    const defaultContext = {
      todayEntry: null,
      hasAnomaly: false,
      anomalyCount: 0,
      riskLevel: null,
      streakDays: 0,
      isBirthday: false,
      isVaccineComplete: false,
      isRecovery: false,
      isDeceased: false,
    }

    it('returns cached diary for today', () => {
      const today = new Date().toISOString().slice(0, 10)
      memoryStore.set('xhh_diary_cache', JSON.stringify({ date: today, text: 'cached diary' }))
      const result = getPetDiary('旺财', defaultContext)
      expect(result).toBe('cached diary')
    })

    it('generates new diary when no cache', () => {
      const result = getPetDiary('旺财', defaultContext)
      expect(result).toContain('旺财')
    })

    it('generates new diary when cache is from different day', () => {
      memoryStore.set('xhh_diary_cache', JSON.stringify({ date: '2020-01-01', text: 'old diary' }))
      const result = getPetDiary('旺财', defaultContext)
      expect(result).toContain('旺财')
      expect(result).not.toBe('old diary')
    })
  })
})