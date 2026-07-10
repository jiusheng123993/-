import { describe, it, expect, beforeEach } from 'vitest'
import {
  createInMemoryEventStore,
  createBrowserEventStore,
  convertLegacyEvent,
} from './memoryEvents'
import type { MemoryEventCategory, EventFilter } from './memoryEvents'
import type { MemoryScope } from './memoryTypes'

const fixedNow = '2026-06-01T10:00:00.000Z'

const defaultScope: MemoryScope = {
  userId: 'user-default',
  projectId: 'xinghuanhai',
}

describe('memoryEvents', () => {
  describe('createInMemoryEventStore', () => {
    describe('addEvent', () => {
      it('should add event and return generated id', () => {
        const store = createInMemoryEventStore()
        const id = store.addEvent({
          source: 'behavior',
          category: 'task_completion',
          timestamp: fixedNow,
          summary: '完成高数极限专题',
          tags: ['study'],
        })
        expect(id).toBeTruthy()
        expect(id.startsWith('evt_mem_')).toBe(true)
      })

      it('should set processed to false by default', () => {
        const store = createInMemoryEventStore()
        const id = store.addEvent({
          source: 'manual_input',
          category: 'preference_change',
          timestamp: fixedNow,
          summary: '用户偏好中文解释',
        })
        const event = store.getEvent(id)
        expect(event?.processed).toBe(false)
        expect(event?.processedAt).toBeUndefined()
      })

      it('should preserve metadata and tags', () => {
        const store = createInMemoryEventStore()
        const id = store.addEvent({
          source: 'behavior',
          category: 'focus_session',
          timestamp: fixedNow,
          summary: '完成60分钟专注',
          metadata: { minutes: 60, taskId: 'task-1' },
          tags: ['focus', 'study'],
        })
        const event = store.getEvent(id)
        expect(event?.metadata).toEqual({ minutes: 60, taskId: 'task-1' })
        expect(event?.tags).toEqual(['focus', 'study'])
      })
    })

    describe('getEvent', () => {
      it('should return event by id', () => {
        const store = createInMemoryEventStore()
        const id = store.addEvent({
          source: 'behavior',
          category: 'task_completion',
          timestamp: fixedNow,
          summary: '完成任务',
        })
        const event = store.getEvent(id)
        expect(event).toBeDefined()
        expect(event?.summary).toBe('完成任务')
      })

      it('should return undefined for non-existent id', () => {
        const store = createInMemoryEventStore()
        expect(store.getEvent('non-existent')).toBeUndefined()
      })
    })

    describe('getEvents', () => {
      it('should return all events sorted by timestamp descending when no filter', () => {
        const store = createInMemoryEventStore()
        store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: '2026-06-01T08:00:00Z', summary: '早上任务' })
        store.addEvent({ source: 'behavior', category: 'focus_session', timestamp: '2026-06-01T10:00:00Z', summary: '上午专注' })
        store.addEvent({ source: 'behavior', category: 'task_delay', timestamp: '2026-06-01T09:00:00Z', summary: '延期任务' })

        const events = store.getEvents()
        expect(events).toHaveLength(3)
        expect(events[0].summary).toBe('上午专注')
        expect(events[1].summary).toBe('延期任务')
        expect(events[2].summary).toBe('早上任务')
      })

      it('should filter by time range (from/to)', () => {
        const store = createInMemoryEventStore()
        store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: '2026-05-28T10:00:00Z', summary: '上周' })
        store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: '2026-06-01T08:00:00Z', summary: '今天早上' })
        store.addEvent({ source: 'behavior', category: 'focus_session', timestamp: '2026-06-01T10:00:00Z', summary: '今天上午' })

        const filter: EventFilter = {
          from: '2026-06-01T00:00:00Z',
          to: '2026-06-01T23:59:59Z',
        }
        const events = store.getEvents(filter)
        expect(events).toHaveLength(2)
        expect(events.every((e) => e.timestamp >= filter.from! && e.timestamp <= filter.to!)).toBe(true)
      })

      it('should filter by categories', () => {
        const store = createInMemoryEventStore()
        store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '任务完成' })
        store.addEvent({ source: 'behavior', category: 'focus_session', timestamp: fixedNow, summary: '专注' })
        store.addEvent({ source: 'behavior', category: 'task_delay', timestamp: fixedNow, summary: '延期' })

        const events = store.getEvents({ categories: ['task_completion', 'task_delay'] })
        expect(events).toHaveLength(2)
        expect(events.every((e) => e.category === 'task_completion' || e.category === 'task_delay')).toBe(true)
      })

      it('should filter by tags (OR match)', () => {
        const store = createInMemoryEventStore()
        store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '学习任务', tags: ['study'] })
        store.addEvent({ source: 'behavior', category: 'focus_session', timestamp: fixedNow, summary: '运动专注', tags: ['fitness'] })
        store.addEvent({ source: 'behavior', category: 'task_delay', timestamp: fixedNow, summary: '延期任务', tags: ['study', 'urgent'] })

        const events = store.getEvents({ tags: ['study'] })
        expect(events).toHaveLength(2)
      })

      it('should filter by keyword (case-insensitive summary match)', () => {
        const store = createInMemoryEventStore()
        store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '完成高数极限专题' })
        store.addEvent({ source: 'behavior', category: 'focus_session', timestamp: fixedNow, summary: '完成60分钟专注' })
        store.addEvent({ source: 'behavior', category: 'task_delay', timestamp: fixedNow, summary: '延期英语作业' })

        const events = store.getEvents({ keyword: '完成' })
        expect(events).toHaveLength(2)
      })

      it('should filter unprocessed only', () => {
        const store = createInMemoryEventStore()
        const id1 = store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '未处理' })
        const id2 = store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '已处理' })
        store.markEventsProcessed([id2])

        const events = store.getEvents({ unprocessedOnly: true })
        expect(events).toHaveLength(1)
        expect(events[0].id).toBe(id1)
      })

      it('should apply limit', () => {
        const store = createInMemoryEventStore()
        for (let i = 0; i < 10; i++) {
          store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: `2026-06-01T${String(i).padStart(2, '0')}:00:00Z`, summary: `事件${i}` })
        }

        const events = store.getEvents({ limit: 3 })
        expect(events).toHaveLength(3)
      })

      it('should combine multiple filters', () => {
        const store = createInMemoryEventStore()
        store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: '2026-05-28T10:00:00Z', summary: '旧任务', tags: ['study'] })
        store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: '2026-06-01T10:00:00Z', summary: '新任务', tags: ['study'] })
        store.addEvent({ source: 'behavior', category: 'focus_session', timestamp: '2026-06-01T10:00:00Z', summary: '新专注', tags: ['study'] })
        store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: '2026-06-01T10:00:00Z', summary: '新任务', tags: ['fitness'] })

        const events = store.getEvents({
          from: '2026-06-01T00:00:00Z',
          categories: ['task_completion'],
          tags: ['study'],
        })
        expect(events).toHaveLength(1)
        expect(events[0].summary).toBe('新任务')
      })

      it('should return empty array when no events match filter', () => {
        const store = createInMemoryEventStore()
        store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '任务' })

        const events = store.getEvents({ categories: ['milestone_achieved'] })
        expect(events).toHaveLength(0)
      })
    })

    describe('updateEvent', () => {
      it('should update summary, metadata and tags', () => {
        const store = createInMemoryEventStore()
        const id = store.addEvent({
          source: 'behavior',
          category: 'task_completion',
          timestamp: fixedNow,
          summary: '原始摘要',
          metadata: { key: 'value' },
          tags: ['old'],
        })

        const updated = store.updateEvent(id, {
          summary: '更新摘要',
          metadata: { key: 'new_value', extra: true },
          tags: ['new', 'updated'],
        })

        expect(updated?.summary).toBe('更新摘要')
        expect(updated?.metadata).toEqual({ key: 'new_value', extra: true })
        expect(updated?.tags).toEqual(['new', 'updated'])
      })

      it('should return undefined for non-existent event', () => {
        const store = createInMemoryEventStore()
        expect(store.updateEvent('non-existent', { summary: 'test' })).toBeUndefined()
      })

      it('should not modify immutable fields', () => {
        const store = createInMemoryEventStore()
        const id = store.addEvent({
          source: 'behavior',
          category: 'task_completion',
          timestamp: fixedNow,
          summary: '原始',
        })

        const updated = store.updateEvent(id, { summary: '更新' })
        expect(updated?.category).toBe('task_completion')
        expect(updated?.source).toBe('behavior')
        expect(updated?.timestamp).toBe(fixedNow)
        expect(updated?.processed).toBe(false)
      })
    })

    describe('markEventsProcessed', () => {
      it('should mark specified events as processed', () => {
        const store = createInMemoryEventStore()
        const id1 = store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '事件1' })
        const id2 = store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '事件2' })
        const id3 = store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '事件3' })

        store.markEventsProcessed([id1, id3])

        expect(store.getEvent(id1)?.processed).toBe(true)
        expect(store.getEvent(id1)?.processedAt).toBeTruthy()
        expect(store.getEvent(id2)?.processed).toBe(false)
        expect(store.getEvent(id3)?.processed).toBe(true)
      })

      it('should not re-process already processed events', () => {
        const store = createInMemoryEventStore()
        const id = store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '事件' })

        store.markEventsProcessed([id])
        const firstProcessedAt = store.getEvent(id)?.processedAt

        store.markEventsProcessed([id])
        const secondProcessedAt = store.getEvent(id)?.processedAt

        expect(firstProcessedAt).toBe(secondProcessedAt)
      })

      it('should handle empty ids array', () => {
        const store = createInMemoryEventStore()
        store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '事件' })
        expect(() => store.markEventsProcessed([])).not.toThrow()
      })

      it('should handle non-existent ids gracefully', () => {
        const store = createInMemoryEventStore()
        expect(() => store.markEventsProcessed(['non-existent'])).not.toThrow()
      })
    })

    describe('deleteEvents', () => {
      it('should delete specified events and return count', () => {
        const store = createInMemoryEventStore()
        const id1 = store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '事件1' })
        const id2 = store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '事件2' })
        const id3 = store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '事件3' })

        const deletedCount = store.deleteEvents([id1, id3])
        expect(deletedCount).toBe(2)
        expect(store.getEvent(id1)).toBeUndefined()
        expect(store.getEvent(id2)).toBeDefined()
        expect(store.getEvent(id3)).toBeUndefined()
      })

      it('should return 0 when deleting non-existent ids', () => {
        const store = createInMemoryEventStore()
        const deletedCount = store.deleteEvents(['non-existent'])
        expect(deletedCount).toBe(0)
      })

      it('should handle empty ids array', () => {
        const store = createInMemoryEventStore()
        expect(store.deleteEvents([])).toBe(0)
      })
    })

    describe('countEvents', () => {
      it('should return total count without filter', () => {
        const store = createInMemoryEventStore()
        store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '事件1' })
        store.addEvent({ source: 'behavior', category: 'focus_session', timestamp: fixedNow, summary: '事件2' })
        store.addEvent({ source: 'behavior', category: 'task_delay', timestamp: fixedNow, summary: '事件3' })

        expect(store.countEvents()).toBe(3)
      })

      it('should count with filter', () => {
        const store = createInMemoryEventStore()
        store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '任务完成', tags: ['study'] })
        store.addEvent({ source: 'behavior', category: 'focus_session', timestamp: fixedNow, summary: '专注', tags: ['study'] })
        store.addEvent({ source: 'behavior', category: 'task_delay', timestamp: fixedNow, summary: '延期', tags: ['fitness'] })

        expect(store.countEvents({ categories: ['task_completion'] })).toBe(1)
        expect(store.countEvents({ tags: ['study'] })).toBe(2)
        expect(store.countEvents({ keyword: '完成' })).toBe(1)
      })
    })
  })

  describe('createBrowserEventStore', () => {
    let storage: Map<string, string>

    beforeEach(() => {
      storage = new Map<string, string>()
    })

    function createStorageAdapter() {
      return {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      }
    }

    it('should persist events across store instances', () => {
      const adapter = createStorageAdapter()
      const store1 = createBrowserEventStore(adapter, 'test-events')
      const id = store1.addEvent({
        source: 'behavior',
        category: 'task_completion',
        timestamp: fixedNow,
        summary: '持久化事件',
      })

      const store2 = createBrowserEventStore(adapter, 'test-events')
      expect(store2.getEvent(id)?.summary).toBe('持久化事件')
    })

    it('should persist deletions', () => {
      const adapter = createStorageAdapter()
      const store1 = createBrowserEventStore(adapter, 'test-events')
      const id = store1.addEvent({
        source: 'behavior',
        category: 'task_completion',
        timestamp: fixedNow,
        summary: '待删除',
      })

      store1.deleteEvents([id])

      const store2 = createBrowserEventStore(adapter, 'test-events')
      expect(store2.getEvent(id)).toBeUndefined()
    })

    it('should persist processed state', () => {
      const adapter = createStorageAdapter()
      const store1 = createBrowserEventStore(adapter, 'test-events')
      const id = store1.addEvent({
        source: 'behavior',
        category: 'task_completion',
        timestamp: fixedNow,
        summary: '待处理',
      })

      store1.markEventsProcessed([id])

      const store2 = createBrowserEventStore(adapter, 'test-events')
      expect(store2.getEvent(id)?.processed).toBe(true)
    })

    it('should handle corrupted storage gracefully', () => {
      storage.set('test-events', 'not-valid-json')
      const adapter = createStorageAdapter()
      const store = createBrowserEventStore(adapter, 'test-events')
      expect(store.getEvents()).toEqual([])
    })

    it('should handle non-array storage gracefully', () => {
      storage.set('test-events', JSON.stringify({ not: 'array' }))
      const adapter = createStorageAdapter()
      const store = createBrowserEventStore(adapter, 'test-events')
      expect(store.getEvents()).toEqual([])
    })
  })

  describe('convertLegacyEvent', () => {
    it('should convert legacy event with known kind and source', () => {
      const result = convertLegacyEvent(
        {
          id: 'memory-1',
          kind: 'preference',
          content: '用户喜欢中文详细解释',
          source: 'manual',
          tags: ['communication'],
          createdAt: fixedNow,
        },
        defaultScope
      )

      expect(result.source).toBe('manual_input')
      expect(result.category).toBe('preference_change')
      expect(result.timestamp).toBe(fixedNow)
      expect(result.summary).toBe('用户喜欢中文详细解释')
      expect(result.tags).toContain('communication')
      expect(result.tags).toContain('legacy_kind:preference')
      expect(result.tags).toContain('scope:user-default:xinghuanhai')
    })

    it('should map goal kind to goal_change category', () => {
      const result = convertLegacyEvent(
        {
          id: 'memory-2',
          kind: 'goal',
          content: '用户正在开发项目',
          source: 'workspace',
          tags: ['goal'],
          createdAt: fixedNow,
        },
        defaultScope
      )

      expect(result.category).toBe('goal_change')
      expect(result.source).toBe('behavior')
    })

    it('should map habit kind to focus_session category', () => {
      const result = convertLegacyEvent(
        {
          id: 'memory-3',
          kind: 'habit',
          content: '完成60分钟专注',
          source: 'workspace',
          tags: ['focus'],
          createdAt: fixedNow,
        },
        defaultScope
      )

      expect(result.category).toBe('focus_session')
    })

    it('should map context kind to task_completion category', () => {
      const result = convertLegacyEvent(
        {
          id: 'memory-4',
          kind: 'context',
          content: '完成任务',
          source: 'chat',
          tags: ['task'],
          createdAt: fixedNow,
        },
        defaultScope
      )

      expect(result.category).toBe('task_completion')
      expect(result.source).toBe('conversation')
    })

    it('should map constraint and system kinds to user_correction', () => {
      const constraintResult = convertLegacyEvent(
        { id: 'memory-5', kind: 'constraint', content: '限制', source: 'system', tags: [], createdAt: fixedNow },
        defaultScope
      )
      expect(constraintResult.category).toBe('user_correction')

      const systemResult = convertLegacyEvent(
        { id: 'memory-6', kind: 'system', content: '系统', source: 'system', tags: [], createdAt: fixedNow },
        defaultScope
      )
      expect(systemResult.category).toBe('user_correction')
    })

    it('should fallback to task_completion for unknown kind', () => {
      const result = convertLegacyEvent(
        {
          id: 'memory-7',
          kind: 'unknown_kind' as string,
          content: '未知类型',
          source: 'unknown_source' as string,
          tags: [],
          createdAt: fixedNow,
        },
        defaultScope
      )

      expect(result.category).toBe('task_completion')
      expect(result.source).toBe('behavior')
    })
  })

  describe('EventFilter edge cases', () => {
    it('should filter by from only', () => {
      const store = createInMemoryEventStore()
      store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: '2026-05-28T10:00:00Z', summary: '旧事件' })
      store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: '2026-06-01T10:00:00Z', summary: '新事件' })

      const events = store.getEvents({ from: '2026-06-01T00:00:00Z' })
      expect(events).toHaveLength(1)
      expect(events[0].summary).toBe('新事件')
    })

    it('should filter by to only', () => {
      const store = createInMemoryEventStore()
      store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: '2026-05-28T10:00:00Z', summary: '旧事件' })
      store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: '2026-06-01T10:00:00Z', summary: '新事件' })

      const events = store.getEvents({ to: '2026-05-31T23:59:59Z' })
      expect(events).toHaveLength(1)
      expect(events[0].summary).toBe('旧事件')
    })

    it('should handle events without tags when filtering by tags', () => {
      const store = createInMemoryEventStore()
      store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '无标签事件' })

      const events = store.getEvents({ tags: ['study'] })
      expect(events).toHaveLength(0)
    })

    it('should handle events with empty tags array when filtering by tags', () => {
      const store = createInMemoryEventStore()
      store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '空标签', tags: [] })

      const events = store.getEvents({ tags: ['study'] })
      expect(events).toHaveLength(0)
    })

    it('should handle empty categories filter', () => {
      const store = createInMemoryEventStore()
      store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '事件' })

      const events = store.getEvents({ categories: [] })
      expect(events).toHaveLength(0)
    })

    it('should handle empty tags filter', () => {
      const store = createInMemoryEventStore()
      store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '事件', tags: ['study'] })

      const events = store.getEvents({ tags: [] })
      expect(events).toHaveLength(0)
    })

    it('should handle limit of 0', () => {
      const store = createInMemoryEventStore()
      store.addEvent({ source: 'behavior', category: 'task_completion', timestamp: fixedNow, summary: '事件' })

      const events = store.getEvents({ limit: 0 })
      expect(events).toHaveLength(0)
    })
  })

  describe('all MemoryEventCategory values', () => {
    const allCategories: MemoryEventCategory[] = [
      'task_completion', 'task_delay', 'task_creation',
      'focus_session', 'focus_skip',
      'plan_followed', 'plan_deviation',
      'conversation_insight',
      'milestone_achieved', 'streak_broken', 'streak_restored',
      'schedule_anomaly', 'energy_shift',
      'goal_change', 'preference_change',
      'user_correction',
    ]

    it('should store and retrieve events for every category', () => {
      const store = createInMemoryEventStore()
      const ids: string[] = []

      for (const category of allCategories) {
        const id = store.addEvent({
          source: 'behavior',
          category,
          timestamp: fixedNow,
          summary: `${category}事件`,
        })
        ids.push(id)
      }

      expect(store.countEvents()).toBe(allCategories.length)

      for (const category of allCategories) {
        const events = store.getEvents({ categories: [category] })
        expect(events).toHaveLength(1)
        expect(events[0].category).toBe(category)
      }
    })
  })

  describe('all MemoryEventSource values', () => {
    it('should store events with all source types', () => {
      const store = createInMemoryEventStore()

      const sources: Array<'behavior' | 'conversation' | 'manual_input'> = ['behavior', 'conversation', 'manual_input']
      for (const source of sources) {
        store.addEvent({
          source,
          category: 'task_completion',
          timestamp: fixedNow,
          summary: `${source}来源事件`,
        })
      }

      expect(store.countEvents()).toBe(3)
    })
  })
})
