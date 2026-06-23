import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { applyAntiOverfittingPolicy } from '../policy/antiOverfittingPolicy'

const scope = { userId: 'user-1', projectId: 'project-1' }
const timestamp = '2026-06-23T00:00:00.000Z'

function atom(partial: Partial<MemoryAtom>): MemoryAtom {
  return {
    id: partial.id ?? 'atom-1',
    scope: partial.scope ?? scope,
    layer: partial.layer ?? 'semantic',
    type: partial.type ?? 'preference',
    subject: partial.subject ?? 'user',
    predicate: partial.predicate ?? 'likes',
    object: partial.object ?? '西瓜',
    content: partial.content ?? '用户喜欢西瓜',
    source: partial.source ?? 'chat',
    confidence: partial.confidence ?? 0.78,
    strength: partial.strength ?? 0.5,
    emotionalWeight: partial.emotionalWeight ?? 0.1,
    sensitivity: partial.sensitivity ?? 'personal',
    lifecycle: partial.lifecycle ?? 'active',
    evidence: partial.evidence ?? [{
      id: 'evidence-1',
      source: 'chat',
      sourceText: '我喜欢吃西瓜',
      timestamp,
      confidence: 0.78
    }],
    tags: partial.tags ?? [],
    scenarios: partial.scenarios ?? ['chat'],
    conditions: partial.conditions,
    createdAt: partial.createdAt ?? timestamp,
    updatedAt: partial.updatedAt ?? timestamp,
    lastAccessedAt: partial.lastAccessedAt ?? timestamp,
    accessCount: partial.accessCount ?? 0,
    contradictionOf: partial.contradictionOf ?? []
  }
}

describe('antiOverfittingPolicy', () => {
  it('allows normal confirmed memory without adjustments', () => {
    const result = applyAntiOverfittingPolicy(
      atom({ lifecycle: 'confirmed', confidence: 0.85, strength: 0.8, evidence: [
        { id: 'ev-1', source: 'chat', sourceText: 'like', timestamp, confidence: 0.85 },
        { id: 'ev-2', source: 'chat', sourceText: 'still like', timestamp, confidence: 0.8 }
      ] })
    )
    expect(result.allowed).toBe(true)
    expect(result.adjustments).toEqual([])
  })

  it('blocks low-evidence memory from being stable', () => {
    const result = applyAntiOverfittingPolicy(
      atom({
        lifecycle: 'stable',
        confidence: 0.3,
        evidence: [{ id: 'ev-1', source: 'chat', sourceText: 'maybe', timestamp, confidence: 0.3 }]
      })
    )
    expect(result.allowed).toBe(false)
    expect(result.adjustments).toContain('low_evidence_stable_blocked')
  })

  it('adds scenario boundary for single-evidence preference', () => {
    const result = applyAntiOverfittingPolicy(
      atom({
        lifecycle: 'confirmed',
        confidence: 0.8,
        evidence: [{ id: 'ev-1', source: 'chat', sourceText: 'once', timestamp, confidence: 0.8 }],
        scenarios: ['chat', 'goal_planning', 'food_recommendation']
      })
    )
    expect(result.allowed).toBe(true)
    expect(result.adjustments).toContain('single_evidence_scenario_boundary')
    expect(result.suggestedScenarios).toEqual(['chat'])
  })

  it('marks temporary emotion as short-term', () => {
    const result = applyAntiOverfittingPolicy(
      atom({
        type: 'emotion',
        emotionalWeight: 0.9,
        lifecycle: 'active',
        evidence: [{ id: 'ev-1', source: 'chat', sourceText: 'sad today', timestamp, confidence: 0.7 }]
      })
    )
    expect(result.allowed).toBe(true)
    expect(result.adjustments).toContain('temporary_emotion_short_term')
    expect(result.suggestedLifecycle).toBe('draft')
  })

  it('reduces confidence when contradiction exists', () => {
    const result = applyAntiOverfittingPolicy(
      atom({
        lifecycle: 'confirmed',
        confidence: 0.9,
        contradictionOf: ['atom-other']
      })
    )
    expect(result.allowed).toBe(true)
    expect(result.adjustments).toContain('contradiction_confidence_reduced')
    expect(result.adjustedConfidence).toBeLessThan(0.9)
  })

  it('prioritizes user confirmation over model reinforcement', () => {
    const result = applyAntiOverfittingPolicy(
      atom({
        lifecycle: 'confirmed',
        confidence: 0.6,
        strength: 0.4,
        source: 'model'
      })
    )
    expect(result.allowed).toBe(true)
    expect(result.adjustments).toContain('model_source_lower_priority')
    expect(result.adjustedStrength).toBeLessThanOrEqual(0.4)
  })

  it('triggers isolation for corrected memory', () => {
    const result = applyAntiOverfittingPolicy(
      atom({
        lifecycle: 'confirmed',
        contradictionOf: ['atom-new'],
        source: 'manual'
      })
    )
    expect(result.allowed).toBe(false)
    expect(result.adjustments).toContain('corrected_memory_isolated')
  })

  it('allows high-evidence confirmed memory with multiple sources', () => {
    const result = applyAntiOverfittingPolicy(
      atom({
        lifecycle: 'confirmed',
        confidence: 0.9,
        strength: 0.85,
        evidence: [
          { id: 'ev-1', source: 'chat', sourceText: 'like', timestamp, confidence: 0.9 },
          { id: 'ev-2', source: 'chat', sourceText: 'still like', timestamp, confidence: 0.85 },
          { id: 'ev-3', source: 'manual', sourceText: 'confirmed', timestamp, confidence: 1 }
        ]
      })
    )
    expect(result.allowed).toBe(true)
    expect(result.adjustments).toEqual([])
  })

  it('does not adjust manual source memory confidence', () => {
    const result = applyAntiOverfittingPolicy(
      atom({
        lifecycle: 'confirmed',
        confidence: 0.9,
        source: 'manual',
        evidence: [
          { id: 'ev-1', source: 'manual', sourceText: 'user said', timestamp, confidence: 1 }
        ]
      })
    )
    expect(result.allowed).toBe(true)
    expect(result.adjustments).not.toContain('model_source_lower_priority')
  })
})
