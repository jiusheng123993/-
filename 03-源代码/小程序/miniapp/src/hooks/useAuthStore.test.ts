import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockLoginWithCode,
  mockLogout,
  mockRefreshToken,
} = vi.hoisted(() => ({
  mockLoginWithCode: vi.fn(),
  mockLogout: vi.fn(),
  mockRefreshToken: vi.fn(),
}))

vi.mock('../config/supabase', () => ({
  supabaseAuth: {
    loginWithCode: mockLoginWithCode,
    logout: mockLogout,
    refreshToken: mockRefreshToken,
  },
  STORAGE_KEYS: {
    TOKEN: 'token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user',
  },
}))

vi.mock('../utils/jwt', () => ({
  verifyToken: vi.fn(() => true),
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: vi.fn(() => null),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
  },
}))

import { useAuthStore } from '../stores/authStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      token: null,
      refreshTokenValue: null,
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    })
  })

  it('初始状态为未登录', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('login 成功时更新用户状态', async () => {
    const mockUser = {
      id: 'user1',
      openid: 'openid1',
      nickname: '测试用户',
      avatarUrl: 'https://example.com/avatar.png',
    }
    mockLoginWithCode.mockResolvedValue({
      success: true,
      token: 'mock_token',
      refreshToken: 'mock_refresh_token',
      user: mockUser,
    })

    const loginResult = await useAuthStore.getState().login('code123')

    expect(loginResult.success).toBe(true)
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.token).toBe('mock_token')
    expect(state.isAuthenticated).toBe(true)
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('logout 清除用户状态', async () => {
    const mockUser = {
      id: 'user1',
      openid: 'openid1',
      nickname: '测试用户',
    }
    useAuthStore.setState({
      token: 'mock_token',
      refreshTokenValue: 'mock_refresh_token',
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      error: null,
    })

    await useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.loading).toBe(false)
  })

  it('getUserInfo 返回用户信息', async () => {
    const mockUser = {
      id: 'user1',
      openid: 'openid1',
      nickname: '测试用户',
      avatarUrl: 'https://example.com/avatar.png',
    }
    mockLoginWithCode.mockResolvedValue({
      success: true,
      token: 'mock_token',
      refreshToken: 'mock_refresh_token',
      user: mockUser,
    })

    await useAuthStore.getState().login('code123')

    const userInfo = useAuthStore.getState().user
    expect(userInfo).toEqual(mockUser)
    expect(userInfo?.id).toBe('user1')
    expect(userInfo?.nickname).toBe('测试用户')
  })

  it('未登录时 getUserInfo 返回 null', () => {
    const userInfo = useAuthStore.getState().user
    expect(userInfo).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
