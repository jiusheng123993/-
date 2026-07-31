/**
 * 衣橱系统服务测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../syncHelper', () => ({
  queueSync: vi.fn(),
}))

vi.mock('../../utils/storage', () => ({
  getStorage: vi.fn((key: string) => memoryStore.get(key) ?? null),
  setStorage: vi.fn((key: string, value: unknown) => { memoryStore.set(key, value) }),
  removeStorage: vi.fn((key: string) => { memoryStore.delete(key) }),
}))

import {
  getWardrobeOverview,
  equipAccessory,
  unequipAccessory,
  saveTryOnSnapshot,
  unlockAccessory,
  getLocalOutfitForPet,
  debouncedEquipAccessory,
  debouncedUnequipAccessory,
  clearOutfitSaveTimer,
  createWardrobeError,
  mapWardrobeErrorCode,
} from '../wardrobeService'
import type { AccessorySlot } from '../wardrobeService'
import { api } from '../api'

describe('wardrobeService', () => {
  beforeEach(() => {
    memoryStore.clear()
    vi.clearAllMocks()
  })

  describe('createWardrobeError', () => {
    it('should create error with code, message and httpStatus', () => {
      const err = createWardrobeError('TEST', 'test message', 403)
      expect(err).toEqual({ code: 'TEST', message: 'test message', httpStatus: 403 })
    })

    it('should default httpStatus to 400', () => {
      const err = createWardrobeError('TEST', 'test message')
      expect(err.httpStatus).toBe(400)
    })
  })

  describe('mapWardrobeErrorCode', () => {
    it('should map known API error codes', () => {
      expect(mapWardrobeErrorCode('NOT_OWNED')).toBe('WARDROBE_010')
      expect(mapWardrobeErrorCode('QUOTA_EXCEEDED')).toBe('WARDROBE_021')
      expect(mapWardrobeErrorCode('PET_NOT_FOUND')).toBe('WARDROBE_030')
      expect(mapWardrobeErrorCode('TASK_IN_PROGRESS')).toBe('WARDROBE_040')
    })

    it('should fallback to SYSTEM_ERROR for unknown codes', () => {
      expect(mapWardrobeErrorCode('UNKNOWN_CODE')).toBe('WARDROBE_099')
    })
  })

  describe('getWardrobeOverview', () => {
    it('should throw if userId is empty', async () => {
      await expect(getWardrobeOverview('', 'pet1')).rejects.toThrow('[WardrobeService] userId is required')
    })

    it('should throw if petId is empty', async () => {
      await expect(getWardrobeOverview('user1', '')).rejects.toThrow('[WardrobeService] petId is required')
    })

    it('should return API data on success', async () => {
      const mockOverview = {
        accessories: [{ id: 1, userId: 'user1', accessoryId: 'hat_baseball', unlockedAt: '2026-01-01', unlockSource: 'default' }],
        outfit: { petId: 'pet1', outfitSlots: { head: 'hat_baseball' }, updatedAt: '2026-01-01' },
        tryOnHistory: [],
      }
      vi.mocked(api.get).mockResolvedValueOnce(mockOverview)

      const result = await getWardrobeOverview('user1', 'pet1')
      expect(result).toEqual(mockOverview)
      expect(api.get).toHaveBeenCalledWith('/api/wardrobe/overview', { petId: 'pet1' })
    })

    it('should fallback to local data on API failure', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('network error'))

      memoryStore.set('wardrobe_inventory_user1', [{ id: 1, userId: 'user1', accessoryId: 'hat_baseball', unlockedAt: '2026-01-01', unlockSource: 'default' }])

      const result = await getWardrobeOverview('user1', 'pet1')
      expect(result.accessories).toHaveLength(1)
    })
  })

  describe('equipAccessory', () => {
    it('should throw if required params missing', async () => {
      await expect(equipAccessory('', 'pet1', 'head', 'hat1')).rejects.toThrow('[WardrobeService] userId is required')
      await expect(equipAccessory('user1', '', 'head', 'hat1')).rejects.toThrow('[WardrobeService] petId is required')
      await expect(equipAccessory('user1', 'pet1', '' as unknown as AccessorySlot, 'hat1')).rejects.toThrow('[WardrobeService] slot is required')
      await expect(equipAccessory('user1', 'pet1', 'head', '')).rejects.toThrow('[WardrobeService] accessoryId is required')
    })

    it('should call API and update local outfit on success', async () => {
      const mockResult = {
        outfit: { petId: 'pet1', outfitSlots: { head: 'hat_baseball' }, updatedAt: '2026-01-01' },
        equipped: { slot: 'head', accessoryId: 'hat_baseball' },
      }
      vi.mocked(api.post).mockResolvedValueOnce(mockResult)

      const result = await equipAccessory('user1', 'pet1', 'head', 'hat_baseball')
      expect(result.equipped.slot).toBe('head')
      expect(api.post).toHaveBeenCalledWith('/api/wardrobe/equip', { petId: 'pet1', slot: 'head', accessoryId: 'hat_baseball' })
    })

    it('should update local outfit on API failure', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('network error'))

      const result = await equipAccessory('user1', 'pet1', 'head', 'hat_baseball')
      expect(result.outfit.outfitSlots.head).toBe('hat_baseball')
    })
  })

  describe('unequipAccessory', () => {
    it('should remove slot from outfit on API failure', async () => {
      memoryStore.set('wardrobe_outfit_pet1', { petId: 'pet1', outfitSlots: { head: 'hat_baseball', neck: 'bell_small' }, updatedAt: '2026-01-01' })
      vi.mocked(api.post).mockRejectedValueOnce(new Error('network error'))

      const result = await unequipAccessory('user1', 'pet1', 'head')
      expect(result.outfit.outfitSlots.head).toBeUndefined()
      expect(result.outfit.outfitSlots.neck).toBe('bell_small')
    })
  })

  describe('saveTryOnSnapshot', () => {
    it('should save snapshot locally on API failure', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('network error'))

      const snapshot = { head: 'hat_baseball' }
      const result = await saveTryOnSnapshot('user1', 'pet1', snapshot)
      expect(result.outfitSnapshot).toEqual(snapshot)
      expect(result.userId).toBe('user1')
    })
  })

  describe('unlockAccessory', () => {
    it('should add to local inventory on API failure', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('network error'))

      const result = await unlockAccessory('user1', 'hat_baseball', 'achievement')
      expect(result.accessoryId).toBe('hat_baseball')
      expect(result.unlockSource).toBe('achievement')
    })
  })

  describe('getLocalOutfitForPet', () => {
    it('should return null when no local outfit', () => {
      expect(getLocalOutfitForPet('nonexistent')).toBeNull()
    })

    it('should return local outfit when exists', () => {
      const outfit = { petId: 'pet1', outfitSlots: { head: 'hat_baseball' }, updatedAt: '2026-01-01' }
      memoryStore.set('wardrobe_outfit_pet1', outfit)
      expect(getLocalOutfitForPet('pet1')).toEqual(outfit)
    })
  })

  describe('debouncedEquipAccessory', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
      clearOutfitSaveTimer()
    })

    it('should update local outfit immediately', () => {
      const onUpdate = vi.fn()
      debouncedEquipAccessory('user1', 'pet1', 'head', 'hat_baseball', onUpdate)

      expect(onUpdate).toHaveBeenCalledTimes(1)
      const updatedOutfit = onUpdate.mock.calls[0][0]
      expect(updatedOutfit.outfitSlots.head).toBe('hat_baseball')
    })

    it('should debounce API call', () => {
      debouncedEquipAccessory('user1', 'pet1', 'head', 'hat_baseball', vi.fn())

      expect(api.post).not.toHaveBeenCalled()

      vi.advanceTimersByTime(300)
      expect(api.post).toHaveBeenCalledTimes(1)
    })
  })
})
