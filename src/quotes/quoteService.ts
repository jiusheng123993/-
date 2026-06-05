export interface Quote {
  id: string
  content: string
  author: string
  source?: string
  tags: string[]
  favorite: boolean
  createdAt: string
}

const STORAGE_KEY = 'xinghuanhai-quotes-state'

function loadState(): Quote[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function saveState(quotes: Quote[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes))
}

export interface QuoteService {
  getQuotes(): Quote[]
  addQuote(content: string, author: string, source?: string, tags?: string[]): Quote
  removeQuote(id: string): void
  toggleFavorite(id: string): void
  getFavorites(): Quote[]
  searchQuotes(query: string): Quote[]
}

export function createQuoteService(): QuoteService {
  const getQuotes = (): Quote[] => loadState()

  const save = (quotes: Quote[]): void => saveState(quotes)

  const addQuote = (content: string, author: string, source?: string, tags: string[] = []): Quote => {
    const quotes = getQuotes()
    const quote: Quote = {
      id: crypto.randomUUID(),
      content,
      author,
      source,
      tags,
      favorite: false,
      createdAt: new Date().toISOString()
    }
    save([quote, ...quotes])
    return quote
  }

  const removeQuote = (id: string): void => {
    save(getQuotes().filter((q) => q.id !== id))
  }

  const toggleFavorite = (id: string): void => {
    save(getQuotes().map((q) => (q.id === id ? { ...q, favorite: !q.favorite } : q)))
  }

  const getFavorites = (): Quote[] => getQuotes().filter((q) => q.favorite)

  const searchQuotes = (query: string): Quote[] => {
    const lower = query.toLowerCase()
    return getQuotes().filter(
      (q) =>
        q.content.toLowerCase().includes(lower) ||
        q.author.toLowerCase().includes(lower) ||
        q.tags.some((t) => t.toLowerCase().includes(lower))
    )
  }

  return { getQuotes, addQuote, removeQuote, toggleFavorite, getFavorites, searchQuotes }
}