import type { AccessorySlot } from '../types/wardrobeTypes'

/**
 * 衣橱/换装常量配置
 * 管理配饰槽位、层级、错误码、主题生成等核心参数
 */
export const ACCESSORY_SLOTS = ['head', 'neck', 'back', 'body', 'feet'] as const

export const SLOT_Z_INDEX: Record<AccessorySlot, number> = {
  feet: 1,
  body: 2,
  back: 3,
  neck: 5,
  head: 10,
}

export const SLOT_LABELS: Record<AccessorySlot, string> = {
  head: '头部',
  neck: '颈部',
  back: '背部',
  body: '身体',
  feet: '足部',
}

export const WARDROBE_ERROR_CODES = {
  ACCESSORY_NOT_FOUND: 'WARDROBE_001',
  SLOT_MISMATCH: 'WARDROBE_002',
  SPECIES_INCOMPATIBLE: 'WARDROBE_003',
  NOT_OWNED: 'WARDROBE_010',
  MEMBERSHIP_EXPIRED: 'WARDROBE_011',
  LIMITED_EXPIRED: 'WARDROBE_012',
  NO_BASE_AVATAR: 'WARDROBE_020',
  QUOTA_EXCEEDED: 'WARDROBE_021',
  THEME_INACTIVE: 'WARDROBE_022',
  MODERATION_BLOCKED: 'WARDROBE_023',
  PET_NOT_FOUND: 'WARDROBE_030',
  TASK_NOT_FOUND: 'WARDROBE_031',
  TASK_IN_PROGRESS: 'WARDROBE_040',
  RATE_LIMITED: 'WARDROBE_050',
  SYSTEM_ERROR: 'WARDROBE_099',
} as const

export const MAX_TRY_ON_HISTORY = 20

export const THEME_GENERATION_POLL_INTERVAL = 2000

export const THEME_MAX_RETRIES = 2

export const OUTFIT_SAVE_DEBOUNCE_MS = 300
