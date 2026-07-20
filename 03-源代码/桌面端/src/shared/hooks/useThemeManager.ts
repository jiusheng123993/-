import { useEffect, useMemo, useCallback } from 'react'
import {
  getThemeById,
  themeFamilyMeta,
  themeRegistry,
  type ThemeId
} from '../themes/themeRegistry'
import { themeFamilyLabels, applyThemeToDOM } from './useTheme'
import { deriveWallpaperFromTheme } from '../wallpaper/wallpaperConfig'
import { getPersonaById } from '../../ai-partner/personas/personaRegistry'
import type { WorkspaceState } from '../data/workspaceStore'

export interface ThemeManagerState {
  activeTheme: ReturnType<typeof getThemeById>
  themeFamilies: ReturnType<typeof getThemeFamilyList>
  filteredThemes: ReturnType<typeof themeRegistry.filter>
  openThemePicker: () => void
  closeThemePicker: () => void
  switchTheme: (themeId: ThemeId) => void
  restorePersonaTheme: () => void
}

function getThemeFamilyList() {
  return themeFamilyMeta.map((family) => ({
    ...family,
    themes: themeRegistry.filter((theme) => family.includes.includes(theme.aesthetic))
  }))
}

interface UseThemeManagerParams {
  workspaceState: WorkspaceState
  setWorkspaceState: React.Dispatch<React.SetStateAction<WorkspaceState>>
  themeSearchQuery: string
  setThemeSearchQuery: (query: string) => void
  activeThemeFamily: string
  isThemePickerOpen: boolean
  setIsThemePickerOpen: (open: boolean) => void
  isWallpaperPickerOpen: boolean
  setIsWallpaperPickerOpen: (open: boolean) => void
  openWorkbenchDetail: string | null
  setOpenWorkbenchDetail: (detail: string | null) => void
}

export function useThemeManager({
  workspaceState,
  setWorkspaceState,
  themeSearchQuery,
  setThemeSearchQuery,
  activeThemeFamily,
  isThemePickerOpen,
  setIsThemePickerOpen,
  isWallpaperPickerOpen,
  setIsWallpaperPickerOpen,
  openWorkbenchDetail,
  setOpenWorkbenchDetail
}: UseThemeManagerParams): ThemeManagerState {
  const activeTheme = useMemo(
    () => getThemeById(workspaceState.preferences.themeId),
    [workspaceState.preferences.themeId]
  )

  const themeFamilies = useMemo(() => getThemeFamilyList(), [])

  const normalizedThemeSearch = themeSearchQuery.trim().toLowerCase()

  const filteredThemes = themeRegistry.filter((theme) => {
    const searchableText = [
      theme.name,
      themeFamilyLabels[theme.aesthetic],
      theme.visualComfort,
      theme.accessibilityNotes,
      theme.design.tone,
      theme.design.scene,
      theme.design.principle,
      ...theme.recommendedFor
    ].join(' ').toLowerCase()

    const matchesSearch = normalizedThemeSearch.length === 0 || searchableText.includes(normalizedThemeSearch)
    const matchesFamily = activeThemeFamily === 'all' || themeFamilyMeta.find((f) => f.id === activeThemeFamily)?.includes.includes(theme.aesthetic)

    return matchesSearch && matchesFamily
  })

  useEffect(() => {
    applyThemeToDOM(workspaceState.preferences.themeId, workspaceState.preferences.wallpaperConfig)
  }, [workspaceState.preferences.themeId, workspaceState.preferences.wallpaperConfig])

  useEffect(() => {
    if (!isThemePickerOpen && !isWallpaperPickerOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsThemePickerOpen(false)
        setIsWallpaperPickerOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isThemePickerOpen, isWallpaperPickerOpen, setIsThemePickerOpen, setIsWallpaperPickerOpen])

  useEffect(() => {
    if (openWorkbenchDetail === 'theme-center') {
      setIsThemePickerOpen(true)
      setOpenWorkbenchDetail(null)
    }
  }, [openWorkbenchDetail, setIsThemePickerOpen, setOpenWorkbenchDetail])

  const openThemePicker = useCallback(() => {
    setThemeSearchQuery('')
    setIsThemePickerOpen(true)
  }, [setThemeSearchQuery, setIsThemePickerOpen])

  const closeThemePicker = useCallback(() => {
    setIsThemePickerOpen(false)
  }, [setIsThemePickerOpen])

  const switchTheme = useCallback((themeId: ThemeId) => {
    const newTheme = getThemeById(themeId)
    const derivedWallpaper = deriveWallpaperFromTheme(newTheme)
    setWorkspaceState((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        themeId,
        themeMode: 'manual',
        wallpaperConfig: current.preferences.wallpaperConfig
          ? { ...current.preferences.wallpaperConfig, themeIdAtCapture: themeId }
          : derivedWallpaper
      }
    }))
    setIsThemePickerOpen(false)
  }, [setWorkspaceState, setIsThemePickerOpen])

  const restorePersonaTheme = useCallback(() => {
    setWorkspaceState((current) => {
      const persona = getPersonaById(current.preferences.activePersona)

      return {
        ...current,
        preferences: {
          ...current.preferences,
          themeId: persona.recommendedThemeId,
          themeMode: 'persona-recommended'
        }
      }
    })
  }, [setWorkspaceState])

  return {
    activeTheme,
    themeFamilies,
    filteredThemes,
    openThemePicker,
    closeThemePicker,
    switchTheme,
    restorePersonaTheme
  }
}
