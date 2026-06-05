import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createQuoteService } from './quoteService'
import type { QuoteService } from './quoteService'

const STORAGE_KEY = 'xinghuanhai-quotes-state'

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

describe('quoteService', () => {
  let service: QuoteService
  let storage: ReturnType<typeof mockLocalStorage>

  beforeEach(() => {
    storage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', { value: storage, writable: true })
    service = createQuoteService()
  })

  describe('getQuotes', () => {
    it('returns empty array initially', () => {
      expect(service.getQuotes()).toEqual([])
    })

    it('returns quotes from localStorage', () => {
      const quote = {
        id: 'q1',
        content: '学而时习之',
        author: '孔子',
        tags: ['学习'],
        favorite: false,
        createdAt: '2026-06-01T00:00:00.000Z'
      }
      storage.getItem.mockReturnValue(JSON.stringify([quote]))
      service = createQuoteService()
      expect(service.getQuotes()).toHaveLength(1)
    })

    it('handles corrupted JSON gracefully', () => {
      storage.getItem.mockReturnValue('bad')
      service = createQuoteService()
      expect(service.getQuotes()).toEqual([])
    })
  })

  describe('addQuote', () => {
    it('adds a new quote', () => {
      const quote = service.addQuote('知行合一', '王阳明', '传习录', ['哲学', '实践'])
      expect(quote.content).toBe('知行合一')
      expect(quote.author).toBe('王阳明')
      expect(quote.source).toBe('传习录')
      expect(quote.tags).toEqual(['哲学', '实践'])
      expect(quote.favorite).toBe(false)
      expect(quote.id).toBeTruthy()
    })

    it('adds quote without source and with default tags', () => {
      const quote = service.addQuote('学无止境', '未知')
      expect(quote.source).toBeUndefined()
      expect(quote.tags).toEqual([])
    })

    it('prepends new quote to the list', () => {
      service.addQuote('第一句', '作者1')
      service.addQuote('第二句', '作者2')
      const quotes = service.getQuotes()
      expect(quotes[0].content).toBe('第二句')
      expect(quotes[1].content).toBe('第一句')
    })

    it('persists to localStorage', () => {
      service.addQuote('测试', '作者')
      expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String))
    })
  })

  describe('removeQuote', () => {
    it('removes a quote by id', () => {
      const quote = service.addQuote('待删除', '作者')
      service.removeQuote(quote.id)
      expect(service.getQuotes()).toHaveLength(0)
    })

    it('does nothing for non-existent id', () => {
      service.addQuote('保留', '作者')
      service.removeQuote('non-existent')
      expect(service.getQuotes()).toHaveLength(1)
    })
  })

  describe('toggleFavorite', () => {
    it('toggles favorite from false to true', () => {
      const quote = service.addQuote('名言', '作者')
      service.toggleFavorite(quote.id)
      const quotes = service.getQuotes()
      expect(quotes[0].favorite).toBe(true)
    })

    it('toggles favorite from true to false', () => {
      const quote = service.addQuote('名言', '作者')
      service.toggleFavorite(quote.id)
      service.toggleFavorite(quote.id)
      const quotes = service.getQuotes()
      expect(quotes[0].favorite).toBe(false)
    })
  })

  describe('getFavorites', () => {
    it('returns only favorited quotes', () => {
      const q1 = service.addQuote('收藏的', '作者1')
      service.addQuote('未收藏', '作者2')
      service.toggleFavorite(q1.id)
      const favorites = service.getFavorites()
      expect(favorites).toHaveLength(1)
      expect(favorites[0].content).toBe('收藏的')
    })

    it('returns empty array when no favorites', () => {
      service.addQuote('未收藏', '作者')
      expect(service.getFavorites()).toEqual([])
    })
  })

  describe('searchQuotes', () => {
    it('searches by content', () => {
      service.addQuote('知行合一', '王阳明')
      service.addQuote('学无止境', '未知')
      const results = service.searchQuotes('知行')
      expect(results).toHaveLength(1)
      expect(results[0].content).toBe('知行合一')
    })

    it('searches by author', () => {
      service.addQuote('名言1', '孔子')
      service.addQuote('名言2', '老子')
      const results = service.searchQuotes('孔子')
      expect(results).toHaveLength(1)
      expect(results[0].author).toBe('孔子')
    })

    it('searches by tags', () => {
      service.addQuote('名言', '作者', undefined, ['哲学'])
      service.addQuote('名言2', '作者2', undefined, ['科学'])
      const results = service.searchQuotes('哲学')
      expect(results).toHaveLength(1)
    })

    it('is case insensitive', () => {
      service.addQuote('Hello World', 'Author')
      const results = service.searchQuotes('hello')
      expect(results).toHaveLength(1)
    })

    it('returns empty array when no match', () => {
      service.addQuote('名言', '作者')
      const results = service.searchQuotes('不存在的')
      expect(results).toEqual([])
    })
  })
})