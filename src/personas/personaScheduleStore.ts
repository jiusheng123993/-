export interface PersonaSchedule {
  userId: string
  mainPersonaId: string
  mainPersonaSelectedAt: string
  mainPersonaLastChangedAt: string
  activeCameo?: {
    personaId: string
    triggeredBy: 'cron' | 'event_threshold' | 'user_purchase' | 'user_manual'
    triggerDetail: string
    startedAt: string
    endsAt: string
  }
  cameoFrequency: 'daily' | 'weekly' | 'event_threshold' | 'off'
  lastFocusMinutes?: number
  completedTaskCount?: number
  consecutiveFocusDays?: number
  userBirthday?: string
  userAnniversary?: string
}

export interface PersonaScheduleStorage {
  get(userId: string): PersonaSchedule | null
  save(schedule: PersonaSchedule): void
  canChangeMainPersona(userId: string): boolean
  updateMainPersona(userId: string, personaId: string): boolean
  activateCameo(userId: string, cameo: PersonaSchedule['activeCameo']): void
  endCameo(userId: string): void
  clear(): void
}

const STORAGE_KEY = 'persona_schedule'

function getKey(userId: string): string {
  return `${STORAGE_KEY}_${userId}`
}

export function createPersonaScheduleStorage(): PersonaScheduleStorage {
  return {
    get(userId: string): PersonaSchedule | null {
      try {
        const data = localStorage.getItem(getKey(userId))
        if (!data) return null
        return JSON.parse(data) as PersonaSchedule
      } catch {
        return null
      }
    },

    save(schedule: PersonaSchedule): void {
      try {
        localStorage.setItem(getKey(schedule.userId), JSON.stringify(schedule))
      } catch { /* ignore */ }
    },

    canChangeMainPersona(userId: string): boolean {
      const schedule = this.get(userId)
      if (!schedule) return true

      const lastChanged = new Date(schedule.mainPersonaLastChangedAt)
      const now = new Date()
      const diffMonths = (now.getFullYear() - lastChanged.getFullYear()) * 12 +
        (now.getMonth() - lastChanged.getMonth())

      return diffMonths >= 1
    },

    updateMainPersona(userId: string, personaId: string): boolean {
      if (!this.canChangeMainPersona(userId)) {
        return false
      }

      const existing = this.get(userId)
      const now = new Date().toISOString()

      const schedule: PersonaSchedule = {
        userId,
        mainPersonaId: personaId,
        mainPersonaSelectedAt: existing?.mainPersonaSelectedAt ?? now,
        mainPersonaLastChangedAt: now,
        activeCameo: existing?.activeCameo,
        cameoFrequency: existing?.cameoFrequency ?? 'weekly'
      }

      this.save(schedule)
      return true
    },

    activateCameo(userId: string, cameo: PersonaSchedule['activeCameo']): void {
      const schedule = this.get(userId)
      if (!schedule) return

      schedule.activeCameo = cameo
      this.save(schedule)
    },

    endCameo(userId: string): void {
      const schedule = this.get(userId)
      if (!schedule) return

      schedule.activeCameo = undefined
      this.save(schedule)
    },

    clear(): void {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key?.startsWith(STORAGE_KEY)) {
          localStorage.removeItem(key)
        }
      }
    }
  }
}

const IDB_DB_NAME = 'persona_schedule_db'
const IDB_STORE_NAME = 'schedules'
const IDB_VERSION = 1

function openScheduleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_DB_NAME, IDB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME, { keyPath: 'userId' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function loadAllFromDB(db: IDBDatabase): Promise<Map<string, PersonaSchedule>> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly')
    const store = tx.objectStore(IDB_STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      const map = new Map<string, PersonaSchedule>()
      for (const schedule of request.result) {
        map.set(schedule.userId, schedule)
      }
      resolve(map)
    }
    request.onerror = () => reject(request.error)
  })
}

function persistToDB(db: IDBDatabase, schedule: PersonaSchedule): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite')
    const store = tx.objectStore(IDB_STORE_NAME)
    const request = store.put(schedule)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

function clearDB(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite')
    const store = tx.objectStore(IDB_STORE_NAME)
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export function createIndexedDBPersonaScheduleStorage(): PersonaScheduleStorage {
  const cache = new Map<string, PersonaSchedule>()

  openScheduleDB().then(db => {
    return loadAllFromDB(db).then(data => {
      for (const [key, value] of data) {
        cache.set(key, value)
      }
    })
  }).catch(() => { /* ignore */ })

  function persist(schedule: PersonaSchedule): void {
    openScheduleDB().then(db => persistToDB(db, schedule)).catch(() => { /* ignore */ })
  }

  return {
    get(userId: string): PersonaSchedule | null {
      return cache.get(userId) ?? null
    },

    save(schedule: PersonaSchedule): void {
      cache.set(schedule.userId, schedule)
      persist(schedule)
    },

    canChangeMainPersona(userId: string): boolean {
      const schedule = cache.get(userId)
      if (!schedule) return true

      const lastChanged = new Date(schedule.mainPersonaLastChangedAt)
      const now = new Date()
      const diffMonths = (now.getFullYear() - lastChanged.getFullYear()) * 12 +
        (now.getMonth() - lastChanged.getMonth())

      return diffMonths >= 1
    },

    updateMainPersona(userId: string, personaId: string): boolean {
      if (!this.canChangeMainPersona(userId)) {
        return false
      }

      const existing = cache.get(userId)
      const now = new Date().toISOString()

      const schedule: PersonaSchedule = {
        userId,
        mainPersonaId: personaId,
        mainPersonaSelectedAt: existing?.mainPersonaSelectedAt ?? now,
        mainPersonaLastChangedAt: now,
        activeCameo: existing?.activeCameo,
        cameoFrequency: existing?.cameoFrequency ?? 'weekly'
      }

      cache.set(userId, schedule)
      persist(schedule)
      return true
    },

    activateCameo(userId: string, cameo: PersonaSchedule['activeCameo']): void {
      const schedule = cache.get(userId)
      if (!schedule) return

      schedule.activeCameo = cameo
      cache.set(userId, schedule)
      persist(schedule)
    },

    endCameo(userId: string): void {
      const schedule = cache.get(userId)
      if (!schedule) return

      schedule.activeCameo = undefined
      cache.set(userId, schedule)
      persist(schedule)
    },

    clear(): void {
      cache.clear()
      openScheduleDB().then(db => clearDB(db)).catch(() => { /* ignore */ })
    }
  }
}
