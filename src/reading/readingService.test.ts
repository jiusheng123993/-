import { describe, it, expect, beforeEach } from 'vitest'
import { createReadingService, readingCategories } from './readingService'
import type { ReadingService } from './readingService'

describe('readingService', () => {
  let service: ReadingService

  beforeEach(() => {
    localStorage.clear()
    service = createReadingService()
  })

  describe('categories', () => {
    it('has book categories', () => {
      expect(readingCategories.length).toBeGreaterThan(0)
      expect(readingCategories).toContain('技术')
      expect(readingCategories).toContain('文学')
    })
  })

  describe('books', () => {
    it('adds a book', () => {
      const book = service.addBook('深入浅出React', '张三', 350, '技术')
      expect(book.title).toBe('深入浅出React')
      expect(book.author).toBe('张三')
      expect(book.totalPages).toBe(350)
      expect(book.currentPage).toBe(0)
      expect(book.status).toBe('to-read')
      expect(book.id).toBeTruthy()
    })

    it('updates book progress', () => {
      const book = service.addBook('深入浅出React', '张三', 350, '技术')
      service.updateBookProgress(book.id, 100)
      const state = service.getState()
      expect(state.books[0].currentPage).toBe(100)
      expect(state.books[0].status).toBe('reading')
    })

    it('caps progress at total pages', () => {
      const book = service.addBook('深入浅出React', '张三', 350, '技术')
      service.updateBookProgress(book.id, 400)
      const state = service.getState()
      expect(state.books[0].currentPage).toBe(350)
      expect(state.books[0].status).toBe('completed')
    })

    it('updates book status', () => {
      const book = service.addBook('深入浅出React', '张三', 350, '技术')
      service.updateBookStatus(book.id, 'reading')
      expect(service.getState().books[0].status).toBe('reading')
    })

    it('rates a book', () => {
      const book = service.addBook('深入浅出React', '张三', 350, '技术')
      service.rateBook(book.id, 5)
      expect(service.getState().books[0].rating).toBe(5)
    })

    it('caps rating between 1 and 5', () => {
      const book = service.addBook('深入浅出React', '张三', 350, '技术')
      service.rateBook(book.id, 10)
      expect(service.getState().books[0].rating).toBe(5)

      service.rateBook(book.id, 0)
      expect(service.getState().books[0].rating).toBe(1)
    })

    it('removes a book and its notes', () => {
      const book = service.addBook('深入浅出React', '张三', 350, '技术')
      service.addNote(book.id, 50, '测试笔记')
      service.removeBook(book.id)
      const state = service.getState()
      expect(state.books).toHaveLength(0)
      expect(state.notes).toHaveLength(0)
    })

    it('persists books across service instances', () => {
      service.addBook('深入浅出React', '张三', 350, '技术')
      const service2 = createReadingService()
      expect(service2.getState().books).toHaveLength(1)
    })
  })

  describe('notes', () => {
    it('adds a note to a book', () => {
      const book = service.addBook('深入浅出React', '张三', 350, '技术')
      const note = service.addNote(book.id, 50, '这是第一章的笔记')
      expect(note.content).toBe('这是第一章的笔记')
      expect(note.page).toBe(50)
      expect(note.bookId).toBe(book.id)
    })

    it('removes a note', () => {
      const book = service.addBook('深入浅出React', '张三', 350, '技术')
      const note = service.addNote(book.id, 50, '测试笔记')
      service.removeNote(note.id)
      expect(service.getState().notes).toHaveLength(0)
    })
  })

  describe('goals', () => {
    it('sets a reading goal', () => {
      service.setReadingGoal(2026, 20)
      const state = service.getState()
      expect(state.goals).toHaveLength(1)
      expect(state.goals[0].year).toBe(2026)
      expect(state.goals[0].targetBooks).toBe(20)
    })

    it('updates existing goal', () => {
      service.setReadingGoal(2026, 20)
      service.setReadingGoal(2026, 30)
      const state = service.getState()
      expect(state.goals).toHaveLength(1)
      expect(state.goals[0].targetBooks).toBe(30)
    })
  })

  describe('stats', () => {
    it('calculates reading stats', () => {
      service.addBook('书1', '作者1', 100, '技术')
      service.addBook('书2', '作者2', 200, '文学')
      const stats = service.getReadingStats()
      expect(stats.totalBooks).toBe(2)
      expect(stats.reading).toBe(0)
      expect(stats.completed).toBe(0)
    })

    it('calculates goal progress', () => {
      service.setReadingGoal(2026, 10)
      const progress = service.getGoalProgress(2026)
      expect(progress.target).toBe(10)
      expect(progress.completed).toBe(0)
      expect(progress.percent).toBe(0)
    })

    it('calculates average rating', () => {
      const book1 = service.addBook('书1', '作者1', 100, '技术')
      const book2 = service.addBook('书2', '作者2', 200, '文学')
      service.updateBookProgress(book1.id, 100)
      service.updateBookProgress(book2.id, 200)
      service.rateBook(book1.id, 4)
      service.rateBook(book2.id, 5)
      const stats = service.getReadingStats()
      expect(stats.avgRating).toBe(4.5)
    })
  })
})