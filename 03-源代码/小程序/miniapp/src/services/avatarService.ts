/**
 * 宠物头像服务
 *
 * 本地 SVG 头像生成、AI 云端头像生成（2D/3D）、照片上传、配额管理
 */
import Taro from '@tarojs/taro'
import { getPetFaceDataUri } from '../engines/petAvatar/svgRenderer'
import { calculateExpression } from '../engines/petAvatar/expressionEngine'
import { generateDiaryForToday } from '../engines/petAvatar/diaryEngine'
import { seedreamAdapter } from '../engines/petAvatar/seedreamAdapter'
import { api, resolveAvatarUrl } from './api'
import { storage } from '../platform/storage'
import { CONFIG } from '../config'
import type { PetProfile } from './petService'
import type { ExpressionContext, AvatarCustomization, PetSpecies, PetImageParams, SeedreamGenerateResult, UploadPhotoResult, Generate2DResult, Generate3DResult, GenerationTask, Avatar2DPack, Avatar3DResult, AvatarQuota } from '../types/avatarTypes'
import { AVATAR_FREE_GENERATIONS, AVATAR_PHOTO_FREE_COUNT, AVATAR_PHOTO_MEMBER_MONTHLY_LIMIT, AVATAR_3D_MONTHLY_LIMIT } from '../constants'

const STORAGE_KEYS = {
  AVATAR_CUSTOM: 'xhh_avatar_custom',
  // 按宠物维度的头像缓存前缀：多宠物家庭里每只宠物的头像互不覆盖
  AVATAR_CUSTOM_PREFIX: 'xhh_avatar_custom_',
  AVATAR_GEN_COUNT: 'xhh_avatar_gen_count',
  DIARY_CACHE: 'xhh_diary_cache',
  CURRENT_PET_ID: 'xhh_current_pet_id',
}

/**
 * 计算头像本地缓存的存储 key
 * 传入 petId 时按宠物隔离（xhh_avatar_custom_{petId}），
 * 不传时回退到历史全局 key（xhh_avatar_custom），兼容老版本数据。
 * @param petId - 宠物 ID，可选
 */
function avatarCustomKey(petId?: string): string {
  return petId ? `${STORAGE_KEYS.AVATAR_CUSTOM_PREFIX}${petId}` : STORAGE_KEYS.AVATAR_CUSTOM
}

/** 多风格候选返回项（一套两张：头像 + 全方位角色设定图） */
export interface AvatarStyleOption {
  style: string
  label: string
  /** 头像图 URL */
  url: string
  /**
   * 全方位角色设定图 URL（正面特写/侧面/顶部/背面四视图合一）。
   * 用作全家福/回忆录的角色参考图；服务端生成失败时为 null（前端隐藏该卡片）
   */
  sheetUrl?: string | null
}

function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  // 坑点：token 经 platform/storage 的 setToken 以 base64 编码存储，
  // 必须用 storage.getToken() 解码读取；直接用 Taro.getStorageSync('xhh_token')
  // 会拿到编码后的乱码，导致 Authorization 头非法 → 所有 avatar 接口 401
  // （其他接口走 api.ts 内部用 storage.getToken()，所以只有头像接口会 401）
  const token = storage.getToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

/**
 * 生成形象候选（后端按需生成）
 * @param petId - 宠物 ID
 * @param referenceImageUrl - 参考照片 URL（有则图生图保证像宠物本人）
 * @param style - 基础基调：cartoon（卡通）/ realistic（写实）
 * @param styleKey - 指定画风 key（q/japanese/...，传了只生成该画风）
 * @param expression - 表情 key（happy/excited/...，拼进提示词）
 * @returns 候选列表；失败返回 null（调用方提示重试，不回退丑陋占位图）
 *
 * 说明：原"文字描述生成（description）/ 文生图换景（background）"参数随 2026-08-25
 * 页面移除文字生图功能一并删除；服务端仍兼容这两个字段但前端不再发送。
 */
export async function generateAvatarOptions(
  petId: string,
  referenceImageUrl?: string,
  style: 'cartoon' | 'realistic' = 'cartoon',
  styleKey?: string,
  expression?: string,
): Promise<AvatarStyleOption[] | null> {
  try {
    const data = await api.post<{ options: AvatarStyleOption[] }>('/api/avatar/generate-options', {
      petId,
      referenceImageUrl,
      style,
      styleKey,
      expression,
    })
    return data?.options?.length ? data.options : null
  } catch {
    return null
  }
}

/** 形象库条目类型：headshot=头像 / multiview=全方位角色设定图 */
export type AvatarLibraryViewType = 'headshot' | 'multiview'

/** 形象库条目 */
export interface AvatarLibraryItem {
  id: string
  petId: string
  style: string
  expression: string | null
  imageUrl: string
  /** 条目类型（迁移 030；历史数据服务端默认 headshot） */
  viewType: AvatarLibraryViewType
  createdAt: string
}

/**
 * 保存形象到形象库（按风格/表情/类型分类）
 * @param viewType - headshot=头像 / multiview=全方位设定图（缺省头像，兼容旧调用方）
 */
export async function saveAvatarToLibrary(
  petId: string,
  style: string,
  expression: string | null,
  imageUrl: string,
  viewType: AvatarLibraryViewType = 'headshot',
): Promise<boolean> {
  try {
    await api.post<{ id: string }>('/api/avatar/library', { petId, style, expression, imageUrl, viewType })
    return true
  } catch {
    return false
  }
}

/**
 * 查询某宠物的形象库（时间倒序）
 * 服务端返回 pg 原始行（snake_case：image_url/pet_id/created_at），这里统一映射为
 * camelCase（AvatarLibraryItem），否则页面读 item.imageUrl 会是 undefined（图片空白、
 * 设为当前形象传 undefined 清空照片——契约 bug 曾致此）
 */
export async function getAvatarLibrary(petId: string): Promise<AvatarLibraryItem[]> {
  try {
    const data = await api.get<Array<{
      id: string
      pet_id: string
      style: string
      expression: string | null
      image_url: string
      view_type?: string | null
      created_at: string
    }>>('/api/avatar/library', { petId })
    if (!Array.isArray(data)) return []
    return data.map((row) => ({
      id: row.id,
      petId: row.pet_id,
      style: row.style,
      expression: row.expression,
      imageUrl: row.image_url,
      // 迁移 030 新列；服务端未升级/历史行缺省时按头像处理，避免前端筛选失效
      viewType: row.view_type === 'multiview' ? 'multiview' : 'headshot',
      createdAt: row.created_at,
    }))
  } catch {
    return []
  }
}

/**
 * 把全方位角色设定图设为当前参考图（写入 pet_profiles.avatar_multiview_url，迁移 030）
 * 与卡通头像"设为当前"的区别：不清空 avatar_photo_url——真实照片仍是全家福参考第一优先级，
 * 设定图是第二优先级补充（collectMemberPhotos 的 COALESCE 顺序）。
 * @returns 成功时携带服务端返回的最新宠物档案（离线时为 null，调用方用 patch 兜底刷新）
 */
export async function setMultiviewAsCurrent(petId: string, sheetUrl: string): Promise<PetProfile | null> {
  try {
    // 坑点（同 saveAvatarCustomization）：PUT /api/pets/:id 的 body 必须 snake_case，
    // zod 会剥离 camelCase 键导致 400「没有需要更新的字段」
    const updated = await api.put<PetProfile>(`/api/pets/${petId}`, {
      avatar_multiview_url: sheetUrl,
    })
    return updated
  } catch {
    return null
  }
}

/**
 * 删除形象库中的一条
 */
export async function deleteAvatarLibraryItem(id: string): Promise<boolean> {
  try {
    await api.delete(`/api/avatar/library/${id}`)
    return true
  } catch {
    return false
  }
}

export async function generateAvatarImage(
  petId: string,
  species: PetSpecies,
  petName: string,
  style: PetImageParams['style'],
  referenceImageUrl?: string,
  baseColor?: string,
): Promise<SeedreamGenerateResult | null> {
  const expression = calculateExpression({
    todayEntry: null,
    hasAnomaly: false,
    anomalyCount: 0,
    riskLevel: null,
    streakDays: 0,
    isBirthday: false,
    isVaccineComplete: false,
    isRecovery: false,
    isDeceased: false,
  })

  const result = await seedreamAdapter.generatePetImage({
    petId,
    species,
    expression,
    breed: petName,
    color: baseColor,
    style: style === 'cartoon' ? 'cartoon' : 'realistic',
  })

  if (result.success && result.imageUrl) {
    incrementGenerationCount()
    await saveAvatarCustomization({
      species,
      style: style || 'cartoon',
      baseColor: baseColor || '#FFD93D',
      generatedAt: new Date().toISOString(),
      cartoonUrl: result.imageUrl,
    })
    return result
  }

  return null
}

export function getAvatarFaceUri(
  species: PetSpecies,
  expressionContext: ExpressionContext,
  size: number = 100,
): string {
  const config = calculateExpression(expressionContext)
  return getPetFaceDataUri(config, species, size)
}

export function getPetDiary(
  petName: string,
  expressionContext: ExpressionContext,
): string | null {
  const cached = Taro.getStorageSync(STORAGE_KEYS.DIARY_CACHE)
  if (cached && typeof cached === 'string') {
    try {
      const parsed = JSON.parse(cached) as { date: string; text: string }
      if (parsed.date === new Date().toISOString().slice(0, 10)) {
        return parsed.text
      }
    } catch {
      // ignore parse error
    }
  }

  const entry = expressionContext.todayEntry
  const diary = generateDiaryForToday(
    entry,
    expressionContext.streakDays,
    expressionContext.isBirthday,
    expressionContext.isRecovery,
  )
  if (!diary) return null

  const diaryText = `${diary.emoji} "${diary.text}" —— ${petName}`
  Taro.setStorageSync(STORAGE_KEYS.DIARY_CACHE, JSON.stringify({
    date: new Date().toISOString().slice(0, 10),
    text: diaryText,
  }))

  return diaryText
}

/**
 * 读取某只宠物的头像定制缓存
 * 优先按宠物维度读取，其次兼容历史全局 key。
 * @param petId - 宠物 ID，可选（不传时读历史全局 key）
 */
export function getAvatarCustomization(petId?: string): AvatarCustomization | null {
  const stored = Taro.getStorageSync(avatarCustomKey(petId))
  if (!stored) {
    // 兼容老版本：新 key 没有时读全局 key（仅当 petId 存在时）
    if (petId) {
      const legacy = Taro.getStorageSync(STORAGE_KEYS.AVATAR_CUSTOM)
      return legacy ? (legacy as AvatarCustomization) : null
    }
    return null
  }
  return stored as AvatarCustomization
}

/**
 * 保存某只宠物的头像定制（本地缓存 + 服务端 best-effort 同步）
 * 服务端成功更新后返回最新宠物档案，调用方可用来刷新 petStore。
 *
 * 坑点（服务端契约）：PUT /api/pets/:id 的 body 必须是 snake_case
 * （avatar_style / avatar_cartoon_url / avatar_photo_url），zod 校验会剥离 camelCase 键，
 * 否则 updateData 为空直接 400。avatar_generated_at 服务端 schema 未定义，故不发送（本地缓存保留）。
 *
 * 另：保存卡通/AI 形象时同时把 avatar_photo_url 置 null——
 * 全局展示优先级是 avatarPhotoUrl > avatarCartoonUrl，若不清照片，之前设过照片头像的宠物
 * 之后保存任何卡通/预设/AI 形象都不会显示。
 *
 * @param custom - 头像定制信息
 * @param petId - 宠物 ID，可选（不传时尝试读当前宠物 ID）
 */
export async function saveAvatarCustomization(custom: AvatarCustomization, petId?: string): Promise<PetProfile | null> {
  const targetPetId = petId || Taro.getStorageSync(STORAGE_KEYS.CURRENT_PET_ID)
  // 本地缓存：按宠物隔离，避免多宠物互相覆盖
  Taro.setStorageSync(avatarCustomKey(targetPetId), custom)
  if (!targetPetId) return null

  try {
    const updated = await api.put<PetProfile>(`/api/pets/${targetPetId}`, {
      avatar_style: custom.style,
      avatar_cartoon_url: custom.cartoonUrl,
      avatar_photo_url: null,
    })
    return updated
  } catch {
    // local save succeeded, DB save is best-effort
    return null
  }
}

/**
 * 把用户上传/拍摄的照片直接设为宠物头像（所有用户可用，不消耗 AI 配额）
 * 1) 补全相对路径为绝对地址；2) 本地缓存按宠物记录；3) 同步服务端 avatar_photo_url（snake_case 契约）。
 * 注意：展示优先级是 avatarPhotoUrl（真实照片）> avatarCartoonUrl（卡通/AI 形象）。
 * @param petId - 宠物 ID
 * @param photoUrl - 上传接口返回的照片地址（可能为相对路径）
 * @returns 是否成功；成功时携带服务端返回的最新宠物档案（离线时可能为空）与补全后的照片地址
 */
export async function setPetPhotoAsAvatar(
  petId: string,
  photoUrl: string,
): Promise<{ success: boolean; pet?: PetProfile; photoUrl?: string }> {
  // 服务端上传接口返回 /uploads/... 相对路径，必须补全为绝对地址，否则 <Image> 和 AI 参考图都加载不了
  const absoluteUrl = resolveAvatarUrl(photoUrl)
  // 本地缓存：记录到当前宠物的定制里（cartoonUrl 字段仅作本地展示缓存，权威数据以宠物档案为准）
  const prev = getAvatarCustomization(petId)
  const custom: AvatarCustomization = {
    species: (prev?.species as PetSpecies) || 'dog',
    style: 'realistic',
    baseColor: prev?.baseColor || '#FFD93D',
    generatedAt: new Date().toISOString(),
    cartoonUrl: absoluteUrl,
  }
  Taro.setStorageSync(avatarCustomKey(petId), custom)

  try {
    const updated = await api.put<PetProfile>(`/api/pets/${petId}`, {
      avatar_photo_url: absoluteUrl,
    })
    return { success: true, pet: updated, photoUrl: absoluteUrl }
  } catch {
    // 离线/服务端失败：本地缓存已生效，页面即时展示；服务端数据待下次联网后由档案页刷新拉取
    return { success: true, photoUrl: absoluteUrl }
  }
}

export function getGenerationCount(): number {
  const count = Taro.getStorageSync(STORAGE_KEYS.AVATAR_GEN_COUNT)
  return typeof count === 'number' ? count : 0
}

export function incrementGenerationCount(): void {
  const count = getGenerationCount()
  Taro.setStorageSync(STORAGE_KEYS.AVATAR_GEN_COUNT, count + 1)
}

export function canGenerateAvatar(isMember: boolean): boolean {
  if (isMember) return true
  return getGenerationCount() < AVATAR_FREE_GENERATIONS
}

export async function uploadPetPhoto(
  petId: string,
  tempFilePath: string,
): Promise<UploadPhotoResult> {
  try {
    const res = await Taro.uploadFile({
      url: `${CONFIG.API_BASE_URL}/api/avatar/photo/upload`,
      filePath: tempFilePath,
      name: 'photo',
      formData: { petId },
      header: getAuthHeaders(),
    })

    const data = JSON.parse(res.data) as UploadPhotoResult
    // 服务端返回 /uploads/... 相对路径，这里统一补全为绝对地址，
    // 否则照片预览、AI 生成参考图（要求 http(s) URL）都会加载失败
    if (data.success && data.data?.url) {
      data.data.url = resolveAvatarUrl(data.data.url)
    }
    return data
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : '上传失败' }
  }
}

export async function generate2DAvatar(
  petId: string,
  referencePhotoUrl: string,
  style: string,
): Promise<Generate2DResult> {
  const res = await Taro.request({
    url: `${CONFIG.API_BASE_URL}/api/avatar/generate-2d`,
    method: 'POST',
    data: { petId, referencePhotoUrl, style },
    header: getAuthHeaders({ 'Content-Type': 'application/json' }),
  })

  return res.data as Generate2DResult
}

export async function getTaskProgress(taskId: string): Promise<GenerationTask | null> {
  const res = await Taro.request({
    url: `${CONFIG.API_BASE_URL}/api/avatar/task/${taskId}`,
    method: 'GET',
    header: getAuthHeaders(),
  })

  const data = res.data as { success: boolean; data: GenerationTask }
  return data.success ? data.data : null
}

export async function generate3DAvatar(
  petId: string,
  image2DTaskId: string,
): Promise<Generate3DResult> {
  const res = await Taro.request({
    url: `${CONFIG.API_BASE_URL}/api/avatar/generate-3d`,
    method: 'POST',
    data: { petId, image2DTaskId },
    header: getAuthHeaders({ 'Content-Type': 'application/json' }),
  })

  return res.data as Generate3DResult
}

export async function getAvatar2DImages(petId: string): Promise<Avatar2DPack> {
  const res = await Taro.request({
    url: `${CONFIG.API_BASE_URL}/api/avatar/images/${petId}`,
    method: 'GET',
    header: getAuthHeaders(),
  })

  const data = res.data as { success: boolean; data: Avatar2DPack }
  return data.success ? data.data : { task: null, images: [] }
}

export async function getAvatar3DModel(petId: string): Promise<Avatar3DResult> {
  const res = await Taro.request({
    url: `${CONFIG.API_BASE_URL}/api/avatar/model/${petId}`,
    method: 'GET',
    header: getAuthHeaders(),
  })

  const data = res.data as { success: boolean; data: Avatar3DResult }
  return data.success ? data.data : { task: null, model: null }
}

export function getPhotoGenerationCount(): number {
  const count = Taro.getStorageSync('xhh_avatar_photo_count')
  return typeof count === 'number' ? count : 0
}

export function canGeneratePhoto(isMember: boolean): boolean {
  // 照片生成（参照自家宠物）为会员专享：非会员一律不可用
  if (!isMember) return false
  // 会员每月限次（2D 形象包 1 次/月）
  return getPhotoGenerationCount() < AVATAR_PHOTO_FREE_COUNT
}

export function incrementPhotoGenerationCount(): void {
  const count = getPhotoGenerationCount()
  Taro.setStorageSync('xhh_avatar_photo_count', count + 1)
}

/** 获取本月"照片专属多风格头像"生成次数（本地展示用，服务端为准） */
export function getPhotoOptionsCount(): number {
  const count = Taro.getStorageSync('xhh_avatar_photo_options_count')
  return typeof count === 'number' ? count : 0
}

/** 判断会员是否还能生成照片专属多风格头像（每月 3 次） */
export function canGeneratePhotoOptions(isMember: boolean): boolean {
  if (!isMember) return false
  return getPhotoOptionsCount() < AVATAR_PHOTO_MEMBER_MONTHLY_LIMIT
}

/** 照片专属多风格头像生成成功时 +1 */
export function incrementPhotoOptionsCount(): void {
  const count = getPhotoOptionsCount()
  Taro.setStorageSync('xhh_avatar_photo_options_count', count + 1)
}

export function get3DGenerationCount(): number {
  const dateKey = Taro.getStorageSync('xhh_avatar_3d_count_date')
  const today = new Date().toISOString().slice(0, 7)
  if (dateKey !== today) {
    Taro.setStorageSync('xhh_avatar_3d_count', 0)
    Taro.setStorageSync('xhh_avatar_3d_count_date', today)
    return 0
  }
  const count = Taro.getStorageSync('xhh_avatar_3d_count')
  return typeof count === 'number' ? count : 0
}

export function canGenerate3D(isMember: boolean): boolean {
  if (!isMember) return false
  return get3DGenerationCount() < AVATAR_3D_MONTHLY_LIMIT
}

export function increment3DGenerationCount(): void {
  const count = get3DGenerationCount()
  Taro.setStorageSync('xhh_avatar_3d_count', count + 1)
}

export async function getAvatarQuota(): Promise<AvatarQuota | null> {
  try {
    const res = await Taro.request({
      url: `${CONFIG.API_BASE_URL}/api/avatar/quota`,
      method: 'GET',
      header: getAuthHeaders(),
    })
    const data = res.data as { success: boolean; data: AvatarQuota }
    return data.success ? data.data : null
  } catch {
    return null
  }
}
