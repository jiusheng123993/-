/**
 * 平台适配层 - HTTP 请求模块
 * 小程序用 Taro.request，App/H5 用 fetch
 */
import Taro from '@tarojs/taro'
import { isWeapp } from './detector'
import { storage } from './storage'

// 正式 API 域名（微信小程序要求 HTTPS；本地/测试可用环境变量覆盖）
const API_BASE_URL = (typeof process !== 'undefined' ? process.env : ({} as any)).TARO_APP_API_BASE_URL || 'https://api.xinghuanhai.com'

async function request<T>(path: string, options?: {
  method?: string
  data?: any
  params?: Record<string, string>
}): Promise<T> {
  const token = storage.getToken()
  let url = API_BASE_URL + path
  if (options?.params) {
    const searchParams = new URLSearchParams(options.params)
    url += '?' + searchParams.toString()
  }

  if (isWeapp()) {
    const res = await Taro.request({
      url,
      method: (options?.method as any) || 'GET',
      data: options?.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    const body = res.data as { success?: boolean; code?: number; data?: T; message?: string }
    if (body.success || body.code === 0) return body.data as T
    throw new Error(body.message || '请求失败')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const fetchOptions: RequestInit = {
    method: options?.method || 'GET',
    headers,
  }

  if (options?.data && options.method !== 'GET') {
    fetchOptions.body = JSON.stringify(options.data)
  }

  const res = await fetch(url, fetchOptions)
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(errText || `HTTP ${res.status}`)
  }

  const body = await res.json()
  if (body.success || body.code === 0) return body.data as T
  throw new Error(body.message || '请求失败')
}

export const api = {
  get: <T = any>(path: string, params?: Record<string, string>): Promise<T> => {
    return request<T>(path, { method: 'GET', params })
  },
  post: <T = any>(path: string, data?: any): Promise<T> => {
    return request<T>(path, { method: 'POST', data })
  },
  put: <T = any>(path: string, data?: any): Promise<T> => {
    return request<T>(path, { method: 'PUT', data })
  },
  delete: <T = any>(path: string): Promise<T> => {
    return request<T>(path, { method: 'DELETE' })
  },
}

export { API_BASE_URL }
