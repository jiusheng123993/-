import create from 'zustand'
import { api } from '../services/api'
import { storage } from '../utils/storage'
import type { User } from '../types'

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

  login: async () => {
    set({ isLoading: true })
    try {
      const res = await api.login('mock_code')
      storage.setToken(res.token)
      storage.setRefreshToken(res.refreshToken)
      storage.setUser(res.user)
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  logout: async () => {
    storage.clear()
    set({ user: null, token: null, isAuthenticated: false })
  },
}))