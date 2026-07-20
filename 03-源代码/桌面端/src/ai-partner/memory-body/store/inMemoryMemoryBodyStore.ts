import { createMemoryBodyState, isActiveMemoryAtom, sameMemoryScope } from '../core/memoryBodyGuards'
import type { MemoryAtom, MemoryBodyState, MemoryEntity, MemoryRelation, UserBelief } from '../core/memoryBodyTypes'
import type { MemoryAuditEvent, MemoryBodyStore } from './memoryBodyStore'

function cloneState(state: MemoryBodyState): MemoryBodyState {
  return structuredClone(state)
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  return [...items.filter(existing => existing.id !== item.id), item]
}

export function createInMemoryMemoryBodyStore(userId: string, projectId: string, initialState?: MemoryBodyState): MemoryBodyStore {
  let state = cloneState(initialState ?? createMemoryBodyState(userId, projectId))
  let auditEvents: MemoryAuditEvent[] = []

  const updateMeta = (updatedAt: string) => {
    state = { ...state, meta: { ...state.meta, updatedAt } }
  }

  return {
    load: () => cloneState(state),
    save: (nextState) => {
      state = cloneState(nextState)
    },
    upsertAtom: (atom: MemoryAtom) => {
      state = { ...state, atoms: upsertById(state.atoms, atom) }
      updateMeta(atom.updatedAt)
    },
    upsertEntity: (entity: MemoryEntity) => {
      state = { ...state, entities: upsertById(state.entities, entity) }
      updateMeta(entity.updatedAt)
    },
    upsertRelation: (relation: MemoryRelation) => {
      state = { ...state, relations: upsertById(state.relations, relation) }
      updateMeta(relation.updatedAt)
    },
    upsertBelief: (belief: UserBelief) => {
      state = { ...state, beliefs: upsertById(state.beliefs, belief) }
      updateMeta(belief.updatedAt)
    },
    listActiveAtoms: (scope) => state.atoms.filter(atom => sameMemoryScope(atom.scope, scope) && isActiveMemoryAtom(atom)),
    archiveAtom: (atomId, updatedAt) => {
      let changed = false
      state = {
        ...state,
        atoms: state.atoms.map(atom => {
          if (atom.id !== atomId) return atom
          changed = true
          return { ...atom, lifecycle: 'archived', updatedAt }
        })
      }
      if (changed) updateMeta(updatedAt)
      return changed
    },
    forgetAtom: (atomId, updatedAt) => {
      let changed = false
      state = {
        ...state,
        atoms: state.atoms.map(atom => {
          if (atom.id !== atomId) return atom
          changed = true
          return { ...atom, lifecycle: 'forbidden', sensitivity: 'forbidden', updatedAt }
        })
      }
      if (changed) updateMeta(updatedAt)
      return changed
    },
    appendAuditEvent: (event) => {
      auditEvents = [...auditEvents, event]
    },
    getAuditEvents: (filter) => {
      let result = auditEvents
      if (filter?.atomId) {
        result = result.filter(e => e.atomId === filter.atomId)
      }
      if (filter?.type) {
        result = result.filter(e => e.type === filter.type)
      }
      return result
    }
  }
}
