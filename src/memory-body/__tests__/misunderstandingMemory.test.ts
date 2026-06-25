import { describe, expect, it } from 'vitest'
import {
  createMisunderstandingMemory,
  addRelatedTask,
  summarizeMisunderstandingMemory,
  findRelevantMisunderstandings
} from '../profile/misunderstandingMemory'

describe('misunderstandingMemory', () => {
  describe('createMisunderstandingMemory', () => {
    it('creates a misunderstanding memory with required fields', () => {
      const memory = createMisunderstandingMemory({
        userSaid: '做最完整的方案',
        assistantInterpreted: '做最完整的阶段',
        userCorrection: '不是最完整阶段，而是最完整方案',
        lesson: '遇到"完整"时优先理解为终局方案完整性'
      })
      expect(memory.id).toBeTruthy()
      expect(memory.id).toMatch(/^misunderstanding-/)
      expect(memory.userSaid).toBe('做最完整的方案')
      expect(memory.assistantInterpreted).toBe('做最完整的阶段')
      expect(memory.userCorrection).toBe('不是最完整阶段，而是最完整方案')
      expect(memory.lesson).toBe('遇到"完整"时优先理解为终局方案完整性')
      expect(memory.futureGuard).toBeNull()
      expect(memory.relatedTaskIds).toEqual([])
      expect(memory.createdAt).toBeTruthy()
    })

    it('creates a misunderstanding memory with optional fields', () => {
      const memory = createMisunderstandingMemory({
        userSaid: '做最完整的方案',
        assistantInterpreted: '做最完整的阶段',
        userCorrection: '不是最完整阶段，而是最完整方案',
        lesson: '遇到"完整"时优先理解为终局方案完整性',
        futureGuard: {
          pattern: '完整方案',
          guardType: 'content_filter',
          createdAt: '2026-06-23T00:00:00.000Z'
        },
        relatedTaskIds: ['task-1', 'task-2']
      })
      expect(memory.futureGuard).toEqual({
        pattern: '完整方案',
        guardType: 'content_filter',
        createdAt: '2026-06-23T00:00:00.000Z'
      })
      expect(memory.relatedTaskIds).toEqual(['task-1', 'task-2'])
    })

    it('generates unique ids', () => {
      const m1 = createMisunderstandingMemory({
        userSaid: 'a',
        assistantInterpreted: 'b',
        userCorrection: 'c',
        lesson: 'd'
      })
      const m2 = createMisunderstandingMemory({
        userSaid: 'a',
        assistantInterpreted: 'b',
        userCorrection: 'c',
        lesson: 'd'
      })
      expect(m1.id).not.toBe(m2.id)
    })
  })

  describe('addRelatedTask', () => {
    it('adds a related task id', () => {
      const memory = createMisunderstandingMemory({
        userSaid: '做最完整的方案',
        assistantInterpreted: '做最完整的阶段',
        userCorrection: '不是最完整阶段，而是最完整方案',
        lesson: '遇到"完整"时优先理解为终局方案完整性'
      })
      const updated = addRelatedTask(memory, 'task-1')
      expect(updated.relatedTaskIds).toContain('task-1')
    })

    it('does not add duplicate task ids', () => {
      const memory = createMisunderstandingMemory({
        userSaid: '做最完整的方案',
        assistantInterpreted: '做最完整的阶段',
        userCorrection: '不是最完整阶段，而是最完整方案',
        lesson: '遇到"完整"时优先理解为终局方案完整性',
        relatedTaskIds: ['task-1']
      })
      const updated = addRelatedTask(memory, 'task-1')
      expect(updated.relatedTaskIds).toEqual(['task-1'])
    })
  })

  describe('summarizeMisunderstandingMemory', () => {
    it('summarizes a misunderstanding memory', () => {
      const memory = createMisunderstandingMemory({
        userSaid: '做最完整的方案',
        assistantInterpreted: '做最完整的阶段',
        userCorrection: '不是最完整阶段，而是最完整方案',
        lesson: '遇到"完整"时优先理解为终局方案完整性'
      })
      const summary = summarizeMisunderstandingMemory(memory)
      expect(summary).toContain('做最完整的方案')
      expect(summary).toContain('做最完整的阶段')
      expect(summary).toContain('不是最完整阶段，而是最完整方案')
      expect(summary).toContain('遇到"完整"时优先理解为终局方案完整性')
    })
  })

  describe('findRelevantMisunderstandings', () => {
    it('finds misunderstandings matching keyword', () => {
      const memories = [
        createMisunderstandingMemory({
          userSaid: '做最完整的方案',
          assistantInterpreted: '做最完整的阶段',
          userCorrection: '不是最完整阶段，而是最完整方案',
          lesson: '遇到"完整"时优先理解为终局方案完整性'
        }),
        createMisunderstandingMemory({
          userSaid: '用蓝色',
          assistantInterpreted: '用深蓝色',
          userCorrection: '用浅蓝色',
          lesson: '蓝色默认指浅蓝色'
        })
      ]
      const results = findRelevantMisunderstandings(memories, '完整')
      expect(results).toHaveLength(1)
      expect(results[0].userSaid).toBe('做最完整的方案')
    })

    it('matches in assistantInterpreted', () => {
      const memories = [
        createMisunderstandingMemory({
          userSaid: '做最完整的方案',
          assistantInterpreted: '做最完整的阶段',
          userCorrection: '不是最完整阶段，而是最完整方案',
          lesson: '遇到"完整"时优先理解为终局方案完整性'
        })
      ]
      const results = findRelevantMisunderstandings(memories, '阶段')
      expect(results).toHaveLength(1)
    })

    it('matches in userCorrection', () => {
      const memories = [
        createMisunderstandingMemory({
          userSaid: '做最完整的方案',
          assistantInterpreted: '做最完整的阶段',
          userCorrection: '不是最完整阶段，而是最完整方案',
          lesson: '遇到"完整"时优先理解为终局方案完整性'
        })
      ]
      const results = findRelevantMisunderstandings(memories, '终局')
      expect(results).toHaveLength(1)
    })

    it('matches in lesson', () => {
      const memories = [
        createMisunderstandingMemory({
          userSaid: '做最完整的方案',
          assistantInterpreted: '做最完整的阶段',
          userCorrection: '不是最完整阶段，而是最完整方案',
          lesson: '遇到"完整"时优先理解为终局方案完整性'
        })
      ]
      const results = findRelevantMisunderstandings(memories, '终局方案')
      expect(results).toHaveLength(1)
    })

    it('returns empty array when no match', () => {
      const memories = [
        createMisunderstandingMemory({
          userSaid: '做最完整的方案',
          assistantInterpreted: '做最完整的阶段',
          userCorrection: '不是最完整阶段，而是最完整方案',
          lesson: '遇到"完整"时优先理解为终局方案完整性'
        })
      ]
      const results = findRelevantMisunderstandings(memories, '不存在')
      expect(results).toHaveLength(0)
    })

    it('is case insensitive', () => {
      const memories = [
        createMisunderstandingMemory({
          userSaid: '做最完整的方案',
          assistantInterpreted: '做最完整的阶段',
          userCorrection: '不是最完整阶段，而是最完整方案',
          lesson: '遇到"完整"时优先理解为终局方案完整性'
        })
      ]
      const results = findRelevantMisunderstandings(memories, '完整')
      expect(results).toHaveLength(1)
    })
  })
})
