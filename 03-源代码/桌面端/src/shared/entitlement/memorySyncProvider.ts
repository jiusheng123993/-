import type { EntitlementService } from './entitlementService'

export interface MemorySyncStorage {
  used: number
  limit: number
}

export interface MemorySyncProvider {
  hasAccess(userId: string): boolean
  getStorageInfo(userId: string): MemorySyncStorage
  consumeStorage(userId: string, bytes: number): boolean
  releaseStorage(userId: string, bytes: number): void
}

const DEFAULT_STORAGE_MB = 100
const AGENT_PLUS_STORAGE_MB = 1024

export function createMemorySyncProvider(entitlementService: EntitlementService): MemorySyncProvider {
  const storageUsage = new Map<string, number>()

  return {
    hasAccess(userId: string): boolean {
      return (
        entitlementService.has(userId, 'memory_sync') ||
        entitlementService.has(userId, 'agent') ||
        entitlementService.has(userId, 'agent_plus')
      )
    },

    getStorageInfo(userId: string): MemorySyncStorage {
      const entitlements = entitlementService.list(userId)
      const syncEntitlement = entitlements.find((e) => e.code === 'memory_sync')

      let limit = DEFAULT_STORAGE_MB * 1024 * 1024

      if (entitlements.some((e) => e.code === 'agent_plus')) {
        limit = AGENT_PLUS_STORAGE_MB * 1024 * 1024
      } else if (syncEntitlement?.scope) {
        const addOn = parseInt(syncEntitlement.scope, 10)
        if (!isNaN(addOn)) {
          limit = (DEFAULT_STORAGE_MB + addOn) * 1024 * 1024
        }
      }

      const used = storageUsage.get(userId) ?? 0

      return {
        used,
        limit
      }
    },

    consumeStorage(userId: string, bytes: number): boolean {
      if (!this.hasAccess(userId)) {
        return false
      }

      const info = this.getStorageInfo(userId)
      const currentUsage = storageUsage.get(userId) ?? 0

      if (currentUsage + bytes > info.limit) {
        return false
      }

      storageUsage.set(userId, currentUsage + bytes)
      return true
    },

    releaseStorage(userId: string, bytes: number): void {
      const currentUsage = storageUsage.get(userId) ?? 0
      storageUsage.set(userId, Math.max(0, currentUsage - bytes))
    }
  }
}
