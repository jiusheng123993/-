import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { trackEvent, flushEvents, getQueueLength, clearQueue } from '../analyticsService'

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

  it('queue respects max size', () => {
    for (let i = 0; i < 110; i++) {
      trackEvent('test_event', { index: i })
    }
    expect(getQueueLength()).toBe(100)
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
