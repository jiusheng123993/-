import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const {
  mockInitialize,
  mockLogin,
  mockLogout,
  mockRefreshAuthToken,
  mockClearError,
} = vi.hoisted(() => ({
  mockInitialize: vi.fn(),
  mockLogin: vi.fn(),
  mockLogout: vi.fn(),
  mockRefreshAuthToken: vi.fn(),
  mockClearError: vi.fn(),
}))

const {
  mockIsTokenExpiringSoon,
} = vi.hoisted(() => ({
  mockIsTokenExpiringSoon: vi.fn(),
}))

vi.mock('react', () => {
  const useEffect = vi.fn((fn: any) => {
    const cleanup = fn()
    return cleanup
  })
  return { useEffect, default: { useEffect } }
})

const defaultMockStore = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  token: null,
  initialize: mockInitialize,
  login: mockLogin,
  logout: mockLogout,
  refreshAuthToken: mockRefreshAuthToken,
  clearError: mockClearError,
}

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ ...defaultMockStore })),
}))

vi.mock('../../utils/jwt', () => ({
  isTokenExpiringSoon: mockIsTokenExpiringSoon,
}))

import Taro from '@tarojs/taro'
import { useAuthStore } from '../../stores/authStore'
import { useAuth } from '../useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({ ...defaultMockStore } as any)
    mockInitialize.mockResolvedValue(undefined)
    mockLogin.mockResolvedValue({ success: false })
    mockLogout.mockResolvedValue(undefined)
    mockRefreshAuthToken.mockResolvedValue({ success: false })
    mockClearError.mockReturnValue(undefined)
    mockIsTokenExpiringSoon.mockReturnValue(false)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('返回值包含所有预期字段', () => {
    const result = useAuth()
    expect(result).toHaveProperty('user')
    expect(result).toHaveProperty('isAuthenticated')
    expect(result).toHaveProperty('loading')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('login')
    expect(result).toHaveProperty('logout')
    expect(result).toHaveProperty('clearError')
  })

  it('初始化时调用 store 的 initialize', () => {
    useAuth()
    expect(mockInitialize).toHaveBeenCalled()
  })

  it('无 token 时不设置定时刷新', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      ...defaultMockStore,
      token: null,
    } as any)
    useAuth()
    expect(mockIsTokenExpiringSoon).not.toHaveBeenCalled()
  })

  it('有 token 时定时器触发后检查过期状态', () => {
    mockIsTokenExpiringSoon.mockReturnValue(false)
    vi.mocked(useAuthStore).mockReturnValue({
      ...defaultMockStore,
      token: 'valid-token',
    } as any)
    useAuth()
    vi.advanceTimersByTime(60 * 1000)
    expect(mockIsTokenExpiringSoon).toHaveBeenCalledWith('valid-token')
  })

  it('token 即将过期时定时器触发后调用 refreshAuthToken', () => {
    mockIsTokenExpiringSoon.mockReturnValue(true)
    mockRefreshAuthToken.mockResolvedValue({ success: true, token: 'new-token' })
    vi.mocked(useAuthStore).mockReturnValue({
      ...defaultMockStore,
      token: 'expiring-token',
    } as any)
    useAuth()
    vi.advanceTimersByTime(60 * 1000)
    expect(mockIsTokenExpiringSoon).toHaveBeenCalledWith('expiring-token')
    expect(mockRefreshAuthToken).toHaveBeenCalled()
  })

  it('token 未过期时定时器触发后不调用 refreshAuthToken', () => {
    mockIsTokenExpiringSoon.mockReturnValue(false)
    vi.mocked(useAuthStore).mockReturnValue({
      ...defaultMockStore,
      token: 'valid-token',
    } as any)
    useAuth()
    vi.advanceTimersByTime(60 * 1000)
    expect(mockRefreshAuthToken).not.toHaveBeenCalled()
  })

  it('login 成功时返回 true 并显示成功提示和跳转', async () => {
    vi.mocked(Taro.login).mockResolvedValue({ code: 'wx-code-123' } as any)
    mockLogin.mockResolvedValue({ success: true, user: { id: '1', openid: 'o1' } })
    const result = useAuth()
    const success = await result.login()
    expect(Taro.login).toHaveBeenCalledTimes(1)
    expect(mockLogin).toHaveBeenCalledWith('wx-code-123')
    expect(success).toBe(true)
    expect(Taro.showToast).toHaveBeenCalledWith({ title: '登录成功', icon: 'success' })
    expect(Taro.reLaunch).toHaveBeenCalledWith({ url: '/pages/index/index' })
  })

  it('login 时 Taro.login 无 code 返回 false 并提示', async () => {
    vi.mocked(Taro.login).mockResolvedValue({ code: '' } as any)
    const result = useAuth()
    const success = await result.login()
    expect(success).toBe(false)
    expect(Taro.showToast).toHaveBeenCalledWith({ title: '获取微信登录凭证失败', icon: 'none' })
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('login 时 store login 返回失败则返回 false 并提示错误', async () => {
    vi.mocked(Taro.login).mockResolvedValue({ code: 'wx-code-123' } as any)
    mockLogin.mockResolvedValue({ success: false, error: '账号异常' })
    const result = useAuth()
    const success = await result.login()
    expect(success).toBe(false)
    expect(Taro.showToast).toHaveBeenCalledWith({ title: '账号异常', icon: 'none' })
  })

  it('login 时 store login 返回失败且无 error 信息则提示默认文案', async () => {
    vi.mocked(Taro.login).mockResolvedValue({ code: 'wx-code-123' } as any)
    mockLogin.mockResolvedValue({ success: false, error: undefined })
    const result = useAuth()
    const success = await result.login()
    expect(success).toBe(false)
    expect(Taro.showToast).toHaveBeenCalledWith({ title: '登录失败', icon: 'none' })
  })

  it('login 抛出异常时返回 false 并提示重试', async () => {
    vi.mocked(Taro.login).mockRejectedValue(new Error('network error'))
    const result = useAuth()
    const success = await result.login()
    expect(success).toBe(false)
    expect(Taro.showToast).toHaveBeenCalledWith({ title: '登录失败，请重试', icon: 'none' })
  })

  it('logout 成功时调用 store logout 并提示', async () => {
    mockLogout.mockResolvedValue(undefined)
    const result = useAuth()
    await result.logout()
    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(Taro.showToast).toHaveBeenCalledWith({ title: '已退出登录', icon: 'success' })
  })

  it('logout 抛出异常时静默处理不提示', async () => {
    mockLogout.mockRejectedValue(new Error('logout error'))
    const result = useAuth()
    await result.logout()
    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(Taro.showToast).not.toHaveBeenCalled()
  })

  it('clearError 调用 store 的 clearError', () => {
    const result = useAuth()
    result.clearError()
    expect(mockClearError).toHaveBeenCalledTimes(1)
  })

  it('返回 store 中的 user 状态', () => {
    const mockUser = { id: '1', openid: 'o1', nickname: 'test', avatarUrl: 'url' }
    vi.mocked(useAuthStore).mockReturnValue({
      ...defaultMockStore,
      user: mockUser,
    } as any)
    const result = useAuth()
    expect(result.user).toEqual(mockUser)
  })

  it('返回 store 中的 isAuthenticated 状态', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      ...defaultMockStore,
      isAuthenticated: true,
    } as any)
    const result = useAuth()
    expect(result.isAuthenticated).toBe(true)
  })

  it('返回 store 中的 loading 状态', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      ...defaultMockStore,
      loading: true,
    } as any)
    const result = useAuth()
    expect(result.loading).toBe(true)
  })

  it('返回 store 中的 error 状态', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      ...defaultMockStore,
      error: 'some error',
    } as any)
    const result = useAuth()
    expect(result.error).toBe('some error')
  })
})
