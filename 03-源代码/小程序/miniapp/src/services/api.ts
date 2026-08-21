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
 * 将服务端返回的可能为相对路径的头像 URL 补全为绝对地址
 * 坑点：上传头像接口返回 `/uploads/user-avatars/...` 这种相对路径，微信小程序 <Image>
 * 对相对路径无法加载（缺少 scheme/host）。这里对以单个 `/` 开头、且非完整 URL 的路径，
 * 用 API_BASE_URL 拼出绝对地址；已是 http(s):// 或 data: 等完整地址则原样返回。
 * @param avatar - 服务端返回的头像值
 * @returns 可直接用于 <Image> 的绝对 URL（空值原样返回）
 */
export function resolveAvatarUrl(avatar: string | undefined | null): string {
  if (!avatar) return ''
  // 已是绝对地址（含协议）或相对协议的 //host 形式，直接可用
  if (/^(https?:)?\/\//i.test(avatar)) return avatar
  // 单个 `/` 开头的站内相对路径（如 /uploads/...），拼上 API_BASE_URL
  if (avatar.startsWith('/')) return `${CONFIG.API_BASE_URL}${avatar}`
  // 其他（dataURI、blob、纯文件名等）原样返回
  return avatar
}

/**
 * 服务端用户字段统一映射：avatarUrl/avatar_url → 前端 User.avatar
 * 服务端统一返回 camelCase（avatarUrl），历史兼容 snake_case（avatar_url）
 */
function normalizeUser(raw: any): User {
  return {
    id: raw.id,
    nickname: raw.nickname || '',
    avatar: resolveAvatarUrl(raw.avatarUrl || raw.avatar_url || raw.avatar || ''),
    phone: raw.phone,
    createdAt: raw.createdAt || raw.created_at || '',
  }
}

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
      timeout: 15000,
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
  /** PATCH 请求 */
  patch: <T = any>(path: string, data?: any): Promise<T> => {
    return request<T>(path, { method: 'PATCH', data })
  },
  /** DELETE 请求 */
  delete: <T = any>(path: string): Promise<T> => {
    return request<T>(path, { method: 'DELETE' })
  },
  /** 微信登录：使用 code 换取登录态 */
  login: async (code: string): Promise<LoginResponse> => {
    if (useMock()) return mockApi.login(code)
    const res = await request<LoginResponse>('/api/auth/login', { method: 'POST', data: { provider: 'wechat', code } })
    return { ...res, user: normalizeUser(res.user) }
  },
  /** 获取当前登录用户信息 */
  getUser: async (): Promise<User> => {
    if (useMock()) return mockApi.getUser()
    // 服务端真实路由为 /api/auth/profile（旧 /session 不存在，会导致登录态无法恢复）
    return normalizeUser(await request<any>('/api/auth/profile'))
  },
  /** 更新用户资料（昵称 + 头像），跟随微信的资料以用户选择为准 */
  updateProfile: async (nickname: string, avatarUrl: string): Promise<User> => {
    if (useMock()) return mockApi.updateProfile(nickname, avatarUrl)
    const raw = await request<any>('/api/auth/profile', {
      method: 'PUT',
      data: { nickname, avatar_url: avatarUrl },
    })
    return normalizeUser(raw)
  },
  /** 上传用户头像（微信 chooseAvatar 返回的临时文件 → 服务器） */
  uploadAvatar: (filePath: string): Promise<{ url: string }> => {
    const token = storage.getToken()
    return new Promise((resolve, reject) => {
      Taro.uploadFile({
        url: `${CONFIG.API_BASE_URL}/api/auth/avatar`,
        filePath,
        name: 'avatar',
        header: token ? { Authorization: `Bearer ${token}` } : {},
        success: (res) => {
          try {
            const body = JSON.parse(res.data)
            if (body.success && body.data?.url) {
              // 补全相对路径头像为绝对地址，避免 <Image> 无法加载
              resolve({ url: resolveAvatarUrl(body.data.url) })
            } else {
              reject(new Error(body.message || '头像上传失败'))
            }
          } catch {
            reject(new Error('头像上传失败'))
          }
        },
        fail: () => reject(new Error('头像上传失败，请重试')),
      })
    })
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
