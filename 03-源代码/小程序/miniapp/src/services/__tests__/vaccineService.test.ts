import { describe, it, expect, beforeEach, vi } from 'vitest'

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

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageInfoSync: vi.fn(() => ({ keys: Object.keys(mockStorage) })),
  },
}))

import { api } from '../api'
import {
  getVaccineRecords,
  createVaccineRecord,
  updateVaccineRecord,
  deleteVaccineRecord,
  getUpcomingRecords,
  getOverdueRecords,
  markAsCompleted,
  getRecordsByMonth,
  generateInitialPlan,
  VACCINE_INTERVAL_RULES,
  calculateNextDate,
} from '../vaccineService'
import type { VaccineRecord, CreateVaccineData } from '../vaccineService'

function makeVaccineRecord(overrides: Partial<VaccineRecord> = {}): VaccineRecord {
  return {
    id: 'vac_001',
    petId: 'pet_001',
    type: 'vaccine',
    category: 'DHPP',
    date: '2024-01-15',
    nextDate: '2027-01-15',
    status: 'pending',
    hospital: '爱宠医院',
    doctor: '张医生',
    notes: '首次接种',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    ...overrides,
  }
}

const mockCreateData: CreateVaccineData = {
  petId: 'pet_001',
  userId: 'user_001',
  type: 'vaccine',
  category: 'DHPP',
  date: '2024-01-15',
  hospital: '爱宠医院',
  doctor: '张医生',
  notes: '首次接种',
}

describe('vaccineService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k])
  })

  describe('getVaccineRecords', () => {
    it('should return vaccine records from API and update status', async () => {
      const mockRecords = [
        makeVaccineRecord({ id: 'vac_001', nextDate: '2026-12-31', status: 'pending' }),
        makeVaccineRecord({ id: 'vac_002', category: 'rabies', nextDate: '2023-01-01', status: 'pending' }),
      ]
      vi.mocked(api.get).mockResolvedValue(mockRecords)

      const result = await getVaccineRecords('pet_001')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('vac_001')
      expect(result[0].status).toBe('pending')
      expect(result[1].id).toBe('vac_002')
      expect(result[1].status).toBe('overdue')
      expect(api.get).toHaveBeenCalledWith('/api/pets/pet_001/vaccines')
    })

    it('should fallback to local storage when API fails', async () => {
      const localRecords = [makeVaccineRecord({ id: 'vac_local', nextDate: '2026-12-31' })]
      mockStorage['xhh_vaccines_pet_001'] = JSON.stringify(localRecords)
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const result = await getVaccineRecords('pet_001')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('vac_local')
    })

    it('should return empty array when no records exist locally and API fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const result = await getVaccineRecords('pet_001')

      expect(result).toEqual([])
    })
  })

  describe('createVaccineRecord', () => {
    it('should create vaccine record successfully via API', async () => {
      const mockResponse = makeVaccineRecord({ id: 'vac_api_001' })
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await createVaccineRecord(mockCreateData)

      expect(result.id).toBe('vac_api_001')
      expect(result.petId).toBe('pet_001')
      expect(result.type).toBe('vaccine')
      expect(result.category).toBe('DHPP')
      expect(result.status).toBe('pending')
      expect(api.post).toHaveBeenCalledWith('/api/pets/pet_001/vaccines', expect.objectContaining({
        petId: 'pet_001',
        category: 'DHPP',
      }))
    })

    it('should fallback to local storage when API fails', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'))

      const result = await createVaccineRecord(mockCreateData)

      expect(result.petId).toBe('pet_001')
      expect(result.category).toBe('DHPP')
      expect(result.status).toBe('pending')
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })
  })

  describe('updateVaccineRecord', () => {
    it('should update vaccine record successfully via API', async () => {
      const mockResponse = makeVaccineRecord({ id: 'vac_001', category: 'rabies', updatedAt: '2024-06-01T10:00:00.000Z' })
      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const result = await updateVaccineRecord('vac_001', { category: 'rabies' })

      expect(result.id).toBe('vac_001')
      expect(result.category).toBe('rabies')
      expect(api.put).toHaveBeenCalledWith('/api/vaccines/vac_001', { category: 'rabies' })
    })

    it('should fallback to local storage when API fails', async () => {
      const localRecords = [makeVaccineRecord({ id: 'vac_001', nextDate: '2027-01-15' })]
      mockStorage['xhh_vaccines_pet_001'] = JSON.stringify(localRecords)
      vi.mocked(api.put).mockRejectedValue(new Error('Network error'))

      const result = await updateVaccineRecord('vac_001', { notes: ' updated notes' })

      expect(result.id).toBe('vac_001')
      expect(result.notes).toBe(' updated notes')
    })

    it('should throw error when record not found locally and API fails', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('Network error'))

      await expect(updateVaccineRecord('nonexistent', { notes: 'test' })).rejects.toThrow('记录不存在')
    })
  })

  describe('deleteVaccineRecord', () => {
    it('should delete vaccine record successfully via API', async () => {
      const localRecords = [makeVaccineRecord({ id: 'vac_001' }), makeVaccineRecord({ id: 'vac_002' })]
      mockStorage['xhh_vaccines_pet_001'] = JSON.stringify(localRecords)
      vi.mocked(api.delete).mockResolvedValue(undefined)

      await deleteVaccineRecord('vac_001')

      expect(api.delete).toHaveBeenCalledWith('/api/vaccines/vac_001')
      const remaining = JSON.parse(mockStorage['xhh_vaccines_pet_001'])
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe('vac_002')
    })

    it('should remove from local storage when API fails', async () => {
      const localRecords = [makeVaccineRecord({ id: 'vac_001' })]
      mockStorage['xhh_vaccines_pet_001'] = JSON.stringify(localRecords)
      vi.mocked(api.delete).mockRejectedValue(new Error('Network error'))

      await deleteVaccineRecord('vac_001')

      const remaining = JSON.parse(mockStorage['xhh_vaccines_pet_001'])
      expect(remaining).toHaveLength(0)
    })
  })

  describe('getUpcomingRecords', () => {
    it('should return upcoming vaccines within default 30 days', async () => {
      const today = new Date().toISOString().slice(0, 10)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 15)
      const futureStr = futureDate.toISOString().slice(0, 10)

      const mockRecords = [
        makeVaccineRecord({ id: 'vac_001', nextDate: futureStr, status: 'pending' }),
        makeVaccineRecord({ id: 'vac_002', nextDate: '2025-01-01', status: 'pending' }),
        makeVaccineRecord({ id: 'vac_003', nextDate: futureStr, status: 'completed' }),
      ]
      vi.mocked(api.get).mockResolvedValue(mockRecords)

      const result = await getUpcomingRecords('pet_001')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('vac_001')
    })

    it('should return empty array when no upcoming vaccines', async () => {
      const mockRecords = [
        makeVaccineRecord({ id: 'vac_001', nextDate: '2025-01-01', status: 'pending' }),
        makeVaccineRecord({ id: 'vac_002', nextDate: '2025-02-01', status: 'completed' }),
      ]
      vi.mocked(api.get).mockResolvedValue(mockRecords)

      const result = await getUpcomingRecords('pet_001', 7)

      expect(result).toEqual([])
    })
  })

  describe('getOverdueRecords', () => {
    it('should return overdue vaccine records', async () => {
      const mockRecords = [
        makeVaccineRecord({ id: 'vac_001', status: 'overdue', nextDate: '2023-01-01' }),
        makeVaccineRecord({ id: 'vac_002', status: 'pending', nextDate: '2099-01-01' }),
        makeVaccineRecord({ id: 'vac_003', status: 'completed', nextDate: '2023-01-01' }),
      ]
      vi.mocked(api.get).mockResolvedValue(mockRecords)

      const result = await getOverdueRecords('pet_001')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('vac_001')
      expect(result[0].status).toBe('overdue')
    })

    it('should return empty array when no overdue records', async () => {
      const mockRecords = [
        makeVaccineRecord({ id: 'vac_001', status: 'pending', nextDate: '2099-01-01' }),
        makeVaccineRecord({ id: 'vac_002', status: 'completed', nextDate: '2023-01-01' }),
      ]
      vi.mocked(api.get).mockResolvedValue(mockRecords)

      const result = await getOverdueRecords('pet_001')

      expect(result).toEqual([])
    })
  })

  describe('markAsCompleted', () => {
    it('should mark vaccine record as completed', async () => {
      const mockResponse = makeVaccineRecord({ id: 'vac_001', status: 'completed' })
      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const result = await markAsCompleted('vac_001')

      expect(result.status).toBe('completed')
      expect(api.put).toHaveBeenCalledWith('/api/vaccines/vac_001', { status: 'completed' })
    })
  })

  describe('getRecordsByMonth', () => {
    it('should return records for specific month', async () => {
      const mockRecords = [
        makeVaccineRecord({ id: 'vac_001', date: '2024-03-15', nextDate: '2027-03-15' }),
        makeVaccineRecord({ id: 'vac_002', date: '2024-04-01', nextDate: '2027-04-01' }),
        makeVaccineRecord({ id: 'vac_003', date: '2024-03-20', nextDate: '2025-03-20' }),
      ]
      vi.mocked(api.get).mockResolvedValue(mockRecords)

      const result = await getRecordsByMonth('pet_001', 2024, 3)

      expect(result).toHaveLength(2)
      expect(result.map((r) => r.id)).toContain('vac_001')
      expect(result.map((r) => r.id)).toContain('vac_003')
    })

    it('should return empty array when no records for the month', async () => {
      const mockRecords = [
        makeVaccineRecord({ id: 'vac_001', date: '2024-03-15', nextDate: '2027-03-15' }),
      ]
      vi.mocked(api.get).mockResolvedValue(mockRecords)

      const result = await getRecordsByMonth('pet_001', 2024, 6)

      expect(result).toEqual([])
    })
  })

  describe('generateInitialPlan', () => {
    it('should generate initial plan for dog', async () => {
      const petInfo = { species: 'dog' as const, breed: '金毛寻回犬', birthDate: '2024-01-01' }

      const result = await generateInitialPlan('pet_001', petInfo)

      expect(result.length).toBeGreaterThan(0)
      const categories = result.map((r) => r.category)
      expect(categories).toContain('DHPP')
      expect(categories).toContain('rabies')
      expect(result.every((r) => r.petId === 'pet_001')).toBe(true)
      expect(result.every((r) => r.type === 'vaccine' || r.type === 'deworm')).toBe(true)
    })

    it('should generate initial plan for cat', async () => {
      const petInfo = { species: 'cat' as const, breed: '英短', birthDate: '2020-01-01' }

      const result = await generateInitialPlan('pet_001', petInfo)

      expect(result.length).toBeGreaterThan(0)
      const categories = result.map((r) => r.category)
      expect(categories).toContain('FVRCP')
      expect(categories).toContain('rabies')
    })

    it('should return existing records if already present', async () => {
      const existingRecords = [makeVaccineRecord({ id: 'vac_existing' })]
      mockStorage['xhh_vaccines_pet_001'] = JSON.stringify(existingRecords)
      const petInfo = { species: 'dog' as const, breed: '金毛寻回犬', birthDate: '2024-01-01' }

      const result = await generateInitialPlan('pet_001', petInfo)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('vac_existing')
    })
  })

  describe('calculateNextDate', () => {
    it('should calculate next date for DHPP with 36 months interval', () => {
      const result = calculateNextDate('DHPP', '2024-01-15')
      expect(result).toBe('2027-01-15')
    })

    it('should calculate next date for rabies with 12 months interval', () => {
      const result = calculateNextDate('rabies', '2024-01-15')
      expect(result).toBe('2025-01-15')
    })

    it('should calculate next date for internal deworm with 3 months interval', () => {
      const result = calculateNextDate('internal_deworm', '2024-01-15')
      expect(result).toBe('2024-04-15')
    })

    it('should calculate next date for external deworm with 1 month interval', () => {
      const result = calculateNextDate('external_deworm', '2024-01-15')
      expect(result).toBe('2024-02-15')
    })

    it('should default to 12 months for unknown category', () => {
      const result = calculateNextDate('unknown_vaccine', '2024-01-15')
      expect(result).toBe('2025-01-15')
    })
  })

  describe('VACCINE_INTERVAL_RULES', () => {
    it('should contain all expected vaccine interval rules', () => {
      expect(VACCINE_INTERVAL_RULES.length).toBeGreaterThan(0)
      const categories = VACCINE_INTERVAL_RULES.map((r) => r.category)
      expect(categories).toContain('DHPP')
      expect(categories).toContain('rabies')
      expect(categories).toContain('FVRCP')
      expect(categories).toContain('internal_deworm')
      expect(categories).toContain('external_deworm')
    })
  })
})
