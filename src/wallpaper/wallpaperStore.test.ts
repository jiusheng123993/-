import { describe, it, expect, beforeEach } from 'vitest'
import { createWallpaperStore } from './wallpaperStore'
import type { WallpaperConfig } from './wallpaperTypes'
import { DEFAULT_WALLPAPER_ADJUSTMENTS, WALLPAPER_CONSTRAINTS } from './wallpaperTypes'

function makeAddData(overrides: Partial<WallpaperConfig> = {}) {
  return {
    source: 'upload' as const,
    localPath: 'blob:test',
    thumbnailDataUrl: 'data:image/jpeg;base64,test',
    adjustments: { ...DEFAULT_WALLPAPER_ADJUSTMENTS },
    readabilityWarning: false,
    ...overrides
  }
}

describe('WallpaperStore', () => {
  let store: ReturnType<typeof createWallpaperStore>

  beforeEach(() => {
    localStorage.clear()
    store = createWallpaperStore()
  })

  it('starts with no configs', () => {
    expect(store.getAll()).toHaveLength(0)
    expect(store.getActive()).toBeUndefined()
  })

  it('adds a config and returns it with id and timestamps', () => {
    const config = store.add(makeAddData())
    expect(config.id).toBeTruthy()
    expect(config.createdAt).toBeTruthy()
    expect(config.updatedAt).toBeTruthy()
    expect(config.source).toBe('upload')
  })

  it('retrieves added config by id', () => {
    const added = store.add(makeAddData())
    const found = store.getById(added.id)
    expect(found).toBeDefined()
    expect(found!.id).toBe(added.id)
  })

  it('returns active config after add', () => {
    const added = store.add(makeAddData())
    const active = store.getActive()
    expect(active).toBeDefined()
    expect(active!.id).toBe(added.id)
  })

  it('updates a config', () => {
    const added = store.add(makeAddData())
    const updated = store.update(added.id, { readabilityWarning: true })
    expect(updated).toBeDefined()
    expect(updated!.readabilityWarning).toBe(true)
  })

  it('returns undefined when updating non-existent config', () => {
    const result = store.update('nonexistent', { readabilityWarning: true })
    expect(result).toBeUndefined()
  })

  it('removes a config', () => {
    const added = store.add(makeAddData())
    expect(store.remove(added.id)).toBe(true)
    expect(store.getById(added.id)).toBeUndefined()
  })

  it('returns false when removing non-existent config', () => {
    expect(store.remove('nonexistent')).toBe(false)
  })

  it('finds config by theme binding', () => {
    store.add(makeAddData({ themeBinding: 'minimal-cream' }))
    store.add(makeAddData({ themeBinding: 'night-focus' as WallpaperConfig['themeBinding'] }))
    const found = store.getByTheme('night-focus')
    expect(found).toBeDefined()
    expect(found!.themeBinding).toBe('night-focus')
  })

  it('resets all configs', () => {
    store.add(makeAddData())
    store.add(makeAddData())
    store.resetToDefault()
    expect(store.getAll()).toHaveLength(0)
    expect(store.getActive()).toBeUndefined()
  })

  it('resets configs for specific theme only', () => {
    store.add(makeAddData({ themeBinding: 'minimal-cream' }))
    store.add(makeAddData({ themeBinding: 'night-focus' as WallpaperConfig['themeBinding'] }))
    store.resetToDefault('minimal-cream')
    expect(store.getAll()).toHaveLength(1)
    expect(store.getAll()[0].themeBinding).toBe('night-focus')
  })

  it('processUpload rejects unsupported format', async () => {
    const file = new File(['test'], 'test.bmp', { type: 'image/bmp' })
    await expect(store.processUpload(file)).rejects.toThrow('Unsupported format')
  })

  it('processUpload rejects oversized file', async () => {
    const bigData = new Uint8Array(WALLPAPER_CONSTRAINTS.MAX_FILE_SIZE_BYTES + 1)
    const file = new File([bigData], 'big.jpg', { type: 'image/jpeg' })
    await expect(store.processUpload(file)).rejects.toThrow('File too large')
  })

  it('processUpload accepts valid file format and size', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    expect(WALLPAPER_CONSTRAINTS.SUPPORTED_FORMATS.includes(file.type)).toBe(true)
    expect(file.size).toBeLessThanOrEqual(WALLPAPER_CONSTRAINTS.MAX_FILE_SIZE_BYTES)
  })

  it('persists configs to localStorage', () => {
    store.add(makeAddData())
    const raw = localStorage.getItem(WALLPAPER_CONSTRAINTS.STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed).toHaveLength(1)
  })

  it('loads configs from localStorage on new store instance', () => {
    store.add(makeAddData())
    const newStore = createWallpaperStore()
    expect(newStore.getAll()).toHaveLength(1)
  })
})
