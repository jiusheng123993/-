import { createStorageService } from '../data/storageFactory'

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

const storage = createStorageService<ErrorBookState>('xinghuanhai-errorbook-state', { items: [] })

export function getErrorItems(): ErrorItem[] {
  return storage.load().items
}

export function getErrorItemsBySubject(subject: string): ErrorItem[] {
  return storage.load().items.filter((item) => item.subject === subject)
}

export function getSubjects(): string[] {
  const items = storage.load().items
  const set = new Set(items.map((item) => item.subject))
  return Array.from(set).sort()
}

export function addErrorItem(item: Omit<ErrorItem, 'id' | 'createdAt'>): ErrorItem {
  const state = storage.load()
  const newItem: ErrorItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  state.items.unshift(newItem)
  storage.save(state)
  return newItem
}

export function updateErrorItem(id: string, updates: Partial<ErrorItem>): ErrorItem | null {
  const state = storage.load()
  const index = state.items.findIndex((item) => item.id === id)
  if (index === -1) return null
  state.items[index] = { ...state.items[index], ...updates }
  storage.save(state)
  return state.items[index]
}

export function deleteErrorItem(id: string): boolean {
  const state = storage.load()
  const index = state.items.findIndex((item) => item.id === id)
  if (index === -1) return false
  state.items.splice(index, 1)
  storage.save(state)
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
