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

import { api } from '../api'
import {
  analyzeSymptoms,
  getCheckHistory,
  getCheckResult,
  getSymptomCategories,
  getSymptomsByCategory,
  searchSymptoms,
} from '../symptomService'
import type { SymptomCheckResult } from '../symptomService'

function makeSymptomCheckResult(overrides: Partial<SymptomCheckResult> = {}): SymptomCheckResult {
  return {
    id: 'sym_001',
    petId: 'pet_001',
    symptoms: ['cough'],
    riskLevel: 'caution',
    possibleConditions: ['呼吸道感染'],
    aiAdvice: '建议观察',
    recommendedActions: ['持续观察'],
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('symptomService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k])
  })

  describe('analyzeSymptoms', () => {
    it('should return result and save locally when API succeeds', async () => {
      const mockResult = makeSymptomCheckResult({
        id: 'sym_api_001',
        symptoms: ['cough'],
        riskLevel: 'caution',
      })
      vi.mocked(api.post).mockResolvedValue(mockResult)

      const result = await analyzeSymptoms('pet_001', ['cough'])

      expect(result.riskLevel).toBe('caution')
      expect(result.symptoms).toEqual(['cough'])
      expect(api.post).toHaveBeenCalledWith('/api/pets/pet_001/symptom-checks', expect.any(Object))
    })

    it('should fallback to local engine when API fails', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'))

      const result = await analyzeSymptoms('pet_001', ['cough'])

      expect(result.riskLevel).toBe('caution')
      expect(result.symptoms).toEqual(['cough'])
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
    })

    it('should return emergency level for critical symptoms like dyspnea', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'))

      const result = await analyzeSymptoms('pet_001', ['dyspnea'])

      expect(result.riskLevel).toBe('emergency')
      expect(result.aiAdvice).toContain('紧急')
    })

    it('should return normal level for minor symptoms', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'))

      const result = await analyzeSymptoms('pet_001', ['nystagmus'])

      expect(result.riskLevel).toBe('normal')
    })

    it('should upgrade to emergency for vomiting + diarrhea combo', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'))

      const result = await analyzeSymptoms('pet_001', ['vomiting', 'diarrhea'])

      expect(result.riskLevel).toBe('emergency')
      expect(result.aiAdvice).toContain('紧急')
    })
  })

  describe('getCheckHistory', () => {
    it('should return history list when API succeeds', async () => {
      const mockHistory = [
        makeSymptomCheckResult({ id: 'sym_001', symptoms: ['cough'] }),
        makeSymptomCheckResult({ id: 'sym_002', symptoms: ['sneeze'] }),
      ]
      vi.mocked(api.get).mockResolvedValue(mockHistory)

      const result = await getCheckHistory('pet_001')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('sym_001')
      expect(result[1].id).toBe('sym_002')
      expect(api.get).toHaveBeenCalledWith('/api/pets/pet_001/symptom-checks')
    })

    it('should fallback to local storage when API fails', async () => {
      const localHistory = [
        makeSymptomCheckResult({ id: 'sym_local_001', symptoms: ['cough'] }),
      ]
      mockStorage['xhh_symptom_checks_pet_001'] = JSON.stringify(localHistory)
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const result = await getCheckHistory('pet_001')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('sym_local_001')
    })

    it('should return empty array when no history exists', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const result = await getCheckHistory('pet_001')

      expect(result).toEqual([])
    })
  })

  describe('getCheckResult', () => {
    it('should return result when API succeeds', async () => {
      const mockResult = makeSymptomCheckResult({ id: 'sym_001' })
      vi.mocked(api.get).mockResolvedValue(mockResult)

      const result = await getCheckResult('sym_001')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('sym_001')
      expect(api.get).toHaveBeenCalledWith('/api/symptom-checks/sym_001')
    })

    it('should return null when API fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'))

      const result = await getCheckResult('sym_nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getSymptomCategories', () => {
    it('should return all categories when no species filter', () => {
      const result = getSymptomCategories()

      expect(result.length).toBeGreaterThan(0)
      expect(result[0].symptoms.length).toBeGreaterThan(0)
    })

    it('should filter categories by species', () => {
      const result = getSymptomCategories('cat')

      expect(result.length).toBeGreaterThan(0)
      for (const cat of result) {
        for (const symptom of cat.symptoms) {
          expect(symptom.species).toContain('cat')
        }
      }
    })
  })

  describe('getSymptomsByCategory', () => {
    it('should return symptoms for existing category', () => {
      const result = getSymptomsByCategory('digestive')

      expect(result.length).toBeGreaterThan(0)
      expect(result.some((s) => s.id === 'vomiting')).toBe(true)
    })

    it('should return empty array for non-existent category', () => {
      const result = getSymptomsByCategory('nonexistent')

      expect(result).toEqual([])
    })
  })

  describe('searchSymptoms', () => {
    it('should find symptoms by keyword', () => {
      const result = searchSymptoms('呕吐')

      expect(result.length).toBeGreaterThan(0)
      expect(result.some((s) => s.id === 'vomiting')).toBe(true)
    })

    it('should filter by species', () => {
      const result = searchSymptoms('咳嗽', 'dog')

      expect(result.some((s) => s.id === 'cough')).toBe(true)
    })

    it('should return empty array for unmatched keyword', () => {
      const result = searchSymptoms('xyz_nonexistent')

      expect(result).toEqual([])
    })
  })
})
