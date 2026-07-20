import { create } from 'zustand'
import type { PetProfile } from '../memory-body/types/memoryBodyTypes'
export type { PetProfile }
import {
  getPets,
  createPet,
  updatePet,
  deletePet,
  markDeceased,
  setCurrentPet,
  getCurrentPet
} from '../services/petService'
import { setStorageUserId } from '../utils/storage'

interface PetStoreState {
  userId: string
  pets: PetProfile[]
  currentPet: PetProfile | null
  isLoading: boolean
  error: string | null

  initUser: (userId: string) => Promise<void>
  fetchPets: () => Promise<void>
  addPet: (data: Omit<PetProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PetProfile>
  updatePet: (id: string, data: Partial<PetProfile>) => Promise<void>
  removePet: (id: string) => Promise<void>
  markPetDeceased: (id: string, date: string) => Promise<void>
  switchPet: (id: string) => Promise<void>
  clearError: () => void
}

export const usePetStore = create<PetStoreState>((set, get) => ({
  userId: '',
  pets: [],
  currentPet: null,
  isLoading: false,
  error: null,

  initUser: async (userId: string) => {
    if (!userId) throw new Error('[PetStore] userId is required')
    setStorageUserId(userId)
    set({ userId })
    await get().fetchPets()
  },

  fetchPets: async () => {
    const { userId } = get()
    if (!userId) return
    set({ isLoading: true, error: null })
    try {
      const pets = await getPets(userId)
      const currentPet = await getCurrentPet(userId)
      set({ pets, currentPet, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch pets'
      })
    }
  },

  addPet: async (data) => {
    const { userId } = get()
    if (!userId) throw new Error('[PetStore] userId is required')
    set({ isLoading: true, error: null })
    try {
      const newPet = await createPet(userId, data)
      set((state) => ({
        pets: [...state.pets, newPet],
        isLoading: false
      }))
      return newPet
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to add pet'
      })
      throw err
    }
  },

  updatePet: async (id, data) => {
    const { userId } = get()
    if (!userId) throw new Error('[PetStore] userId is required')
    set({ isLoading: true, error: null })
    try {
      const updated = await updatePet(userId, id, data)
      set((state) => ({
        pets: state.pets.map((p) => (p.id === id ? updated : p)),
        currentPet: state.currentPet?.id === id ? updated : state.currentPet,
        isLoading: false
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to update pet'
      })
      throw err
    }
  },

  removePet: async (id) => {
    const { userId } = get()
    if (!userId) throw new Error('[PetStore] userId is required')
    set({ isLoading: true, error: null })
    try {
      await deletePet(userId, id)
      set((state) => ({
        pets: state.pets.filter((p) => p.id !== id),
        currentPet: state.currentPet?.id === id ? null : state.currentPet,
        isLoading: false
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to remove pet'
      })
      throw err
    }
  },

  markPetDeceased: async (id, date) => {
    const { userId } = get()
    if (!userId) throw new Error('[PetStore] userId is required')
    set({ isLoading: true, error: null })
    try {
      const updated = await markDeceased(userId, id, date)
      set((state) => ({
        pets: state.pets.map((p) => (p.id === id ? updated : p)),
        currentPet: state.currentPet?.id === id ? updated : state.currentPet,
        isLoading: false
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to mark deceased'
      })
      throw err
    }
  },

  switchPet: async (id) => {
    const { userId } = get()
    if (!userId) throw new Error('[PetStore] userId is required')
    set({ isLoading: true, error: null })
    try {
      await setCurrentPet(userId, id)
      const pet = get().pets.find((p) => p.id === id) || null
      set({ currentPet: pet, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to switch pet'
      })
      throw err
    }
  },

  clearError: () => {
    set({ error: null })
  }
}))
