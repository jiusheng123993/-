import type { AvatarDefinition } from './avatarTypes'
import { getExportFormatConfig, AVATAR_CONSTRAINTS, type AvatarExportFormat } from './avatarConstraints'

export type AvatarExportOptions = {
  format: AvatarExportFormat
  width?: number
  height?: number
  quality?: number
  includeBackground?: boolean
  backgroundColor?: string
}

export type AvatarExportResult = {
  success: boolean
  data?: Blob | string
  filename?: string
  error?: string
}

export type IAvatarExporter = {
  exportToPng: (avatar: AvatarDefinition, options?: Partial<AvatarExportOptions>) => Promise<AvatarExportResult>
  exportToGif: (avatar: AvatarDefinition, options?: Partial<AvatarExportOptions>) => Promise<AvatarExportResult>
  exportToMp4: (avatar: AvatarDefinition, options?: Partial<AvatarExportOptions>) => Promise<AvatarExportResult>
  exportToGlb: (avatar: AvatarDefinition, options?: Partial<AvatarExportOptions>) => Promise<AvatarExportResult>
  export: (avatar: AvatarDefinition, options: AvatarExportOptions) => Promise<AvatarExportResult>
  download: (result: AvatarExportResult) => void
}

async function captureCanvasAsBlob(canvas: HTMLCanvasElement, format: 'image/png' | 'image/jpeg' | 'image/webp', quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, format, quality)
  })
}

async function captureCanvasAsDataUrl(canvas: HTMLCanvasElement, format: 'image/png' | 'image/jpeg' | 'image/webp', quality: number): Promise<string> {
  return canvas.toDataURL(format, quality)
}

function getCanvasFromAvatar(avatar: AvatarDefinition, width: number, height: number, backgroundColor: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (ctx) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    if (avatar.stickerUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      const scale = Math.min(width / 400, height / 400) * 0.8
      const drawWidth = 400 * scale
      const drawHeight = 400 * scale
      const x = (width - drawWidth) / 2
      const y = (height - drawHeight) / 2
      ctx.drawImage(img, x, y, drawWidth, drawHeight)
    } else {
      ctx.fillStyle = '#4a4a6a'
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = `${Math.min(width, height) * 0.08}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(avatar.name.slice(0, 2), width / 2, height / 2)
    }
  }

  return canvas
}

const exportToPng = async (avatar: AvatarDefinition, options: Partial<AvatarExportOptions> = {}): Promise<AvatarExportResult> => {
  const width = options.width || AVATAR_CONSTRAINTS.defaultRenderWidth
  const height = options.height || AVATAR_CONSTRAINTS.defaultRenderHeight
  const quality = options.quality || 1.0
  const backgroundColor = options.backgroundColor || '#1a1a2e'

  try {
    const canvas = getCanvasFromAvatar(avatar, width, height, backgroundColor)
    const data = await captureCanvasAsBlob(canvas, 'image/png', quality)

    if (data) {
      return {
        success: true,
        data,
        filename: `${avatar.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${Date.now()}.png`
      }
    }
    return { success: false, error: 'Failed to capture canvas' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

const exportToGif = async (avatar: AvatarDefinition, options: Partial<AvatarExportOptions> = {}): Promise<AvatarExportResult> => {
  const width = options.width || 256
  const height = options.height || 256
  const backgroundColor = options.backgroundColor || '#1a1a2e'

  try {
    const canvas = getCanvasFromAvatar(avatar, width, height, backgroundColor)
    const dataUrl = await captureCanvasAsDataUrl(canvas, 'image/png', 1.0)

    return {
      success: true,
      data: dataUrl,
      filename: `${avatar.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${Date.now()}.gif`
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

const exportToMp4 = async (avatar: AvatarDefinition, options: Partial<AvatarExportOptions> = {}): Promise<AvatarExportResult> => {
  const width = options.width || 512
  const height = options.height || 512
  const backgroundColor = options.backgroundColor || '#1a1a2e'

  try {
    const canvas = getCanvasFromAvatar(avatar, width, height, backgroundColor)
    const dataUrl = await captureCanvasAsDataUrl(canvas, 'image/png', 1.0)

    return {
      success: true,
      data: dataUrl,
      filename: `${avatar.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${Date.now()}.mp4`
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

const exportToGlb = async (avatar: AvatarDefinition, _options: Partial<AvatarExportOptions> = {}): Promise<AvatarExportResult> => {
  if (!avatar.modelUrl) {
    return { success: false, error: 'No 3D model available for this avatar' }
  }

  try {
    const response = await fetch(avatar.modelUrl)
    if (!response.ok) {
      return { success: false, error: 'Failed to fetch model' }
    }

    const blob = await response.blob()
    return {
      success: true,
      data: blob,
      filename: `${avatar.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${Date.now()}.glb`
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

const exportAvatar = async (avatar: AvatarDefinition, options: AvatarExportOptions): Promise<AvatarExportResult> => {
  const formatConfig = getExportFormatConfig(options.format)
  if (!formatConfig) {
    return { success: false, error: 'Invalid export format' }
  }

  switch (options.format) {
    case 'png':
      return exportToPng(avatar, options)
    case 'gif':
      return exportToGif(avatar, options)
    case 'mp4':
      return exportToMp4(avatar, options)
    case 'glb':
      return exportToGlb(avatar, options)
    default:
      return { success: false, error: 'Unsupported format' }
  }
}

const downloadExport = (result: AvatarExportResult): void => {
  if (!result.success || !result.data) {
    console.error('Export failed:', result.error)
    return
  }

  let url: string
  const filename = result.filename || 'avatar.png'

  if (result.data instanceof Blob) {
    url = URL.createObjectURL(result.data)
  } else if (typeof result.data === 'string') {
    url = result.data
  } else {
    console.error('Invalid export data')
    return
  }

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  if (result.data instanceof Blob) {
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

export function createAvatarExporter(): IAvatarExporter {
  return {
    exportToPng,
    exportToGif,
    exportToMp4,
    exportToGlb,
    export: exportAvatar,
    download: downloadExport
  }
}

export const avatarExporter = createAvatarExporter()
