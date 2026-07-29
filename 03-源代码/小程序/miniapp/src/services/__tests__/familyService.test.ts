import { describe, it, expect, vi, beforeEach } from 'vitest'

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
    it('calls api.get with /api/families/{familyId}/members', async () => {
      vi.mocked(api.get).mockResolvedValue([makeMember()])

      await familyService.getMembers('family-001')

      expect(api.get).toHaveBeenCalledWith('/api/families/family-001/members')
    })

    it('returns empty array when API returns null', async () => {
      vi.mocked(api.get).mockResolvedValue(null)

      const result = await familyService.getMembers('family-001')

      expect(result).toEqual([])
    })

    it('returns members array when API returns data', async () => {
      const members = [makeMember(), makeMember({ id: 'member-002', petName: '小黑' })]
      vi.mocked(api.get).mockResolvedValue(members)

      const result = await familyService.getMembers('family-001')

      expect(result).toEqual(members)
      expect(result).toHaveLength(2)
    })
  })

  describe('addMember', () => {
    it('calls api.post with /api/families/{familyId}/members and { pet_id, role }', async () => {
      vi.mocked(api.post).mockResolvedValue(undefined)

      await familyService.addMember('family-001', 'pet-001', 'parent')

      expect(api.post).toHaveBeenCalledWith('/api/families/family-001/members', {
        pet_id: 'pet-001',
        role: 'parent',
      })
    })

    it('sends role as undefined when not provided', async () => {
      vi.mocked(api.post).mockResolvedValue(undefined)

      await familyService.addMember('family-001', 'pet-001')

      expect(api.post).toHaveBeenCalledWith('/api/families/family-001/members', {
        pet_id: 'pet-001',
        role: undefined,
      })
    })
  })

  describe('removeMember', () => {
    it('calls api.delete with /api/families/{familyId}/members/{memberId}', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined)

      await familyService.removeMember('family-001', 'member-001')

      expect(api.delete).toHaveBeenCalledWith('/api/families/family-001/members/member-001')
    })
  })

  describe('updateMemberRole', () => {
    it('calls api.put with /api/families/{familyId}/members/{memberId} and { role }', async () => {
      vi.mocked(api.put).mockResolvedValue(undefined)

      await familyService.updateMemberRole('family-001', 'member-001', 'admin')

      expect(api.put).toHaveBeenCalledWith('/api/families/family-001/members/member-001', {
        role: 'admin',
      })
    })
  })

  describe('getLineage', () => {
    it('calls api.get with /api/pets/{petId}/lineage', async () => {
      vi.mocked(api.get).mockResolvedValue({
        parents: [makeLineage()],
        children: [makeLineage({ id: 'lineage-002' })],
      })

      await familyService.getLineage('pet-001')

      expect(api.get).toHaveBeenCalledWith('/api/pets/pet-001/lineage')
    })

    it('returns default structure when API returns null', async () => {
      vi.mocked(api.get).mockResolvedValue(null)

      const result = await familyService.getLineage('pet-001')

      expect(result).toEqual({ parents: [], children: [] })
    })

    it('returns lineage when API returns data', async () => {
      const lineageData = {
        parents: [makeLineage()],
        children: [makeLineage({ id: 'lineage-002', childId: 'pet-003' })],
      }
      vi.mocked(api.get).mockResolvedValue(lineageData)

      const result = await familyService.getLineage('pet-001')

      expect(result).toEqual(lineageData)
      expect(result.parents).toHaveLength(1)
      expect(result.children).toHaveLength(1)
    })
  })

  describe('addLineage', () => {
    it('calls api.post with correct params including litter_date', async () => {
      vi.mocked(api.post).mockResolvedValue(undefined)

      await familyService.addLineage('pet-001', 'pet-002', '2024-01-01')

      expect(api.post).toHaveBeenCalledWith('/api/pets/pet-002/lineage', {
        parent_id: 'pet-001',
        child_id: 'pet-002',
        litter_date: '2024-01-01',
      })
    })

    it('sends litter_date as undefined when not provided', async () => {
      vi.mocked(api.post).mockResolvedValue(undefined)

      await familyService.addLineage('pet-001', 'pet-002')

      expect(api.post).toHaveBeenCalledWith('/api/pets/pet-002/lineage', {
        parent_id: 'pet-001',
        child_id: 'pet-002',
        litter_date: undefined,
      })
    })
  })

  describe('removeLineage', () => {
    it('calls api.delete with /api/lineage/{lineageId}', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined)

      await familyService.removeLineage('lineage-001')

      expect(api.delete).toHaveBeenCalledWith('/api/lineage/lineage-001')
    })
  })

  describe('getFamilyPhotos', () => {
    it('calls api.get with /api/families/{familyId}/photos', async () => {
      vi.mocked(api.get).mockResolvedValue([makePhoto()])

      await familyService.getFamilyPhotos('family-001')

      expect(api.get).toHaveBeenCalledWith('/api/families/family-001/photos')
    })

    it('returns empty array when API returns null', async () => {
      vi.mocked(api.get).mockResolvedValue(null)

      const result = await familyService.getFamilyPhotos('family-001')

      expect(result).toEqual([])
    })
  })

  describe('saveFamilyPhoto', () => {
    it('calls api.post with correct params including photo_type default', async () => {
      const photo = makePhoto()
      vi.mocked(api.post).mockResolvedValue(photo)

      await familyService.saveFamilyPhoto(
        'family-001',
        'https://example.com/photo.jpg',
        3,
        ['小白', '小黑', '小花'],
      )

      expect(api.post).toHaveBeenCalledWith('/api/families/family-001/photos', {
        photo_url: 'https://example.com/photo.jpg',
        member_count: 3,
        member_names: ['小白', '小黑', '小花'],
        photo_type: 'generated',
        description: undefined,
      })
    })

    it('uses default photoType=generated when not provided', async () => {
      const photo = makePhoto()
      vi.mocked(api.post).mockResolvedValue(photo)

      await familyService.saveFamilyPhoto(
        'family-001',
        'https://example.com/photo.jpg',
        3,
        ['小白', '小黑', '小花'],
      )

      const callArgs = vi.mocked(api.post).mock.calls[0][1] as any
      expect(callArgs.photo_type).toBe('generated')
    })

    it('passes custom photoType when provided', async () => {
      const photo = makePhoto({ photoType: 'uploaded' })
      vi.mocked(api.post).mockResolvedValue(photo)

      await familyService.saveFamilyPhoto(
        'family-001',
        'https://example.com/photo.jpg',
        3,
        ['小白', '小黑', '小花'],
        'uploaded',
        '全家福合影',
      )

      expect(api.post).toHaveBeenCalledWith('/api/families/family-001/photos', {
        photo_url: 'https://example.com/photo.jpg',
        member_count: 3,
        member_names: ['小白', '小黑', '小花'],
        photo_type: 'uploaded',
        description: '全家福合影',
      })
    })

    it('returns the saved photo', async () => {
      const photo = makePhoto()
      vi.mocked(api.post).mockResolvedValue(photo)

      const result = await familyService.saveFamilyPhoto(
        'family-001',
        'https://example.com/photo.jpg',
        3,
        ['小白', '小黑', '小花'],
      )

      expect(result).toEqual(photo)
    })
  })

  describe('deleteFamilyPhoto', () => {
    it('calls api.delete with /api/photos/{photoId}', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined)

      await familyService.deleteFamilyPhoto('photo-001')

      expect(api.delete).toHaveBeenCalledWith('/api/photos/photo-001')
    })
  })
})