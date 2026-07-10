/**
 * EntitlementStorage - 权益数据持久化适配
 *
 * 职责：
 * - 将 EntitlementService 的内存快照落地到本地存储（默认 localStorage）
 * - 隔离不同命名空间（namespace），支持多账户、多环境共存
 * - 容错损坏数据：JSON 解析失败、缺失字段一律回退为空数组而不抛
 *
 * 安全：
 * - 不在 key 或 value 中写入敏感凭证
 * - 由调用方决定是否启用，业务层只面对 EntitlementService 接口
 *
 * 设计要点：
 * - 使用 namespace + userId 拼接 storage key，避免跨用户污染
 * - clear 只清理本命名空间下的 key，不影响其他模块的 localStorage 数据
 */

import type { Entitlement } from './entitlementTypes'

export interface EntitlementStorage {
  /** 持久化某用户的全部权益（覆盖式写入） */
  save(userId: string, entitlements: Entitlement[]): Promise<void>
  /** 加载某用户的权益快照；不存在或损坏返回空数组 */
  load(userId: string): Promise<Entitlement[]>
  /** 删除某用户的权益快照 */
  remove(userId: string): Promise<void>
  /** 清理本命名空间下所有权益数据 */
  clear(): Promise<void>
}

interface PersistedSnapshot {
  entitlements: Entitlement[]
  updatedAt: string
}

/**
 * 创建本地权益存储。
 *
 * @param namespace 存储命名空间，建议项目唯一，例如 `harmony-planner-entitlement`
 */
export function createEntitlementStorage(namespace: string): EntitlementStorage {
  if (!namespace || typeof namespace !== 'string') {
    throw new Error('EntitlementStorage: namespace must be a non-empty string')
  }

  const keyOf = (userId: string) => `${namespace}-${userId}`

  const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  if (!isBrowser) {
    throw new Error(
      'EntitlementStorage: localStorage is unavailable in current environment. ' +
        'Wrap usage in a runtime guard or supply a different adapter.'
    )
  }

  return {
    async save(userId: string, entitlements: Entitlement[]): Promise<void> {
      if (!userId) throw new Error('EntitlementStorage.save: userId is required')
      if (!Array.isArray(entitlements)) {
        throw new Error('EntitlementStorage.save: entitlements must be an array')
      }
      const snapshot: PersistedSnapshot = {
        entitlements,
        updatedAt: new Date().toISOString()
      }
      window.localStorage.setItem(keyOf(userId), JSON.stringify(snapshot))
    },

    async load(userId: string): Promise<Entitlement[]> {
      if (!userId) return []
      const raw = window.localStorage.getItem(keyOf(userId))
      if (!raw) return []
      try {
        const parsed = JSON.parse(raw) as PersistedSnapshot
        if (!parsed || !Array.isArray(parsed.entitlements)) return []
        return parsed.entitlements
      } catch {
        return []
      }
    },

    async remove(userId: string): Promise<void> {
      if (!userId) return
      window.localStorage.removeItem(keyOf(userId))
    },

    async clear(): Promise<void> {
      const toRemove: string[] = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key && key.startsWith(`${namespace}-`)) {
          toRemove.push(key)
        }
      }
      toRemove.forEach((key) => window.localStorage.removeItem(key))
    }
  }
}
