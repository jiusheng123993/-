import { describe, it, expect } from 'vitest'
import {
  adaptToKnowledgeGraph,
  getGraphNodeDetail,
  searchGraphNodes,
  summarizeKnowledgeGraph,
} from '../adapter/knowledgeGraphAdapter'
import type { MemoryAtom, MemoryEntity, MemoryRelation, MemoryScope } from '../types'

const scope: MemoryScope = { userId: 'user-1', projectId: 'project-1' }
const now = '2026-06-25T00:00:00.000Z'

function makeAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: 'atom-1',
    scope,
    layer: 'semantic',
    type: 'preference',
    subject: 'user',
    predicate: 'likes',
    object: 'TypeScript',
    content: '用户喜欢 TypeScript',
    source: 'chat',
    confidence: 0.8,
    strength: 0.7,
    emotionalWeight: 0.2,
    sensitivity: 'personal',
    lifecycle: 'active',
    evidence: [],
    tags: ['coding'],
    scenarios: ['chat'],
    createdAt: now,
    updatedAt: now,
    lastAccessedAt: now,
    accessCount: 0,
    contradictionOf: [],
    ...overrides,
  }
}

function makeEntity(overrides: Partial<MemoryEntity> = {}): MemoryEntity {
  return {
    id: 'entity-1',
    scope,
    name: 'TypeScript',
    normalizedName: 'typescript',
    type: 'subject',
    aliases: ['ts'],
    attributes: {},
    sensitivity: 'personal',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function makeRelation(overrides: Partial<MemoryRelation> = {}): MemoryRelation {
  return {
    id: 'rel-1',
    scope,
    fromEntityId: 'entity-1',
    toEntityId: 'entity-2',
    relationType: 'likes',
    confidence: 0.8,
    strength: 0.6,
    evidenceAtomIds: ['atom-1'],
    lifecycle: 'active',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

// ─── adaptToKnowledgeGraph ──────────────────────────────────

describe('adaptToKnowledgeGraph', () => {
  it('adapts atoms, entities, and relations to graph format', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [makeAtom()],
      entities: [
        makeEntity({ id: 'entity-1' }),
        makeEntity({ id: 'entity-2', name: 'Rust' }),
      ],
      relations: [makeRelation()],
      scope,
    })

    expect(graph.nodes.length).toBeGreaterThan(0)
    expect(graph.edges.length).toBeGreaterThan(0)
    expect(graph.metadata.totalAtoms).toBe(1)
    expect(graph.metadata.totalEntities).toBe(2)
    expect(graph.metadata.totalRelations).toBe(1)
    expect(graph.metadata.source).toBe('memory_body')
  })

  it('maps atom type to correct node category', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [makeAtom({ id: 'g1', type: 'goal', content: '完成项目' })],
      entities: [],
      relations: [],
      scope,
    })

    const goalNode = graph.nodes.find(n => n.sourceId === 'g1')
    expect(goalNode).toBeDefined()
    expect(goalNode!.category).toBe('goal')
  })

  it('filters out forbidden atoms by default', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [
        makeAtom({ id: 'a1', sensitivity: 'forbidden', content: 'secret' }),
        makeAtom({ id: 'a2', content: 'normal' }),
      ],
      entities: [],
      relations: [],
      scope,
    })

    const forbiddenNode = graph.nodes.find(n => n.sourceId === 'a1')
    expect(forbiddenNode).toBeUndefined()
    const normalNode = graph.nodes.find(n => n.sourceId === 'a2')
    expect(normalNode).toBeDefined()
  })

  it('filters out archived atoms by default', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [
        makeAtom({ id: 'a1', lifecycle: 'archived', content: 'old' }),
        makeAtom({ id: 'a2', content: 'current' }),
      ],
      entities: [],
      relations: [],
      scope,
    })

    const archivedNode = graph.nodes.find(n => n.sourceId === 'a1')
    expect(archivedNode).toBeUndefined()
  })

  it('builds conflict edges for contradicted atoms', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [
        makeAtom({ id: 'a1', content: '喜欢 TS', contradictionOf: ['a2'] }),
        makeAtom({ id: 'a2', content: '不喜欢 TS' }),
      ],
      entities: [],
      relations: [],
      scope,
    })

    const conflictEdges = graph.edges.filter(e => e.category === 'conflict')
    expect(conflictEdges.length).toBe(1)
  })

  it('builds reinforcement edges for high-confidence same-subject atoms', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [
        makeAtom({ id: 'a1', content: '喜欢 TS', confidence: 0.9, subject: 'user' }),
        makeAtom({ id: 'a2', content: '喜欢 React', confidence: 0.85, subject: 'user' }),
      ],
      entities: [],
      relations: [],
      scope,
    })

    const reinforceEdges = graph.edges.filter(e => e.category === 'reinforcement')
    expect(reinforceEdges.length).toBe(1)
  })

  it('handles empty input gracefully', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [],
      entities: [],
      relations: [],
      scope,
    })

    expect(graph.nodes).toHaveLength(0)
    expect(graph.edges).toHaveLength(0)
    expect(graph.metadata.totalAtoms).toBe(0)
  })

  it('respects filter minConfidence', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [
        makeAtom({ id: 'a1', confidence: 0.9, content: 'high conf' }),
        makeAtom({ id: 'a2', confidence: 0.2, content: 'low conf' }),
      ],
      entities: [],
      relations: [],
      scope,
      filter: { minConfidence: 0.5 },
    })

    const lowNode = graph.nodes.find(n => n.sourceId === 'a2')
    expect(lowNode).toBeUndefined()
    const highNode = graph.nodes.find(n => n.sourceId === 'a1')
    expect(highNode).toBeDefined()
  })

  it('respects filter searchQuery', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [
        makeAtom({ id: 'a1', content: '喜欢 TypeScript' }),
        makeAtom({ id: 'a2', content: '喜欢 Rust' }),
      ],
      entities: [],
      relations: [],
      scope,
      filter: { searchQuery: 'TypeScript' },
    })

    const tsNode = graph.nodes.find(n => n.sourceId === 'a1')
    expect(tsNode).toBeDefined()
    const rustNode = graph.nodes.find(n => n.sourceId === 'a2')
    expect(rustNode).toBeUndefined()
  })

  it('truncates long labels to 60 characters', () => {
    const longContent = 'A'.repeat(100)
    const graph = adaptToKnowledgeGraph({
      atoms: [makeAtom({ id: 'a1', content: longContent })],
      entities: [],
      relations: [],
      scope,
    })

    const node = graph.nodes.find(n => n.sourceId === 'a1')
    expect(node).toBeDefined()
    expect(node!.label.length).toBeLessThanOrEqual(60)
    expect(node!.label).toContain('...')
  })

  it('sets interactive to false for forbidden atoms', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [makeAtom({ id: 'a1', sensitivity: 'forbidden', content: 'secret' })],
      entities: [],
      relations: [],
      scope,
      filter: { excludeForbidden: false },
    })

    const node = graph.nodes.find(n => n.sourceId === 'a1')
    expect(node).toBeDefined()
    expect(node!.interactive).toBe(false)
  })

  it('computes node style based on lifecycle and confidence', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [makeAtom({ id: 'a1', lifecycle: 'draft', confidence: 0.5, strength: 0.3 })],
      entities: [],
      relations: [],
      scope,
    })

    const node = graph.nodes.find(n => n.sourceId === 'a1')
    expect(node).toBeDefined()
    expect(node!.style.borderStyle).toBe('dashed')
    expect(node!.style.size).toBe('medium')
  })
})

// ─── getGraphNodeDetail ─────────────────────────────────────

describe('getGraphNodeDetail', () => {
  it('returns node detail with related atoms and edges', () => {
    const atom = makeAtom({ id: 'a1', content: '喜欢 TS' })
    const graph = adaptToKnowledgeGraph({
      atoms: [atom],
      entities: [],
      relations: [],
      scope,
    })

    const detail = getGraphNodeDetail(graph, `memory-a1`, [atom])
    expect(detail.node).not.toBeNull()
    expect(detail.node!.sourceId).toBe('a1')
    expect(detail.atoms).toHaveLength(1)
    expect(detail.atoms[0].id).toBe('a1')
  })

  it('returns null node for non-existent nodeId', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [makeAtom()],
      entities: [],
      relations: [],
      scope,
    })

    const detail = getGraphNodeDetail(graph, 'nonexistent', [])
    expect(detail.node).toBeNull()
    expect(detail.atoms).toHaveLength(0)
    expect(detail.relatedEdges).toHaveLength(0)
    expect(detail.relatedNodes).toHaveLength(0)
  })

  it('returns related edges and nodes for connected nodes', () => {
    const atomA = makeAtom({ id: 'a1', content: '喜欢 TS', contradictionOf: ['a2'] })
    const atomB = makeAtom({ id: 'a2', content: '不喜欢 TS' })
    const graph = adaptToKnowledgeGraph({
      atoms: [atomA, atomB],
      entities: [],
      relations: [],
      scope,
    })

    const detail = getGraphNodeDetail(graph, `memory-a1`, [atomA, atomB])
    expect(detail.relatedEdges.length).toBeGreaterThan(0)
    expect(detail.relatedNodes.length).toBeGreaterThan(0)
  })
})

// ─── searchGraphNodes ───────────────────────────────────────

describe('searchGraphNodes', () => {
  it('finds nodes by label content', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [
        makeAtom({ id: 'a1', content: '喜欢 TypeScript' }),
        makeAtom({ id: 'a2', content: '喜欢 Rust', object: 'Rust' }),
      ],
      entities: [],
      relations: [],
      scope,
    })

    const results = searchGraphNodes(graph, 'TypeScript')
    expect(results.length).toBe(1)
    expect(results[0].sourceId).toBe('a1')
  })

  it('finds nodes by description', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [makeAtom({ id: 'a1', subject: 'user', predicate: 'likes', object: 'TypeScript' })],
      entities: [],
      relations: [],
      scope,
    })

    const results = searchGraphNodes(graph, 'likes')
    expect(results.length).toBe(1)
  })

  it('is case-insensitive', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [makeAtom({ id: 'a1', content: '喜欢 TypeScript' })],
      entities: [],
      relations: [],
      scope,
    })

    const results = searchGraphNodes(graph, 'typescript')
    expect(results.length).toBe(1)
  })

  it('returns empty array when no match', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [makeAtom({ id: 'a1', content: '喜欢 TypeScript' })],
      entities: [],
      relations: [],
      scope,
    })

    const results = searchGraphNodes(graph, 'zzznotfound')
    expect(results).toHaveLength(0)
  })
})

// ─── summarizeKnowledgeGraph ────────────────────────────────

describe('summarizeKnowledgeGraph', () => {
  it('returns summary with node and edge counts', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [makeAtom()],
      entities: [makeEntity()],
      relations: [makeRelation()],
      scope,
    })

    const summary = summarizeKnowledgeGraph(graph)
    expect(summary).toContain('知识图谱')
    expect(summary).toContain('MemoryBody')
    expect(summary).toContain('节点')
    expect(summary).toContain('边')
  })

  it('includes conflict edge count', () => {
    const graph = adaptToKnowledgeGraph({
      atoms: [
        makeAtom({ id: 'a1', content: '喜欢 TS', contradictionOf: ['a2'] }),
        makeAtom({ id: 'a2', content: '不喜欢 TS' }),
      ],
      entities: [],
      relations: [],
      scope,
    })

    const summary = summarizeKnowledgeGraph(graph)
    expect(summary).toContain('冲突边')
  })
})
