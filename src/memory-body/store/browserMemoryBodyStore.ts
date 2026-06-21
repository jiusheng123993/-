import { MEMORY_BODY_STORAGE_KEY } from '../core/memoryBodyConfig'
import { createMemoryBodyState } from '../core/memoryBodyGuards'
import type { MemoryBodyState } from '../core/memoryBodyTypes'
import { createInMemoryMemoryBodyStore } from './inMemoryMemoryBodyStore'
import type { LocalStorageLike, MemoryBodyStore } from './memoryBodyStore'

function isMemoryBodyState(value: unknown): value is MemoryBodyState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<MemoryBodyState>
  return candidate.version === 1 && Array.isArray(candidate.atoms) && Array.isArray(candidate.entities) && Array.isArray(candidate.relations) && Array.isArray(candidate.beliefs)
}

export function createBrowserMemoryBodyStore(userId: string, projectId: string, storage: LocalStorageLike = window.localStorage, storageKey = MEMORY_BODY_STORAGE_KEY): MemoryBodyStore {
  const loadState = () => {
    const raw = storage.getItem(storageKey)
    if (!raw) return createMemoryBodyState(userId, projectId)
    try {
      const parsed = JSON.parse(raw) as unknown
      return isMemoryBodyState(parsed) ? parsed : createMemoryBodyState(userId, projectId)
    } catch {
      return createMemoryBodyState(userId, projectId)
    }
  }

  const memoryStore = createInMemoryMemoryBodyStore(userId, projectId, loadState())
  const persist = () => storage.setItem(storageKey, JSON.stringify(memoryStore.load()))

  return {
    load: memoryStore.load,
    save: (state) => {
      memoryStore.save(state)
      persist()
    },
    upsertAtom: (atom) => {
      memoryStore.upsertAtom(atom)
      persist()
    },
    upsertEntity: (entity) => {
      memoryStore.upsertEntity(entity)
      persist()
    },
    upsertRelation: (relation) => {
      memoryStore.upsertRelation(relation)
      persist()
    },
    upsertBelief: (belief) => {
      memoryStore.upsertBelief(belief)
      persist()
    },
    listActiveAtoms: memoryStore.listActiveAtoms,
    archiveAtom: (atomId, updatedAt) => {
      const changed = memoryStore.archiveAtom(atomId, updatedAt)
      persist()
      return changed
    },
    forgetAtom: (atomId, updatedAt) => {
      const changed = memoryStore.forgetAtom(atomId, updatedAt)
      persist()
      return changed
    }
  }
}
