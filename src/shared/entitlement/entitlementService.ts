/**
 * EntitlementService - 权益核心服务
 *
 * 职责：
 * - 统一管理用户权益的查询、授予、消费、撤销
 * - 自动过滤过期权益、严格隔离用户数据
 * - 不依赖任何 UI / 网络 / 持久化（持久化由 EntitlementStorage 适配，业务由 Provider 驱动）
 *
 * 设计要点：
 * - 输入校验：拒绝空 userId、非正数消费量、未知 productId
 * - 不可变接口：service 对外只暴露纯方法，内部 Map 不外泄
 * - 可测试：纯内存实现，无副作用，便于单测覆盖
 */

import type { Entitlement, EntitlementCode, UserEntitlements } from './entitlementTypes'

export interface ConsumeResult {
  ok: boolean
  remaining?: number
}

export interface EntitlementService {
  /** 查询用户是否拥有某权益（自动过滤过期），支持 scope 精确匹配 */
  has(userId: string, code: EntitlementCode, scope?: string): boolean
  /** 消费配额。n 必须 > 0；不足时返回 ok:false 并附带 remaining */
  consume(userId: string, code: EntitlementCode, n?: number): ConsumeResult
  /** 列出用户所有权益（包含过期项，调用方自行筛选） */
  list(userId: string): Entitlement[]
  /** 授予权益（自动注入 grantedAt） */
  grant(userId: string, e: Omit<Entitlement, 'grantedAt'>): void
  /** 按谓词撤销权益（用于退款、降级、活动失效等） */
  revoke(userId: string, predicate: (e: Entitlement) => boolean): void
}

/**
 * 判断权益是否已过期。null 表示永久有效。
 */
function isExpired(expireAt: string | null): boolean {
  if (expireAt === null) return false
  const t = new Date(expireAt).getTime()
  if (Number.isNaN(t)) return true
  return t < Date.now()
}

/**
 * 创建权益服务工厂。每次调用产生独立内存存储，便于测试隔离。
 */
export function createEntitlementService(): EntitlementService {
  const storage = new Map<string, UserEntitlements>()

  const ensureUser = (userId: string): UserEntitlements => {
    let bucket = storage.get(userId)
    if (!bucket) {
      bucket = { userId, entitlements: [], updatedAt: new Date().toISOString() }
      storage.set(userId, bucket)
    }
    return bucket
  }

  return {
    has(userId: string, code: EntitlementCode, scope?: string): boolean {
      if (!userId) return false
      const bucket = storage.get(userId)
      if (!bucket) return false

      return bucket.entitlements.some((e) => {
        if (e.code !== code) return false
        if (scope !== undefined && e.scope !== scope) return false
        return !isExpired(e.expireAt)
      })
    },

    consume(userId: string, code: EntitlementCode, n = 1): ConsumeResult {
      if (!userId) return { ok: false }
      if (!Number.isFinite(n) || n <= 0) return { ok: false }

      const bucket = storage.get(userId)
      if (!bucket) return { ok: false }

      const target = bucket.entitlements.find(
        (e) => e.code === code && typeof e.remaining === 'number' && !isExpired(e.expireAt)
      )
      if (!target || typeof target.remaining !== 'number') return { ok: false }

      if (target.remaining < n) {
        return { ok: false, remaining: target.remaining }
      }

      target.remaining -= n
      bucket.updatedAt = new Date().toISOString()
      return { ok: true, remaining: target.remaining }
    },

    list(userId: string): Entitlement[] {
      if (!userId) return []
      const bucket = storage.get(userId)
      return bucket ? [...bucket.entitlements] : []
    },

    grant(userId: string, e: Omit<Entitlement, 'grantedAt'>): void {
      if (!userId) throw new Error('EntitlementService.grant: userId is required')
      if (!e || !e.code || !e.source) {
        throw new Error('EntitlementService.grant: code and source are required')
      }

      const bucket = ensureUser(userId)
      bucket.entitlements.push({
        ...e,
        grantedAt: new Date().toISOString()
      })
      bucket.updatedAt = new Date().toISOString()
    },

    revoke(userId: string, predicate: (e: Entitlement) => boolean): void {
      if (!userId) return
      if (typeof predicate !== 'function') {
        throw new Error('EntitlementService.revoke: predicate must be a function')
      }
      const bucket = storage.get(userId)
      if (!bucket) return

      bucket.entitlements = bucket.entitlements.filter((e) => !predicate(e))
      bucket.updatedAt = new Date().toISOString()
    }
  }
}
