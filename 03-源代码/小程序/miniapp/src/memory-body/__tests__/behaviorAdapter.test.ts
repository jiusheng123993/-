import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BehaviorAdapter } from '../adapters/behaviorAdapter'

const mockStorage: Record<string, string> = {}

vi.mock('../../utils/storage', () => ({
  getStorage: vi.fn((key: string) => {
    const raw = mockStorage[key]
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }),
  setStorage: vi.fn((key: string, value: unknown) => {
    mockStorage[key] = JSON.stringify(value)
  }),
}))

describe('BehaviorAdapter', () => {
  let adapter: BehaviorAdapter

  beforeEach(() => {
    Object.keys(mockStorage).forEach(k => delete mockStorage[k])
    adapter = new BehaviorAdapter('test-user')
    adapter.clear()
  })

  it('记录观察后可构建基线', () => {
    adapter.recordObservation('pet-1', {
      date: '2026-07-28',
      category: 'energy',
      description: '非常活跃，跑跳不停',
      severity: 'normal',
    })
    adapter.recordObservation('pet-1', {
      date: '2026-07-29',
      category: 'energy',
      description: '兴奋好动',
      severity: 'normal',
    })
    adapter.recordObservation('pet-1', {
      date: '2026-07-30',
      category: 'energy',
      description: '活跃',
      severity: 'normal',
    })
    const baseline = adapter.buildBaseline('pet-1')
    expect(baseline.personalityTraits.length).toBeGreaterThan(0)
  })

  it('检测异常行为', () => {
    adapter.recordObservation('pet-1', {
      date: '2026-07-30',
      category: 'appetite_behavior',
      description: '完全不吃东西',
      severity: 'concern',
    })
    const anomalies = adapter.detectAnomalies('pet-1')
    expect(anomalies.length).toBe(1)
  })
})
