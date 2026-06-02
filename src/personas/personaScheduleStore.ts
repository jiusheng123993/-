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
