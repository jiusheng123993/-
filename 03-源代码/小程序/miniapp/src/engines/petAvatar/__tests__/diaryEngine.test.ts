import { describe, it, expect } from 'vitest'
import { generateDiaryEntry, generateDiaryForToday, type DiaryEntry } from '../diaryEngine'
import type { PetHealthEntry } from '../../../memory-body/types/memoryBodyTypes'

function makeEntry(overrides: Partial<PetHealthEntry> = {}): PetHealthEntry {
  return {
    id: 'e1',
    petId: 'p1',
    userId: 'u1',
    poopLevel: 3,
    appetiteLevel: 3,
    spiritLevel: 3,
    exerciseLevel: 2,
    hasAnomaly: false,
    anomalyItems: [],
    riskLevel: 'low',
    createdAt: new Date(),
    ...overrides,
  }
}

describe('generateDiaryEntry', () => {
  it('returns birthday template when isBirthday is true', () => {
    const entry = makeEntry()
    const result = generateDiaryEntry(entry, 0, true, false)
    expect(result.tone).toBe('happy')
    expect(result.emoji).toBeTruthy()
  })

  it('returns recovery template when isRecovery is true', () => {
    const entry = makeEntry()
    const result = generateDiaryEntry(entry, 0, false, true)
    expect(result.tone).toBe('happy')
    expect(result.emoji).toBeTruthy()
  })

  it('returns streak_30 template for 30+ streak days', () => {
    const entry = makeEntry()
    const result = generateDiaryEntry(entry, 30, false, false)
    expect(result.tone).toBe('proud')
  })

  it('returns streak_7 template for 7-29 streak days', () => {
    const entry = makeEntry()
    const result = generateDiaryEntry(entry, 7, false, false)
    expect(result.tone).toBe('proud')
  })

  it('returns streak_3 template for 3-6 streak days with no anomaly', () => {
    const entry = makeEntry()
    const result = generateDiaryEntry(entry, 3, false, false)
    expect(result.tone).toBe('proud')
  })

  it('returns anomaly template for appetite anomaly', () => {
    const entry = makeEntry({
      hasAnomaly: true,
      anomalyItems: ['appetite' as const],
    })
    const result = generateDiaryEntry(entry, 0, false, false)
    expect(result.emoji).toBeTruthy()
    expect(result.text).toBeTruthy()
  })

  it('returns anomaly template for spirit anomaly', () => {
    const entry = makeEntry({
      hasAnomaly: true,
      anomalyItems: ['spirit' as const],
    })
    const result = generateDiaryEntry(entry, 0, false, false)
    expect(result.emoji).toBeTruthy()
  })

  it('returns anomaly template for poop anomaly', () => {
    const entry = makeEntry({
      hasAnomaly: true,
      anomalyItems: ['poop' as const],
    })
    const result = generateDiaryEntry(entry, 0, false, false)
    expect(result.emoji).toBeTruthy()
  })

  it('returns all_normal template for normal entry', () => {
    const entry = makeEntry()
    const result = generateDiaryEntry(entry, 0, false, false)
    expect(result.tone).toBe('happy')
  })

  it('returns default template when anomaly type has no specific template', () => {
    const entry = makeEntry({
      hasAnomaly: true,
      anomalyItems: ['other' as const],
    })
    const result = generateDiaryEntry(entry, 0, false, false)
    expect(result.emoji).toBeTruthy()
  })

  it('birthday takes priority over streak', () => {
    const entry = makeEntry()
    const result = generateDiaryEntry(entry, 30, true, false)
    expect(result.tone).toBe('happy')
  })

  it('recovery takes priority over streak', () => {
    const entry = makeEntry()
    const result = generateDiaryEntry(entry, 30, false, true)
    expect(result.tone).toBe('happy')
  })

  it('returns valid DiaryEntry structure', () => {
    const entry = makeEntry()
    const result = generateDiaryEntry(entry, 0, false, false)
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('tone')
    expect(result).toHaveProperty('emoji')
    expect(typeof result.text).toBe('string')
    expect(typeof result.emoji).toBe('string')
    expect(['happy', 'neutral', 'tired', 'sick', 'proud']).toContain(result.tone)
  })
})

describe('generateDiaryForToday', () => {
  it('returns reminder when no entry provided', () => {
    const result = generateDiaryForToday(null, 0, false, false)
    expect(result.tone).toBe('neutral')
    expect(result.emoji).toBe('⏰')
    expect(result.text).toContain('打卡')
  })

  it('delegates to generateDiaryEntry when entry exists', () => {
    const entry = makeEntry()
    const result = generateDiaryForToday(entry, 0, false, false)
    expect(result.tone).toBe('happy')
  })

  it('handles birthday with entry', () => {
    const entry = makeEntry()
    const result = generateDiaryForToday(entry, 0, true, false)
    expect(result.tone).toBe('happy')
  })
})
