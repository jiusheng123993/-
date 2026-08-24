/**
 * 宠物家庭状态管理
 * 管理宠物家庭成员、家庭相册和家庭切换
 */
import create from 'zustand'
import type { PetFamily, PetFamilyMember, FamilyUser, FamilyUserRelation, FamilyUserRelationType, FamilyPhoto } from '../types/familyTypes'
import { familyService } from '../services/familyService'

/** 宠物家庭状态定义 */
interface FamilyState {
  families: PetFamily[]
  currentFamily: PetFamily | null
  members: PetFamilyMember[]
  /** 家庭成员（人）：owner/member，多成员共同养宠（2026-08-24） */
  users: FamilyUser[]
  /** 家庭成员（人）关系：情侣/父女等任意两人之间（2026-08-24） */
  relations: FamilyUserRelation[]
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
  fetchRelations: () => Promise<void>
  createRelation: (userIdA: string, userIdB: string, relationType: FamilyUserRelationType) => Promise<void>
  removeRelation: (relationId: string) => Promise<void>
  fetchPhotos: () => Promise<void>
  savePhoto: (photoUrl: string, memberCount: number, memberNames: string[], photoType?: 'canvas_fallback' | 'uploaded', description?: string) => Promise<void>
  deletePhoto: (photoId: string) => Promise<void>
  generateAiPhoto: (
    style: string,
    scene?: string,
    customScene?: string,
  ) => Promise<{
    success: boolean
    photoId?: string
    photoUrl?: string
    message?: string
    /** 业务错误码（如 MEMBER_NO_REAL_IMAGE：成员缺真实形象，需先引导生成） */
    code?: string
    /** 缺少真实形象的成员（引导跳转形象定制页） */
    missingMembers?: Array<{ petId: string; name: string }>
  }>
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  families: [],
  currentFamily: null,
  members: [],
  users: [],
  relations: [],
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

  /** 获取家庭成员（人）关系列表（情侣/父女等，2026-08-24） */
  fetchRelations: async () => {
    const family = get().currentFamily
    if (!family) return
    set({ error: null })
    try {
      const relations = await familyService.getUserRelations(family.id)
      set({ relations })
    } catch (err) {
      // 后端未部署关系表时静默（不阻塞图谱/家庭页）
      set({ relations: [] })
    }
  },

  /** 创建家庭成员（人）关系（仅 owner），成功后刷新关系列表 */
  createRelation: async (userIdA, userIdB, relationType) => {
    const family = get().currentFamily
    if (!family) throw new Error('未选择家庭')
    set({ error: null })
    try {
      await familyService.createUserRelation(family.id, userIdA, userIdB, relationType)
      await get().fetchRelations()
    } catch (err) {
      const message = (err as { message?: string }).message || '创建关系失败'
      set({ error: message })
      throw err
    }
  },

  /** 删除家庭成员（人）关系（仅 owner），成功后刷新关系列表 */
  removeRelation: async (relationId) => {
    const family = get().currentFamily
    if (!family) return
    set({ error: null })
    try {
      await familyService.removeUserRelation(family.id, relationId)
      set((state) => ({
        relations: state.relations.filter((r) => r.id !== relationId),
      }))
    } catch (err) {
      const message = (err as { message?: string }).message || '删除关系失败'
      set({ error: message })
      throw err
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
   * ⚠️ photoType 默认 'canvas_fallback'：后端 uploadFamilyPhotoSchema 仅允许
   * canvas_fallback | uploaded，传 'generated' 会 400（此前"保存到相册"必失败）
   */
  savePhoto: async (photoUrl, memberCount, memberNames, photoType = 'canvas_fallback' as 'canvas_fallback' | 'uploaded', description: string | undefined) => {
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
   * @param style 画风 key；scene 预设场景 key；customScene 自定义场景描述（均可选）
   */
  generateAiPhoto: async (style, scene?, customScene?) => {
    const family = get().currentFamily
    if (!family) return { success: false, message: '未选择家庭' }
    set({ error: null })
    try {
      const result = await familyService.generateFamilyPhoto(family.id, style, scene, customScene)
      if (result && result.photoUrl) {
        const memberNames = get().members.map((m) => m.petName || '').filter(Boolean)
        const photo: FamilyPhoto = {
          id: result.id,
          familyId: family.id,
          userId: '',
          photoUrl: result.photoUrl,
          photoType: 'generated',
          // 本地乐观插入也带上场景信息，相册立即能显示场景标签（后端拉取后以库内值为准）
          scene: scene ?? null,
          description: customScene,
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
      // 透传后端业务错误码（api.ts 把 code 挂到 Error 上），
      // 全家福页据此识别"成员缺真实形象"并引导用户先生成形象
      const e = err as { message?: string; code?: string; missingMembers?: Array<{ petId: string; name: string }> }
      const message = e.message || 'AI 生成失败'
      set({ error: message })
      return { success: false, message, code: e.code, missingMembers: e.missingMembers }
    }
  },
}))
