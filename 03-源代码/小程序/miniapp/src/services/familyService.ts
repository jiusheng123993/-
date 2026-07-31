/**
 * 宠物家庭服务
 *
 * 宠物家庭的创建/成员管理/血缘追踪/合照管理，含本地缓存与云同步
 */
import { getStorage, setStorage } from '../utils/storage'
import { api } from './api'
import { mockApi } from './mock'
import { CONFIG } from '../config'
import type { PetFamily, PetFamilyMember, PetLineage, FamilyPhoto } from '../types/familyTypes'

const useMock = () => CONFIG.USE_MOCK

/** 家庭照片本地存储 key（后端无家庭照片端点，本地持久化） */
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
    const data = await api.get<PetFamily[]>('/api/families')
    return data || []
  },

  async createFamily(name: string): Promise<PetFamily> {
    if (useMock()) return mockApi.createFamily(name)
    const data = await api.post<PetFamily>('/api/families', { name })
    return data
  },

  async getMembers(familyId: string): Promise<PetFamilyMember[]> {
    if (useMock()) return mockApi.getMembers(familyId)
    // 后端成员通过 GET /api/families/:id 详情响应返回（含 members 字段）
    const data = await api.get<{ members?: PetFamilyMember[] }>(`/api/families/${familyId}`)
    return data?.members || []
  },

  async addMember(familyId: string, petId: string, role?: string): Promise<void> {
    if (useMock()) return mockApi.addMember(familyId, petId, role)
    // 后端 addFamilyMemberSchema 字段为 camelCase petId
    await api.post(`/api/families/${familyId}/members`, { petId, role })
  },

  async removeMember(familyId: string, memberId: string): Promise<void> {
    if (useMock()) return mockApi.removeMember(familyId, memberId)
    // 后端删除端点需要 petId（/api/families/:id/members/:petId），前端仅有成员 ID 无法映射，
    // 云端删除暂不支持，仅本地移除（store 已做本地过滤）
  },

  async updateMemberRole(familyId: string, memberId: string, role: string): Promise<void> {
    if (useMock()) return mockApi.updateMemberRole(familyId, memberId, role)
    // 后端未提供更新成员角色端点，仅本地更新（store 已做本地更新）
  },

  async getLineage(
    petId: string,
    familyId?: string,
  ): Promise<{ parents: PetLineage[]; children: PetLineage[] }> {
    if (useMock()) return mockApi.getLineage(petId)
    // 后端端点需要 familyId：GET /api/families/:familyId/lineage/:petId
    if (!familyId) return { parents: [], children: [] }
    const data = await api.get<{ parents: PetLineage[]; children: PetLineage[] }>(
      `/api/families/${familyId}/lineage/${petId}`
    )
    return { parents: data?.parents || [], children: data?.children || [] }
  },

  async addLineage(
    parentId: string,
    childId: string,
    litterDate?: string,
    familyId?: string,
  ): Promise<void> {
    if (useMock()) return mockApi.addLineage(parentId, childId, litterDate)
    // 后端端点需要 familyId：POST /api/families/:familyId/lineage（body snake_case）
    if (!familyId) return
    await api.post(`/api/families/${familyId}/lineage`, {
      parent_id: parentId,
      child_id: childId,
      litter_date: litterDate,
    })
  },

  async removeLineage(lineageId: string): Promise<void> {
    if (useMock()) return mockApi.removeLineage(lineageId)
    // 后端未提供删除血缘端点（仅删除 relationship），云端删除暂不支持
  },

  async getFamilyPhotos(familyId: string): Promise<FamilyPhoto[]> {
    if (useMock()) return mockApi.getFamilyPhotos(familyId)
    // 后端无家庭照片端点，本地持久化
    return getLocalPhotos().filter((p) => p.familyId === familyId)
  },

  async saveFamilyPhoto(familyId: string, photoUrl: string, memberCount: number, memberNames: string[], photoType: 'generated' | 'uploaded' = 'generated', description?: string): Promise<FamilyPhoto> {
    if (useMock()) return mockApi.saveFamilyPhoto(familyId, photoUrl, memberCount, memberNames, photoType, description)
    const photo: FamilyPhoto = {
      id: generatePhotoId(),
      familyId,
      userId: '',
      photoUrl,
      photoType,
      description,
      memberCount,
      memberNames,
      createdAt: new Date().toISOString(),
    }
    const photos = getLocalPhotos()
    photos.unshift(photo)
    saveLocalPhotos(photos)
    return photo
  },

  async deleteFamilyPhoto(photoId: string): Promise<void> {
    if (useMock()) return mockApi.deleteFamilyPhoto(photoId)
    const photos = getLocalPhotos().filter((p) => p.id !== photoId)
    saveLocalPhotos(photos)
  },
}
