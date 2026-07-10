import type { WallpaperConfig } from './wallpaperTypes'
import { DEFAULT_WALLPAPER_ADJUSTMENTS, WALLPAPER_CONSTRAINTS } from './wallpaperTypes'

function generateId(): string {
  return `wp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function loadConfigs(): WallpaperConfig[] {
  try {
    const raw = localStorage.getItem(WALLPAPER_CONSTRAINTS.STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as WallpaperConfig[]
  } catch {
    return []
  }
}

function saveConfigs(configs: WallpaperConfig[]): void {
  localStorage.setItem(WALLPAPER_CONSTRAINTS.STORAGE_KEY, JSON.stringify(configs))
}

function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const max = WALLPAPER_CONSTRAINTS.MAX_THUMBNAIL_SIZE
        let w = img.width
        let h = img.height
        if (w > h) {
          if (w > max) { h = Math.round(h * max / w); w = max }
        } else {
          if (h > max) { w = Math.round(w * max / h); h = max }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas context unavailable')); return }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', WALLPAPER_CONSTRAINTS.THUMBNAIL_QUALITY))
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

export type WallpaperStore = {
  getAll: () => WallpaperConfig[]
  getById: (id: string) => WallpaperConfig | undefined
  getByTheme: (themeId: string) => WallpaperConfig | undefined
  getActive: () => WallpaperConfig | undefined
  add: (config: Omit<WallpaperConfig, 'id' | 'createdAt' | 'updatedAt'>) => WallpaperConfig
  update: (id: string, patch: Partial<Omit<WallpaperConfig, 'id' | 'createdAt'>>) => WallpaperConfig | undefined
  remove: (id: string) => boolean
  processUpload: (file: File, themeBinding?: string) => Promise<WallpaperConfig>
  resetToDefault: (themeId?: string) => void
}

export function createWallpaperStore(): WallpaperStore {
  let activeId: string | undefined

  return {
    getAll: () => loadConfigs(),

    getById: (id: string) => {
      return loadConfigs().find(c => c.id === id)
    },

    getByTheme: (themeId: string) => {
      return loadConfigs().find(c => c.themeBinding === themeId)
    },

    getActive: () => {
      const configs = loadConfigs()
      if (activeId) {
        const found = configs.find(c => c.id === activeId)
        if (found) return found
      }
      return configs.length > 0 ? configs[0] : undefined
    },

    add: (config) => {
      const configs = loadConfigs()
      const now = new Date().toISOString()
      const newConfig: WallpaperConfig = {
        ...config,
        id: generateId(),
        createdAt: now,
        updatedAt: now
      }
      configs.push(newConfig)
      saveConfigs(configs)
      activeId = newConfig.id
      return newConfig
    },

    update: (id, patch) => {
      const configs = loadConfigs()
      const idx = configs.findIndex(c => c.id === id)
      if (idx === -1) return undefined
      configs[idx] = {
        ...configs[idx],
        ...patch,
        updatedAt: new Date().toISOString()
      }
      saveConfigs(configs)
      return configs[idx]
    },

    remove: (id) => {
      const configs = loadConfigs()
      const filtered = configs.filter(c => c.id !== id)
      if (filtered.length === configs.length) return false
      saveConfigs(filtered)
      if (activeId === id) {
        activeId = filtered.length > 0 ? filtered[0].id : undefined
      }
      return true
    },

    processUpload: async (file, themeBinding) => {
      const fileType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
      if (!WALLPAPER_CONSTRAINTS.SUPPORTED_FORMATS.includes(fileType)) {
        throw new Error(`Unsupported format: ${file.type}`)
      }
      if (file.size > WALLPAPER_CONSTRAINTS.MAX_FILE_SIZE_BYTES) {
        throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds 10MB limit`)
      }
      const thumbnailDataUrl = await createThumbnail(file)
      const localPath = URL.createObjectURL(file)
      return {
        id: '',
        source: 'upload' as const,
        localPath,
        thumbnailDataUrl,
        themeBinding: themeBinding as WallpaperConfig['themeBinding'],
        adjustments: { ...DEFAULT_WALLPAPER_ADJUSTMENTS },
        readabilityWarning: false,
        createdAt: '',
        updatedAt: ''
      }
    },

    resetToDefault: (themeId) => {
      const configs = loadConfigs()
      if (themeId) {
        const filtered = configs.filter(c => c.themeBinding !== themeId)
        saveConfigs(filtered)
      } else {
        saveConfigs([])
        activeId = undefined
      }
    }
  }
}

export const wallpaperStore = createWallpaperStore()
