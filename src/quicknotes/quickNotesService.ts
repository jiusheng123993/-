export interface QuickNote {
  id: string
  content: string
  tags: string[]
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface QuickNotesState {
  notes: QuickNote[]
}

const STORAGE_KEY = 'xinghuanhai-quicknotes-state'

function loadState(): QuickNotesState {
  if (typeof window === 'undefined') return { notes: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { notes: [] }
}

function saveState(state: QuickNotesState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export interface QuickNotesService {
  getState(): QuickNotesState
  addNote(content: string, tags?: string[]): QuickNote
  updateNote(id: string, content: string): void
  togglePin(id: string): void
  removeNote(id: string): void
  getPinnedNotes(): QuickNote[]
  getRecentNotes(limit?: number): QuickNote[]
  searchNotes(query: string): QuickNote[]
}

export function createQuickNotesService(): QuickNotesService {
  const getState = (): QuickNotesState => loadState()

  const save = (state: QuickNotesState): void => saveState(state)

  const addNote = (content: string, tags: string[] = []): QuickNote => {
    const state = getState()
    const now = new Date().toISOString()
    const note: QuickNote = {
      id: crypto.randomUUID(),
      content,
      tags,
      pinned: false,
      createdAt: now,
      updatedAt: now
    }
    save({ ...state, notes: [note, ...state.notes] })
    return note
  }

  const updateNote = (id: string, content: string): void => {
    const state = getState()
    save({
      ...state,
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n
      )
    })
  }

  const togglePin = (id: string): void => {
    const state = getState()
    save({
      ...state,
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n
      )
    })
  }

  const removeNote = (id: string): void => {
    const state = getState()
    save({ ...state, notes: state.notes.filter((n) => n.id !== id) })
  }

  const getPinnedNotes = (): QuickNote[] => {
    const state = getState()
    return state.notes.filter((n) => n.pinned)
  }

  const getRecentNotes = (limit: number = 10): QuickNote[] => {
    const state = getState()
    return state.notes.slice(0, limit)
  }

  const searchNotes = (query: string): QuickNote[] => {
    const state = getState()
    const lowerQuery = query.toLowerCase()
    return state.notes.filter(
      (n) =>
        n.content.toLowerCase().includes(lowerQuery) ||
        n.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    )
  }

  return {
    getState,
    addNote,
    updateNote,
    togglePin,
    removeNote,
    getPinnedNotes,
    getRecentNotes,
    searchNotes
  }
}