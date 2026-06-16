import { createStorageService } from '../data/storageFactory'

export interface Book {
  id: string
  title: string
  author: string
  totalPages: number
  currentPage: number
  status: 'to-read' | 'reading' | 'completed' | 'paused'
  category: string
  rating?: number
  notes: string[]
  startedAt?: string
  completedAt?: string
  addedAt: string
}

export interface ReadingNote {
  id: string
  bookId: string
  page: number
  content: string
  createdAt: string
}

export interface ReadingGoal {
  id: string
  year: number
  targetBooks: number
  completedBooks: number
}

export interface ReadingState {
  books: Book[]
  notes: ReadingNote[]
  goals: ReadingGoal[]
}

const storage = createStorageService<ReadingState>(
  'xinghuanhai-reading-state',
  { books: [], notes: [], goals: [] }
)

const BOOK_CATEGORIES = ['技术', '文学', '历史', '哲学', '商业', '心理', '科幻', '其他']

export const readingCategories = BOOK_CATEGORIES

export interface ReadingService {
  getState(): ReadingState
  addBook(title: string, author: string, totalPages: number, category: string): Book
  updateBookProgress(bookId: string, currentPage: number): void
  updateBookStatus(bookId: string, status: Book['status']): void
  rateBook(bookId: string, rating: number): void
  removeBook(bookId: string): void
  addNote(bookId: string, page: number, content: string): ReadingNote
  removeNote(noteId: string): void
  setReadingGoal(year: number, targetBooks: number): void
  getReadingStats(): { totalBooks: number; reading: number; completed: number; totalPages: number; avgRating: number | null }
  getGoalProgress(year: number): { target: number; completed: number; percent: number }
}

export function createReadingService(): ReadingService {
  const getState = (): ReadingState => storage.load()

  const save = (state: ReadingState): void => storage.save(state)

  const addBook = (title: string, author: string, totalPages: number, category: string): Book => {
    const state = getState()
    const book: Book = {
      id: crypto.randomUUID(),
      title,
      author,
      totalPages,
      currentPage: 0,
      status: 'to-read',
      category,
      notes: [],
      addedAt: new Date().toISOString()
    }
    save({ ...state, books: [...state.books, book] })
    return book
  }

  const updateBookProgress = (bookId: string, currentPage: number): void => {
    const state = getState()
    const books = state.books.map((b) => {
      if (b.id !== bookId) return b
      const newPage = Math.max(0, Math.min(currentPage, b.totalPages))
      const newStatus = newPage === 0 ? 'to-read' : newPage >= b.totalPages ? 'completed' : 'reading'
      return {
        ...b,
        currentPage: newPage,
        status: newStatus,
        startedAt: b.startedAt || (newPage > 0 ? new Date().toISOString() : undefined),
        completedAt: newStatus === 'completed' ? new Date().toISOString() : b.completedAt
      }
    })
    save({ ...state, books })
  }

  const updateBookStatus = (bookId: string, status: Book['status']): void => {
    const state = getState()
    const books = state.books.map((b) => {
      if (b.id !== bookId) return b
      return {
        ...b,
        status,
        startedAt: b.startedAt || (status === 'reading' ? new Date().toISOString() : undefined),
        completedAt: status === 'completed' ? new Date().toISOString() : b.completedAt
      }
    })
    save({ ...state, books })
  }

  const rateBook = (bookId: string, rating: number): void => {
    const state = getState()
    save({
      ...state,
      books: state.books.map((b) => (b.id === bookId ? { ...b, rating: Math.max(1, Math.min(5, rating)) } : b))
    })
  }

  const removeBook = (bookId: string): void => {
    const state = getState()
    save({
      ...state,
      books: state.books.filter((b) => b.id !== bookId),
      notes: state.notes.filter((n) => n.bookId !== bookId)
    })
  }

  const addNote = (bookId: string, page: number, content: string): ReadingNote => {
    const state = getState()
    const note: ReadingNote = {
      id: crypto.randomUUID(),
      bookId,
      page,
      content,
      createdAt: new Date().toISOString()
    }
    const books = state.books.map((b) => (b.id === bookId ? { ...b, notes: [...b.notes, note.id] } : b))
    save({ ...state, books, notes: [...state.notes, note] })
    return note
  }

  const removeNote = (noteId: string): void => {
    const state = getState()
    const note = state.notes.find((n) => n.id === noteId)
    const books = note
      ? state.books.map((b) => (b.id === note.bookId ? { ...b, notes: b.notes.filter((id) => id !== noteId) } : b))
      : state.books
    save({ ...state, books, notes: state.notes.filter((n) => n.id !== noteId) })
  }

  const setReadingGoal = (year: number, targetBooks: number): void => {
    const state = getState()
    const existing = state.goals.find((g) => g.year === year)
    if (existing) {
      save({
        ...state,
        goals: state.goals.map((g) => (g.year === year ? { ...g, targetBooks } : g))
      })
    } else {
      save({
        ...state,
        goals: [...state.goals, { id: crypto.randomUUID(), year, targetBooks, completedBooks: 0 }]
      })
    }
  }

  const getReadingStats = () => {
    const state = getState()
    const completed = state.books.filter((b) => b.status === 'completed')
    const rated = completed.filter((b) => b.rating)
    return {
      totalBooks: state.books.length,
      reading: state.books.filter((b) => b.status === 'reading').length,
      completed: completed.length,
      totalPages: state.books.reduce((sum, b) => sum + b.currentPage, 0),
      avgRating: rated.length > 0 ? rated.reduce((sum, b) => sum + (b.rating || 0), 0) / rated.length : null
    }
  }

  const getGoalProgress = (year: number) => {
    const state = getState()
    const goal = state.goals.find((g) => g.year === year)
    const completed = state.books.filter((b) => {
      if (b.status !== 'completed' || !b.completedAt) return false
      return new Date(b.completedAt).getFullYear() === year
    }).length

    if (!goal) return { target: 0, completed, percent: 0 }
    return {
      target: goal.targetBooks,
      completed,
      percent: goal.targetBooks > 0 ? Math.min(100, Math.round((completed / goal.targetBooks) * 100)) : 0
    }
  }

  return {
    getState,
    addBook,
    updateBookProgress,
    updateBookStatus,
    rateBook,
    removeBook,
    addNote,
    removeNote,
    setReadingGoal,
    getReadingStats,
    getGoalProgress
  }
}