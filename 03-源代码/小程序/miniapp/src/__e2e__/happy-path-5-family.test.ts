import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================
// Happy Path 5: 宠物家庭 → 成员管理 → 家庭动态
// ============================================================

const mockStorage: Record<string, string> = {}
vi.mock('../utils/storage', () => ({
  getStorage: vi.fn((key: string) => {
    const raw = mockStorage[key]
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  }),
  setStorage: vi.fn((key: string, value: unknown) => {
    mockStorage[key] = JSON.stringify(value)
  }),
}))

vi.mock('../services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('../config', () => ({
  CONFIG: { USE_MOCK: false },
}))

import { api } from '../services/api'
import { familyService } from '../services/familyService'
import type { PetFamily, PetFamilyMember, PetLineage, FamilyPhoto } from '../types/familyTypes'

// ---- helpers ----

function makeFamily(overrides: Partial<PetFamily> = {}): PetFamily {
  return {
    id: 'fam-001',
    userId: 'user-001',
    name: '测试家庭',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeMember(overrides: Partial<PetFamilyMember> = {}): PetFamilyMember {
  return {
    id: 'mem-001',
    familyId: 'fam-001',
    petId: 'pet-001',
    petName: '小咪',
    role: 'parent',
    joinedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeLineage(overrides: Partial<PetLineage> = {}): PetLineage {
  return {
    id: 'lin-001',
    parentId: 'pet-001',
    childId: 'pet-003',
    litterDate: '2026-01-01',
    ...overrides,
  }
}

function makePhoto(overrides: Partial<FamilyPhoto> = {}): FamilyPhoto {
  return {
    id: 'photo-001',
    familyId: 'fam-001',
    userId: 'user-001',
    photoUrl: 'https://example.com/family-photo.jpg',
    photoType: 'generated',
    memberCount: 2,
    memberNames: ['小咪', '旺财'],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('Happy Path 5: 宠物家庭 → 成员管理 → 家庭动态', () => {
  let familyId: string
  let memberId1: string
  let memberId2: string
  let photoId: string

  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k])
  })

  // ---- step 1: 创建家庭 ----
  it('step 1: 创建家庭 "小咪的家" → 验证家庭已创建', async () => {
    const createdFamily = makeFamily({ id: 'fam-mimi', name: '小咪的家' })
    vi.mocked(api.post).mockResolvedValue(createdFamily)

    const result = await familyService.createFamily('小咪的家')

    expect(api.post).toHaveBeenCalledWith('/api/families', { name: '小咪的家' })
    expect(result.name).toBe('小咪的家')
    expect(result.id).toBe('fam-mimi')
    familyId = result.id
  })

  // ---- step 2: 获取家庭列表 ----
  it('step 2: 获取家庭列表 → 验证列表包含已创建的家庭', async () => {
    const families = [
      makeFamily({ id: 'fam-mimi', name: '小咪的家' }),
      makeFamily({ id: 'fam-002', name: '另一个家庭' }),
    ]
    vi.mocked(api.get).mockResolvedValue(families)

    const result = await familyService.getFamilies()

    expect(api.get).toHaveBeenCalledWith('/api/families')
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('小咪的家')
    familyId = 'fam-mimi'
  })

  // ---- step 3: 添加第一个成员 ----
  it('step 3: 添加成员（宠物"小咪"）到家庭 → 验证成员已添加', async () => {
    vi.mocked(api.post).mockResolvedValue(undefined)
    memberId1 = 'mem-mimi'

    await familyService.addMember('fam-mimi', 'pet-mimi', 'parent')

    expect(api.post).toHaveBeenCalledWith('/api/families/fam-mimi/members', {
      pet_id: 'pet-mimi',
      role: 'parent',
    })
    familyId = 'fam-mimi'
  })

  // ---- step 4: 添加第二个成员 ----
  it('step 4: 添加第二个成员（宠物"旺财"）→ 验证两位成员', async () => {
    vi.mocked(api.post).mockResolvedValue(undefined)
    memberId2 = 'mem-wangcai'

    await familyService.addMember('fam-mimi', 'pet-wangcai', 'child')

    expect(api.post).toHaveBeenCalledWith('/api/families/fam-mimi/members', {
      pet_id: 'pet-wangcai',
      role: 'child',
    })
    familyId = 'fam-mimi'
  })

  // ---- step 5: 获取家庭成员 ----
  it('step 5: 获取家庭成员 → 验证所有成员已返回', async () => {
    const members = [
      makeMember({ id: 'mem-mimi', familyId: 'fam-mimi', petId: 'pet-mimi', petName: '小咪', role: 'parent' }),
      makeMember({ id: 'mem-wangcai', familyId: 'fam-mimi', petId: 'pet-wangcai', petName: '旺财', role: 'child' }),
    ]
    vi.mocked(api.get).mockResolvedValue(members)

    const result = await familyService.getMembers('fam-mimi')

    expect(api.get).toHaveBeenCalledWith('/api/families/fam-mimi/members')
    expect(result).toHaveLength(2)
    expect(result[0].petName).toBe('小咪')
    expect(result[1].petName).toBe('旺财')
    familyId = 'fam-mimi'
    memberId1 = 'mem-mimi'
    memberId2 = 'mem-wangcai'
  })

  // ---- step 6: 更新成员角色 ----
  it('step 6: 更新成员角色 → 验证角色已更新', async () => {
    vi.mocked(api.put).mockResolvedValue(undefined)

    await familyService.updateMemberRole('fam-mimi', 'mem-mimi', 'admin')

    expect(api.put).toHaveBeenCalledWith('/api/families/fam-mimi/members/mem-mimi', {
      role: 'admin',
    })
    familyId = 'fam-mimi'
  })

  // ---- step 7: 获取家庭照片 ----
  it('step 7: 获取家庭照片 → 验证照片列表', async () => {
    const photos = [
      makePhoto({ id: 'photo-001', familyId: 'fam-mimi', memberNames: ['小咪', '旺财'] }),
      makePhoto({ id: 'photo-002', familyId: 'fam-mimi', photoType: 'uploaded', description: '散步合影' }),
    ]
    vi.mocked(api.get).mockResolvedValue(photos)

    const result = await familyService.getFamilyPhotos('fam-mimi')

    expect(api.get).toHaveBeenCalledWith('/api/families/fam-mimi/photos')
    expect(result).toHaveLength(2)
    expect(result[0].photoType).toBe('generated')
    expect(result[1].photoType).toBe('uploaded')
    familyId = 'fam-mimi'
  })

  // ---- step 8: 保存家庭照片 ----
  it('step 8: 保存家庭照片 → 验证照片字段正确', async () => {
    const savedPhoto = makePhoto({
      id: 'photo-new',
      familyId: 'fam-mimi',
      photoUrl: 'https://example.com/new-photo.jpg',
      memberCount: 2,
      memberNames: ['小咪', '旺财'],
      photoType: 'generated',
      description: '全家福',
    })
    vi.mocked(api.post).mockResolvedValue(savedPhoto)

    const result = await familyService.saveFamilyPhoto(
      'fam-mimi',
      'https://example.com/new-photo.jpg',
      2,
      ['小咪', '旺财'],
      'generated',
      '全家福',
    )

    expect(api.post).toHaveBeenCalledWith('/api/families/fam-mimi/photos', {
      photo_url: 'https://example.com/new-photo.jpg',
      member_count: 2,
      member_names: ['小咪', '旺财'],
      photo_type: 'generated',
      description: '全家福',
    })
    expect(result.memberCount).toBe(2)
    expect(result.memberNames).toEqual(['小咪', '旺财'])
    expect(result.photoType).toBe('generated')
    photoId = result.id
    familyId = 'fam-mimi'
  })

  // ---- step 9: 获取宠物血统 ----
  it('step 9: 获取宠物血统 → 验证血统结构', async () => {
    const lineageData = {
      parents: [makeLineage({ id: 'lin-parent', parentId: 'pet-dad', childId: 'pet-mimi' })],
      children: [makeLineage({ id: 'lin-child', parentId: 'pet-mimi', childId: 'pet-baby' })],
    }
    vi.mocked(api.get).mockResolvedValue(lineageData)

    const result = await familyService.getLineage('pet-mimi')

    expect(api.get).toHaveBeenCalledWith('/api/pets/pet-mimi/lineage')
    expect(result.parents).toHaveLength(1)
    expect(result.children).toHaveLength(1)
    expect(result.parents[0].parentId).toBe('pet-dad')
    expect(result.children[0].childId).toBe('pet-baby')
  })

  // ---- step 10: 添加血统关系 ----
  it('step 10: 添加血统关系 → 验证亲子关系已建立', async () => {
    vi.mocked(api.post).mockResolvedValue(undefined)

    await familyService.addLineage('pet-dad', 'pet-baby', '2026-06-01')

    expect(api.post).toHaveBeenCalledWith('/api/pets/pet-baby/lineage', {
      parent_id: 'pet-dad',
      child_id: 'pet-baby',
      litter_date: '2026-06-01',
    })
  })

  // ---- step 11: 移除成员 ----
  it('step 11: 移除成员 → 验证成员已移除', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined)

    await familyService.removeMember('fam-mimi', 'mem-wangcai')

    expect(api.delete).toHaveBeenCalledWith('/api/families/fam-mimi/members/mem-wangcai')
  })

  // ---- step 12: 删除家庭照片 ----
  it('step 12: 删除家庭照片 → 验证照片已删除', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined)

    await familyService.deleteFamilyPhoto('photo-new')

    expect(api.delete).toHaveBeenCalledWith('/api/photos/photo-new')
  })
})