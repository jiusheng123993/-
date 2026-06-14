import { describe, it, expect, beforeEach } from 'vitest'
import { createQuickNotesService } from './quickNotesService'
import type { QuickNotesService } from './quickNotesService'

describe('quickNotesService', () => {
  let service: QuickNotesService

  beforeEach(() => {
    localStorage.clear()
    service = createQuickNotesService()
  })

  describe('notes', () => {
    it('adds a note', () => {
      const note = service.addNote('这是一个测试笔记', ['测试', '重要'])
      expect(note.content).toBe('这是一个测试笔记')
      expect(note.tags).toEqual(['测试', '重要'])
      expect(note.pinned).toBe(false)
      expect(note.id).toBeTruthy()
    })

    it('adds a note with default tags', () => {
      const note = service.addNote('简单笔记')
      expect(note.tags).toEqual([])
    })

    it('updates a note', () => {
      const note = service.addNote('原始内容')
      service.updateNote(note.id, '更新后的内容')
      const state = service.getState()
      expect(state.notes[0].content).toBe('更新后的内容')
    })

    it('toggles pin status', () => {
      const note = service.addNote('测试笔记')
      expect(note.pinned).toBe(false)

      service.togglePin(note.id)
      expect(service.getState().notes[0].pinned).toBe(true)

      service.togglePin(note.id)
      expect(service.getState().notes[0].pinned).toBe(false)
    })

    it('removes a note', () => {
      const note = service.addNote('测试笔记')
      service.removeNote(note.id)
      expect(service.getState().notes).toHaveLength(0)
    })

    it('persists notes across service instances', () => {
      service.addNote('持久化测试')
      const service2 = createQuickNotesService()
      expect(service2.getState().notes).toHaveLength(1)
    })
  })

  describe('queries', () => {
    it('gets pinned notes', () => {
      const note1 = service.addNote('置顶笔记1')
      service.addNote('普通笔记')
      service.togglePin(note1.id)

      const pinned = service.getPinnedNotes()
      expect(pinned).toHaveLength(1)
      expect(pinned[0].id).toBe(note1.id)
    })

    it('gets recent notes with limit', () => {
      for (let i = 0; i < 15; i++) {
        service.addNote(`笔记 ${i}`)
      }

      const recent = service.getRecentNotes(5)
      expect(recent).toHaveLength(5)
    })

    it('searches notes by content', () => {
      service.addNote('关于React开发的笔记')
      service.addNote('Python机器学习')
      service.addNote('React组件设计')

      const results = service.searchNotes('React')
      expect(results).toHaveLength(2)
    })

    it('searches notes by tags', () => {
      service.addNote('笔记1', ['工作', '重要'])
      service.addNote('笔记2', ['个人'])
      service.addNote('笔记3', ['工作', '紧急'])

      const results = service.searchNotes('工作')
      expect(results).toHaveLength(2)
    })

    it('returns empty for no matches', () => {
      service.addNote('测试笔记')
      const results = service.searchNotes('不存在的内容')
      expect(results).toHaveLength(0)
    })
  })
})