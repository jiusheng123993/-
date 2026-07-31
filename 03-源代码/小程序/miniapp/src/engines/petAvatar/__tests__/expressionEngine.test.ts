/**
 * expressionEngine 测试
 * 验证表情引擎的表达式计算和场景匹配逻辑
 */
import { describe, it, expect } from 'vitest'
import {
  calculateExpression,
  getExpressionForFoodResult,
  getExpressionForSymptomResult,
  getExpressionForVaccineDue,
  EXPRESSION_MAP,
  type ExpressionContext,
} from '../expressionEngine'

describe('calculateExpression', () => {
  const baseCtx: ExpressionContext = {
    todayEntry: null,
    hasAnomaly: false,
    anomalyCount: 0,
    riskLevel: null,
    streakDays: 0,
    isBirthday: false,
    isVaccineComplete: false,
    isRecovery: false,
    isDeceased: false,
  }

  it('returns sleepy when pet is deceased', () => {
    const ctx = { ...baseCtx, isDeceased: true }
    expect(calculateExpression(ctx)).toBe(EXPRESSION_MAP.sleepy)
  })

  it('returns excited on birthday (priority over deceased check)', () => {
    const ctx = { ...baseCtx, isBirthday: true }
    expect(calculateExpression(ctx)).toBe(EXPRESSION_MAP.excited)
  })

  it('returns proud when vaccine is complete', () => {
    const ctx = { ...baseCtx, isVaccineComplete: true }
    expect(calculateExpression(ctx)).toBe(EXPRESSION_MAP.proud)
  })

  it('returns happy when in recovery', () => {
    const ctx = { ...baseCtx, isRecovery: true }
    expect(calculateExpression(ctx)).toBe(EXPRESSION_MAP.happy)
  })

  it('returns proud when streak >= 7', () => {
    const ctx = { ...baseCtx, streakDays: 7 }
    expect(calculateExpression(ctx)).toBe(EXPRESSION_MAP.proud)
  })

  it('returns proud when streak >= 30', () => {
    const ctx = { ...baseCtx, streakDays: 30 }
    expect(calculateExpression(ctx)).toBe(EXPRESSION_MAP.proud)
  })

  it('returns sleepy when no today entry', () => {
    expect(calculateExpression(baseCtx)).toBe(EXPRESSION_MAP.sleepy)
  })

  it('returns anxious for emergency risk level', () => {
    const ctx = {
      ...baseCtx,
      todayEntry: { id: '1', petId: 'p1', userId: 'u1', poopLevel: 3 as const, appetiteLevel: 3 as const, spiritLevel: 3 as const, exerciseLevel: 2 as const, hasAnomaly: true, anomalyItems: ['poop' as const], riskLevel: 'emergency' as const, createdAt: new Date() },
      riskLevel: 'emergency' as const,
    }
    expect(calculateExpression(ctx)).toBe(EXPRESSION_MAP.anxious)
  })

  it('returns concerned for high risk level', () => {
    const ctx = {
      ...baseCtx,
      todayEntry: { id: '1', petId: 'p1', userId: 'u1', poopLevel: 3 as const, appetiteLevel: 3 as const, spiritLevel: 3 as const, exerciseLevel: 2 as const, hasAnomaly: true, anomalyItems: ['poop' as const], riskLevel: 'high' as const, createdAt: new Date() },
      riskLevel: 'high' as const,
    }
    expect(calculateExpression(ctx)).toBe(EXPRESSION_MAP.concerned)
  })

  it('returns worried for 2+ anomalies', () => {
    const ctx = {
      ...baseCtx,
      todayEntry: { id: '1', petId: 'p1', userId: 'u1', poopLevel: 3 as const, appetiteLevel: 3 as const, spiritLevel: 3 as const, exerciseLevel: 2 as const, hasAnomaly: true, anomalyItems: ['poop' as const, 'appetite' as const], riskLevel: 'medium' as const, createdAt: new Date() },
      hasAnomaly: true,
      anomalyCount: 2,
      riskLevel: 'medium' as const,
    }
    expect(calculateExpression(ctx)).toBe(EXPRESSION_MAP.worried)
  })

  it('returns worried for 1 anomaly', () => {
    const ctx = {
      ...baseCtx,
      todayEntry: { id: '1', petId: 'p1', userId: 'u1', poopLevel: 3 as const, appetiteLevel: 3 as const, spiritLevel: 3 as const, exerciseLevel: 2 as const, hasAnomaly: true, anomalyItems: ['poop' as const], riskLevel: 'low' as const, createdAt: new Date() },
      hasAnomaly: true,
      anomalyCount: 1,
      riskLevel: 'low' as const,
    }
    expect(calculateExpression(ctx)).toBe(EXPRESSION_MAP.worried)
  })

  it('returns happy for normal entry with no anomalies', () => {
    const ctx = {
      ...baseCtx,
      todayEntry: { id: '1', petId: 'p1', userId: 'u1', poopLevel: 3 as const, appetiteLevel: 3 as const, spiritLevel: 3 as const, exerciseLevel: 2 as const, hasAnomaly: false, anomalyItems: [], riskLevel: 'low' as const, createdAt: new Date() },
    }
    expect(calculateExpression(ctx)).toBe(EXPRESSION_MAP.happy)
  })

  it('birthday has higher priority than vaccine complete', () => {
    const ctx = { ...baseCtx, isBirthday: true, isVaccineComplete: true }
    expect(calculateExpression(ctx)).toBe(EXPRESSION_MAP.excited)
  })

  it('vaccine complete has higher priority than recovery', () => {
    const ctx = { ...baseCtx, isVaccineComplete: true, isRecovery: true }
    expect(calculateExpression(ctx)).toBe(EXPRESSION_MAP.proud)
  })
})

describe('getExpressionForFoodResult', () => {
  it('returns happy for safe food', () => {
    expect(getExpressionForFoodResult(true)).toBe(EXPRESSION_MAP.happy)
  })

  it('returns scared for unsafe food', () => {
    expect(getExpressionForFoodResult(false)).toBe(EXPRESSION_MAP.scared)
  })
})

describe('getExpressionForSymptomResult', () => {
  it('returns anxious for emergency', () => {
    expect(getExpressionForSymptomResult('emergency')).toBe(EXPRESSION_MAP.anxious)
  })

  it('returns concerned for high', () => {
    expect(getExpressionForSymptomResult('high')).toBe(EXPRESSION_MAP.concerned)
  })

  it('returns worried for medium', () => {
    expect(getExpressionForSymptomResult('medium')).toBe(EXPRESSION_MAP.worried)
  })

  it('returns happy for low', () => {
    expect(getExpressionForSymptomResult('low')).toBe(EXPRESSION_MAP.happy)
  })
})

describe('getExpressionForVaccineDue', () => {
  it('returns worried for overdue vaccine', () => {
    expect(getExpressionForVaccineDue(true)).toBe(EXPRESSION_MAP.worried)
  })

  it('returns happy for on-time vaccine', () => {
    expect(getExpressionForVaccineDue(false)).toBe(EXPRESSION_MAP.happy)
  })
})

describe('EXPRESSION_MAP', () => {
  it('has all 8 expression types', () => {
    const keys = Object.keys(EXPRESSION_MAP)
    expect(keys).toHaveLength(8)
    expect(keys).toContain('happy')
    expect(keys).toContain('worried')
    expect(keys).toContain('concerned')
    expect(keys).toContain('anxious')
    expect(keys).toContain('sleepy')
    expect(keys).toContain('proud')
    expect(keys).toContain('excited')
    expect(keys).toContain('scared')
  })

  it('each expression has required config fields', () => {
    for (const config of Object.values(EXPRESSION_MAP)) {
      expect(config.expression).toBeTruthy()
      expect(config.label).toBeTruthy()
      expect(config.color).toBeTruthy()
      expect(config.eyes).toBeTruthy()
      expect(config.mouth).toBeTruthy()
      expect(config.accessory).toBeTruthy()
      expect(config.animation).toBeTruthy()
    }
  })
})
