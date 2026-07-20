import { getSyncService, type SyncTable } from './syncService'

export function queueSync(table: SyncTable, recordId: string, action: 'insert' | 'update' | 'delete', data: unknown, userId: string): void {
  try {
    const service = getSyncService(userId)
    service.queueForSync(table, recordId, action, data)
  } catch {
    // 同步失败不影响本地操作
  }
}

export function trySyncAll(userId: string): void {
  try {
    const service = getSyncService(userId)
    service.syncAll().catch(() => {})
  } catch {
    // 静默失败
  }
}

export function trySyncTable(table: SyncTable, userId: string): void {
  try {
    const service = getSyncService(userId)
    service.pushTable(table).catch(() => {})
    service.pullTable(table).catch(() => {})
  } catch {
    // 静默失败
  }
}
