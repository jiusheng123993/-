import { api } from './api'
import { mockApi } from './mock'
import { CONFIG } from '../config'
import type { PetFamily, PetFamilyMember, PetLineage, FamilyPhoto } from '../types/familyTypes'

const useMock = () => CONFIG.USE_MOCK

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
    const data = await api.get<PetFamilyMember[]>(`/api/families/${familyId}/members`)
    return data || []
  },

  async addMember(familyId: string, petId: string, role?: string): Promise<void> {
    if (useMock()) return mockApi.addMember(familyId, petId, role)
    await api.post(`/api/families/${familyId}/members`, { pet_id: petId, role })
  },

  async removeMember(familyId: string, memberId: string): Promise<void> {
    if (useMock()) return mockApi.removeMember(familyId, memberId)
    await api.delete(`/api/families/${familyId}/members/${memberId}`)
  },

  async updateMemberRole(familyId: string, memberId: string, role: string): Promise<void> {
    if (useMock()) return mockApi.updateMemberRole(familyId, memberId, role)
    await api.put(`/api/families/${familyId}/members/${memberId}`, { role })
  },

  async getLineage(
    petId: string,
  ): Promise<{ parents: PetLineage[]; children: PetLineage[] }> {
    if (useMock()) return mockApi.getLineage(petId)
    const data = await api.get<{ parents: PetLineage[]; children: PetLineage[] }>(
      `/api/pets/${petId}/lineage`
    )
    return { parents: data?.parents || [], children: data?.children || [] }
  },

  async addLineage(
    parentId: string,
    childId: string,
    litterDate?: string,
  ): Promise<void> {
    if (useMock()) return mockApi.addLineage(parentId, childId, litterDate)
    await api.post(`/api/pets/${childId}/lineage`, {
      parent_id: parentId,
      child_id: childId,
      litter_date: litterDate,
    })
  },

  async removeLineage(lineageId: string): Promise<void> {
    if (useMock()) return mockApi.removeLineage(lineageId)
    await api.delete(`/api/lineage/${lineageId}`)
  },

  async getFamilyPhotos(familyId: string): Promise<FamilyPhoto[]> {
    if (useMock()) return mockApi.getFamilyPhotos(familyId)
    const data = await api.get<FamilyPhoto[]>(`/api/families/${familyId}/photos`)
    return data || []
  },

  async saveFamilyPhoto(familyId: string, photoUrl: string, memberCount: number, memberNames: string[]): Promise<FamilyPhoto> {
    if (useMock()) return mockApi.saveFamilyPhoto(familyId, photoUrl, memberCount, memberNames)
    const data = await api.post<FamilyPhoto>(`/api/families/${familyId}/photos`, { photo_url: photoUrl, member_count: memberCount, member_names: memberNames })
    return data
  },

  async deleteFamilyPhoto(photoId: string): Promise<void> {
    if (useMock()) return mockApi.deleteFamilyPhoto(photoId)
    await api.delete(`/api/photos/${photoId}`)
  },
}
