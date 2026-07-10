import { describe, expect, it, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme, applyThemeToDOM } from './useTheme'
import { createDefaultWallpaperConfig } from '../wallpaper/wallpaperConfig'

describe('useTheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-aesthetic')
    document.documentElement.removeAttribute('data-material')
    const root = document.documentElement
    root.style.cssText = ''
  })

  it('applies theme to DOM on mount', () => {
    const { result } = renderHook(() => useTheme({ initialThemeId: 'minimal-premium' }))
    
    expect(document.documentElement.dataset.theme).toBe('minimal-premium')
    expect(result.current.theme.id).toBe('minimal-premium')
  })

  it('switches theme correctly', () => {
    const { result } = renderHook(() => useTheme({ initialThemeId: 'minimal-premium' }))
    
    act(() => {
      result.current.switchTheme('dopamine-green')
    })
    
    expect(document.documentElement.dataset.theme).toBe('dopamine-green')
    expect(result.current.themeId).toBe('dopamine-green')
  })

  it('filters themes by search query', () => {
    const { result } = renderHook(() => useTheme({ initialThemeId: 'minimal-premium' }))
    
    act(() => {
      result.current.setSearchQuery('极简')
    })
    
    expect(result.current.filteredThemes.length).toBeGreaterThan(0)
  })

  it('filters themes by family', () => {
    const { result } = renderHook(() => useTheme({ initialThemeId: 'minimal-premium' }))
    
    act(() => {
      result.current.setActiveFamily('minimal')
    })
    
    expect(result.current.filteredThemes.every(t => t.aesthetic === 'minimal')).toBe(true)
  })

  it('clears search query when opening theme picker', () => {
    const { result } = renderHook(() => useTheme({ initialThemeId: 'minimal-premium' }))
    
    act(() => {
      result.current.setSearchQuery('test query')
      result.current.openThemePicker()
    })
    
    expect(result.current.searchQuery).toBe('')
  })

  it('calls onThemeChange callback when switching theme', () => {
    const onThemeChange = vi.fn()
    const { result } = renderHook(() => useTheme({ 
      initialThemeId: 'minimal-premium',
      onThemeChange 
    }))
    
    act(() => {
      result.current.switchTheme('dopamine-green')
    })
    
    expect(onThemeChange).toHaveBeenCalledWith('dopamine-green')
  })
})

describe('applyThemeToDOM', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-aesthetic')
    document.documentElement.removeAttribute('data-material')
    const root = document.documentElement
    root.style.cssText = ''
  })

  it('applies theme CSS variables to document', () => {
    applyThemeToDOM('minimal-premium')
    
    expect(document.documentElement.dataset.theme).toBe('minimal-premium')
    expect(document.documentElement.style.getPropertyValue('--primary')).toBeTruthy()
  })

  it('applies wallpaper CSS variables derived from theme by default', () => {
    applyThemeToDOM('minimal-premium')

    expect(document.documentElement.style.getPropertyValue('--wallpaper-blur')).toBeTruthy()
    expect(document.documentElement.style.getPropertyValue('--wallpaper-brightness')).toBeTruthy()
    expect(document.documentElement.style.getPropertyValue('--wallpaper-card-opacity')).toBeTruthy()
  })

  it('uses provided wallpaperConfig instead of deriving from theme', () => {
    const customConfig = createDefaultWallpaperConfig()
    customConfig.blurPx = 30
    customConfig.brightness = 0.5

    applyThemeToDOM('minimal-premium', customConfig)

    expect(document.documentElement.style.getPropertyValue('--wallpaper-blur')).toBe('30px')
    expect(document.documentElement.style.getPropertyValue('--wallpaper-brightness')).toBe('0.5')
  })
})
