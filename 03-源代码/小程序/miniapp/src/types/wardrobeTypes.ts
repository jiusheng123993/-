import type { PetSpecies } from './avatarTypes'

export type AccessorySlot = 'head' | 'neck' | 'back' | 'body' | 'feet'

export type UnlockSource = 'default' | 'achievement' | 'paid' | 'member'

export type ThemeCategory = 'festival' | 'season' | 'birthday' | 'special'

export type ModerationResult = 'pass' | 'review' | 'block'

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

export interface UserAccessoryInventory {
  id: number
  userId: string
  accessoryId: string
  unlockedAt: string
  unlockSource: string
}

export interface PetOutfit {
  petId: string
  outfitSlots: OutfitSlotMap
  updatedAt: string
}

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
