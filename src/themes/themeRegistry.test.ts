import { describe, expect, it } from 'vitest'
import { getThemeById, themeFamilyMeta, themeRegistry } from './themeRegistry'

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
      'night-aurora',
      'clash-pop-orange-violet',
      'clash-blue-orange',
      'clash-neon-cyber',
      'clash-juicy-gradient',
      'clash-retro-sunset',
      'huawei-harmony-cosmos',
      'huawei-pura-violet',
      'huawei-mate-spruce',
      'huawei-pearl-snow',
      'liquid-glass-aurora',
      'liquid-glass-pure',
      'aqua-droplet',
      'flow-silk'
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

  it('offers bold clash palettes for lively users while protecting readability', () => {
    const clashThemes = themeRegistry.filter((theme) => theme.aesthetic === 'clash')
    expect(clashThemes.map((theme) => theme.id)).toEqual([
      'clash-pop-orange-violet',
      'clash-blue-orange',
      'clash-neon-cyber',
      'clash-juicy-gradient',
      'clash-retro-sunset'
    ])
    clashThemes.forEach((theme) => {
      expect(theme.aesthetic).toBe('clash')
      expect(theme.category).toBe('built-in')
      expect(theme.defaultCandidate).toBe(false)
      expect(theme.design.tone).toBeTruthy()
      expect(theme.accessibilityNotes.length).toBeGreaterThan(0)
    })

    const popClash = getThemeById('clash-pop-orange-violet')
    expect(popClash.tokens.colors.primary).toBe('#7c3aed')
    expect(popClash.tokens.colors.secondary).toBe('#ff7a29')
    expect(popClash.tokens.gradients.hero).toContain('#7c3aed')
    expect(popClash.tokens.gradients.hero).toContain('#ff7a29')

    const blueOrange = getThemeById('clash-blue-orange')
    expect(blueOrange.tokens.colors.primary).toBe('#1d4ed8')
    expect(blueOrange.tokens.colors.secondary).toBe('#ff7a29')

    const neonCyber = getThemeById('clash-neon-cyber')
    expect(neonCyber.tokens.colors.primary).toBe('#ff2bd6')
    expect(neonCyber.tokens.colors.secondary).toBe('#22d3ee')
    expect(neonCyber.tokens.colors.background).toContain('#0a0620')
    expect(neonCyber.wallpaperSupport.brightness).toBe('0.52')

    const juicy = getThemeById('clash-juicy-gradient')
    expect(juicy.tokens.gradients.hero).toContain('#facc15')
    expect(juicy.tokens.gradients.hero).toContain('#0ea5e9')

    const retro = getThemeById('clash-retro-sunset')
    expect(retro.tokens.colors.primary).toBe('#ea580c')
    expect(retro.tokens.colors.accent).toBe('#1e3a8a')
  })

  it('exposes Huawei flagship palettes and liquid material themes with required material tags', () => {
    const huaweiThemes = themeRegistry.filter((theme) => theme.aesthetic === 'huawei')
    expect(huaweiThemes.map((t) => t.id)).toEqual([
      'huawei-harmony-cosmos',
      'huawei-pura-violet',
      'huawei-mate-spruce',
      'huawei-pearl-snow'
    ])
    huaweiThemes.forEach((t) => expect(['glass', 'pearl', 'metal']).toContain(t.material))

    const liquidThemes = themeRegistry.filter((theme) => theme.aesthetic === 'liquid')
    expect(liquidThemes.map((t) => t.id)).toEqual([
      'liquid-glass-aurora',
      'liquid-glass-pure',
      'aqua-droplet',
      'flow-silk'
    ])
    expect(getThemeById('liquid-glass-pure').material).toBe('liquid-glass')
    expect(getThemeById('liquid-glass-pure').defaultCandidate).toBe(true)
    expect(getThemeById('liquid-glass-aurora').tokens.effects.glass).toContain('blur(28px)')
    expect(getThemeById('aqua-droplet').material).toBe('aqua')
    expect(getThemeById('flow-silk').material).toBe('fabric')
    expect(getThemeById('huawei-harmony-cosmos').tokens.colors.primary).toBe('#0f2a5c')
    expect(getThemeById('huawei-mate-spruce').material).toBe('metal')
    expect(getThemeById('huawei-pearl-snow').material).toBe('pearl')
  })

  it('groups themes into a curated set of family meta entries that cover every aesthetic', () => {
    const aestheticsFromFamilies = themeFamilyMeta.flatMap((f) => f.includes)
    const allAesthetics = Array.from(new Set(themeRegistry.map((t) => t.aesthetic)))
    allAesthetics.forEach((a) => expect(aestheticsFromFamilies).toContain(a))
    expect(themeFamilyMeta.length).toBeGreaterThanOrEqual(6)
    expect(themeFamilyMeta.map((f) => f.id)).toContain('huawei-aesthetic')
    expect(themeFamilyMeta.map((f) => f.id)).toContain('liquid-material')
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
