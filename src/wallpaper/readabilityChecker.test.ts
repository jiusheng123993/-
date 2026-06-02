import { describe, it, expect } from 'vitest'
import { checkWallpaperReadability, parseOverlayOpacity, parseBlurPx } from './readabilityChecker'
import type { WallpaperConfig } from './wallpaperTypes'
import { DEFAULT_WALLPAPER_ADJUSTMENTS } from './wallpaperTypes'

function makeConfig(overrides: Partial<WallpaperConfig> = {}): WallpaperConfig {
  return {
    id: 'test_1',
    source: 'upload',
    adjustments: { ...DEFAULT_WALLPAPER_ADJUSTMENTS },
    readabilityWarning: false,
    createdAt: '2026-06-02T00:00:00.000Z',
    updatedAt: '2026-06-02T00:00:00.000Z',
    ...overrides
  }
}

const defaultTokens = {
  text: '#20242c',
  background: '#f8f7f2',
  surface: 'rgba(255,255,255,0.82)'
}

describe('parseOverlayOpacity', () => {
  it('parses rgba overlay', () => {
    expect(parseOverlayOpacity('rgba(0, 0, 0, 0.30)')).toBeCloseTo(0.3)
  })

  it('parses rgba overlay with different alpha', () => {
    expect(parseOverlayOpacity('rgba(255, 255, 255, 0.72)')).toBeCloseTo(0.72)
  })

  it('returns default for non-matching string', () => {
    expect(parseOverlayOpacity('invalid')).toBe(0.3)
  })
})

describe('parseBlurPx', () => {
  it('parses blur px value', () => {
    expect(parseBlurPx('10px')).toBe(10)
  })

  it('parses decimal blur px value', () => {
    expect(parseBlurPx('14.5px')).toBeCloseTo(14.5)
  })

  it('returns 0 for non-matching string', () => {
    expect(parseBlurPx('none')).toBe(0)
  })
})

describe('checkWallpaperReadability', () => {
  it('returns high score for default adjustments', () => {
    const config = makeConfig()
    const result = checkWallpaperReadability(config, defaultTokens)
    expect(result.score).toBeGreaterThan(70)
    expect(result.warning).toBe(false)
  })

  it('detects too dark wallpaper', () => {
    const config = makeConfig({
      adjustments: { ...DEFAULT_WALLPAPER_ADJUSTMENTS, brightness: 0.3, overlay: 'rgba(0, 0, 0, 0.1)' }
    })
    const result = checkWallpaperReadability(config, defaultTokens)
    expect(result.issues.some(i => i.type === 'too_dark')).toBe(true)
    expect(result.score).toBeLessThan(80)
  })

  it('detects too bright wallpaper', () => {
    const config = makeConfig({
      adjustments: { ...DEFAULT_WALLPAPER_ADJUSTMENTS, brightness: 1.8 }
    })
    const result = checkWallpaperReadability(config, defaultTokens)
    expect(result.issues.some(i => i.type === 'too_bright')).toBe(true)
  })

  it('detects too busy wallpaper with low blur', () => {
    const config = makeConfig({
      source: 'upload',
      adjustments: { ...DEFAULT_WALLPAPER_ADJUSTMENTS, blur: '2px' }
    })
    const result = checkWallpaperReadability(config, defaultTokens)
    expect(result.issues.some(i => i.type === 'too_busy')).toBe(true)
  })

  it('detects low contrast with thin overlay', () => {
    const config = makeConfig({
      source: 'upload',
      adjustments: { ...DEFAULT_WALLPAPER_ADJUSTMENTS, overlay: 'rgba(0, 0, 0, 0.10)' }
    })
    const result = checkWallpaperReadability(config, defaultTokens)
    expect(result.issues.some(i => i.type === 'low_contrast')).toBe(true)
  })

  it('does not flag too_busy for theme_default source', () => {
    const config = makeConfig({
      source: 'theme_default',
      adjustments: { ...DEFAULT_WALLPAPER_ADJUSTMENTS, blur: '0px' }
    })
    const result = checkWallpaperReadability(config, defaultTokens)
    expect(result.issues.some(i => i.type === 'too_busy')).toBe(false)
  })

  it('detects high saturation', () => {
    const config = makeConfig({
      adjustments: { ...DEFAULT_WALLPAPER_ADJUSTMENTS, saturation: 1.8 }
    })
    const result = checkWallpaperReadability(config, defaultTokens)
    expect(result.issues.some(i => i.type === 'too_bright')).toBe(true)
  })

  it('detects low card opacity', () => {
    const config = makeConfig({
      adjustments: { ...DEFAULT_WALLPAPER_ADJUSTMENTS, cardOpacity: 0.4 }
    })
    const result = checkWallpaperReadability(config, defaultTokens)
    expect(result.issues.some(i => i.type === 'low_contrast')).toBe(true)
  })

  it('score never goes below 0', () => {
    const config = makeConfig({
      adjustments: {
        overlay: 'rgba(0, 0, 0, 0.05)',
        blur: '0px',
        brightness: 0.1,
        saturation: 2,
        vignette: 1,
        cardOpacity: 0.2
      }
    })
    const result = checkWallpaperReadability(config, defaultTokens)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })

  it('warning is true when score < 70', () => {
    const config = makeConfig({
      adjustments: {
        overlay: 'rgba(0, 0, 0, 0.05)',
        blur: '0px',
        brightness: 0.3,
        saturation: 1,
        vignette: 0,
        cardOpacity: 0.4
      }
    })
    const result = checkWallpaperReadability(config, defaultTokens)
    expect(result.warning).toBe(true)
  })
})
