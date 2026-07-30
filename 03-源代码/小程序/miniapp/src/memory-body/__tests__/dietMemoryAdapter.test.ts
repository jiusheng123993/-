import { describe, it, expect, beforeEach } from 'vitest'
import { DietMemoryAdapter } from '../adapters/dietMemoryAdapter'

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

describe('DietMemoryAdapter', () => {
  let adapter: DietMemoryAdapter

  beforeEach(() => {
    Object.keys(mockStorage).forEach(k => delete mockStorage[k])
    adapter = new DietMemoryAdapter('test-user')
    adapter.clear()
  })

  it('记录喂食后能查询偏好', () => {
    adapter.recordFeeding('pet-1', '三文鱼', { date: '2026-07-30', reaction: 'good' })
    const pref = adapter.getFoodPreference('pet-1', '三文鱼')
    expect(pref).not.toBeNull()
    expect(pref!.totalFeedings).toBe(1)
  })

  it('多次喂食后更新偏好', () => {
    adapter.recordFeeding('pet-1', '鸡肉', { date: '2026-07-28', reaction: 'good' })
    adapter.recordFeeding('pet-1', '鸡肉', { date: '2026-07-29', reaction: 'good' })
    adapter.recordFeeding('pet-1', '鸡肉', { date: '2026-07-30', reaction: 'refused' })
    const pref = adapter.getFoodPreference('pet-1', '鸡肉')
    expect(pref!.totalFeedings).toBe(3)
    expect(pref!.preference).toBe('dislikes')
  })

  it('获取饮食画像', () => {
    adapter.recordFeeding('pet-1', '鸡胸肉', { date: '2026-07-30', reaction: 'good' })
    const profile = adapter.getDietProfile('pet-1')
    expect(profile.safeFoods).toContain('鸡胸肉')
  })
})
