/**
 * 宠物档案服务测试
 */
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
  createPet,
  getPets,
  getPetById,
  updatePet,
  deletePet,
  markDeceased,
  getCurrentPet,
  setCurrentPet,
} from '../petService'
import type { PetProfile } from '../petService'

const mockPetData: Omit<PetProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '旺财',
  species: 'dog',
  breed: '金毛寻回犬',
  breedId: 'golden-retriever',
  gender: 'male',
  birthDate: '2022-01-15',
  weight: 30,
  coatColor: '',
  avatarPhotoUrl: '',
  photos: [],
  isNeutered: true,
  microchipId: '',
  notes: '很活泼',
  isDeceased: false,
  allergies: [],
  medications: [],
  chronicConditions: [],
  userId: 'user_001',
}

const mockPetData2: Omit<PetProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '咪咪',
  species: 'cat',
  breed: '英短',
  breedId: 'british-shorthair',
  gender: 'female',
  birthDate: '2023-06-01',
  weight: 4,
  coatColor: '',
  avatarPhotoUrl: '',
  photos: [],
  isNeutered: false,
  microchipId: '',
  notes: '很乖',
  isDeceased: false,
  allergies: [],
  medications: [],
  chronicConditions: [],
  userId: 'user_001',
}

function makePetResponse(overrides: Partial<PetProfile> = {}): PetProfile {
  return {
    id: 'pet_001',
    name: '旺财',
    species: 'dog',
    breed: '金毛寻回犬',
    breedId: 'golden-retriever',
    gender: 'male',
    birthDate: '2022-01-15',
    weight: 30,
    coatColor: '',
    avatarPhotoUrl: '',
    photos: [],
    isNeutered: true,
    microchipId: '',
    notes: '很活泼',
    isDeceased: false,
    allergies: [],
    medications: [],
    chronicConditions: [],
    userId: 'user_001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('petService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k])
  })

  describe('createPet', () => {
    it('should create pet successfully and return full PetProfile', async () => {
      const mockResponse = makePetResponse()
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await createPet('test_user', mockPetData)

      expect(result.name).toBe('旺财')
      expect(result.species).toBe('dog')
      expect(result.breed).toBe('金毛寻回犬')
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(api.post).toHaveBeenCalledWith('/api/pets', expect.objectContaining({ name: '旺财' }))
    })

    it('should create second pet', async () => {
      const mockResponse = makePetResponse({ id: 'pet_002', name: '咪咪', species: 'cat' })
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await createPet('test_user', mockPetData2)

      expect(result.name).toBe('咪咪')
      expect(result.species).toBe('cat')
      expect(result.id).toBe('pet_002')
    })

    it('should fallback to local storage when API fails', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'))

      const result = await createPet('test_user', mockPetData)

      expect(result.name).toBe('旺财')
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
    })
  })

  describe('getPets', () => {
    it('should return pet list from API', async () => {
      const mockPets = [makePetResponse(), makePetResponse({ id: 'pet_002', name: '咪咪' })]
      vi.mocked(api.get).mockResolvedValue(mockPets)

      const result = await getPets('test_user')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('旺财')
      expect(result[1].name).toBe('咪咪')
      expect(api.get).toHaveBeenCalledWith('/api/pets')
    })

    it('should return empty array when no pets', async () => {
      vi.mocked(api.get).mockResolvedValue([])

      const result = await getPets('test_user')

      expect(result).toEqual([])
    })

    it('should fallback to local storage when API fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const result = await getPets('test_user')

      expect(result).toEqual([])
    })
  })

  describe('getPetById', () => {
    it('should return pet when found', async () => {
      const mockPet = makePetResponse()
      vi.mocked(api.get).mockResolvedValue(mockPet)

      const result = await getPetById('test_user', 'pet_001')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('pet_001')
      expect(result!.name).toBe('旺财')
      expect(api.get).toHaveBeenCalledWith('/api/pets/pet_001')
    })

    it('should return null when pet not found', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'))

      const result = await getPetById('test_user', 'nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('updatePet', () => {
    it('should update pet info', async () => {
      const updatedPet = makePetResponse({ name: '旺财2', weight: 32 })
      vi.mocked(api.put).mockResolvedValue(updatedPet)

      const result = await updatePet('test_user', 'pet_001', { name: '旺财2', weight: 32 })

      expect(result.name).toBe('旺财2')
      expect(result.weight).toBe(32)
      expect(api.put).toHaveBeenCalledWith('/api/pets/pet_001', { name: '旺财2', weight: 32 })
    })

    it('should throw error when pet does not exist locally and API fails', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('Network error'))

      await expect(updatePet('test_user', 'nonexistent', { name: 'test' })).rejects.toThrow()
    })
  })

  describe('deletePet', () => {
    it('should delete pet successfully', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined)

      await expect(deletePet('test_user', 'pet_001')).resolves.toBeUndefined()
      expect(api.delete).toHaveBeenCalledWith('/api/pets/pet_001')
    })

    it('should still remove from local storage when API fails', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Network error'))

      await expect(deletePet('test_user', 'pet_001')).resolves.toBeUndefined()
    })
  })

  describe('markDeceased', () => {
    it('should mark pet as deceased', async () => {
      const deceasedPet = makePetResponse({ isDeceased: true, deceasedDate: '2024-06-01' })
      vi.mocked(api.put).mockResolvedValue(deceasedPet)

      const result = await markDeceased('test_user', 'pet_001', '2024-06-01')

      expect(result.isDeceased).toBe(true)
      expect(result.deceasedDate).toBe('2024-06-01')
      expect(api.put).toHaveBeenCalledWith('/api/pets/pet_001', {
        isDeceased: true,
        deceasedDate: '2024-06-01',
      })
    })
  })

  describe('getCurrentPet / setCurrentPet', () => {
    it('should set and get current pet', async () => {
      const mockPet = makePetResponse()
      vi.mocked(api.get).mockResolvedValue(mockPet)

      await setCurrentPet('test_user', 'pet_001')

      const result = await getCurrentPet('test_user')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('pet_001')
    })

    it('should return first pet when no current pet is set', async () => {
      const mockPets = [makePetResponse(), makePetResponse({ id: 'pet_002', name: '咪咪' })]
      vi.mocked(api.get).mockResolvedValue(mockPets)

      const result = await getCurrentPet('test_user')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('pet_001')
    })

    it('should return null when no pets exist and no current pet set', async () => {
      vi.mocked(api.get).mockResolvedValue([])

      const result = await getCurrentPet('test_user')

      expect(result).toBeNull()
    })
  })
})
