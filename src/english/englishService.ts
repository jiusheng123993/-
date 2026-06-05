export interface EnglishWord {
  id: string
  word: string
  meaning: string
  example: string
  pronunciation?: string
  mastered: boolean
  reviewCount: number
  nextReview: string
  createdAt: string
}

export interface EnglishNote {
  id: string
  title: string
  content: string
  type: 'vocabulary' | 'grammar' | 'sentence'
  createdAt: string
}

const WORDS_KEY = 'xinghuanhai-english-words'
const NOTES_KEY = 'xinghuanhai-english-notes'

function loadWords(): EnglishWord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(WORDS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveWords(words: EnglishWord[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(WORDS_KEY, JSON.stringify(words))
}

function loadNotes(): EnglishNote[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(NOTES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveNotes(notes: EnglishNote[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}

export interface EnglishService {
  getWords(): EnglishWord[]
  addWord(word: string, meaning: string, example: string, pronunciation?: string): EnglishWord
  removeWord(id: string): void
  toggleMastered(id: string): void
  getWordsForReview(): EnglishWord[]
  getNotes(): EnglishNote[]
  addNote(title: string, content: string, type: EnglishNote['type']): EnglishNote
  removeNote(id: string): void
}

export function createEnglishService(): EnglishService {
  const getWords = (): EnglishWord[] => loadWords()
  const getNotes = (): EnglishNote[] => loadNotes()

  const addWord = (word: string, meaning: string, example: string, pronunciation?: string): EnglishWord => {
    const words = getWords()
    const newWord: EnglishWord = {
      id: crypto.randomUUID(),
      word,
      meaning,
      example,
      pronunciation,
      mastered: false,
      reviewCount: 0,
      nextReview: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    saveWords([newWord, ...words])
    return newWord
  }

  const removeWord = (id: string): void => saveWords(getWords().filter((w) => w.id !== id))

  const toggleMastered = (id: string): void => {
    saveWords(getWords().map((w) => (w.id === id ? { ...w, mastered: !w.mastered } : w)))
  }

  const getWordsForReview = (): EnglishWord[] => {
    const now = new Date().toISOString()
    return getWords().filter((w) => !w.mastered && w.nextReview <= now)
  }

  const addNote = (title: string, content: string, type: EnglishNote['type']): EnglishNote => {
    const notes = getNotes()
    const note: EnglishNote = { id: crypto.randomUUID(), title, content, type, createdAt: new Date().toISOString() }
    saveNotes([note, ...notes])
    return note
  }

  const removeNote = (id: string): void => saveNotes(getNotes().filter((n) => n.id !== id))

  return { getWords, addWord, removeWord, toggleMastered, getWordsForReview, getNotes, addNote, removeNote }
}