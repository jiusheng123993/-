import {
  WallpaperValidationError,
  clampWallpaperConfig,
  createDefaultWallpaperConfig,
  type WallpaperConfig
} from './wallpaperConfig'

export type { WallpaperConfig } from './wallpaperConfig'

export type WallpaperStore = {
  load: () => WallpaperConfig
  save: (config: WallpaperConfig) => void
  remove: () => void
}

const sanitizeConfig = (raw: unknown): WallpaperConfig | null => {
  if (!raw || typeof raw !== 'object') return null
  const candidate = raw as Partial<WallpaperConfig>
  if (!candidate.source || !candidate.privacyLevel) return null
  const fallback = createDefaultWallpaperConfig()
  const merged: WallpaperConfig = {
    source: candidate.source,
    overlayColor: candidate.overlayColor ?? fallback.overlayColor,
    overlayOpacity: typeof candidate.overlayOpacity === 'number' ? candidate.overlayOpacity : fallback.overlayOpacity,
    blurPx: typeof candidate.blurPx === 'number' ? candidate.blurPx : fallback.blurPx,
    brightness: typeof candidate.brightness === 'number' ? candidate.brightness : fallback.brightness,
    saturation: typeof candidate.saturation === 'number' ? candidate.saturation : fallback.saturation,
    vignetteStrength: typeof candidate.vignetteStrength === 'number' ? candidate.vignetteStrength : fallback.vignetteStrength,
    cardOpacity: typeof candidate.cardOpacity === 'number' ? candidate.cardOpacity : fallback.cardOpacity,
    privacyLevel: candidate.privacyLevel,
    storage: candidate.storage ?? fallback.storage,
    includeInSync: typeof candidate.includeInSync === 'boolean' ? candidate.includeInSync : fallback.includeInSync,
    includeInScreenshots:
      typeof candidate.includeInScreenshots === 'boolean'
        ? candidate.includeInScreenshots
        : fallback.includeInScreenshots,
    themeIdAtCapture: candidate.themeIdAtCapture ?? fallback.themeIdAtCapture
  }
  return clampWallpaperConfig(merged)
}

export const createMemoryWallpaperStore = (
  initialConfig = createDefaultWallpaperConfig()
): WallpaperStore => {
  let state = structuredClone(initialConfig)

  return {
    load: () => structuredClone(state),
    save: (next) => {
      state = structuredClone(next)
    },
    remove: () => {
      state = createDefaultWallpaperConfig()
    }
  }
}

export const createBrowserWallpaperStore = (
  storageKey = 'growth-workbench-wallpaper'
): WallpaperStore => ({
  load: () => {
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (!stored) return createDefaultWallpaperConfig()
      const parsed = JSON.parse(stored) as unknown
      const sanitized = sanitizeConfig(parsed)
      return sanitized ?? createDefaultWallpaperConfig()
    } catch {
      return createDefaultWallpaperConfig()
    }
  },
  save: (config) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(config))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (/quota|QuotaExceeded/i.test(message)) {
        throw new WallpaperValidationError(
          'wallpaper/storage-quota',
          '壁纸保存失败：localStorage 空间不足，请删除当前壁纸或使用更小的图片。'
        )
      }
      throw error
    }
  },
  remove: () => {
    window.localStorage.removeItem(storageKey)
  }
})
