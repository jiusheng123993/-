/**
 * API 请求封装层
 *
 * 统一 HTTP 请求入口，支持 Mock 模式切换、自动鉴权注入、统一错误处理
 */
import Taro from '@tarojs/taro'
import { CONFIG } from '../config'
import { storage } from '../utils/storage'
import { mockApi } from './mock'
import type { ApiResponse, User, Pet, Checkin, Membership, LoginResponse } from '../types'

/**
 * 通用请求方法
 * @param path - API 路径
 * @param options - 请求配置（方法/数据/查询参数）
 * @returns 泛型响应数据
 */
async function request<T>(path: string, options?: { method?: string; data?: any; params?: Record<string, string> }): Promise<T> {
  if (useMock()) {
    const method = options?.method || 'GET'

    if (method === 'GET' && path.includes('/trends')) {
      const urlParams = new URLSearchParams(options?.params || {})
      if (path.includes('/trends/summary')) {
        const petId = path.match(/\/pets\/([^/]+)\/trends/)![1]
        const period = urlParams.get('period') || 'week'
        return mockApi.getTrendSummary(petId, period) as unknown as T
      }
      if (path.includes('/trends/report')) {
        const petId = path.match(/\/pets\/([^/]+)\/trends/)![1]
        const month = urlParams.get('month') || new Date().toISOString().slice(0, 7)
        return mockApi.getMonthlyReport(petId, month) as unknown as T
      }
      const petId = path.match(/\/pets\/([^/]+)\/trends/)![1]
      const startDate = urlParams.get('startDate') || new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
      const endDate = urlParams.get('endDate') || new Date().toISOString().slice(0, 10)
      return mockApi.getTrendData(petId, startDate, endDate) as unknown as T
    }

    if (method === 'GET' && path.includes('/checkins') && (path.includes('startDate') || path.includes('endDate') || (options?.params && (options.params.startDate || options.params.endDate)))) {
      const petId = path.match(/\/pets\/([^/]+)\/checkins/)![1]
      const urlParams = new URLSearchParams(options?.params || {})
      const startDate = urlParams.get('startDate') || '2020-01-01'
      const endDate = urlParams.get('endDate') || new Date().toISOString().slice(0, 10)
      return mockApi.getHealthCheckinsByDateRange(petId, startDate, endDate) as unknown as T
    }

    console.warn(`[Mock] API ${method} ${path} - 返回 mock 空数据`)
    if (method === 'GET') return [] as unknown as T
    if (method === 'POST' || method === 'PUT') return (options?.data || {}) as unknown as T
    return undefined as unknown as T
  }
  const token = storage.getToken()
  let url = CONFIG.API_BASE_URL + path
  if (options?.params) {
    const searchParams = new URLSearchParams(options.params)
    url += '?' + searchParams.toString()
  }
  try {
    const res = await Taro.request({
      url,
      method: (options?.method as any) || 'GET',
      data: options?.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    const body = res.data as ApiResponse<T> & { success?: boolean }
    if (body.success) return body.data as T
    if (body.code === 0) return body.data
    throw new Error(body.message || '请求失败')
  } catch (err: any) {
    if (err.message === 'request:fail') {
      throw new Error('网络异常，请检查网络连接')
    }
    throw err
  }
}

/** 判断是否启用 Mock 模式 */
function useMock(): boolean {
  return CONFIG.USE_MOCK
}

/** API 实例 - 封装 GET/POST/PUT/DELETE 及专用接口 */
export const api = {
  /** GET 请求 */
  get: <T = any>(path: string, params?: Record<string, string>): Promise<T> => {
    return request<T>(path, { method: 'GET', params })
  },
  /** POST 请求 */
  post: <T = any>(path: string, data?: any): Promise<T> => {
    return request<T>(path, { method: 'POST', data })
  },
  /** PUT 请求 */
  put: <T = any>(path: string, data?: any): Promise<T> => {
    return request<T>(path, { method: 'PUT', data })
  },
  /** DELETE 请求 */
  delete: <T = any>(path: string): Promise<T> => {
    return request<T>(path, { method: 'DELETE' })
  },
  /** 微信登录：使用 code 换取登录态 */
  login: async (code: string): Promise<LoginResponse> => {
    if (useMock()) return mockApi.login(code)
    return request<LoginResponse>('/api/auth/login', { method: 'POST', data: { provider: 'wechat', code } })
  },
  /** 获取当前登录用户信息 */
  getUser: async (): Promise<User> => {
    if (useMock()) return mockApi.getUser()
    return request<User>('/api/auth/session')
  },
  /** 获取用户的所有宠物列表 */
  getPets: async (userId: string): Promise<Pet[]> => {
    if (useMock()) return mockApi.getPets(userId)
    return request<Pet[]>('/pets', { params: { userId } })
  },
  /** 获取单个宠物详情 */
  getPet: async (petId: string): Promise<Pet | null> => {
    if (useMock()) return mockApi.getPet(petId)
    return request<Pet>(`/pets/${petId}`)
  },
  /** 创建新宠物 */
  createPet: async (data: Partial<Pet>): Promise<Pet> => {
    if (useMock()) return mockApi.createPet(data)
    return request<Pet>('/pets', { method: 'POST', data })
  },
  /** 更新宠物信息 */
  updatePet: async (petId: string, data: Partial<Pet>): Promise<Pet> => {
    if (useMock()) return mockApi.updatePet(petId, data)
    return request<Pet>(`/pets/${petId}`, { method: 'PUT', data })
  },
  /** 删除宠物 */
  deletePet: async (petId: string): Promise<void> => {
    if (useMock()) return mockApi.deletePet(petId)
    return request<void>(`/pets/${petId}`, { method: 'DELETE' })
  },
  /** 获取宠物的打卡列表 */
  getCheckins: async (petId: string): Promise<Checkin[]> => {
    if (useMock()) return mockApi.getCheckins(petId)
    return request<Checkin[]>(`/api/pets/${petId}/checkins`)
  },
  /** 创建打卡记录 */
  createCheckin: async (data: Partial<Checkin>): Promise<Checkin> => {
    if (useMock()) return mockApi.createCheckin(data)
    return request<Checkin>(`/api/pets/${data.petId}/checkins`, { method: 'POST', data })
  },
  /** 获取用户的会员信息 */
  getMembership: async (userId: string): Promise<Membership | null> => {
    if (useMock()) return mockApi.getMembership(userId)
    return request<Membership | null>(`/membership/status`, { params: { userId } })
  },
}