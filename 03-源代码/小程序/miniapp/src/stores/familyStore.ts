/**
 * 宠物家庭状态管理
 * 管理宠物家庭成员、家庭相册和家庭切换
 */
import create from 'zustand'
import type { PetFamily, PetFamilyMember, FamilyPhoto } from '../types/familyTypes'
import { familyService } from '../services/familyService'

/** 宠物家庭状态定义 */
interface FamilyState {
  families: PetFamily[]
  currentFamily: PetFamily | null
  members: PetFamilyMember[]
  photos: FamilyPhoto[]
  photosLoading: boolean
  loading: boolean
  error: string | null
  fetchFamilies: () => Promise<void>
  setCurrentFamily: (family: PetFamily) => Promise<void>
  createFamily: (name: string) => Promise<void>
  addMember: (petId: string, role?: string) => Promise<void>
  removeMember: (memberId: string) => Promise<void>
  updateMemberRole: (memberId: string, role: string) => Promise<void>
  fetchPhotos: () => Promise<void>
  savePhoto: (photoUrl: string, memberCount: number, memberNames: string[], photoType?: 'generated' | 'uploaded', description?: string) => Promise<void>
  deletePhoto: (photoId: string) => Promise<void>
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  families: [],
  currentFamily: null,
  members: [],
  photos: [],
  photosLoading: false,
  loading: false,
  error: null,

  /** 获取所有家庭列表，默认选中第一个家庭 */
  fetchFamilies: async () => {
    set({ loading: true, error: null })
    try {
      const families = await familyService.getFamilies()
      set({ families })
      if (families.length > 0 && !get().currentFamily) {
        set({ currentFamily: families[0] })
        const members = await familyService.getMembers(families[0].id)
        set({ members })
      }
    } catch (err) {
      set({ error: '加载家庭列表失败' })
    } finally {
      set({ loading: false })
    }
  },

  /** 切换当前家庭并加载其成员 */
  setCurrentFamily: async (family) => {
    set({ currentFamily: family, loading: true, error: null })
    try {
      const members = await familyService.getMembers(family.id)
      set({ members })
    } catch (err) {
      set({ error: '加载家庭成员失败' })
    } finally {
      set({ loading: false })
    }
  },

  /** 创建新家庭 */
  createFamily: async (name) => {
    set({ loading: true, error: null })
    try {
      const family = await familyService.createFamily(name)
      set((state) => ({
        families: [...state.families, family],
        currentFamily: family,
        members: [],
      }))
    } catch (err) {
      set({ error: '创建家庭失败' })
    } finally {
      set({ loading: false })
    }
  },

  /**
   * 添加家庭成员
   * @param petId - 宠物 ID
   * @param role - 家庭角色
   */
  addMember: async (petId, role) => {
    const family = get().currentFamily
    if (!family) return
    set({ error: null })
    try {
      await familyService.addMember(family.id, petId, role)
      const members = await familyService.getMembers(family.id)
      set({ members })
    } catch (err) {
      set({ error: '添加成员失败' })
    }
  },

  /**
   * 移除家庭成员
   * @param memberId - 成员 ID
   */
  removeMember: async (memberId) => {
    const family = get().currentFamily
    if (!family) return
    set({ error: null })
    try {
      await familyService.removeMember(family.id, memberId)
      set((state) => ({
        members: state.members.filter((m) => m.id !== memberId),
      }))
    } catch (err) {
      set({ error: '移除成员失败' })
    }
  },

  /**
   * 更新成员角色
   * @param memberId - 成员 ID
   * @param role - 新角色
   */
  updateMemberRole: async (memberId, role) => {
    const family = get().currentFamily
    if (!family) return
    set({ error: null })
    try {
      await familyService.updateMemberRole(family.id, memberId, role)
      set((state) => ({
        members: state.members.map((m) =>
          m.id === memberId ? { ...m, role } : m
        ),
      }))
    } catch (err) {
      set({ error: '更新角色失败' })
    }
  },

  /** 获取当前家庭的相册照片列表 */
  fetchPhotos: async () => {
    const family = get().currentFamily
    if (!family) return
    set({ photosLoading: true, error: null })
    try {
      const photos = await familyService.getFamilyPhotos(family.id)
      set({ photos })
    } catch (err) {
      set({ error: '加载相册失败' })
    } finally {
      set({ photosLoading: false })
    }
  },

  /**
   * 保存家庭合影
   * @param photoUrl - 照片 URL
   * @param memberCount - 成员数
   * @param memberNames - 成员名称列表
   * @param photoType - 照片类型（生成/上传）
   * @param description - 照片描述
   */
  savePhoto: async (photoUrl, memberCount, memberNames, photoType = 'generated' as 'generated' | 'uploaded', description: string | undefined) => {
    const family = get().currentFamily
    if (!family) return
    set({ error: null })
    try {
      const photo = await familyService.saveFamilyPhoto(family.id, photoUrl, memberCount, memberNames, photoType, description)
      set((state) => ({
        photos: [photo, ...state.photos],
      }))
    } catch (err) {
      set({ error: '保存照片失败' })
    }
  },

  /**
   * 删除家庭合影
   * @param photoId - 照片 ID
   */
  deletePhoto: async (photoId) => {
    set({ error: null })
    try {
      await familyService.deleteFamilyPhoto(photoId)
      set((state) => ({
        photos: state.photos.filter((p) => p.id !== photoId),
      }))
    } catch (err) {
      set({ error: '删除照片失败' })
    }
  },
}))
