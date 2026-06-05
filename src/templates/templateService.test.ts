import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTemplateService } from './templateService'
import type { TemplateService } from './templateService'

const STORAGE_KEY = 'xinghuanhai-task-templates-state'

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

describe('templateService', () => {
  let service: TemplateService
  let storage: ReturnType<typeof mockLocalStorage>

  beforeEach(() => {
    storage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', { value: storage, writable: true })
    service = createTemplateService()
  })

  describe('getTemplates', () => {
    it('returns default templates when no saved data', () => {
      const templates = service.getTemplates()
      expect(templates.length).toBeGreaterThanOrEqual(3)
      expect(templates[0].name).toBe('每日晨间')
      expect(templates[1].name).toBe('周末学习')
      expect(templates[2].name).toBe('项目启动')
    })

    it('saves default templates to localStorage on first load', () => {
      service.getTemplates()
      expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String))
    })

    it('returns saved templates from localStorage', () => {
      const saved = [{
        id: 'custom-1',
        name: '自定义模板',
        category: 'custom',
        usageCount: 5,
        createdAt: '2026-06-01T00:00:00.000Z',
        tasks: [{ title: '任务1', minutes: 30 }]
      }]
      storage.getItem.mockReturnValue(JSON.stringify(saved))
      service = createTemplateService()
      const templates = service.getTemplates()
      expect(templates).toHaveLength(1)
      expect(templates[0].name).toBe('自定义模板')
    })
  })

  describe('createTemplate', () => {
    it('creates a new template', () => {
      const template = service.createTemplate('新模板', [{ title: '任务A', minutes: 25 }], 'work')
      expect(template.name).toBe('新模板')
      expect(template.tasks).toHaveLength(1)
      expect(template.tasks[0].title).toBe('任务A')
      expect(template.tasks[0].minutes).toBe(25)
      expect(template.category).toBe('work')
      expect(template.usageCount).toBe(0)
      expect(template.id).toBeTruthy()
    })

    it('prepends new template to the list', () => {
      service.createTemplate('第一个', [{ title: 'T1', minutes: 10 }], 'work')
      service.createTemplate('第二个', [{ title: 'T2', minutes: 20 }], 'study')
      const templates = service.getTemplates()
      const customTemplates = templates.filter((t) => !t.id.startsWith('default-'))
      expect(customTemplates[0].name).toBe('第二个')
    })
  })

  describe('deleteTemplate', () => {
    it('deletes a template by id', () => {
      const template = service.createTemplate('待删除', [{ title: 'T', minutes: 10 }], 'work')
      service.deleteTemplate(template.id)
      const templates = service.getTemplates()
      const found = templates.find((t) => t.id === template.id)
      expect(found).toBeUndefined()
    })

    it('does not throw for non-existent id', () => {
      expect(() => service.deleteTemplate('non-existent')).not.toThrow()
    })
  })

  describe('useTemplate', () => {
    it('returns tasks from the template', () => {
      const template = service.createTemplate('使用模板', [
        { title: '任务1', minutes: 25 },
        { title: '任务2', minutes: 30 }
      ], 'work')
      const tasks = service.useTemplate(template.id)
      expect(tasks).toHaveLength(2)
      expect(tasks[0].title).toBe('任务1')
      expect(tasks[1].title).toBe('任务2')
    })

    it('increments usageCount', () => {
      const template = service.createTemplate('使用模板', [{ title: 'T', minutes: 10 }], 'work')
      service.useTemplate(template.id)
      const templates = service.getTemplates()
      const updated = templates.find((t) => t.id === template.id)
      expect(updated!.usageCount).toBe(1)
    })

    it('returns empty array for non-existent template', () => {
      const tasks = service.useTemplate('non-existent')
      expect(tasks).toEqual([])
    })
  })
})