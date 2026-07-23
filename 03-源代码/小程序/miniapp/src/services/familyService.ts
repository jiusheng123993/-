import { api } from './api'
import type { PetFamily, PetFamilyMember, PetLineage } from '../types/familyTypes'

export const familyService = {
  async getFamilies(): Promise<PetFamily[]> {
    const data = await api.get<PetFamily[]>('/api/families')
    return data || []
  },

  async createFamily(name: string): Promise<PetFamily> {
    const data = await api.post<PetFamily>('/api/families', { name })
    return data
  },

  async getMembers(familyId: string): Promise<PetFamilyMember[]> {
    const data = await api.get<PetFamilyMember[]>(`/api/families/${familyId}/members`)
    return data || []
  },

  async addMember(familyId: string, petId: string, role?: string): Promise<void> {
    await api.post(`/api/families/${familyId}/members`, { pet_id: petId, role })
  },

  async getLineage(
    petId: string,
  ): Promise<{ parents: PetLineage[]; children: PetLineage[] }> {
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
    await api.post(`/api/pets/${childId}/lineage`, {
      parent_id: parentId,
      child_id: childId,
      litter_date: litterDate,
    })
  },
}
