/**
 * PersistentEntitlementService - 持久化权益服务
 *
 * 职责：
 * - 封装 EntitlementService + EntitlementStorage
 * - 自动同步内存与持久化存储
 * - 启动时自动加载用户权益
 *
 * 设计要点：
 * - 每次 grant/consume 后自动保存
 * - 启动时从 storage 加载数据
 * - 支持多用户隔离
 */

import { createEntitlementService } from './entitlementService'
import { createEntitlementStorage } from './entitlementStorage'
import type { Entitlement, EntitlementCode } from './entitlementTypes'

export interface ConsumeResult {
  ok: boolean
  remaining?: number
}

export interface PersistentEntitlementService {
  has(userId: string, code: EntitlementCode, scope?: string): boolean
  consume(userId: string, code: EntitlementCode, n?: number): ConsumeResult
  list(userId: string): Entitlement[]
  grant(userId: string, e: Omit<Entitlement, 'grantedAt'>): void
  revoke(userId: string, predicate: (e: Entitlement) => boolean): void
  loadForUser(userId: string): Promise<void>
  saveForUser(userId: string): Promise<void>
}

const ENTITLEMENT_NAMESPACE = 'growthos-entitlements'

export function createPersistentEntitlementService(): PersistentEntitlementService {
  const entitlementService = createEntitlementService()
  const storage = createEntitlementStorage(ENTITLEMENT_NAMESPACE)

  const save = async (userId: string): Promise<void> => {
    const entitlements = entitlementService.list(userId)
    await storage.save(userId, entitlements)
  }

  return {
    has(userId: string, code: EntitlementCode, scope?: string): boolean {
      return entitlementService.has(userId, code, scope)
    },

    consume(userId: string, code: EntitlementCode, n = 1): ConsumeResult {
      const result = entitlementService.consume(userId, code, n)
      if (result.ok) {
        save(userId)
      }
      return result
    },

    list(userId: string): Entitlement[] {
      return entitlementService.list(userId)
    },

    grant(userId: string, e: Omit<Entitlement, 'grantedAt'>): void {
      entitlementService.grant(userId, e)
      save(userId)
    },

    revoke(userId: string, predicate: (e: Entitlement) => boolean): void {
      entitlementService.revoke(userId, predicate)
      save(userId)
    },

    async loadForUser(userId: string): Promise<void> {
      const entitlements = await storage.load(userId)
      for (const e of entitlements) {
        entitlementService.grant(userId, {
          code: e.code,
          source: e.source,
          scope: e.scope,
          expireAt: e.expireAt,
          remaining: e.remaining
        })
      }
    },

    async saveForUser(userId: string): Promise<void> {
      await save(userId)
    }
  }
}

export const persistentEntitlementService = createPersistentEntitlementService()
