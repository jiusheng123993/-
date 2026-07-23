export type MemoryLayer = 'episodic' | 'semantic' | 'procedural' | 'emotional' | 'relational'

export type MemoryAtomType =
  | 'preference'
  | 'boundary'
  | 'goal'
  | 'habit'
  | 'emotion'
  | 'identity'
  | 'relationship'
  | 'interaction_style'
  | 'event'
  | 'insight'
  | 'system'

export type MemorySource =
  | 'chat'
  | 'workspace'
  | 'journal'
  | 'goal'
  | 'focus'
  | 'quicknote'
  | 'reading'
  | 'mood'
  | 'manual'
  | 'migration'
  | 'system'

export type MemorySensitivity = 'public' | 'personal' | 'sensitive' | 'private' | 'forbidden'

export type MemoryLifecycle =
  | 'draft'
  | 'active'
  | 'confirmed'
  | 'stable'
  | 'weakening'
  | 'archived'
  | 'contradicted'
  | 'protected'
  | 'forbidden'

export type MemoryScenario =
  | 'general'
  | 'chat'
  | 'study'
  | 'focus'
  | 'goal_planning'
  | 'emotional_support'
  | 'food_recommendation'
  | 'reflection'
  | 'knowledge_graph'

export type RelationType =
  | 'likes'
  | 'dislikes'
  | 'prefers'
  | 'avoids'
  | 'is_a'
  | 'part_of'
  | 'associated_with'
  | 'causes'
  | 'reduces'
  | 'supports'
  | 'conflicts_with'
  | 'requires'
  | 'responds_to'
  | 'belongs_to'

export type EntityType =
  | 'user'
  | 'food'
  | 'person'
  | 'goal'
  | 'habit'
  | 'emotion'
  | 'topic'
  | 'task'
  | 'time'
  | 'place'
  | 'subject'
  | 'persona'
  | 'boundary'
  | 'style'
  | 'unknown'

export interface MemoryScope {
  userId: string
  projectId: string
}

export interface MemoryEvidence {
  id: string
  source: MemorySource
  sourceId?: string
  sourceText: string
  timestamp: string
  confidence: number
}

export interface MemoryAtom {
  id: string
  scope: MemoryScope
  layer: MemoryLayer
  type: MemoryAtomType
  subject: string
  predicate: string
  object: string
  content: string
  source: MemorySource
  confidence: number
  strength: number
  emotionalWeight: number
  sensitivity: MemorySensitivity
  lifecycle: MemoryLifecycle
  evidence: MemoryEvidence[]
  tags: string[]
  scenarios?: MemoryScenario[]
  conditions?: Record<string, string | number | boolean>
  createdAt: string
  updatedAt: string
  lastAccessedAt: string
  accessCount: number
  contradictionOf: string[]
}

export interface MemoryEntity {
  id: string
  scope: MemoryScope
  name: string
  normalizedName: string
  type: EntityType
  aliases: string[]
  attributes: Record<string, string | number | boolean>
  sensitivity: MemorySensitivity
  createdAt: string
  updatedAt: string
}

export interface MemoryRelation {
  id: string
  scope: MemoryScope
  fromEntityId: string
  toEntityId: string
  relationType: RelationType
  confidence: number
  strength: number
  evidenceAtomIds: string[]
  lifecycle: MemoryLifecycle
  createdAt: string
  updatedAt: string
}

export interface UserBelief {
  id: string
  scope: MemoryScope
  field: string
  value: string | string[] | number | boolean | Record<string, unknown>
  confidence: number
  strength: number
  stability: 'emerging' | 'stable' | 'changing' | 'uncertain'
  sensitivity: MemorySensitivity
  scenario?: MemoryScenario
  updatedByAtomIds: string[]
  createdAt: string
  updatedAt: string
}

export interface MemoryBodyMeta {
  createdAt: string
  updatedAt: string
  lastDecayAt?: string
  lastMigrationAt?: string
  totalInteractions: number
  totalCorrections: number
  maturityLevel: number
}

export interface MemoryBodyState {
  version: 1
  scope: MemoryScope
  atoms: MemoryAtom[]
  entities: MemoryEntity[]
  relations: MemoryRelation[]
  beliefs: UserBelief[]
  meta: MemoryBodyMeta
}
