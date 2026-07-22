import { supabaseClient } from './supabaseClient'
import { encrypt, decrypt } from '../utils/crypto'
import { getStorage, setStorage } from '../utils/storage'

export type SyncTable =
  | 'pet_profiles'
  | 'pet_health_entries'
  | 'pet_vaccinations'
  | 'pet_symptom_checks'
  | 'pet_food_queries'
  | 'emotion_triggers'
  | 'pet_grief_sessions'

export interface SyncRecord {
  id: string
  table_name: SyncTable
  record_id: string
  action: 'insert' | 'update' | 'delete'
  data: string
  synced: boolean
  created_at: string
}

export interface SyncStatus {
  table: SyncTable
  lastPushAt: string | null
  lastPullAt: string | null
  pendingCount: number
  error: string | null
}

export interface SyncResult {
  success: boolean
  pushed: number
  pulled: number
  errors: string[]
}

const SYNC_STATUS_KEY = 'sync_status'
const SYNC_QUEUE_KEY = 'sync_queue'
const SYNC_LAST_KEY = 'sync_last_timestamps'

const SENSITIVE_TABLES: SyncTable[] = [
  'emotion_triggers',
  'pet_grief_sessions'
]

function getSyncTimestamps(): Record<string, string> {
  return getStorage<Record<string, string>>(SYNC_LAST_KEY) || {}
}

function setSyncTimestamp(table: SyncTable): void {
  const timestamps = getSyncTimestamps()
  timestamps[table] = new Date().toISOString()
  setStorage(SYNC_LAST_KEY, timestamps)
}

function getSyncQueue(): SyncRecord[] {
  return getStorage<SyncRecord[]>(SYNC_QUEUE_KEY) || []
}

function saveSyncQueue(queue: SyncRecord[]): void {
  setStorage(SYNC_QUEUE_KEY, queue)
}

function getSyncStatuses(): SyncStatus[] {
  return getStorage<SyncStatus[]>(SYNC_STATUS_KEY) || []
}

function saveSyncStatuses(statuses: SyncStatus[]): void {
  setStorage(SYNC_STATUS_KEY, statuses)
}

function generateRecordId(): string {
  return `sync_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export class SyncService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  setUserId(userId: string): void {
    this.userId = userId
  }

  private encryptData(data: unknown): string {
    return encrypt(JSON.stringify(data), this.userId)
  }

  private decryptData(encrypted: string): unknown {
    const decrypted = decrypt(encrypted, this.userId)
    if (!decrypted) return null
    try {
      return JSON.parse(decrypted)
    } catch {
      return null
    }
  }

  isAvailable(): boolean {
    return !supabaseClient.isMock && !!this.userId
  }

  queueForSync(table: SyncTable, recordId: string, action: 'insert' | 'update' | 'delete', data: unknown): void {
    const queue = getSyncQueue()
    const rawData = SENSITIVE_TABLES.includes(table)
      ? this.encryptData(data)
      : JSON.stringify(data)

    queue.push({
      id: generateRecordId(),
      table_name: table,
      record_id: recordId,
      action,
      data: rawData,
      synced: false,
      created_at: new Date().toISOString()
    })

    if (queue.length > 200) {
      queue.splice(0, queue.length - 200)
    }

    saveSyncQueue(queue)
    this.updateStatus(table)
  }

  async pushTable(table: SyncTable): Promise<{ pushed: number; error: string | null }> {
    if (!this.isAvailable()) {
      return { pushed: 0, error: '云端不可用' }
    }

    const queue = getSyncQueue()
    const pending = queue.filter((r) => r.table_name === table && !r.synced)

    if (pending.length === 0) {
      return { pushed: 0, error: null }
    }

    let pushed = 0
    let lastError: string | null = null

    for (const record of pending) {
      try {
        const parsed = JSON.parse(record.data)

        if (record.action === 'delete') {
          const result = await supabaseClient.delete(table, { id: `eq.${record.record_id}` })
          if (result.error) {
            lastError = result.error
            continue
          }
        } else {
          const { userId: _parsedUserId, ...restData } = parsed
          const result = await supabaseClient.upsert(table, {
            ...restData,
            id: record.record_id,
            userId: this.userId,
            syncedAt: new Date().toISOString()
          })
          if (result.error) {
            lastError = result.error
            continue
          }
        }

        record.synced = true
        pushed++
      } catch (err) {
        lastError = err instanceof Error ? err.message : '同步失败'
      }
    }

    saveSyncQueue(queue)
    if (pushed > 0) {
      setSyncTimestamp(table)
    }
    this.updateStatus(table)

    return { pushed, error: lastError }
  }

  async pullTable(table: SyncTable): Promise<{ pulled: number; error: string | null }> {
    if (!this.isAvailable()) {
      return { pulled: 0, error: '云端不可用' }
    }

    try {
      const lastTimestamp = getSyncTimestamps()[table]
      const params: Record<string, string> = {
        user_id: `eq.${this.userId}`,
        order: 'updated_at.desc',
        limit: '100'
      }
      if (lastTimestamp) {
        params.updated_at = `gt.${lastTimestamp}`
      }

      const result = await supabaseClient.select<Record<string, unknown>>(table, params)

      if (result.error) {
        return { pulled: 0, error: result.error }
      }

      if (!result.data || result.data.length === 0) {
        return { pulled: 0, error: null }
      }

      let pulled = 0
      for (const record of result.data) {
        try {
          let data = record

          if (SENSITIVE_TABLES.includes(table) && record.data) {
            const decrypted = this.decryptData(record.data as string)
            if (decrypted) {
              data = { ...record, data: decrypted }
            }
          }

          const storageKey = `${table}_${record.id}`
          setStorage(storageKey, data)
          pulled++
        } catch {
          continue
        }
      }

      if (pulled > 0) {
        setSyncTimestamp(table)
      }
      this.updateStatus(table)

      return { pulled, error: null }
    } catch (err) {
      return { pulled: 0, error: err instanceof Error ? err.message : '拉取失败' }
    }
  }

  async syncAll(): Promise<SyncResult> {
    const tables: SyncTable[] = [
      'pet_profiles',
      'pet_health_entries',
      'pet_vaccinations',
      'pet_symptom_checks',
      'pet_food_queries',
      'emotion_triggers',
      'pet_grief_sessions'
    ]

    let totalPushed = 0
    let totalPulled = 0
    const errors: string[] = []

    for (const table of tables) {
      const pushResult = await this.pushTable(table)
      totalPushed += pushResult.pushed
      if (pushResult.error) {
        errors.push(`${table} push: ${pushResult.error}`)
      }

      const pullResult = await this.pullTable(table)
      totalPulled += pullResult.pulled
      if (pullResult.error) {
        errors.push(`${table} pull: ${pullResult.error}`)
      }
    }

    return {
      success: errors.length === 0,
      pushed: totalPushed,
      pulled: totalPulled,
      errors
    }
  }

  async exportAllData(): Promise<Record<string, unknown>> {
    const tables: SyncTable[] = [
      'pet_profiles',
      'pet_health_entries',
      'pet_vaccinations',
      'pet_symptom_checks',
      'pet_food_queries'
    ]

    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      userId: this.userId
    }

    for (const table of tables) {
      const storageKey = `${table}_list`
      const data = getStorage<unknown[]>(storageKey)
      if (data) {
        exportData[table] = data
      }
    }

    return exportData
  }

  async importData(data: Record<string, unknown>): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = []
    let imported = 0

    const tables: SyncTable[] = [
      'pet_profiles',
      'pet_health_entries',
      'pet_vaccinations',
      'pet_symptom_checks',
      'pet_food_queries'
    ]

    for (const table of tables) {
      const records = data[table] as unknown[] | undefined
      if (!records || !Array.isArray(records)) continue

      for (const record of records) {
        try {
          const storageKey = `${table}_${(record as { id?: string }).id || generateRecordId()}`
          setStorage(storageKey, record)
          imported++
        } catch (err) {
          errors.push(`${table}: ${err instanceof Error ? err.message : '导入失败'}`)
        }
      }
    }

    return { imported, errors }
  }

  async clearCloudData(): Promise<{ success: boolean; error: string | null }> {
    if (!this.isAvailable()) {
      return { success: false, error: '云端不可用' }
    }

    const tables: SyncTable[] = [
      'pet_profiles',
      'pet_health_entries',
      'pet_vaccinations',
      'pet_symptom_checks',
      'pet_food_queries',
      'emotion_triggers',
      'pet_grief_sessions'
    ]

    let lastError: string | null = null

    for (const table of tables) {
      const result = await supabaseClient.delete(table, { user_id: `eq.${this.userId}` })
      if (result.error) {
        lastError = result.error
      }
    }

    return { success: !lastError, error: lastError }
  }

  getStatus(table: SyncTable): SyncStatus {
    const statuses = getSyncStatuses()
    const existing = statuses.find((s) => s.table === table)
    if (existing) return existing

    const queue = getSyncQueue()
    const pendingCount = queue.filter((r) => r.table_name === table && !r.synced).length

    return {
      table,
      lastPushAt: null,
      lastPullAt: null,
      pendingCount,
      error: null
    }
  }

  getAllStatuses(): SyncStatus[] {
    const tables: SyncTable[] = [
      'pet_profiles',
      'pet_health_entries',
      'pet_vaccinations',
      'pet_symptom_checks',
      'pet_food_queries',
      'emotion_triggers',
      'pet_grief_sessions'
    ]
    return tables.map((t) => this.getStatus(t))
  }

  private updateStatus(table: SyncTable): void {
    const statuses = getSyncStatuses()
    const existing = statuses.findIndex((s) => s.table === table)
    const queue = getSyncQueue()
    const pendingCount = queue.filter((r) => r.table_name === table && !r.synced).length

    const newStatus: SyncStatus = {
      table,
      lastPushAt: new Date().toISOString(),
      lastPullAt: new Date().toISOString(),
      pendingCount,
      error: null
    }

    if (existing !== -1) {
      statuses[existing] = newStatus
    } else {
      statuses.push(newStatus)
    }

    saveSyncStatuses(statuses)
  }
}

let syncServiceInstance: SyncService | null = null

export function getSyncService(userId?: string): SyncService {
  if (!syncServiceInstance && userId) {
    syncServiceInstance = new SyncService(userId)
  }
  if (userId && syncServiceInstance) {
    syncServiceInstance.setUserId(userId)
  }
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService(userId || '')
  }
  return syncServiceInstance
}
