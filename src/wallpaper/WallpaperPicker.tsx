import React, { useState, useCallback, useRef } from 'react'
import type { WallpaperConfig, WallpaperAdjustments, PresetWallpaper } from './wallpaperTypes'
import { DEFAULT_WALLPAPER_ADJUSTMENTS } from './wallpaperTypes'
import { wallpaperService } from './wallpaperService'
import { PRESET_WALLPAPERS } from './presetWallpapers'
import { WallpaperAdjuster } from './WallpaperAdjuster'
import { WallpaperPreview } from './WallpaperPreview'
import { ReadabilityWarning } from './ReadabilityWarning'
import { Upload, Image, X, Check } from 'lucide-react'
import type { ThemeId } from '../themes/themeRegistry'

type WallpaperPickerProps = {
  currentThemeId?: ThemeId
  onClose?: () => void
}

const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'nature', label: '自然' },
  { id: 'city', label: '城市' },
  { id: 'abstract', label: '抽象' },
  { id: 'minimal', label: '极简' },
  { id: 'anime', label: '二次元' },
  { id: 'seasonal', label: '季节' }
] as const

export function WallpaperPicker({ currentThemeId, onClose }: WallpaperPickerProps) {
  const [activeConfig, setActiveConfig] = useState<WallpaperConfig | undefined>(
    wallpaperService.getActiveWallpaper(currentThemeId)
  )
  const [category, setCategory] = useState<string>('all')
  const [adjustments, setAdjustments] = useState<WallpaperAdjustments>(
    activeConfig?.adjustments ?? { ...DEFAULT_WALLPAPER_ADJUSTMENTS }
  )
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const presets = category === 'all'
    ? PRESET_WALLPAPERS
    : PRESET_WALLPAPERS.filter(p => p.category === category)

  const handlePresetSelect = useCallback((preset: PresetWallpaper) => {
    const config = wallpaperService.applyPreset(preset.id, currentThemeId)
    if (config) {
      setActiveConfig(config)
      setAdjustments(config.adjustments)
      setUploadError(null)
    }
  }, [currentThemeId])

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadError(null)
    try {
      const config = await wallpaperService.uploadWallpaper(file, currentThemeId)
      setActiveConfig(config)
      setAdjustments(config.adjustments)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [currentThemeId])

  const handleAdjustmentChange = useCallback((newAdj: WallpaperAdjustments) => {
    setAdjustments(newAdj)
    if (activeConfig) {
      const updated = wallpaperService.updateAdjustments(activeConfig.id, newAdj)
      if (updated) setActiveConfig(updated)
    }
  }, [activeConfig])

  const handleRemove = useCallback(() => {
    if (activeConfig) {
      wallpaperService.removeWallpaper(activeConfig.id)
      setActiveConfig(undefined)
      setAdjustments({ ...DEFAULT_WALLPAPER_ADJUSTMENTS })
    }
  }, [activeConfig])

  const readability = activeConfig
    ? wallpaperService.checkReadability(activeConfig, currentThemeId)
    : null

  return (
    <div className="wallpaper-picker">
      <div className="wallpaper-picker-header">
        <h3>壁纸设置</h3>
        {onClose && (
          <button className="wallpaper-close-btn" onClick={onClose} type="button">
            <X size={18} />
          </button>
        )}
      </div>

      <WallpaperPreview config={activeConfig} adjustments={adjustments} />

      {readability && readability.warning && (
        <ReadabilityWarning result={readability} />
      )}

      <div className="wallpaper-source-section">
        <h4>壁纸来源</h4>
        <div className="wallpaper-upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <button
            className="wallpaper-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            type="button"
          >
            <Upload size={16} />
            <span>{isUploading ? '上传中...' : '上传本地图片'}</span>
          </button>
          {uploadError && <p className="wallpaper-error">{uploadError}</p>}
        </div>

        <div className="wallpaper-category-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`wallpaper-category-tab ${category === cat.id ? 'active' : ''}`}
              onClick={() => setCategory(cat.id)}
              type="button"
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="wallpaper-preset-grid">
          {presets.map(preset => (
            <button
              key={preset.id}
              className={`wallpaper-preset-item ${activeConfig?.presetId === preset.id ? 'selected' : ''}`}
              onClick={() => handlePresetSelect(preset)}
              type="button"
            >
              <div className="wallpaper-preset-thumb">
                <Image size={20} />
              </div>
              <span className="wallpaper-preset-name">{preset.name}</span>
              {activeConfig?.presetId === preset.id && (
                <span className="wallpaper-preset-check"><Check size={14} /></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeConfig && (
        <>
          <WallpaperAdjuster
            adjustments={adjustments}
            onChange={handleAdjustmentChange}
          />
          <button
            className="wallpaper-remove-btn"
            onClick={handleRemove}
            type="button"
          >
            <X size={14} />
            <span>移除壁纸，恢复默认</span>
          </button>
        </>
      )}
    </div>
  )
}
