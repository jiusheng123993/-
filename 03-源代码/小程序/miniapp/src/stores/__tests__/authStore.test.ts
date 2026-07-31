/**
 * 认证状态管理 - 单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockApi, mockStorage } = vi.hoisted(() => {
  return {
    mockApi: {
      login: vi.fn(),
      getUser: vi.fn(),
    },
    mockStorage: {
      getToken: vi.fn(),
      getUser: vi.fn(),
      setToken: vi.fn(),
      setRefreshToken: vi.fn(),
      setUser: vi.fn(),
      clear: vi.fn(),
    },
  }
})

vi.mock('../../services/api', () => ({
  api: mockApi,
}))

vi.mock('../../utils/storage', () => ({
  storage: mockStorage,
}))

import { useAuthStore } from '../authStore'
import type { User } from '../../types'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user_001',
    nickname: '测试用户',
    avatar: 'https://example.com/avatar.png',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
    })
  })

  describe('initial state', () => {
    it('should have null token', () => {
      expect(useAuthStore.getState().token).toBeNull()
    })

    it('should have null user', () => {
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('should have isAuthenticated as false', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('should have isLoading as false', () => {
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('should have isInitialized as false', () => {
      expect(useAuthStore.getState().isInitialized).toBe(false)
    })
  })

  describe('initialize', () => {
    it('should restore state from storage when token and user exist', async () => {
      const user = makeUser()
      mockStorage.getToken.mockReturnValue('valid_token')
      mockStorage.getUser.mockReturnValue(user)

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.token).toBe('valid_token')
      expect(state.user).toEqual(user)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isInitialized).toBe(true)
    })

    it('should fetch user from api when token exists but user is null', async () => {
      const user = makeUser()
      mockStorage.getToken.mockReturnValue('valid_token')
      mockStorage.getUser.mockReturnValue(null)
      mockApi.getUser.mockResolvedValue(user)

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.token).toBe('valid_token')
      expect(state.user).toEqual(user)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isInitialized).toBe(true)
      expect(mockStorage.setUser).toHaveBeenCalledWith(user)
    })

    it('should clear state when no token in storage', async () => {
      mockStorage.getToken.mockReturnValue(null)

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isInitialized).toBe(true)
    })

    it('should clear storage on error', async () => {
      mockStorage.getToken.mockReturnValue('valid_token')
      mockStorage.getUser.mockReturnValue(null)
      mockApi.getUser.mockRejectedValue(new Error('Network error'))

      await useAuthStore.getState().initialize()

      expect(mockStorage.clear).toHaveBeenCalled()
      const state = useAuthStore.getState()
      expect(state.isInitialized).toBe(true)
    })

    it('should skip if already initialized', async () => {
      useAuthStore.setState({ isInitialized: true })

      await useAuthStore.getState().initialize()

      expect(mockStorage.getToken).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const user = makeUser()
      mockApi.login.mockResolvedValue({
        token: 'login_token',
        refreshToken: 'login_refresh_token',
        user,
      })

      await useAuthStore.getState().login()

      const state = useAuthStore.getState()
      expect(state.token).toBe('login_token')
      expect(state.user).toEqual(user)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
      expect(mockStorage.setToken).toHaveBeenCalledWith('login_token')
      expect(mockStorage.setRefreshToken).toHaveBeenCalledWith('login_refresh_token')
      expect(mockStorage.setUser).toHaveBeenCalledWith(user)
    })

    it('should set loading during login', async () => {
      let resolveLogin: (value: any) => void
      const loginPromise = new Promise(resolve => { resolveLogin = resolve })
      mockApi.login.mockReturnValue(loginPromise)

      const loginCall = useAuthStore.getState().login()

      expect(useAuthStore.getState().isLoading).toBe(true)

      resolveLogin!({ token: 't', refreshToken: 'r', user: makeUser() })
      await loginCall

      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('should set isLoading to false on failure', async () => {
      mockApi.login.mockRejectedValue(new Error('Network error'))

      try {
        await useAuthStore.getState().login()
      } catch {
        // expected
      }

      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('should clear all state on logout', async () => {
      useAuthStore.setState({
        token: 'some_token',
        user: makeUser(),
        isAuthenticated: true,
      })

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should clear storage on logout', async () => {
      await useAuthStore.getState().logout()

      expect(mockStorage.clear).toHaveBeenCalled()
    })
  })
})
