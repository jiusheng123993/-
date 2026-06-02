import React from 'react'
import type { WallpaperConfig, WallpaperAdjustments } from './wallpaperTypes'

type WallpaperPreviewProps = {
  config?: WallpaperConfig
  adjustments: WallpaperAdjustments
}

export function WallpaperPreview({ config, adjustments }: WallpaperPreviewProps) {
  const backgroundStyle: React.CSSProperties = config
    ? {
        position: 'relative',
        width: '100%',
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        marginBottom: 12
      }
    : {
        width: '100%',
        height: 160,
        borderRadius: 12,
        border: '2px dashed var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--muted)',
        fontSize: 14,
        marginBottom: 12
      }

  if (!config) {
    return <div style={backgroundStyle}>暂无壁纸，使用主题默认背景</div>
  }

  const adj = adjustments
  const overlayOpacity = (() => {
    const match = adj.overlay.match(/rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/)
    return match ? parseFloat(match[1]) : 0.3
  })()

  const blurPx = (() => {
    const match = adj.blur.match(/([\d.]+)px/)
    return match ? parseFloat(match[1]) : 10
  })()

  return (
    <div style={backgroundStyle}>
      {config.localPath && (
        <img
          src={config.localPath}
          alt="壁纸预览"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `brightness(${adj.brightness}) saturate(${adj.saturation})`,
          }}
        />
      )}
      {config.presetId && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            filter: `brightness(${adj.brightness}) saturate(${adj.saturation})`,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: `blur(${blurPx}px)`,
          WebkitBackdropFilter: `blur(${blurPx}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(0, 0, 0, ${overlayOpacity})`,
        }}
      />
      {adj.vignette > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: `inset 0 0 ${Math.round(adj.vignette * 200)}px rgba(0,0,0,${adj.vignette * 0.5})`,
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: 16,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            background: `rgba(255, 255, 255, ${adj.cardOpacity})`,
            borderRadius: 8,
            padding: '8px 12px',
            color: 'var(--text)',
            fontSize: 13,
          }}
        >
          示例卡片内容
        </div>
        <div
          style={{
            background: `rgba(255, 255, 255, ${adj.cardOpacity})`,
            borderRadius: 8,
            padding: '8px 12px',
            color: 'var(--text)',
            fontSize: 12,
          }}
        >
          文字可读性预览
        </div>
      </div>
    </div>
  )
}
