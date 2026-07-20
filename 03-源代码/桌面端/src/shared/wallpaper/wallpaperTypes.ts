import type { ThemeId } from '../themes/themeRegistry'

export type WallpaperSource = 'preset' | 'upload' | 'theme_default'

export type WallpaperAdjustments = {
  overlay: string
  blur: string
  brightness: number
  saturation: number
  vignette: number
  cardOpacity: number
}

export type WallpaperConfig = {
  id: string
  source: WallpaperSource
  presetId?: string
  localPath?: string
  thumbnailDataUrl?: string
  themeBinding?: ThemeId
  adjustments: WallpaperAdjustments
  readabilityWarning: boolean
  createdAt: string
  updatedAt: string
}

export type PresetWallpaper = {
  id: string
  name: string
  category: 'nature' | 'city' | 'abstract' | 'minimal' | 'anime' | 'seasonal'
  thumbnailUrl: string
  fullUrl: string
  recommendedThemes: ThemeId[]
  accessibilityScore: number
}

export type ReadabilityIssueType = 'low_contrast' | 'too_bright' | 'too_dark' | 'too_busy'

export type ReadabilityIssueSeverity = 'info' | 'warning' | 'error'

export type ReadabilityIssue = {
  type: ReadabilityIssueType
  severity: ReadabilityIssueSeverity
  suggestion: string
}

export type ReadabilityCheckResult = {
  score: number
  warning: boolean
  issues: ReadabilityIssue[]
}

export const DEFAULT_WALLPAPER_ADJUSTMENTS: WallpaperAdjustments = {
  overlay: 'rgba(0, 0, 0, 0.3)',
  blur: '10px',
  brightness: 1,
  saturation: 1,
  vignette: 0.3,
  cardOpacity: 0.85
}

export const WALLPAPER_CONSTRAINTS = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  MAX_THUMBNAIL_SIZE: 200,
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  STORAGE_KEY: 'xinghuanhai_wallpaper_configs',
  THUMBNAIL_QUALITY: 0.6
} as const
