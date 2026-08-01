/**
 * 平台适配器 - 存储模块
 * 小程序用 Taro.setStorageSync，App/H5 用 localStorage
 */
import Taro from '@tarojs/taro'
import { isWeapp } from './detector'

function encodeForStorage(data: string): string {
  return btoa(unescape(encodeURIComponent(data)))
}

function decodeFromStorage(encoded: string): string {
  return decodeURIComponent(escape(atob(encoded)))
}

function getStorageRaw(key: string): string | null {
  if (isWeapp()) {
    try {
      return Taro.getStorageSync(key) || null
    } catch {
      return null
    }
  }
  return localStorage.getItem(key)
}

function setStorageRaw(key: string, value: string): void {
  if (isWeapp()) {
    try {
      Taro.setStorageSync(key, value)
    } catch { /* ignore */ }
    return
  }
  localStorage.setItem(key, value)
}

function removeStorageRaw(key: string): void {
  if (isWeapp()) {
    try {
      Taro.removeStorageSync(key)
    } catch { /* ignore */ }
    return
  }
  localStorage.removeItem(key)
}

export const storage = {
  getToken(): string | null {
    try {
      const raw = getStorageRaw('xhh_token')
      if (!raw) return null
      return decodeFromStorage(raw)
    } catch {
      return null
    }
  },

  setToken(token: string): void {
    setStorageRaw('xhh_token', encodeForStorage(token))
  },

  removeToken(): void {
    removeStorageRaw('xhh_token')
  },

  getUser(): any {
    try {
      const raw = getStorageRaw('xhh_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  setUser(user: any): void {
    setStorageRaw('xhh_user', JSON.stringify(user))
  },

  removeUser(): void {
    removeStorageRaw('xhh_user')
  },

  getRefreshToken(): string | null {
    try {
      const raw = getStorageRaw('xhh_refresh_token')
      if (!raw) return null
      return decodeFromStorage(raw)
    } catch {
      return null
    }
  },

  setRefreshToken(token: string): void {
    setStorageRaw('xhh_refresh_token', encodeForStorage(token))
  },

  removeRefreshToken(): void {
    removeStorageRaw('xhh_refresh_token')
  },

  clear(): void {
    this.removeToken()
    this.removeUser()
    this.removeRefreshToken()
  },
}
