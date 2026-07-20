import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockTaroLogin } = vi.hoisted(() => ({
  mockTaroLogin: vi.fn(),
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    login: mockTaroLogin,
  },
}))

const { mockLoginWithCode, mockGetUserProfile, mockRefreshToken, mockLogout } = vi.hoisted(() => ({
  mockLoginWithCode: vi.fn(),
  mockGetUserProfile: vi.fn(),
  mockRefreshToken: vi.fn(),
  mockLogout: vi.fn(),
}))

vi.mock('../../config/supabase', () => ({
  supabaseAuth: {
    loginWithCode: mockLoginWithCode,
    getUserProfile: mockGetUserProfile,
    refreshToken: mockRefreshToken,
    logout: mockLogout,
  },
}))

import { loginWithCode, getUserProfile, refreshToken, logout } from '../authService'

const mockUser = {
  id: 'user_123',
  openid: 'oTestOpenId',
  nickname: '测试用户',
  avatarUrl: 'https://example.com/avatar.png',
}

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loginWithCode', () => {
    it('should return success with token and user when Taro.login and supabaseAuth succeed', async () => {
      mockTaroLogin.mockResolvedValue({ code: 'wx_code_123' })
      mockLoginWithCode.mockResolvedValue({
        success: true,
        token: 'access_token_abc',
        user: mockUser,
      })

      const result = await loginWithCode()

      expect(result.success).toBe(true)
      expect(result.token).toBe('access_token_abc')
      expect(result.user).toEqual(mockUser)
      expect(mockTaroLogin).toHaveBeenCalledTimes(1)
      expect(mockLoginWithCode).toHaveBeenCalledWith('wx_code_123')
    })

    it('should return error when Taro.login returns no code', async () => {
      mockTaroLogin.mockResolvedValue({ code: '' })

      const result = await loginWithCode()

      expect(result.success).toBe(false)
      expect(result.error).toBe('未获取到微信登录凭证')
      expect(mockLoginWithCode).not.toHaveBeenCalled()
    })

    it('should return error when Taro.login returns undefined code', async () => {
      mockTaroLogin.mockResolvedValue({})

      const result = await loginWithCode()

      expect(result.success).toBe(false)
      expect(result.error).toBe('未获取到微信登录凭证')
    })

    it('should return error when supabaseAuth.loginWithCode fails', async () => {
      mockTaroLogin.mockResolvedValue({ code: 'wx_code_123' })
      mockLoginWithCode.mockResolvedValue({
        success: false,
        error: '用户未注册',
      })

      const result = await loginWithCode()

      expect(result.success).toBe(false)
      expect(result.error).toBe('用户未注册')
    })

    it('should return error when supabaseAuth returns no token', async () => {
      mockTaroLogin.mockResolvedValue({ code: 'wx_code_123' })
      mockLoginWithCode.mockResolvedValue({
        success: true,
        token: undefined,
        user: mockUser,
      })

      const result = await loginWithCode()

      expect(result.success).toBe(false)
      expect(result.error).toBe('登录失败')
    })

    it('should return error when supabaseAuth returns no user', async () => {
      mockTaroLogin.mockResolvedValue({ code: 'wx_code_123' })
      mockLoginWithCode.mockResolvedValue({
        success: true,
        token: 'access_token_abc',
        user: undefined,
      })

      const result = await loginWithCode()

      expect(result.success).toBe(false)
      expect(result.error).toBe('登录失败')
    })

    it('should return default error when supabaseAuth fails with no error message', async () => {
      mockTaroLogin.mockResolvedValue({ code: 'wx_code_123' })
      mockLoginWithCode.mockResolvedValue({
        success: false,
      })

      const result = await loginWithCode()

      expect(result.success).toBe(false)
      expect(result.error).toBe('登录失败')
    })

    it('should catch exception and return error with message', async () => {
      mockTaroLogin.mockRejectedValue(new Error('网络异常'))

      const result = await loginWithCode()

      expect(result.success).toBe(false)
      expect(result.error).toBe('网络异常')
    })

    it('should catch non-Error exception and return default error', async () => {
      mockTaroLogin.mockRejectedValue('unknown failure')

      const result = await loginWithCode()

      expect(result.success).toBe(false)
      expect(result.error).toBe('登录失败')
    })

    it('should catch exception from supabaseAuth.loginWithCode', async () => {
      mockTaroLogin.mockResolvedValue({ code: 'wx_code_123' })
      mockLoginWithCode.mockRejectedValue(new Error('服务器错误'))

      const result = await loginWithCode()

      expect(result.success).toBe(false)
      expect(result.error).toBe('服务器错误')
    })
  })

  describe('getUserProfile', () => {
    it('should return user profile on success', async () => {
      mockGetUserProfile.mockResolvedValue({
        success: true,
        user: mockUser,
      })

      const result = await getUserProfile('user_123')

      expect(result).toEqual(mockUser)
      expect(mockGetUserProfile).toHaveBeenCalledWith('user_123')
    })

    it('should return null when supabaseAuth fails', async () => {
      mockGetUserProfile.mockResolvedValue({
        success: false,
        error: '用户不存在',
      })

      const result = await getUserProfile('user_123')

      expect(result).toBeNull()
    })

    it('should return null when supabaseAuth returns no user', async () => {
      mockGetUserProfile.mockResolvedValue({
        success: true,
        user: undefined,
      })

      const result = await getUserProfile('user_123')

      expect(result).toBeNull()
    })

    it('should return null on exception', async () => {
      mockGetUserProfile.mockRejectedValue(new Error('网络超时'))

      const result = await getUserProfile('user_123')

      expect(result).toBeNull()
    })
  })

  describe('refreshToken', () => {
    it('should return success with token on success', async () => {
      mockRefreshToken.mockResolvedValue({
        success: true,
        token: 'new_access_token',
      })

      const result = await refreshToken('old_refresh_token')

      expect(result.success).toBe(true)
      expect(result.token).toBe('new_access_token')
      expect(mockRefreshToken).toHaveBeenCalledWith('old_refresh_token')
    })

    it('should return error on failure', async () => {
      mockRefreshToken.mockResolvedValue({
        success: false,
        error: 'Token 已过期',
      })

      const result = await refreshToken('expired_token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Token 已过期')
    })

    it('should catch exception and return error with message', async () => {
      mockRefreshToken.mockRejectedValue(new Error('刷新服务不可用'))

      const result = await refreshToken('some_token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('刷新服务不可用')
    })

    it('should catch non-Error exception and return default error', async () => {
      mockRefreshToken.mockRejectedValue('string error')

      const result = await refreshToken('some_token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('刷新 Token 失败')
    })
  })

  describe('logout', () => {
    it('should call supabaseAuth.logout', async () => {
      mockLogout.mockResolvedValue(undefined)

      await logout()

      expect(mockLogout).toHaveBeenCalledTimes(1)
    })

    it('should propagate error when supabaseAuth.logout throws', async () => {
      mockLogout.mockRejectedValue(new Error('退出失败'))

      await expect(logout()).rejects.toThrow('退出失败')
    })
  })
})
