import { describe, expect, it } from 'vitest'
import {
  focusBriefStyles,
  getFocusBriefStyleById,
  isValidFocusBriefStyleId,
  DEFAULT_FOCUS_BRIEF_STYLE_ID
} from './focusBriefRegistry'

describe('focusBriefRegistry', () => {
  it('registers three built-in styles', () => {
    expect(focusBriefStyles).toHaveLength(3)
    expect(focusBriefStyles.map((s) => s.id)).toEqual([
      'minimal-arc',
      'stat-bar',
      'half-gauge'
    ])
  })

  it('every style has name, description and component', () => {
    focusBriefStyles.forEach((style) => {
      expect(style.name.length).toBeGreaterThan(0)
      expect(style.description.length).toBeGreaterThan(0)
      expect(typeof style.Component).toBe('function')
    })
  })

  it('default style id resolves to the first registered style', () => {
    expect(DEFAULT_FOCUS_BRIEF_STYLE_ID).toBe('minimal-arc')
    expect(getFocusBriefStyleById(DEFAULT_FOCUS_BRIEF_STYLE_ID).id).toBe('minimal-arc')
  })

  it('getFocusBriefStyleById falls back to default when given unknown or nullish id', () => {
    expect(getFocusBriefStyleById(undefined).id).toBe('minimal-arc')
    expect(getFocusBriefStyleById(null).id).toBe('minimal-arc')
    // @ts-expect-error testing unknown id fallback
    expect(getFocusBriefStyleById('bogus-style').id).toBe('minimal-arc')
  })

  it('getFocusBriefStyleById resolves stat-bar and half-gauge correctly', () => {
    expect(getFocusBriefStyleById('stat-bar').id).toBe('stat-bar')
    expect(getFocusBriefStyleById('half-gauge').id).toBe('half-gauge')
  })

  it('isValidFocusBriefStyleId narrows correctly', () => {
    expect(isValidFocusBriefStyleId('minimal-arc')).toBe(true)
    expect(isValidFocusBriefStyleId('stat-bar')).toBe(true)
    expect(isValidFocusBriefStyleId('half-gauge')).toBe(true)
    expect(isValidFocusBriefStyleId('unknown')).toBe(false)
    expect(isValidFocusBriefStyleId(null)).toBe(false)
    expect(isValidFocusBriefStyleId(undefined)).toBe(false)
    expect(isValidFocusBriefStyleId(123)).toBe(false)
  })
})
