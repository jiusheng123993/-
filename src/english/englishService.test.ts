import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEnglishService } from './englishService'
import type { EnglishService } from './englishService'

const WORDS_KEY = 'xinghuanhai-english-words'
const NOTES_KEY = 'xinghuanhai-english-notes'

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

describe('englishService', () => {
  let service: EnglishService
  let storage: ReturnType<typeof mockLocalStorage>

  beforeEach(() => {
    storage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', { value: storage, writable: true })
    service = createEnglishService()
  })

  describe('getWords', () => {
    it('returns empty array initially', () => {
      expect(service.getWords()).toEqual([])
    })

    it('returns words from localStorage', () => {
      const word = {
        id: 'w1',
        word: 'hello',
        meaning: '你好',
        example: 'Hello world',
        mastered: false,
        reviewCount: 0,
        nextReview: '2026-06-05T00:00:00.000Z',
        createdAt: '2026-06-05T00:00:00.000Z'
      }
      storage.getItem.mockImplementation((key: string) => {
        if (key === WORDS_KEY) return JSON.stringify([word])
        return null
      })
      service = createEnglishService()
      expect(service.getWords()).toHaveLength(1)
    })
  })

  describe('addWord', () => {
    it('adds a new word', () => {
      const word = service.addWord('hello', '你好', 'Hello world', 'həˈloʊ')
      expect(word.word).toBe('hello')
      expect(word.meaning).toBe('你好')
      expect(word.example).toBe('Hello world')
      expect(word.pronunciation).toBe('həˈloʊ')
      expect(word.mastered).toBe(false)
      expect(word.reviewCount).toBe(0)
      expect(word.id).toBeTruthy()
    })

    it('adds word without pronunciation', () => {
      const word = service.addWord('test', '测试', 'This is a test')
      expect(word.pronunciation).toBeUndefined()
    })

    it('prepends new word to the list', () => {
      service.addWord('first', '第一', 'First word')
      service.addWord('second', '第二', 'Second word')
      const words = service.getWords()
      expect(words[0].word).toBe('second')
      expect(words[1].word).toBe('first')
    })

    it('persists to localStorage', () => {
      service.addWord('hello', '你好', 'Hello')
      expect(storage.setItem).toHaveBeenCalledWith(WORDS_KEY, expect.any(String))
    })
  })

  describe('removeWord', () => {
    it('removes a word by id', () => {
      const word = service.addWord('hello', '你好', 'Hello')
      service.removeWord(word.id)
      expect(service.getWords()).toHaveLength(0)
    })

    it('does nothing for non-existent id', () => {
      service.addWord('hello', '你好', 'Hello')
      service.removeWord('non-existent')
      expect(service.getWords()).toHaveLength(1)
    })
  })

  describe('toggleMastered', () => {
    it('toggles mastered from false to true', () => {
      const word = service.addWord('hello', '你好', 'Hello')
      service.toggleMastered(word.id)
      const words = service.getWords()
      expect(words[0].mastered).toBe(true)
    })

    it('toggles mastered from true to false', () => {
      const word = service.addWord('hello', '你好', 'Hello')
      service.toggleMastered(word.id)
      service.toggleMastered(word.id)
      const words = service.getWords()
      expect(words[0].mastered).toBe(false)
    })
  })

  describe('getWordsForReview', () => {
    it('returns words that are not mastered and due for review', () => {
      service.addWord('hello', '你好', 'Hello')
      const reviewWords = service.getWordsForReview()
      expect(reviewWords).toHaveLength(1)
    })

    it('excludes mastered words', () => {
      const word = service.addWord('hello', '你好', 'Hello')
      service.toggleMastered(word.id)
      const reviewWords = service.getWordsForReview()
      expect(reviewWords).toHaveLength(0)
    })
  })

  describe('getNotes', () => {
    it('returns empty array initially', () => {
      expect(service.getNotes()).toEqual([])
    })
  })

  describe('addNote', () => {
    it('adds a new note', () => {
      const note = service.addNote('语法笔记', '过去式用法', 'grammar')
      expect(note.title).toBe('语法笔记')
      expect(note.content).toBe('过去式用法')
      expect(note.type).toBe('grammar')
      expect(note.id).toBeTruthy()
    })

    it('prepends new note to the list', () => {
      service.addNote('笔记1', '内容1', 'vocabulary')
      service.addNote('笔记2', '内容2', 'sentence')
      const notes = service.getNotes()
      expect(notes[0].title).toBe('笔记2')
      expect(notes[1].title).toBe('笔记1')
    })

    it('persists to localStorage', () => {
      service.addNote('笔记', '内容', 'vocabulary')
      expect(storage.setItem).toHaveBeenCalledWith(NOTES_KEY, expect.any(String))
    })
  })

  describe('removeNote', () => {
    it('removes a note by id', () => {
      const note = service.addNote('笔记', '内容', 'vocabulary')
      service.removeNote(note.id)
      expect(service.getNotes()).toHaveLength(0)
    })
  })
})