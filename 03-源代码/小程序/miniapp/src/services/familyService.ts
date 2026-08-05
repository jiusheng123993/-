/**
 * 宠物家庭服务
 *
 * 宠物家庭的创建/成员管理/血缘追踪/合照管理，含本地缓存与云同步
 */
import { getStorage, setStorage } from '../utils/storage'
import { api } from './api'
import { mockApi } from './mock'
import { CONFIG } from '../config'
import type { PetFamily, PetFamilyMember, PetLineage, LineageResponse, LineageChild, LineageMate, FamilyPhoto } from '../types/familyTypes'

const useMock = () => CONFIG.USE_MOCK

/** 将 snake_case 键名转换为 camelCase（兼容后端未部署 toCamelCase 的情况） */
function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())
    result[camelKey] = obj[key]
  }
  return result
}

/** 将后端返回的成员数据转为前端 camelCase */
function transformMember(raw: Record<string, unknown>): PetFamilyMember {
  const m = snakeToCamel(raw)
  return {
    id: String(m.id || ''),
    familyId: String(m.familyId || ''),
    petId: String(m.petId || ''),
    role: (m.role as string) || undefined,
    joinedAt: String(m.joinedAt || ''),
  }
}

/** 将后端 snake_case 血亲行转为前端 LineageChild */
function toLineageChild(item: Record<string, unknown>): LineageChild {
  return {
    id: String(item.id),
    familyId: (item.family_id as string | null) ?? null,
    parentId: String(item.parent_id),
    childId: String(item.child_id),
    litterDate: (item.litter_date as string) || undefined,
    createdAt: (item.created_at as string) || undefined,
    petId: (item.pet_id as string) || undefined,
    petName: (item.pet_name as string | null) ?? null,
    petAvatarUrl: (item.pet_avatar_url as string | null) ?? null,
    petSpecies: (item.pet_species as string | null) ?? null,
  }
}

/** 将后端 snake_case 配偶行转为前端 LineageMate */
function toLineageMate(raw: Record<string, unknown>): LineageMate {
  return {
    id: String(raw.id),
    familyId: (raw.family_id as string) || '',
    petIdA: String(raw.pet_id_a || ''),
    petIdB: String(raw.pet_id_b || ''),
    relationType: String(raw.relation_type || 'mate'),
    labelA: (raw.label_a as string) || undefined,
    labelB: (raw.label_b as string) || undefined,
    petAName: (raw.pet_a_name as string | null) ?? null,
    petBName: (raw.pet_b_name as string | null) ?? null,
  }
}

/** 将后端 snake_case 响应转换为前端 camelCase */
function transformLineageResponse(raw: Record<string, unknown>): LineageResponse {
  const toPetLineage = (item: Record<string, unknown>): PetLineage => ({
    id: String(item.id),
    familyId: (item.family_id as string | null) ?? null,
    parentId: String(item.parent_id),
    childId: String(item.child_id),
    litterDate: (item.litter_date as string) || undefined,
    createdAt: (item.created_at as string) || undefined,
    petId: (item.pet_id as string) || undefined,
    petName: (item.pet_name as string | null) ?? null,
    petAvatarUrl: (item.pet_avatar_url as string | null) ?? null,
    petSpecies: (item.pet_species as string | null) ?? null,
  })

  const petRaw = raw.pet as Record<string, unknown>

  // 多代分组（祖先/后代）：保持按代顺序，逐层转换
  const mapLevels = (rawLevels: unknown): LineageChild[][] => {
    if (!Array.isArray(rawLevels)) return []
    return (rawLevels as Array<Record<string, unknown>[]>).map(level =>
      (level || []).map(item => toLineageChild(item as Record<string, unknown>)),
    )
  }

  return {
    pet: {
      id: String(petRaw.id),
      name: (petRaw.name as string | null) ?? null,
      avatarUrl: (petRaw.avatar_url as string | null) ?? null,
      species: (petRaw.species as string | null) ?? null,
    },
    ancestorsLevels: mapLevels(raw.ancestors_levels),
    descendantsLevels: mapLevels(raw.descendants_levels),
    parents: ((raw.parents as Array<Record<string, unknown>>) || []).map(toPetLineage),
    children: ((raw.children as Array<Record<string, unknown>>) || []).map(toPetLineage),
    siblings: ((raw.siblings as Array<Record<string, unknown>>) || []).map(toPetLineage),
    mates: ((raw.mates as Array<Record<string, unknown>>) || []).map(toLineageMate),
  }
}

/** 家庭照片本地存储 key（后端 API 不可用时本地兜底） */
const FAMILY_PHOTOS_KEY = 'family_photos_all'

function generatePhotoId(): string {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function getLocalPhotos(): FamilyPhoto[] {
  return getStorage<FamilyPhoto[]>(FAMILY_PHOTOS_KEY) || []
}

function saveLocalPhotos(photos: FamilyPhoto[]): void {
  setStorage(FAMILY_PHOTOS_KEY, photos)
}

export const familyService = {
  async getFamilies(): Promise<PetFamily[]> {
    if (useMock()) return mockApi.getFamilies()
    const data = await api.get<Record<string, unknown>[]>('/api/families')
    return (data || []).map((raw) => {
      const f = snakeToCamel(raw)
      return {
        id: String(f.id || ''),
        name: String(f.name || ''),
        avatarUrl: (f.avatarUrl as string) || undefined,
        memberCount: (f.memberCount as number) || 0,
        createdAt: String(f.createdAt || ''),
      } as PetFamily
    })
  },

  async createFamily(name: string): Promise<PetFamily> {
    if (useMock()) return mockApi.createFamily(name)
    const raw = await api.post<Record<string, unknown>>('/api/families', { name })
    const f = snakeToCamel(raw)
    return {
      id: String(f.id || ''),
      name: String(f.name || ''),
      avatarUrl: (f.avatarUrl as string) || undefined,
      memberCount: 0,
      createdAt: String(f.createdAt || ''),
    } as PetFamily
  },

  async getMembers(familyId: string): Promise<PetFamilyMember[]> {
    if (useMock()) return mockApi.getMembers(familyId)
    // 后端成员通过 GET /api/families/:id 详情响应返回（含 members 字段）
    // 服务端可能返回 snake_case，前端统一转为 camelCase
    const data = await api.get<{ members?: Record<string, unknown>[] }>(`/api/families/${familyId}`)
    return (data?.members || []).map(transformMember)
  },

  async addMember(familyId: string, petId: string, role?: string): Promise<void> {
    if (useMock()) return mockApi.addMember(familyId, petId, role)
    // 后端 addFamilyMemberSchema 字段为 camelCase petId
    await api.post(`/api/families/${familyId}/members`, { petId, role })
  },

  async removeMember(familyId: string, memberId: string): Promise<void> {
    if (useMock()) return mockApi.removeMember(familyId, memberId)
    await api.delete(`/api/families/${familyId}/members/by-id/${memberId}`)
  },

  async updateMemberRole(familyId: string, memberId: string, role: string): Promise<void> {
    if (useMock()) return mockApi.updateMemberRole(familyId, memberId, role)
    await api.patch(`/api/families/${familyId}/members/${memberId}/role`, { role })
  },

  async getLineage(
    petId: string,
    familyId: string,
  ): Promise<LineageResponse> {
    if (useMock()) return mockApi.getLineage(petId)
    const raw = await api.get<Record<string, unknown>>(
      `/api/families/${familyId}/lineage/${petId}`
    )
    if (!raw) {
      return { pet: { id: petId, name: null, avatarUrl: null, species: null }, parents: [], children: [], siblings: [], mates: [] }
    }
    return transformLineageResponse(raw)
  },

  async addLineage(
    parentId: string,
    childId: string,
    familyId: string,
    litterDate?: string,
  ): Promise<void> {
    if (useMock()) return mockApi.addLineage(parentId, childId, litterDate)
    await api.post(`/api/families/${familyId}/lineage`, {
      parent_id: parentId,
      child_id: childId,
      litter_date: litterDate,
    })
  },

  async removeLineage(lineageId: string, familyId: string): Promise<void> {
    if (useMock()) return mockApi.removeLineage(lineageId)
    await api.delete(`/api/families/${familyId}/lineage/${lineageId}`)
  },

  /** 添加配偶关系（relation_type=mate） */
  async addMate(familyId: string, petIdA: string, petIdB: string, labelA?: string, labelB?: string): Promise<void> {
    if (useMock()) return mockApi.createRelationship()
    await api.post(`/api/families/${familyId}/relationships`, {
      pet_id_a: petIdA,
      pet_id_b: petIdB,
      relation_type: 'mate',
      label_a: labelA,
      label_b: labelB,
    })
  },

  /** 删除配偶关系 */
  async removeMate(familyId: string, relationshipId: string): Promise<void> {
    if (useMock()) return mockApi.deleteRelationship(relationshipId)
    await api.delete(`/api/families/${familyId}/relationships/${relationshipId}`)
  },

  async getFamilyPhotos(familyId: string): Promise<FamilyPhoto[]> {
    if (useMock()) return mockApi.getFamilyPhotos(familyId)
    try {
      const data = await api.get<FamilyPhoto[]>(`/api/families/${familyId}/photos`)
      if (data && data.length > 0) return data
    } catch {
      // 后端不可用，使用本地存储兜底
    }
    return getLocalPhotos().filter((p) => p.familyId === familyId)
  },

  /** 发起 AI 全家福生成 */
  async generateFamilyPhoto(familyId: string, style: string): Promise<{ id: string; photoUrl: string }> {
    if (useMock()) {
      const mockPhoto = await mockApi.saveFamilyPhoto(familyId, '', 0, [], 'generated')
      return { id: mockPhoto.id, photoUrl: mockPhoto.photoUrl }
    }
    const data = await api.post<{ id: string; photoUrl: string }>(`/api/families/${familyId}/photos`, { style })
    return data
  },

  async deleteFamilyPhoto(familyId: string, photoId: string): Promise<void> {
    if (useMock()) return mockApi.deleteFamilyPhoto(photoId)
    try {
      await api.delete(`/api/families/${familyId}/photos/${photoId}`)
      return
    } catch {
      // 后端不可用，使用本地存储兜底
    }
    const photos = getLocalPhotos().filter((p) => p.id !== photoId)
    saveLocalPhotos(photos)
  },

  /** 保存用户上传或 Canvas 降级生成的全家福（不触发 AI 生成） */
  async uploadFamilyPhoto(
    familyId: string,
    data: {
      photoUrl: string
      photoType?: 'generated' | 'uploaded'
      memberCount: number
      memberNames: string[]
      description?: string
    },
  ): Promise<{ id: string }> {
    if (useMock()) {
      const mockPhoto = await mockApi.saveFamilyPhoto(familyId, data.photoUrl, data.memberCount, data.memberNames, data.photoType || 'generated')
      return { id: mockPhoto.id }
    }
    const result = await api.post<{ success: boolean; data: { id: string } }>(
      `/api/families/${familyId}/photos/upload`,
      data,
    )
    return result.data
  },
}
