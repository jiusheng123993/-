import { describe, it, expect, vi, beforeEach } from 'vitest'

const { memoryStore } = vi.hoisted(() => {
  const memoryStore = new Map<string, unknown>()
  return { memoryStore }
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

vi.mock('../../services/wardrobeService', () => ({
  getWardrobeOverview: vi.fn(),
  equipAccessory: vi.fn(),
  unequipAccessory: vi.fn(),
  saveTryOnSnapshot: vi.fn(),
  unlockAccessory: vi.fn(),
  getLocalOutfitForPet: vi.fn(() => null),
  updateLocalOutfit: vi.fn(),
  debouncedEquipAccessory: vi.fn(),
  debouncedUnequipAccessory: vi.fn(),
  clearOutfitSaveTimer: vi.fn(),
}))

vi.mock('../../services/themeSuiteService', () => ({
  getThemeSuiteOverview: vi.fn(),
  generateThemeSuite: vi.fn(),
  getThemeSuiteTaskStatus: vi.fn(),
  pollThemeSuiteTask: vi.fn(),
  getThemeQuota: vi.fn(() => ({ monthlyLimit: 5, usedThisMonth: 0, remaining: 5 })),
  canGenerateTheme: vi.fn(() => true),
  getActiveThemeTask: vi.fn(() => null),
}))

vi.mock('../../services/outfitComposition', () => ({
  buildOutfitPreview: vi.fn(() => ({
    svgContent: '<svg>test</svg>',
    layers: [],
    slotSummary: {
      head: { equipped: false, accessoryName: null },
      neck: { equipped: false, accessoryName: null },
      back: { equipped: false, accessoryName: null },
      body: { equipped: false, accessoryName: null },
      feet: { equipped: false, accessoryName: null },
    },
  })),
  toggleSlotInOutfit: vi.fn((slots, slot, id) => {
    if (id === null) {
      const updated = { ...slots }
      delete updated[slot]
      return updated
    }
    return { ...slots, [slot]: id }
  }),
  clearAllSlots: vi.fn(() => ({})),
  getEquippedCount: vi.fn((slots) => Object.keys(slots).length),
  isOutfitEmpty: vi.fn((slots) => Object.keys(slots).length === 0),
  areOutfitsEqual: vi.fn((a, b) => JSON.stringify(a) === JSON.stringify(b)),
}))

vi.mock('../../utils/storage', () => ({
  getStorage: vi.fn((key: string) => memoryStore.get(key) ?? null),
  setStorage: vi.fn((key: string, value: unknown) => { memoryStore.set(key, value) }),
  removeStorage: vi.fn((key: string) => { memoryStore.delete(key) }),
}))

import { useWardrobeStore } from '../wardrobeStore'
import { getWardrobeOverview, equipAccessory, unequipAccessory, unlockAccessory, saveTryOnSnapshot } from '../../services/wardrobeService'
import type { EquipResult, UnequipResult, AccessorySlot } from '../../services/wardrobeService'
import { getThemeSuiteOverview, generateThemeSuite, canGenerateTheme } from '../../services/themeSuiteService'

describe('wardrobeStore', () => {
  beforeEach(() => {
    memoryStore.clear()
    vi.clearAllMocks()
    useWardrobeStore.setState({
      userId: null,
      petId: null,
      inventory: [],
      outfit: null,
      preview: null,
      tryOnHistory: [],
      themeSuites: [],
      themeQuota: { monthlyLimit: 0, usedThisMonth: 0, remaining: 0 },
      activeThemeTask: null,
      isLoading: false,
      isEquipping: false,
      isGenerating: false,
      error: null,
    })
  })

  describe('initWardrobe', () => {
    it('should load wardrobe overview and set state', async () => {
      const mockOverview = {
        accessories: [{ id: 1, userId: 'user1', accessoryId: 'hat_baseball', unlockedAt: '2026-01-01', unlockSource: 'default' }],
        outfit: { petId: 'pet1', outfitSlots: { head: 'hat_baseball' }, updatedAt: '2026-01-01' },
        tryOnHistory: [],
      }
      vi.mocked(getWardrobeOverview).mockResolvedValueOnce(mockOverview)
      vi.mocked(getThemeSuiteOverview).mockResolvedValueOnce({
        suites: [],
        quota: { monthlyLimit: 5, usedThisMonth: 0, remaining: 5 },
        activeTask: null,
      })

      await useWardrobeStore.getState().initWardrobe('user1', 'pet1')

      const state = useWardrobeStore.getState()
      expect(state.userId).toBe('user1')
      expect(state.petId).toBe('pet1')
      expect(state.inventory).toHaveLength(1)
      expect(state.outfit).not.toBeNull()
      expect(state.isLoading).toBe(false)
    })

    it('should set error on failure', async () => {
      vi.mocked(getWardrobeOverview).mockRejectedValueOnce(new Error('network error'))

      await useWardrobeStore.getState().initWardrobe('user1', 'pet1')

      const state = useWardrobeStore.getState()
      expect(state.error).toBe('network error')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('equip', () => {
    it('should equip accessory and update outfit', async () => {
      useWardrobeStore.setState({ userId: 'user1', petId: 'pet1' })

      const mockResult: EquipResult = {
        outfit: { petId: 'pet1', outfitSlots: { head: 'hat_baseball' }, updatedAt: '2026-01-01' },
        equipped: { slot: 'head' as AccessorySlot, accessoryId: 'hat_baseball' },
      }
      vi.mocked(equipAccessory).mockResolvedValueOnce(mockResult)

      await useWardrobeStore.getState().equip('head', 'hat_baseball')

      const state = useWardrobeStore.getState()
      expect(state.outfit?.outfitSlots.head).toBe('hat_baseball')
      expect(state.isEquipping).toBe(false)
    })

    it('should set error on equip failure', async () => {
      useWardrobeStore.setState({ userId: 'user1', petId: 'pet1' })
      vi.mocked(equipAccessory).mockRejectedValueOnce(new Error('NOT_OWNED'))

      await useWardrobeStore.getState().equip('head', 'hat_baseball')

      expect(useWardrobeStore.getState().error).toBe('NOT_OWNED')
    })
  })

  describe('unequip', () => {
    it('should unequip slot and update outfit', async () => {
      useWardrobeStore.setState({
        userId: 'user1',
        petId: 'pet1',
        outfit: { petId: 'pet1', outfitSlots: { head: 'hat_baseball' }, updatedAt: '2026-01-01' },
      })

      const mockResult: UnequipResult = {
        outfit: { petId: 'pet1', outfitSlots: {}, updatedAt: '2026-01-01' },
        unequipped: { slot: 'head' as AccessorySlot },
      }
      vi.mocked(unequipAccessory).mockResolvedValueOnce(mockResult)

      await useWardrobeStore.getState().unequip('head')

      expect(useWardrobeStore.getState().outfit?.outfitSlots.head).toBeUndefined()
    })
  })

  describe('toggleSlot', () => {
    it('should toggle slot locally and debounce API call', () => {
      useWardrobeStore.setState({
        userId: 'user1',
        petId: 'pet1',
        outfit: { petId: 'pet1', outfitSlots: {}, updatedAt: '2026-01-01' },
      })

      useWardrobeStore.getState().toggleSlot('head', 'hat_baseball')

      const state = useWardrobeStore.getState()
      expect(state.outfit?.outfitSlots.head).toBe('hat_baseball')
    })
  })

  describe('unlock', () => {
    it('should add unlocked accessory to inventory', async () => {
      useWardrobeStore.setState({ userId: 'user1', inventory: [] })

      const mockItem = { id: 1, userId: 'user1', accessoryId: 'hat_baseball', unlockedAt: '2026-01-01', unlockSource: 'achievement' }
      vi.mocked(unlockAccessory).mockResolvedValueOnce(mockItem)

      await useWardrobeStore.getState().unlock('hat_baseball', 'achievement')

      expect(useWardrobeStore.getState().inventory).toHaveLength(1)
    })
  })

  describe('generateTheme', () => {
    it('should set error when quota exceeded', async () => {
      useWardrobeStore.setState({ userId: 'user1', petId: 'pet1' })
      vi.mocked(canGenerateTheme).mockReturnValueOnce(false)

      await useWardrobeStore.getState().generateTheme('spring')

      expect(useWardrobeStore.getState().error).toBe('本月生成次数已用完')
      expect(useWardrobeStore.getState().isGenerating).toBe(false)
    })

    it('should start generation and poll task', async () => {
      useWardrobeStore.setState({ userId: 'user1', petId: 'pet1' })
      vi.mocked(canGenerateTheme).mockReturnValueOnce(true)
      vi.mocked(generateThemeSuite).mockResolvedValueOnce({ taskId: 'task1', status: 'pending' })

      const pollFn = vi.mocked(await import('../../services/themeSuiteService')).pollThemeSuiteTask
      pollFn.mockImplementationOnce(async (_userId, _taskId, _onProgress, onComplete) => {
        onComplete({
          id: 'task1', userId: 'user1', petId: 'pet1', suiteId: 'spring',
          status: 'completed', resultUrl: 'https://example.com/result.png',
          moderationResult: 'pass', quotaConsumed: true, retryCount: 0,
          createdAt: '2026-01-01', updatedAt: '2026-01-01',
        })
      })

      await useWardrobeStore.getState().generateTheme('spring')

      expect(useWardrobeStore.getState().isGenerating).toBe(false)
    })
  })

  describe('clearError', () => {
    it('should clear error', () => {
      useWardrobeStore.setState({ error: 'test error' })
      useWardrobeStore.getState().clearError()
      expect(useWardrobeStore.getState().error).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      useWardrobeStore.setState({
        userId: 'user1',
        petId: 'pet1',
        inventory: [{ id: 1, userId: 'user1', accessoryId: 'hat_baseball', unlockedAt: '2026-01-01', unlockSource: 'default' }],
        outfit: { petId: 'pet1', outfitSlots: { head: 'hat_baseball' }, updatedAt: '2026-01-01' },
        error: 'some error',
      })

      useWardrobeStore.getState().reset()

      const state = useWardrobeStore.getState()
      expect(state.userId).toBeNull()
      expect(state.petId).toBeNull()
      expect(state.inventory).toEqual([])
      expect(state.outfit).toBeNull()
      expect(state.error).toBeNull()
    })
  })
})
