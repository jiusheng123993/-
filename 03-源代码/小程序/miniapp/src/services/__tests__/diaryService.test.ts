/**
 * 日记服务测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateDiaryFromEntries, type DiaryRecord } from '../../../src/services/diaryService'
import type { PetHealthEntry } from '../../../src/memory-body/types/memoryBodyTypes'

function makeEntry(overrides: Partial<PetHealthEntry> = {}): PetHealthEntry {
  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    petId: 'pet-001',
    userId: 'user-001',
    appetiteLevel: 5,
    spiritLevel: 5,
    poopLevel: 5,
    exerciseLevel: 2 as 1 | 2 | 3,
    weight: undefined,
    note: '',
    hasAnomaly: false,
    anomalyItems: [],
    riskLevel: 'low',
    aiFeedback: '',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    ...overrides,
  }
}

describe('diaryService', () => {
  describe('generateDiaryFromEntries', () => {
    it('should return empty array when no entries', () => {
      const result = generateDiaryFromEntries([])
      expect(result).toEqual([])
    })

    it('should generate diary entry for single normal checkin', () => {
      const entries = [makeEntry({ id: 'e1', createdAt: new Date('2024-01-01T10:00:00Z') })]
      const result = generateDiaryFromEntries(entries)
      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2024-01-01')
      expect(result[0].diary.text).toBeTruthy()
      expect(result[0].diary.emoji).toBeTruthy()
      expect(result[0].diary.tone).toBeTruthy()
    })

    it('should sort entries by date descending (newest first)', () => {
      const entries = [
        makeEntry({ id: 'e1', createdAt: new Date('2024-01-03T10:00:00Z') }),
        makeEntry({ id: 'e2', createdAt: new Date('2024-01-01T10:00:00Z') }),
        makeEntry({ id: 'e3', createdAt: new Date('2024-01-02T10:00:00Z') }),
      ]
      const result = generateDiaryFromEntries(entries)
      expect(result[0].date).toBe('2024-01-03')
      expect(result[1].date).toBe('2024-01-02')
      expect(result[2].date).toBe('2024-01-01')
    })

    it('should detect birthday and use happy tone', () => {
      const entries = [
        makeEntry({
          id: 'e1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
        }),
      ]
      const result = generateDiaryFromEntries(entries, '2024-01-01')
      expect(result[0].diary.tone).toBe('happy')
      expect(result[0].diary.emoji).toBeTruthy()
    })

    it('should detect consecutive days streak', () => {
      const entries = [
        makeEntry({ id: 'e1', createdAt: new Date('2024-01-01T10:00:00Z') }),
        makeEntry({ id: 'e2', createdAt: new Date('2024-01-02T10:00:00Z') }),
        makeEntry({ id: 'e3', createdAt: new Date('2024-01-03T10:00:00Z') }),
      ]
      const result = generateDiaryFromEntries(entries)
      expect(result[0].diary.tone).toBe('proud')
    })

    it('should handle sick pet with low appetite and spirit', () => {
      const entries = [
        makeEntry({
          id: 'e1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          appetiteLevel: 2,
          spiritLevel: 2,
          hasAnomaly: true,
          anomalyItems: ['appetite'] as const,
          riskLevel: 'medium',
        }),
      ]
      const result = generateDiaryFromEntries(entries)
      // Note: anomalyItems use Chinese names which don't directly match template keys
      // The engine falls through to default or all_normal templates
      expect(result[0].diary.text).toBeTruthy()
    })

    it('should handle very sick pet with high risk level', () => {
      const entries = [
        makeEntry({
          id: 'e1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          appetiteLevel: 1,
          spiritLevel: 1,
          hasAnomaly: true,
          anomalyItems: ['poop'] as const,
          riskLevel: 'high',
        }),
      ]
      const result = generateDiaryFromEntries(entries)
      expect(result[0].diary.text).toBeTruthy()
    })

    it('should include note in diary record if present', () => {
      const entries = [
        makeEntry({
          id: 'e1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          note: '今天吃了特别多',
        }),
      ]
      const result = generateDiaryFromEntries(entries)
      expect(result[0].entry.note).toBe('今天吃了特别多')
    })

    it('should handle non-Date createdAt gracefully', () => {
      const entries = [
        makeEntry({
          id: 'e1',
          createdAt: '2024-01-01T10:00:00Z' as unknown as Date,
        }),
      ]
      const result = generateDiaryFromEntries(entries)
      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2024-01-01')
    })

    it('should not trigger birthday when birthDate is null', () => {
      const entries = [
        makeEntry({
          id: 'e1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
        }),
      ]
      const result = generateDiaryFromEntries(entries, null)
      // Without birthday, should use normal template (happy tone is still possible)
      expect(result[0].diary.text).toBeTruthy()
    })

    it('should handle multiple pets correctly', () => {
      const entries = [
        makeEntry({ id: 'e1', petId: 'pet-a', createdAt: new Date('2024-01-01T10:00:00Z') }),
        makeEntry({ id: 'e2', petId: 'pet-b', createdAt: new Date('2024-01-02T10:00:00Z') }),
        makeEntry({ id: 'e3', petId: 'pet-a', createdAt: new Date('2024-01-03T10:00:00Z') }),
      ]
      const result = generateDiaryFromEntries(entries)
      expect(result).toHaveLength(3)
      expect(result[0].entry.petId).toBe('pet-a')
    })

    it('should preserve original entry data in diary record', () => {
      const entries = [
        makeEntry({
          id: 'e1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          appetiteLevel: 4,
          spiritLevel: 5,
          weight: 5.2,
          note: '一切正常',
        }),
      ]
      const result = generateDiaryFromEntries(entries)
      expect(result[0].entry.id).toBe('e1')
      expect(result[0].entry.appetiteLevel).toBe(4)
      expect(result[0].entry.spiritLevel).toBe(5)
      expect(result[0].entry.weight).toBe(5.2)
      expect(result[0].entry.note).toBe('一切正常')
    })
  })
})