import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import {
  checkCognitiveBoundary,
  type CognitiveBoundaryContext
} from '../boundary/cognitiveBoundary'

function atom(partial: Partial<MemoryAtom>): MemoryAtom {
  return {
    id: partial.id ?? 'atom-1',
    scope: partial.scope ?? { userId: 'user-1', projectId: 'project-1' },
    layer: 'semantic',
    type: partial.type ?? 'preference',
    subject: 'user',
    predicate: partial.predicate ?? 'prefers',
    object: partial.object ?? '完整方案',
    content: partial.content ?? '用户偏好完整方案',
    source: 'chat',
    confidence: partial.confidence ?? 0.8,
    strength: partial.strength ?? 0.8,
    emotionalWeight: partial.emotionalWeight ?? 0.3,
    sensitivity: partial.sensitivity ?? 'personal',
    lifecycle: partial.lifecycle ?? 'confirmed',
    evidence: partial.evidence ?? [{
      id: 'evidence-1',
      source: 'chat',
      sourceText: '原始文本',
      timestamp: '2026-06-23T00:00:00.000Z',
      confidence: 0.9
    }],
    tags: partial.tags ?? [],
    scenarios: partial.scenarios ?? ['chat'],
    createdAt: '2026-06-23T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z',
    lastAccessedAt: '2026-06-23T00:00:00.000Z',
    accessCount: partial.accessCount ?? 1,
    contradictionOf: []
  }
}

const defaultContext: CognitiveBoundaryContext = {
  currentScenario: 'chat',
  currentScope: { userId: 'user-1', projectId: 'project-1' }
}

describe('cognitiveBoundary', () => {
  it('allows memory within same scope and scenario', () => {
    const result = checkCognitiveBoundary(
      atom({ id: 'atom-1', scenarios: ['chat'] }),
      defaultContext
    )

    expect(result.allowed).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('blocks cross-user memory access', () => {
    const result = checkCognitiveBoundary(
      atom({ id: 'atom-1', scope: { userId: 'user-2', projectId: 'project-1' } }),
      defaultContext
    )

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('cross_user_boundary')
  })

  it('blocks cross-project memory access', () => {
    const result = checkCognitiveBoundary(
      atom({ id: 'atom-1', scope: { userId: 'user-1', projectId: 'project-2' } }),
      defaultContext
    )

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('cross_project_boundary')
  })

  it('flags single-event emotion as not suitable for long-term personality inference', () => {
    const result = checkCognitiveBoundary(
      atom({
        id: 'atom-emotion',
        type: 'emotion',
        content: '用户今天心情不好',
        emotionalWeight: 0.9,
        evidence: [{
          id: 'evidence-1',
          source: 'chat',
          sourceText: '今天心情不好',
          timestamp: '2026-06-23T00:00:00.000Z',
          confidence: 0.7
        }],
        tags: ['single_event']
      }),
      defaultContext
    )

    expect(result.allowed).toBe(true)
    expect(result.warnings).toContain('single_event_emotion_not_personality')
  })

  it('flags project-scoped preference used in global context', () => {
    const result = checkCognitiveBoundary(
      atom({
        id: 'atom-project-pref',
        content: '用户偏好完整方案',
        tags: ['project_scoped'],
        scenarios: ['goal_planning']
      }),
      { ...defaultContext, currentScenario: 'chat' }
    )

    expect(result.allowed).toBe(true)
    expect(result.warnings).toContain('project_preference_in_global_context')
  })

  it('flags low-evidence memory with high confidence', () => {
    const result = checkCognitiveBoundary(
      atom({
        id: 'atom-low-evidence',
        confidence: 0.9,
        evidence: []
      }),
      defaultContext
    )

    expect(result.allowed).toBe(true)
    expect(result.warnings).toContain('low_evidence_high_confidence')
  })

  it('flags draft memory used in non-chat scenario', () => {
    const result = checkCognitiveBoundary(
      atom({
        id: 'atom-draft',
        lifecycle: 'draft',
        scenarios: ['goal_planning']
      }),
      { ...defaultContext, currentScenario: 'goal_planning' }
    )

    expect(result.allowed).toBe(true)
    expect(result.warnings).toContain('draft_memory_in_decision_context')
  })

  it('does not flag confirmed memory with sufficient evidence', () => {
    const result = checkCognitiveBoundary(
      atom({
        id: 'atom-confirmed',
        lifecycle: 'confirmed',
        confidence: 0.8,
        evidence: [{
          id: 'evidence-1',
          source: 'chat',
          sourceText: '确认',
          timestamp: '2026-06-23T00:00:00.000Z',
          confidence: 0.9
        }]
      }),
      defaultContext
    )

    expect(result.allowed).toBe(true)
    expect(result.warnings).toEqual([])
  })

  it('does not flag emotion memory with multiple evidence sources', () => {
    const result = checkCognitiveBoundary(
      atom({
        id: 'atom-emotion-multi',
        type: 'emotion',
        content: '用户长期偏好安静环境',
        emotionalWeight: 0.6,
        evidence: [
          {
            id: 'evidence-1',
            source: 'chat',
            sourceText: '我喜欢安静',
            timestamp: '2026-06-20T00:00:00.000Z',
            confidence: 0.8
          },
          {
            id: 'evidence-2',
            source: 'chat',
            sourceText: '还是安静好',
            timestamp: '2026-06-23T00:00:00.000Z',
            confidence: 0.85
          }
        ],
        tags: ['repeated']
      }),
      defaultContext
    )

    expect(result.allowed).toBe(true)
    expect(result.warnings).not.toContain('single_event_emotion_not_personality')
  })
})
