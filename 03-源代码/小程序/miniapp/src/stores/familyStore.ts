/**
 * 宠物家庭状态管理
 * 管理宠物家庭成员、家庭相册和家庭切换
 */
import create from 'zustand'
import type { PetFamily, PetFamilyMember, FamilyUser, FamilyPhoto } from '../types/familyTypes'
import { familyService } from '../services/familyService'

/** 宠物家庭状态定义 */
interface FamilyState {
  families: PetFamily[]
  currentFamily: PetFamily | null
  members: PetFamilyMember[]
  /** 家庭成员（人）：owner/member，多成员共同养宠（2026-08-24） */
  users: FamilyUser[]
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
  fetchUsers: () => Promise<void>
  createInvite: () => Promise<string>
  joinFamily: (code: string) => Promise<void>
  removeUser: (userId: string) => Promise<void>
  fetchPhotos: () => Promise<void>
  savePhoto: (photoUrl: string, memberCount: number, memberNames: string[], photoType?: 'generated' | 'uploaded', description?: string) => Promise<void>
  deletePhoto: (photoId: string) => Promise<void>
  generateAiPhoto: (style: string) => Promise<{ success: boolean; photoId?: string; photoUrl?: string; message?: string }>
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  families: [],
  currentFamily: null,
  members: [],
  users: [],
  photos: [],
  photosLoading: false,
  loading: false,
  error: null,

  /** 获取所有家庭列表，默认选中第一个家庭，始终刷新成员列表 */
  fetchFamilies: async () => {
    set({ loading: true, error: null })
    try {
      const families = await familyService.getFamilies()
      set({ families })
      if (families.length > 0) {
        // 优先保留已选中的家庭，否则默认选第一个
        const existingFamily = get().currentFamily
        const selectedFamily = existingFamily && families.find(f => f.id === existingFamily.id)
          ? existingFamily
          : families[0]
        set({ currentFamily: selectedFamily })
        const members = await familyService.getMembers(selectedFamily.id)
        set({ members })
      } else {
        set({ currentFamily: null, members: [] })
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
      const message = (err as { message?: string }).message || '添加成员失败'
      set({ error: message })
      throw err
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

  /** 获取家庭成员（人）列表（多成员共同养宠） */
  fetchUsers: async () => {
    const family = get().currentFamily
    if (!family) return
    set({ error: null })
    try {
      const users = await familyService.getUsers(family.id)
      set({ users })
    } catch (err) {
      // 老后端无 users 接口时静默（不阻塞家庭页）
      set({ users: [] })
    }
  },

  /** 生成家庭邀请码（仅 owner），返回邀请码 */
  createInvite: async () => {
    const family = get().currentFamily
    if (!family) throw new Error('未选择家庭')
    const result = await familyService.createInvite(family.id)
    return result.code
  },

  /** 凭邀请码加入家庭 */
  joinFamily: async (code) => {
    set({ error: null })
    try {
      const { familyId } = await familyService.joinFamily(code)
      await get().fetchFamilies()
      // 切换到新加入的家庭并加载成员
      const joined = get().families.find((f) => f.id === familyId)
      if (joined) await get().setCurrentFamily(joined)
    } catch (err) {
      const message = (err as { message?: string }).message || '加入失败，请检查邀请码'
      set({ error: message })
      throw err
    }
  },

  /** 移除家庭成员（仅 owner） */
  removeUser: async (userId) => {
    const family = get().currentFamily
    if (!family) return
    set({ error: null })
    try {
      await familyService.removeUser(family.id, userId)
      set((state) => ({
        users: state.users.filter((u) => u.userId !== userId),
      }))
    } catch (err) {
      const message = (err as { message?: string }).message || '移除成员失败'
      set({ error: message })
      throw err
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
   * 保存家庭合影（上传到后端，不再使用本地存储）
   */
  savePhoto: async (photoUrl, memberCount, memberNames, photoType = 'generated' as 'generated' | 'uploaded', description: string | undefined) => {
    const family = get().currentFamily
    if (!family) return
    set({ error: null })
    try {
      const result = await familyService.uploadFamilyPhoto(family.id, {
        photoUrl,
        photoType,
        memberCount,
        memberNames,
        description,
      })
      const photo: FamilyPhoto = {
        id: result.id,
        familyId: family.id,
        userId: '',
        photoUrl,
        photoType,
        description,
        memberCount,
        memberNames,
        createdAt: new Date().toISOString(),
      }
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
    const family = get().currentFamily
    if (!family) return
    set({ error: null })
    try {
      await familyService.deleteFamilyPhoto(family.id, photoId)
      set((state) => ({
        photos: state.photos.filter((p) => p.id !== photoId),
      }))
    } catch (err) {
      set({ error: '删除照片失败' })
    }
  },

  /**
   * AI 全家福生成
   * 调用后端 Seedream API 合成全家福，失败时返回 success:false
   */
  generateAiPhoto: async (style) => {
    const family = get().currentFamily
    if (!family) return { success: false, message: '未选择家庭' }
    set({ error: null })
    try {
      const result = await familyService.generateFamilyPhoto(family.id, style)
      if (result && result.photoUrl) {
        const memberNames = get().members.map((m) => m.petName || '').filter(Boolean)
        const photo: FamilyPhoto = {
          id: result.id,
          familyId: family.id,
          userId: '',
          photoUrl: result.photoUrl,
          photoType: 'generated',
          memberCount: get().members.length,
          memberNames,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          photos: [photo, ...state.photos],
        }))
        return { success: true, photoId: result.id, photoUrl: result.photoUrl }
      }
      return { success: false, message: '生成失败，请重试' }
    } catch (err) {
      const message = (err as { message?: string }).message || 'AI 生成失败'
      set({ error: message })
      return { success: false, message }
    }
  },
}))
