import { supabaseClient } from './supabaseClient'
import type { PetMoment, PetMilestone } from '../types/familyTypes'

export const timelineService = {
  async getMoments(petId?: string, familyId?: string): Promise<PetMoment[]> {
    const params: Record<string, string> = { order: 'created_at.desc', limit: '50' }
    if (petId) params.pet_id = `eq.${petId}`
    if (familyId) params.family_id = `eq.${familyId}`
    const { data, error } = await supabaseClient.select<PetMoment>('pet_moments', params)
    if (error) throw new Error(error)
    return data || []
  },

  async addMoment(moment: Omit<PetMoment, 'id' | 'createdAt'>): Promise<PetMoment> {
    const { data, error } = await supabaseClient.insert<PetMoment>('pet_moments', moment as any)
    if (error) throw new Error(error)
    return (data || [])[0] as PetMoment
  },

  async getMilestones(petId: string): Promise<PetMilestone[]> {
    const { data, error } = await supabaseClient.select<PetMilestone>('pet_milestones', {
      pet_id: `eq.${petId}`,
      order: 'date.desc',
    })
    if (error) throw new Error(error)
    return data || []
  },

  async addMilestone(milestone: Omit<PetMilestone, 'id' | 'createdAt'>): Promise<PetMilestone> {
    const { data, error } = await supabaseClient.insert<PetMilestone>('pet_milestones', milestone as any)
    if (error) throw new Error(error)
    return (data || [])[0] as PetMilestone
  },
}
