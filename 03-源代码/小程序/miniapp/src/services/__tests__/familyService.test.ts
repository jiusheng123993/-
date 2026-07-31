/**
 * 家庭服务测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStorage: Record<string, string> = {}

vi.mock('../../utils/storage', () => ({
  getStorage: vi.fn((key: string) => {
    const raw = mockStorage[`xhh_${key}`]
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
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
vi.mock('../mock', () => ({
  mockApi: {
    getFamilies: vi.fn(),
    createFamily: vi.fn(),
    getMembers: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
    updateMemberRole: vi.fn(),
    getLineage: vi.fn(),
    addLineage: vi.fn(),
    removeLineage: vi.fn(),
    getFamilyPhotos: vi.fn(),
    saveFamilyPhoto: vi.fn(),
    deleteFamilyPhoto: vi.fn(),
  },
}))
vi.mock('../../config', () => ({
  CONFIG: { USE_MOCK: false },
}))

import { api as _api } from '../api'
const api = _api as any
import { familyService } from '../familyService'
import type { PetFamily, PetFamilyMember, PetLineage, FamilyPhoto } from '../../types/familyTypes'

function makeFamily(overrides: Partial<PetFamily> = {}): PetFamily {
  return {
    id: 'family-001',
    userId: 'user-001',
    name: '测试家庭',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeMember(overrides: Partial<PetFamilyMember> = {}): PetFamilyMember {
  return {
    id: 'member-001',
    familyId: 'family-001',
    petId: 'pet-001',
    petName: '小白',
    role: 'parent',
    joinedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeLineage(overrides: Partial<PetLineage> = {}): PetLineage {
  return {
    id: 'lineage-001',
    parentId: 'pet-001',
    childId: 'pet-002',
    litterDate: '2024-01-01',
    ...overrides,
  }
}

function makePhoto(overrides: Partial<FamilyPhoto> = {}): FamilyPhoto {
  return {
    id: 'photo-001',
    familyId: 'family-001',
    userId: 'user-001',
    photoUrl: 'https://example.com/photo.jpg',
    photoType: 'generated',
    memberCount: 3,
    memberNames: ['小白', '小黑', '小花'],
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('familyService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k])
  })

  describe('getFamilies', () => {
    it('calls api.get with /api/families', async () => {
      vi.mocked(api.get).mockResolvedValue([makeFamily()])

      await familyService.getFamilies()

      expect(api.get).toHaveBeenCalledWith('/api/families')
    })

    it('returns empty array when API returns null', async () => {
      vi.mocked(api.get).mockResolvedValue(null)

      const result = await familyService.getFamilies()

      expect(result).toEqual([])
    })

    it('returns families array when API returns data', async () => {
      const families = [makeFamily(), makeFamily({ id: 'family-002', name: '家庭二' })]
      vi.mocked(api.get).mockResolvedValue(families)

      const result = await familyService.getFamilies()

      expect(result).toEqual(families)
      expect(result).toHaveLength(2)
    })
  })

  describe('createFamily', () => {
    it('calls api.post with /api/families and { name }', async () => {
      const newFamily = makeFamily({ name: '新家庭' })
      vi.mocked(api.post).mockResolvedValue(newFamily)

      await familyService.createFamily('新家庭')

      expect(api.post).toHaveBeenCalledWith('/api/families', { name: '新家庭' })
    })

    it('returns created family', async () => {
      const newFamily = makeFamily({ id: 'family-new', name: '新家庭' })
      vi.mocked(api.post).mockResolvedValue(newFamily)

      const result = await familyService.createFamily('新家庭')

      expect(result).toEqual(newFamily)
      expect(result.name).toBe('新家庭')
    })
  })

  describe('getMembers', () => {
    it('calls api.get with /api/families/{familyId} detail endpoint', async () => {
      vi.mocked(api.get).mockResolvedValue({ members: [makeMember()] })

      await familyService.getMembers('family-001')

      expect(api.get).toHaveBeenCalledWith('/api/families/family-001')
    })

    it('returns empty array when API returns null', async () => {
      vi.mocked(api.get).mockResolvedValue(null)

      const result = await familyService.getMembers('family-001')

      expect(result).toEqual([])
    })

    it('returns members array when API returns data', async () => {
      const members = [makeMember(), makeMember({ id: 'member-002', petName: '小黑' })]
      vi.mocked(api.get).mockResolvedValue({ members })

      const result = await familyService.getMembers('family-001')

      expect(result).toEqual(members)
      expect(result).toHaveLength(2)
    })
  })

  describe('addMember', () => {
    it('calls api.post with /api/families/{familyId}/members and { petId, role }', async () => {
      vi.mocked(api.post).mockResolvedValue(undefined)

      await familyService.addMember('family-001', 'pet-001', 'parent')

      expect(api.post).toHaveBeenCalledWith('/api/families/family-001/members', {
        petId: 'pet-001',
        role: 'parent',
      })
    })

    it('sends role as undefined when not provided', async () => {
      vi.mocked(api.post).mockResolvedValue(undefined)

      await familyService.addMember('family-001', 'pet-001')

      expect(api.post).toHaveBeenCalledWith('/api/families/family-001/members', {
        petId: 'pet-001',
        role: undefined,
      })
    })
  })

  describe('removeMember', () => {
    it('removes member locally without API call', async () => {
      await familyService.removeMember('family-001', 'member-001')

      expect(api.delete).not.toHaveBeenCalled()
    })
  })

  describe('updateMemberRole', () => {
    it('updates role locally without API call', async () => {
      await familyService.updateMemberRole('family-001', 'member-001', 'admin')

      expect(api.put).not.toHaveBeenCalled()
    })
  })

  describe('getLineage', () => {
    it('calls api.get with /api/families/{familyId}/lineage/{petId}', async () => {
      vi.mocked(api.get).mockResolvedValue({
        parents: [makeLineage()],
        children: [makeLineage({ id: 'lineage-002' })],
      })

      await familyService.getLineage('pet-001', 'family-001')

      expect(api.get).toHaveBeenCalledWith('/api/families/family-001/lineage/pet-001')
    })

    it('returns empty structure when familyId is missing', async () => {
      const result = await familyService.getLineage('pet-001')

      expect(result).toEqual({ parents: [], children: [] })
      expect(api.get).not.toHaveBeenCalled()
    })

    it('returns default structure when API returns null', async () => {
      vi.mocked(api.get).mockResolvedValue(null)

      const result = await familyService.getLineage('pet-001', 'family-001')

      expect(result).toEqual({ parents: [], children: [] })
    })

    it('returns lineage when API returns data', async () => {
      const lineageData = {
        parents: [makeLineage()],
        children: [makeLineage({ id: 'lineage-002', childId: 'pet-003' })],
      }
      vi.mocked(api.get).mockResolvedValue(lineageData)

      const result = await familyService.getLineage('pet-001', 'family-001')

      expect(result).toEqual(lineageData)
      expect(result.parents).toHaveLength(1)
      expect(result.children).toHaveLength(1)
    })
  })

  describe('addLineage', () => {
    it('calls api.post with correct params including litter_date', async () => {
      vi.mocked(api.post).mockResolvedValue(undefined)

      await familyService.addLineage('pet-001', 'pet-002', '2024-01-01', 'family-001')

      expect(api.post).toHaveBeenCalledWith('/api/families/family-001/lineage', {
        parent_id: 'pet-001',
        child_id: 'pet-002',
        litter_date: '2024-01-01',
      })
    })

    it('sends litter_date as undefined when not provided', async () => {
      vi.mocked(api.post).mockResolvedValue(undefined)

      await familyService.addLineage('pet-001', 'pet-002', undefined, 'family-001')

      expect(api.post).toHaveBeenCalledWith('/api/families/family-001/lineage', {
        parent_id: 'pet-001',
        child_id: 'pet-002',
        litter_date: undefined,
      })
    })

    it('does nothing when familyId is missing', async () => {
      await familyService.addLineage('pet-001', 'pet-002')

      expect(api.post).not.toHaveBeenCalled()
    })
  })

  describe('removeLineage', () => {
    it('removes lineage locally without API call', async () => {
      await familyService.removeLineage('lineage-001')

      expect(api.delete).not.toHaveBeenCalled()
    })
  })

  describe('getFamilyPhotos', () => {
    it('returns empty array when no local photos exist', async () => {
      const result = await familyService.getFamilyPhotos('family-001')

      expect(result).toEqual([])
    })

    it('returns local photos filtered by familyId', async () => {
      mockStorage['xhh_family_photos_all'] = JSON.stringify([
        makePhoto(),
        makePhoto({ id: 'photo-002', familyId: 'family-002' }),
      ])

      const result = await familyService.getFamilyPhotos('family-001')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('photo-001')
    })
  })

  describe('saveFamilyPhoto', () => {
    it('saves photo to local storage and returns it', async () => {
      const result = await familyService.saveFamilyPhoto(
        'family-001',
        'https://example.com/photo.jpg',
        3,
        ['小白', '小黑', '小花'],
      )

      expect(result.familyId).toBe('family-001')
      expect(result.photoType).toBe('generated')
      expect(result.memberCount).toBe(3)
      expect(result.memberNames).toEqual(['小白', '小黑', '小花'])
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(api.post).not.toHaveBeenCalled()
    })

    it('passes custom photoType and description', async () => {
      const result = await familyService.saveFamilyPhoto(
        'family-001',
        'https://example.com/photo.jpg',
        3,
        ['小白', '小黑', '小花'],
        'uploaded',
        '全家福合影',
      )

      expect(result.photoType).toBe('uploaded')
      expect(result.description).toBe('全家福合影')
    })

    it('persists photo and returns it in getFamilyPhotos', async () => {
      await familyService.saveFamilyPhoto(
        'family-001',
        'https://example.com/photo.jpg',
        3,
        ['小白', '小黑', '小花'],
      )

      const photos = await familyService.getFamilyPhotos('family-001')
      expect(photos).toHaveLength(1)
      expect(photos[0].photoUrl).toBe('https://example.com/photo.jpg')
    })
  })

  describe('deleteFamilyPhoto', () => {
    it('deletes photo from local storage', async () => {
      mockStorage['xhh_family_photos_all'] = JSON.stringify([
        makePhoto({ id: 'photo-001' }),
        makePhoto({ id: 'photo-002' }),
      ])

      await familyService.deleteFamilyPhoto('photo-001')

      const photos = await familyService.getFamilyPhotos('family-001')
      expect(photos).toHaveLength(1)
      expect(photos[0].id).toBe('photo-002')
    })
  })
})