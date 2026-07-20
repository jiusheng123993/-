import { create } from 'zustand'
import { getSyncService, type SyncService, type SyncResult, type SyncStatus, type SyncTable } from '../services/syncService'

interface CloudSyncState {
  syncService: SyncService | null
  statuses: SyncStatus[]
  isSyncing: boolean
  lastSyncResult: SyncResult | null
  error: string | null

  init: (userId: string) => void
  syncAll: () => Promise<SyncResult>
  syncTable: (table: SyncTable) => Promise<{ pushed: number; pulled: number; error: string | null }>
  refreshStatuses: () => void
  exportData: () => Promise<Record<string, unknown>>
  importData: (data: Record<string, unknown>) => Promise<{ imported: number; errors: string[] }>
  clearCloudData: () => Promise<{ success: boolean; error: string | null }>
  clearError: () => void
}

export const useCloudSyncStore = create<CloudSyncState>((set, get) => ({
  syncService: null,
  statuses: [],
  isSyncing: false,
  lastSyncResult: null,
  error: null,

  init: (userId: string) => {
    const service = getSyncService(userId)
    set({ syncService: service })
    const statuses = service.getAllStatuses()
    set({ statuses })
  },

  syncAll: async () => {
    const { syncService } = get()
    if (!syncService) {
      return { success: false, pushed: 0, pulled: 0, errors: ['同步服务未初始化'] }
    }

    set({ isSyncing: true, error: null })
    try {
      const result = await syncService.syncAll()
      set({
        lastSyncResult: result,
        statuses: syncService.getAllStatuses(),
        isSyncing: false,
        error: result.success ? null : result.errors.join('; ')
      })
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '同步失败'
      set({ isSyncing: false, error: errorMsg })
      return { success: false, pushed: 0, pulled: 0, errors: [errorMsg] }
    }
  },

  syncTable: async (table: SyncTable) => {
    const { syncService } = get()
    if (!syncService) {
      return { pushed: 0, pulled: 0, error: '同步服务未初始化' }
    }

    set({ isSyncing: true, error: null })
    try {
      const pushResult = await syncService.pushTable(table)
      const pullResult = await syncService.pullTable(table)
      set({
        statuses: syncService.getAllStatuses(),
        isSyncing: false,
        error: pushResult.error || pullResult.error
      })
      return {
        pushed: pushResult.pushed,
        pulled: pullResult.pulled,
        error: pushResult.error || pullResult.error
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '同步失败'
      set({ isSyncing: false, error: errorMsg })
      return { pushed: 0, pulled: 0, error: errorMsg }
    }
  },

  refreshStatuses: () => {
    const { syncService } = get()
    if (syncService) {
      set({ statuses: syncService.getAllStatuses() })
    }
  },

  exportData: async () => {
    const { syncService } = get()
    if (!syncService) {
      return {}
    }
    return syncService.exportAllData()
  },

  importData: async (data: Record<string, unknown>) => {
    const { syncService } = get()
    if (!syncService) {
      return { imported: 0, errors: ['同步服务未初始化'] }
    }
    return syncService.importData(data)
  },

  clearCloudData: async () => {
    const { syncService } = get()
    if (!syncService) {
      return { success: false, error: '同步服务未初始化' }
    }
    return syncService.clearCloudData()
  },

  clearError: () => {
    set({ error: null })
  }
}))

export type { SyncResult, SyncStatus, SyncTable }
