import Taro from '@tarojs/taro'
import { CONFIG } from '../config'

function obfuscate(data: string): string {
  const key = 'xhh-secure-storage-v2'
  const bytes: number[] = []
  for (let i = 0; i < data.length; i++) {
    bytes.push(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return String.fromCharCode(...bytes)
}

function encodeForStorage(data: string): string {
  try {
    return Taro.arrayBufferToBase64(new Uint8Array(
      [...obfuscate(data)].map(c => c.charCodeAt(0))
    ).buffer)
  } catch {
    return data
  }
}

function decodeFromStorage(encoded: string): string {
  try {
    const buffer = Taro.base64ToArrayBuffer(encoded)
    const bytes = new Uint8Array(buffer)
    const encodedStr = String.fromCharCode(...bytes)
    return obfuscate(encodedStr)
  } catch {
    return encoded
  }
}

export const storage = {
  getToken: (): string | null => {
    try {
      const raw = Taro.getStorageSync(CONFIG.STORAGE_KEYS.TOKEN)
      if (!raw) return null
      return decodeFromStorage(raw)
    } catch {
      return null
    }
  },
  setToken: (token: string) => {
    Taro.setStorageSync(CONFIG.STORAGE_KEYS.TOKEN, encodeForStorage(token))
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
      const raw = Taro.getStorageSync(CONFIG.STORAGE_KEYS.REFRESH_TOKEN)
      if (!raw) return null
      return decodeFromStorage(raw)
    } catch {
      return null
    }
  },
  setRefreshToken: (token: string) => {
    Taro.setStorageSync(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, encodeForStorage(token))
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

