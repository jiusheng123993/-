import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createWatchListService } from './watchListService'
import type { WatchListService } from './watchListService'

const STORAGE_KEY = 'xinghuanhai-watchlist-state'

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

describe('watchListService', () => {
  let service: WatchListService
  let storage: ReturnType<typeof mockLocalStorage>

  beforeEach(() => {
    storage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', { value: storage, writable: true })
    service = createWatchListService()
  })

  describe('getItems', () => {
    it('returns empty array initially', () => {
      expect(service.getItems()).toEqual([])
    })

    it('returns items from localStorage', () => {
      const item = {
        id: 'w1',
        title: 'Inception',
        type: 'movie',
        status: 'completed',
        rating: 5,
        genre: '科幻',
        notes: '经典',
        dateAdded: '2026-06-01T00:00:00.000Z'
      }
      storage.getItem.mockReturnValue(JSON.stringify([item]))
      service = createWatchListService()
      expect(service.getItems()).toHaveLength(1)
    })

    it('handles corrupted JSON gracefully', () => {
      storage.getItem.mockReturnValue('bad-data')
      service = createWatchListService()
      expect(service.getItems()).toEqual([])
    })
  })

  describe('addItem', () => {
    it('adds a new watch item', () => {
      const item = service.addItem('Inception', 'movie', '科幻')
      expect(item.title).toBe('Inception')
      expect(item.type).toBe('movie')
      expect(item.genre).toBe('科幻')
      expect(item.status).toBe('plan')
      expect(item.notes).toBe('')
      expect(item.id).toBeTruthy()
    })

    it('prepends new item to the list', () => {
      service.addItem('First', 'movie', '动作')
      service.addItem('Second', 'tv', '喜剧')
      const items = service.getItems()
      expect(items[0].title).toBe('Second')
      expect(items[1].title).toBe('First')
    })

    it('persists to localStorage', () => {
      service.addItem('Test', 'movie', '测试')
      expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String))
    })
  })

  describe('updateStatus', () => {
    it('updates item status', () => {
      const item = service.addItem('Test', 'movie', '测试')
      service.updateStatus(item.id, 'watching')
      const items = service.getItems()
      expect(items[0].status).toBe('watching')
    })

    it('sets dateCompleted when status is completed', () => {
      const item = service.addItem('Test', 'movie', '测试')
      service.updateStatus(item.id, 'completed')
      const items = service.getItems()
      expect(items[0].status).toBe('completed')
      expect(items[0].dateCompleted).toBeTruthy()
    })

    it('removes dateCompleted when status is not completed', () => {
      const item = service.addItem('Test', 'movie', '测试')
      service.updateStatus(item.id, 'completed')
      service.updateStatus(item.id, 'watching')
      const items = service.getItems()
      expect(items[0].dateCompleted).toBeUndefined()
    })
  })

  describe('rateItem', () => {
    it('sets rating on an item', () => {
      const item = service.addItem('Test', 'movie', '测试')
      service.rateItem(item.id, 4)
      const items = service.getItems()
      expect(items[0].rating).toBe(4)
    })

    it('clamps rating to minimum 1', () => {
      const item = service.addItem('Test', 'movie', '测试')
      service.rateItem(item.id, 0)
      const items = service.getItems()
      expect(items[0].rating).toBe(1)
    })

    it('clamps rating to maximum 5', () => {
      const item = service.addItem('Test', 'movie', '测试')
      service.rateItem(item.id, 10)
      const items = service.getItems()
      expect(items[0].rating).toBe(5)
    })
  })

  describe('removeItem', () => {
    it('removes an item by id', () => {
      const item = service.addItem('Test', 'movie', '测试')
      service.removeItem(item.id)
      expect(service.getItems()).toHaveLength(0)
    })

    it('does nothing for non-existent id', () => {
      service.addItem('Test', 'movie', '测试')
      service.removeItem('non-existent')
      expect(service.getItems()).toHaveLength(1)
    })
  })

  describe('getStats', () => {
    it('returns zero stats initially', () => {
      const stats = service.getStats()
      expect(stats.total).toBe(0)
      expect(stats.watching).toBe(0)
      expect(stats.completed).toBe(0)
      expect(stats.plan).toBe(0)
    })

    it('counts items by status', () => {
      const item1 = service.addItem('Movie 1', 'movie', '动作')
      const item2 = service.addItem('Movie 2', 'movie', '喜剧')
      service.updateStatus(item1.id, 'watching')
      service.updateStatus(item2.id, 'completed')
      const stats = service.getStats()
      expect(stats.total).toBe(2)
      expect(stats.watching).toBe(1)
      expect(stats.completed).toBe(1)
      expect(stats.plan).toBe(0)
    })

    it('counts plan items correctly', () => {
      service.addItem('Plan 1', 'movie', '动作')
      service.addItem('Plan 2', 'tv', '喜剧')
      const stats = service.getStats()
      expect(stats.plan).toBe(2)
    })
  })
})