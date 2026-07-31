import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MilestoneAdapter } from '../adapters/milestoneAdapter'

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

describe('MilestoneAdapter', () => {
  let adapter: MilestoneAdapter

  beforeEach(() => {
    Object.keys(mockStorage).forEach(k => delete mockStorage[k])
    adapter = new MilestoneAdapter('test-user')
    adapter.clear()
  })

  it('添加和查询里程碑', () => {
    adapter.addMilestone('pet-1', {
      petId: 'pet-1',
      type: 'adoption',
      title: '到家啦',
      date: '2026-01-15',
      icon: '🏠',
    })
    const timeline = adapter.getTimeline('pet-1')
    expect(timeline.length).toBe(1)
    expect(timeline[0].title).toBe('到家啦')
  })

  it('syncFromCheckins 自动添加首次打卡', () => {
    adapter.syncFromCheckins('pet-1', 1)
    const timeline = adapter.getTimeline('pet-1')
    expect(timeline.some(m => m.type === 'first_checkin')).toBe(true)
  })
})
