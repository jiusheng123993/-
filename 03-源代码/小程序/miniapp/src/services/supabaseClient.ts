import Taro from '@tarojs/taro'
import { ENV, STORAGE_KEYS } from '../config/supabase'

const currentEnv = ENV[process.env.NODE_ENV || 'development'] || ENV.development

interface SupabaseRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  params?: Record<string, string>
}

export interface SupabaseResponse<T> {
  data: T | null
  error: string | null
  status: number
}

export class SupabaseClient {
  private baseUrl: string
  private anonKey: string

  constructor() {
    this.baseUrl = currentEnv.supabaseUrl
    this.anonKey = currentEnv.supabaseKey
  }

  get isMock(): boolean {
    return currentEnv.useMock
  }

  private getAuthHeaders(): Record<string, string> {
    const token = Taro.getStorageSync(STORAGE_KEYS.TOKEN)
    const headers: Record<string, string> = {
      'apikey': this.anonKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = `${this.baseUrl}/rest/v1/${path}`
    if (!params) return url
    const query = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')
    return query ? `${url}?${query}` : url
  }

  async request<T>(path: string, options: SupabaseRequestOptions = {}): Promise<SupabaseResponse<T>> {
    if (this.isMock) {
      return { data: null, error: 'Mock模式，无云端连接', status: 0 }
    }

    const { method = 'GET', body, headers = {}, params } = options

    try {
      const res = await Taro.request({
        url: this.buildUrl(path, params),
        method,
        data: body,
        header: { ...this.getAuthHeaders(), ...headers },
        timeout: 15000
      })

      if (res.statusCode >= 200 && res.statusCode < 300) {
        return { data: res.data as T, error: null, status: res.statusCode }
      }

      return {
        data: null,
        error: (res.data as { message?: string })?.message || `API错误: ${res.statusCode}`,
        status: res.statusCode
      }
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : '网络请求失败',
        status: 0
      }
    }
  }

  async select<T>(table: string, params?: Record<string, string>): Promise<SupabaseResponse<T[]>> {
    return this.request<T[]>(table, { params })
  }

  async selectOne<T>(table: string, params?: Record<string, string>): Promise<SupabaseResponse<T>> {
    const result = await this.request<T[]>(table, {
      params: { ...params, limit: '1' }
    })
    if (result.data && result.data.length > 0) {
      return { data: result.data[0], error: null, status: result.status }
    }
    return { data: null, error: result.error, status: result.status }
  }

  async insert<T>(table: string, data: T | T[]): Promise<SupabaseResponse<T[]>> {
    return this.request<T[]>(table, { method: 'POST', body: data })
  }

  async update<T>(table: string, data: Partial<T>, params?: Record<string, string>): Promise<SupabaseResponse<T[]>> {
    return this.request<T[]>(table, { method: 'PATCH', body: data, params })
  }

  async upsert<T>(table: string, data: T | T[]): Promise<SupabaseResponse<T[]>> {
    return this.request<T[]>(table, {
      method: 'POST',
      body: data,
      headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' }
    })
  }

  async delete(table: string, params?: Record<string, string>): Promise<SupabaseResponse<null>> {
    return this.request<null>(table, { method: 'DELETE', params })
  }
}

export const supabaseClient = new SupabaseClient()
