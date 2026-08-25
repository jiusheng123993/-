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
    Taro.navigateTo({ url: '/pagesUser/login/index' })
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
    Taro.navigateTo({ url: '/pagesUser/login/index' })
    throw new AuthenticationError('登录已过期，请重新登录')
  }

  const userId = getAuthenticatedUserId()
  return { userId, token }
}

export function isAuthenticated(): boolean {
  const token = storage.getToken()
  return !!token && isTokenFormatValid(token)
}

/**
 * 页面级未登录守卫：当前栈顶页面不是登录页时，reLaunch 到登录页。
 *
 * 为什么需要 currentPage 守卫（关键）：登录页自身挂载时也会走各页面的同名守卫逻辑，
 * 若已处于登录页却再次 reLaunch，页面会在路由完成前被销毁，框架随后收到该页面的
 * routeDone 事件时找不到对应 webview，报 "routeDone with a webviewId X is not found"
 * （框架级路由竞态噪音，微信社区定位为可忽略；本函数从源头减少触发面）。
 *
 * @param loginUrl 登录页路径（默认 '/pagesUser/login/index'）
 * @returns true=已发起跳转；false=当前已在登录页（未跳转，避免重复 reLaunch）
 */
export function redirectToLoginIfNeeded(loginUrl = '/pagesUser/login/index'): boolean {
  // 防御：调用方应只在未登录时调用本函数（4 个页面都先判 !isAuthenticated||!user），
  // 这里再短路一次，防止未来新调用方误把已登录用户也 reLaunch 到登录页
  if (isAuthenticated()) {
    return false
  }
  // Taro.getCurrentPages() 的 route 不带前导斜杠（'pagesUser/login/index'），url 带（'/pagesUser/login/index'），比对前统一去掉前导斜杠
  const loginRoute = loginUrl.replace(/^\//, '')
  const pages = Taro.getCurrentPages() || []
  const currentPage = pages[pages.length - 1]
  // 收口统一语义：仅当存在当前页且不是登录页时才 reLaunch（空栈不跳转；与 mine/family/pet-profile 旧守卫一致，member 原无守卫本次补齐，属统一后的标准行为）
  if (!currentPage || currentPage.route === loginRoute) {
    return false
  }
  Taro.reLaunch({ url: loginUrl })
  return true
}
