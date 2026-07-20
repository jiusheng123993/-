export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'

export type IncidentCategory =
  | 'content_violation'
  | 'jailbreak_attempt'
  | 'age_restriction'
  | 'user_report'
  | 'system_block'

export interface SafetyIncident {
  id: string
  userId: string
  category: IncidentCategory
  severity: IncidentSeverity
  description: string
  context?: Record<string, unknown>
  createdAt: string
}

export interface SafetyIncidentLog {
  log(incident: Omit<SafetyIncident, 'id' | 'createdAt'>): string
  getByUser(userId: string, limit?: number): SafetyIncident[]
  getByCategory(category: IncidentCategory, limit?: number): SafetyIncident[]
  getRecent(limit?: number): SafetyIncident[]
  countByUser(userId: string): number
  clear(): void
}

const STORAGE_KEY = 'safety_incidents'

export function createSafetyIncidentLog(): SafetyIncidentLog {
  const incidents: SafetyIncident[] = []

  return {
    log(incidentData): string {
      const incident: SafetyIncident = {
        ...incidentData,
        id: `incident_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString()
      }
      incidents.push(incident)

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents.slice(-100)))
      } catch { /* ignore */ }

      return incident.id
    },

    getByUser(userId, limit = 50): SafetyIncident[] {
      return incidents
        .filter(i => i.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
    },

    getByCategory(category, limit = 50): SafetyIncident[] {
      return incidents
        .filter(i => i.category === category)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
    },

    getRecent(limit = 50): SafetyIncident[] {
      return [...incidents]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
    },

    countByUser(userId): number {
      return incidents.filter(i => i.userId === userId).length
    },

    clear(): void {
      incidents.length = 0
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    }
  }
}
