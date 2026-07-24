import { getStorage, setStorage } from '../utils/storage'
import { getSyncService, type SyncTable } from './syncService'
import type { ChronicRecord } from '../types/chronicTypes'

const STORAGE_KEY = 'chronic_records'
const CHRONIC_TABLE: SyncTable = 'pet_health_entries'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function getChronicStorage(userId: string): Record<string, ChronicRecord[]> {
  return getStorage<Record<string, ChronicRecord[]>>(STORAGE_KEY) || {}
}

function saveChronicStorage(userId: string, data: Record<string, ChronicRecord[]>): void {
  setStorage(STORAGE_KEY, data)
}

export function getChronicRecords(petId: string, userId: string): ChronicRecord[] {
  const all = getChronicStorage(userId)
  return all[petId] || []
}

export function addChronicRecord(
  petId: string,
  userId: string,
  data: Omit<ChronicRecord, 'id' | 'petId' | 'createdAt' | 'updatedAt'>
): ChronicRecord {
  const all = getChronicStorage(userId)
  const now = new Date().toISOString()
  const record: ChronicRecord = {
    ...data,
    id: generateId(),
    petId,
    createdAt: now,
    updatedAt: now,
  }

  if (!all[petId]) {
    all[petId] = []
  }
  all[petId] = [record, ...all[petId]]
  saveChronicStorage(userId, all)

  try {
    const syncService = getSyncService(userId)
    syncService.queueForSync(CHRONIC_TABLE, record.id, 'insert', record)
  } catch {
    // 离线模式忽略
  }

  return record
}

export function updateChronicRecord(
  petId: string,
  userId: string,
  recordId: string,
  updates: Partial<ChronicRecord>
): ChronicRecord | null {
  const all = getChronicStorage(userId)
  const records = all[petId]
  if (!records) return null

  const index = records.findIndex(r => r.id === recordId)
  if (index === -1) return null

  const updated = { ...records[index], ...updates, updatedAt: new Date().toISOString() }
  records[index] = updated
  saveChronicStorage(userId, all)

  try {
    const syncService = getSyncService(userId)
    syncService.queueForSync(CHRONIC_TABLE, recordId, 'update', updated)
  } catch {
    // 离线模式忽略
  }

  return updated
}

export function deleteChronicRecord(petId: string, userId: string, recordId: string): boolean {
  const all = getChronicStorage(userId)
  const records = all[petId]
  if (!records) return false

  const index = records.findIndex(r => r.id === recordId)
  if (index === -1) return false

  records.splice(index, 1)
  saveChronicStorage(userId, all)

  try {
    const syncService = getSyncService(userId)
    syncService.queueForSync(CHRONIC_TABLE, recordId, 'delete', { id: recordId })
  } catch {
    // 离线模式忽略
  }

  return true
}

export function getChronicStats(petId: string, userId: string): {
  active: number
  managed: number
  resolved: number
  total: number
  overdueCheckups: number
} {
  const records = getChronicRecords(petId, userId)
  const now = new Date()

  return {
    active: records.filter(r => r.status === 'active').length,
    managed: records.filter(r => r.status === 'managed').length,
    resolved: records.filter(r => r.status === 'resolved').length,
    total: records.length,
    overdueCheckups: records.filter(r => {
      if (!r.nextCheckupDate) return false
      if (r.status === 'resolved') return false
      return new Date(r.nextCheckupDate) < now
    }).length,
  }
}

export function getUpcomingCheckups(
  petId: string,
  userId: string,
  daysAhead: number = 7
): Array<{ record: ChronicRecord; daysUntil: number; isOverdue: boolean }> {
  const records = getChronicRecords(petId, userId)
  const now = new Date()
  const upcoming: Array<{ record: ChronicRecord; daysUntil: number; isOverdue: boolean }> = []

  for (const record of records) {
    if (!record.nextCheckupDate) continue
    if (record.status === 'resolved') continue

    const checkupDate = new Date(record.nextCheckupDate)
    const diffMs = checkupDate.getTime() - now.getTime()
    const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (daysUntil <= daysAhead) {
      upcoming.push({
        record,
        daysUntil,
        isOverdue: daysUntil < 0,
      })
    }
  }

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil)
}

export function getChronicTrendData(
  petId: string,
  userId: string,
  days: number = 30
): Array<{ date: string; conditions: string[]; severityCounts: Record<string, number> }> {
  const records = getChronicRecords(petId, userId)
  const now = new Date()
  const trend: Array<{ date: string; conditions: string[]; severityCounts: Record<string, number> }> = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().slice(0, 10)

    const activeOnDate = records.filter(r => {
      const diagnosed = new Date(r.diagnosedDate)
      const resolved = r.status === 'resolved' ? new Date(r.updatedAt) : null
      return diagnosed <= date && (!resolved || resolved > date)
    })

    const severityCounts: Record<string, number> = { mild: 0, moderate: 0, severe: 0 }
    for (const r of activeOnDate) {
      severityCounts[r.severity] = (severityCounts[r.severity] || 0) + 1
    }

    trend.push({
      date: dateStr,
      conditions: activeOnDate.map(r => r.condition),
      severityCounts,
    })
  }

  return trend
}

export function generateChronicReminderPayload(
  record: ChronicRecord,
  petName: string,
  daysUntil: number
): { title: string; content: string; isUrgent: boolean } {
  if (daysUntil < 0) {
    return {
      title: `${petName} 复查已逾期`,
      content: `${record.condition} 复查日期已过 ${Math.abs(daysUntil)} 天，请尽快安排复查`,
      isUrgent: true,
    }
  }
  if (daysUntil === 0) {
    return {
      title: `${petName} 今天需要复查`,
      content: `${record.condition} 复查日期就在今天，请勿忘记`,
      isUrgent: true,
    }
  }
  if (daysUntil <= 3) {
    return {
      title: `${petName} 复查提醒`,
      content: `${record.condition} 复查还剩 ${daysUntil} 天`,
      isUrgent: false,
    }
  }
  return {
    title: `${petName} 复查提醒`,
    content: `${record.condition} 复查日期 ${record.nextCheckupDate}，还剩 ${daysUntil} 天`,
    isUrgent: false,
  }
}