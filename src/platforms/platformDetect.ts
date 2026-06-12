import type { Platform, PlatformInfo, DeviceCategory } from './types'

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'web'

  const ua = navigator.userAgent || ''

  if (ua.includes('OpenHarmony') || ua.includes('HarmonyOS')) {
    return 'harmonyos'
  }

  if (ua.includes('Android')) {
    return 'android'
  }

  if (ua.includes('Windows') || ua.includes('Win32') || ua.includes('Win64')) {
    return 'windows'
  }

  return 'web'
}

function detectDeviceCategory(platform: Platform): DeviceCategory {
  if (platform === 'windows') return 'desktop'
  return 'mobile'
}

function detectIsElectron(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  return ua.includes('Electron')
}

function detectIsCapacitor(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Capacitor?.isNative?.()
}

function detectIsTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

let cachedInfo: PlatformInfo | null = null

export function getPlatformInfo(): PlatformInfo {
  if (cachedInfo) return cachedInfo

  const platform = detectPlatform()
  cachedInfo = {
    platform,
    deviceCategory: detectDeviceCategory(platform),
    isElectron: detectIsElectron(),
    isCapacitor: detectIsCapacitor(),
    isTouchDevice: detectIsTouchDevice()
  }

  return cachedInfo
}

export function resetPlatformCache(): void {
  cachedInfo = null
}
