import Taro from '@tarojs/taro'
import { CONFIG } from '../config'

export const storage = {
  getToken: (): string | null => {
    try {
      return Taro.getStorageSync(CONFIG.STORAGE_KEYS.TOKEN) || null
    } catch {
      return null
    }
  },
  setToken: (token: string) => {
    Taro.setStorageSync(CONFIG.STORAGE_KEYS.TOKEN, token)
  },
  removeToken: () => {
    Taro.removeStorageSync(CONFIG.STORAGE_KEYS.TOKEN)
  },
  getUser: () => {
    try {
      const raw = Taro.getStorageSync(CONFIG.STORAGE_KEYS.USER)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  setUser: (user: any) => {
    Taro.setStorageSync(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user))
  },
  removeUser: () => {
    Taro.removeStorageSync(CONFIG.STORAGE_KEYS.USER)
  },
  getRefreshToken: (): string | null => {
    try {
      return Taro.getStorageSync(CONFIG.STORAGE_KEYS.REFRESH_TOKEN) || null
    } catch {
      return null
    }
  },
  setRefreshToken: (token: string) => {
    Taro.setStorageSync(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, token)
  },
  removeRefreshToken: () => {
    Taro.removeStorageSync(CONFIG.STORAGE_KEYS.REFRESH_TOKEN)
  },
  clear: () => {
    storage.removeToken()
    storage.removeUser()
    storage.removeRefreshToken()
  },
}

let _currentUserId = ''

export function setStorageUserId(userId: string) {
  _currentUserId = userId
}

function _getKey(key: string): string {
  return _currentUserId ? `${_currentUserId}_${key}` : key
}

export function getStorage<T = any>(key: string): T | null {
  try {
    const raw = Taro.getStorageSync(_getKey(key))
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function getStorageArray<T = any>(key: string): T[] {
  const data = getStorage<T[]>(key)
  return Array.isArray(data) ? data : []
}

export function setStorage(key: string, value: any) {
  Taro.setStorageSync(_getKey(key), JSON.stringify(value))
}

export function removeStorage(key: string) {
  Taro.removeStorageSync(_getKey(key))
}

export function clearAllStorage() {
  storage.clear()
  const info = Taro.getStorageInfoSync()
  info.keys.forEach((key: string) => {
    if (key.startsWith(_currentUserId + '_')) {
      Taro.removeStorageSync(key)
    }
  })
}

