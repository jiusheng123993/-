/**
 * 主题套装服务
 *
 * 宠物主题套装的生成/任务状态轮询/配额管理
 */
import Taro from '@tarojs/taro'
import { CONFIG } from '../config'
import { api } from './api'
import { getStorage, setStorage } from '../utils/storage'
import type {
  ThemeSuiteDef,
  ThemeSuiteTask,
  ThemeQuotaInfo,
  ModerationResult,
} from '../types/wardrobeTypes'
import { WARDROBE_ERROR_CODES, THEME_GENERATION_POLL_INTERVAL, THEME_MAX_RETRIES } from '../constants/wardrobe'

const THEME_SUITES_KEY = 'wardrobe_theme_suites'
const THEME_TASKS_KEY = 'wardrobe_theme_tasks'
const THEME_QUOTA_KEY = 'wardrobe_theme_quota'

interface ThemeSuiteOverview {
  suites: ThemeSuiteDef[]
  quota: ThemeQuotaInfo
  activeTask: ThemeSuiteTask | null
}

function userKey(userId: string, key: string): string {
  return `${key}_${userId}`
}

function getLocalThemeSuites(userId: string): ThemeSuiteDef[] {
  return getStorage<ThemeSuiteDef[]>(userKey(userId, THEME_SUITES_KEY)) || []
}

function saveLocalThemeSuites(userId: string, suites: ThemeSuiteDef[]): void {
  setStorage(userKey(userId, THEME_SUITES_KEY), suites)
}

function getLocalThemeTasks(userId: string): ThemeSuiteTask[] {
  return getStorage<ThemeSuiteTask[]>(userKey(userId, THEME_TASKS_KEY)) || []
}

function saveLocalThemeTasks(userId: string, tasks: ThemeSuiteTask[]): void {
  setStorage(userKey(userId, THEME_TASKS_KEY), tasks)
}

function getLocalThemeQuota(userId: string): ThemeQuotaInfo | null {
  return getStorage<ThemeQuotaInfo>(userKey(userId, THEME_QUOTA_KEY)) || null
}

function saveLocalThemeQuota(userId: string, quota: ThemeQuotaInfo): void {
  setStorage(userKey(userId, THEME_QUOTA_KEY), quota)
}

export async function getThemeSuiteOverview(userId: string): Promise<ThemeSuiteOverview> {
  if (!userId) throw new Error('[ThemeSuiteService] userId is required')

  try {
    const result = await api.get<ThemeSuiteOverview>('/api/wardrobe/theme-suites')
    saveLocalThemeSuites(userId, result.suites)
    if (result.quota) {
      saveLocalThemeQuota(userId, result.quota)
    }
    return result
  } catch {
    return {
      suites: getLocalThemeSuites(userId),
      quota: getLocalThemeQuota(userId) || { monthlyLimit: 0, usedThisMonth: 0, remaining: 0 },
      activeTask: null,
    }
  }
}

export async function generateThemeSuite(
  userId: string,
  petId: string,
  suiteId: string,
): Promise<{ taskId: string; status: string }> {
  if (!userId) throw new Error('[ThemeSuiteService] userId is required')
  if (!petId) throw new Error('[ThemeSuiteService] petId is required')
  if (!suiteId) throw new Error('[ThemeSuiteService] suiteId is required')

  const result = await api.post<{ taskId: string; status: string }>(
    '/api/wardrobe/theme-suites/generate',
    { petId, suiteId },
  )

  return result
}

export async function getThemeSuiteTaskStatus(
  userId: string,
  taskId: string,
): Promise<ThemeSuiteTask | null> {
  if (!userId) throw new Error('[ThemeSuiteService] userId is required')
  if (!taskId) throw new Error('[ThemeSuiteService] taskId is required')

  try {
    const result = await api.get<ThemeSuiteTask>(`/api/wardrobe/theme-suites/task/${taskId}`)
    const tasks = getLocalThemeTasks(userId)
    const index = tasks.findIndex(t => t.id === taskId)
    if (index !== -1) {
      tasks[index] = result
    } else {
      tasks.push(result)
    }
    saveLocalThemeTasks(userId, tasks)
    return result
  } catch {
    const tasks = getLocalThemeTasks(userId)
    return tasks.find(t => t.id === taskId) || null
  }
}

export async function pollThemeSuiteTask(
  userId: string,
  taskId: string,
  onProgress: (task: ThemeSuiteTask) => void,
  onComplete: (task: ThemeSuiteTask) => void,
  onError: (error: Error) => void,
): Promise<void> {
  let retryCount = 0

  const poll = async (): Promise<void> => {
    try {
      const task = await getThemeSuiteTaskStatus(userId, taskId)

      if (!task) {
        onError(new Error('任务不存在'))
        return
      }

      onProgress(task)

      if (task.status === 'completed') {
        if (task.moderationResult === 'block') {
          onError(new Error('生成内容未通过审核'))
          return
        }
        onComplete(task)
        return
      }

      if (task.status === 'failed') {
        if (retryCount < THEME_MAX_RETRIES) {
          retryCount++
          await new Promise(resolve => setTimeout(resolve, THEME_GENERATION_POLL_INTERVAL))
          return poll()
        }
        onError(new Error('生成失败，请稍后重试'))
        return
      }

      await new Promise(resolve => setTimeout(resolve, THEME_GENERATION_POLL_INTERVAL))
      return poll()
    } catch (error) {
      if (retryCount < THEME_MAX_RETRIES) {
        retryCount++
        await new Promise(resolve => setTimeout(resolve, THEME_GENERATION_POLL_INTERVAL))
        return poll()
      }
      onError(error instanceof Error ? error : new Error('查询任务状态失败'))
    }
  }

  await poll()
}

export async function saveThemeSuiteResult(
  userId: string,
  petId: string,
  resultUrl: string,
): Promise<void> {
  if (!userId) throw new Error('[ThemeSuiteService] userId is required')
  if (!petId) throw new Error('[ThemeSuiteService] petId is required')

  try {
    const tempPath = await downloadImageToTemp(resultUrl)
    if (tempPath) {
      await Taro.saveImageToPhotosAlbum({ filePath: tempPath })
    }
  } catch {
    // save to album is best-effort
  }
}

async function downloadImageToTemp(url: string): Promise<string | null> {
  try {
    const res = await Taro.downloadFile({ url })
    if (res.statusCode === 200 && res.tempFilePath) {
      return res.tempFilePath
    }
    return null
  } catch {
    return null
  }
}

export function getThemeQuota(userId: string): ThemeQuotaInfo {
  return getLocalThemeQuota(userId) || { monthlyLimit: 0, usedThisMonth: 0, remaining: 0 }
}

export function canGenerateTheme(userId: string): boolean {
  const quota = getThemeQuota(userId)
  return quota.remaining > 0
}

export function getActiveThemeTask(userId: string): ThemeSuiteTask | null {
  const tasks = getLocalThemeTasks(userId)
  return tasks.find(t => t.status === 'pending' || t.status === 'processing') || null
}
