/**
 * 埋点分析服务测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { trackEvent, flushEvents, getQueueLength, clearQueue } from '../analyticsService'
import { api } from '../api'

const mockStorage: Record<string, string> = {}

vi.mock('../api', () => ({
  api: {
    post: vi.fn().mockResolvedValue({ success: true }),
  },
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: vi.fn((key: string) => mockStorage[key]),
    setStorageSync: vi.fn((key: string, value: string) => {
      mockStorage[key] = value
    }),
  },
}))

describe('analyticsService', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  })

  afterEach(() => {
    clearQueue()
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  })

  it('trackEvent queues an event', () => {
    trackEvent('page_view_home', { petCount: 1 })
    expect(getQueueLength()).toBe(1)
  })

  it('trackEvent includes event name and properties', () => {
    trackEvent('search_food', { query: 'chicken', petSpecies: 'dog' })
    const queue = JSON.parse(mockStorage['xhh_analytics_queue'] || '[]')
    expect(queue[0].eventName).toBe('search_food')
    expect(queue[0].properties.query).toBe('chicken')
    expect(queue[0].properties.petSpecies).toBe('dog')
  })

  it('queue accumulates events below flush threshold', () => {
    for (let i = 0; i < 15; i++) {
      trackEvent('test_event', { index: i })
    }
    expect(getQueueLength()).toBe(15)
  })

  it('queue flushes events when reaching flush threshold', async () => {
    for (let i = 0; i < 25; i++) {
      trackEvent('test_event', { index: i })
    }
    // flushEvents 为异步真实上报（POST 成功后才清空队列），
    // 需要等待微任务完成后再断言队列被截断为阈值以内的数量
    await vi.waitFor(() => {
      expect(getQueueLength()).toBe(5)
    })
    // 同时验证事件确实被批量上报到服务端埋点接口
    expect(api.post).toHaveBeenCalledWith('/api/analytics/events', {
      events: expect.any(Array),
    })
  })

  it('flushEvents clears the queue', async () => {
    trackEvent('page_view_home')
    await flushEvents()
    expect(getQueueLength()).toBe(0)
  })

  it('clearQueue removes all events', () => {
    trackEvent('page_view_home')
    trackEvent('click_button')
    clearQueue()
    expect(getQueueLength()).toBe(0)
  })

  it('flush 失败后进入退避：60 秒内不重试（避免打爆服务端限流）', async () => {
    // mock.calls 是跨测试累积的，先记录基线再断言增量
    const baseline = vi.mocked(api.post).mock.calls.length
    // 用低于自动阈值（20）的数量，只测显式 flush 的退避逻辑
    vi.mocked(api.post).mockRejectedValueOnce(new Error('429 Too Many Requests'))
    for (let i = 0; i < 10; i++) {
      trackEvent('test_event', { index: i })
    }
    // 显式触发 flush：首次因 mock 失败 → 记录退避时间
    await flushEvents()
    expect(vi.mocked(api.post).mock.calls.length).toBe(baseline + 1)
    // 失败后队列应保留（不清空）
    expect(getQueueLength()).toBe(10)

    // 退避窗口内再次触发 flush 应被跳过（api.post 不再被调用）
    await flushEvents()
    expect(vi.mocked(api.post).mock.calls.length).toBe(baseline + 1)
  })
})
