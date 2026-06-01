import type { StudyTheme, ThemeId } from '../themes/themeRegistry'

export type WallpaperPrivacyLevel = 'public' | 'private' | 'sensitive'

export type WallpaperStoragePolicy = 'local-only' | 'sync-allowed'

export type WallpaperSource =
  | { kind: 'none' }
  | {
      kind: 'data-url'
      dataUrl: string
      mimeType: WallpaperMimeType
      byteSize: number
    }

export type WallpaperMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

export type WallpaperConfig = {
  source: WallpaperSource
  overlayColor: string
  overlayOpacity: number
  blurPx: number
  brightness: number
  saturation: number
  vignetteStrength: number
  cardOpacity: number
  privacyLevel: WallpaperPrivacyLevel
  storage: WallpaperStoragePolicy
  includeInSync: boolean
  includeInScreenshots: boolean
  themeIdAtCapture: ThemeId
}

export type WallpaperReadabilityLevel = 'ok' | 'warning'

export type WallpaperReadabilityReport = {
  level: WallpaperReadabilityLevel
  messages: string[]
}

export type WallpaperCssVariables = {
  '--wallpaper-image': string
  '--wallpaper-overlay': string
  '--wallpaper-overlay-opacity': string
  '--wallpaper-blur': string
  '--wallpaper-brightness': string
  '--wallpaper-saturation': string
  '--wallpaper-vignette': string
  '--wallpaper-card-opacity': string
}

export const WALLPAPER_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  minBlurPx: 0,
  maxBlurPx: 48,
  minBrightness: 0.2,
  maxBrightness: 1.5,
  minSaturation: 0,
  maxSaturation: 1.6,
  minOpacity: 0,
  maxOpacity: 1,
  minCardOpacity: 0.3,
  maxCardOpacity: 1,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as WallpaperMimeType[]
} as const

export class WallpaperValidationError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'WallpaperValidationError'
  }
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const isInRange = (value: number, min: number, max: number): boolean =>
  Number.isFinite(value) && value >= min && value <= max

const ALLOWED_DATA_URL_REGEX = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/

const isAllowedDataUrl = (raw: string): boolean => ALLOWED_DATA_URL_REGEX.test(raw)

export const clampWallpaperConfig = (config: WallpaperConfig): WallpaperConfig => ({
  ...config,
  overlayOpacity: clamp(config.overlayOpacity, WALLPAPER_LIMITS.minOpacity, WALLPAPER_LIMITS.maxOpacity),
  blurPx: clamp(config.blurPx, WALLPAPER_LIMITS.minBlurPx, WALLPAPER_LIMITS.maxBlurPx),
  brightness: clamp(config.brightness, WALLPAPER_LIMITS.minBrightness, WALLPAPER_LIMITS.maxBrightness),
  saturation: clamp(config.saturation, WALLPAPER_LIMITS.minSaturation, WALLPAPER_LIMITS.maxSaturation),
  vignetteStrength: clamp(config.vignetteStrength, 0, 1),
  cardOpacity: clamp(config.cardOpacity, WALLPAPER_LIMITS.minCardOpacity, WALLPAPER_LIMITS.maxCardOpacity)
})

export const createDefaultWallpaperConfig = (): WallpaperConfig => ({
  source: { kind: 'none' },
  overlayColor: 'rgba(248, 247, 242, 0.72)',
  overlayOpacity: 0.5,
  blurPx: 14,
  brightness: 0.96,
  saturation: 0.82,
  vignetteStrength: 0.18,
  cardOpacity: 0.85,
  privacyLevel: 'private',
  storage: 'local-only',
  includeInSync: false,
  includeInScreenshots: false,
  themeIdAtCapture: 'minimal-premium'
})

const parseUnitNumber = (raw: string, fallback: number): number => {
  const parsed = parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const deriveWallpaperFromTheme = (theme: StudyTheme): WallpaperConfig => {
  const base = createDefaultWallpaperConfig()
  const support = theme.wallpaperSupport
  const brightness = clamp(
    parseUnitNumber(support.brightness, base.brightness),
    WALLPAPER_LIMITS.minBrightness,
    WALLPAPER_LIMITS.maxBrightness
  )
  const isDarkTheme = brightness < 0.7

  return {
    ...base,
    overlayColor: support.overlay,
    overlayOpacity: clamp(
      parseOverlayOpacity(support.overlay, base.overlayOpacity),
      WALLPAPER_LIMITS.minOpacity,
      WALLPAPER_LIMITS.maxOpacity
    ),
    blurPx: clamp(
      parseUnitNumber(support.blur, base.blurPx),
      WALLPAPER_LIMITS.minBlurPx,
      WALLPAPER_LIMITS.maxBlurPx
    ),
    brightness,
    saturation: clamp(
      parseUnitNumber(support.saturation, base.saturation),
      WALLPAPER_LIMITS.minSaturation,
      WALLPAPER_LIMITS.maxSaturation
    ),
    vignetteStrength: isDarkTheme ? 0.32 : 0.18,
    themeIdAtCapture: theme.id
  }
}

const parseOverlayOpacity = (color: string, fallback: number): number => {
  const match = color.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*([0-9.]+)\s*)?\)/i)
  if (!match) return fallback
  return match[1] ? parseFloat(match[1]) : 1
}

export const validateWallpaperConfig = (config: WallpaperConfig): WallpaperConfig => {
  if (config.source.kind === 'data-url') {
    if (!WALLPAPER_LIMITS.allowedMimeTypes.includes(config.source.mimeType)) {
      throw new WallpaperValidationError(
        'wallpaper/invalid-mime',
        `不支持的壁纸格式 mime=${config.source.mimeType}，请使用 jpeg / png / webp / gif。`
      )
    }
    if (config.source.byteSize <= 0) {
      throw new WallpaperValidationError(
        'wallpaper/empty-file',
        '壁纸文件为空，请重新选择图片。'
      )
    }
    if (config.source.byteSize > WALLPAPER_LIMITS.maxBytes) {
      throw new WallpaperValidationError(
        'wallpaper/too-large',
        `壁纸文件过大（size=${config.source.byteSize}B），超出 ${WALLPAPER_LIMITS.maxBytes}B 上限。`
      )
    }
    if (!isAllowedDataUrl(config.source.dataUrl)) {
      throw new WallpaperValidationError(
        'wallpaper/invalid-data-url',
        '壁纸 dataUrl 非法，仅允许 data:image/(jpeg|png|webp|gif);base64,...'
      )
    }
  }

  if (config.includeInSync && config.storage === 'local-only') {
    throw new WallpaperValidationError(
      'wallpaper/sync-policy-conflict',
      '配置冲突：includeInSync=true 时 storage 不能为 local-only。'
    )
  }

  if (!isInRange(config.overlayOpacity, WALLPAPER_LIMITS.minOpacity, WALLPAPER_LIMITS.maxOpacity)) {
    throw new WallpaperValidationError(
      'wallpaper/overlay-out-of-range',
      `overlayOpacity 越界，应在 [${WALLPAPER_LIMITS.minOpacity}, ${WALLPAPER_LIMITS.maxOpacity}]`
    )
  }
  if (!isInRange(config.blurPx, WALLPAPER_LIMITS.minBlurPx, WALLPAPER_LIMITS.maxBlurPx)) {
    throw new WallpaperValidationError(
      'wallpaper/blur-out-of-range',
      `blurPx 越界，应在 [${WALLPAPER_LIMITS.minBlurPx}, ${WALLPAPER_LIMITS.maxBlurPx}]`
    )
  }
  if (!isInRange(config.brightness, WALLPAPER_LIMITS.minBrightness, WALLPAPER_LIMITS.maxBrightness)) {
    throw new WallpaperValidationError(
      'wallpaper/brightness-out-of-range',
      `brightness 越界，应在 [${WALLPAPER_LIMITS.minBrightness}, ${WALLPAPER_LIMITS.maxBrightness}]`
    )
  }
  if (!isInRange(config.saturation, WALLPAPER_LIMITS.minSaturation, WALLPAPER_LIMITS.maxSaturation)) {
    throw new WallpaperValidationError(
      'wallpaper/saturation-out-of-range',
      `saturation 越界，应在 [${WALLPAPER_LIMITS.minSaturation}, ${WALLPAPER_LIMITS.maxSaturation}]`
    )
  }
  if (!isInRange(config.vignetteStrength, 0, 1)) {
    throw new WallpaperValidationError(
      'wallpaper/vignette-out-of-range',
      'vignetteStrength 越界，应在 [0, 1]'
    )
  }
  if (!isInRange(config.cardOpacity, WALLPAPER_LIMITS.minCardOpacity, WALLPAPER_LIMITS.maxCardOpacity)) {
    throw new WallpaperValidationError(
      'wallpaper/card-opacity-out-of-range',
      `cardOpacity 越界，应在 [${WALLPAPER_LIMITS.minCardOpacity}, ${WALLPAPER_LIMITS.maxCardOpacity}]`
    )
  }

  return config
}

export type ReadabilityInput = {
  overlayOpacity: number
  brightness: number
  cardOpacity: number
  themeMode: 'light' | 'dark'
}

export const assessWallpaperReadability = (input: ReadabilityInput): WallpaperReadabilityReport => {
  const messages: string[] = []

  if (input.brightness > 1.3 && input.overlayOpacity < 0.25) {
    messages.push('壁纸亮度过高且遮罩偏弱，正文文字可读性下降，建议提升遮罩或降低亮度。')
  }
  if (input.themeMode === 'light' && input.brightness < 0.5 && input.overlayOpacity < 0.4) {
    messages.push('当前为浅色主题但壁纸偏暗，建议提升亮度或加深遮罩颜色。')
  }
  if (input.themeMode === 'dark' && input.brightness > 0.9) {
    messages.push('当前为夜间主题但壁纸偏亮，可能影响夜间专注，建议降低亮度。')
  }
  if (input.cardOpacity < 0.5) {
    messages.push('卡片透明度过低，关键信息可能被壁纸纹理干扰，建议提高至 0.7 以上。')
  }

  return {
    level: messages.length === 0 ? 'ok' : 'warning',
    messages
  }
}

export const toWallpaperCssVariables = (config: WallpaperConfig): WallpaperCssVariables => {
  const image =
    config.source.kind === 'data-url' ? `url("${config.source.dataUrl}")` : 'none'

  return {
    '--wallpaper-image': image,
    '--wallpaper-overlay': config.overlayColor,
    '--wallpaper-overlay-opacity': String(config.overlayOpacity),
    '--wallpaper-blur': `${config.blurPx}px`,
    '--wallpaper-brightness': String(config.brightness),
    '--wallpaper-saturation': String(config.saturation),
    '--wallpaper-vignette': String(config.vignetteStrength),
    '--wallpaper-card-opacity': String(config.cardOpacity)
  }
}

export const describeWallpaperForLog = (config: WallpaperConfig): string => {
  if (config.source.kind === 'none') {
    return 'wallpaper:none'
  }
  return `wallpaper:data-url mime=${config.source.mimeType} size=${config.source.byteSize}B private=${config.privacyLevel === 'private'}`
}
