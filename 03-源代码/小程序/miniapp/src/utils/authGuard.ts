import Taro from '@tarojs/taro'
import { isTokenFormatValid } from './jwt'
import { CONFIG } from '../config'
import { storage } from './storage'

const { TOKEN, USER, REFRESH_TOKEN } = CONFIG.STORAGE_KEYS

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export function getAuthenticatedUserId(): string {
  const token = storage.getToken()
  if (!token) {
    throw new AuthenticationError('未登录，请先登录')
  }

  if (!isTokenFormatValid(token)) {
    Taro.removeStorageSync(TOKEN)
    Taro.removeStorageSync(REFRESH_TOKEN)
    Taro.removeStorageSync(USER)
    throw new AuthenticationError('登录已过期，请重新登录')
  }

  const userRaw = Taro.getStorageSync(USER)
  if (!userRaw) {
    throw new AuthenticationError('用户信息缺失，请重新登录')
  }

  try {
    const user = JSON.parse(userRaw)
    if (!user?.id) {
      throw new AuthenticationError('用户ID缺失，请重新登录')
    }
    return user.id as string
  } catch (e) {
    if (e instanceof AuthenticationError) throw e
    if (typeof userRaw === 'object' && userRaw !== null && 'id' in userRaw) {
      return (userRaw as { id: string }).id
    }
    throw new AuthenticationError('用户信息损坏，请重新登录')
  }
}

export async function requireAuthAsync(): Promise<{ userId: string; token: string }> {
  const token = storage.getToken()
  if (!token || !isTokenFormatValid(token)) {
    Taro.removeStorageSync(TOKEN)
    Taro.removeStorageSync(REFRESH_TOKEN)
    Taro.removeStorageSync(USER)
    Taro.navigateTo({ url: '/pages/login/index' })
    throw new AuthenticationError('登录已过期，请重新登录')
  }

  const userId = getAuthenticatedUserId()
  return { userId, token }
}

export function requireAuth(): { userId: string; token: string } {
  const token = storage.getToken()
  if (!token || !isTokenFormatValid(token)) {
    Taro.removeStorageSync(TOKEN)
    Taro.removeStorageSync(REFRESH_TOKEN)
    Taro.removeStorageSync(USER)
    Taro.navigateTo({ url: '/pages/login/index' })
    throw new AuthenticationError('登录已过期，请重新登录')
  }

  const userId = getAuthenticatedUserId()
  return { userId, token }
}

export function isAuthenticated(): boolean {
  const token = storage.getToken()
  return !!token && isTokenFormatValid(token)
}
