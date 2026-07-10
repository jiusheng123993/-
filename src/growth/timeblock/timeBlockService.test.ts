import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTimeBlockService, categoryColors } from './timeBlockService'
import type { TimeBlockService } from './timeBlockService'

const STORAGE_KEY = 'xinghuanhai-timeblocks-state'

function mockLocalStorage() {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]) }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null)
  }
}

describe('timeBlockService', () => {
  let service: TimeBlockService
  let storage: ReturnType<typeof mockLocalStorage>

  beforeEach(() => {
    storage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', { value: storage, writable: true })
    service = createTimeBlockService()
  })

  describe('getState', () => {
    it('returns empty blocks initially', () => {
      const state = service.getState()
      expect(state.blocks).toEqual([])
    })

    it('returns blocks from localStorage', () => {
      const block = {
        id: 'b1',
        title: '工作',
        startHour: 9,
        endHour: 11,
        color: '#3b82f6',
        category: 'work',
        date: '2026-06-05',
        completed: false
      }
      storage.getItem.mockReturnValue(JSON.stringify({ blocks: [block] }))
      service = createTimeBlockService()
      const state = service.getState()
      expect(state.blocks).toHaveLength(1)
    })

    it('handles corrupted JSON gracefully', () => {
      storage.getItem.mockReturnValue('bad-json')
      service = createTimeBlockService()
      const state = service.getState()
      expect(state.blocks).toEqual([])
    })
  })

  describe('addBlock', () => {
    it('adds a new time block', () => {
      const block = service.addBlock('工作会议', 9, 11, 'work')
      expect(block.title).toBe('工作会议')
      expect(block.startHour).toBe(9)
      expect(block.endHour).toBe(11)
      expect(block.category).toBe('work')
      expect(block.color).toBe('#3b82f6')
      expect(block.completed).toBe(false)
      expect(block.date).toBe(new Date().toISOString().split('T')[0])
      expect(block.id).toBeTruthy()
    })

    it('assigns correct color per category', () => {
      expect(service.addBlock('学习', 14, 16, 'study').color).toBe('#8b5cf6')
      expect(service.addBlock('运动', 17, 18, 'exercise').color).toBe('#22c55e')
      expect(service.addBlock('休息', 12, 13, 'rest').color).toBe('#f59e0b')
      expect(service.addBlock('其他', 19, 20, 'other').color).toBe('#6b7280')
    })

    it('persists to localStorage', () => {
      service.addBlock('测试', 10, 11, 'work')
      expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String))
    })
  })

  describe('updateBlock', () => {
    it('updates block fields', () => {
      const block = service.addBlock('原始标题', 9, 10, 'work')
      service.updateBlock(block.id, { title: '新标题', completed: true })
      const state = service.getState()
      expect(state.blocks[0].title).toBe('新标题')
      expect(state.blocks[0].completed).toBe(true)
    })

    it('does nothing for non-existent id', () => {
      service.addBlock('测试', 9, 10, 'work')
      service.updateBlock('non-existent', { title: '不会更新' })
      const state = service.getState()
      expect(state.blocks[0].title).toBe('测试')
    })
  })

  describe('removeBlock', () => {
    it('removes a block by id', () => {
      const block = service.addBlock('待删除', 9, 10, 'work')
      service.removeBlock(block.id)
      expect(service.getState().blocks).toHaveLength(0)
    })

    it('does nothing for non-existent id', () => {
      service.addBlock('测试', 9, 10, 'work')
      service.removeBlock('non-existent')
      expect(service.getState().blocks).toHaveLength(1)
    })
  })

  describe('getBlocksByDate', () => {
    it('returns blocks for a specific date', () => {
      const today = new Date().toISOString().split('T')[0]
      service.addBlock('今日任务', 9, 10, 'work')
      const blocks = service.getBlocksByDate(today)
      expect(blocks).toHaveLength(1)
    })

    it('returns empty array for date with no blocks', () => {
      const blocks = service.getBlocksByDate('2020-01-01')
      expect(blocks).toEqual([])
    })

    it('sorts blocks by startHour ascending', () => {
      service.addBlock('下午任务', 14, 15, 'work')
      service.addBlock('上午任务', 9, 10, 'work')
      const today = new Date().toISOString().split('T')[0]
      const blocks = service.getBlocksByDate(today)
      expect(blocks[0].startHour).toBeLessThanOrEqual(blocks[1].startHour)
    })
  })

  describe('getTodayBlocks', () => {
    it('returns blocks for today', () => {
      service.addBlock('今日任务', 9, 10, 'work')
      const blocks = service.getTodayBlocks()
      expect(blocks).toHaveLength(1)
    })

    it('returns empty when no blocks today', () => {
      const blocks = service.getTodayBlocks()
      expect(blocks).toEqual([])
    })
  })
})

describe('categoryColors', () => {
  it('has colors for all categories', () => {
    expect(categoryColors.work).toBe('#3b82f6')
    expect(categoryColors.study).toBe('#8b5cf6')
    expect(categoryColors.exercise).toBe('#22c55e')
    expect(categoryColors.rest).toBe('#f59e0b')
    expect(categoryColors.other).toBe('#6b7280')
  })
})