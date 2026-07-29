import Taro from '@tarojs/taro'
import { getStorage, setStorage } from '../utils/storage'
import { api } from './api'
import {
  type DataExportResult,
  type DataDeleteResult,
  type AccountDeletionRequest,
  type AccountDeletionResult,
  type DataPrivacyStatus,
} from '../types/dataPrivacyTypes'

const PRIVACY_STATUS_KEY = 'data_privacy_status'
const DELETION_CONFIRM_KEY = 'account_deletion_confirm_code'

const ALL_USER_TABLES = [
  'pet_profiles',
  'pet_health_entries',
  'pet_food_queries',
  'pet_symptom_checks',
  'pet_vaccinations',
  'pet_health_trends',
  'emotion_triggers',
  'pet_grief_sessions',
  'memory_events',
  'usage_quotas',
  'memberships',
  'orders',
  'payment_records',
  'entitlements',
  'devices',
  'personas',
  'sync_log',
]

const EXPORT_TABLES = [
  'pet_profiles',
  'pet_health_entries',
  'pet_food_queries',
  'pet_symptom_checks',
  'pet_vaccinations',
  'pet_health_trends',
  'emotion_triggers',
  'pet_grief_sessions',
  'memory_events',
  'memberships',
]

function getPrivacyStatus(): DataPrivacyStatus {
  return getStorage<DataPrivacyStatus>(PRIVACY_STATUS_KEY) || {
    lastExportAt: null,
    lastDeleteAt: null,
    accountDeletionRequested: false,
    accountDeletionScheduledAt: null,
    totalDataSize: 0,
    totalRecords: 0,
  }
}

function savePrivacyStatus(status: DataPrivacyStatus): void {
  setStorage(PRIVACY_STATUS_KEY, status)
}

export async function exportAllUserData(userId: string): Promise<DataExportResult> {
  try {
    const allData: Record<string, unknown[]> = {}
    let totalRecords = 0

    const exportEndpoints: Record<string, () => Promise<unknown[]>> = {
      pet_profiles: async () => {
        try { return await api.get('/api/pets') as unknown[]; } catch { return []; }
      },
      memberships: async () => {
        try { const r = await api.get('/api/membership/status'); return [r]; } catch { return []; }
      },
      pet_food_queries: async () => {
        try { return await api.get('/api/food/history') as unknown[]; } catch { return []; }
      },
    }

    for (const table of EXPORT_TABLES) {
      try {
        const fetcher = exportEndpoints[table]
        if (fetcher) {
          const data = await fetcher()
          allData[table] = data
          totalRecords += data.length
        } else {
          allData[table] = []
        }
      } catch {
        allData[table] = []
      }
    }

    const localData: Record<string, unknown> = {}
    const localKeys = [
      'xhh_checkin_data',
      'xhh_pet_data',
      'xhh_notification_data',
      'xhh_subscribe_status',
      'xhh_settings',
    ]

    for (const key of localKeys) {
      try {
        const value = Taro.getStorageSync(key)
        if (value) localData[key] = value
      } catch {
        // ignore
      }
    }

    allData['_local_storage'] = [localData]

    const jsonData = JSON.stringify(allData, null, 2)
    const now = new Date().toISOString()

    const status = getPrivacyStatus()
    status.lastExportAt = now
    status.totalRecords = totalRecords
    status.totalDataSize = jsonData.length
    savePrivacyStatus(status)

    return {
      success: true,
      data: jsonData,
      exportedAt: now,
      tables: EXPORT_TABLES,
      totalRecords,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出失败',
      exportedAt: new Date().toISOString(),
      tables: [],
      totalRecords: 0,
    }
  }
}

export async function deleteUserData(
  userId: string,
  tableNames?: string[]
): Promise<DataDeleteResult> {
  try {
    const tablesToDelete = tableNames || ALL_USER_TABLES
    let deletedRecords = 0
    const deletedTables: string[] = []

    const deleteTableHandlers: Record<string, () => Promise<number>> = {
      pet_profiles: async () => {
        const pets = await api.get<Array<{ id: string }>>('/api/pets')
        let count = 0
        for (const pet of pets) {
          await api.delete(`/api/pets/${pet.id}`)
          count++
        }
        return count
      },
      pet_health_entries: async () => {
        try { await api.delete('/api/data/health-entries'); return 0; } catch { return 0; }
      },
      pet_food_queries: async () => {
        try { await api.delete('/api/data/food-queries'); return 0; } catch { return 0; }
      },
      pet_symptom_checks: async () => {
        try { await api.delete('/api/data/symptom-checks'); return 0; } catch { return 0; }
      },
      pet_vaccinations: async () => {
        try { await api.delete('/api/data/vaccinations'); return 0; } catch { return 0; }
      },
      pet_health_trends: async () => {
        try { await api.delete('/api/data/health-trends'); return 0; } catch { return 0; }
      },
      emotion_triggers: async () => {
        try { await api.delete('/api/data/emotion-triggers'); return 0; } catch { return 0; }
      },
      pet_grief_sessions: async () => {
        try { await api.delete('/api/data/grief-sessions'); return 0; } catch { return 0; }
      },
      memory_events: async () => {
        try { await api.delete('/api/data/memory-events'); return 0; } catch { return 0; }
      },
      usage_quotas: async () => {
        try { await api.delete('/api/data/usage-quotas'); return 0; } catch { return 0; }
      },
      memberships: async () => {
        try { await api.delete('/api/membership'); return 0; } catch { return 0; }
      },
      orders: async () => {
        try { await api.delete('/api/orders'); return 0; } catch { return 0; }
      },
      payment_records: async () => {
        try { await api.delete('/api/payment-records'); return 0; } catch { return 0; }
      },
      entitlements: async () => {
        try { await api.delete('/api/entitlements'); return 0; } catch { return 0; }
      },
      devices: async () => {
        try { await api.delete('/api/devices'); return 0; } catch { return 0; }
      },
      personas: async () => {
        try { await api.delete('/api/personas'); return 0; } catch { return 0; }
      },
      sync_log: async () => {
        try { await api.delete('/api/data/sync-log'); return 0; } catch { return 0; }
      },
    }

    for (const table of tablesToDelete) {
      try {
        const handler = deleteTableHandlers[table]
        if (handler) {
          const count = await handler()
          deletedRecords += count
          deletedTables.push(table)
        }
      } catch {
        deletedTables.push(table)
      }
    }

    Taro.clearStorageSync()

    const now = new Date().toISOString()
    const status = getPrivacyStatus()
    status.lastDeleteAt = now
    savePrivacyStatus(status)

    return {
      success: true,
      deletedAt: now,
      deletedTables,
      deletedRecords,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除失败',
      deletedAt: new Date().toISOString(),
      deletedTables: [],
      deletedRecords: 0,
    }
  }
}

export function generateDeletionConfirmCode(): string {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  setStorage(DELETION_CONFIRM_KEY, code)
  return code
}

export function verifyDeletionConfirmCode(inputCode: string): boolean {
  const storedCode = getStorage<string>(DELETION_CONFIRM_KEY)
  return storedCode === inputCode
}

export async function requestAccountDeletion(
  userId: string,
  request: AccountDeletionRequest
): Promise<AccountDeletionResult> {
  if (!verifyDeletionConfirmCode(request.confirmCode)) {
    return {
      success: false,
      error: '确认码不正确',
      gracePeriodDays: 30,
    }
  }

  try {
    await api.post('/api/auth/delete-account', {
      reason: request.reason,
      custom_reason: request.customReason,
    })

    const scheduledAt = new Date()
    scheduledAt.setDate(scheduledAt.getDate() + 30)

    const status = getPrivacyStatus()
    status.accountDeletionRequested = true
    status.accountDeletionScheduledAt = scheduledAt.toISOString()
    savePrivacyStatus(status)

    return {
      success: true,
      scheduledDeletionAt: scheduledAt.toISOString(),
      gracePeriodDays: 30,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '注销请求失败',
      gracePeriodDays: 30,
    }
  }
}

export async function cancelAccountDeletion(userId: string): Promise<boolean> {
  try {
    await api.post('/api/auth/cancel-deletion')

    const status = getPrivacyStatus()
    status.accountDeletionRequested = false
    status.accountDeletionScheduledAt = null
    savePrivacyStatus(status)
    return true
  } catch {
    return false
  }
}

export function getDataPrivacyStatus(): DataPrivacyStatus {
  return getPrivacyStatus()
}
