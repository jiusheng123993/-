import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { AnomalyItem } from '../../memory-body/types/memoryBodyTypes'

const mockStorage: Record<string, string> = {}

vi.mock('../../utils/storage', () => ({
  getStorage: vi.fn((key: string) => {
    const raw = mockStorage[`xhh_${key}`]
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }),
  setStorage: vi.fn((key: string, value: unknown) => {
    mockStorage[`xhh_${key}`] = JSON.stringify(value)
  }),
  removeStorage: vi.fn((key: string) => {
    delete mockStorage[`xhh_${key}`]
  }),
}))

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '../api'
import {
  createCheckin,
  getTodayCheckin,
  getCheckinStats,
  getCheckinsByDateRange,
  getCheckins,
  getLatestCheckin,
} from '../checkinService'
import type { PetHealthEntry } from '../checkinService'

const today = new Date().toISOString().split('T')[0]
const userId = 'user-001'

const mockEntry = {
  petId: 'pet-001',
  userId,
  poopLevel: 3 as const,
  appetiteLevel: 3 as const,
  spiritLevel: 3 as const,
  exerciseLevel: 2 as const,
  hasAnomaly: false,
  anomalyItems: [] as AnomalyItem[],
}

function makeCheckinResponse(overrides: Partial<PetHealthEntry> = {}): PetHealthEntry {
  return {
    id: 'checkin_001',
    petId: 'pet-001',
    userId,
    poopLevel: 3,
    appetiteLevel: 3,
    spiritLevel: 3,
    exerciseLevel: 2,
    hasAnomaly: false,
    anomalyItems: [],
    riskLevel: 'low',
    aiFeedback: '✅ 您的宠物今天状态不错！继续保持良好的照顾习惯。',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

describe('checkinService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k])
  })

  describe('createCheckin', () => {
    it('should create normal checkin successfully', async () => {
      const mockResponse = makeCheckinResponse()
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await createCheckin(mockEntry)

      expect(result.petId).toBe('pet-001')
      expect(result.poopLevel).toBe(3)
      expect(result.appetiteLevel).toBe(3)
      expect(result.spiritLevel).toBe(3)
      expect(result.riskLevel).toBe('low')
      expect(result.aiFeedback).toContain('状态不错')
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(api.post).toHaveBeenCalledWith(
        '/api/pets/pet-001/checkins',
        expect.objectContaining({ petId: 'pet-001' })
      )
    })

    it('should trigger emergency when poopLevel is 1', async () => {
      const mockResponse = makeCheckinResponse()
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      await createCheckin({ ...mockEntry, poopLevel: 1 })

      const callArgs = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>
      expect(callArgs.riskLevel).toBe('emergency')
      expect(callArgs.aiFeedback).toContain('紧急健康信号')
    })

    it('should trigger emergency when appetiteLevel is 1 and spiritLevel is 1', async () => {
      const mockResponse = makeCheckinResponse()
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      await createCheckin({
        ...mockEntry,
        appetiteLevel: 1,
        spiritLevel: 1,
      })

      const callArgs = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>
      expect(callArgs.riskLevel).toBe('emergency')
      expect(callArgs.aiFeedback).toContain('紧急健康信号')
    })

    it('should trigger high when poopLevel is 2', async () => {
      const mockResponse = makeCheckinResponse()
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      await createCheckin({ ...mockEntry, poopLevel: 2 })

      const callArgs = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>
      expect(callArgs.riskLevel).toBe('high')
    })

    it('should trigger high when appetiteLevel is 1', async () => {
      const mockResponse = makeCheckinResponse()
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      await createCheckin({ ...mockEntry, appetiteLevel: 1 })

      const callArgs = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>
      expect(callArgs.riskLevel).toBe('high')
    })

    it('should trigger high when spiritLevel is 1', async () => {
      const mockResponse = makeCheckinResponse()
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      await createCheckin({ ...mockEntry, spiritLevel: 1 })

      const callArgs = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>
      expect(callArgs.riskLevel).toBe('high')
    })

    it('should trigger medium when hasAnomaly is true', async () => {
      const mockResponse = makeCheckinResponse()
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      await createCheckin({ ...mockEntry, hasAnomaly: true, anomalyItems: ['poop'] as AnomalyItem[] })

      const callArgs = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>
      expect(callArgs.riskLevel).toBe('medium')
    })

    it('should fallback to local storage when API fails', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'))

      const result = await createCheckin(mockEntry)

      expect(result.petId).toBe('pet-001')
      expect(result.riskLevel).toBe('medium')
      expect(result.id).toBeDefined()
    })
  })

  describe('getTodayCheckin', () => {
    it('should return today checkin from API', async () => {
      const mockResponse = makeCheckinResponse()
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await getTodayCheckin('pet-001', userId)

      expect(result).not.toBeNull()
      expect(result!.petId).toBe('pet-001')
      expect(api.get).toHaveBeenCalledWith(
        `/api/pets/pet-001/checkins/today?date=${today}`
      )
    })

    it('should return null when no today checkin exists', async () => {
      vi.mocked(api.get).mockResolvedValue(null)

      const result = await getTodayCheckin('pet-001', userId)

      expect(result).toBeNull()
    })

    it('should fallback to local storage when API fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const result = await getTodayCheckin('pet-001', userId)

      expect(result).toBeNull()
    })
  })

  describe('getCheckinStats', () => {
    it('should return checkin stats from API', async () => {
      const mockStats = {
        totalCheckins: 10,
        streak: 3,
        lastCheckinDate: today,
        weeklyCount: 5,
        monthlyCount: 8,
      }
      vi.mocked(api.get).mockResolvedValue(mockStats)

      const result = await getCheckinStats('pet-001', userId)

      expect(result.totalCheckins).toBe(10)
      expect(result.streak).toBe(3)
      expect(result.lastCheckinDate).toBe(today)
      expect(result.weeklyCount).toBe(5)
      expect(result.monthlyCount).toBe(8)
      expect(api.get).toHaveBeenCalledWith('/api/pets/pet-001/checkins/stats')
    })

    it('should fallback to local calculation when API fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const result = await getCheckinStats('pet-001', userId)

      expect(result.totalCheckins).toBe(0)
      expect(result.streak).toBe(0)
      expect(result.lastCheckinDate).toBeNull()
    })
  })

  describe('getCheckinsByDateRange', () => {
    it('should return checkins within date range from API', async () => {
      const mockCheckins = [makeCheckinResponse(), makeCheckinResponse({ id: 'checkin_002' })]
      vi.mocked(api.get).mockResolvedValue(mockCheckins)

      const result = await getCheckinsByDateRange('pet-001', userId, '2024-01-01', '2024-01-31')

      expect(result).toHaveLength(2)
      expect(api.get).toHaveBeenCalledWith(
        '/api/pets/pet-001/checkins?startDate=2024-01-01&endDate=2024-01-31'
      )
    })

    it('should fallback to local storage when API fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const result = await getCheckinsByDateRange('pet-001', userId, '2024-01-01', '2024-01-31')

      expect(result).toEqual([])
    })
  })

  describe('getCheckins', () => {
    it('should return all checkins from API', async () => {
      const mockCheckins = [makeCheckinResponse(), makeCheckinResponse({ id: 'checkin_002' })]
      vi.mocked(api.get).mockResolvedValue(mockCheckins)

      const result = await getCheckins('pet-001', userId)

      expect(result).toHaveLength(2)
      expect(api.get).toHaveBeenCalledWith('/api/pets/pet-001/checkins')
    })

    it('should fallback to local storage when API fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const result = await getCheckins('pet-001', userId)

      expect(result).toEqual([])
    })
  })

  describe('getLatestCheckin', () => {
    it('should return latest checkin from API', async () => {
      const mockResponse = makeCheckinResponse()
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await getLatestCheckin('pet-001', userId)

      expect(result).not.toBeNull()
      expect(result!.id).toBe('checkin_001')
      expect(api.get).toHaveBeenCalledWith('/api/pets/pet-001/checkins/latest')
    })

    it('should return null when no checkins exist', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const result = await getLatestCheckin('pet-001', userId)

      expect(result).toBeNull()
    })
  })
})
