import { describe, it, expect } from 'vitest'
import { generateEnergySuggestion, getPhaseConfig } from './energySuggestionEngine'
import type { CyclePhase } from './cycleTypes'

const PHASES: CyclePhase[] = ['menstrual', 'follicular', 'ovulation', 'luteal']

describe('generateEnergySuggestion', () => {
  it.each(PHASES)('generates suggestion for %s phase', (phase) => {
    const suggestion = generateEnergySuggestion(phase, '2026-06-02')
    expect(suggestion.phase).toBe(phase)
    expect(suggestion.date).toBe('2026-06-02')
    expect(suggestion.suggestions.length).toBeGreaterThan(0)
    expect(['low', 'medium', 'high']).toContain(suggestion.energyLevel)
    expect(['rest', 'light', 'moderate', 'high']).toContain(suggestion.suggestedTaskIntensity)
  })

  it('returns low energy for menstrual phase', () => {
    const suggestion = generateEnergySuggestion('menstrual', '2026-06-02')
    expect(suggestion.energyLevel).toBe('low')
    expect(suggestion.suggestedTaskIntensity).toBe('light')
    expect(suggestion.avoidTypes.length).toBeGreaterThan(0)
  })

  it('returns high energy for follicular phase', () => {
    const suggestion = generateEnergySuggestion('follicular', '2026-06-02')
    expect(suggestion.energyLevel).toBe('high')
    expect(suggestion.suggestedTaskIntensity).toBe('high')
  })

  it('returns moderate for ovulation phase', () => {
    const suggestion = generateEnergySuggestion('ovulation', '2026-06-02')
    expect(suggestion.energyLevel).toBe('high')
    expect(suggestion.suggestedTaskIntensity).toBe('moderate')
  })

  it('returns medium energy for luteal phase', () => {
    const suggestion = generateEnergySuggestion('luteal', '2026-06-02')
    expect(suggestion.energyLevel).toBe('medium')
    expect(suggestion.suggestedTaskIntensity).toBe('moderate')
    expect(suggestion.avoidTypes.length).toBeGreaterThan(0)
  })

  it('returns independent copy of suggestions', () => {
    const s1 = generateEnergySuggestion('menstrual', '2026-06-02')
    const s2 = generateEnergySuggestion('menstrual', '2026-06-02')
    s1.suggestions.push('extra')
    expect(s2.suggestions).not.toContain('extra')
  })
})

describe('getPhaseConfig', () => {
  it.each(PHASES)('returns config for %s phase', (phase) => {
    const config = getPhaseConfig(phase)
    expect(config.phase).toBe(phase)
    expect(config.suggestions.length).toBeGreaterThan(0)
  })
})