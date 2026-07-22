import { describe, it, expect, vi, beforeEach } from 'vitest'

const { memoryStore, mockSelectOne, mockUpdate, mockGeneratePetImage, mockIsMock } = vi.hoisted(() => {
  const memoryStore = new Map<string, unknown>()
  return {
    memoryStore,
    mockSelectOne: vi.fn(),
    mockUpdate: vi.fn(),
    mockGeneratePetImage: vi.fn(),
    mockIsMock: { value: true },
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

vi.mock('../supabaseClient', () => ({
  supabaseClient: {
    selectOne: mockSelectOne,
    update: mockUpdate,
    get isMock() { return mockIsMock.value },
  },
}))

vi.mock('../../engines/petAvatar/seedreamAdapter', () => ({
  seedreamAdapter: {
    generatePetImage: mockGeneratePetImage,
  },
}))

vi.mock('../../config/supabase', () => ({
  ENV: {
    development: {
      apiBaseUrl: 'http://localhost:3000',
      supabaseUrl: 'http://localhost:54321',
      supabaseKey: 'mock-key',
      useMock: true,
    },
  },
  STORAGE_KEYS: { TOKEN: 'xhh_token' },
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
    mockIsMock.value = true
    mockSelectOne.mockResolvedValue({ data: null, error: null, status: 200 })
    mockUpdate.mockResolvedValue({ data: null, error: null, status: 200 })
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
    it('saves to local storage only in mock mode', async () => {
      mockIsMock.value = true
      const custom = {
        species: 'cat' as const,
        style: 'cartoon' as const,
        baseColor: '#FFF8E7',
        generatedAt: '2025-01-01',
        cartoonUrl: 'https://example.com/avatar.png',
      }
      await saveAvatarCustomization(custom)
      expect(memoryStore.get('xhh_avatar_custom')).toEqual(custom)
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('saves to local storage and DB in real mode', async () => {
      mockIsMock.value = false
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
      expect(mockUpdate).toHaveBeenCalledWith('pet_profiles', expect.objectContaining({
        avatarStyle: 'cartoon',
        avatarCartoonUrl: 'https://example.com/avatar.png',
        avatarGeneratedAt: '2025-01-01',
      }), { id: 'eq.pet-123' })
    })

    it('skips DB when no pet ID in storage', async () => {
      mockIsMock.value = false
      const custom = {
        species: 'dog' as const,
        style: 'cartoon' as const,
        baseColor: '#FFD93D',
      }
      await saveAvatarCustomization(custom)
      expect(memoryStore.get('xhh_avatar_custom')).toEqual(custom)
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('saves to local storage even when DB fails', async () => {
      mockIsMock.value = false
      memoryStore.set('xhh_current_pet_id', 'pet-456')
      mockUpdate.mockRejectedValue(new Error('DB error'))
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
    it('returns null when free quota exceeded and not member', async () => {
      memoryStore.set('xhh_avatar_gen_count', 1)
      mockSelectOne.mockResolvedValue({ data: null, error: null, status: 200 })
      const result = await generateAvatarImage('dog', '旺财', 'cartoon')
      expect(result).toBeNull()
      expect(mockGeneratePetImage).not.toHaveBeenCalled()
    })

    it('generates avatar for free user within quota', async () => {
      mockSelectOne.mockResolvedValue({ data: null, error: null, status: 200 })
      mockGeneratePetImage.mockResolvedValue({
        success: true,
        imageUrl: 'data:image/svg+xml,...',
      })
      const result = await generateAvatarImage('dog', '旺财', 'cartoon')
      expect(result).not.toBeNull()
      expect(result!.success).toBe(true)
      expect(getGenerationCount()).toBe(1)
    })

    it('returns null when generation fails', async () => {
      mockSelectOne.mockResolvedValue({ data: null, error: null, status: 200 })
      mockGeneratePetImage.mockResolvedValue({
        success: false,
        error: 'API error',
      })
      const result = await generateAvatarImage('dog', '旺财', 'cartoon')
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
