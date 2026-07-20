import type { WallpaperConfig, ReadabilityCheckResult, ReadabilityIssue } from './wallpaperTypes'

type ThemeTokens = {
  text: string
  background: string
  surface: string
}

function parseOverlayOpacity(overlay: string): number {
  const match = overlay.match(/rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/)
  if (match) return parseFloat(match[1])
  const hexMatch = overlay.match(/^#([0-9a-f]{8})$/i)
  if (hexMatch) {
    const alpha = parseInt(hexMatch[1].slice(6), 16)
    return alpha / 255
  }
  return 0.3
}

function parseBlurPx(blur: string): number {
  const match = blur.match(/([\d.]+)px/)
  return match ? parseFloat(match[1]) : 0
}

export function checkWallpaperReadability(
  config: WallpaperConfig,
  _themeTokens: ThemeTokens
): ReadabilityCheckResult {
  const issues: ReadabilityIssue[] = []
  let score = 100
  const adj = config.adjustments

  if (adj.brightness < 0.5) {
    issues.push({
      type: 'too_dark',
      severity: 'warning',
      suggestion: '壁纸过暗，建议提高亮度或增加遮罩'
    })
    score -= 20
  }

  if (adj.brightness > 1.5) {
    issues.push({
      type: 'too_bright',
      severity: 'warning',
      suggestion: '壁纸过亮，建议降低亮度或增加遮罩'
    })
    score -= 20
  }

  const blurPx = parseBlurPx(adj.blur)
  if (blurPx < 5 && config.source !== 'theme_default') {
    issues.push({
      type: 'too_busy',
      severity: 'info',
      suggestion: '壁纸细节较多，建议增加模糊以提高可读性'
    })
    score -= 10
  }

  const overlayOpacity = parseOverlayOpacity(adj.overlay)
  if (overlayOpacity < 0.2 && config.source !== 'theme_default') {
    issues.push({
      type: 'low_contrast',
      severity: 'warning',
      suggestion: '遮罩较淡，可能影响文字可读性'
    })
    score -= 15
  }

  if (adj.saturation > 1.5) {
    issues.push({
      type: 'too_bright',
      severity: 'info',
      suggestion: '饱和度较高，可能分散注意力'
    })
    score -= 5
  }

  if (adj.cardOpacity < 0.6) {
    issues.push({
      type: 'low_contrast',
      severity: 'info',
      suggestion: '卡片透明度较高，可能影响内容可读性'
    })
    score -= 10
  }

  return {
    score: Math.max(0, score),
    warning: score < 70,
    issues
  }
}

export { parseOverlayOpacity, parseBlurPx }
