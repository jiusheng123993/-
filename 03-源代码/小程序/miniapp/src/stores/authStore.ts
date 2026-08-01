/**
 * 认证状态管理
 * 小程序：微信登录 → Taro.login() 获取 code → 后端换取 token
 * App/H5：手机号+验证码登录 → 后端换取 token
 */
import Taro from '@tarojs/taro'
import create from 'zustand'
import { api } from '../services/api'
import { storage } from '../utils/storage'
import { wsClient } from '../services/wsClient'
import { getLoginCode, loginWithPhone, API_BASE_URL } from '../platform'
import {
  setStorageUserId,
  getStorage,
  setStorage,
  removeStorage,
  clearAllStorage,
} from '../utils/storage'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  login: () => Promise<void>
  loginByPhone: (phone: string, code: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  /**
   * 初始化认证状态，从本地存储恢复登录态
   */
  initialize: async () => {
    if (get().isInitialized) return
    set({ isLoading: true })
    try {
      const token = storage.getToken()
      if (token) {
        const user = storage.getUser()
        if (user) {
          set({ user, token, isAuthenticated: true, isInitialized: true, isLoading: false })
          return
        }
        const freshUser = await api.getUser()
        storage.setUser(freshUser)
        set({ user: freshUser, token, isAuthenticated: true, isInitialized: true, isLoading: false })
        return
      }
    } catch {
      storage.clear()
    }
    set({ isInitialized: true, isLoading: false })
  },

  /**
   * 微信登录（仅小程序）
   */
  login: async () => {
    set({ isLoading: true })
    try {
      const code = await getLoginCode()
      if (!code) {
        throw new Error('获取微信登录凭证失败')
      }
      const res = await api.login(code)
      storage.setToken(res.token)
      storage.setRefreshToken(res.refreshToken)
      storage.setUser(res.user)
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  /**
   * 手机号验证码登录（App/H5）
   */
  loginByPhone: async (phone: string, code: string) => {
    set({ isLoading: true })
    try {
      const result = await loginWithPhone(phone, code, API_BASE_URL)
      if (!result.success || !result.token) {
        throw new Error(result.error || '登录失败')
      }
      storage.setToken(result.token)
      storage.setRefreshToken(result.refreshToken || '')
      storage.setUser(result.user)
      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  logout: async () => {
    wsClient.disconnect()
    storage.clear()
    set({ user: null, token: null, isAuthenticated: false })
  },
}))