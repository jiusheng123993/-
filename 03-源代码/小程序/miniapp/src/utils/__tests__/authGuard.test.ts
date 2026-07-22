import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockIsTokenFormatValid, mockValidateTokenWithServer } = vi.hoisted(() => ({
  mockIsTokenFormatValid: vi.fn(),
  mockValidateTokenWithServer: vi.fn(),
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    navigateTo: vi.fn(),
  },
}))

vi.mock('../jwt', () => ({
  isTokenFormatValid: mockIsTokenFormatValid,
  validateTokenWithServer: mockValidateTokenWithServer,
}))

vi.mock('../../config/supabase', () => ({
  STORAGE_KEYS: {
    TOKEN: 'xhh_token',
    REFRESH_TOKEN: 'xhh_refresh_token',
    USER: 'xhh_user',
  },
}))

import Taro from '@tarojs/taro'
import { getAuthenticatedUserId, requireAuth, requireAuthAsync, isAuthenticated, AuthenticationError } from '../authGuard'

const mockGetStorageSync = Taro.getStorageSync as ReturnType<typeof vi.fn>
const mockRemoveStorageSync = Taro.removeStorageSync as ReturnType<typeof vi.fn>
const mockNavigateTo = Taro.navigateTo as ReturnType<typeof vi.fn>

const SK = {
  TOKEN: 'xhh_token',
  REFRESH_TOKEN: 'xhh_refresh_token',
  USER: 'xhh_user',
}

describe('authGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetStorageSync.mockReturnValue('')
    mockIsTokenFormatValid.mockReturnValue(false)
    mockValidateTokenWithServer.mockResolvedValue(false)
  })

  describe('getAuthenticatedUserId', () => {
    it('should throw AuthenticationError when no token', () => {
      mockGetStorageSync.mockReturnValue('')
      expect(() => getAuthenticatedUserId()).toThrow(AuthenticationError)
      expect(() => getAuthenticatedUserId()).toThrow('未登录')
    })

    it('should throw AuthenticationError when token is invalid', () => {
      mockGetStorageSync.mockImplementation((key: string) => {
        if (key === SK.TOKEN) return 'invalid-token'
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(false)
      expect(() => getAuthenticatedUserId()).toThrow(AuthenticationError)
      expect(() => getAuthenticatedUserId()).toThrow('登录已过期')
    })

    it('should clear tokens when token is invalid', () => {
      mockGetStorageSync.mockImplementation((key: string) => {
        if (key === SK.TOKEN) return 'invalid-token'
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(false)
      try { getAuthenticatedUserId() } catch {}
      expect(mockRemoveStorageSync).toHaveBeenCalledWith(SK.TOKEN)
      expect(mockRemoveStorageSync).toHaveBeenCalledWith(SK.REFRESH_TOKEN)
      expect(mockRemoveStorageSync).toHaveBeenCalledWith(SK.USER)
    })

    it('should throw AuthenticationError when user info is missing', () => {
      mockGetStorageSync.mockImplementation((key: string) => {
        if (key === SK.TOKEN) return 'valid-token'
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(true)
      expect(() => getAuthenticatedUserId()).toThrow(AuthenticationError)
      expect(() => getAuthenticatedUserId()).toThrow('用户信息缺失')
    })

    it('should return userId from JSON user info', () => {
      mockGetStorageSync.mockImplementation((key: string) => {
        if (key === SK.TOKEN) return 'valid-token'
        if (key === SK.USER) return JSON.stringify({ id: 'user-123' })
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(true)
      expect(getAuthenticatedUserId()).toBe('user-123')
    })

    it('should return userId from object user info', () => {
      mockGetStorageSync.mockImplementation((key: string) => {
        if (key === SK.TOKEN) return 'valid-token'
        if (key === SK.USER) return { id: 'user-456' }
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(true)
      expect(getAuthenticatedUserId()).toBe('user-456')
    })

    it('should throw when user info has no id', () => {
      mockGetStorageSync.mockImplementation((key: string) => {
        if (key === SK.TOKEN) return 'valid-token'
        if (key === SK.USER) return '{"name":"test"}'
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(true)
      expect(() => getAuthenticatedUserId()).toThrow('用户ID缺失')
    })
  })

  describe('isAuthenticated', () => {
    it('should return false when no token', () => {
      mockGetStorageSync.mockReturnValue('')
      expect(isAuthenticated()).toBe(false)
    })

    it('should return false when token is invalid', () => {
      mockGetStorageSync.mockReturnValue('invalid-token')
      mockIsTokenFormatValid.mockReturnValue(false)
      expect(isAuthenticated()).toBe(false)
    })

    it('should return true when token is valid', () => {
      mockGetStorageSync.mockReturnValue('valid-token')
      mockIsTokenFormatValid.mockReturnValue(true)
      expect(isAuthenticated()).toBe(true)
    })
  })

  describe('requireAuth', () => {
    it('should navigate to login when not authenticated', () => {
      mockGetStorageSync.mockReturnValue('')
      expect(() => requireAuth()).toThrow(AuthenticationError)
      expect(mockNavigateTo).toHaveBeenCalledWith({ url: '/pages/login/index' })
    })

    it('should return userId and token when authenticated', () => {
      mockGetStorageSync.mockImplementation((key: string) => {
        if (key === SK.TOKEN) return 'valid-token'
        if (key === SK.USER) return JSON.stringify({ id: 'user-789' })
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(true)
      const result = requireAuth()
      expect(result.userId).toBe('user-789')
      expect(result.token).toBe('valid-token')
    })
  })

  describe('requireAuthAsync', () => {
    it('should navigate to login when token format invalid', async () => {
      mockGetStorageSync.mockReturnValue('invalid-token')
      mockIsTokenFormatValid.mockReturnValue(false)
      await expect(requireAuthAsync()).rejects.toThrow(AuthenticationError)
      expect(mockNavigateTo).toHaveBeenCalledWith({ url: '/pages/login/index' })
    })

    it('should navigate to login when server validation fails', async () => {
      mockGetStorageSync.mockImplementation((key: string) => {
        if (key === SK.TOKEN) return 'valid-token'
        if (key === SK.USER) return JSON.stringify({ id: 'user-123' })
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(true)
      mockValidateTokenWithServer.mockResolvedValue(false)
      await expect(requireAuthAsync()).rejects.toThrow(AuthenticationError)
      expect(mockNavigateTo).toHaveBeenCalledWith({ url: '/pages/login/index' })
    })

    it('should return userId and token when server validation passes', async () => {
      mockGetStorageSync.mockImplementation((key: string) => {
        if (key === SK.TOKEN) return 'valid-token'
        if (key === SK.USER) return JSON.stringify({ id: 'user-123' })
        return ''
      })
      mockIsTokenFormatValid.mockReturnValue(true)
      mockValidateTokenWithServer.mockResolvedValue(true)
      const result = await requireAuthAsync()
      expect(result.userId).toBe('user-123')
      expect(result.token).toBe('valid-token')
    })
  })
})
