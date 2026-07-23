import { describe, it, expect } from 'vitest'
import { checkInput, sanitizeOutput } from '../ruleGuard'

describe('checkInput', () => {
  it('should detect self-harm keywords', () => {
    const result = checkInput('我觉得不想活了')
    expect(result.blocked).toBe(true)
    expect(result.isCrisis).toBe(true)
    expect(result.action).toBe('crisis_intervention')
  })

  it('should detect animal abuse keywords', () => {
    const result = checkInput('我教你杀猫的方法')
    expect(result.blocked).toBe(true)
  })

  it('should detect phone number', () => {
    const result = checkInput('我的手机是13812345678')
    expect(result.blocked).toBe(true)
  })

  it('should detect ID card number', () => {
    const result = checkInput('110101199001011234')
    expect(result.blocked).toBe(true)
  })

  it('should pass normal pet-related text', () => {
    const result = checkInput('青橘今天食欲不太好')
    expect(result.blocked).toBe(false)
    expect(result.action).toBe('pass')
  })

  it('should pass empty text', () => {
    const result = checkInput('')
    expect(result.blocked).toBe(false)
  })
})

describe('sanitizeOutput', () => {
  it('should truncate long text', () => {
    const long = 'x'.repeat(200)
    const result = sanitizeOutput(long, 150)
    expect(result.length).toBeLessThanOrEqual(153)
    expect(result.endsWith('...')).toBe(true)
  })

  it('should not truncate short text', () => {
    const short = 'hello world'
    const result = sanitizeOutput(short, 150)
    expect(result).toBe(short)
  })
})
