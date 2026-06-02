import type { WallpaperConfig, PresetWallpaper, WallpaperAdjustments } from './wallpaperTypes'
import { DEFAULT_WALLPAPER_ADJUSTMENTS } from './wallpaperTypes'
import { wallpaperStore } from './wallpaperStore'
import { checkWallpaperReadability } from './readabilityChecker'
import type { StudyTheme, ThemeId } from '../themes/themeRegistry'
import { getThemeById } from '../themes/themeRegistry'
import { PRESET_WALLPAPERS } from './presetWallpapers'

export type WallpaperService = {
  getActiveWallpaper: (themeId?: string) => WallpaperConfig | undefined
  applyWallpaper: (config: WallpaperConfig) => WallpaperConfig
  applyPreset: (presetId: string, themeId?: ThemeId) => WallpaperConfig | undefined
  uploadWallpaper: (file: File, themeId?: ThemeId) => Promise<WallpaperConfig>
  updateAdjustments: (configId: string, adjustments: Partial<WallpaperAdjustments>) => WallpaperConfig | undefined
  removeWallpaper: (configId: string) => boolean
  checkReadability: (config: WallpaperConfig, themeId?: string) => import('./wallpaperTypes').ReadabilityCheckResult
  getPresetWallpapers: (category?: string) => PresetWallpaper[]
  getWallpaperForTheme: (themeId: string) => WallpaperConfig | undefined
  resetThemeWallpaper: (themeId: string) => void
  buildWallpaperCSS: (config: WallpaperConfig) => string
}

function getThemeTokens(themeId?: string) {
  const theme: StudyTheme | undefined = themeId ? getThemeById(themeId) : undefined
  return {
    text: theme?.tokens.colors.text ?? '#20242c',
    background: theme?.tokens.colors.background ?? '#f8f7f2',
    surface: theme?.tokens.colors.surface ?? 'rgba(255,255,255,0.82)'
  }
}

export function createWallpaperService(): WallpaperService {
  return {
    getActiveWallpaper: (themeId) => {
      if (themeId) {
        const themed = wallpaperStore.getByTheme(themeId)
        if (themed) return themed
      }
      return wallpaperStore.getActive()
    },

    applyWallpaper: (config) => {
      const existing = config.id ? wallpaperStore.getById(config.id) : undefined
      if (existing) {
        return wallpaperStore.update(existing.id, config) ?? config
      }
      return wallpaperStore.add(config)
    },

    applyPreset: (presetId, themeId) => {
      const preset = PRESET_WALLPAPERS.find(p => p.id === presetId)
      if (!preset) return undefined
      const config: Omit<WallpaperConfig, 'id' | 'createdAt' | 'updatedAt'> = {
        source: 'preset',
        presetId,
        thumbnailDataUrl: preset.thumbnailUrl,
        themeBinding: themeId,
        adjustments: { ...DEFAULT_WALLPAPER_ADJUSTMENTS },
        readabilityWarning: false
      }
      return wallpaperStore.add(config)
    },

    uploadWallpaper: async (file, themeId) => {
      const partial = await wallpaperStore.processUpload(file, themeId)
      const addData = {
        source: partial.source,
        localPath: partial.localPath,
        thumbnailDataUrl: partial.thumbnailDataUrl,
        themeBinding: partial.themeBinding,
        adjustments: partial.adjustments,
        readabilityWarning: partial.readabilityWarning
      }
      const config = wallpaperStore.add(addData)
      const readability = checkWallpaperReadability(config, getThemeTokens(themeId))
      if (readability.warning) {
        wallpaperStore.update(config.id, { readabilityWarning: true })
        return { ...config, readabilityWarning: true }
      }
      return config
    },

    updateAdjustments: (configId, adjustments) => {
      const current = wallpaperStore.getById(configId)
      if (!current) return undefined
      const merged: WallpaperAdjustments = { ...current.adjustments, ...adjustments }
      const updated = wallpaperStore.update(configId, { adjustments: merged })
      if (updated) {
        const readability = checkWallpaperReadability(updated, getThemeTokens(updated.themeBinding))
        wallpaperStore.update(configId, { readabilityWarning: readability.warning })
        return { ...updated, readabilityWarning: readability.warning }
      }
      return updated
    },

    removeWallpaper: (configId) => {
      return wallpaperStore.remove(configId)
    },

    checkReadability: (config, themeId) => {
      return checkWallpaperReadability(config, getThemeTokens(themeId))
    },

    getPresetWallpapers: (category) => {
      if (category) {
        return PRESET_WALLPAPERS.filter(p => p.category === category)
      }
      return PRESET_WALLPAPERS
    },

    getWallpaperForTheme: (themeId) => {
      return wallpaperStore.getByTheme(themeId)
    },

    resetThemeWallpaper: (themeId) => {
      wallpaperStore.resetToDefault(themeId)
    },

    buildWallpaperCSS: (config) => {
      const adj = config.adjustments
      const parts: string[] = []
      parts.push(`filter: brightness(${adj.brightness}) saturate(${adj.saturation})`)
      parts.push(`backdrop-filter: blur(${adj.blur})`)
      if (adj.vignette > 0) {
        parts.push(`box-shadow: inset 0 0 ${Math.round(adj.vignette * 200)}px rgba(0,0,0,${adj.vignette * 0.5})`)
      }
      return parts.join('; ')
    }
  }
}

export const wallpaperService = createWallpaperService()
