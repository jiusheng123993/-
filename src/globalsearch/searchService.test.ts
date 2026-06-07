import { describe, it, expect } from 'vitest'
import { createSearchService } from './searchService'

function mockState(overrides: Record<string, any> = {}) {
  return () => ({
    tasks: [],
    notes: [],
    goals: [],
    books: [],
    projects: [],
    habits: [],
    entries: [],
    transactions: [],
    ...overrides
  })
}

describe('searchService', () => {
  describe('search', () => {
    it('returns empty array for empty query', () => {
      const service = createSearchService(
        mockState(), mockState(), mockState(), mockState(),
        mockState(), mockState(), mockState(), mockState()
      )
      expect(service.search('')).toEqual([])
      expect(service.search('   ')).toEqual([])
    })

    it('searches tasks by title', () => {
      const service = createSearchService(
        mockState({
          tasks: [{ id: 't1', title: '完成报告', dueLabel: '今天', minutes: 30, createdAt: '2026-06-05T10:00:00.000Z' }]
        }),
        mockState(), mockState(), mockState(), mockState(), mockState(), mockState(), mockState()
      )
      const results = service.search('报告')
      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('task')
      expect(results[0].title).toBe('完成报告')
    })

    it('searches notes by title and content', () => {
      const service = createSearchService(
        mockState(),
        mockState({
          notes: [{ id: 'n1', title: '学习笔记', content: 'TypeScript 高级类型', createdAt: '2026-06-05T10:00:00.000Z' }]
        }),
        mockState(), mockState(), mockState(), mockState(), mockState(), mockState()
      )
      const byTitle = service.search('学习笔记')
      expect(byTitle).toHaveLength(1)

      const byContent = service.search('TypeScript')
      expect(byContent).toHaveLength(1)
    })

    it('searches goals by title', () => {
      const service = createSearchService(
        mockState(), mockState(), mockState(), mockState(), mockState(), mockState(),
        mockState({
          goals: [{ id: 'g1', title: '完成项目', progress: 60, createdAt: '2026-06-01T00:00:00.000Z' }]
        }),
        mockState()
      )
      const results = service.search('项目')
      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('goal')
      expect(results[0].description).toContain('60%')
    })

    it('searches books by title and author', () => {
      const service = createSearchService(
        mockState(), mockState(), mockState(), mockState(),
        mockState({
          books: [{ id: 'b1', title: '深入浅出', author: '张三', status: 'reading', addedAt: '2026-06-01T00:00:00.000Z' }]
        }),
        mockState(), mockState(), mockState()
      )
      const byTitle = service.search('深入')
      expect(byTitle).toHaveLength(1)

      const byAuthor = service.search('张三')
      expect(byAuthor).toHaveLength(1)
    })

    it('searches projects by name and description', () => {
      const service = createSearchService(
        mockState(), mockState(), mockState(), mockState(), mockState(), mockState(), mockState(),
        mockState({
          projects: [{ id: 'p1', name: '星寰海', description: '成长工作台', createdAt: '2026-06-01T00:00:00.000Z' }]
        })
      )
      const byName = service.search('星寰海')
      expect(byName).toHaveLength(1)

      const byDesc = service.search('工作台')
      expect(byDesc).toHaveLength(1)
    })

    it('searches habits by name', () => {
      const service = createSearchService(
        mockState(), mockState(),
        mockState({
          habits: [{ id: 'h1', name: '每日阅读', streak: 7, createdAt: '2026-06-01T00:00:00.000Z' }]
        }),
        mockState(), mockState(), mockState(), mockState(), mockState()
      )
      const results = service.search('阅读')
      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('habit')
      expect(results[0].description).toContain('7天')
    })

    it('searches journal entries by content', () => {
      const service = createSearchService(
        mockState(), mockState(), mockState(), mockState(), mockState(),
        mockState({
          entries: [{ id: 'j1', date: '2026-06-05', content: '今天完成了很多工作，感觉不错' }]
        }),
        mockState(), mockState()
      )
      const results = service.search('工作')
      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('journal')
    })

    it('searches finance transactions by description and category', () => {
      const service = createSearchService(
        mockState(), mockState(), mockState(),
        mockState({
          transactions: [{ id: 'f1', type: 'expense', amount: 100, category: '餐饮', description: '午餐', date: '2026-06-05T12:00:00.000Z' }]
        }),
        mockState(), mockState(), mockState(), mockState()
      )
      const byDesc = service.search('午餐')
      expect(byDesc).toHaveLength(1)

      const byCategory = service.search('餐饮')
      expect(byCategory).toHaveLength(1)
    })

    it('is case insensitive', () => {
      const service = createSearchService(
        mockState({
          tasks: [{ id: 't1', title: 'Hello World', createdAt: '2026-06-05T10:00:00.000Z' }]
        }),
        mockState(), mockState(), mockState(), mockState(), mockState(), mockState(), mockState()
      )
      const results = service.search('hello')
      expect(results).toHaveLength(1)
    })

    it('returns results from multiple sources', () => {
      const service = createSearchService(
        mockState({
          tasks: [{ id: 't1', title: '学习 TypeScript', createdAt: '2026-06-05T10:00:00.000Z' }]
        }),
        mockState({
          notes: [{ id: 'n1', title: 'TypeScript 笔记', content: '学习', createdAt: '2026-06-05T10:00:00.000Z' }]
        }),
        mockState(), mockState(), mockState(), mockState(), mockState(), mockState()
      )
      const results = service.search('TypeScript')
      expect(results).toHaveLength(2)
    })

    it('limits results to 50', () => {
      const tasks = Array.from({ length: 60 }, (_, i) => ({
        id: `t${i}`,
        title: `匹配任务 ${i}`,
        createdAt: '2026-06-05T10:00:00.000Z'
      }))
      const service = createSearchService(
        mockState({ tasks }),
        mockState(), mockState(), mockState(), mockState(), mockState(), mockState(), mockState()
      )
      const results = service.search('匹配')
      expect(results.length).toBeLessThanOrEqual(50)
    })

    it('handles null/undefined state fields gracefully', () => {
      const service = createSearchService(
        () => ({}),
        () => ({}),
        () => ({}),
        () => ({}),
        () => ({}),
        () => ({}),
        () => ({}),
        () => ({})
      )
      expect(() => service.search('test')).not.toThrow()
      expect(service.search('test')).toEqual([])
    })

    it('should search within note content', () => {
      const service = createSearchService(
        mockState(),
        mockState({
          notes: [{ id: '1', title: 'Meeting Notes', content: 'Discussed Q3 roadmap and budget allocation', createdAt: '2026-06-05T10:00:00.000Z' }]
        }),
        mockState(), mockState(), mockState(), mockState(), mockState(), mockState()
      )
      const results = service.search('budget')
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Meeting Notes')
    })

    it('should search within journal content', () => {
      const service = createSearchService(
        mockState(), mockState(), mockState(), mockState(), mockState(),
        mockState({
          entries: [{ id: 'j1', date: '2026-06-01', content: '今天学习了 React 18 的新特性，包括 Suspense 和 Concurrent Mode', mood: 'productive' }]
        }),
        mockState(), mockState()
      )
      const results = service.search('Suspense')
      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('journal')
    })

    it('should return snippet with match context', () => {
      const service = createSearchService(
        mockState(),
        mockState({
          notes: [{ id: '1', title: 'Notes', content: 'This is a very long content that contains the keyword somewhere in the middle of the text', createdAt: '2026-06-05T10:00:00.000Z' }]
        }),
        mockState(), mockState(), mockState(), mockState(), mockState(), mockState()
      )
      const results = service.search('keyword')
      expect(results).toHaveLength(1)
      expect(results[0].snippet).toContain('keyword')
    })

    it('should search habits by name and description', () => {
      const service = createSearchService(
        mockState(), mockState(),
        mockState({
          habits: [{ id: '1', name: '晨跑', description: '每天早上跑步30分钟', createdAt: '2026-06-01T00:00:00.000Z' }]
        }),
        mockState(), mockState(), mockState(), mockState(), mockState()
      )
      const results = service.search('跑步')
      expect(results).toHaveLength(1)
    })

    it('should search goals by description', () => {
      const service = createSearchService(
        mockState(), mockState(), mockState(), mockState(), mockState(), mockState(),
        mockState({
          goals: [{ id: '1', title: 'Q3 目标', description: '完成 React 项目重构', createdAt: '2026-06-01T00:00:00.000Z' }]
        }),
        mockState()
      )
      const results = service.search('重构')
      expect(results).toHaveLength(1)
    })
  })
})