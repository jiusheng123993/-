import { describe, it, expect } from 'vitest'
import { predictCycle, extractRecentPeriods, calculateCycleLengths, determineCurrentPhase, addDays, daysBetween } from './cyclePredictionEngine'
import type { CycleRecord, FlowLevel, SymptomType, MoodType } from './cycleTypes'

function makeRecord(date: string, flow?: FlowLevel, symptoms: SymptomType[] = [], moods: MoodType[] = []): CycleRecord {
  return {
    id: `r_${date}`,
    date,
    flow,
    symptoms,
    moods,
    createdAt: date,
    updatedAt: date
  }
}

function makePeriodRecords(): CycleRecord[] {
  const records: CycleRecord[] = []
  const periodDates = [
    ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05'],
    ['2026-01-29', '2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02'],
    ['2026-02-26', '2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02'],
    ['2026-03-26', '2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30']
  ]
  for (const dates of periodDates) {
    for (const date of dates) {
      records.push(makeRecord(date, 'medium'))
    }
  }
  return records
}

describe('addDays', () => {
  it('adds days correctly', () => {
    expect(addDays('2026-01-01', 28)).toBe('2026-01-29')
  })

  it('handles month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
  })

  it('handles year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('daysBetween', () => {
  it('calculates days between two dates', () => {
    expect(daysBetween('2026-01-01', '2026-01-29')).toBe(28)
  })

  it('returns 0 for same date', () => {
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0)
  })
})

describe('extractRecentPeriods', () => {
  it('extracts periods from records with flow', () => {
    const records = makePeriodRecords()
    const periods = extractRecentPeriods(records, 6)
    expect(periods.length).toBe(4)
  })

  it('returns empty array when no flow records', () => {
    const records = [makeRecord('2026-01-01', undefined)]
    const periods = extractRecentPeriods(records, 6)
    expect(periods.length).toBe(0)
  })

  it('limits to maxCount', () => {
    const records = makePeriodRecords()
    const periods = extractRecentPeriods(records, 2)
    expect(periods.length).toBe(2)
  })
})

describe('calculateCycleLengths', () => {
  it('calculates cycle lengths between periods', () => {
    const records = makePeriodRecords()
    const periods = extractRecentPeriods(records, 6)
    const lengths = calculateCycleLengths(periods)
    expect(lengths.length).toBe(3)
    expect(lengths[0]).toBe(28)
  })
})

describe('determineCurrentPhase', () => {
  it('returns menstrual during period', () => {
    expect(determineCurrentPhase('2026-03-26', 28, 5, '2026-03-26')).toBe('menstrual')
  })

  it('returns follicular after period', () => {
    expect(determineCurrentPhase('2026-03-26', 28, 5, '2026-03-31')).toBe('follicular')
  })

  it('returns ovulation around mid-cycle', () => {
    expect(determineCurrentPhase('2026-03-26', 28, 5, '2026-04-09')).toBe('ovulation')
  })

  it('returns luteal after ovulation', () => {
    expect(determineCurrentPhase('2026-03-26', 28, 5, '2026-04-15')).toBe('luteal')
  })
})

describe('predictCycle', () => {
  it('returns default prediction with insufficient data', () => {
    const records = [makeRecord('2026-01-01', 'medium')]
    const prediction = predictCycle(records, '2026-01-15')
    expect(prediction.confidence).toBe(0)
    expect(prediction.averageCycleLength).toBe(28)
  })

  it('returns prediction with enough data', () => {
    const records = makePeriodRecords()
    const prediction = predictCycle(records, '2026-04-01')
    expect(prediction.confidence).toBeGreaterThan(0)
    expect(prediction.averageCycleLength).toBe(28)
    expect(prediction.averagePeriodLength).toBe(5)
  })

  it('predicts next period start correctly', () => {
    const records = makePeriodRecords()
    const prediction = predictCycle(records, '2026-04-01')
    expect(prediction.nextPeriodStart).toBe('2026-04-23')
  })

  it('predicts ovulation correctly', () => {
    const records = makePeriodRecords()
    const prediction = predictCycle(records, '2026-04-01')
    expect(prediction.nextOvulation).toBe(addDays('2026-04-23', 14))
  })

  it('predicts fertile window', () => {
    const records = makePeriodRecords()
    const prediction = predictCycle(records, '2026-04-01')
    expect(prediction.fertileWindowStart).toBe(addDays(prediction.nextOvulation, -5))
    expect(prediction.fertileWindowEnd).toBe(addDays(prediction.nextOvulation, 1))
  })

  it('determines current phase', () => {
    const records = makePeriodRecords()
    const prediction = predictCycle(records, '2026-04-01')
    expect(prediction.currentPhase).toBeDefined()
  })

  it('handles empty records', () => {
    const prediction = predictCycle([], '2026-04-01')
    expect(prediction.confidence).toBe(0)
    expect(prediction.averageCycleLength).toBe(28)
  })
})