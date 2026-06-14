export interface ReviewItem {
  id: string
  userId: string
  title: string
  subject: string | null
  dueDate: string | null
  level: string
  interval: number
  easeFactor: number
  reviewCount: number
  lastReviewDate: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateReviewInput {
  userId: string
  title: string
  subject?: string
  dueDate?: string
  level?: string
}

export interface UpdateReviewInput {
  title?: string
  subject?: string
  dueDate?: string
  level?: string
  interval?: number
  easeFactor?: number
  reviewCount?: number
  lastReviewDate?: string
}

export interface ReviewStore {
  findByUserId: (userId: string) => Promise<ReviewItem[]>
  create: (input: CreateReviewInput) => Promise<ReviewItem>
  update: (id: string, patch: UpdateReviewInput) => Promise<ReviewItem>
  delete: (id: string) => Promise<void>
}

function generateId(): string {
  return `review_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function now(): string {
  return new Date().toISOString()
}

export function createLocalReviewStore(storageKey = 'xinghuanhai-review-state'): ReviewStore {
  const loadAll = (): ReviewItem[] => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return []
      return JSON.parse(raw) as ReviewItem[]
    } catch {
      return []
    }
  }

  const saveAll = (items: ReviewItem[]) => {
    localStorage.setItem(storageKey, JSON.stringify(items))
  }

  return {
    async findByUserId(userId: string) {
      const all = loadAll()
      return all
        .filter((item) => item.userId === userId)
        .sort((a, b) => {
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return a.dueDate.localeCompare(b.dueDate)
        })
    },

    async create(input: CreateReviewInput) {
      const all = loadAll()
      const timestamp = now()
      const item: ReviewItem = {
        id: generateId(),
        userId: input.userId,
        title: input.title,
        subject: input.subject ?? null,
        dueDate: input.dueDate ?? null,
        level: input.level ?? 'medium',
        interval: 0,
        easeFactor: 2.5,
        reviewCount: 0,
        lastReviewDate: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      all.push(item)
      saveAll(all)
      return item
    },

    async update(id: string, patch: UpdateReviewInput) {
      const all = loadAll()
      const index = all.findIndex((item) => item.id === id)
      if (index === -1) throw new Error(`Review item not found: ${id}`)
      all[index] = { ...all[index], ...patch, updatedAt: now() }
      saveAll(all)
      return all[index]
    },

    async delete(id: string) {
      const all = loadAll()
      const filtered = all.filter((item) => item.id !== id)
      saveAll(filtered)
    },
  }
}
