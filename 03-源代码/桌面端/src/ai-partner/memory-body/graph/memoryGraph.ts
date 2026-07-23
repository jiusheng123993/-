import type {
  EntityType,
  MemoryAtom,
  MemoryEntity,
  MemoryRelation,
  RelationType
} from '../core/memoryBodyTypes'

export interface MemoryGraphBuildResult {
  entities: MemoryEntity[]
  relations: MemoryRelation[]
}

function scopeKey(atom: MemoryAtom): string {
  return `${atom.scope.userId}-${atom.scope.projectId}`
}

function userEntityId(atom: MemoryAtom): string {
  return `entity-user-${scopeKey(atom)}`
}

function entityTypeForAtom(atom: MemoryAtom): EntityType {
  if (atom.type === 'goal') return 'goal'
  if (atom.type === 'boundary' || atom.type === 'preference') return 'food'
  return 'unknown'
}

function objectEntityId(atom: MemoryAtom): string {
  return `entity-${scopeKey(atom)}-${entityTypeForAtom(atom)}-${encodeURIComponent(atom.object)}`
}

function relationTypeForAtom(atom: MemoryAtom): RelationType {
  if (atom.predicate === 'likes') return 'likes'
  if (atom.predicate === 'dislikes') return 'dislikes'
  return 'associated_with'
}

function createUserEntity(atom: MemoryAtom, timestamp: string): MemoryEntity {
  return {
    id: userEntityId(atom),
    scope: atom.scope,
    name: 'user',
    normalizedName: 'user',
    type: 'user',
    aliases: [],
    attributes: {},
    sensitivity: atom.sensitivity,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

function createObjectEntity(atom: MemoryAtom, timestamp: string): MemoryEntity {
  return {
    id: objectEntityId(atom),
    scope: atom.scope,
    name: atom.object,
    normalizedName: atom.object.toLowerCase(),
    type: entityTypeForAtom(atom),
    aliases: [],
    attributes: {},
    sensitivity: atom.sensitivity,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

function createRelation(atom: MemoryAtom, timestamp: string): MemoryRelation {
  const relationType = relationTypeForAtom(atom)
  return {
    id: `relation-${userEntityId(atom)}-${relationType}-${objectEntityId(atom)}`,
    scope: atom.scope,
    fromEntityId: userEntityId(atom),
    toEntityId: objectEntityId(atom),
    relationType,
    confidence: atom.confidence,
    strength: atom.strength,
    evidenceAtomIds: [atom.id],
    lifecycle: 'active',
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  return [...items.filter(existing => existing.id !== item.id), item]
}

export function buildMemoryGraphFromAtoms(atoms: MemoryAtom[], timestamp: string): MemoryGraphBuildResult {
  return atoms.reduce<MemoryGraphBuildResult>((graph, atom) => {
    const entities = upsertById(upsertById(graph.entities, createUserEntity(atom, timestamp)), createObjectEntity(atom, timestamp))
    const relations = upsertById(graph.relations, createRelation(atom, timestamp))
    return { entities, relations }
  }, { entities: [], relations: [] })
}
