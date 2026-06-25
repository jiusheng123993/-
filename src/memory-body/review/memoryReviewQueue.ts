import type { MemoryAtom, MemoryScope } from '../core/memoryBodyTypes'
import type { AuditEvent } from '../audit/memoryAuditLog'
import { createAuditEvent } from '../audit/memoryAuditLog'

/**
 * MemoryReviewQueue — 设计文档 7.3 记忆审查队列
 *
 * 记忆协商流程中的审查队列环节：
 * AI 发现候选长期记忆 → 进入 MemoryReviewQueue → 用户确认/修改/拒绝/只在当前项目使用
 * → 写入 AuditLog → 更新 MemoryBody 与 CognitiveProfile
 */

export type ReviewAction = 'confirm' | 'modify' | 'reject' | 'scope_to_project' | 'defer'

export type ReviewItemStatus = 'pending' | 'confirmed' | 'modified' | 'rejected' | 'scoped' | 'deferred'

export type ReviewPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface ReviewItem {
  id: string
  atom: MemoryAtom
  reason: string
  status: ReviewItemStatus
  priority: ReviewPriority
  addedAt: string
  reviewedAt?: string
  reviewAction?: ReviewAction
  modifications?: Partial<Pick<MemoryAtom, 'content' | 'subject' | 'predicate' | 'object' | 'tags' | 'scope'>>
  auditEventId?: string
}

export interface ReviewQueue {
  id: string
  scope: MemoryScope
  items: ReviewItem[]
  maxPendingItems: number
  autoExpireDays: number
  createdAt: string
  updatedAt: string
}

export interface ReviewQueueStats {
  total: number
  pending: number
  confirmed: number
  modified: number
  rejected: number
  scoped: number
  deferred: number
  byPriority: Record<ReviewPriority, number>
  oldestPendingDays: number | null
}

export interface ReviewActionInput {
  itemId: string
  action: ReviewAction
  modifications?: Partial<Pick<MemoryAtom, 'content' | 'subject' | 'predicate' | 'object' | 'tags' | 'scope'>>
  projectId?: string
}

export interface ReviewActionResult {
  item: ReviewItem
  auditEvent: AuditEvent | null
  resolvedAtom: MemoryAtom | null
}

const DEFAULT_MAX_PENDING = 50
const DEFAULT_AUTO_EXPIRE_DAYS = 30

function generateQueueId(): string {
  return `review-queue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateItemId(): string {
  return `review-item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 根据记忆属性自动计算审查优先级
 */
export function computeReviewPriority(atom: MemoryAtom): ReviewPriority {
  if (atom.sensitivity === 'sensitive' || atom.sensitivity === 'forbidden') return 'urgent'
  if (atom.confidence < 0.3) return 'high'
  if (atom.lifecycle === 'draft') return 'high'
  if (atom.confidence < 0.5) return 'normal'
  if (atom.type === 'boundary' || atom.type === 'goal') return 'normal'
  return 'low'
}

/**
 * 创建审查队列
 */
export function createReviewQueue(scope: MemoryScope, maxPending?: number, autoExpireDays?: number): ReviewQueue {
  return {
    id: generateQueueId(),
    scope,
    items: [],
    maxPendingItems: maxPending ?? DEFAULT_MAX_PENDING,
    autoExpireDays: autoExpireDays ?? DEFAULT_AUTO_EXPIRE_DAYS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * 向审查队列添加候选记忆
 */
export function addToReviewQueue(
  queue: ReviewQueue,
  atom: MemoryAtom,
  reason: string,
  priority?: ReviewPriority
): { queue: ReviewQueue; item: ReviewItem } | { queue: ReviewQueue; item: null; error: string } {
  // 检查是否已存在
  const existing = queue.items.find(i => i.atom.id === atom.id)
  if (existing) {
    return { queue, item: null, error: `记忆 ${atom.id} 已在审查队列中（状态：${existing.status}）` }
  }

  // 检查容量
  const pendingCount = queue.items.filter(i => i.status === 'pending' || i.status === 'deferred').length
  if (pendingCount >= queue.maxPendingItems) {
    return { queue, item: null, error: `审查队列已满（${pendingCount}/${queue.maxPendingItems}）` }
  }

  const item: ReviewItem = {
    id: generateItemId(),
    atom,
    reason,
    status: 'pending',
    priority: priority ?? computeReviewPriority(atom),
    addedAt: new Date().toISOString()
  }

  const updatedQueue: ReviewQueue = {
    ...queue,
    items: [...queue.items, item],
    updatedAt: new Date().toISOString()
  }

  return { queue: updatedQueue, item }
}

/**
 * 批量添加候选记忆到审查队列
 */
export function batchAddToReviewQueue(
  queue: ReviewQueue,
  candidates: Array<{ atom: MemoryAtom; reason: string; priority?: ReviewPriority }>
): { queue: ReviewQueue; added: ReviewItem[]; skipped: number } {
  let currentQueue = queue
  const added: ReviewItem[] = []
  let skipped = 0

  for (const candidate of candidates) {
    const result = addToReviewQueue(currentQueue, candidate.atom, candidate.reason, candidate.priority)
    if (result.item) {
      added.push(result.item)
      currentQueue = result.queue
    } else {
      skipped++
    }
  }

  return { queue: currentQueue, added, skipped }
}

/**
 * 审查队列中的一项记忆
 */
export function reviewQueueItem(
  queue: ReviewQueue,
  input: ReviewActionInput
): { queue: ReviewQueue; result: ReviewActionResult } | { queue: ReviewQueue; result: null; error: string } {
  const itemIndex = queue.items.findIndex(i => i.id === input.itemId)
  if (itemIndex === -1) {
    return { queue, result: null, error: `审查项 ${input.itemId} 不存在` }
  }

  const item = queue.items[itemIndex]
  if (item.status !== 'pending' && item.status !== 'deferred') {
    return { queue, result: null, error: `审查项 ${input.itemId} 已处理（状态：${item.status}）` }
  }

  const now = new Date().toISOString()
  let resolvedAtom: MemoryAtom | null = null
  let auditEvent: AuditEvent | null = null

  switch (input.action) {
    case 'confirm': {
      resolvedAtom = {
        ...item.atom,
        lifecycle: 'confirmed',
        updatedAt: now
      }
      auditEvent = createAuditEvent('memory_confirmed', item.atom.id, {
        previousLifecycle: item.atom.lifecycle,
        newLifecycle: 'confirmed',
        reviewItemId: item.id
      })
      break
    }
    case 'modify': {
      resolvedAtom = {
        ...item.atom,
        ...input.modifications,
        lifecycle: 'confirmed',
        updatedAt: now
      }
      auditEvent = createAuditEvent('memory_modified', item.atom.id, {
        previousContent: item.atom.content,
        newContent: resolvedAtom.content,
        modifications: input.modifications,
        reviewItemId: item.id
      })
      break
    }
    case 'reject': {
      resolvedAtom = {
        ...item.atom,
        lifecycle: 'archived',
        updatedAt: now
      }
      auditEvent = createAuditEvent('memory_rejected', item.atom.id, {
        reason: item.reason,
        reviewItemId: item.id
      })
      break
    }
    case 'scope_to_project': {
      resolvedAtom = {
        ...item.atom,
        scope: input.projectId
          ? { userId: item.atom.scope.userId, projectId: input.projectId }
          : item.atom.scope,
        lifecycle: 'confirmed',
        updatedAt: now
      }
      auditEvent = createAuditEvent('memory_scoped', item.atom.id, {
        previousScope: item.atom.scope,
        newScope: resolvedAtom.scope,
        reviewItemId: item.id
      })
      break
    }
    case 'defer': {
      // 延期处理，不改变 atom
      break
    }
  }

  const statusMap: Record<ReviewAction, ReviewItemStatus> = {
    confirm: 'confirmed',
    modify: 'modified',
    reject: 'rejected',
    scope_to_project: 'scoped',
    defer: 'deferred'
  }

  const updatedItem: ReviewItem = {
    ...item,
    status: statusMap[input.action],
    reviewedAt: now,
    reviewAction: input.action,
    modifications: input.modifications,
    auditEventId: auditEvent?.id
  }

  const updatedItems = [...queue.items]
  updatedItems[itemIndex] = updatedItem

  const updatedQueue: ReviewQueue = {
    ...queue,
    items: updatedItems,
    updatedAt: now
  }

  return {
    queue: updatedQueue,
    result: {
      item: updatedItem,
      auditEvent,
      resolvedAtom
    }
  }
}

/**
 * 获取审查队列统计
 */
export function getReviewQueueStats(queue: ReviewQueue): ReviewQueueStats {
  const stats: ReviewQueueStats = {
    total: queue.items.length,
    pending: 0,
    confirmed: 0,
    modified: 0,
    rejected: 0,
    scoped: 0,
    deferred: 0,
    byPriority: { low: 0, normal: 0, high: 0, urgent: 0 },
    oldestPendingDays: null
  }

  const now = Date.now()
  let oldestPendingTime: number | null = null

  for (const item of queue.items) {
    stats[item.status]++
    stats.byPriority[item.priority]++

    if (item.status === 'pending') {
      const addedTime = new Date(item.addedAt).getTime()
      if (oldestPendingTime === null || addedTime < oldestPendingTime) {
        oldestPendingTime = addedTime
      }
    }
  }

  if (oldestPendingTime !== null) {
    stats.oldestPendingDays = Math.floor((now - oldestPendingTime) / (1000 * 60 * 60 * 24))
  }

  return stats
}

/**
 * 获取待审查项（按优先级排序）
 */
export function getPendingItems(queue: ReviewQueue): ReviewItem[] {
  const priorityOrder: Record<ReviewPriority, number> = {
    urgent: 0,
    high: 1,
    normal: 2,
    low: 3
  }

  return queue.items
    .filter(i => i.status === 'pending')
    .sort((a, b) => {
      const pa = priorityOrder[a.priority]
      const pb = priorityOrder[b.priority]
      if (pa !== pb) return pa - pb
      return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
    })
}

/**
 * 自动过期处理
 *
 * 超过 autoExpireDays 的 pending 项自动标记为 rejected
 */
export function autoExpireReviewItems(queue: ReviewQueue): { queue: ReviewQueue; expired: ReviewItem[] } {
  const now = Date.now()
  const expireMs = queue.autoExpireDays * 24 * 60 * 60 * 1000
  const expired: ReviewItem[] = []

  const updatedItems = queue.items.map(item => {
    if (item.status !== 'pending') return item

    const age = now - new Date(item.addedAt).getTime()
    if (age >= expireMs) {
      const expiredItem: ReviewItem = {
        ...item,
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewAction: 'reject'
      }
      expired.push(expiredItem)
      return expiredItem
    }

    return item
  })

  return {
    queue: {
      ...queue,
      items: updatedItems,
      updatedAt: new Date().toISOString()
    },
    expired
  }
}

/**
 * 清理已处理的审查项（保留最近 N 条）
 */
export function cleanProcessedItems(queue: ReviewQueue, keepRecent?: number): ReviewQueue {
  const keep = keepRecent ?? 20
  const processed = queue.items.filter(i => i.status !== 'pending' && i.status !== 'deferred')
  const active = queue.items.filter(i => i.status === 'pending' || i.status === 'deferred')

  if (processed.length <= keep) return queue

  const toKeep = processed
    .sort((a, b) => new Date(b.reviewedAt ?? b.addedAt).getTime() - new Date(a.reviewedAt ?? a.addedAt).getTime())
    .slice(0, keep)

  return {
    ...queue,
    items: [...active, ...toKeep],
    updatedAt: new Date().toISOString()
  }
}

/**
 * 生成审查队列摘要（面向用户）
 */
export function summarizeReviewQueue(queue: ReviewQueue): string {
  const stats = getReviewQueueStats(queue)
  const lines: string[] = []

  lines.push(`审查队列状态 — ${stats.total} 项`)
  lines.push(`待审查：${stats.pending} | 已确认：${stats.confirmed} | 已修改：${stats.modified}`)
  lines.push(`已拒绝：${stats.rejected} | 已限定范围：${stats.scoped} | 已延期：${stats.deferred}`)

  if (stats.pending > 0) {
    lines.push('')
    lines.push('待审查项（按优先级）：')
    const pending = getPendingItems(queue)
    for (const item of pending.slice(0, 5)) {
      const priorityLabel = item.priority === 'urgent' ? '🔴' : item.priority === 'high' ? '🟡' : item.priority === 'normal' ? '🔵' : '⚪'
      lines.push(`  ${priorityLabel} [${item.priority}] ${item.atom.content} — ${item.reason}`)
    }
    if (pending.length > 5) {
      lines.push(`  ... 还有 ${pending.length - 5} 项`)
    }
  }

  if (stats.oldestPendingDays !== null && stats.oldestPendingDays > 7) {
    lines.push(`⚠ 最旧待审查项已等待 ${stats.oldestPendingDays} 天`)
  }

  return lines.join('\n')
}
