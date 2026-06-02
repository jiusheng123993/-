import { useCallback } from 'react'
import type { WallpaperAdjustments } from './wallpaperTypes'

type WallpaperAdjusterProps = {
  adjustments: WallpaperAdjustments
  onChange: (adjustments: WallpaperAdjustments) => void
}

type SliderConfig = {
  key: keyof WallpaperAdjustments
  label: string
  min: number
  max: number
  step: number
  formatValue: (v: number) => string
}

const SLIDERS: SliderConfig[] = [
  {
    key: 'brightness',
    label: '亮度',
    min: 0.2,
    max: 2,
    step: 0.05,
    formatValue: v => `${Math.round(v * 100)}%`
  },
  {
    key: 'saturation',
    label: '饱和度',
    min: 0,
    max: 2,
    step: 0.05,
    formatValue: v => `${Math.round(v * 100)}%`
  },
  {
    key: 'vignette',
    label: '暗角',
    min: 0,
    max: 1,
    step: 0.05,
    formatValue: v => `${Math.round(v * 100)}%`
  },
  {
    key: 'cardOpacity',
    label: '卡片透明度',
    min: 0.3,
    max: 1,
    step: 0.05,
    formatValue: v => `${Math.round(v * 100)}%`
  }
]

export function WallpaperAdjuster({ adjustments, onChange }: WallpaperAdjusterProps) {
  const handleSliderChange = useCallback((key: keyof WallpaperAdjustments, value: number) => {
    onChange({ ...adjustments, [key]: value })
  }, [adjustments, onChange])

  const handleOverlayChange = useCallback((opacity: number) => {
    const match = adjustments.overlay.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    const r = match ? match[1] : '0'
    const g = match ? match[2] : '0'
    const b = match ? match[3] : '0'
    onChange({ ...adjustments, overlay: `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(2)})` })
  }, [adjustments, onChange])

  const handleBlurChange = useCallback((px: number) => {
    onChange({ ...adjustments, blur: `${px}px` })
  }, [adjustments, onChange])

  const overlayOpacity = (() => {
    const match = adjustments.overlay.match(/rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/)
    return match ? parseFloat(match[1]) : 0.3
  })()

  const blurPx = (() => {
    const match = adjustments.blur.match(/([\d.]+)px/)
    return match ? parseFloat(match[1]) : 10
  })()

  return (
    <div className="wallpaper-adjuster">
      <h4>效果调整</h4>

      <div className="wallpaper-slider-group">
        <label className="wallpaper-slider-label">
          <span>遮罩强度</span>
          <span className="wallpaper-slider-value">{Math.round(overlayOpacity * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={0.8}
          step={0.02}
          value={overlayOpacity}
          onChange={e => handleOverlayChange(parseFloat(e.target.value))}
          className="wallpaper-slider"
        />
      </div>

      <div className="wallpaper-slider-group">
        <label className="wallpaper-slider-label">
          <span>模糊程度</span>
          <span className="wallpaper-slider-value">{blurPx}px</span>
        </label>
        <input
          type="range"
          min={0}
          max={30}
          step={1}
          value={blurPx}
          onChange={e => handleBlurChange(parseInt(e.target.value))}
          className="wallpaper-slider"
        />
      </div>

      {SLIDERS.map(slider => {
        const value = adjustments[slider.key] as number
        return (
          <div key={slider.key} className="wallpaper-slider-group">
            <label className="wallpaper-slider-label">
              <span>{slider.label}</span>
              <span className="wallpaper-slider-value">{slider.formatValue(value)}</span>
            </label>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={value}
              onChange={e => handleSliderChange(slider.key, parseFloat(e.target.value))}
              className="wallpaper-slider"
            />
          </div>
        )
      })}
    </div>
  )
}
