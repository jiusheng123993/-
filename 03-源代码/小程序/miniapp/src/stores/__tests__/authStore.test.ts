import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockSupabaseAuth, mockVerifyToken, mockIsTokenFormatValid, mockTaro, mockRequestAccountDeletion, mockCancelDeletion, mockGetDataPrivacyStatus } = vi.hoisted(() => {
  return {
    mockSupabaseAuth: {
      loginWithCode: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    },
    mockVerifyToken: vi.fn(),
    mockIsTokenFormatValid: vi.fn(),
    mockTaro: {
      getStorageSync: vi.fn(),
      setStorageSync: vi.fn(),
      removeStorageSync: vi.fn(),
      clearStorageSync: vi.fn(),
    },
    mockRequestAccountDeletion: vi.fn(),
    mockCancelDeletion: vi.fn(),
    mockGetDataPrivacyStatus: vi.fn(),
  }
})

vi.mock('../../config/supabase', () => ({
  supabaseAuth: mockSupabaseAuth,
  STORAGE_KEYS: {
    TOKEN: 'xhh_token',
    USER: 'xhh_user',
    REFRESH_TOKEN: 'xhh_refresh_token',
  },
  ENV: {
    development: { apiBaseUrl: 'http://localhost:3000', useMock: true },
    production: { apiBaseUrl: 'https://api.example.com', useMock: false },
  },
}))

vi.mock('../../utils/jwt', () => ({
  verifyToken: mockVerifyToken,
  isTokenFormatValid: mockIsTokenFormatValid,
}))

vi.mock('@tarojs/taro', () => ({
  default: mockTaro,
}))

vi.mock('../../services/dataPrivacyService', () => ({
  requestAccountDeletion: mockRequestAccountDeletion,
  cancelAccountDeletion: mockCancelDeletion,
  getDataPrivacyStatus: mockGetDataPrivacyStatus,
}))

import { useAuthStore } from '../authStore'
import type { UserProfile } from '../authStore'

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user_001',
    openid: 'openid_001',
    nickname: '测试用户',
    avatarUrl: 'https://example.com/avatar.png',
    ...overrides,
  }
}

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTaro.getStorageSync.mockReturnValue('')
    useAuthStore.setState({
      token: null,
      refreshTokenValue: null,
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      accountDeletionStatus: null,
    })
  })

  describe('initial state', () => {
    it('should have null token', () => {
      expect(useAuthStore.getState().token).toBeNull()
    })

    it('should have null refreshTokenValue', () => {
      expect(useAuthStore.getState().refreshTokenValue).toBeNull()
    })

    it('should have null user', () => {
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('should have isAuthenticated as false', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('should have loading as false', () => {
      expect(useAuthStore.getState().loading).toBe(false)
    })

    it('should have null error', () => {
      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe('initialize', () => {
    it('should restore state from storage when token is valid', async () => {
      const user = makeUser()
      mockTaro.getStorageSync.mockImplementation((key: string) => {
        if (key === 'xhh_token') return 'valid_token'
        if (key === 'xhh_refresh_token') return 'refresh_token_123'
        if (key === 'xhh_user') return JSON.stringify(user)
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(true)

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.token).toBe('valid_token')
      expect(state.refreshTokenValue).toBe('refresh_token_123')
      expect(state.user).toEqual(user)
      expect(state.isAuthenticated).toBe(true)
    })

    it('should try refresh when token is invalid and refreshToken exists', async () => {
      const user = makeUser()
      mockTaro.getStorageSync.mockImplementation((key: string) => {
        if (key === 'xhh_token') return 'expired_token'
        if (key === 'xhh_refresh_token') return 'refresh_token_123'
        if (key === 'xhh_user') return JSON.stringify(user)
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(false)
      mockSupabaseAuth.refreshToken.mockResolvedValue({
        success: true,
        token: 'new_token',
      })
      useAuthStore.setState({ refreshTokenValue: 'refresh_token_123' })

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.token).toBe('new_token')
      expect(state.user).toEqual(user)
      expect(state.isAuthenticated).toBe(true)
      expect(mockSupabaseAuth.refreshToken).toHaveBeenCalledWith('refresh_token_123')
    })

    it('should clear state when token is invalid and refresh fails', async () => {
      const user = makeUser()
      mockTaro.getStorageSync.mockImplementation((key: string) => {
        if (key === 'xhh_token') return 'expired_token'
        if (key === 'xhh_refresh_token') return 'refresh_token_123'
        if (key === 'xhh_user') return JSON.stringify(user)
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(false)
      mockSupabaseAuth.refreshToken.mockResolvedValue({
        success: false,
        error: '刷新失败',
      })

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.refreshTokenValue).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(mockTaro.removeStorageSync).toHaveBeenCalled()
    })

    it('should clear state when token is invalid and no refreshToken', async () => {
      const user = makeUser()
      mockTaro.getStorageSync.mockImplementation((key: string) => {
        if (key === 'xhh_token') return 'expired_token'
        if (key === 'xhh_refresh_token') return ''
        if (key === 'xhh_user') return JSON.stringify(user)
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(false)

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.refreshTokenValue).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should do nothing when storage has no token and user', async () => {
      mockTaro.getStorageSync.mockReturnValue('')

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should handle corrupted user JSON in storage', async () => {
      mockTaro.getStorageSync.mockImplementation((key: string) => {
        if (key === 'xhh_token') return 'valid_token'
        if (key === 'xhh_refresh_token') return 'refresh_token_123'
        if (key === 'xhh_user') return 'invalid-json'
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(true)

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const user = makeUser()
      mockSupabaseAuth.loginWithCode.mockResolvedValue({
        success: true,
        token: 'login_token',
        refreshToken: 'login_refresh_token',
        user,
      })

      const result = await useAuthStore.getState().login('wx_code_123')

      expect(result.success).toBe(true)
      expect(result.user).toEqual(user)
      const state = useAuthStore.getState()
      expect(state.token).toBe('login_token')
      expect(state.refreshTokenValue).toBe('login_refresh_token')
      expect(state.user).toEqual(user)
      expect(state.isAuthenticated).toBe(true)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should save to storage on successful login', async () => {
      const user = makeUser()
      mockSupabaseAuth.loginWithCode.mockResolvedValue({
        success: true,
        token: 'login_token',
        refreshToken: 'login_refresh_token',
        user,
      })

      await useAuthStore.getState().login('wx_code_123')

      expect(mockTaro.setStorageSync).toHaveBeenCalledWith('xhh_token', 'login_token')
      expect(mockTaro.setStorageSync).toHaveBeenCalledWith('xhh_refresh_token', 'login_refresh_token')
      expect(mockTaro.setStorageSync).toHaveBeenCalledWith('xhh_user', JSON.stringify(user))
    })

    it('should handle login failure with error message', async () => {
      mockSupabaseAuth.loginWithCode.mockResolvedValue({
        success: false,
        error: '用户未注册',
      })

      const result = await useAuthStore.getState().login('bad_code')

      expect(result.success).toBe(false)
      expect(result.error).toBe('用户未注册')
      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.loading).toBe(false)
      expect(state.error).toBe('用户未注册')
    })

    it('should handle login failure without error message', async () => {
      mockSupabaseAuth.loginWithCode.mockResolvedValue({
        success: false,
      })

      const result = await useAuthStore.getState().login('bad_code')

      expect(result.success).toBe(false)
      const state = useAuthStore.getState()
      expect(state.error).toBe('登录失败')
    })

    it('should handle login exception', async () => {
      mockSupabaseAuth.loginWithCode.mockRejectedValue(new Error('Network error'))

      const result = await useAuthStore.getState().login('wx_code_123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
      const state = useAuthStore.getState()
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Network error')
    })

    it('should handle login exception with non-Error thrown', async () => {
      mockSupabaseAuth.loginWithCode.mockRejectedValue('unknown error')

      const result = await useAuthStore.getState().login('wx_code_123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('登录失败')
    })

    it('should set loading to true during login', async () => {
      let resolveLogin: (value: any) => void
      const loginPromise = new Promise(resolve => { resolveLogin = resolve })
      mockSupabaseAuth.loginWithCode.mockReturnValue(loginPromise)

      const loginCall = useAuthStore.getState().login('wx_code_123')

      expect(useAuthStore.getState().loading).toBe(true)

      resolveLogin!({ success: false, error: 'fail' })
      await loginCall

      expect(useAuthStore.getState().loading).toBe(false)
    })

    it('should clear error before login attempt', async () => {
      useAuthStore.setState({ error: 'previous error' })
      mockSupabaseAuth.loginWithCode.mockResolvedValue({
        success: false,
        error: 'new error',
      })

      await useAuthStore.getState().login('wx_code_123')

      const state = useAuthStore.getState()
      expect(state.error).toBe('new error')
    })

    it('should handle login without refreshToken', async () => {
      const user = makeUser()
      mockSupabaseAuth.loginWithCode.mockResolvedValue({
        success: true,
        token: 'login_token',
        user,
      })

      const result = await useAuthStore.getState().login('wx_code_123')

      expect(result.success).toBe(true)
      const state = useAuthStore.getState()
      expect(state.refreshTokenValue).toBeNull()
    })
  })

  describe('logout', () => {
    it('should clear all state on logout', async () => {
      useAuthStore.setState({
        token: 'some_token',
        refreshTokenValue: 'some_refresh',
        user: makeUser(),
        isAuthenticated: true,
      })
      mockSupabaseAuth.logout.mockResolvedValue(undefined)

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.refreshTokenValue).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.loading).toBe(false)
    })

    it('should clear storage on logout', async () => {
      mockSupabaseAuth.logout.mockResolvedValue(undefined)

      await useAuthStore.getState().logout()

      expect(mockTaro.removeStorageSync).toHaveBeenCalledWith('xhh_token')
      expect(mockTaro.removeStorageSync).toHaveBeenCalledWith('xhh_refresh_token')
      expect(mockTaro.removeStorageSync).toHaveBeenCalledWith('xhh_user')
    })

    it('should clear state even when logout throws', async () => {
      useAuthStore.setState({
        token: 'some_token',
        refreshTokenValue: 'some_refresh',
        user: makeUser(),
        isAuthenticated: true,
      })
      mockSupabaseAuth.logout.mockRejectedValue(new Error('Logout failed'))

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.refreshTokenValue).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.loading).toBe(false)
    })

    it('should set loading during logout', async () => {
      let resolveLogout: (value: any) => void
      const logoutPromise = new Promise(resolve => { resolveLogout = resolve })
      mockSupabaseAuth.logout.mockReturnValue(logoutPromise)

      const logoutCall = useAuthStore.getState().logout()

      expect(useAuthStore.getState().loading).toBe(true)

      resolveLogout!(undefined)
      await logoutCall

      expect(useAuthStore.getState().loading).toBe(false)
    })
  })

  describe('refreshAuthToken', () => {
    it('should refresh token successfully', async () => {
      useAuthStore.setState({
        token: 'old_token',
        refreshTokenValue: 'refresh_token_123',
        user: makeUser(),
      })
      mockSupabaseAuth.refreshToken.mockResolvedValue({
        success: true,
        token: 'new_token',
      })

      const result = await useAuthStore.getState().refreshAuthToken()

      expect(result.success).toBe(true)
      expect(result.token).toBe('new_token')
      expect(useAuthStore.getState().token).toBe('new_token')
    })

    it('should save new token to storage on refresh', async () => {
      const user = makeUser()
      useAuthStore.setState({
        token: 'old_token',
        refreshTokenValue: 'refresh_token_123',
        user,
      })
      mockSupabaseAuth.refreshToken.mockResolvedValue({
        success: true,
        token: 'new_token',
      })

      await useAuthStore.getState().refreshAuthToken()

      expect(mockTaro.setStorageSync).toHaveBeenCalledWith('xhh_token', 'new_token')
      expect(mockTaro.setStorageSync).toHaveBeenCalledWith('xhh_refresh_token', 'refresh_token_123')
      expect(mockTaro.setStorageSync).toHaveBeenCalledWith('xhh_user', JSON.stringify(user))
    })

    it('should return error when no refreshTokenValue', async () => {
      useAuthStore.setState({ refreshTokenValue: null })

      const result = await useAuthStore.getState().refreshAuthToken()

      expect(result.success).toBe(false)
      expect(result.error).toBe('缺少 refresh token')
    })

    it('should return error when refresh fails', async () => {
      useAuthStore.setState({ refreshTokenValue: 'refresh_token_123' })
      mockSupabaseAuth.refreshToken.mockResolvedValue({
        success: false,
        error: '刷新失败',
      })

      const result = await useAuthStore.getState().refreshAuthToken()

      expect(result.success).toBe(false)
      expect(result.error).toBe('刷新失败')
    })

    it('should handle refresh exception with Error', async () => {
      useAuthStore.setState({ refreshTokenValue: 'refresh_token_123' })
      mockSupabaseAuth.refreshToken.mockRejectedValue(new Error('Network error'))

      const result = await useAuthStore.getState().refreshAuthToken()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should handle refresh exception with non-Error', async () => {
      useAuthStore.setState({ refreshTokenValue: 'refresh_token_123' })
      mockSupabaseAuth.refreshToken.mockRejectedValue('unknown')

      const result = await useAuthStore.getState().refreshAuthToken()

      expect(result.success).toBe(false)
      expect(result.error).toBe('刷新 token 失败')
    })
  })

  describe('updateUser', () => {
    it('should update user fields', () => {
      useAuthStore.setState({ user: makeUser() })

      useAuthStore.getState().updateUser({ nickname: '新昵称' })

      const state = useAuthStore.getState()
      expect(state.user!.nickname).toBe('新昵称')
      expect(state.user!.id).toBe('user_001')
    })

    it('should update multiple user fields', () => {
      useAuthStore.setState({ user: makeUser() })

      useAuthStore.getState().updateUser({ nickname: '新昵称', avatarUrl: 'https://new.avatar.png' })

      const state = useAuthStore.getState()
      expect(state.user!.nickname).toBe('新昵称')
      expect(state.user!.avatarUrl).toBe('https://new.avatar.png')
    })

    it('should save updated user to storage', () => {
      useAuthStore.setState({ user: makeUser() })

      useAuthStore.getState().updateUser({ nickname: '新昵称' })

      const expectedUser = { ...makeUser(), nickname: '新昵称' }
      expect(mockTaro.setStorageSync).toHaveBeenCalledWith('xhh_user', JSON.stringify(expectedUser))
    })

    it('should do nothing when user is null', () => {
      useAuthStore.setState({ user: null })

      useAuthStore.getState().updateUser({ nickname: '新昵称' })

      expect(useAuthStore.getState().user).toBeNull()
      expect(mockTaro.setStorageSync).not.toHaveBeenCalledWith('xhh_user', expect.anything())
    })
  })

  describe('clearError', () => {
    it('should clear error', () => {
      useAuthStore.setState({ error: 'some error' })

      useAuthStore.getState().clearError()

      expect(useAuthStore.getState().error).toBeNull()
    })

    it('should do nothing when error is already null', () => {
      useAuthStore.setState({ error: null })

      useAuthStore.getState().clearError()

      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe('deleteAccount', () => {
    it('should return error when not logged in', async () => {
      useAuthStore.setState({ user: null })

      const result = await useAuthStore.getState().deleteAccount('no_longer_needed', '', 'CODE1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('未登录')
    })

    it('should call requestAccountDeletion and update status on success', async () => {
      const user = makeUser()
      useAuthStore.setState({ user })
      const mockStatus = {
        lastExportAt: null,
        lastDeleteAt: null,
        accountDeletionRequested: true,
        accountDeletionScheduledAt: '2026-08-20T00:00:00.000Z',
        totalDataSize: 0,
        totalRecords: 0,
      }
      mockRequestAccountDeletion.mockResolvedValue({
        success: true,
        scheduledDeletionAt: '2026-08-20T00:00:00.000Z',
        gracePeriodDays: 30,
      })
      mockGetDataPrivacyStatus.mockReturnValue(mockStatus)

      const result = await useAuthStore.getState().deleteAccount('privacy_concern', 'test reason', 'ABC123')

      expect(result.success).toBe(true)
      expect(mockRequestAccountDeletion).toHaveBeenCalledWith('user_001', {
        reason: 'privacy_concern',
        customReason: 'test reason',
        confirmCode: 'ABC123',
      })
      expect(useAuthStore.getState().accountDeletionStatus).toEqual(mockStatus)
    })

    it('should not update status when deletion fails', async () => {
      const user = makeUser()
      useAuthStore.setState({ user, accountDeletionStatus: null })
      mockRequestAccountDeletion.mockResolvedValue({
        success: false,
        error: '确认码不正确',
        gracePeriodDays: 30,
      })

      const result = await useAuthStore.getState().deleteAccount('no_longer_needed', '', 'WRONG')

      expect(result.success).toBe(false)
      expect(useAuthStore.getState().accountDeletionStatus).toBeNull()
    })
  })

  describe('cancelAccountDeletion', () => {
    it('should return false when not logged in', async () => {
      useAuthStore.setState({ user: null })

      const result = await useAuthStore.getState().cancelAccountDeletion()

      expect(result).toBe(false)
    })

    it('should cancel deletion and update status on success', async () => {
      const user = makeUser()
      useAuthStore.setState({ user })
      const mockStatus = {
        lastExportAt: null,
        lastDeleteAt: null,
        accountDeletionRequested: false,
        accountDeletionScheduledAt: null,
        totalDataSize: 0,
        totalRecords: 0,
      }
      mockCancelDeletion.mockResolvedValue(true)
      mockGetDataPrivacyStatus.mockReturnValue(mockStatus)

      const result = await useAuthStore.getState().cancelAccountDeletion()

      expect(result).toBe(true)
      expect(mockCancelDeletion).toHaveBeenCalledWith('user_001')
      expect(useAuthStore.getState().accountDeletionStatus).toEqual(mockStatus)
    })

    it('should not update status when cancel fails', async () => {
      const user = makeUser()
      useAuthStore.setState({ user, accountDeletionStatus: null })
      mockCancelDeletion.mockResolvedValue(false)

      const result = await useAuthStore.getState().cancelAccountDeletion()

      expect(result).toBe(false)
      expect(useAuthStore.getState().accountDeletionStatus).toBeNull()
    })
  })
})
