/**
 * 平台检测模块
 * 判断当前运行环境：微信小程序 / H5浏览器 / Android App / 鸿蒙 App
 */
import Taro from '@tarojs/taro'

export type PlatformType = 'weapp' | 'h5' | 'android' | 'harmony'

let _platform: PlatformType | null = null

export function getPlatform(): PlatformType {
  if (_platform) return _platform

  try {
    const env = Taro.getEnv?.()
    if (env === 'WEAPP') {
      _platform = 'weapp'
      return _platform
    }
  } catch {
    // ignore
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const hasCapacitor = typeof (window as any)?.Capacitor !== 'undefined'

  if (/ArkWeb|HarmonyOS|OpenHarmony/i.test(ua)) {
    _platform = 'harmony'
  } else if (/Android/i.test(ua) || hasCapacitor) {
    _platform = 'android'
  } else {
    _platform = 'h5'
  }

  return _platform
}

export function isWeapp(): boolean {
  return getPlatform() === 'weapp'
}

export function isH5(): boolean {
  return getPlatform() === 'h5'
}

export function isAndroid(): boolean {
  return getPlatform() === 'android'
}

export function isHarmony(): boolean {
  return getPlatform() === 'harmony'
}

export function isApp(): boolean {
  const p = getPlatform()
  return p === 'android' || p === 'harmony'
}