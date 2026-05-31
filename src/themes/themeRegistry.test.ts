import { describe, expect, it } from 'vitest'
import { getThemeById, themeRegistry } from './themeRegistry'

describe('themeRegistry', () => {
  it('provides official user-centered theme profiles with multiple color choices', () => {
    expect(themeRegistry.map((theme) => theme.id)).toEqual([
      'minimal-premium',
      'minimal-sage',
      'cream-dopamine',
      'dopamine-yellow',
      'dopamine-green',
      'dopamine-pink',
      'dopamine-combo',
      'ink-wash',
      'ink-bamboo',
      'ink-rainblue',
      'modern-chinese',
      'healing-anime',
      'anime-sky',
      'morandi-gentle',
      'morandi-rose',
      'business-bluegray',
      'business-graphite',
      'night-focus',
      'night-aurora'
    ])
  })

  it('keeps every theme profile complete and accessible to the UI token system', () => {
    themeRegistry.forEach((theme) => {
      expect(theme.name).toBeTruthy()
      expect(theme.category).toBe('built-in')
      expect(theme.aesthetic).toBeTruthy()
      expect(theme.defaultCandidate).toEqual(expect.any(Boolean))
      expect(theme.visualComfort).toBeTruthy()
      expect(theme.recommendedFor.length).toBeGreaterThan(0)
      expect(theme.accessibilityNotes.length).toBeGreaterThan(0)
      expect(theme.wallpaperSupport.overlay).toBeTruthy()
      expect(theme.wallpaperSupport.blur).toBeTruthy()
      expect(theme.wallpaperSupport.brightness).toBeTruthy()
      expect(theme.wallpaperSupport.saturation).toBeTruthy()
      expect(theme.design.tone).toBeTruthy()
      expect(theme.design.scene).toBeTruthy()
      expect(theme.design.principle).toBeTruthy()
      expect(theme.design.aiVoice).toBeTruthy()
      expect(theme.tokens.colors.background).toBeTruthy()
      expect(theme.tokens.colors.surface).toBeTruthy()
      expect(theme.tokens.colors.surfaceStrong).toBeTruthy()
      expect(theme.tokens.colors.primary).toBeTruthy()
      expect(theme.tokens.colors.secondary).toBeTruthy()
      expect(theme.tokens.colors.accent).toBeTruthy()
      expect(theme.tokens.colors.text).toBeTruthy()
      expect(theme.tokens.colors.muted).toBeTruthy()
      expect(theme.tokens.colors.border).toBeTruthy()
      expect(theme.tokens.gradients.hero).toBeTruthy()
      expect(theme.tokens.gradients.card).toBeTruthy()
      expect(theme.tokens.charts.plan).toBeTruthy()
      expect(theme.tokens.charts.focus).toBeTruthy()
      expect(theme.tokens.charts.review).toBeTruthy()
      expect(theme.tokens.effects.radius).toBeTruthy()
      expect(theme.tokens.effects.shadow).toBeTruthy()
      expect(theme.tokens.effects.glass).toBeTruthy()
    })
  })

  it('separates ink wash from modern Chinese style and gives ink variants real ink traits', () => {
    const inkWash = getThemeById('ink-wash')
    const inkBamboo = getThemeById('ink-bamboo')
    const inkRainblue = getThemeById('ink-rainblue')
    const modernChinese = getThemeById('modern-chinese')

    expect(inkWash.name).toBe('水墨留白')
    expect(inkWash.aesthetic).toBe('ink')
    expect(inkWash.recommendedFor).toContain('深度学习')
    expect(inkWash.design.principle).toContain('墨韵')
    expect(inkWash.tokens.colors.background).toContain('radial-gradient')
    expect(inkBamboo.aesthetic).toBe('ink')
    expect(inkBamboo.design.tone).toContain('竹影')
    expect(inkRainblue.aesthetic).toBe('ink')
    expect(inkRainblue.design.tone).toContain('雨青')

    expect(modernChinese.name).toBe('新中式国风')
    expect(modernChinese.aesthetic).toBe('chinese')
    expect(modernChinese.recommendedFor).toContain('传统文化偏好')
  })

  it('keeps minimal and dopamine palettes as default onboarding candidates with distinct options', () => {
    const minimal = getThemeById('minimal-premium')
    const dopamine = getThemeById('cream-dopamine')
    const dopamineYellow = getThemeById('dopamine-yellow')
    const dopamineGreen = getThemeById('dopamine-green')
    const dopaminePink = getThemeById('dopamine-pink')
    const dopamineCombo = getThemeById('dopamine-combo')

    expect(minimal.defaultCandidate).toBe(true)
    expect(dopamine.defaultCandidate).toBe(true)
    expect(minimal.visualComfort).toContain('低噪音')
    expect(dopamine.visualComfort).toContain('小面积高亮')
    expect(dopamineYellow.tokens.colors.primary).toBe('#e9a923')
    expect(dopamineGreen.tokens.colors.primary).toBe('#28a774')
    expect(dopaminePink.tokens.colors.primary).toBe('#ef6f9f')
    expect(dopamineCombo.tokens.gradients.hero).toContain('#ef6f9f')
  })

  it('keeps night palettes dim enough for low-light use without pure black contrast', () => {
    const nightFocus = getThemeById('night-focus')
    const nightAurora = getThemeById('night-aurora')

    expect(nightFocus.visualComfort).toContain('更深')
    expect(nightFocus.wallpaperSupport.brightness).toBe('0.48')
    expect(nightFocus.tokens.colors.background).toContain('#070b14')
    expect(nightFocus.tokens.colors.surface).toBe('rgba(10, 18, 32, 0.72)')
    expect(nightFocus.tokens.colors.primary).toBe('#6fa4d8')
    expect(nightFocus.tokens.effects.glass).toContain('saturate(0.92)')

    expect(nightAurora.visualComfort).toContain('更深')
    expect(nightAurora.wallpaperSupport.brightness).toBe('0.46')
    expect(nightAurora.tokens.colors.background).toContain('#050a14')
    expect(nightAurora.tokens.colors.surface).toBe('rgba(8, 16, 30, 0.74)')
    expect(nightAurora.tokens.colors.primary).toBe('#42b9aa')
    expect(nightAurora.tokens.effects.glass).toContain('saturate(0.92)')
  })

  it('maps legacy theme ids to the nearest new official theme', () => {
    expect(getThemeById('campus-premium').id).toBe('minimal-premium')
    expect(getThemeById('business-focus').id).toBe('business-bluegray')
    expect(getThemeById('dream-purple').id).toBe('healing-anime')
    expect(getThemeById('growth-rpg').id).toBe('cream-dopamine')
  })

  it('falls back to minimal premium when a theme is missing', () => {
    expect(getThemeById('unknown-theme').id).toBe('minimal-premium')
  })
})
