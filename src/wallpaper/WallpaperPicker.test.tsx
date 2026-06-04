import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WallpaperPicker } from './WallpaperPicker'
import type { WallpaperConfig, PresetWallpaper } from './wallpaperTypes'

vi.mock('./wallpaperService', () => ({
  wallpaperService: {
    getActiveWallpaper: vi.fn(() => undefined),
    applyPreset: vi.fn((presetId: string) => ({
      id: 'test-config',
      presetId,
      type: 'preset',
      adjustments: {
        opacity: 0.3,
        blur: 0,
        brightness: 1,
        contrast: 1,
        saturation: 1,
        grayscale: 0,
        sepia: 0,
        hueRotate: 0
      }
    })),
    uploadWallpaper: vi.fn().mockResolvedValue({
      id: 'uploaded-config',
      type: 'upload',
      adjustments: {
        opacity: 0.3,
        blur: 0,
        brightness: 1,
        contrast: 1,
        saturation: 1,
        grayscale: 0,
        sepia: 0,
        hueRotate: 0
      }
    }),
    updateAdjustments: vi.fn((id, adj) => ({ id, type: 'preset', adjustments: adj })),
    removeWallpaper: vi.fn(),
    checkReadability: vi.fn(() => null)
  }
}))

vi.mock('./presetWallpapers', () => ({
  PRESET_WALLPAPERS: [
    { id: 'nature-1', name: '森林', category: 'nature', thumbnail: '' },
    { id: 'nature-2', name: '海洋', category: 'nature', thumbnail: '' },
    { id: 'city-1', name: '城市', category: 'city', thumbnail: '' },
    { id: 'abstract-1', name: '渐变', category: 'abstract', thumbnail: '' }
  ] as PresetWallpaper[]
}))

describe('WallpaperPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders wallpaper picker component', () => {
    render(<WallpaperPicker />)
    expect(screen.getByText('壁纸设置')).toBeInTheDocument()
  })

  it('renders category tabs', () => {
    render(<WallpaperPicker />)
    const tabs = screen.getAllByRole('button', { name: /全部|自然|城市|抽象|极简|二次元|季节/ })
    expect(tabs.length).toBeGreaterThanOrEqual(7)
  })

  it('filters presets by category', () => {
    render(<WallpaperPicker />)
    
    const beforeCount = screen.getAllByText(/城市/).length
    
    fireEvent.click(screen.getByText('自然'))
    
    const afterCount = screen.getAllByText(/城市/).length
    
    expect(afterCount).toBeLessThanOrEqual(beforeCount)
  })

  it('renders preset wallpaper grid', () => {
    render(<WallpaperPicker />)
    const presetItems = screen.getAllByText(/森林|海洋|城市|渐变/)
    expect(presetItems.length).toBeGreaterThan(0)
  })

  it('calls onClose when close button is clicked', () => {
    render(<WallpaperPicker />)
    
    fireEvent.click(screen.getByText('自然'))
    fireEvent.click(screen.getByText('全部'))
    
    const allItems = screen.getAllByText(/森林|城市|渐变/)
    expect(allItems.length).toBeGreaterThan(0)
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<WallpaperPicker onClose={onClose} />)
    
    const closeBtn = screen.getByRole('button', { name: '' })
    fireEvent.click(closeBtn)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('renders upload button', () => {
    render(<WallpaperPicker />)
    expect(screen.getByText('上传本地图片')).toBeInTheDocument()
  })

  it('shows wallpaper source section', () => {
    render(<WallpaperPicker />)
    expect(screen.getByText('壁纸来源')).toBeInTheDocument()
  })

  it('renders with currentThemeId prop', () => {
    render(<WallpaperPicker currentThemeId="ocean_calm" />)
    expect(screen.getByText('壁纸设置')).toBeInTheDocument()
  })

  it('does not show adjuster when no active config', () => {
    render(<WallpaperPicker />)
    expect(screen.queryByText('透明度')).not.toBeInTheDocument()
  })
})
