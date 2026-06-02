import type { CycleRecord, CyclePrediction, CyclePhase } from './cycleTypes'
import { CYCLE_CONSTRAINTS } from './cycleTypes'

type PeriodSpan = {
  start: string
  end: string
  length: number
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

function daysBetween(start: string, end: string): number {
  const s = parseDate(start)
  const e = parseDate(end)
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

function extractRecentPeriods(records: CycleRecord[], maxCount: number): PeriodSpan[] {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const periods: PeriodSpan[] = []
  let currentStart: string | null = null
  let currentEnd: string | null = null

  for (const record of sorted) {
    if (record.flow) {
      if (currentStart && currentEnd) {
        const gap = daysBetween(currentEnd, record.date)
        if (gap > CYCLE_CONSTRAINTS.MAX_PERIOD_LENGTH) {
          periods.push({
            start: currentStart,
            end: currentEnd,
            length: daysBetween(currentStart, currentEnd) + 1
          })
          currentStart = record.date
          currentEnd = record.date
          continue
        }
      }
      if (!currentStart) {
        currentStart = record.date
      }
      currentEnd = record.date
    } else {
      if (currentStart && currentEnd) {
        periods.push({
          start: currentStart,
          end: currentEnd,
          length: daysBetween(currentStart, currentEnd) + 1
        })
      }
      currentStart = null
      currentEnd = null
    }
  }

  if (currentStart && currentEnd) {
    periods.push({
      start: currentStart,
      end: currentEnd,
      length: daysBetween(currentStart, currentEnd) + 1
    })
  }

  return periods.slice(-maxCount)
}

function calculateCycleLengths(periods: PeriodSpan[]): number[] {
  const lengths: number[] = []
  for (let i = 1; i < periods.length; i++) {
    const gap = daysBetween(periods[i - 1].start, periods[i].start)
    if (gap >= CYCLE_CONSTRAINTS.MIN_CYCLE_LENGTH && gap <= CYCLE_CONSTRAINTS.MAX_CYCLE_LENGTH) {
      lengths.push(gap)
    }
  }
  return lengths
}

function determineCurrentPhase(
  lastPeriodStart: string,
  avgCycleLength: number,
  avgPeriodLength: number,
  today?: string
): CyclePhase {
  const todayStr = today ?? formatDate(new Date())
  const daysSincePeriodStart = daysBetween(lastPeriodStart, todayStr)

  if (daysSincePeriodStart < 0) return 'luteal'

  if (daysSincePeriodStart < avgPeriodLength) {
    return 'menstrual'
  }

  const ovulationDay = Math.floor(avgCycleLength / 2)
  const follicularEnd = ovulationDay - 5

  if (daysSincePeriodStart < follicularEnd) {
    return 'follicular'
  }

  if (daysSincePeriodStart <= ovulationDay + 1) {
    return 'ovulation'
  }

  return 'luteal'
}

function calculateConfidence(periodCount: number, cycleLengths: number[]): number {
  if (periodCount < CYCLE_CONSTRAINTS.MIN_RECORDS_FOR_PREDICTION) return 0
  if (cycleLengths.length === 0) return 0.1

  const avg = average(cycleLengths)
  const variance = cycleLengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / cycleLengths.length
  const stdDev = Math.sqrt(variance)

  let confidence = Math.min(1, periodCount / CYCLE_CONSTRAINTS.MAX_RECORDS_FOR_PREDICTION)
  if (stdDev > 5) confidence *= 0.6
  else if (stdDev > 3) confidence *= 0.8

  return Math.round(confidence * 100) / 100
}

export function predictCycle(records: CycleRecord[], today?: string): CyclePrediction {
  const periods = extractRecentPeriods(records, CYCLE_CONSTRAINTS.MAX_RECORDS_FOR_PREDICTION)

  if (periods.length < CYCLE_CONSTRAINTS.MIN_RECORDS_FOR_PREDICTION) {
    const todayStr = today ?? formatDate(new Date())
    return {
      calculatedAt: new Date().toISOString(),
      averageCycleLength: CYCLE_CONSTRAINTS.DEFAULT_CYCLE_LENGTH,
      averagePeriodLength: CYCLE_CONSTRAINTS.DEFAULT_PERIOD_LENGTH,
      nextPeriodStart: addDays(todayStr, CYCLE_CONSTRAINTS.DEFAULT_CYCLE_LENGTH),
      nextPeriodEnd: addDays(todayStr, CYCLE_CONSTRAINTS.DEFAULT_CYCLE_LENGTH + CYCLE_CONSTRAINTS.DEFAULT_PERIOD_LENGTH - 1),
      nextOvulation: addDays(todayStr, Math.floor(CYCLE_CONSTRAINTS.DEFAULT_CYCLE_LENGTH / 2)),
      fertileWindowStart: addDays(todayStr, Math.floor(CYCLE_CONSTRAINTS.DEFAULT_CYCLE_LENGTH / 2) - 5),
      fertileWindowEnd: addDays(todayStr, Math.floor(CYCLE_CONSTRAINTS.DEFAULT_CYCLE_LENGTH / 2) + 1),
      currentPhase: 'follicular',
      confidence: 0
    }
  }

  const cycleLengths = calculateCycleLengths(periods)
  const periodLengths = periods.map(p => p.length)

  const avgCycleLength = cycleLengths.length > 0
    ? average(cycleLengths)
    : CYCLE_CONSTRAINTS.DEFAULT_CYCLE_LENGTH
  const avgPeriodLength = average(periodLengths)

  const lastPeriodStart = periods[periods.length - 1].start

  const nextPeriodStart = addDays(lastPeriodStart, avgCycleLength)
  const nextPeriodEnd = addDays(nextPeriodStart, avgPeriodLength - 1)
  const nextOvulation = addDays(nextPeriodStart, Math.floor(avgCycleLength / 2))
  const fertileWindowStart = addDays(nextOvulation, -5)
  const fertileWindowEnd = addDays(nextOvulation, 1)

  const currentPhase = determineCurrentPhase(lastPeriodStart, avgCycleLength, avgPeriodLength, today)
  const confidence = calculateConfidence(periods.length, cycleLengths)

  return {
    calculatedAt: new Date().toISOString(),
    averageCycleLength: avgCycleLength,
    averagePeriodLength: avgPeriodLength,
    nextPeriodStart,
    nextPeriodEnd,
    nextOvulation,
    fertileWindowStart,
    fertileWindowEnd,
    currentPhase,
    confidence
  }
}

export { extractRecentPeriods, calculateCycleLengths, determineCurrentPhase, addDays, formatDate, parseDate, daysBetween }
