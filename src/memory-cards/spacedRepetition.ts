export interface SpacedRepetitionResult {
  nextInterval: number
  nextDueDate: string
  easeFactor: number
}

export const DEFAULT_EASE_FACTOR = 2.5
export const MIN_EASE_FACTOR = 1.3

export function calculateNextReview(
  item: { interval: number; easeFactor: number; reviewCount: number },
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

  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )

  const nextDueDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString()

  return { nextInterval: interval, nextDueDate, easeFactor }
}
