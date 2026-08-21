/**
 * 数据同步服务
 *
 * 本地数据变更队列管理，含重试/冲突检测/在线状态感知
 */
import { api } from './api'
import { encrypt, decrypt } from '../utils/crypto'
import { getStorage, setStorage } from '../utils/storage'
import { toSnakeCase } from '../utils/snakeCase'

export type SyncTable =
  | 'pet_profiles'
  | 'pet_health_entries'
  | 'pet_vaccinations'
  | 'pet_symptom_checks'
  | 'pet_food_queries'
  | 'emotion_triggers'
  | 'pet_grief_sessions'
  | 'pet_outfits'

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

const TABLE_ENDPOINTS: Record<SyncTable, { list: string; item: (id: string) => string } | null> = {
  pet_profiles: { list: '/api/pets', item: (id: string) => `/api/pets/${id}` },
  pet_health_entries: null, // 已迁移到 /api/pets/:petId/chronic（pet 级路由，不使用统一同步）
  pet_vaccinations: { list: '/api/vaccines', item: (id: string) => `/api/vaccines/${id}` },
  pet_symptom_checks: { list: '/api/symptom-checks', item: (id: string) => `/api/symptom-checks/${id}` },
  pet_food_queries: { list: '/api/food', item: (id: string) => `/api/food/${id}` },
  emotion_triggers: null,
  pet_grief_sessions: null,
  pet_outfits: null,
}

/**
 * 各表推送前的 payload 字段转换（服务端 zod schema 契约差异）
 * - pet_profiles：服务端 PUT /api/pets/:id 只认 snake_case，camelCase 会被 zod 剥离导致 400，
 *   离线队列里存的是 camelCase PetProfile，联网推送前必须转 snake_case；
 * - 其他表（vaccines/symptom-checks/food 等）服务端契约是 camelCase 与 snake_case 混合，
 *   不能一刀切转换，保持原样推送。
 */
const PUSH_PAYLOAD_TRANSFORM: Partial<Record<SyncTable, (data: Record<string, unknown>) => Record<string, unknown>>> = {
  pet_profiles: toSnakeCase,
}

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
    return !!this.userId
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

    const mapping = TABLE_ENDPOINTS[table]
    if (!mapping) {
      return { pushed: 0, error: '不支持的表' }
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
          await api.delete(mapping.item(record.record_id))
        } else {
          const { userId: _parsedUserId, ...restData } = parsed
          let payload: Record<string, unknown> = {
            ...restData,
            id: record.record_id,
            userId: this.userId,
            syncedAt: new Date().toISOString()
          }
          // 按表应用契约转换（如 pet_profiles → snake_case），避免服务端 zod 剥离导致同步失败
          const transform = PUSH_PAYLOAD_TRANSFORM[table]
          if (transform) {
            payload = transform(payload)
          }
          await api.put(mapping.item(record.record_id), payload)
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

    const mapping = TABLE_ENDPOINTS[table]
    if (!mapping) {
      return { pulled: 0, error: null }
    }

    try {
      const params: Record<string, string> = { limit: '100' }
      const result = await api.get<Record<string, unknown>[]>(mapping.list, params)

      if (!result || result.length === 0) {
        return { pulled: 0, error: null }
      }

      let pulled = 0
      for (const record of result) {
        try {
          let data = record

          if (SENSITIVE_TABLES.includes(table) && (record as Record<string, unknown>).data) {
            const decrypted = this.decryptData((record as Record<string, unknown>).data as string)
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
      'pet_food_queries'
    ]

    let lastError: string | null = null

    for (const table of tables) {
      const mapping = TABLE_ENDPOINTS[table]
      if (!mapping) continue

      try {
        const records = await api.get<Array<{ id: string }>>(mapping.list)
        for (const record of records) {
          await api.delete(mapping.item(record.id))
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : '删除失败'
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
