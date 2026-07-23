import { api } from './api'
import type { PetMoment, PetMilestone } from '../types/familyTypes'

export const timelineService = {
  async getMoments(petId?: string, familyId?: string): Promise<PetMoment[]> {
    const params: Record<string, string> = { limit: '50' }
    if (petId) params.pet_id = petId
    if (familyId) params.family_id = familyId
    const data = await api.get<PetMoment[]>('/api/timeline/moments', params)
    return data || []
  },

  async addMoment(moment: Omit<PetMoment, 'id' | 'createdAt'>): Promise<PetMoment> {
    const data = await api.post<PetMoment>('/api/timeline/moments', moment)
    return data
  },

  async getMilestones(petId: string): Promise<PetMilestone[]> {
    const data = await api.get<PetMilestone[]>('/api/timeline/milestones', { pet_id: petId })
    return data || []
  },

  async addMilestone(milestone: Omit<PetMilestone, 'id' | 'createdAt'>): Promise<PetMilestone> {
    const data = await api.post<PetMilestone>('/api/timeline/milestones', milestone)
    return data
  },
}
