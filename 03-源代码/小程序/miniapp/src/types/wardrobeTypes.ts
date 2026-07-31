import type { PetSpecies } from './avatarTypes'

/** 配饰佩戴部位类型 */
export type AccessorySlot = 'head' | 'neck' | 'back' | 'body' | 'feet'

/** 配饰解锁来源 */
export type UnlockSource = 'default' | 'achievement' | 'paid' | 'member'

export type ThemeCategory = 'festival' | 'season' | 'birthday' | 'special'

/** 审核结果类型 */
export type ModerationResult = 'pass' | 'review' | 'block'

/** 穿搭槽位映射（部位 → 配饰 ID） */
export type OutfitSlotMap = Partial<Record<AccessorySlot, string>>

export interface OutfitLayer {
  slot: AccessorySlot
  accessoryId: string | null
  svgPath: string
  zIndex: number
  transform?: string
}

export interface AccessoryDef {
  id: string
  name: string
  slot: AccessorySlot
  svgPath: string
  speciesCompat: PetSpecies[]
  unlockSource: UnlockSource
  unlockCondition: Record<string, unknown>
  sortOrder: number
  isActive: boolean
}

/** 用户配饰库存 */
export interface UserAccessoryInventory {
  id: number
  userId: string
  accessoryId: string
  unlockedAt: string
  unlockSource: string
}

/** 宠物穿搭 */
export interface PetOutfit {
  petId: string
  outfitSlots: OutfitSlotMap
  updatedAt: string
}

/** 主题套系定义 */
export interface ThemeSuiteDef {
  id: string
  name: string
  category: ThemeCategory
  promptTemplate: string
  festivalDate: string | null
  previewUrl: string | null
  sortOrder: number
  isActive: boolean
}

/** 主题套系生成任务 */
export interface ThemeSuiteTask {
  id: string
  userId: string
  petId: string
  suiteId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  resultUrl: string | null
  moderationResult: ModerationResult | null
  quotaConsumed: boolean
  retryCount: number
  createdAt: string
  updatedAt: string
}

export interface TryOnHistoryEntry {
  id: number
  userId: string
  petId: string
  outfitSnapshot: OutfitSlotMap
  createdAt: string
}

export interface ThemeQuotaInfo {
  monthlyLimit: number
  usedThisMonth: number
  remaining: number
}

export interface WardrobeError {
  code: string
  message: string
  httpStatus: number
}
