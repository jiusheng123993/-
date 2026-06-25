import { describe, expect, it } from 'vitest'
import {
  createContextualIdentity,
  createIdentityFacet,
  addFacet,
  addTraitToFacet,
  addPreferenceToFacet,
  addBoundaryToFacet,
  addGoalToFacet,
  addEvidenceToFacet,
  setDefaultFacet,
  getFacetsForScenario,
  getActiveFacet,
  classifyAtomToFacet,
  detectIdentityConflicts,
  recordIdentitySwitch,
  summarizeContextualIdentity
} from '../identity/contextualIdentity'
import type { MemoryAtom } from '../core/memoryBodyTypes'

function createTestAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: 'test-atom-1',
    scope: 'user',
    layer: 'preference',
    type: 'preference',
    subject: 'user',
    predicate: 'likes',
    object: 'coffee',
    content: '用户喜欢咖啡',
    source: { type: 'chat', timestamp: new Date().toISOString() },
    confidence: 0.8,
    strength: 0.7,
    emotionalWeight: 0.3,
    sensitivity: 'low',
    lifecycle: 'active',
    evidence: [],
    tags: ['food', 'preference'],
    scenarios: ['general'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    accessCount: 5,
    contradictionOf: [],
    ...overrides
  }
}

describe('ContextualIdentity', () => {
  describe('createContextualIdentity', () => {
    it('should create an empty contextual identity for a user', () => {
      const identity = createContextualIdentity('user-1')

      expect(identity.userId).toBe('user-1')
      expect(identity.facets).toEqual([])
      expect(identity.defaultFacetId).toBeNull()
      expect(identity.createdAt).toBeDefined()
      expect(identity.updatedAt).toBeDefined()
    })
  })

  describe('createIdentityFacet', () => {
    it('should create a facet with the given context type', () => {
      const facet = createIdentityFacet('professional', 'Work', 'Professional work identity')

      expect(facet.id).toMatch(/^facet-/)
      expect(facet.contextType).toBe('professional')
      expect(facet.label).toBe('Work')
      expect(facet.description).toBe('Professional work identity')
      expect(facet.traits).toEqual([])
      expect(facet.preferences).toEqual([])
      expect(facet.boundaries).toEqual([])
      expect(facet.goals).toEqual([])
      expect(facet.confidence).toBe(0.5)
      expect(facet.evidenceAtomIds).toEqual([])
      expect(facet.activeScenarios).toEqual([])
    })

    it('should generate unique IDs for each facet', () => {
      const f1 = createIdentityFacet('personal', 'A', 'desc')
      const f2 = createIdentityFacet('personal', 'B', 'desc')

      expect(f1.id).not.toBe(f2.id)
    })
  })

  describe('addFacet', () => {
    it('should add a facet to the identity', () => {
      const identity = createContextualIdentity('user-1')
      const facet = createIdentityFacet('professional', 'Work', 'desc')

      const updated = addFacet(identity, facet)

      expect(updated.facets).toHaveLength(1)
      expect(updated.facets[0].id).toBe(facet.id)
    })

    it('should set first facet as default', () => {
      const identity = createContextualIdentity('user-1')
      const facet = createIdentityFacet('professional', 'Work', 'desc')

      const updated = addFacet(identity, facet)

      expect(updated.defaultFacetId).toBe(facet.id)
    })

    it('should not add duplicate facets', () => {
      const identity = createContextualIdentity('user-1')
      const facet = createIdentityFacet('professional', 'Work', 'desc')

      const first = addFacet(identity, facet)
      const second = addFacet(first, facet)

      expect(second.facets).toHaveLength(1)
    })

    it('should keep existing default when adding more facets', () => {
      const identity = createContextualIdentity('user-1')
      const f1 = createIdentityFacet('professional', 'Work', 'desc')
      const f2 = createIdentityFacet('personal', 'Home', 'desc')

      const withF1 = addFacet(identity, f1)
      const withF2 = addFacet(withF1, f2)

      expect(withF2.defaultFacetId).toBe(f1.id)
      expect(withF2.facets).toHaveLength(2)
    })
  })

  describe('addTraitToFacet', () => {
    it('should add a trait to a specific facet', () => {
      const identity = createContextualIdentity('user-1')
      const facet = createIdentityFacet('professional', 'Work', 'desc')
      const withFacet = addFacet(identity, facet)

      const updated = addTraitToFacet(withFacet, facet.id, 'structured')

      expect(updated.facets[0].traits).toContain('structured')
    })

    it('should not add duplicate traits', () => {
      const identity = createContextualIdentity('user-1')
      const facet = createIdentityFacet('professional', 'Work', 'desc')
      const withFacet = addFacet(identity, facet)
      const withTrait = addTraitToFacet(withFacet, facet.id, 'structured')

      const again = addTraitToFacet(withTrait, facet.id, 'structured')

      expect(again.facets[0].traits).toEqual(['structured'])
    })

    it('should not modify other facets', () => {
      const identity = createContextualIdentity('user-1')
      const f1 = createIdentityFacet('professional', 'Work', 'desc')
      const f2 = createIdentityFacet('personal', 'Home', 'desc')
      let ctx = addFacet(identity, f1)
      ctx = addFacet(ctx, f2)

      const updated = addTraitToFacet(ctx, f1.id, 'structured')

      expect(updated.facets.find(f => f.id === f2.id)!.traits).toEqual([])
    })
  })

  describe('addPreferenceToFacet', () => {
    it('should add a preference to a specific facet', () => {
      const identity = createContextualIdentity('user-1')
      const facet = createIdentityFacet('professional', 'Work', 'desc')
      const withFacet = addFacet(identity, facet)

      const updated = addPreferenceToFacet(withFacet, facet.id, 'minimal_ui')

      expect(updated.facets[0].preferences).toContain('minimal_ui')
    })

    it('should not add duplicate preferences', () => {
      const identity = createContextualIdentity('user-1')
      const facet = createIdentityFacet('professional', 'Work', 'desc')
      const withFacet = addFacet(identity, facet)
      const withPref = addPreferenceToFacet(withFacet, facet.id, 'minimal_ui')

      const again = addPreferenceToFacet(withPref, facet.id, 'minimal_ui')

      expect(again.facets[0].preferences).toEqual(['minimal_ui'])
    })
  })

  describe('addBoundaryToFacet', () => {
    it('should add a boundary to a specific facet', () => {
      const identity = createContextualIdentity('user-1')
      const facet = createIdentityFacet('professional', 'Work', 'desc')
      const withFacet = addFacet(identity, facet)

      const updated = addBoundaryToFacet(withFacet, facet.id, 'no_personal_questions')

      expect(updated.facets[0].boundaries).toContain('no_personal_questions')
    })
  })

  describe('addGoalToFacet', () => {
    it('should add a goal to a specific facet', () => {
      const identity = createContextualIdentity('user-1')
      const facet = createIdentityFacet('professional', 'Work', 'desc')
      const withFacet = addFacet(identity, facet)

      const updated = addGoalToFacet(withFacet, facet.id, 'learn_typescript')

      expect(updated.facets[0].goals).toContain('learn_typescript')
    })
  })

  describe('addEvidenceToFacet', () => {
    it('should add evidence and increase confidence', () => {
      const identity = createContextualIdentity('user-1')
      const facet = createIdentityFacet('professional', 'Work', 'desc')
      const withFacet = addFacet(identity, facet)

      const updated = addEvidenceToFacet(withFacet, facet.id, 'atom-1')

      expect(updated.facets[0].evidenceAtomIds).toContain('atom-1')
      expect(updated.facets[0].confidence).toBe(0.55)
    })

    it('should cap confidence at 1.0', () => {
      const identity = createContextualIdentity('user-1')
      const facet = createIdentityFacet('professional', 'Work', 'desc')
      let ctx = addFacet(identity, facet)

      for (let i = 0; i < 20; i++) {
        ctx = addEvidenceToFacet(ctx, facet.id, `atom-${i}`)
      }

      expect(ctx.facets[0].confidence).toBeLessThanOrEqual(1.0)
    })
  })

  describe('setDefaultFacet', () => {
    it('should set the default facet', () => {
      const identity = createContextualIdentity('user-1')
      const f1 = createIdentityFacet('professional', 'Work', 'desc')
      const f2 = createIdentityFacet('personal', 'Home', 'desc')
      let ctx = addFacet(identity, f1)
      ctx = addFacet(ctx, f2)

      const updated = setDefaultFacet(ctx, f2.id)

      expect(updated.defaultFacetId).toBe(f2.id)
    })

    it('should not change default for non-existent facet', () => {
      const identity = createContextualIdentity('user-1')
      const f1 = createIdentityFacet('professional', 'Work', 'desc')
      const ctx = addFacet(identity, f1)

      const updated = setDefaultFacet(ctx, 'non-existent')

      expect(updated.defaultFacetId).toBe(f1.id)
    })
  })

  describe('getFacetsForScenario', () => {
    it('should return facets matching the scenario context', () => {
      const identity = createContextualIdentity('user-1')
      const professional = createIdentityFacet('professional', 'Work', 'desc')
      const personal = createIdentityFacet('personal', 'Home', 'desc')
      let ctx = addFacet(identity, professional)
      ctx = addFacet(ctx, personal)

      const facets = getFacetsForScenario(ctx, 'focus')

      expect(facets).toHaveLength(1)
      expect(facets[0].contextType).toBe('professional')
    })

    it('should return personal facets for general scenario', () => {
      const identity = createContextualIdentity('user-1')
      const personal = createIdentityFacet('personal', 'Home', 'desc')
      const ctx = addFacet(identity, personal)

      const facets = getFacetsForScenario(ctx, 'general')

      expect(facets).toHaveLength(1)
      expect(facets[0].contextType).toBe('personal')
    })

    it('should return multiple facets when scenario maps to multiple contexts', () => {
      const identity = createContextualIdentity('user-1')
      const professional = createIdentityFacet('professional', 'Work', 'desc')
      const engineering = createIdentityFacet('engineering', 'Code', 'desc')
      let ctx = addFacet(identity, professional)
      ctx = addFacet(ctx, engineering)

      const facets = getFacetsForScenario(ctx, 'focus')

      expect(facets).toHaveLength(2)
    })
  })

  describe('getActiveFacet', () => {
    it('should return the highest confidence facet for a scenario', () => {
      const identity = createContextualIdentity('user-1')
      const f1 = createIdentityFacet('professional', 'Work', 'desc')
      const f2 = createIdentityFacet('engineering', 'Code', 'desc')
      let ctx = addFacet(identity, f1)
      ctx = addFacet(ctx, f2)
      ctx = addEvidenceToFacet(ctx, f2.id, 'atom-1')

      const active = getActiveFacet(ctx, 'focus')

      expect(active).not.toBeNull()
      expect(active!.id).toBe(f2.id)
    })

    it('should return null when no facets exist', () => {
      const identity = createContextualIdentity('user-1')

      const active = getActiveFacet(identity, 'chat')

      expect(active).toBeNull()
    })

    it('should fall back to default facet when no scenario match', () => {
      const identity = createContextualIdentity('user-1')
      const creative = createIdentityFacet('creative', 'Art', 'desc')
      const ctx = addFacet(identity, creative)

      const active = getActiveFacet(ctx, 'chat')

      expect(active).not.toBeNull()
      expect(active!.id).toBe(creative.id)
    })
  })

  describe('classifyAtomToFacet', () => {
    it('should classify an atom to the best matching facet', () => {
      const identity = createContextualIdentity('user-1')
      const professional = createIdentityFacet('professional', 'Work', 'desc')
      const personal = createIdentityFacet('personal', 'Home', 'desc')
      let ctx = addFacet(identity, professional)
      ctx = addFacet(ctx, personal)

      const atom = createTestAtom({ scenarios: ['focus'] })
      const facet = classifyAtomToFacet(ctx, atom)

      expect(facet).not.toBeNull()
      expect(facet!.contextType).toBe('professional')
    })

    it('should fall back to default when no scenario match', () => {
      const identity = createContextualIdentity('user-1')
      const creative = createIdentityFacet('creative', 'Art', 'desc')
      const ctx = addFacet(identity, creative)

      const atom = createTestAtom({ scenarios: ['chat'] })
      const facet = classifyAtomToFacet(ctx, atom)

      expect(facet).not.toBeNull()
      expect(facet!.id).toBe(creative.id)
    })

    it('should return null when no facets exist', () => {
      const identity = createContextualIdentity('user-1')
      const atom = createTestAtom()

      const facet = classifyAtomToFacet(identity, atom)

      expect(facet).toBeNull()
    })
  })

  describe('detectIdentityConflicts', () => {
    it('should detect opposing traits between facets', () => {
      const identity = createContextualIdentity('user-1')
      const f1 = createIdentityFacet('professional', 'Work', 'desc')
      const f2 = createIdentityFacet('personal', 'Home', 'desc')
      let ctx = addFacet(identity, f1)
      ctx = addFacet(ctx, f2)
      ctx = addTraitToFacet(ctx, f1.id, 'structured')
      ctx = addTraitToFacet(ctx, f2.id, 'flexible')

      const conflicts = detectIdentityConflicts(ctx)

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].facetAId).toBe(f1.id)
      expect(conflicts[0].facetBId).toBe(f2.id)
      expect(conflicts[0].conflictingTrait).toContain('structured')
      expect(conflicts[0].conflictingTrait).toContain('flexible')
    })

    it('should detect opposing preferences between facets', () => {
      const identity = createContextualIdentity('user-1')
      const f1 = createIdentityFacet('professional', 'Work', 'desc')
      const f2 = createIdentityFacet('personal', 'Home', 'desc')
      let ctx = addFacet(identity, f1)
      ctx = addFacet(ctx, f2)
      ctx = addPreferenceToFacet(ctx, f1.id, 'minimal_ui')
      ctx = addPreferenceToFacet(ctx, f2.id, 'rich_ui')

      const conflicts = detectIdentityConflicts(ctx)

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].conflictingTrait).toContain('minimal_ui')
      expect(conflicts[0].conflictingTrait).toContain('rich_ui')
    })

    it('should return empty array when no conflicts exist', () => {
      const identity = createContextualIdentity('user-1')
      const f1 = createIdentityFacet('professional', 'Work', 'desc')
      const ctx = addFacet(identity, f1)

      const conflicts = detectIdentityConflicts(ctx)

      expect(conflicts).toEqual([])
    })

    it('should return empty array with single facet', () => {
      const identity = createContextualIdentity('user-1')
      const f1 = createIdentityFacet('professional', 'Work', 'desc')
      let ctx = addFacet(identity, f1)
      ctx = addTraitToFacet(ctx, f1.id, 'structured')
      ctx = addTraitToFacet(ctx, f1.id, 'flexible')

      const conflicts = detectIdentityConflicts(ctx)

      expect(conflicts).toEqual([])
    })
  })

  describe('recordIdentitySwitch', () => {
    it('should record a switch event', () => {
      const event = recordIdentitySwitch('facet-1', 'facet-2', 'focus')

      expect(event.fromFacetId).toBe('facet-1')
      expect(event.toFacetId).toBe('facet-2')
      expect(event.triggeredBy).toBe('focus')
      expect(event.timestamp).toBeDefined()
    })

    it('should allow null fromFacetId for initial switch', () => {
      const event = recordIdentitySwitch(null, 'facet-1', 'chat')

      expect(event.fromFacetId).toBeNull()
      expect(event.toFacetId).toBe('facet-1')
    })
  })

  describe('summarizeContextualIdentity', () => {
    it('should summarize an identity with facets', () => {
      const identity = createContextualIdentity('user-1')
      const f1 = createIdentityFacet('professional', 'Work', 'desc')
      const f2 = createIdentityFacet('personal', 'Home', 'desc')
      let ctx = addFacet(identity, f1)
      ctx = addFacet(ctx, f2)
      ctx = addTraitToFacet(ctx, f1.id, 'structured')
      ctx = addPreferenceToFacet(ctx, f1.id, 'minimal_ui')
      ctx = addBoundaryToFacet(ctx, f1.id, 'no_personal')
      ctx = addGoalToFacet(ctx, f1.id, 'learn_ts')

      const summary = summarizeContextualIdentity(ctx)

      expect(summary.totalFacets).toBe(2)
      expect(summary.contextTypes).toHaveLength(2)
      expect(summary.defaultFacetLabel).toBe('Work')
      expect(summary.totalTraits).toBe(1)
      expect(summary.totalPreferences).toBe(1)
      expect(summary.totalBoundaries).toBe(1)
      expect(summary.totalGoals).toBe(1)
      expect(summary.conflictCount).toBe(0)
      expect(summary.averageConfidence).toBe(0.5)
    })

    it('should handle empty identity', () => {
      const identity = createContextualIdentity('user-1')

      const summary = summarizeContextualIdentity(identity)

      expect(summary.totalFacets).toBe(0)
      expect(summary.averageConfidence).toBe(0)
      expect(summary.defaultFacetLabel).toBeNull()
    })
  })
})
