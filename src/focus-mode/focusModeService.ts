import type { FocusTask, PomodoroRecord, FocusSettings, CustomBackground } from './types'

const TASKS_KEY = 'xinghuanhai-focus-tasks'
const RECORDS_KEY = 'xinghuanhai-focus-records'
const SETTINGS_KEY = 'xinghuanhai-focus-settings'
const CUSTOM_BG_DB = 'xinghuanhai-focus-custom-bg'
const CUSTOM_BG_STORE = 'custom-backgrounds'

const DEFAULT_SETTINGS: FocusSettings = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreak: false,
  autoStartFocus: false,
  soundEnabled: true,
  vibrationEnabled: false,
  doNotDisturb: false,
  selectedTheme: 'forest',
  selectedAudio: 'none',
  audioVolume: 0.5,
  lastTaskId: null
}

const TASK_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6']

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadTasks(): FocusTask[] {
  return loadFromStorage<FocusTask[]>(TASKS_KEY, [])
}

export function saveTasks(tasks: FocusTask[]): void {
  saveToStorage(TASKS_KEY, tasks)
}

export function createTask(title: string): FocusTask {
  const tasks = loadTasks()
  const usedColors = new Set(tasks.map(t => t.color))
  const availableColor = TASK_COLORS.find(c => !usedColors.has(c)) || TASK_COLORS[tasks.length % TASK_COLORS.length]

  const task: FocusTask = {
    id: `task-${Date.now()}`,
    title: title.trim(),
    createdAt: new Date().toISOString(),
    color: availableColor
  }
  tasks.push(task)
  saveTasks(tasks)
  return task
}

export function deleteTask(taskId: string): void {
  const tasks = loadTasks().filter(t => t.id !== taskId)
  saveTasks(tasks)

  const settings = loadSettings()
  if (settings.lastTaskId === taskId) {
    settings.lastTaskId = null
    saveSettings(settings)
  }
}

export function getTaskById(taskId: string): FocusTask | undefined {
  return loadTasks().find(t => t.id === taskId)
}

export function loadRecords(): PomodoroRecord[] {
  return loadFromStorage<PomodoroRecord[]>(RECORDS_KEY, [])
}

export function saveRecord(record: PomodoroRecord): void {
  const records = loadRecords()
  records.push(record)
  saveToStorage(RECORDS_KEY, records)
}

export function getTodayRecords(): PomodoroRecord[] {
  const today = new Date().toDateString()
  return loadRecords().filter(r => new Date(r.completedAt).toDateString() === today)
}

export function getTodayFocusMinutes(): number {
  return getTodayRecords()
    .filter(r => r.type === 'focus' && !r.abandoned)
    .reduce((sum, r) => sum + r.durationMinutes, 0)
}

export function getTodayPomodoroCount(): number {
  return getTodayRecords().filter(r => r.type === 'focus' && !r.abandoned).length
}

export function loadSettings(): FocusSettings {
  return loadFromStorage<FocusSettings>(SETTINGS_KEY, DEFAULT_SETTINGS)
}

export function saveSettings(settings: FocusSettings): void {
  saveToStorage(SETTINGS_KEY, settings)
}

export function updateSettings(partial: Partial<FocusSettings>): FocusSettings {
  const settings = { ...loadSettings(), ...partial }
  saveSettings(settings)
  return settings
}

function openCustomBgDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CUSTOM_BG_DB, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(CUSTOM_BG_STORE)) {
        db.createObjectStore(CUSTOM_BG_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveCustomBackground(bg: CustomBackground): Promise<void> {
  const db = await openCustomBgDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CUSTOM_BG_STORE, 'readwrite')
    tx.objectStore(CUSTOM_BG_STORE).put(bg)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadCustomBackgrounds(): Promise<CustomBackground[]> {
  const db = await openCustomBgDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CUSTOM_BG_STORE, 'readonly')
    const request = tx.objectStore(CUSTOM_BG_STORE).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteCustomBackground(id: string): Promise<void> {
  const db = await openCustomBgDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CUSTOM_BG_STORE, 'readwrite')
    tx.objectStore(CUSTOM_BG_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
