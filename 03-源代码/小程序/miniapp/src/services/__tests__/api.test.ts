import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Taro from '@tarojs/taro'

const mockRequest = vi.mocked(Taro.request)
const mockGetStorage = vi.mocked(Taro.getStorageSync)
const mockRemoveStorage = vi.mocked(Taro.removeStorageSync)
const mockNavigateTo = vi.mocked(Taro.navigateTo)

import { api } from '../api'

function makeResponse(statusCode: number, data: unknown = {}) {
  return Promise.resolve({ statusCode, data })
}

function makeNetworkError() {
  const err = new Error('request:fail')
  return Promise.reject(err)
}

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetStorage.mockReturnValue('test-token')
    mockRequest.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('api.get', () => {
    it('makes GET request with correct URL', async () => {
      mockRequest.mockReturnValue(makeResponse(200, { id: 1 }))
      await api.get('/users')
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/users'),
          method: 'GET',
        }),
      )
    })

    it('includes Authorization header when token exists', async () => {
      mockGetStorage.mockReturnValue('my-token')
      mockRequest.mockReturnValue(makeResponse(200, {}))
      await api.get('/profile')
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          header: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        }),
      )
    })

    it('does not include Authorization when no token', async () => {
      mockGetStorage.mockReturnValue('')
      mockRequest.mockReturnValue(makeResponse(200, {}))
      await api.get('/public')
      const callArgs = mockRequest.mock.calls[0][0]
      expect(callArgs.header).not.toHaveProperty('Authorization')
    })

    it('returns data on 200 status', async () => {
      mockRequest.mockReturnValue(makeResponse(200, { name: 'test' }))
      const result = await api.get<{ name: string }>('/data')
      expect(result).toEqual({ name: 'test' })
    })

    it('returns data on 201 status', async () => {
      mockRequest.mockReturnValue(makeResponse(201, { created: true }))
      const result = await api.get<{ created: boolean }>('/resource')
      expect(result).toEqual({ created: true })
    })

    it('throws on 401 and removes token', async () => {
      mockRequest.mockReturnValue(makeResponse(401, {}))
      await expect(api.get('/secure')).rejects.toThrow('未授权，请重新登录')
      expect(mockRemoveStorage).toHaveBeenCalledWith('xhh_token')
      expect(mockRemoveStorage).toHaveBeenCalledWith('xhh_refresh_token')
      expect(mockNavigateTo).toHaveBeenCalledWith({ url: '/pages/login/index' })
    })

    it('throws on 429 with rate limit message', async () => {
      mockRequest.mockReturnValue(makeResponse(429, {}))
      await expect(api.get('/limited')).rejects.toThrow('请求过于频繁，请稍后再试')
    })

    it('retries on 500 error', async () => {
      mockRequest
        .mockReturnValueOnce(makeResponse(500, {}))
        .mockReturnValueOnce(makeResponse(200, { ok: true }))
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const result = await api.get('/flaky')
      expect(result).toEqual({ ok: true })
      expect(mockRequest).toHaveBeenCalledTimes(2)
    }, 15000)

    it('throws after max retries on 500', async () => {
      mockRequest.mockReturnValue(makeResponse(500, {}))
      vi.useFakeTimers({ shouldAdvanceTime: true })
      await expect(api.get('/down')).rejects.toThrow('服务器错误: 500')
      expect(mockRequest).toHaveBeenCalledTimes(4)
    }, 30000)

    it('retries on network failure (request:fail)', async () => {
      mockRequest
        .mockReturnValueOnce(makeNetworkError())
        .mockReturnValueOnce(makeResponse(200, { recovered: true }))
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const result = await api.get('/unstable')
      expect(result).toEqual({ recovered: true })
      expect(mockRequest).toHaveBeenCalledTimes(2)
    }, 15000)

    it('throws after max retries on network failure', async () => {
      mockRequest.mockReturnValue(makeNetworkError())
      vi.useFakeTimers({ shouldAdvanceTime: true })
      await expect(api.get('/offline')).rejects.toThrow('网络连接失败，请检查网络设置')
      expect(mockRequest).toHaveBeenCalledTimes(4)
    }, 30000)

    it('throws on other error status with message from response', async () => {
      mockRequest.mockReturnValue(makeResponse(403, { message: '禁止访问' }))
      await expect(api.get('/forbidden')).rejects.toThrow('禁止访问')
    })

    it('throws on other error status with error field from response', async () => {
      mockRequest.mockReturnValue(makeResponse(422, { error: '参数校验失败' }))
      await expect(api.get('/invalid')).rejects.toThrow('参数校验失败')
    })

    it('throws on other error status with fallback message', async () => {
      mockRequest.mockReturnValue(makeResponse(403, {}))
      await expect(api.get('/denied')).rejects.toThrow('API错误: 403')
    })

    it('throws on other error status when message is not a string', async () => {
      mockRequest.mockReturnValue(makeResponse(400, { message: { code: 123 } }))
      await expect(api.get('/badmsg')).rejects.toThrow('API错误: 400')
    })

    it('deduplicates concurrent GET requests', async () => {
      let resolveFirst: (value: unknown) => void
      const firstPromise = new Promise(resolve => { resolveFirst = resolve })
      mockRequest.mockReturnValueOnce(firstPromise)

      const p1 = api.get('/same-endpoint')
      const p2 = api.get('/same-endpoint')

      resolveFirst!({ statusCode: 200, data: { dedup: true } })

      const [r1, r2] = await Promise.all([p1, p2])
      expect(r1).toEqual({ dedup: true })
      expect(r2).toEqual({ dedup: true })
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })
  })

  describe('api.post', () => {
    it('makes POST request with data', async () => {
      mockRequest.mockReturnValue(makeResponse(200, { id: 1 }))
      await api.post('/items', { name: 'test' })
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: { name: 'test' },
        }),
      )
    })

    it('makes POST request without data', async () => {
      mockRequest.mockReturnValue(makeResponse(200, {}))
      await api.post('/action')
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: undefined,
        }),
      )
    })

    it('does not deduplicate POST requests', async () => {
      mockRequest.mockReturnValue(makeResponse(200, { ok: 1 }))
      const p1 = api.post('/submit', { a: 1 })
      const p2 = api.post('/submit', { a: 1 })
      await Promise.all([p1, p2])
      expect(mockRequest).toHaveBeenCalledTimes(2)
    })
  })

  describe('api.put', () => {
    it('makes PUT request with data', async () => {
      mockRequest.mockReturnValue(makeResponse(200, { updated: true }))
      await api.put('/items/1', { name: 'updated' })
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          data: { name: 'updated' },
        }),
      )
    })

    it('makes PUT request without data', async () => {
      mockRequest.mockReturnValue(makeResponse(200, {}))
      await api.put('/items/1')
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          data: undefined,
        }),
      )
    })
  })

  describe('api.delete', () => {
    it('makes DELETE request', async () => {
      mockRequest.mockReturnValue(makeResponse(200, { deleted: true }))
      await api.delete('/items/1')
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
        }),
      )
    })
  })

  describe('request headers', () => {
    it('includes Content-Type application/json by default', async () => {
      mockRequest.mockReturnValue(makeResponse(200, {}))
      await api.get('/data')
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          header: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      )
    })

    it('sets timeout to 15000ms', async () => {
      mockRequest.mockReturnValue(makeResponse(200, {}))
      await api.get('/data')
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 15000,
        }),
      )
    })
  })
})
