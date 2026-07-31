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
import { api } from './api'
import { CONFIG } from '../config'
import type { ExpressionContext, AvatarCustomization, PetSpecies, PetImageParams, SeedreamGenerateResult, UploadPhotoResult, Generate2DResult, Generate3DResult, GenerationTask, Avatar2DPack, Avatar3DResult, AvatarQuota } from '../types/avatarTypes'
import { AVATAR_FREE_GENERATIONS, AVATAR_PHOTO_FREE_COUNT, AVATAR_3D_MONTHLY_LIMIT } from '../constants'

const STORAGE_KEYS = {
  AVATAR_CUSTOM: 'xhh_avatar_custom',
  AVATAR_GEN_COUNT: 'xhh_avatar_gen_count',
  DIARY_CACHE: 'xhh_diary_cache',
  CURRENT_PET_ID: 'xhh_current_pet_id',
}

function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = Taro.getStorageSync('xhh_token')
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

export async function generateAvatarImage(
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

export function getAvatarCustomization(): AvatarCustomization | null {
  const stored = Taro.getStorageSync(STORAGE_KEYS.AVATAR_CUSTOM)
  if (!stored) return null
  return stored as AvatarCustomization
}

export async function saveAvatarCustomization(custom: AvatarCustomization): Promise<void> {
  Taro.setStorageSync(STORAGE_KEYS.AVATAR_CUSTOM, custom)
  try {
    const petId = Taro.getStorageSync(STORAGE_KEYS.CURRENT_PET_ID)
    if (!petId) return

    await api.put(`/api/pets/${petId}`, {
      avatarStyle: custom.style,
      avatarCartoonUrl: custom.cartoonUrl,
      avatarGeneratedAt: custom.generatedAt,
    })
  } catch {
    // local save succeeded, DB save is best-effort
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
  if (isMember) return true
  return getPhotoGenerationCount() < AVATAR_PHOTO_FREE_COUNT
}

export function incrementPhotoGenerationCount(): void {
  const count = getPhotoGenerationCount()
  Taro.setStorageSync('xhh_avatar_photo_count', count + 1)
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
