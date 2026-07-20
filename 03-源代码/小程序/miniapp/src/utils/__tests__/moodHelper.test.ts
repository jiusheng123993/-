import { describe, it, expect } from 'vitest'
import { getMoodDisplayName } from '../moodHelper'

describe('getMoodDisplayName', () => {
  it('returns 难过 for sad', () => {
    expect(getMoodDisplayName('sad')).toBe('难过')
  })

  it('returns 焦虑 for anxious', () => {
    expect(getMoodDisplayName('anxious')).toBe('焦虑')
  })

  it('returns 累 for tired', () => {
    expect(getMoodDisplayName('tired')).toBe('累')
  })

  it('returns 孤独 for lonely', () => {
    expect(getMoodDisplayName('lonely')).toBe('孤独')
  })

  it('returns 说不出来 for unclear', () => {
    expect(getMoodDisplayName('unclear')).toBe('说不出来')
  })

  it('returns 开心 for happy', () => {
    expect(getMoodDisplayName('happy')).toBe('开心')
  })

  it('returns 平静 for calm', () => {
    expect(getMoodDisplayName('calm')).toBe('平静')
  })

  it('returns 愤怒 for angry', () => {
    expect(getMoodDisplayName('angry')).toBe('愤怒')
  })

  it('returns 恐惧 for fearful', () => {
    expect(getMoodDisplayName('fearful')).toBe('恐惧')
  })

  it('returns 压力 for stressed', () => {
    expect(getMoodDisplayName('stressed')).toBe('压力')
  })

  it('returns 沮丧 for frustrated', () => {
    expect(getMoodDisplayName('frustrated')).toBe('沮丧')
  })

  it('returns 希望 for hopeful', () => {
    expect(getMoodDisplayName('hopeful')).toBe('希望')
  })

  it('returns original string for unknown mood', () => {
    expect(getMoodDisplayName('unknown')).toBe('unknown')
  })

  it('returns empty string for empty input', () => {
    expect(getMoodDisplayName('')).toBe('')
  })

  it('returns original for mixed case not in map', () => {
    expect(getMoodDisplayName('Sad')).toBe('Sad')
  })

  it('returns original for numeric string', () => {
    expect(getMoodDisplayName('123')).toBe('123')
  })
})
