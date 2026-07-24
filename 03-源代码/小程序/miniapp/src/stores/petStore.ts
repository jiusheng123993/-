import Taro from '@tarojs/taro'
import create from 'zustand'
import {
  getPets,
  createPet,
  updatePet,
  deletePet,
  markDeceased,
  setCurrentPet,
  type PetProfile,
} from '../services/petService'

interface PetState {
  userId: string | null
  pets: PetProfile[]
  currentPet: PetProfile | null
  isLoading: boolean
  error: string | null
  initUser: (userId: string) => Promise<void>
  fetchPets: (userId: string) => Promise<void>
  addPet: (data: Omit<PetProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PetProfile>
  updatePet: (id: string, data: Partial<PetProfile>) => Promise<void>
  removePet: (id: string) => Promise<void>
  markPetDeceased: (id: string, date: string) => Promise<void>
  switchPet: (id: string) => Promise<void>
  clearError: () => void
  avatar2DTaskId: string | null
  avatar3DTaskId: string | null
  setAvatar2DTaskId: (taskId: string | null) => void
  setAvatar3DTaskId: (taskId: string | null) => void
}

export const usePetStore = create<PetState>((set, get) => ({
  userId: null,
  pets: [],
  currentPet: null,
  isLoading: false,
  error: null,
  avatar2DTaskId: null,
  avatar3DTaskId: null,

  initUser: async (userId: string) => {
    set({ userId })
    await get().fetchPets(userId)
  },

  fetchPets: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const pets = await getPets(userId)
      const { currentPet } = get()
      set({
        pets,
        isLoading: false,
        currentPet: currentPet
          ? pets.find(p => p.id === currentPet.id) || pets[0] || null
          : pets[0] || null,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取宠物列表失败',
      })
    }
  },

  addPet: async (data) => {
    const { userId } = get()
    if (!userId) throw new Error('用户未登录')
    set({ isLoading: true, error: null })
    try {
      const pet = await createPet(userId, data)
      set(state => ({
        pets: [...state.pets, pet],
        currentPet: state.currentPet || pet,
        isLoading: false,
      }))
      return pet
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '添加宠物失败',
      })
      throw err
    }
  },

  updatePet: async (id, data) => {
    const { userId } = get()
    if (!userId) throw new Error('用户未登录')
    set({ isLoading: true, error: null })
    try {
      const updated = await updatePet(userId, id, data)
      set(state => ({
        pets: state.pets.map(p => p.id === id ? updated : p),
        currentPet: state.currentPet?.id === id ? updated : state.currentPet,
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '更新宠物失败',
      })
      throw err
    }
  },

  removePet: async (id) => {
    const { userId } = get()
    if (!userId) throw new Error('用户未登录')
    set({ isLoading: true, error: null })
    try {
      await deletePet(userId, id)
      set(state => {
        const remainingPets = state.pets.filter(p => p.id !== id)
        return {
          pets: remainingPets,
          currentPet: state.currentPet?.id === id
            ? (remainingPets[0] || null)
            : state.currentPet,
          isLoading: false,
        }
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '删除宠物失败',
      })
      throw err
    }
  },

  markPetDeceased: async (id, date) => {
    const { userId } = get()
    if (!userId) throw new Error('用户未登录')
    set({ isLoading: true, error: null })
    try {
      const updated = await markDeceased(userId, id, date)
      set(state => ({
        pets: state.pets.map(p => p.id === id ? updated : p),
        currentPet: state.currentPet?.id === id ? updated : state.currentPet,
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '标记离世失败',
      })
      throw err
    }
  },

  switchPet: async (id) => {
    const { userId } = get()
    if (!userId) throw new Error('用户未登录')
    try {
      const pet = get().pets.find(p => p.id === id)
      if (pet) {
        set({ currentPet: pet })
        await setCurrentPet(userId, id)
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '切换宠物失败',
      })
      throw err
    }
  },

  clearError: () => {
    set({ error: null })
  },

  setAvatar2DTaskId: (taskId) => {
    set({ avatar2DTaskId: taskId })
    if (taskId) {
      Taro.setStorageSync('xhh_avatar_2d_task_id', taskId)
    } else {
      Taro.removeStorageSync('xhh_avatar_2d_task_id')
    }
  },

  setAvatar3DTaskId: (taskId) => {
    set({ avatar3DTaskId: taskId })
    if (taskId) {
      Taro.setStorageSync('xhh_avatar_3d_task_id', taskId)
    } else {
      Taro.removeStorageSync('xhh_avatar_3d_task_id')
    }
  },
}))

export type { PetProfile }