import { useState, useEffect, useMemo, useCallback } from 'react'
import { getThemeById, themeRegistry, type ThemeId, type ThemeAesthetic } from '../themes/themeRegistry'

const themeFamilyLabels: Record<string, string> = {
  minimal: '极简',
  dopamine: '多巴胺',
  ink: '水墨',
  chinese: '国风',
  anime: '二次元',
  morandi: '莫兰迪',
  business: '商务',
  night: '夜间',
  clash: '撞色',
  huawei: '华为',
  liquid: '液态玻璃'
}

export function applyThemeToDOM(themeId: ThemeId) {
  const theme = getThemeById(themeId)
  const root = document.documentElement
  root.dataset.theme = theme.id
  root.dataset.aesthetic = theme.aesthetic
  root.dataset.material = theme.material
  root.style.setProperty('--app-background', theme.tokens.colors.background)
  root.style.setProperty('--surface', theme.tokens.colors.surface)
  root.style.setProperty('--surface-strong', theme.tokens.colors.surfaceStrong)
  root.style.setProperty('--primary', theme.tokens.colors.primary)
  root.style.setProperty('--secondary', theme.tokens.colors.secondary)
  root.style.setProperty('--accent', theme.tokens.colors.accent)
  root.style.setProperty('--text', theme.tokens.colors.text)
  root.style.setProperty('--muted', theme.tokens.colors.muted)
  root.style.setProperty('--border', theme.tokens.colors.border)
  root.style.setProperty('--hero-gradient', theme.tokens.gradients.hero)
  root.style.setProperty('--card-gradient', theme.tokens.gradients.card)
  root.style.setProperty('--chart-plan', theme.tokens.charts.plan)
  root.style.setProperty('--chart-focus', theme.tokens.charts.focus)
  root.style.setProperty('--chart-review', theme.tokens.charts.review)
  root.style.setProperty('--radius', theme.tokens.effects.radius)
  root.style.setProperty('--shadow', theme.tokens.effects.shadow)
  root.style.setProperty('--glass', theme.tokens.effects.glass)
}

interface UseThemeOptions {
  initialThemeId: ThemeId
  onThemeChange?: (themeId: ThemeId) => void
}

export function useTheme({ initialThemeId, onThemeChange }: UseThemeOptions = { initialThemeId: 'minimal-cream' }) {
  const [themeId, setThemeId] = useState<ThemeId>(initialThemeId)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFamily, setActiveFamily] = useState<ThemeAesthetic | 'all'>('all')

  const theme = useMemo(() => getThemeById(themeId), [themeId])

  useEffect(() => {
    applyThemeToDOM(themeId)
  }, [themeId])

  const switchTheme = useCallback((newThemeId: ThemeId) => {
    setThemeId(newThemeId)
    onThemeChange?.(newThemeId)
  }, [onThemeChange])

  const filteredThemes = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    return themeRegistry.filter((t) => {
      const searchableText = [
        t.name,
        themeFamilyLabels[t.aesthetic],
        t.visualComfort,
        t.accessibilityNotes,
        t.design.tone,
        t.design.scene,
        t.design.principle,
        ...t.recommendedFor
      ].join(' ').toLowerCase()

      const matchesSearch = normalizedSearch.length === 0 || searchableText.includes(normalizedSearch)
      const matchesFamily = activeFamily === 'all' || t.aesthetic === activeFamily

      return matchesSearch && matchesFamily
    })
  }, [searchQuery, activeFamily])

  const openThemePicker = useCallback(() => {
    setSearchQuery('')
  }, [])

  return {
    theme,
    themeId,
    switchTheme,
    themes: themeRegistry,
    filteredThemes,
    searchQuery,
    setSearchQuery,
    activeFamily,
    setActiveFamily,
    openThemePicker
  }
}

