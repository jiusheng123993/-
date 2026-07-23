import type { MemoryAtom, MemoryEntity, MemoryRelation, MemoryScope } from '../memory-body/core/memoryBodyTypes'

// ─── 星图节点类型 ───────────────────────────────────────────

export type StarMapNodeType =
  | 'user'
  | 'goal'
  | 'preference'
  | 'project'
  | 'emotion'
  | 'boundary'
  | 'evidence'
  | 'entity'
  | 'insight'
  | 'relationship_node'

export type StarMapEdgeType =
  | 'conflict'
  | 'reinforcement'
  | 'decay'
  | 'evidence_link'
  | 'relation'
  | 'contradiction'
  | 'supports'
  | 'belongs_to'

export type StarMapNodeStatus =
  | 'normal'
  | 'highlighted'
  | 'dimmed'
  | 'forbidden_hidden'
  | 'protected_visible'
  | 'contradicted'

export interface StarMapVisualProps {
  size: number
  opacity: number
  color: string
  pulse: boolean
  dashed: boolean
  strokeWidth?: number
}

export interface StarMapNode {
  id: string
  type: StarMapNodeType
  label: string
  sourceId: string
  scope: MemoryScope
  visual: StarMapVisualProps
  status: StarMapNodeStatus
  atomIds: string[]
  metadata: Record<string, string | number | boolean>
}

export interface StarMapEdge {
  id: string
  type: StarMapEdgeType
  sourceNodeId: string
  targetNodeId: string
  label: string
  sourceId: string
  visual: StarMapVisualProps
  atomIds: string[]
}

export interface StarMapLayout {
  nodes: StarMapNode[]
  edges: StarMapEdge[]
  centerNodeId: string
  metadata: StarMapMetadata
}

export interface StarMapMetadata {
  totalAtoms: number
  totalEntities: number
  totalRelations: number
  conflictCount: number
  forbiddenCount: number
  protectedCount: number
  generatedAt: string
  scope: MemoryScope
}

export interface StarMapFilter {
  showForbidden: boolean
  showArchived: boolean
  showSensitive: boolean
  minConfidence: number
  nodeTypes: StarMapNodeType[]
  edgeTypes: StarMapEdgeType[]
  searchQuery: string
}

// ─── 视觉映射常量 ───────────────────────────────────────────

const LIFECYCLE_COLORS: Record<string, string> = {
  draft: '#9CA3AF',
  active: '#3B82F6',
  confirmed: '#10B981',
  stable: '#6366F1',
  weakening: '#F59E0B',
  archived: '#6B7280',
  contradicted: '#EF4444',
  protected: '#8B5CF6',
  forbidden: '#DC2626'
}

const NODE_TYPE_COLORS: Record<StarMapNodeType, string> = {
  user: '#3B82F6',
  goal: '#10B981',
  preference: '#F59E0B',
  project: '#6366F1',
  emotion: '#EC4899',
  boundary: '#EF4444',
  evidence: '#8B5CF6',
  entity: '#6B7280',
  insight: '#14B8A6',
  relationship_node: '#F97316'
}

const EDGE_TYPE_COLORS: Record<StarMapEdgeType, string> = {
  conflict: '#EF4444',
  reinforcement: '#10B981',
  decay: '#9CA3AF',
  evidence_link: '#8B5CF6',
  relation: '#3B82F6',
  contradiction: '#DC2626',
  supports: '#6366F1',
  belongs_to: '#6B7280'
}

const DEFAULT_FILTER: StarMapFilter = {
  showForbidden: false,
  showArchived: false,
  showSensitive: true,
  minConfidence: 0,
  nodeTypes: [],
  edgeTypes: [],
  searchQuery: ''
}

// ─── 节点构建 ───────────────────────────────────────────────

function computeNodeStatus(atom: MemoryAtom): StarMapNodeStatus {
  if (atom.sensitivity === 'forbidden') return 'forbidden_hidden'
  if (atom.lifecycle === 'protected') return 'protected_visible'
  if (atom.lifecycle === 'contradicted' || atom.contradictionOf.length > 0) return 'contradicted'
  return 'normal'
}

function computeVisualProps(
  lifecycle: string,
  confidence: number,
  strength: number,
  type: StarMapNodeType
): StarMapVisualProps {
  const baseSize = 20
  const sizeScale = 0.5 + strength * 0.5
  const opacityScale = 0.3 + confidence * 0.7

  return {
    size: Math.round(baseSize * sizeScale),
    opacity: Math.round(opacityScale * 100) / 100,
    color: LIFECYCLE_COLORS[lifecycle] ?? NODE_TYPE_COLORS[type],
    pulse: lifecycle === 'active' || lifecycle === 'weakening',
    dashed: lifecycle === 'draft' || lifecycle === 'archived'
  }
}

function mapAtomToNodeType(atom: MemoryAtom): StarMapNodeType {
  switch (atom.type) {
    case 'goal': return 'goal'
    case 'preference': return 'preference'
    case 'boundary': return 'boundary'
    case 'emotion': return 'emotion'
    case 'identity': return 'user'
    case 'insight': return 'insight'
    case 'relationship': return 'relationship_node'
    default: return 'entity'
  }
}

function buildAtomNode(atom: MemoryAtom): StarMapNode {
  const nodeType = mapAtomToNodeType(atom)
  return {
    id: `node-${atom.id}`,
    type: nodeType,
    label: atom.content.length > 50 ? atom.content.slice(0, 47) + '...' : atom.content,
    sourceId: atom.id,
    scope: atom.scope,
    visual: computeVisualProps(atom.lifecycle, atom.confidence, atom.strength, nodeType),
    status: computeNodeStatus(atom),
    atomIds: [atom.id],
    metadata: {
      lifecycle: atom.lifecycle,
      confidence: atom.confidence,
      strength: atom.strength,
      sensitivity: atom.sensitivity,
      type: atom.type,
      evidenceCount: atom.evidence.length,
      contradictionCount: atom.contradictionOf.length
    }
  }
}

function buildEntityNode(entity: MemoryEntity): StarMapNode {
  return {
    id: `entity-${entity.id}`,
    type: 'entity',
    label: entity.name,
    sourceId: entity.id,
    scope: entity.scope,
    visual: {
      size: 24,
      opacity: 0.9,
      color: NODE_TYPE_COLORS.entity,
      pulse: false,
      dashed: false
    },
    status: entity.sensitivity === 'forbidden' ? 'forbidden_hidden' : 'normal',
    atomIds: [],
    metadata: {
      entityType: entity.type,
      sensitivity: entity.sensitivity,
      aliasCount: entity.aliases.length
    }
  }
}

function buildEvidenceNode(atom: MemoryAtom, evidenceIndex: number): StarMapNode {
  const evidence = atom.evidence[evidenceIndex]
  return {
    id: `evidence-${atom.id}-${evidenceIndex}`,
    type: 'evidence',
    label: `证据 ${evidenceIndex + 1}: ${evidence.sourceText.slice(0, 40)}`,
    sourceId: evidence.id,
    scope: atom.scope,
    visual: {
      size: 12,
      opacity: 0.7,
      color: NODE_TYPE_COLORS.evidence,
      pulse: false,
      dashed: true
    },
    status: 'dimmed',
    atomIds: [atom.id],
    metadata: {
      source: evidence.source,
      confidence: evidence.confidence,
      timestamp: evidence.timestamp
    }
  }
}

// ─── 边构建 ─────────────────────────────────────────────────

function computeEdgeVisual(type: StarMapEdgeType, confidence: number, strength: number): StarMapVisualProps {
  return {
    size: 1,
    opacity: 0.3 + confidence * 0.7,
    color: EDGE_TYPE_COLORS[type],
    pulse: type === 'conflict' || type === 'contradiction',
    dashed: type === 'decay',
    strokeWidth: 1 + strength * 3
  }
}

function buildRelationEdge(relation: MemoryRelation): StarMapEdge {
  return {
    id: `edge-${relation.id}`,
    type: 'relation',
    sourceNodeId: `entity-${relation.fromEntityId}`,
    targetNodeId: `entity-${relation.toEntityId}`,
    label: relation.relationType,
    sourceId: relation.id,
    atomIds: relation.evidenceAtomIds,
    visual: computeEdgeVisual('relation', relation.confidence, relation.strength)
  }
}

function buildConflictEdge(atomA: MemoryAtom, atomB: MemoryAtom): StarMapEdge {
  return {
    id: `conflict-${atomA.id}-${atomB.id}`,
    type: 'conflict',
    sourceNodeId: `node-${atomA.id}`,
    targetNodeId: `node-${atomB.id}`,
    label: '冲突',
    sourceId: `${atomA.id}:${atomB.id}`,
    atomIds: [atomA.id, atomB.id],
    visual: computeEdgeVisual('conflict', 0.9, 0.8)
  }
}

function buildReinforcementEdge(fromAtom: MemoryAtom, toAtom: MemoryAtom): StarMapEdge {
  return {
    id: `reinforce-${fromAtom.id}-${toAtom.id}`,
    type: 'reinforcement',
    sourceNodeId: `node-${fromAtom.id}`,
    targetNodeId: `node-${toAtom.id}`,
    label: '强化',
    sourceId: `${fromAtom.id}:${toAtom.id}`,
    atomIds: [fromAtom.id, toAtom.id],
    visual: computeEdgeVisual('reinforcement', 0.8, 0.6)
  }
}

function buildDecayEdge(fromAtom: MemoryAtom, toAtom: MemoryAtom): StarMapEdge {
  return {
    id: `decay-${fromAtom.id}-${toAtom.id}`,
    type: 'decay',
    sourceNodeId: `node-${fromAtom.id}`,
    targetNodeId: `node-${toAtom.id}`,
    label: '衰减',
    sourceId: `${fromAtom.id}:${toAtom.id}`,
    atomIds: [fromAtom.id, toAtom.id],
    visual: computeEdgeVisual('decay', 0.4, 0.3)
  }
}

function buildEvidenceEdges(atom: MemoryAtom): StarMapEdge[] {
  return atom.evidence.map((_, index) => ({
    id: `evidence-link-${atom.id}-${index}`,
    type: 'evidence_link' as StarMapEdgeType,
    sourceNodeId: `node-${atom.id}`,
    targetNodeId: `evidence-${atom.id}-${index}`,
    label: '证据',
    sourceId: atom.id,
    atomIds: [atom.id],
    visual: computeEdgeVisual('evidence_link', 0.6, 0.4)
  }))
}

// ─── 核心构建函数 ───────────────────────────────────────────

export function buildStarMap(input: {
  atoms: MemoryAtom[]
  entities: MemoryEntity[]
  relations: MemoryRelation[]
  scope: MemoryScope
  filter?: Partial<StarMapFilter>
}): StarMapLayout {
  const filter: StarMapFilter = { ...DEFAULT_FILTER, ...input.filter }
  const nodes: StarMapNode[] = []
  const edges: StarMapEdge[] = []
  const nodeIds = new Set<string>()

  const filteredAtoms = input.atoms.filter(atom => {
    if (!filter.showForbidden && atom.sensitivity === 'forbidden') return false
    if (!filter.showArchived && atom.lifecycle === 'archived') return false
    if (!filter.showSensitive && atom.sensitivity === 'sensitive') return false
    if (atom.confidence < filter.minConfidence) return false
    if (filter.searchQuery && !atom.content.toLowerCase().includes(filter.searchQuery.toLowerCase())) return false
    return true
  })

  for (const atom of filteredAtoms) {
    const nodeType = mapAtomToNodeType(atom)
    if (filter.nodeTypes.length > 0 && !filter.nodeTypes.includes(nodeType)) continue

    const node = buildAtomNode(atom)
    nodes.push(node)
    nodeIds.add(node.id)

    for (let i = 0; i < atom.evidence.length; i++) {
      const evNode = buildEvidenceNode(atom, i)
      nodes.push(evNode)
      nodeIds.add(evNode.id)
    }
  }

  for (const entity of input.entities) {
    const node = buildEntityNode(entity)
    nodes.push(node)
    nodeIds.add(node.id)
  }

  for (const relation of input.relations) {
    if (filter.edgeTypes.length > 0 && !filter.edgeTypes.includes('relation')) continue
    if (!nodeIds.has(`entity-${relation.fromEntityId}`) || !nodeIds.has(`entity-${relation.toEntityId}`)) continue
    edges.push(buildRelationEdge(relation))
  }

  const atomMap = new Map(filteredAtoms.map(a => [a.id, a]))
  for (const atom of filteredAtoms) {
    for (const contradictedId of atom.contradictionOf) {
      const other = atomMap.get(contradictedId)
      if (other && nodeIds.has(`node-${atom.id}`) && nodeIds.has(`node-${other.id}`)) {
        if (filter.edgeTypes.length === 0 || filter.edgeTypes.includes('conflict')) {
          edges.push(buildConflictEdge(atom, other))
        }
      }
    }
  }

  const subjectGroups = new Map<string, MemoryAtom[]>()
  for (const atom of filteredAtoms) {
    const key = `${atom.scope.userId}-${atom.scope.projectId}-${atom.subject}`
    const group = subjectGroups.get(key) || []
    group.push(atom)
    subjectGroups.set(key, group)
  }
  for (const group of subjectGroups.values()) {
    if (group.length < 2) continue
    const highConfAtoms = group.filter(a => a.confidence >= 0.7 && a.lifecycle !== 'archived')
    for (let i = 0; i < highConfAtoms.length - 1; i++) {
      for (let j = i + 1; j < highConfAtoms.length; j++) {
        if (nodeIds.has(`node-${highConfAtoms[i].id}`) && nodeIds.has(`node-${highConfAtoms[j].id}`)) {
          if (filter.edgeTypes.length === 0 || filter.edgeTypes.includes('reinforcement')) {
            edges.push(buildReinforcementEdge(highConfAtoms[i], highConfAtoms[j]))
          }
        }
      }
    }
  }

  const weakeningAtoms = filteredAtoms.filter(a => a.lifecycle === 'weakening')
  for (const weak of weakeningAtoms) {
    for (const other of filteredAtoms) {
      if (other.id === weak.id) continue
      if (other.subject === weak.subject && other.lifecycle !== 'archived') {
        if (nodeIds.has(`node-${weak.id}`) && nodeIds.has(`node-${other.id}`)) {
          if (filter.edgeTypes.length === 0 || filter.edgeTypes.includes('decay')) {
            edges.push(buildDecayEdge(weak, other))
          }
          break
        }
      }
    }
  }

  for (const atom of filteredAtoms) {
    if (filter.edgeTypes.length > 0 && !filter.edgeTypes.includes('evidence_link')) continue
    edges.push(...buildEvidenceEdges(atom))
  }

  const userNode = nodes.find(n => n.type === 'user')
  const centerNodeId = userNode?.id ?? nodes[0]?.id ?? ''

  const metadata: StarMapMetadata = {
    totalAtoms: input.atoms.length,
    totalEntities: input.entities.length,
    totalRelations: input.relations.length,
    conflictCount: edges.filter(e => e.type === 'conflict' || e.type === 'contradiction').length,
    forbiddenCount: input.atoms.filter(a => a.sensitivity === 'forbidden').length,
    protectedCount: input.atoms.filter(a => a.lifecycle === 'protected').length,
    generatedAt: new Date().toISOString(),
    scope: input.scope
  }

  return { nodes, edges, centerNodeId, metadata }
}
