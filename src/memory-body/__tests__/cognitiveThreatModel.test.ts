import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { detectCognitiveThreats } from '../threat/cognitiveThreatModel'

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

describe('cognitiveThreatModel', () => {
  it('detects no threats for a normal confirmed memory', () => {
    const threats = detectCognitiveThreats(
      atom({ lifecycle: 'confirmed', confidence: 0.85, strength: 0.8 }),
      { currentScope: scope }
    )
    expect(threats).toEqual([])
  })

  it('detects falseBeliefPersistence for low-evidence stable memory', () => {
    const threats = detectCognitiveThreats(
      atom({
        lifecycle: 'stable',
        confidence: 0.3,
        evidence: [{ id: 'ev-1', source: 'chat', sourceText: 'maybe', timestamp, confidence: 0.3 }]
      }),
      { currentScope: scope }
    )
    expect(threats).toContain('false_belief_persistence')
  })

  it('detects staleMemoryHijack for old memory with high confidence', () => {
    const threats = detectCognitiveThreats(
      atom({
        lifecycle: 'confirmed',
        confidence: 0.9,
        updatedAt: '2025-01-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z'
      }),
      { currentScope: scope }
    )
    expect(threats).toContain('stale_memory_hijack')
  })

  it('detects overPersonalization for single-evidence high-confidence memory', () => {
    const threats = detectCognitiveThreats(
      atom({
        lifecycle: 'confirmed',
        confidence: 0.95,
        strength: 0.9,
        evidence: [{ id: 'ev-1', source: 'chat', sourceText: 'once', timestamp, confidence: 0.95 }]
      }),
      { currentScope: scope }
    )
    expect(threats).toContain('over_personalization')
  })

  it('detects crossContextLeakage when atom scope differs from current scope', () => {
    const threats = detectCognitiveThreats(
      atom({
        scope: { userId: 'user-2', projectId: 'project-1' },
        sensitivity: 'personal'
      }),
      { currentScope: { userId: 'user-1', projectId: 'project-1' } }
    )
    expect(threats).toContain('cross_context_leakage')
  })

  it('detects sensitiveInference for sensitive memory with emotional weight', () => {
    const threats = detectCognitiveThreats(
      atom({
        sensitivity: 'sensitive',
        emotionalWeight: 0.8,
        type: 'emotion'
      }),
      { currentScope: scope }
    )
    expect(threats).toContain('sensitive_inference')
  })

  it('detects unauthorizedMemoryUse for forbidden memory', () => {
    const threats = detectCognitiveThreats(
      atom({
        lifecycle: 'forbidden',
        sensitivity: 'forbidden'
      }),
      { currentScope: scope }
    )
    expect(threats).toContain('unauthorized_memory_use')
  })

  it('detects promptLeakage for private memory in non-chat scenario', () => {
    const threats = detectCognitiveThreats(
      atom({
        sensitivity: 'private',
        scenarios: ['goal_planning']
      }),
      { currentScope: scope, currentScenario: 'goal_planning' }
    )
    expect(threats).toContain('prompt_leakage')
  })

  it('detects multiple threats simultaneously', () => {
    const threats = detectCognitiveThreats(
      atom({
        lifecycle: 'stable',
        confidence: 0.75,
        sensitivity: 'sensitive',
        emotionalWeight: 0.7,
        type: 'emotion',
        evidence: [{ id: 'ev-1', source: 'chat', sourceText: 'weak', timestamp, confidence: 0.25 }],
        updatedAt: '2025-01-01T00:00:00.000Z'
      }),
      { currentScope: scope }
    )
    expect(threats).toContain('false_belief_persistence')
    expect(threats).toContain('stale_memory_hijack')
    expect(threats).toContain('sensitive_inference')
  })

  it('returns empty threats for memory within same scope', () => {
    const threats = detectCognitiveThreats(
      atom({ scope: { userId: 'user-1', projectId: 'project-1' } }),
      { currentScope: { userId: 'user-1', projectId: 'project-1' } }
    )
    expect(threats).not.toContain('cross_context_leakage')
  })
})
