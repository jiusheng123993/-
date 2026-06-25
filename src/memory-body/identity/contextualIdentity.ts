import type { MemoryAtom, MemoryScenario } from '../core/memoryBodyTypes'

export type IdentityContextType =
  | 'professional'
  | 'personal'
  | 'learning'
  | 'creative'
  | 'social'
  | 'health'
  | 'engineering'
  | 'leadership'

export interface IdentityFacet {
  id: string
  contextType: IdentityContextType
  label: string
  description: string
  traits: string[]
  preferences: string[]
  boundaries: string[]
  goals: string[]
  confidence: number
  evidenceAtomIds: string[]
  activeScenarios: MemoryScenario[]
  createdAt: string
  updatedAt: string
}

export interface ContextualIdentity {
  userId: string
  facets: IdentityFacet[]
  defaultFacetId: string | null
  createdAt: string
  updatedAt: string
}

export interface IdentitySwitchEvent {
  fromFacetId: string | null
  toFacetId: string
  triggeredBy: MemoryScenario
  timestamp: string
}

export interface IdentityConflict {
  facetAId: string
  facetBId: string
  conflictingTrait: string
  resolution: 'keep_both' | 'prefer_a' | 'prefer_b' | 'context_dependent'
  resolvedAt?: string
}

const SCENARIO_TO_CONTEXT: Record<MemoryScenario, IdentityContextType[]> = {
  general: ['personal'],
  chat: ['personal', 'social'],
  study: ['learning'],
  focus: ['professional', 'engineering'],
  goal_planning: ['professional', 'leadership'],
  emotional_support: ['personal', 'health'],
  food_recommendation: ['personal'],
  reflection: ['personal', 'creative'],
  knowledge_graph: ['learning', 'engineering']
}

function generateFacetId(): string {
  return `facet-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createContextualIdentity(userId: string): ContextualIdentity {
  return {
    userId,
    facets: [],
    defaultFacetId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export function createIdentityFacet(
  contextType: IdentityContextType,
  label: string,
  description: string
): IdentityFacet {
  return {
    id: generateFacetId(),
    contextType,
    label,
    description,
    traits: [],
    preferences: [],
    boundaries: [],
    goals: [],
    confidence: 0.5,
    evidenceAtomIds: [],
    activeScenarios: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export function addFacet(
  identity: ContextualIdentity,
  facet: IdentityFacet
): ContextualIdentity {
  const exists = identity.facets.some(f => f.id === facet.id)
  if (exists) return identity

  const updated: ContextualIdentity = {
    ...identity,
    facets: [...identity.facets, facet],
    updatedAt: new Date().toISOString()
  }

  if (identity.defaultFacetId === null) {
    updated.defaultFacetId = facet.id
  }

  return updated
}

export function addTraitToFacet(
  identity: ContextualIdentity,
  facetId: string,
  trait: string
): ContextualIdentity {
  return {
    ...identity,
    facets: identity.facets.map(f =>
      f.id === facetId && !f.traits.includes(trait)
        ? { ...f, traits: [...f.traits, trait], updatedAt: new Date().toISOString() }
        : f
    ),
    updatedAt: new Date().toISOString()
  }
}

export function addPreferenceToFacet(
  identity: ContextualIdentity,
  facetId: string,
  preference: string
): ContextualIdentity {
  return {
    ...identity,
    facets: identity.facets.map(f =>
      f.id === facetId && !f.preferences.includes(preference)
        ? { ...f, preferences: [...f.preferences, preference], updatedAt: new Date().toISOString() }
        : f
    ),
    updatedAt: new Date().toISOString()
  }
}

export function addBoundaryToFacet(
  identity: ContextualIdentity,
  facetId: string,
  boundary: string
): ContextualIdentity {
  return {
    ...identity,
    facets: identity.facets.map(f =>
      f.id === facetId && !f.boundaries.includes(boundary)
        ? { ...f, boundaries: [...f.boundaries, boundary], updatedAt: new Date().toISOString() }
        : f
    ),
    updatedAt: new Date().toISOString()
  }
}

export function addGoalToFacet(
  identity: ContextualIdentity,
  facetId: string,
  goal: string
): ContextualIdentity {
  return {
    ...identity,
    facets: identity.facets.map(f =>
      f.id === facetId && !f.goals.includes(goal)
        ? { ...f, goals: [...f.goals, goal], updatedAt: new Date().toISOString() }
        : f
    ),
    updatedAt: new Date().toISOString()
  }
}

export function addEvidenceToFacet(
  identity: ContextualIdentity,
  facetId: string,
  atomId: string
): ContextualIdentity {
  return {
    ...identity,
    facets: identity.facets.map(f =>
      f.id === facetId && !f.evidenceAtomIds.includes(atomId)
        ? {
            ...f,
            evidenceAtomIds: [...f.evidenceAtomIds, atomId],
            confidence: Math.min(f.confidence + 0.05, 1.0),
            updatedAt: new Date().toISOString()
          }
        : f
    ),
    updatedAt: new Date().toISOString()
  }
}

export function setDefaultFacet(
  identity: ContextualIdentity,
  facetId: string
): ContextualIdentity {
  if (!identity.facets.some(f => f.id === facetId)) return identity
  return {
    ...identity,
    defaultFacetId: facetId,
    updatedAt: new Date().toISOString()
  }
}

export function getFacetsForScenario(
  identity: ContextualIdentity,
  scenario: MemoryScenario
): IdentityFacet[] {
  const relevantTypes = SCENARIO_TO_CONTEXT[scenario] || ['personal']
  return identity.facets.filter(f => relevantTypes.includes(f.contextType))
}

export function getActiveFacet(
  identity: ContextualIdentity,
  scenario: MemoryScenario
): IdentityFacet | null {
  const candidates = getFacetsForScenario(identity, scenario)
  if (candidates.length === 0) {
    const defaultFacet = identity.facets.find(f => f.id === identity.defaultFacetId)
    return defaultFacet || null
  }

  const scenarioActive = candidates.find(f => f.activeScenarios.includes(scenario))
  if (scenarioActive) return scenarioActive

  return candidates.sort((a, b) => b.confidence - a.confidence)[0] || null
}

export function classifyAtomToFacet(
  identity: ContextualIdentity,
  atom: MemoryAtom
): IdentityFacet | null {
  const scenarios = atom.scenarios || ['general']
  const allCandidates: { facet: IdentityFacet; score: number }[] = []

  for (const scenario of scenarios) {
    const facets = getFacetsForScenario(identity, scenario)
    for (const facet of facets) {
      const existing = allCandidates.find(c => c.facet.id === facet.id)
      if (existing) {
        existing.score += 1
      } else {
        allCandidates.push({ facet, score: 1 })
      }
    }
  }

  if (allCandidates.length === 0) {
    const defaultFacet = identity.facets.find(f => f.id === identity.defaultFacetId)
    return defaultFacet || null
  }

  allCandidates.sort((a, b) => b.score - a.score)
  return allCandidates[0].facet
}

export function detectIdentityConflicts(
  identity: ContextualIdentity
): IdentityConflict[] {
  const conflicts: IdentityConflict[] = []
  const facets = identity.facets

  for (let i = 0; i < facets.length; i++) {
    for (let j = i + 1; j < facets.length; j++) {
      const a = facets[i]
      const b = facets[j]

      for (const traitA of a.traits) {
        const opposite = getOppositeTrait(traitA)
        if (opposite && b.traits.includes(opposite)) {
          conflicts.push({
            facetAId: a.id,
            facetBId: b.id,
            conflictingTrait: `${traitA} vs ${opposite}`,
            resolution: 'context_dependent'
          })
        }
      }

      for (const prefA of a.preferences) {
        const opposite = getOppositePreference(prefA)
        if (opposite && b.preferences.includes(opposite)) {
          conflicts.push({
            facetAId: a.id,
            facetBId: b.id,
            conflictingTrait: `preference: ${prefA} vs ${opposite}`,
            resolution: 'context_dependent'
          })
        }
      }
    }
  }

  return conflicts
}

function getOppositeTrait(trait: string): string | null {
  const opposites: Record<string, string> = {
    'structured': 'flexible',
    'flexible': 'structured',
    'detail_oriented': 'big_picture',
    'big_picture': 'detail_oriented',
    'independent': 'collaborative',
    'collaborative': 'independent',
    'fast_paced': 'deliberate',
    'deliberate': 'fast_paced',
    'risk_taking': 'risk_averse',
    'risk_averse': 'risk_taking',
    'verbal': 'written',
    'written': 'verbal'
  }
  return opposites[trait] || null
}

function getOppositePreference(pref: string): string | null {
  const opposites: Record<string, string> = {
    'minimal_ui': 'rich_ui',
    'rich_ui': 'minimal_ui',
    'brief_answers': 'detailed_answers',
    'detailed_answers': 'brief_answers',
    'code_first': 'design_first',
    'design_first': 'code_first',
    'async_communication': 'sync_communication',
    'sync_communication': 'async_communication'
  }
  return opposites[pref] || null
}

export function recordIdentitySwitch(
  fromFacetId: string | null,
  toFacetId: string,
  scenario: MemoryScenario
): IdentitySwitchEvent {
  return {
    fromFacetId,
    toFacetId,
    triggeredBy: scenario,
    timestamp: new Date().toISOString()
  }
}

export function summarizeContextualIdentity(
  identity: ContextualIdentity
): {
  totalFacets: number
  contextTypes: IdentityContextType[]
  defaultFacetLabel: string | null
  totalTraits: number
  totalPreferences: number
  totalBoundaries: number
  totalGoals: number
  conflictCount: number
  averageConfidence: number
} {
  const conflicts = detectIdentityConflicts(identity)
  const totalConfidence = identity.facets.reduce((sum, f) => sum + f.confidence, 0)

  return {
    totalFacets: identity.facets.length,
    contextTypes: [...new Set(identity.facets.map(f => f.contextType))],
    defaultFacetLabel: identity.facets.find(f => f.id === identity.defaultFacetId)?.label || null,
    totalTraits: identity.facets.reduce((sum, f) => sum + f.traits.length, 0),
    totalPreferences: identity.facets.reduce((sum, f) => sum + f.preferences.length, 0),
    totalBoundaries: identity.facets.reduce((sum, f) => sum + f.boundaries.length, 0),
    totalGoals: identity.facets.reduce((sum, f) => sum + f.goals.length, 0),
    conflictCount: conflicts.length,
    averageConfidence: identity.facets.length > 0
      ? Math.round((totalConfidence / identity.facets.length) * 100) / 100
      : 0
  }
}
