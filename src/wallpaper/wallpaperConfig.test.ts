import { describe, expect, it } from 'vitest'
import {
  WALLPAPER_LIMITS,
  WallpaperValidationError,
  assessWallpaperReadability,
  clampWallpaperConfig,
  createDefaultWallpaperConfig,
  deriveWallpaperFromTheme,
  toWallpaperCssVariables,
  validateWallpaperConfig
} from './wallpaperConfig'
import { getThemeById } from '../themes/themeRegistry'

describe('wallpaperConfig', () => {
  it('creates a privacy-aware default wallpaper config that is local-only', () => {
    const config = createDefaultWallpaperConfig()

    expect(config.source.kind).toBe('none')
    expect(config.privacyLevel).toBe('private')
    expect(config.storage).toBe('local-only')
    expect(config.includeInSync).toBe(false)
    expect(config.includeInScreenshots).toBe(false)
    expect(config.overlayOpacity).toBeGreaterThanOrEqual(0)
    expect(config.overlayOpacity).toBeLessThanOrEqual(1)
    expect(config.cardOpacity).toBeGreaterThan(0)
    expect(config.cardOpacity).toBeLessThanOrEqual(1)
  })

  it('derives wallpaper defaults from the active theme wallpaperSupport tokens', () => {
    const nightFocus = getThemeById('night-focus')
    const config = deriveWallpaperFromTheme(nightFocus)

    expect(config.overlayColor).toBe(nightFocus.wallpaperSupport.overlay)
    expect(config.blurPx).toBe(parseFloat(nightFocus.wallpaperSupport.blur))
    expect(config.brightness).toBe(parseFloat(nightFocus.wallpaperSupport.brightness))
    expect(config.saturation).toBe(parseFloat(nightFocus.wallpaperSupport.saturation))
    expect(config.vignetteStrength).toBeGreaterThanOrEqual(0)
    expect(config.vignetteStrength).toBeLessThanOrEqual(1)
    expect(config.themeIdAtCapture).toBe(nightFocus.id)
  })

  it('clamps and rejects invalid configuration before saving', () => {
    expect(() =>
      validateWallpaperConfig({
        source: { kind: 'data-url', dataUrl: 'data:image/png;base64,AAAA', mimeType: 'image/png', byteSize: 10 },
        overlayColor: 'rgba(0,0,0,0.4)',
        overlayOpacity: 2,
        blurPx: -5,
        brightness: 5,
        saturation: -1,
        vignetteStrength: 9,
        cardOpacity: 2,
        privacyLevel: 'private',
        storage: 'local-only',
        includeInSync: false,
        includeInScreenshots: false,
        themeIdAtCapture: 'minimal-premium'
      })
    ).toThrow(WallpaperValidationError)

    expect(() =>
      validateWallpaperConfig({
        source: {
          kind: 'data-url',
          dataUrl: 'data:image/bmp;base64,AAAA',
          mimeType: 'image/bmp',
          byteSize: 1024
        },
        overlayColor: 'rgba(0,0,0,0.4)',
        overlayOpacity: 0.4,
        blurPx: 10,
        brightness: 1,
        saturation: 1,
        vignetteStrength: 0.3,
        cardOpacity: 0.9,
        privacyLevel: 'private',
        storage: 'local-only',
        includeInSync: false,
        includeInScreenshots: false,
        themeIdAtCapture: 'minimal-premium'
      })
    ).toThrow(/mime/i)

    const oversized = WALLPAPER_LIMITS.maxBytes + 1
    expect(() =>
      validateWallpaperConfig({
        source: {
          kind: 'data-url',
          dataUrl: 'data:image/png;base64,AAAA',
          mimeType: 'image/png',
          byteSize: oversized
        },
        overlayColor: 'rgba(0,0,0,0.4)',
        overlayOpacity: 0.4,
        blurPx: 10,
        brightness: 1,
        saturation: 1,
        vignetteStrength: 0.3,
        cardOpacity: 0.9,
        privacyLevel: 'private',
        storage: 'local-only',
        includeInSync: false,
        includeInScreenshots: false,
        themeIdAtCapture: 'minimal-premium'
      })
    ).toThrow(/size|big|large|超出/i)
  })

  it('warns about readability risks when overlay and brightness fall outside safe range', () => {
    const tooBright = assessWallpaperReadability({
      overlayOpacity: 0.1,
      brightness: 1.6,
      cardOpacity: 0.5,
      themeMode: 'light'
    })
    expect(tooBright.level).toBe('warning')
    expect(tooBright.messages.length).toBeGreaterThan(0)

    const tooDarkOnLight = assessWallpaperReadability({
      overlayOpacity: 0.2,
      brightness: 0.3,
      cardOpacity: 0.6,
      themeMode: 'light'
    })
    expect(tooDarkOnLight.level).toBe('warning')

    const safe = assessWallpaperReadability({
      overlayOpacity: 0.5,
      brightness: 0.95,
      cardOpacity: 0.85,
      themeMode: 'light'
    })
    expect(safe.level).toBe('ok')
    expect(safe.messages).toEqual([])
  })

  it('maps configuration into CSS custom properties for the wallpaper layer', () => {
    const config = createDefaultWallpaperConfig()
    config.source = {
      kind: 'data-url',
      dataUrl: 'data:image/png;base64,AAAA',
      mimeType: 'image/png',
      byteSize: 1024
    }

    const vars = toWallpaperCssVariables(config)

    expect(vars['--wallpaper-image']).toContain('url(')
    expect(vars['--wallpaper-overlay']).toBe(config.overlayColor)
    expect(vars['--wallpaper-blur']).toBe(`${config.blurPx}px`)
    expect(vars['--wallpaper-brightness']).toBe(String(config.brightness))
    expect(vars['--wallpaper-saturation']).toBe(String(config.saturation))
    expect(vars['--wallpaper-vignette']).toBe(String(config.vignetteStrength))
    expect(vars['--wallpaper-card-opacity']).toBe(String(config.cardOpacity))
  })

  it('returns a none-image variable when no wallpaper source is set', () => {
    const config = createDefaultWallpaperConfig()
    const vars = toWallpaperCssVariables(config)
    expect(vars['--wallpaper-image']).toBe('none')
  })

  it('rejects non-image data URL schemes to block injection vectors', () => {
    expect(() =>
      validateWallpaperConfig({
        source: {
          kind: 'data-url',
          dataUrl: 'data:text/html;base64,PHNjcmlwdD4=',
          mimeType: 'image/png',
          byteSize: 12
        },
        overlayColor: 'rgba(0,0,0,0.4)',
        overlayOpacity: 0.4,
        blurPx: 10,
        brightness: 1,
        saturation: 1,
        vignetteStrength: 0.3,
        cardOpacity: 0.9,
        privacyLevel: 'private',
        storage: 'local-only',
        includeInSync: false,
        includeInScreenshots: false,
        themeIdAtCapture: 'minimal-premium'
      })
    ).toThrow(/dataUrl/i)
  })

  it('rejects sync policy conflict where local-only is asked to sync', () => {
    expect(() =>
      validateWallpaperConfig({
        source: { kind: 'none' },
        overlayColor: 'rgba(0,0,0,0.4)',
        overlayOpacity: 0.4,
        blurPx: 10,
        brightness: 1,
        saturation: 1,
        vignetteStrength: 0.3,
        cardOpacity: 0.9,
        privacyLevel: 'private',
        storage: 'local-only',
        includeInSync: true,
        includeInScreenshots: false,
        themeIdAtCapture: 'minimal-premium'
      })
    ).toThrow(/sync|conflict|same|local/i)
  })

  it('clamps out-of-range numeric fields without throwing', () => {
    const clamped = clampWallpaperConfig({
      source: { kind: 'none' },
      overlayColor: 'rgba(0,0,0,0.4)',
      overlayOpacity: 9,
      blurPx: -50,
      brightness: 99,
      saturation: -3,
      vignetteStrength: 7,
      cardOpacity: -1,
      privacyLevel: 'private',
      storage: 'local-only',
      includeInSync: false,
      includeInScreenshots: false,
      themeIdAtCapture: 'minimal-premium'
    })
    expect(clamped.overlayOpacity).toBeLessThanOrEqual(WALLPAPER_LIMITS.maxOpacity)
    expect(clamped.blurPx).toBeGreaterThanOrEqual(WALLPAPER_LIMITS.minBlurPx)
    expect(clamped.brightness).toBeLessThanOrEqual(WALLPAPER_LIMITS.maxBrightness)
    expect(clamped.saturation).toBeGreaterThanOrEqual(WALLPAPER_LIMITS.minSaturation)
    expect(clamped.vignetteStrength).toBeLessThanOrEqual(1)
    expect(clamped.cardOpacity).toBeGreaterThanOrEqual(WALLPAPER_LIMITS.minCardOpacity)
  })
})
