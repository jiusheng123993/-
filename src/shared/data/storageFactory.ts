export interface StorageService<T> {
  load(): T
  save(state: T): void
}

export function createStorageService<T>(
  storageKey: string,
  defaultState: T,
  migrate?: (raw: unknown) => T
): StorageService<T> {
  const cloneDefault = (): T => {
    if (defaultState === null || defaultState === undefined) return defaultState
    if (typeof defaultState === 'object') {
      return JSON.parse(JSON.stringify(defaultState)) as T
    }
    return defaultState
  }

  const load = (): T => {
    if (typeof window === 'undefined') return cloneDefault()
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return cloneDefault()
      const parsed = JSON.parse(raw)
      return migrate ? migrate(parsed) : (parsed as T)
    } catch (err) {
      console.warn(`[storageFactory] Failed to load "${storageKey}":`, err)
      return cloneDefault()
    }
  }

  const save = (state: T): void => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (err) {
      console.warn(`[storageFactory] Failed to save "${storageKey}":`, err)
    }
  }

  return { load, save }
}
