import create from 'zustand'
import type { PetFamily, PetFamilyMember } from '../types/familyTypes'
import { familyService } from '../services/familyService'

interface FamilyState {
  families: PetFamily[]
  currentFamily: PetFamily | null
  members: PetFamilyMember[]
  loading: boolean
  fetchFamilies: () => Promise<void>
  setCurrentFamily: (family: PetFamily) => Promise<void>
  addMember: (petId: string, role?: string) => Promise<void>
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  families: [],
  currentFamily: null,
  members: [],
  loading: false,

  fetchFamilies: async () => {
    set({ loading: true })
    try {
      const families = await familyService.getFamilies()
      set({ families })
      if (families.length > 0 && !get().currentFamily) {
        set({ currentFamily: families[0] })
        const members = await familyService.getMembers(families[0].id)
        set({ members })
      }
    } finally {
      set({ loading: false })
    }
  },

  setCurrentFamily: async (family) => {
    set({ currentFamily: family, loading: true })
    try {
      const members = await familyService.getMembers(family.id)
      set({ members })
    } finally {
      set({ loading: false })
    }
  },

  addMember: async (petId, role) => {
    const family = get().currentFamily
    if (!family) return
    await familyService.addMember(family.id, petId, role)
    const members = await familyService.getMembers(family.id)
    set({ members })
  },
}))
