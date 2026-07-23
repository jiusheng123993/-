import type { MemoryAtom, MemoryBodyState, MemoryEntity, MemoryRelation, MemoryScope, UserBelief } from '../core/memoryBodyTypes'

export interface MemoryAuditEvent {
  atomId: string
  type: string
  timestamp: string
  detail?: string
}

export interface MemoryBodyStore {
  load: () => MemoryBodyState
  save: (state: MemoryBodyState) => void
  upsertAtom: (atom: MemoryAtom) => void
  upsertEntity: (entity: MemoryEntity) => void
  upsertRelation: (relation: MemoryRelation) => void
  upsertBelief: (belief: UserBelief) => void
  listActiveAtoms: (scope: MemoryScope) => MemoryAtom[]
  archiveAtom: (atomId: string, updatedAt: string) => boolean
  forgetAtom: (atomId: string, updatedAt: string) => boolean
  appendAuditEvent: (event: MemoryAuditEvent) => void
  getAuditEvents: (filter?: { atomId?: string; type?: string }) => MemoryAuditEvent[]
}

export interface LocalStorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}
