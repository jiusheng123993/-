export type Platform = 'windows' | 'android' | 'harmonyos' | 'web'

export type DeviceCategory = 'desktop' | 'mobile'

export interface PlatformInfo {
  platform: Platform
  deviceCategory: DeviceCategory
  isElectron: boolean
  isCapacitor: boolean
  isTouchDevice: boolean
}
