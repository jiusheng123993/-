import { describe, expect, it } from 'vitest'
import {
  createBrowserWallpaperStore,
  createMemoryWallpaperStore
} from './wallpaperStore'
import { createDefaultWallpaperConfig } from './wallpaperConfig'

describe('wallpaperStore', () => {
  it('loads a default wallpaper config when no saved state exists', () => {
    const store = createMemoryWallpaperStore()
    const loaded = store.load()

    expect(loaded.source.kind).toBe('none')
    expect(loaded.privacyLevel).toBe('private')
    expect(loaded.storage).toBe('local-only')
  })

  it('saves and loads a wallpaper config with a data-url source', () => {
    const store = createMemoryWallpaperStore()
    const config = createDefaultWallpaperConfig()
    config.source = {
      kind: 'data-url',
      dataUrl: 'data:image/png;base64,AAABBBCCC',
      mimeType: 'image/png',
      byteSize: 9
    }
    config.overlayOpacity = 0.6
    config.blurPx = 14
    config.brightness = 0.9

    store.save(config)
    const loaded = store.load()

    expect(loaded.source.kind).toBe('data-url')
    if (loaded.source.kind === 'data-url') {
      expect(loaded.source.dataUrl).toBe('data:image/png;base64,AAABBBCCC')
      expect(loaded.source.mimeType).toBe('image/png')
    }
    expect(loaded.overlayOpacity).toBe(0.6)
    expect(loaded.blurPx).toBe(14)
    expect(loaded.brightness).toBe(0.9)
  })

  it('removes the wallpaper and resets to default', () => {
    const store = createMemoryWallpaperStore()
    const config = createDefaultWallpaperConfig()
    config.source = {
      kind: 'data-url',
      dataUrl: 'data:image/jpeg;base64,DDD',
      mimeType: 'image/jpeg',
      byteSize: 3
    }

    store.save(config)
    store.remove()
    const loaded = store.load()

    expect(loaded.source.kind).toBe('none')
  })

  it('preserves privacy flags across save and load', () => {
    const store = createMemoryWallpaperStore()
    const config = createDefaultWallpaperConfig()
    config.includeInSync = false
    config.includeInScreenshots = false
    config.privacyLevel = 'private'

    store.save(config)
    const loaded = store.load()

    expect(loaded.includeInSync).toBe(false)
    expect(loaded.includeInScreenshots).toBe(false)
    expect(loaded.privacyLevel).toBe('private')
  })

  it('browser store falls back to default when localStorage is empty', () => {
    const key = 'test-wallpaper-config-empty'
    const store = createBrowserWallpaperStore(key)
    const loaded = store.load()

    expect(loaded.source.kind).toBe('none')
    expect(loaded.privacyLevel).toBe('private')
  })

  it('browser store persists and reloads wallpaper config', () => {
    const key = 'test-wallpaper-config-persist'
    const store = createBrowserWallpaperStore(key)
    const config = createDefaultWallpaperConfig()
    config.source = {
      kind: 'data-url',
      dataUrl: 'data:image/webp;base64,EEE',
      mimeType: 'image/webp',
      byteSize: 3
    }
    config.saturation = 0.8

    store.save(config)

    const store2 = createBrowserWallpaperStore(key)
    const loaded = store2.load()

    expect(loaded.source.kind).toBe('data-url')
    if (loaded.source.kind === 'data-url') {
      expect(loaded.source.mimeType).toBe('image/webp')
    }
    expect(loaded.saturation).toBe(0.8)
  })

  it('browser store removes wallpaper and clears storage', () => {
    const key = 'test-wallpaper-config-remove'
    const store = createBrowserWallpaperStore(key)
    const config = createDefaultWallpaperConfig()
    config.source = {
      kind: 'data-url',
      dataUrl: 'data:image/png;base64,FFF',
      mimeType: 'image/png',
      byteSize: 3
    }

    store.save(config)
    store.remove()

    const store2 = createBrowserWallpaperStore(key)
    const loaded = store2.load()
    expect(loaded.source.kind).toBe('none')
  })

  it('browser store recovers from corrupted JSON without throwing', () => {
    const key = 'test-wallpaper-config-corrupted'
    window.localStorage.setItem(key, '{not-valid-json')
    const store = createBrowserWallpaperStore(key)
    const loaded = store.load()
    expect(loaded.source.kind).toBe('none')
    window.localStorage.removeItem(key)
  })

  it('browser store sanitizes out-of-range fields injected via DevTools', () => {
    const key = 'test-wallpaper-config-tampered'
    const tampered = {
      source: { kind: 'none' },
      overlayColor: 'rgba(0,0,0,0.4)',
      overlayOpacity: 99,
      blurPx: -50,
      brightness: 99,
      saturation: -3,
      vignetteStrength: 8,
      cardOpacity: -1,
      privacyLevel: 'private',
      storage: 'local-only',
      includeInSync: false,
      includeInScreenshots: false,
      themeIdAtCapture: 'minimal-premium'
    }
    window.localStorage.setItem(key, JSON.stringify(tampered))
    const store = createBrowserWallpaperStore(key)
    const loaded = store.load()

    expect(loaded.overlayOpacity).toBeLessThanOrEqual(1)
    expect(loaded.blurPx).toBeGreaterThanOrEqual(0)
    expect(loaded.brightness).toBeLessThanOrEqual(1.5)
    expect(loaded.saturation).toBeGreaterThanOrEqual(0)
    expect(loaded.vignetteStrength).toBeLessThanOrEqual(1)
    expect(loaded.cardOpacity).toBeGreaterThanOrEqual(0.3)

    window.localStorage.removeItem(key)
  })

  it('memory store load returns isolated clones to avoid hidden mutations', () => {
    const store = createMemoryWallpaperStore()
    const first = store.load()
    first.brightness = 0.4

    const second = store.load()
    expect(second.brightness).not.toBe(0.4)
  })
})
