export interface BackupData {
  version: string
  exportedAt: string
  appName: string
  modules: Record<string, unknown>
  settings: Record<string, unknown>
}

export interface BackupModuleInfo {
  key: string
  name: string
  description: string
}

const STORAGE_KEYS: BackupModuleInfo[] = [
  { key: 'growth-workbench-state', name: 'workspace', description: '工作区状态' },
  { key: 'growth-workbench-memory-state', name: 'memory', description: '记忆系统数据' },
  { key: 'studyflow-state', name: 'study', description: '学习流程数据' },
  { key: 'xinghuanhai-module-layout-state', name: 'moduleLayout', description: '模块布局配置' },
  { key: 'xinghuanhai-onboarding-completed', name: 'onboardingCompleted', description: '引导完成状态' },
  { key: 'xinghuanhai-onboarding-data', name: 'onboardingData', description: '引导数据' },
  { key: 'xinghuanhai-quotes-state', name: 'quotes', description: '每日语录收藏' },
  { key: 'xinghuanhai-timeblocks-state', name: 'timeblocks', description: '时间块计划' },
  { key: 'xinghuanhai-task-templates-state', name: 'taskTemplates', description: '任务模板' },
  { key: 'xinghuanhai-watchlist-state', name: 'watchlist', description: '关注列表' },
  { key: 'xinghuanhai-mood-state', name: 'mood', description: '心情记录' },
  { key: 'xinghuanhai-quicknotes-state', name: 'quicknotes', description: '快捷笔记' },
  { key: 'xinghuanhai-wellness-state', name: 'wellness', description: '健康数据' },
  { key: 'xinghuanhai-project-state', name: 'projects', description: '项目管理' },
  { key: 'xinghuanhai-reading-state', name: 'reading', description: '阅读记录' },
  { key: 'xinghuanhai-finance-state', name: 'finance', description: '财务数据' },
  { key: 'xinghuanhai_identities', name: 'identities', description: '身份系统' },
  { key: 'growth-workbench-custom-personas', name: 'customPersonas', description: '自定义人格' },
  { key: 'persona_schedule', name: 'personaSchedule', description: '人格计划' },
  { key: 'xinghuanhai_evolution_entries', name: 'evolution', description: 'AI 进化记录' },
  { key: 'xinghuanhai_memory_events', name: 'memoryEvents', description: '记忆事件' },
  { key: 'xinghuanhai_entitlements', name: 'entitlements', description: '用户权限' },
  { key: 'dev_auth_session', name: 'authSession', description: '认证会话' },
  { key: 'growthos-orders', name: 'orders', description: '订单记录' },
  { key: 'xinghuanhai-sidebar-panel', name: 'sidebarPanel', description: '侧边栏面板' },
  { key: 'xinghuanhai-habits-state', name: 'habits', description: '习惯追踪数据' },
  { key: 'xinghuanhai-goals-state', name: 'goals', description: '目标数据' },
  { key: 'xinghuanhai-journal-state', name: 'journal', description: '日记数据' },
  { key: 'xinghuanhai-english-state', name: 'english', description: '英语学习数据' },
  { key: 'xinghuanhai-creator-ideas', name: 'creatorIdeas', description: '创作灵感' },
  { key: 'xinghuanhai-backlink-state', name: 'backlink', description: '双向链接数据' },
  { key: 'xinghuanhai-schedule-state', name: 'schedule', description: '日程提醒数据' },
]

const SENSITIVE_KEYS = [
  'dev_auth_session',
  'growthos-admin-session',
  'xinghuanhai_entitlements',
  'user_id',
]

const API_KEY_PATTERNS = [
  '_api_key',
  '_key',
]

export function getAllStorageData(): BackupData {
  const modules: Record<string, unknown> = {}
  const settings: Record<string, unknown> = {}

  for (const moduleInfo of STORAGE_KEYS) {
    try {
      const data = window.localStorage.getItem(moduleInfo.key)
      if (data) {
        try {
          modules[moduleInfo.name] = JSON.parse(data)
        } catch {
          modules[moduleInfo.name] = data
        }
      }
    } catch (e) {
      console.warn(`Failed to read ${moduleInfo.key}:`, e)
    }
  }

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (key && !STORAGE_KEYS.some(m => m.key === key)) {
      const isSensitive = SENSITIVE_KEYS.some(sk => key.includes(sk))
      const isApiKey = API_KEY_PATTERNS.some(pattern => key.includes(pattern))
      
      if (!isSensitive && !isApiKey) {
        try {
          const data = window.localStorage.getItem(key)
          if (data) {
            try {
              settings[key] = JSON.parse(data)
            } catch {
              settings[key] = data
            }
          }
        } catch (e) {
          console.warn(`Failed to read setting ${key}:`, e)
        }
      }
    }
  }

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    appName: '星寰海',
    modules,
    settings
  }
}

export function exportToJSON(): string {
  const data = getAllStorageData()
  return JSON.stringify(data, null, 2)
}

export function downloadBackup(filename?: string): void {
  const json = exportToJSON()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const defaultFilename = `星寰海备份_${new Date().toISOString().slice(0, 10)}.json`
  const link = document.createElement('a')
  link.href = url
  link.download = filename || defaultFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function importFromJSON(jsonString: string, options?: {
  merge?: boolean
  onProgress?: (module: string, status: 'success' | 'error', message?: string) => void
}): { success: boolean; imported: number; failed: number; errors: string[] } {
  let data: BackupData
  
  try {
    data = JSON.parse(jsonString)
  } catch {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: ['无效的 JSON 格式']
    }
  }

  if (!data.version || !data.modules) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: ['无效的备份文件格式']
    }
  }

  const keyMap: Record<string, string> = {}
  for (const moduleInfo of STORAGE_KEYS) {
    keyMap[moduleInfo.name] = moduleInfo.key
  }

  let imported = 0
  let failed = 0
  const errors: string[] = []

  const modulesToImport = { ...data.modules, ...data.settings }
  
  for (const [moduleName, moduleData] of Object.entries(modulesToImport)) {
    const storageKey = keyMap[moduleName] || moduleName
    
    try {
      const jsonData = typeof moduleData === 'string' ? moduleData : JSON.stringify(moduleData)
      window.localStorage.setItem(storageKey, jsonData)
      imported++
      options?.onProgress?.(moduleName, 'success')
    } catch (e) {
      failed++
      const errorMsg = `导入 ${moduleName} 失败: ${e instanceof Error ? e.message : '未知错误'}`
      errors.push(errorMsg)
      options?.onProgress?.(moduleName, 'error', errorMsg)
    }
  }

  return {
    success: failed === 0,
    imported,
    failed,
    errors
  }
}

export function getBackupInfo(): { moduleCount: number; totalSize: number; modules: { name: string; key: string; size: number; hasData: boolean }[] } {
  const modules: { name: string; key: string; size: number; hasData: boolean }[] = []
  let totalSize = 0

  for (const moduleInfo of STORAGE_KEYS) {
    const data = window.localStorage.getItem(moduleInfo.key)
    const size = data ? new Blob([data]).size : 0
    const hasData = !!data
    
    totalSize += size
    modules.push({
      name: moduleInfo.name,
      key: moduleInfo.key,
      size,
      hasData
    })
  }

  return {
    moduleCount: modules.filter(m => m.hasData).length,
    totalSize,
    modules
  }
}

export function clearAllData(options?: {
  confirmText?: string
  onConfirm?: () => void
}): Promise<boolean> {
  return new Promise((resolve) => {
    const confirmed = options?.confirmText 
      ? window.confirm(`确定要清除所有数据吗？此操作不可恢复！\n\n请输入 "${options.confirmText}" 确认：`)
      : window.confirm('确定要清除所有数据吗？此操作不可恢复！')
    
    if (confirmed) {
      for (const moduleInfo of STORAGE_KEYS) {
        window.localStorage.removeItem(moduleInfo.key)
      }
      
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key && !SENSITIVE_KEYS.some(sk => key.includes(sk)) && !API_KEY_PATTERNS.some(pattern => key.includes(pattern))) {
          window.localStorage.removeItem(key)
        }
      }
      
      options?.onConfirm?.()
      resolve(true)
    } else {
      resolve(false)
    }
  })
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export interface SyncManifest {
  exportedAt: string
  version: string
  modules: Record<string, { size: number; hash: string }>
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

export function generateSyncManifest(): SyncManifest {
  const modules: Record<string, { size: number; hash: string }> = {}

  for (const moduleInfo of STORAGE_KEYS) {
    const raw = window.localStorage.getItem(moduleInfo.key)
    if (raw) {
      modules[moduleInfo.key] = {
        size: new Blob([raw]).size,
        hash: simpleHash(raw)
      }
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    modules
  }
}

export function compareManifests(local: SyncManifest, remote: SyncManifest): {
  localOnly: string[]
  remoteOnly: string[]
  changed: string[]
  unchanged: string[]
} {
  const localOnly: string[] = []
  const remoteOnly: string[] = []
  const changed: string[] = []
  const unchanged: string[] = []

  const allKeys = new Set([...Object.keys(local.modules), ...Object.keys(remote.modules)])

  for (const key of allKeys) {
    const localMod = local.modules[key]
    const remoteMod = remote.modules[key]

    if (localMod && !remoteMod) {
      localOnly.push(key)
    } else if (!localMod && remoteMod) {
      remoteOnly.push(key)
    } else if (localMod && remoteMod) {
      if (localMod.hash !== remoteMod.hash) {
        changed.push(key)
      } else {
        unchanged.push(key)
      }
    }
  }

  return { localOnly, remoteOnly, changed, unchanged }
}

export function exportAllData(): void {
  downloadBackup()
}

export function importAllData(data: BackupData): { success: boolean; imported: number; failed: number; errors: string[] } {
  return importFromJSON(JSON.stringify(data))
}
