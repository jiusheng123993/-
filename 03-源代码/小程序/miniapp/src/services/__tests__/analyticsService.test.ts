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
})
