import { openDB, type IDBPDatabase } from 'idb'
import type { EvolutionEntry } from './evolutionRitualTypes'

const DB_NAME = 'xinghuanhai-evolution'
const STORE_NAME = 'evolution-entries'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('userId', 'userId')
          store.createIndex('triggeredBy', 'triggeredBy')
          store.createIndex('userDecision', 'userDecision')
          store.createIndex('createdAt', 'createdAt')
        }
      }
    })
  }
  return dbPromise
}

export const evolutionStorage = {
  async save(entry: EvolutionEntry): Promise<void> {
    const db = await getDB()
    await db.put(STORE_NAME, entry)
  },

  async getById(id: string): Promise<EvolutionEntry | undefined> {
    const db = await getDB()
    return db.get(STORE_NAME, id)
  },

  async getByUser(userId: string): Promise<EvolutionEntry[]> {
    const db = await getDB()
    return db.getAllFromIndex(STORE_NAME, 'userId', userId)
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
    const db = await getDB()
    const entry = await db.get(STORE_NAME, id)
    if (!entry) return undefined
    
    const updated: EvolutionEntry = {
      ...entry,
      userDecision: decision,
      finalChanges: finalChanges ?? entry.finalChanges,
      reflectionNote: reflectionNote ?? entry.reflectionNote,
      decidedAt: new Date().toISOString()
    }
    await db.put(STORE_NAME, updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete(STORE_NAME, id)
  },

  async getAll(userId: string): Promise<EvolutionEntry[]> {
    const db = await getDB()
    return db.getAllFromIndex(STORE_NAME, 'userId', userId)
  }
}
