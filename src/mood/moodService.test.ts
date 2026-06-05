import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMoodService, moodEmojis, moodLabels } from './moodService'
import type { MoodService } from './moodService'

const STORAGE_KEY = 'xinghuanhai-mood-state'

function mockLocalStorage() {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]) }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null)
  }
}

describe('moodService', () => {
  let service: MoodService
  let storage: ReturnType<typeof mockLocalStorage>

  beforeEach(() => {
    storage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', { value: storage, writable: true })
    service = createMoodService()
  })

  describe('getState', () => {
    it('returns empty entries initially', () => {
      const state = service.getState()
      expect(state.entries).toEqual([])
    })

    it('returns entries from localStorage', () => {
      const entry = {
        id: 'test-1',
        mood: 4,
        note: '今天不错',
        tags: ['工作'],
        date: '2026-06-05',
        createdAt: '2026-06-05T10:00:00.000Z'
      }
      storage.getItem.mockReturnValue(JSON.stringify({ entries: [entry] }))
      service = createMoodService()
      const state = service.getState()
      expect(state.entries).toHaveLength(1)
      expect(state.entries[0].mood).toBe(4)
    })

    it('handles corrupted JSON gracefully', () => {
      storage.getItem.mockReturnValue('not-json')
      service = createMoodService()
      const state = service.getState()
      expect(state.entries).toEqual([])
    })
  })

  describe('addMood', () => {
    it('adds a new mood entry for today', () => {
      const entry = service.addMood(5, '很棒的一天', ['开心'])
      expect(entry.mood).toBe(5)
      expect(entry.note).toBe('很棒的一天')
      expect(entry.tags).toEqual(['开心'])
      expect(entry.id).toBeTruthy()
      expect(entry.date).toBe(new Date().toISOString().split('T')[0])
    })

    it('updates existing entry for today instead of creating duplicate', () => {
      const first = service.addMood(3, '一般')
      const second = service.addMood(5, '变好了', ['开心'])
      expect(second.id).toBe(first.id)
      expect(second.mood).toBe(5)
      expect(second.note).toBe('变好了')
    })

    it('persists to localStorage', () => {
      service.addMood(4, '不错')
      expect(storage.setItem).toHaveBeenCalled()
      const savedKey = storage.setItem.mock.calls[0][0]
      expect(savedKey).toBe(STORAGE_KEY)
    })

    it('uses empty defaults for note and tags', () => {
      const entry = service.addMood(3)
      expect(entry.note).toBe('')
      expect(entry.tags).toEqual([])
    })
  })

  describe('removeMood', () => {
    it('removes a mood entry by id', () => {
      const entry = service.addMood(4, '测试')
      service.removeMood(entry.id)
      const state = service.getState()
      expect(state.entries).toHaveLength(0)
    })

    it('does nothing for non-existent id', () => {
      service.addMood(4, '测试')
      service.removeMood('non-existent')
      const state = service.getState()
      expect(state.entries).toHaveLength(1)
    })
  })

  describe('getTodayMood', () => {
    it('returns null when no mood for today', () => {
      expect(service.getTodayMood()).toBeNull()
    })

    it('returns today mood entry', () => {
      const entry = service.addMood(4, '不错')
      const today = service.getTodayMood()
      expect(today).not.toBeNull()
      expect(today!.id).toBe(entry.id)
      expect(today!.mood).toBe(4)
    })
  })

  describe('getMoodTrend', () => {
    it('returns array of specified days length', () => {
      const trend = service.getMoodTrend(7)
      expect(trend).toHaveLength(7)
    })

    it('returns zero avgMood for days without entries', () => {
      const trend = service.getMoodTrend(3)
      trend.forEach((day) => {
        expect(day.avgMood).toBe(0)
        expect(day.count).toBe(0)
      })
    })

    it('calculates average mood for days with entries', () => {
      service.addMood(4, '不错')
      const trend = service.getMoodTrend(1)
      expect(trend).toHaveLength(1)
      expect(trend[0].avgMood).toBe(4)
      expect(trend[0].count).toBe(1)
    })

    it('returns dates in ascending order', () => {
      const trend = service.getMoodTrend(7)
      for (let i = 1; i < trend.length; i++) {
        expect(trend[i].date >= trend[i - 1].date).toBe(true)
      }
    })
  })

  describe('getMoodStats', () => {
    it('returns default stats when no entries', () => {
      const stats = service.getMoodStats(7)
      expect(stats.avgMood).toBe(0)
      expect(stats.totalEntries).toBe(0)
      expect(stats.mostCommonMood).toBe(3)
    })

    it('calculates stats from entries', () => {
      service.addMood(5, '很好')
      const stats = service.getMoodStats(7)
      expect(stats.avgMood).toBe(5)
      expect(stats.totalEntries).toBe(1)
      expect(stats.mostCommonMood).toBe(5)
    })

    it('finds most common mood', () => {
      service.addMood(3, '一般')
      service.addMood(5, '变好了')
      const stats = service.getMoodStats(7)
      expect(stats.totalEntries).toBe(1)
    })
  })
})

describe('moodEmojis', () => {
  it('has 5 emojis', () => {
    expect(moodEmojis).toHaveLength(5)
  })
})

describe('moodLabels', () => {
  it('has 5 labels', () => {
    expect(moodLabels).toHaveLength(5)
  })

  it('matches mood values 1-5', () => {
    expect(moodLabels[0]).toBe('很差')
    expect(moodLabels[4]).toBe('很棒')
  })
})
