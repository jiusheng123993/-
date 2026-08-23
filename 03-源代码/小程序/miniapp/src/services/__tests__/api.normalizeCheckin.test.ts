/**
 * API 打卡归一化单测（2026-08-23 前后端契约修复）
 * 服务端 pet_health_entries 返回 createdAt + *Level，前端 Checkin 需要 date/mood/appetite/stool
 */
import { describe, it, expect } from 'vitest'
import { normalizeCheckin } from '../api'

describe('normalizeCheckin - 服务端打卡字段归一化', () => {
  it('派生 date（createdAt → YYYY-MM-DD）与 mood/appetite/stool（level 语义映射）', () => {
    const row = {
      id: 'c1',
      petId: 'p1',
      userId: 'u1',
      spiritLevel: 1,     // ≤2 → sad
      appetiteLevel: 2,   // ≤2 → poor
      poopLevel: 4,       // ≥4 → hard
      weight: 3.5,
      note: '精神不佳',
      hasAnomaly: true,
      riskLevel: 'medium',
      createdAt: '2026-08-07T01:27:15.957Z',
    }
    const c = normalizeCheckin(row)
    expect(c.date).toBe('2026-08-07')
    expect(c.mood).toBe('sad')
    expect(c.appetite).toBe('poor')
    expect(c.stool).toBe('hard')
    expect(c.weight).toBe(3.5)
    expect(c.note).toBe('精神不佳')
    // 原始字段保留（供页面扩展使用；Checkin 类型未声明，运行时存在）
    const raw = c as unknown as Record<string, unknown>
    expect(raw.riskLevel).toBe('medium')
    expect(raw.hasAnomaly).toBe(true)
  })

  it('正常档 level 映射为 happy/good/normal，loose 边界（poop≤2）', () => {
    const c = normalizeCheckin({
      id: 'c2', petId: 'p1', userId: 'u1',
      spiritLevel: 3, appetiteLevel: 3, poopLevel: 2,
      createdAt: '2026-08-08T00:00:00.000Z',
    })
    expect(c.mood).toBe('happy')
    expect(c.appetite).toBe('good')
    expect(c.stool).toBe('loose')
  })

  it('缺字段容错：createdAt 为空 → date 为空串，不崩溃', () => {
    const c = normalizeCheckin({ id: 'c3', petId: 'p1', userId: 'u1' })
    expect(c.date).toBe('')
    expect(c.mood).toBe('happy') // Number(undefined) = NaN，NaN<=2 为 false → happy
    expect(c.weight).toBeUndefined()
  })
})
