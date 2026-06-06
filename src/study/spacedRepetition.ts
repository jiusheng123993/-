import type { ReviewItem } from '../data/localStudyStore'

export interface SpacedRepetitionResult {
  nextInterval: number
  nextDueDate: string
  easeFactor: number
}

export const DEFAULT_EASE_FACTOR = 2.5
export const MIN_EASE_FACTOR = 1.3

export function calculateNextReview(
  item: ReviewItem,
  quality: 0 | 1 | 2 | 3 | 4 | 5
): SpacedRepetitionResult {
  let { interval, easeFactor, reviewCount } = item
  
  easeFactor = easeFactor || DEFAULT_EASE_FACTOR
  interval = interval || 1
  reviewCount = reviewCount || 0

  if (quality < 3) {
    interval = 1
  } else {
    if (reviewCount === 0) {
      interval = 1
    } else if (reviewCount === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor)

  const nextDueDate = new Date()
  nextDueDate.setDate(nextDueDate.getDate() + interval)

  return {
    nextInterval: interval,
    nextDueDate: nextDueDate.toISOString().slice(0, 10),
    easeFactor
  }
}

export function getDueReviews(reviews: ReviewItem[]): ReviewItem[] {
  const today = new Date().toISOString().slice(0, 10)
  return reviews
    .filter(r => r.dueDate <= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function getUpcomingReviews(reviews: ReviewItem[], days: number = 7): ReviewItem[] {
  const today = new Date()
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + days)
  const futureStr = futureDate.toISOString().slice(0, 10)
  const todayStr = today.toISOString().slice(0, 10)

  return reviews
    .filter(r => r.dueDate > todayStr && r.dueDate <= futureStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function getReviewStats(reviews: ReviewItem[]): {
  dueToday: number
  dueThisWeek: number
  total: number
  mastered: number
  learning: number
} {
  const today = new Date().toISOString().slice(0, 10)
  const weekLater = new Date()
  weekLater.setDate(weekLater.getDate() + 7)
  const weekLaterStr = weekLater.toISOString().slice(0, 10)

  const dueToday = reviews.filter(r => r.dueDate <= today).length
  const dueThisWeek = reviews.filter(r => r.dueDate > today && r.dueDate <= weekLaterStr).length
  const mastered = reviews.filter(r => r.interval >= 21).length
  const learning = reviews.filter(r => r.interval < 21).length

  return {
    dueToday,
    dueThisWeek,
    total: reviews.length,
    mastered,
    learning
  }
}

export const QUALITY_LABELS: Record<number, string> = {
  0: '完全忘记',
  1: '记得一点点',
  2: '记得部分',
  3: '记得大部分',
  4: '记得很清楚',
  5: '完美记住'
}

export const QUALITY_COLORS: Record<number, string> = {
  0: '#ef4444',
  1: '#f97316',
  2: '#eab308',
  3: '#22c55e',
  4: '#10b981',
  5: '#059669'
}
