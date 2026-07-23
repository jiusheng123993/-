import Taro from '@tarojs/taro'
import { getPetFaceDataUri } from '../engines/petAvatar/svgRenderer'
import { calculateExpression } from '../engines/petAvatar/expressionEngine'
import { generateDiaryForToday } from '../engines/petAvatar/diaryEngine'
import { seedreamAdapter } from '../engines/petAvatar/seedreamAdapter'
import { api } from './api'
import type { ExpressionContext, AvatarCustomization, PetSpecies, PetImageParams, SeedreamGenerateResult } from '../types/avatarTypes'
import { AVATAR_FREE_GENERATIONS } from '../constants'

const STORAGE_KEYS = {
  AVATAR_CUSTOM: 'xhh_avatar_custom',
  AVATAR_GEN_COUNT: 'xhh_avatar_gen_count',
  DIARY_CACHE: 'xhh_diary_cache',
  CURRENT_PET_ID: 'xhh_current_pet_id',
}

export async function generateAvatarImage(
  species: PetSpecies,
  petName: string,
  style: PetImageParams['style'],
  referenceImageUrl?: string,
  baseColor?: string,
): Promise<SeedreamGenerateResult | null> {
  const genCount = getGenerationCount()
  const isMember = await checkMemberStatus()

  if (!isMember && genCount >= AVATAR_FREE_GENERATIONS) {
    return null
  }

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

async function checkMemberStatus(): Promise<boolean> {
  try {
    const userId = Taro.getStorageSync('xhh_user')
    if (!userId) return false

    const result = await api.get<{ status: string }>('/api/membership/status')
    return result.status === 'active'
  } catch {
    return false
  }
}
