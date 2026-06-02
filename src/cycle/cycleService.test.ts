import { describe, it, expect, beforeEach } from 'vitest'
import { createCycleService } from './cycleService'
import { CYCLE_CONSTRAINTS } from './cycleTypes'

describe('CycleService', () => {
  let service: ReturnType<typeof createCycleService>

  beforeEach(() => {
    localStorage.clear()
    service = createCycleService()
  })

  it('starts with no records', () => {
    expect(service.getRecords()).toHaveLength(0)
  })

  it('starts with default settings', () => {
    const settings = service.getSettings()
    expect(settings.enabled).toBe(false)
    expect(settings.reminderDaysBefore).toBe(3)
  })

  it('adds a record', () => {
    const record = service.addRecord({
      date: '2026-06-02',
      flow: 'medium',
      symptoms: ['cramps'],
      moods: ['calm']
    })
    expect(record.id).toBeTruthy()
    expect(record.date).toBe('2026-06-02')
    expect(record.flow).toBe('medium')
  })

  it('updates existing record for same date', () => {
    service.addRecord({ date: '2026-06-02', flow: 'light', symptoms: [], moods: [] })
    const updated = service.addRecord({ date: '2026-06-02', flow: 'heavy', symptoms: ['cramps'], moods: [] })
    expect(updated.flow).toBe('heavy')
    expect(service.getRecords()).toHaveLength(1)
  })

  it('gets record by date', () => {
    service.addRecord({ date: '2026-06-02', flow: 'medium', symptoms: [], moods: [] })
    const found = service.getRecordByDate('2026-06-02')
    expect(found).toBeDefined()
    expect(found!.flow).toBe('medium')
  })

  it('updates a record by id', () => {
    const added = service.addRecord({ date: '2026-06-02', flow: 'light', symptoms: [], moods: [] })
    const updated = service.updateRecord(added.id, { flow: 'heavy' })
    expect(updated).toBeDefined()
    expect(updated!.flow).toBe('heavy')
  })

  it('deletes a record', () => {
    const added = service.addRecord({ date: '2026-06-02', flow: 'medium', symptoms: [], moods: [] })
    expect(service.deleteRecord(added.id)).toBe(true)
    expect(service.getRecords()).toHaveLength(0)
  })

  it('returns prediction', () => {
    const prediction = service.getPrediction('2026-06-02')
    expect(prediction).toBeDefined()
    expect(prediction.averageCycleLength).toBeGreaterThan(0)
  })

  it('returns energy suggestion', () => {
    const suggestion = service.getEnergySuggestion('2026-06-02')
    expect(suggestion).toBeDefined()
    expect(suggestion.suggestions.length).toBeGreaterThan(0)
  })

  it('updates settings', () => {
    const updated = service.updateSettings({ enabled: true, reminderDaysBefore: 5 })
    expect(updated.enabled).toBe(true)
    expect(updated.reminderDaysBefore).toBe(5)
  })

  it('handles privacy pin', () => {
    service.setPrivacyPin('1234')
    expect(service.verifyPrivacyPin('1234')).toBe(true)
    expect(service.verifyPrivacyPin('0000')).toBe(false)
  })

  it('exports data as JSON', () => {
    service.addRecord({ date: '2026-06-02', flow: 'medium', symptoms: [], moods: [] })
    const exported = service.exportData()
    const parsed = JSON.parse(exported)
    expect(parsed.records).toHaveLength(1)
    expect(parsed.exportedAt).toBeTruthy()
  })

  it('clears all data', () => {
    service.addRecord({ date: '2026-06-02', flow: 'medium', symptoms: [], moods: [] })
    service.clearAllData()
    expect(service.getRecords()).toHaveLength(0)
  })

  it('persists records to localStorage', () => {
    service.addRecord({ date: '2026-06-02', flow: 'medium', symptoms: [], moods: [] })
    const raw = localStorage.getItem(CYCLE_CONSTRAINTS.RECORDS_STORAGE_KEY)
    expect(raw).toBeTruthy()
  })

  it('persists settings to localStorage', () => {
    service.updateSettings({ enabled: true })
    const raw = localStorage.getItem(CYCLE_CONSTRAINTS.SETTINGS_STORAGE_KEY)
    expect(raw).toBeTruthy()
  })
})