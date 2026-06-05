export interface WatchItem {
  id: string
  title: string
  type: 'movie' | 'tv' | 'documentary'
  status: 'watching' | 'completed' | 'plan'
  rating?: number
  genre: string
  notes: string
  dateAdded: string
  dateCompleted?: string
}

const STORAGE_KEY = 'xinghuanhai-watchlist-state'

function loadState(): WatchItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveState(items: WatchItem[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export interface WatchListService {
  getItems(): WatchItem[]
  addItem(title: string, type: WatchItem['type'], genre: string): WatchItem
  updateStatus(id: string, status: WatchItem['status']): void
  rateItem(id: string, rating: number): void
  removeItem(id: string): void
  getStats(): { total: number; watching: number; completed: number; plan: number }
}

export function createWatchListService(): WatchListService {
  const getItems = (): WatchItem[] => loadState()

  const addItem = (title: string, type: WatchItem['type'], genre: string): WatchItem => {
    const items = getItems()
    const item: WatchItem = {
      id: crypto.randomUUID(),
      title,
      type,
      status: 'plan',
      genre,
      notes: '',
      dateAdded: new Date().toISOString()
    }
    saveState([item, ...items])
    return item
  }

  const updateStatus = (id: string, status: WatchItem['status']): void => {
    saveState(getItems().map((i) => (i.id === id ? { ...i, status, dateCompleted: status === 'completed' ? new Date().toISOString() : undefined } : i)))
  }

  const rateItem = (id: string, rating: number): void => {
    saveState(getItems().map((i) => (i.id === id ? { ...i, rating: Math.max(1, Math.min(5, rating)) } : i)))
  }

  const removeItem = (id: string): void => saveState(getItems().filter((i) => i.id !== id))

  const getStats = () => {
    const items = getItems()
    return {
      total: items.length,
      watching: items.filter((i) => i.status === 'watching').length,
      completed: items.filter((i) => i.status === 'completed').length,
      plan: items.filter((i) => i.status === 'plan').length
    }
  }

  return { getItems, addItem, updateStatus, rateItem, removeItem, getStats }
}