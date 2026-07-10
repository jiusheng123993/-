import type { CycleRecord, CyclePrediction, CycleSettings } from './cycleTypes'
import { DEFAULT_CYCLE_SETTINGS, CYCLE_CONSTRAINTS } from './cycleTypes'
import { predictCycle } from './cyclePredictionEngine'
import { generateEnergySuggestion } from './energySuggestionEngine'
import { formatDate } from './cyclePredictionEngine'

function generateId(): string {
  return `cr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function loadRecords(): CycleRecord[] {
  try {
    const raw = localStorage.getItem(CYCLE_CONSTRAINTS.RECORDS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CycleRecord[]
  } catch {
    return []
  }
}

function saveRecords(records: CycleRecord[]): void {
  localStorage.setItem(CYCLE_CONSTRAINTS.RECORDS_STORAGE_KEY, JSON.stringify(records))
}

function loadSettings(): CycleSettings {
  try {
    const raw = localStorage.getItem(CYCLE_CONSTRAINTS.SETTINGS_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CYCLE_SETTINGS }
    return { ...DEFAULT_CYCLE_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CYCLE_SETTINGS }
  }
}

function saveSettings(settings: CycleSettings): void {
  localStorage.setItem(CYCLE_CONSTRAINTS.SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export type CycleService = {
  getRecords: () => CycleRecord[]
  getRecordByDate: (date: string) => CycleRecord | undefined
  addRecord: (record: Omit<CycleRecord, 'id' | 'createdAt' | 'updatedAt'>) => CycleRecord
  updateRecord: (id: string, patch: Partial<Omit<CycleRecord, 'id' | 'createdAt'>>) => CycleRecord | undefined
  deleteRecord: (id: string) => boolean
  getPrediction: (today?: string) => CyclePrediction
  getEnergySuggestion: (today?: string) => import('./cycleTypes').EnergySuggestion
  getSettings: () => CycleSettings
  updateSettings: (patch: Partial<CycleSettings>) => CycleSettings
  verifyPrivacyPin: (pin: string) => boolean
  setPrivacyPin: (pin: string) => void
  exportData: () => string
  clearAllData: () => void
}

export function createCycleService(): CycleService {
  return {
    getRecords: () => loadRecords(),

    getRecordByDate: (date) => {
      return loadRecords().find(r => r.date === date)
    },

    addRecord: (record) => {
      const records = loadRecords()
      const existing = records.findIndex(r => r.date === record.date)
      if (existing !== -1) {
        const now = new Date().toISOString()
        records[existing] = {
          ...records[existing],
          ...record,
          updatedAt: now
        }
        saveRecords(records)
        return records[existing]
      }
      const now = new Date().toISOString()
      const newRecord: CycleRecord = {
        ...record,
        id: generateId(),
        createdAt: now,
        updatedAt: now
      }
      records.push(newRecord)
      saveRecords(records)
      return newRecord
    },

    updateRecord: (id, patch) => {
      const records = loadRecords()
      const idx = records.findIndex(r => r.id === id)
      if (idx === -1) return undefined
      records[idx] = {
        ...records[idx],
        ...patch,
        updatedAt: new Date().toISOString()
      }
      saveRecords(records)
      return records[idx]
    },

    deleteRecord: (id) => {
      const records = loadRecords()
      const filtered = records.filter(r => r.id !== id)
      if (filtered.length === records.length) return false
      saveRecords(filtered)
      return true
    },

    getPrediction: (today) => {
      const records = loadRecords()
      return predictCycle(records, today)
    },

    getEnergySuggestion: (today) => {
      const todayStr = today ?? formatDate(new Date())
      const prediction = predictCycle(loadRecords(), today)
      return generateEnergySuggestion(prediction.currentPhase, todayStr)
    },

    getSettings: () => loadSettings(),

    updateSettings: (patch) => {
      const current = loadSettings()
      const updated = { ...current, ...patch }
      saveSettings(updated)
      return updated
    },

    verifyPrivacyPin: (pin) => {
      const settings = loadSettings()
      if (!settings.privacyLockEnabled || !settings.privacyPin) return true
      return settings.privacyPin === pin
    },

    setPrivacyPin: (pin) => {
      const settings = loadSettings()
      settings.privacyPin = pin
      settings.privacyLockEnabled = true
      saveSettings(settings)
    },

    exportData: () => {
      const records = loadRecords()
      const settings = loadSettings()
      return JSON.stringify({ records, settings, exportedAt: new Date().toISOString() }, null, 2)
    },

    clearAllData: () => {
      localStorage.removeItem(CYCLE_CONSTRAINTS.RECORDS_STORAGE_KEY)
      localStorage.removeItem(CYCLE_CONSTRAINTS.SETTINGS_STORAGE_KEY)
    }
  }
}

export const cycleService = createCycleService()
