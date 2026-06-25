import { describe, it, expect } from 'vitest'
import {
  buildStarMap,
  getNodeDetail,
  getEvidenceChain,
  getConflictExplanation,
  summarizeStarMap,
  applyStarMapFilter,
} from '../starMap/memoryStarMap'
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

// ─── buildStarMap ───────────────────────────────────────────

describe('buildStarMap', () => {
  it('builds star map from atoms, entities, and relations', () => {
    const layout = buildStarMap({
      atoms: [makeAtom()],
      entities: [
        makeEntity({ id: 'entity-1' }),
        makeEntity({ id: 'entity-2', name: 'Rust' }),
      ],
      relations: [makeRelation()],
      scope,
    })

    expect(layout.nodes.length).toBeGreaterThan(0)
    expect(layout.edges.length).toBeGreaterThan(0)
    expect(layout.metadata.totalAtoms).toBe(1)
    expect(layout.metadata.totalEntities).toBe(2)
    expect(layout.metadata.totalRelations).toBe(1)
    expect(layout.centerNodeId).toBeTruthy()
  })

  it('maps atom type to correct node type', () => {
    const layout = buildStarMap({
      atoms: [makeAtom({ id: 'g1', type: 'goal', content: '完成项目' })],
      entities: [],
      relations: [],
      scope,
    })

    const goalNode = layout.nodes.find(n => n.sourceId === 'g1')
    expect(goalNode).toBeDefined()
    expect(goalNode!.type).toBe('goal')
  })

  it('filters out forbidden atoms by default', () => {
    const layout = buildStarMap({
      atoms: [
        makeAtom({ id: 'a1', sensitivity: 'forbidden', content: 'secret' }),
        makeAtom({ id: 'a2', content: 'normal' }),
      ],
      entities: [],
      relations: [],
      scope,
    })

    const forbiddenNode = layout.nodes.find(n => n.sourceId === 'a1')
    expect(forbiddenNode).toBeUndefined()
    const normalNode = layout.nodes.find(n => n.sourceId === 'a2')
    expect(normalNode).toBeDefined()
  })

  it('filters out archived atoms by default', () => {
    const layout = buildStarMap({
      atoms: [
        makeAtom({ id: 'a1', lifecycle: 'archived', content: 'old' }),
        makeAtom({ id: 'a2', content: 'current' }),
      ],
      entities: [],
      relations: [],
      scope,
    })

    const archivedNode = layout.nodes.find(n => n.sourceId === 'a1')
    expect(archivedNode).toBeUndefined()
  })

  it('builds conflict edges for contradicted atoms', () => {
    const layout = buildStarMap({
      atoms: [
        makeAtom({ id: 'a1', content: '喜欢 TS', contradictionOf: ['a2'] }),
        makeAtom({ id: 'a2', content: '不喜欢 TS' }),
      ],
      entities: [],
      relations: [],
      scope,
    })

    const conflictEdges = layout.edges.filter(e => e.type === 'conflict')
    expect(conflictEdges.length).toBe(1)
  })

  it('builds reinforcement edges for high-confidence same-subject atoms', () => {
    const layout = buildStarMap({
      atoms: [
        makeAtom({ id: 'a1', content: '喜欢 TS', confidence: 0.9, subject: 'user' }),
        makeAtom({ id: 'a2', content: '喜欢 React', confidence: 0.85, subject: 'user' }),
      ],
      entities: [],
      relations: [],
      scope,
    })

    const reinforceEdges = layout.edges.filter(e => e.type === 'reinforcement')
    expect(reinforceEdges.length).toBe(1)
  })

  it('builds decay edges for weakening atoms', () => {
    const layout = buildStarMap({
      atoms: [
        makeAtom({ id: 'a1', lifecycle: 'weakening', content: 'fading', subject: 'user' }),
        makeAtom({ id: 'a2', content: 'active', subject: 'user' }),
      ],
      entities: [],
      relations: [],
      scope,
    })

    const decayEdges = layout.edges.filter(e => e.type === 'decay')
    expect(decayEdges.length).toBe(1)
  })

  it('builds evidence nodes and edges', () => {
    const atom = makeAtom({
      id: 'a1',
      evidence: [
        { id: 'ev1', source: 'chat', sourceText: '用户说喜欢 TS', timestamp: now, confidence: 0.9 },
      ],
    })
    const layout = buildStarMap({
      atoms: [atom],
      entities: [],
      relations: [],
      scope,
    })

    const evidenceNodes = layout.nodes.filter(n => n.type === 'evidence')
    expect(evidenceNodes.length).toBe(1)
    const evidenceEdges = layout.edges.filter(e => e.type === 'evidence_link')
    expect(evidenceEdges.length).toBe(1)
  })

  it('handles empty input gracefully', () => {
    const layout = buildStarMap({
      atoms: [],
      entities: [],
      relations: [],
      scope,
    })

    expect(layout.nodes).toHaveLength(0)
    expect(layout.edges).toHaveLength(0)
    expect(layout.centerNodeId).toBe('')
    expect(layout.metadata.totalAtoms).toBe(0)
  })

  it('respects filter minConfidence', () => {
    const layout = buildStarMap({
      atoms: [
        makeAtom({ id: 'a1', confidence: 0.9, content: 'high conf' }),
        makeAtom({ id: 'a2', confidence: 0.2, content: 'low conf' }),
      ],
      entities: [],
      relations: [],
      scope,
      filter: { minConfidence: 0.5 },
    })

    const lowNode = layout.nodes.find(n => n.sourceId === 'a2')
    expect(lowNode).toBeUndefined()
    const highNode = layout.nodes.find(n => n.sourceId === 'a1')
    expect(highNode).toBeDefined()
  })

  it('respects filter searchQuery', () => {
    const layout = buildStarMap({
      atoms: [
        makeAtom({ id: 'a1', content: '喜欢 TypeScript' }),
        makeAtom({ id: 'a2', content: '喜欢 Rust' }),
      ],
      entities: [],
      relations: [],
      scope,
      filter: { searchQuery: 'TypeScript' },
    })

    const tsNode = layout.nodes.find(n => n.sourceId === 'a1')
    expect(tsNode).toBeDefined()
    const rustNode = layout.nodes.find(n => n.sourceId === 'a2')
    expect(rustNode).toBeUndefined()
  })

  it('uses user node as center when available', () => {
    const layout = buildStarMap({
      atoms: [
        makeAtom({ id: 'a1', type: 'identity', content: '用户信息' }),
        makeAtom({ id: 'a2', type: 'preference', content: '偏好' }),
      ],
      entities: [],
      relations: [],
      scope,
    })

    const userNode = layout.nodes.find(n => n.type === 'user')
    expect(userNode).toBeDefined()
    expect(layout.centerNodeId).toBe(userNode!.id)
  })
})

// ─── getNodeDetail ──────────────────────────────────────────

describe('getNodeDetail', () => {
  it('returns node detail with related atoms and edges', () => {
    const atom = makeAtom({ id: 'a1', content: '喜欢 TS' })
    const layout = buildStarMap({
      atoms: [atom],
      entities: [],
      relations: [],
      scope,
    })

    const detail = getNodeDetail(layout, `node-a1`, [atom])
    expect(detail.node).not.toBeNull()
    expect(detail.node!.sourceId).toBe('a1')
    expect(detail.atoms).toHaveLength(1)
    expect(detail.atoms[0].id).toBe('a1')
  })

  it('returns null node for non-existent nodeId', () => {
    const layout = buildStarMap({
      atoms: [makeAtom()],
      entities: [],
      relations: [],
      scope,
    })

    const detail = getNodeDetail(layout, 'nonexistent', [])
    expect(detail.node).toBeNull()
    expect(detail.atoms).toHaveLength(0)
    expect(detail.evidenceCount).toBe(0)
    expect(detail.conflictCount).toBe(0)
  })

  it('counts evidence and conflicts correctly', () => {
    const atom = makeAtom({
      id: 'a1',
      evidence: [
        { id: 'ev1', source: 'chat', sourceText: '证据1', timestamp: now, confidence: 0.9 },
        { id: 'ev2', source: 'chat', sourceText: '证据2', timestamp: now, confidence: 0.8 },
      ],
      contradictionOf: ['a2', 'a3'],
    })
    const layout = buildStarMap({
      atoms: [atom],
      entities: [],
      relations: [],
      scope,
    })

    const detail = getNodeDetail(layout, `node-a1`, [atom])
    expect(detail.evidenceCount).toBe(2)
    expect(detail.conflictCount).toBe(2)
  })
})

// ─── getEvidenceChain ───────────────────────────────────────

describe('getEvidenceChain', () => {
  it('returns evidence nodes and edges for a node', () => {
    const atom = makeAtom({
      id: 'a1',
      evidence: [
        { id: 'ev1', source: 'chat', sourceText: '用户说喜欢 TS', timestamp: now, confidence: 0.9 },
      ],
    })
    const layout = buildStarMap({
      atoms: [atom],
      entities: [],
      relations: [],
      scope,
    })

    const chain = getEvidenceChain(layout, `node-a1`)
    expect(chain.node).not.toBeNull()
    expect(chain.evidenceNodes.length).toBe(1)
    expect(chain.evidenceEdges.length).toBe(1)
  })

  it('returns null node for non-existent nodeId', () => {
    const layout = buildStarMap({
      atoms: [makeAtom()],
      entities: [],
      relations: [],
      scope,
    })

    const chain = getEvidenceChain(layout, 'nonexistent')
    expect(chain.node).toBeNull()
    expect(chain.evidenceNodes).toHaveLength(0)
    expect(chain.evidenceEdges).toHaveLength(0)
  })

  it('returns empty evidence for node without evidence', () => {
    const atom = makeAtom({ id: 'a1', evidence: [] })
    const layout = buildStarMap({
      atoms: [atom],
      entities: [],
      relations: [],
      scope,
    })

    const chain = getEvidenceChain(layout, `node-a1`)
    expect(chain.node).not.toBeNull()
    expect(chain.evidenceNodes).toHaveLength(0)
  })
})

// ─── getConflictExplanation ─────────────────────────────────

describe('getConflictExplanation', () => {
  it('returns explanation for conflict edge', () => {
    const atomA = makeAtom({ id: 'a1', content: '喜欢 TS', confidence: 0.9, contradictionOf: ['a2'] })
    const atomB = makeAtom({ id: 'a2', content: '不喜欢 TS', confidence: 0.5 })
    const layout = buildStarMap({
      atoms: [atomA, atomB],
      entities: [],
      relations: [],
      scope,
    })

    const conflictEdge = layout.edges.find(e => e.type === 'conflict')
    expect(conflictEdge).toBeDefined()

    const explanation = getConflictExplanation(layout, conflictEdge!.id, [atomA, atomB])
    expect(explanation.edge).not.toBeNull()
    expect(explanation.atomA).not.toBeNull()
    expect(explanation.atomB).not.toBeNull()
    expect(explanation.explanation).toContain('冲突')
    expect(explanation.explanation).toContain('高置信度')
  })

  it('returns null edge for non-conflict edge', () => {
    const atom = makeAtom({ id: 'a1', evidence: [{ id: 'ev1', source: 'chat', sourceText: '证据', timestamp: now, confidence: 0.9 }] })
    const layout = buildStarMap({
      atoms: [atom],
      entities: [],
      relations: [],
      scope,
    })

    const evidenceEdge = layout.edges.find(e => e.type === 'evidence_link')
    const explanation = getConflictExplanation(layout, evidenceEdge!.id, [atom])
    expect(explanation.edge).toBeNull()
    expect(explanation.explanation).toBe('非冲突边')
  })

  it('returns null for non-existent edge', () => {
    const layout = buildStarMap({
      atoms: [makeAtom()],
      entities: [],
      relations: [],
      scope,
    })

    const explanation = getConflictExplanation(layout, 'nonexistent', [])
    expect(explanation.edge).toBeNull()
  })

  it('handles equal confidence conflict', () => {
    const atomA = makeAtom({ id: 'a1', content: '喜欢 TS', confidence: 0.7, contradictionOf: ['a2'] })
    const atomB = makeAtom({ id: 'a2', content: '不喜欢 TS', confidence: 0.7 })
    const layout = buildStarMap({
      atoms: [atomA, atomB],
      entities: [],
      relations: [],
      scope,
    })

    const conflictEdge = layout.edges.find(e => e.type === 'conflict')
    const explanation = getConflictExplanation(layout, conflictEdge!.id, [atomA, atomB])
    expect(explanation.explanation).toContain('置信度相同')
  })
})

// ─── applyStarMapFilter ─────────────────────────────────────

describe('applyStarMapFilter', () => {
  it('returns the same layout (filter applied during build)', () => {
    const layout = buildStarMap({
      atoms: [makeAtom()],
      entities: [],
      relations: [],
      scope,
    })

    const filtered = applyStarMapFilter(layout, { minConfidence: 0.5 })
    expect(filtered.nodes.length).toBe(layout.nodes.length)
    expect(filtered.edges.length).toBe(layout.edges.length)
  })
})

// ─── summarizeStarMap ───────────────────────────────────────

describe('summarizeStarMap', () => {
  it('returns summary with atom/entity/relation counts', () => {
    const layout = buildStarMap({
      atoms: [makeAtom()],
      entities: [makeEntity()],
      relations: [makeRelation()],
      scope,
    })

    const summary = summarizeStarMap(layout)
    expect(summary).toContain('记忆星图')
    expect(summary).toContain('1 条记忆')
    expect(summary).toContain('1 个实体')
    expect(summary).toContain('1 条关系')
  })

  it('includes conflict and forbidden counts', () => {
    const layout = buildStarMap({
      atoms: [
        makeAtom({ id: 'a1', sensitivity: 'forbidden', content: 'secret' }),
        makeAtom({ id: 'a2', content: 'normal' }),
      ],
      entities: [],
      relations: [],
      scope,
      filter: { showForbidden: true },
    })

    const summary = summarizeStarMap(layout)
    expect(summary).toContain('禁止：1')
  })
})
