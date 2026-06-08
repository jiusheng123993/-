export interface ErrorItem {
  id: string
  question: string
  wrongAnswer: string
  subject: string
  tags: string[]
  aiAnalysis?: string
  aiSolution?: string
  aiSimilarQuestions?: { question: string; answer: string }[]
  createdAt: string
}

export interface ErrorBookState {
  items: ErrorItem[]
}

const STORAGE_KEY = 'xinghuanhai-errorbook-state'

function loadState(): ErrorBookState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { items: [] }
}

function saveState(state: ErrorBookState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getErrorItems(): ErrorItem[] {
  return loadState().items
}

export function getErrorItemsBySubject(subject: string): ErrorItem[] {
  return loadState().items.filter((item) => item.subject === subject)
}

export function getSubjects(): string[] {
  const items = loadState().items
  const set = new Set(items.map((item) => item.subject))
  return Array.from(set).sort()
}

export function addErrorItem(item: Omit<ErrorItem, 'id' | 'createdAt'>): ErrorItem {
  const state = loadState()
  const newItem: ErrorItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  state.items.unshift(newItem)
  saveState(state)
  return newItem
}

export function updateErrorItem(id: string, updates: Partial<ErrorItem>): ErrorItem | null {
  const state = loadState()
  const index = state.items.findIndex((item) => item.id === id)
  if (index === -1) return null
  state.items[index] = { ...state.items[index], ...updates }
  saveState(state)
  return state.items[index]
}

export function deleteErrorItem(id: string): boolean {
  const state = loadState()
  const index = state.items.findIndex((item) => item.id === id)
  if (index === -1) return false
  state.items.splice(index, 1)
  saveState(state)
  return true
}
