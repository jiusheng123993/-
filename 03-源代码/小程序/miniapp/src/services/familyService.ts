import { supabaseClient } from './supabaseClient'
import type { PetFamily, PetFamilyMember, PetLineage } from '../types/familyTypes'

export const familyService = {
  async getFamilies(): Promise<PetFamily[]> {
    const { data, error } = await supabaseClient.select<PetFamily>('pet_families', {
      order: 'created_at.desc',
    })
    if (error) throw new Error(error)
    return data || []
  },

  async createFamily(name: string): Promise<PetFamily> {
    const { data, error } = await supabaseClient.insert<PetFamily>('pet_families', {
      name,
    } as any)
    if (error) throw new Error(error)
    return (data || [])[0] as PetFamily
  },

  async getMembers(familyId: string): Promise<PetFamilyMember[]> {
    const { data, error } = await supabaseClient.select<PetFamilyMember>(
      'pet_family_members',
      { family_id: `eq.${familyId}` },
    )
    if (error) throw new Error(error)
    return data || []
  },

  async addMember(familyId: string, petId: string, role?: string): Promise<void> {
    const { error } = await supabaseClient.insert('pet_family_members', {
      family_id: familyId,
      pet_id: petId,
      role,
    })
    if (error) throw new Error(error)
  },

  async getLineage(
    petId: string,
  ): Promise<{ parents: PetLineage[]; children: PetLineage[] }> {
    const [parentRes, childRes] = await Promise.all([
      supabaseClient.select<PetLineage>('pet_lineage', {
        child_id: `eq.${petId}`,
      }),
      supabaseClient.select<PetLineage>('pet_lineage', {
        parent_id: `eq.${petId}`,
      }),
    ])
    return {
      parents: parentRes.data || [],
      children: childRes.data || [],
    }
  },

  async addLineage(
    parentId: string,
    childId: string,
    litterDate?: string,
  ): Promise<void> {
    const { error } = await supabaseClient.insert('pet_lineage', {
      parent_id: parentId,
      child_id: childId,
      litter_date: litterDate,
    })
    if (error) throw new Error(error)
  },
}
