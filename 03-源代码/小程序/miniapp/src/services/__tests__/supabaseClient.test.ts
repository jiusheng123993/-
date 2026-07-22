import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetStorage, mockRequest } = vi.hoisted(() => ({
  mockGetStorage: vi.fn(() => 'test-token'),
  mockRequest: vi.fn(() => Promise.resolve({ statusCode: 200, data: {} })),
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: mockGetStorage,
    request: mockRequest,
  },
}))

vi.mock('../../config/supabase', () => ({
  ENV: {
    development: { supabaseUrl: 'https://test.supabase.co', supabaseKey: 'test-anon-key', useMock: false },
    production: { supabaseUrl: 'https://prod.supabase.co', supabaseKey: 'prod-anon-key', useMock: false },
  },
  STORAGE_KEYS: { TOKEN: 'xhh_token' },
}))

import { SupabaseClient, supabaseClient, SupabaseResponse } from '../supabaseClient'

describe('SupabaseClient', () => {
  let client: SupabaseClient

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetStorage.mockReturnValue('test-token')
    mockRequest.mockResolvedValue({ statusCode: 200, data: {} })
    client = new SupabaseClient()
  })

  describe('constructor', () => {
    it('creates instance with config', () => {
      const instance = new SupabaseClient()
      expect(instance).toBeInstanceOf(SupabaseClient)
    })
  })

  describe('isMock', () => {
    it('returns false for development env', () => {
      expect(client.isMock).toBe(false)
    })
  })

  describe('request', () => {
    it('returns mock response when isMock=true', async () => {
      Object.defineProperty(client, 'isMock', { get: () => true })
      const result = await client.request('users')
      expect(result).toEqual({ data: null, error: 'Mock模式，无云端连接', status: 0 })
      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('makes GET request with correct URL and headers', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: [{ id: 1 }] })
      await client.request('users')
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://test.supabase.co/rest/v1/users',
          method: 'GET',
        })
      )
    })

    it('makes POST request with body', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: { id: 1 } })
      await client.request('users', { method: 'POST', body: { name: 'test' } })
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: { name: 'test' },
        })
      )
    })

    it('includes Authorization header when token exists', async () => {
      mockGetStorage.mockReturnValue('my-jwt-token')
      mockRequest.mockResolvedValue({ statusCode: 200, data: {} })
      await client.request('users')
      const callArgs = (mockRequest.mock.calls[0] as unknown[])[0] as { header: Record<string, string> }
      expect(callArgs.header['Authorization']).toBe('Bearer my-jwt-token')
    })

    it('does not include Authorization when no token', async () => {
      mockGetStorage.mockReturnValue('')
      mockRequest.mockResolvedValue({ statusCode: 200, data: {} })
      await client.request('users')
      const callArgs = (mockRequest.mock.calls[0] as unknown[])[0] as { header: Record<string, string> }
      expect(callArgs.header['Authorization']).toBeUndefined()
    })

    it('returns data on 200 status', async () => {
      const responseData = [{ id: 1, name: 'Alice' }]
      mockRequest.mockResolvedValue({ statusCode: 200, data: responseData })
      const result = await client.request('users')
      expect(result).toEqual({ data: responseData, error: null, status: 200 })
    })

    it('returns data on 201 status', async () => {
      const responseData = { id: 2, name: 'Bob' }
      mockRequest.mockResolvedValue({ statusCode: 201, data: responseData })
      const result = await client.request('users', { method: 'POST', body: {} })
      expect(result).toEqual({ data: responseData, error: null, status: 201 })
    })

    it('returns error on 400+ status with message', async () => {
      mockRequest.mockResolvedValue({ statusCode: 400, data: { message: 'Bad Request' } })
      const result = await client.request('users')
      expect(result).toEqual({ data: null, error: 'Bad Request', status: 400 })
    })

    it('returns error on 404 status without message', async () => {
      mockRequest.mockResolvedValue({ statusCode: 404, data: {} })
      const result = await client.request('users')
      expect(result).toEqual({ data: null, error: 'API错误: 404', status: 404 })
    })

    it('returns error on 500 status', async () => {
      mockRequest.mockResolvedValue({ statusCode: 500, data: { message: 'Internal Server Error' } })
      const result = await client.request('users')
      expect(result).toEqual({ data: null, error: 'Internal Server Error', status: 500 })
    })

    it('returns error on network failure', async () => {
      mockRequest.mockRejectedValue(new Error('Network timeout'))
      const result = await client.request('users')
      expect(result).toEqual({ data: null, error: 'Network timeout', status: 0 })
    })

    it('returns generic error on non-Error network failure', async () => {
      mockRequest.mockRejectedValue('unknown')
      const result = await client.request('users')
      expect(result).toEqual({ data: null, error: '网络请求失败', status: 0 })
    })

    it('builds URL with query params', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: [] })
      await client.request('users', { params: { select: '*', id: 'eq.1' } })
      const callArgs = (mockRequest.mock.calls[0] as unknown[])[0] as { url: string }
      expect(callArgs.url).toContain('select=*')
      expect(callArgs.url).toContain('id=eq.1')
      expect(callArgs.url).toContain('?')
    })

    it('includes apikey and Content-Type headers', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: {} })
      await client.request('users')
      const callArgs = (mockRequest.mock.calls[0] as unknown[])[0] as { header: Record<string, string> }
      expect(callArgs.header['apikey']).toBe('test-anon-key')
      expect(callArgs.header['Content-Type']).toBe('application/json')
    })

    it('sets timeout to 15000', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: {} })
      await client.request('users')
      const callArgs = (mockRequest.mock.calls[0] as unknown[])[0] as { timeout: number }
      expect(callArgs.timeout).toBe(15000)
    })

    it('merges custom headers with auth headers', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: {} })
      await client.request('users', { headers: { 'X-Custom': 'value' } })
      const callArgs = (mockRequest.mock.calls[0] as unknown[])[0] as { header: Record<string, string> }
      expect(callArgs.header['apikey']).toBe('test-anon-key')
      expect(callArgs.header['X-Custom']).toBe('value')
    })
  })

  describe('select', () => {
    it('calls request with GET', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: [{ id: 1 }] })
      const result = await client.select('users', { select: '*' })
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/rest/v1/users'),
        })
      )
      expect(result.status).toBe(200)
    })
  })

  describe('selectOne', () => {
    it('returns first item from array', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: [{ id: 1, name: 'Alice' }] })
      const result = await client.selectOne('users', { id: 'eq.1' })
      expect(result).toEqual({ data: { id: 1, name: 'Alice' }, error: null, status: 200 })
    })

    it('returns null when empty array', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: [] })
      const result = await client.selectOne('users', { id: 'eq.999' })
      expect(result).toEqual({ data: null, error: null, status: 200 })
    })

    it('appends limit=1 to params', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: [] })
      await client.selectOne('users', { id: 'eq.1' })
      const callArgs = (mockRequest.mock.calls[0] as unknown[])[0] as { url: string }
      expect(callArgs.url).toContain('limit=1')
    })
  })

  describe('insert', () => {
    it('calls request with POST and body', async () => {
      const insertData = { name: 'Alice' }
      mockRequest.mockResolvedValue({ statusCode: 201, data: [{ id: 1, name: 'Alice' }] })
      const result = await client.insert('users', insertData)
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: insertData,
        })
      )
      expect(result.status).toBe(201)
    })
  })

  describe('update', () => {
    it('calls request with PATCH and body', async () => {
      const updateData = { name: 'Bob' }
      mockRequest.mockResolvedValue({ statusCode: 200, data: [{ id: 1, name: 'Bob' }] })
      const result = await client.update('users', updateData, { id: 'eq.1' })
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
          data: updateData,
        })
      )
      expect(result.status).toBe(200)
    })

    it('passes params to request', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: [] })
      await client.update('users', { name: 'Bob' }, { id: 'eq.1' })
      const callArgs = (mockRequest.mock.calls[0] as unknown[])[0] as { url: string }
      expect(callArgs.url).toContain('id=eq.1')
    })
  })

  describe('upsert', () => {
    it('calls request with POST and merge-duplicates header', async () => {
      const upsertData = { id: 1, name: 'Alice' }
      mockRequest.mockResolvedValue({ statusCode: 200, data: [{ id: 1, name: 'Alice' }] })
      await client.upsert('users', upsertData)
      const callArgs = (mockRequest.mock.calls[0] as unknown[])[0] as { header: Record<string, string>; method: string; data: unknown }
      expect(callArgs.method).toBe('POST')
      expect(callArgs.data).toStrictEqual(upsertData)
      expect(callArgs.header['Prefer']).toBe('resolution=merge-duplicates,return=representation')
    })
  })

  describe('delete', () => {
    it('calls request with DELETE', async () => {
      mockRequest.mockResolvedValue({ statusCode: 200, data: {} })
      const result = await client.delete('users', { id: 'eq.1' })
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
        })
      )
      expect(result.status).toBe(200)
    })
  })

  describe('supabaseClient singleton', () => {
    it('is instance of SupabaseClient', () => {
      expect(supabaseClient).toBeInstanceOf(SupabaseClient)
    })
  })
})
