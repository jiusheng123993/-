/**
 * 认证状态管理
 * 管理微信登录、用户信息、Token 持久化和登录状态初始化
 */
import Taro from '@tarojs/taro'
import create from 'zustand'
import { api } from '../services/api'
import { storage } from '../utils/storage'
import type { User } from '../types'

/** 认证状态定义 */
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  login: () => Promise<void>
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
   * 优先使用缓存用户信息，缓存缺失时从服务端获取
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
   * 执行微信登录流程
   * 获取微信 code → 服务端登录换取 token → 持久化存储
   */
  login: async () => {
    set({ isLoading: true })
    try {
      const { code } = await Taro.login()
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

  /** 退出登录，清除本地存储和状态 */
  logout: async () => {
    storage.clear()
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
