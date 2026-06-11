export interface ErrorItem {
  id: string
  question: string
  questionImage?: string
  wrongAnswer: string
  correctAnswer?: string
  subject: string
  tags: string[]
  mastered?: boolean
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

export interface SubjectStats {
  subject: string
  total: number
  unmastered: number
  mastered: number
  masteryRate: number
}

export interface ErrorBookStats {
  total: number
  mastered: number
  unmastered: number
  masteryRate: number
  bySubject: SubjectStats[]
  topTags: { tag: string; count: number }[]
}

export function getErrorStats(): ErrorBookStats {
  const items = loadState().items
  const total = items.length
  const mastered = items.filter(i => i.mastered).length
  const unmastered = total - mastered
  const masteryRate = total > 0 ? Math.round((mastered / total) * 100) : 0

  const subjectMap = new Map<string, { total: number; mastered: number }>()
  for (const item of items) {
    const entry = subjectMap.get(item.subject) || { total: 0, mastered: 0 }
    entry.total++
    if (item.mastered) entry.mastered++
    subjectMap.set(item.subject, entry)
  }
  const bySubject: SubjectStats[] = Array.from(subjectMap.entries())
    .map(([subject, data]) => ({
      subject,
      total: data.total,
      unmastered: data.total - data.mastered,
      mastered: data.mastered,
      masteryRate: Math.round((data.mastered / data.total) * 100)
    }))
    .sort((a, b) => b.total - a.total)

  const tagCounts = new Map<string, number>()
  for (const item of items) {
    for (const tag of item.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return { total, mastered, unmastered, masteryRate, bySubject, topTags }
}
