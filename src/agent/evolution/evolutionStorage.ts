import type { EvolutionEntry } from './evolutionRitualTypes'

const STORAGE_KEY = 'xinghuanhai_evolution_entries'

function getAll(): Record<string, EvolutionEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setAll(entries: Record<string, EvolutionEntry>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export const evolutionStorage = {
  async save(entry: EvolutionEntry): Promise<void> {
    const entries = getAll()
    entries[entry.id] = entry
    setAll(entries)
  },

  async getById(id: string): Promise<EvolutionEntry | undefined> {
    const entries = getAll()
    return entries[id]
  },

  async getByUser(userId: string): Promise<EvolutionEntry[]> {
    const entries = getAll()
    return Object.values(entries).filter(e => e.userId === userId)
  },

  async getPending(userId: string): Promise<EvolutionEntry[]> {
    const entries = await this.getByUser(userId)
    return entries.filter(e => e.userDecision === 'pending')
  },

  async getByDecision(userId: string, decision: EvolutionEntry['userDecision']): Promise<EvolutionEntry[]> {
    const entries = await this.getByUser(userId)
    return entries.filter(e => e.userDecision === decision)
  },

  async updateDecision(id: string, decision: EvolutionEntry['userDecision'], finalChanges?: EvolutionEntry['finalChanges'], reflectionNote?: string): Promise<EvolutionEntry | undefined> {
    const entries = getAll()
    const entry = entries[id]
    if (!entry) return undefined
    
    const updated: EvolutionEntry = {
      ...entry,
      userDecision: decision,
      finalChanges: finalChanges ?? entry.finalChanges,
      reflectionNote: reflectionNote ?? entry.reflectionNote,
      decidedAt: new Date().toISOString()
    }
    entries[id] = updated
    setAll(entries)
    return updated
  },

  async delete(id: string): Promise<void> {
    const entries = getAll()
    delete entries[id]
    setAll(entries)
  },

  async getAll(userId: string): Promise<EvolutionEntry[]> {
    return this.getByUser(userId)
  }
}
