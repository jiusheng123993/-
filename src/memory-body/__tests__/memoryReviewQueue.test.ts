import { describe, it, expect } from 'vitest'
import {
  computeReviewPriority,
  createReviewQueue,
  addToReviewQueue,
  batchAddToReviewQueue,
  reviewQueueItem,
  getReviewQueueStats,
  getPendingItems,
  autoExpireReviewItems,
  cleanProcessedItems,
  summarizeReviewQueue
} from '../review/memoryReviewQueue'
import type { ReviewQueue, ReviewItem } from '../review/memoryReviewQueue'
import type { MemoryAtom } from '../core/memoryBodyTypes'

function makeAtom(overrides: Partial<MemoryAtom> & { id: string }): MemoryAtom {
  return {
    scope: { userId: 'u1', projectId: 'p1' },
    layer: 'semantic',
    type: 'preference',
    subject: 'user',
    predicate: 'likes',
    object: 'coffee',
    content: '用户喜欢咖啡',
    source: 'chat',
    confidence: 0.8,
    strength: 0.7,
    emotionalWeight: 0.3,
    sensitivity: 'personal',
    lifecycle: 'active',
    evidence: [],
    tags: [],
    scenarios: ['chat'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    lastAccessedAt: '2026-01-01T00:00:00.000Z',
    accessCount: 1,
    contradictionOf: [],
    ...overrides
  }
}

function makeQueue(overrides?: Partial<ReviewQueue>): ReviewQueue {
  return {
    id: 'test-queue',
    scope: { userId: 'u1', projectId: 'p1' },
    items: [],
    maxPendingItems: 50,
    autoExpireDays: 30,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

describe('computeReviewPriority', () => {
  it('returns urgent for sensitive atoms', () => {
    const atom = makeAtom({ id: 'a1', sensitivity: 'sensitive' })
    expect(computeReviewPriority(atom)).toBe('urgent')
  })

  it('returns urgent for forbidden atoms', () => {
    const atom = makeAtom({ id: 'a1', sensitivity: 'forbidden' })
    expect(computeReviewPriority(atom)).toBe('urgent')
  })

  it('returns high for low confidence atoms', () => {
    const atom = makeAtom({ id: 'a1', confidence: 0.2 })
    expect(computeReviewPriority(atom)).toBe('high')
  })

  it('returns high for draft atoms', () => {
    const atom = makeAtom({ id: 'a1', lifecycle: 'draft' })
    expect(computeReviewPriority(atom)).toBe('high')
  })

  it('returns normal for medium confidence atoms', () => {
    const atom = makeAtom({ id: 'a1', confidence: 0.4 })
    expect(computeReviewPriority(atom)).toBe('normal')
  })

  it('returns normal for boundary type', () => {
    const atom = makeAtom({ id: 'a1', type: 'boundary', confidence: 0.8 })
    expect(computeReviewPriority(atom)).toBe('normal')
  })

  it('returns normal for goal type', () => {
    const atom = makeAtom({ id: 'a1', type: 'goal', confidence: 0.8 })
    expect(computeReviewPriority(atom)).toBe('normal')
  })

  it('returns low for high confidence preference', () => {
    const atom = makeAtom({ id: 'a1', confidence: 0.8, type: 'preference' })
    expect(computeReviewPriority(atom)).toBe('low')
  })
})

describe('createReviewQueue', () => {
  it('creates queue with default values', () => {
    const queue = createReviewQueue({ userId: 'u1', projectId: 'p1' })
    expect(queue.items).toHaveLength(0)
    expect(queue.maxPendingItems).toBe(50)
    expect(queue.autoExpireDays).toBe(30)
  })

  it('creates queue with custom values', () => {
    const queue = createReviewQueue({ userId: 'u1', projectId: 'p1' }, 10, 7)
    expect(queue.maxPendingItems).toBe(10)
    expect(queue.autoExpireDays).toBe(7)
  })
})

describe('addToReviewQueue', () => {
  it('adds item to queue', () => {
    const queue = makeQueue()
    const atom = makeAtom({ id: 'a1' })

    const result = addToReviewQueue(queue, atom, 'AI 发现新偏好')

    expect(result.item).not.toBeNull()
    expect(result.item!.atom.id).toBe('a1')
    expect(result.item!.status).toBe('pending')
    expect(result.item!.reason).toBe('AI 发现新偏好')
    expect(result.queue.items).toHaveLength(1)
  })

  it('rejects duplicate atom', () => {
    const queue = makeQueue()
    const atom = makeAtom({ id: 'a1' })

    const r1 = addToReviewQueue(queue, atom, 'first')
    const result = addToReviewQueue(r1.queue, atom, 'second')

    expect(result.item).toBeNull()
    expect(result.error).toContain('已在审查队列中')
  })

  it('rejects when queue is full', () => {
    const queue = makeQueue({ maxPendingItems: 1 })
    const atom1 = makeAtom({ id: 'a1' })
    const atom2 = makeAtom({ id: 'a2' })

    const r1 = addToReviewQueue(queue, atom1, 'first')
    const result = addToReviewQueue(r1.queue, atom2, 'second')

    expect(result.item).toBeNull()
    expect(result.error).toContain('已满')
  })

  it('uses computed priority when not specified', () => {
    const queue = makeQueue()
    const atom = makeAtom({ id: 'a1', sensitivity: 'sensitive' })

    const result = addToReviewQueue(queue, atom, 'test')

    expect(result.item!.priority).toBe('urgent')
  })

  it('uses specified priority', () => {
    const queue = makeQueue()
    const atom = makeAtom({ id: 'a1' })

    const result = addToReviewQueue(queue, atom, 'test', 'high')

    expect(result.item!.priority).toBe('high')
  })
})

describe('batchAddToReviewQueue', () => {
  it('adds multiple items', () => {
    const queue = makeQueue()
    const candidates = [
      { atom: makeAtom({ id: 'a1' }), reason: 'r1' },
      { atom: makeAtom({ id: 'a2' }), reason: 'r2' }
    ]

    const result = batchAddToReviewQueue(queue, candidates)

    expect(result.added).toHaveLength(2)
    expect(result.skipped).toBe(0)
    expect(result.queue.items).toHaveLength(2)
  })

  it('skips duplicates', () => {
    const queue = makeQueue()
    const atom = makeAtom({ id: 'a1' })
    const candidates = [
      { atom, reason: 'r1' },
      { atom, reason: 'r2' }
    ]

    const result = batchAddToReviewQueue(queue, candidates)

    expect(result.added).toHaveLength(1)
    expect(result.skipped).toBe(1)
  })
})

describe('reviewQueueItem', () => {
  it('confirms an item', () => {
    const queue = makeQueue()
    const atom = makeAtom({ id: 'a1' })
    const addResult = addToReviewQueue(queue, atom, 'test')
    const item = addResult.item!

    const reviewResult = reviewQueueItem(addResult.queue, { itemId: item.id, action: 'confirm' })

    expect(reviewResult.result).not.toBeNull()
    expect(reviewResult.result!.item.status).toBe('confirmed')
    expect(reviewResult.result!.resolvedAtom!.lifecycle).toBe('confirmed')
    expect(reviewResult.result!.auditEvent).not.toBeNull()
  })

  it('modifies an item', () => {
    const queue = makeQueue()
    const atom = makeAtom({ id: 'a1', content: '旧内容' })
    const addResult = addToReviewQueue(queue, atom, 'test')
    const item = addResult.item!

    const reviewResult = reviewQueueItem(addResult.queue, {
      itemId: item.id,
      action: 'modify',
      modifications: { content: '新内容' }
    })

    expect(reviewResult.result!.item.status).toBe('modified')
    expect(reviewResult.result!.resolvedAtom!.content).toBe('新内容')
  })

  it('rejects an item', () => {
    const queue = makeQueue()
    const atom = makeAtom({ id: 'a1' })
    const addResult = addToReviewQueue(queue, atom, 'test')
    const item = addResult.item!

    const reviewResult = reviewQueueItem(addResult.queue, { itemId: item.id, action: 'reject' })

    expect(reviewResult.result!.item.status).toBe('rejected')
    expect(reviewResult.result!.resolvedAtom!.lifecycle).toBe('archived')
  })

  it('scopes an item to project', () => {
    const queue = makeQueue()
    const atom = makeAtom({ id: 'a1' })
    const addResult = addToReviewQueue(queue, atom, 'test')
    const item = addResult.item!

    const reviewResult = reviewQueueItem(addResult.queue, {
      itemId: item.id,
      action: 'scope_to_project',
      projectId: 'p2'
    })

    expect(reviewResult.result!.item.status).toBe('scoped')
    expect(reviewResult.result!.resolvedAtom!.scope.projectId).toBe('p2')
  })

  it('defers an item', () => {
    const queue = makeQueue()
    const atom = makeAtom({ id: 'a1' })
    const addResult = addToReviewQueue(queue, atom, 'test')
    const item = addResult.item!

    const reviewResult = reviewQueueItem(addResult.queue, { itemId: item.id, action: 'defer' })

    expect(reviewResult.result!.item.status).toBe('deferred')
    expect(reviewResult.result!.resolvedAtom).toBeNull()
  })

  it('rejects already processed item', () => {
    const queue = makeQueue()
    const atom = makeAtom({ id: 'a1' })
    const addResult = addToReviewQueue(queue, atom, 'test')
    const item = addResult.item!

    const confirmResult = reviewQueueItem(addResult.queue, { itemId: item.id, action: 'confirm' })
    const secondResult = reviewQueueItem(confirmResult.queue, { itemId: item.id, action: 'reject' })

    expect(secondResult.result).toBeNull()
    expect(secondResult.error).toContain('已处理')
  })

  it('returns error for non-existent item', () => {
    const queue = makeQueue()
    const result = reviewQueueItem(queue, { itemId: 'nonexistent', action: 'confirm' })

    expect(result.result).toBeNull()
    expect(result.error).toContain('不存在')
  })
})

describe('getReviewQueueStats', () => {
  it('returns correct stats for empty queue', () => {
    const queue = makeQueue()
    const stats = getReviewQueueStats(queue)

    expect(stats.total).toBe(0)
    expect(stats.pending).toBe(0)
    expect(stats.oldestPendingDays).toBeNull()
  })

  it('returns correct stats for mixed queue', () => {
    const queue = makeQueue()
    const a1 = makeAtom({ id: 'a1' })
    const a2 = makeAtom({ id: 'a2' })
    const a3 = makeAtom({ id: 'a3' })

    const r1 = addToReviewQueue(queue, a1, 'r1')
    const r2 = addToReviewQueue(r1.queue, a2, 'r2')
    const r3 = addToReviewQueue(r2.queue, a3, 'r3')

    const reviewed = reviewQueueItem(r3.queue, { itemId: r1.item!.id, action: 'confirm' })

    const stats = getReviewQueueStats(reviewed.queue)

    expect(stats.total).toBe(3)
    expect(stats.pending).toBe(2)
    expect(stats.confirmed).toBe(1)
  })
})

describe('getPendingItems', () => {
  it('returns pending items sorted by priority', () => {
    const queue = makeQueue()
    const a1 = makeAtom({ id: 'a1', confidence: 0.8 })
    const a2 = makeAtom({ id: 'a2', sensitivity: 'sensitive' })
    const a3 = makeAtom({ id: 'a3', confidence: 0.2 })

    const r1 = addToReviewQueue(queue, a1, 'low priority')
    const r2 = addToReviewQueue(r1.queue, a2, 'urgent priority')
    const r3 = addToReviewQueue(r2.queue, a3, 'high priority')

    const pending = getPendingItems(r3.queue)

    expect(pending).toHaveLength(3)
    expect(pending[0].priority).toBe('urgent')
    expect(pending[1].priority).toBe('high')
    expect(pending[2].priority).toBe('low')
  })

  it('excludes non-pending items', () => {
    const queue = makeQueue()
    const a1 = makeAtom({ id: 'a1' })
    const a2 = makeAtom({ id: 'a2' })

    const r1 = addToReviewQueue(queue, a1, 'r1')
    const r2 = addToReviewQueue(r1.queue, a2, 'r2')

    const reviewed = reviewQueueItem(r2.queue, { itemId: r1.item!.id, action: 'confirm' })

    const pending = getPendingItems(reviewed.queue)

    expect(pending).toHaveLength(1)
    expect(pending[0].atom.id).toBe('a2')
  })
})

describe('autoExpireReviewItems', () => {
  it('expires old pending items', () => {
    const queue = makeQueue({ autoExpireDays: 0 }) // 立即过期
    const atom = makeAtom({ id: 'a1' })
    const addResult = addToReviewQueue(queue, atom, 'test')

    const result = autoExpireReviewItems(addResult.queue)

    expect(result.expired).toHaveLength(1)
    expect(result.expired[0].status).toBe('rejected')
    expect(result.queue.items[0].status).toBe('rejected')
  })

  it('does not expire non-pending items', () => {
    const queue = makeQueue({ autoExpireDays: 0 })
    const atom = makeAtom({ id: 'a1' })
    const addResult = addToReviewQueue(queue, atom, 'test')
    const reviewed = reviewQueueItem(addResult.queue, { itemId: addResult.item!.id, action: 'confirm' })

    const result = autoExpireReviewItems(reviewed.queue)

    expect(result.expired).toHaveLength(0)
  })
})

describe('cleanProcessedItems', () => {
  it('keeps active items and recent processed items', () => {
    const queue = makeQueue()
    const atoms = Array.from({ length: 5 }, (_, i) => makeAtom({ id: `a${i}` }))

    let q = queue
    const items: ReviewItem[] = []
    for (const atom of atoms) {
      const r = addToReviewQueue(q, atom, 'test')
      q = r.queue
      items.push(r.item!)
    }

    // 确认前 4 个
    for (let i = 0; i < 4; i++) {
      const r = reviewQueueItem(q, { itemId: items[i].id, action: 'confirm' })
      q = r.queue
    }

    const cleaned = cleanProcessedItems(q, 2)

    // 1 pending + 2 recent processed = 3
    expect(cleaned.items.length).toBeLessThanOrEqual(3)
    // pending item should still be there
    expect(cleaned.items.some(i => i.status === 'pending')).toBe(true)
  })
})

describe('summarizeReviewQueue', () => {
  it('generates summary for empty queue', () => {
    const queue = makeQueue()
    const summary = summarizeReviewQueue(queue)

    expect(summary).toContain('审查队列状态')
    expect(summary).toContain('0 项')
  })

  it('generates summary with pending items', () => {
    const queue = makeQueue()
    const atom = makeAtom({ id: 'a1', content: '用户喜欢咖啡' })
    const addResult = addToReviewQueue(queue, atom, 'AI 发现新偏好')

    const summary = summarizeReviewQueue(addResult.queue)

    expect(summary).toContain('用户喜欢咖啡')
    expect(summary).toContain('AI 发现新偏好')
  })
})
