/**
 * 主题套装服务测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { memoryStore } = vi.hoisted(() => {
  const memoryStore = new Map<string, unknown>()
  return { memoryStore }
})

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: vi.fn((key: string) => memoryStore.get(key) ?? ''),
    setStorageSync: vi.fn((key: string, value: unknown) => { memoryStore.set(key, value) }),
    removeStorageSync: vi.fn((key: string) => { memoryStore.delete(key) }),
    clearStorageSync: vi.fn(),
    request: vi.fn(() => Promise.resolve({ statusCode: 200, data: {} })),
    downloadFile: vi.fn(() => Promise.resolve({ statusCode: 200, tempFilePath: '/tmp/test.png' })),
    saveImageToPhotosAlbum: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../utils/storage', () => ({
  getStorage: vi.fn((key: string) => memoryStore.get(key) ?? null),
  setStorage: vi.fn((key: string, value: unknown) => { memoryStore.set(key, value) }),
  removeStorage: vi.fn((key: string) => { memoryStore.delete(key) }),
}))

import {
  getThemeSuiteOverview,
  generateThemeSuite,
  getThemeSuiteTaskStatus,
  getThemeQuota,
  canGenerateTheme,
  getActiveThemeTask,
} from '../themeSuiteService'
import { api } from '../api'

describe('themeSuiteService', () => {
  beforeEach(() => {
    memoryStore.clear()
    vi.clearAllMocks()
  })

  describe('getThemeSuiteOverview', () => {
    it('should throw if userId is empty', async () => {
      await expect(getThemeSuiteOverview('')).rejects.toThrow('[ThemeSuiteService] userId is required')
    })

    it('should return API data on success', async () => {
      const mockOverview = {
        suites: [{ id: 'spring', name: '春日花语', category: 'season', promptTemplate: 'spring outfit', festivalDate: null, previewUrl: null, sortOrder: 1, isActive: true }],
        quota: { monthlyLimit: 5, usedThisMonth: 1, remaining: 4 },
        activeTask: null,
      }
      vi.mocked(api.get).mockResolvedValueOnce(mockOverview)

      const result = await getThemeSuiteOverview('user1')
      expect(result.suites).toHaveLength(1)
      expect(result.quota.remaining).toBe(4)
    })

    it('should fallback to local data on API failure', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('network error'))

      const result = await getThemeSuiteOverview('user1')
      expect(result.suites).toEqual([])
      expect(result.activeTask).toBeNull()
    })
  })

  describe('generateThemeSuite', () => {
    it('should throw if required params missing', async () => {
      await expect(generateThemeSuite('', 'pet1', 'suite1')).rejects.toThrow('[ThemeSuiteService] userId is required')
      await expect(generateThemeSuite('user1', '', 'suite1')).rejects.toThrow('[ThemeSuiteService] petId is required')
      await expect(generateThemeSuite('user1', 'pet1', '')).rejects.toThrow('[ThemeSuiteService] suiteId is required')
    })

    it('should call API and return task info', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ taskId: 'task1', status: 'pending' })

      const result = await generateThemeSuite('user1', 'pet1', 'spring')
      expect(result.taskId).toBe('task1')
      expect(result.status).toBe('pending')
      expect(api.post).toHaveBeenCalledWith('/api/wardrobe/theme-suites/generate', { petId: 'pet1', suiteId: 'spring' })
    })
  })

  describe('getThemeSuiteTaskStatus', () => {
    it('should throw if required params missing', async () => {
      await expect(getThemeSuiteTaskStatus('', 'task1')).rejects.toThrow('[ThemeSuiteService] userId is required')
      await expect(getThemeSuiteTaskStatus('user1', '')).rejects.toThrow('[ThemeSuiteService] taskId is required')
    })

    it('should return task from API on success', async () => {
      const mockTask = {
        id: 'task1', userId: 'user1', petId: 'pet1', suiteId: 'spring',
        status: 'completed', resultUrl: 'https://example.com/result.png',
        moderationResult: 'pass', quotaConsumed: true, retryCount: 0,
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      }
      vi.mocked(api.get).mockResolvedValueOnce(mockTask)

      const result = await getThemeSuiteTaskStatus('user1', 'task1')
      expect(result!.status).toBe('completed')
    })

    it('should fallback to local tasks on API failure', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('network error'))

      const localTasks = [{
        id: 'task1', userId: 'user1', petId: 'pet1', suiteId: 'spring',
        status: 'pending', resultUrl: null, moderationResult: null,
        quotaConsumed: true, retryCount: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01',
      }]
      memoryStore.set('wardrobe_theme_tasks_user1', localTasks)

      const result = await getThemeSuiteTaskStatus('user1', 'task1')
      expect(result!.status).toBe('pending')
    })

    it('should return null when task not found locally', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('network error'))

      const result = await getThemeSuiteTaskStatus('user1', 'nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('getThemeQuota', () => {
    it('should return default when no local data', () => {
      const quota = getThemeQuota('user1')
      expect(quota).toEqual({ monthlyLimit: 0, usedThisMonth: 0, remaining: 0 })
    })

    it('should return local quota data', () => {
      memoryStore.set('wardrobe_theme_quota_user1', { monthlyLimit: 5, usedThisMonth: 2, remaining: 3 })
      const quota = getThemeQuota('user1')
      expect(quota.remaining).toBe(3)
    })
  })

  describe('canGenerateTheme', () => {
    it('should return false when no quota remaining', () => {
      memoryStore.set('wardrobe_theme_quota_user1', { monthlyLimit: 5, usedThisMonth: 5, remaining: 0 })
      expect(canGenerateTheme('user1')).toBe(false)
    })

    it('should return true when quota remaining', () => {
      memoryStore.set('wardrobe_theme_quota_user1', { monthlyLimit: 5, usedThisMonth: 2, remaining: 3 })
      expect(canGenerateTheme('user1')).toBe(true)
    })
  })

  describe('getActiveThemeTask', () => {
    it('should return null when no active tasks', () => {
      expect(getActiveThemeTask('user1')).toBeNull()
    })

    it('should return active task when one exists', () => {
      const tasks = [
        { id: 'task1', userId: 'user1', petId: 'pet1', suiteId: 'spring', status: 'completed', resultUrl: 'url', moderationResult: 'pass', quotaConsumed: true, retryCount: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        { id: 'task2', userId: 'user1', petId: 'pet1', suiteId: 'summer', status: 'processing', resultUrl: null, moderationResult: null, quotaConsumed: true, retryCount: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      ]
      memoryStore.set('wardrobe_theme_tasks_user1', tasks)

      const active = getActiveThemeTask('user1')
      expect(active).not.toBeNull()
      expect(active!.id).toBe('task2')
      expect(active!.status).toBe('processing')
    })
  })
})
