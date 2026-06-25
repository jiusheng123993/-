import type { MemoryAtom, MemoryEntity, MemoryRelation, MemoryScope } from '../types'

/**
 * KnowledgeGraphAdapter — 设计文档 Architecture - Integration
 *
 * 将 MemoryBody 数据适配为 KnowledgeGraph 可消费的格式。
 *
 * 设计原则（设计文档 11.1）：
 * - 禁止让 KnowledgeGraph 成为记忆事实源
 * - 禁止让可视化层直接修改 MemoryBody 内部结构
 * - 禁止用图展示需求反向决定核心数据结构
 * - MemoryAtom 映射为记忆节点
 * - MemoryEntity 映射为实体节点
 * - MemoryRelation 映射为关系边
 * - lifecycle、strength、confidence 影响视觉样式
 * - contradiction、forbidden、protected 显示特殊状态
 */

export type GraphNodeCategory =
  | 'memory'
  | 'entity'
  | 'user'
  | 'goal'
  | 'preference'
  | 'boundary'
  | 'emotion'
  | 'evidence'

export type GraphEdgeCategory =
  | 'relation'
  | 'conflict'
  | 'reinforcement'
  | 'evidence'
  | 'belongs_to'
  | 'supports'

export interface GraphNode {
  id: string
  category: GraphNodeCategory
  label: string
  description: string
  /** 来源 atom/entity id */
  sourceId: string
  scope: MemoryScope
  /** 视觉属性 */
  style: GraphNodeStyle
  /** 是否可交互 */
  interactive: boolean
  /** 关联的 atom id 列表 */
  atomIds: string[]
  /** 扩展元数据 */
  metadata: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  category: GraphEdgeCategory
  sourceNodeId: string
  targetNodeId: string
  label: string
  sourceId: string
  style: GraphEdgeStyle
  atomIds: string[]
}

export interface GraphNodeStyle {
  color: string
  size: 'small' | 'medium' | 'large'
  opacity: number
  borderStyle: 'solid' | 'dashed' | 'dotted'
  borderColor: string
  icon?: string
}

export interface GraphEdgeStyle {
  color: string
  width: number
  style: 'solid' | 'dashed' | 'dotted'
  animated: boolean
}

export interface KnowledgeGraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  metadata: KnowledgeGraphMetadata
}

export interface KnowledgeGraphMetadata {
  source: 'memory_body'
  generatedAt: string
  totalAtoms: number
  totalEntities: number
  totalRelations: number
  scope: MemoryScope
  version: string
}

export interface GraphFilter {
  categories: GraphNodeCategory[]
  minConfidence: number
  excludeForbidden: boolean
  excludeArchived: boolean
  searchQuery: string
}

// ─── 样式映射 ───────────────────────────────────────────────

const CATEGORY_COLORS: Record<GraphNodeCategory, string> = {
  memory: '#3B82F6',
  entity: '#6B7280',
  user: '#3B82F6',
  goal: '#10B981',
  preference: '#F59E0B',
  boundary: '#EF4444',
  emotion: '#EC4899',
  evidence: '#8B5CF6'
}

const LIFECYCLE_BORDER_COLORS: Record<string, string> = {
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

const EDGE_CATEGORY_COLORS: Record<GraphEdgeCategory, string> = {
  relation: '#3B82F6',
  conflict: '#EF4444',
  reinforcement: '#10B981',
  evidence: '#8B5CF6',
  belongs_to: '#6B7280',
  supports: '#6366F1'
}

const DEFAULT_FILTER: GraphFilter = {
  categories: [],
  minConfidence: 0,
  excludeForbidden: true,
  excludeArchived: true,
  searchQuery: ''
}

// ─── 节点构建 ───────────────────────────────────────────────

function mapAtomToCategory(atom: MemoryAtom): GraphNodeCategory {
  switch (atom.type) {
    case 'goal': return 'goal'
    case 'preference': return 'preference'
    case 'boundary': return 'boundary'
    case 'emotion': return 'emotion'
    case 'identity': return 'user'
    default: return 'memory'
  }
}

function computeNodeStyle(atom: MemoryAtom): GraphNodeStyle {
  const category = mapAtomToCategory(atom)
  const sizeScale = 0.5 + atom.strength * 0.5

  let size: GraphNodeStyle['size'] = 'medium'
  if (sizeScale > 0.8) size = 'large'
  else if (sizeScale < 0.4) size = 'small'

  return {
    color: CATEGORY_COLORS[category],
    size,
    opacity: 0.3 + atom.confidence * 0.7,
    borderStyle: atom.lifecycle === 'draft' || atom.lifecycle === 'archived' ? 'dashed' : 'solid',
    borderColor: LIFECYCLE_BORDER_COLORS[atom.lifecycle] ?? '#9CA3AF',
    icon: atom.sensitivity === 'forbidden' ? 'lock' : undefined
  }
}

function buildAtomGraphNode(atom: MemoryAtom): GraphNode {
  return {
    id: `memory-${atom.id}`,
    category: mapAtomToCategory(atom),
    label: atom.content.length > 60 ? atom.content.slice(0, 57) + '...' : atom.content,
    description: `${atom.subject} ${atom.predicate} ${atom.object}`,
    sourceId: atom.id,
    scope: atom.scope,
    style: computeNodeStyle(atom),
    interactive: atom.sensitivity !== 'forbidden',
    atomIds: [atom.id],
    metadata: {
      type: atom.type,
      lifecycle: atom.lifecycle,
      confidence: atom.confidence,
      strength: atom.strength,
      sensitivity: atom.sensitivity,
      evidenceCount: atom.evidence.length,
      contradictionCount: atom.contradictionOf.length,
      scenarios: atom.scenarios ?? [],
      tags: atom.tags
    }
  }
}

function buildEntityGraphNode(entity: MemoryEntity): GraphNode {
  return {
    id: `entity-${entity.id}`,
    category: 'entity',
    label: entity.name,
    description: `实体: ${entity.type}`,
    sourceId: entity.id,
    scope: entity.scope,
    style: {
      color: CATEGORY_COLORS.entity,
      size: 'large',
      opacity: 0.9,
      borderStyle: 'solid',
      borderColor: '#6B7280'
    },
    interactive: entity.sensitivity !== 'forbidden',
    atomIds: [],
    metadata: {
      entityType: entity.type,
      sensitivity: entity.sensitivity,
      aliases: entity.aliases,
      attributes: entity.attributes
    }
  }
}

// ─── 边构建 ─────────────────────────────────────────────────

function computeEdgeStyle(category: GraphEdgeCategory, confidence: number, strength: number): GraphEdgeStyle {
  return {
    color: EDGE_CATEGORY_COLORS[category],
    width: 1 + strength * 3,
    style: category === 'conflict' ? 'dashed' : 'solid',
    animated: category === 'conflict' || category === 'reinforcement'
  }
}

function buildRelationGraphEdge(relation: MemoryRelation): GraphEdge {
  return {
    id: `edge-${relation.id}`,
    category: 'relation',
    sourceNodeId: `entity-${relation.fromEntityId}`,
    targetNodeId: `entity-${relation.toEntityId}`,
    label: relation.relationType,
    sourceId: relation.id,
    style: computeEdgeStyle('relation', relation.confidence, relation.strength),
    atomIds: relation.evidenceAtomIds
  }
}

// ─── 核心适配函数 ───────────────────────────────────────────

/**
 * 将 MemoryBody 数据适配为 KnowledgeGraph 格式
 *
 * 设计文档 11.1：
 * - MemoryAtom → 记忆节点
 * - MemoryEntity → 实体节点
 * - MemoryRelation → 关系边
 */
export function adaptToKnowledgeGraph(input: {
  atoms: MemoryAtom[]
  entities: MemoryEntity[]
  relations: MemoryRelation[]
  scope: MemoryScope
  filter?: Partial<GraphFilter>
}): KnowledgeGraphData {
  const filter: GraphFilter = { ...DEFAULT_FILTER, ...input.filter }
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const nodeIds = new Set<string>()

  // 过滤 atoms
  const filteredAtoms = input.atoms.filter(atom => {
    if (filter.excludeForbidden && atom.sensitivity === 'forbidden') return false
    if (filter.excludeArchived && atom.lifecycle === 'archived') return false
    if (atom.confidence < filter.minConfidence) return false
    if (filter.searchQuery && !atom.content.toLowerCase().includes(filter.searchQuery.toLowerCase())) return false
    return true
  })

  // 构建 atom 节点
  for (const atom of filteredAtoms) {
    const category = mapAtomToCategory(atom)
    if (filter.categories.length > 0 && !filter.categories.includes(category)) continue

    const node = buildAtomGraphNode(atom)
    nodes.push(node)
    nodeIds.add(node.id)
  }

  // 构建 entity 节点
  for (const entity of input.entities) {
    if (filter.categories.length > 0 && !filter.categories.includes('entity')) continue
    const node = buildEntityGraphNode(entity)
    nodes.push(node)
    nodeIds.add(node.id)
  }

  // 构建关系边
  for (const relation of input.relations) {
    if (!nodeIds.has(`entity-${relation.fromEntityId}`) || !nodeIds.has(`entity-${relation.toEntityId}`)) continue
    edges.push(buildRelationGraphEdge(relation))
  }

  // 构建冲突边
  const atomMap = new Map(filteredAtoms.map(a => [a.id, a]))
  for (const atom of filteredAtoms) {
    for (const contradictedId of atom.contradictionOf) {
      const other = atomMap.get(contradictedId)
      if (other && nodeIds.has(`memory-${atom.id}`) && nodeIds.has(`memory-${other.id}`)) {
        edges.push({
          id: `conflict-${atom.id}-${contradictedId}`,
          category: 'conflict',
          sourceNodeId: `memory-${atom.id}`,
          targetNodeId: `memory-${other.id}`,
          label: '冲突',
          sourceId: `${atom.id}:${contradictedId}`,
          style: computeEdgeStyle('conflict', 0.9, 0.8),
          atomIds: [atom.id, contradictedId]
        })
      }
    }
  }

  // 构建强化边（同一 subject 的高置信度记忆之间）
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
        if (nodeIds.has(`memory-${highConfAtoms[i].id}`) && nodeIds.has(`memory-${highConfAtoms[j].id}`)) {
          edges.push({
            id: `reinforce-${highConfAtoms[i].id}-${highConfAtoms[j].id}`,
            category: 'reinforcement',
            sourceNodeId: `memory-${highConfAtoms[i].id}`,
            targetNodeId: `memory-${highConfAtoms[j].id}`,
            label: '强化',
            sourceId: `${highConfAtoms[i].id}:${highConfAtoms[j].id}`,
            style: computeEdgeStyle('reinforcement', 0.8, 0.6),
            atomIds: [highConfAtoms[i].id, highConfAtoms[j].id]
          })
        }
      }
    }
  }

  const metadata: KnowledgeGraphMetadata = {
    source: 'memory_body',
    generatedAt: new Date().toISOString(),
    totalAtoms: input.atoms.length,
    totalEntities: input.entities.length,
    totalRelations: input.relations.length,
    scope: input.scope,
    version: '1.0.0'
  }

  return { nodes, edges, metadata }
}

/**
 * 获取图谱节点详情
 */
export function getGraphNodeDetail(
  graph: KnowledgeGraphData,
  nodeId: string,
  atoms: MemoryAtom[]
): {
  node: GraphNode | null
  atoms: MemoryAtom[]
  relatedEdges: GraphEdge[]
  relatedNodes: GraphNode[]
} {
  const node = graph.nodes.find(n => n.id === nodeId)
  if (!node) return { node: null, atoms: [], relatedEdges: [], relatedNodes: [] }

  const relatedAtoms = atoms.filter(a => node.atomIds.includes(a.id))
  const relatedEdges = graph.edges.filter(
    e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId
  )
  const relatedNodeIds = new Set(
    relatedEdges.flatMap(e => [e.sourceNodeId, e.targetNodeId]).filter(id => id !== nodeId)
  )
  const relatedNodes = graph.nodes.filter(n => relatedNodeIds.has(n.id))

  return { node, atoms: relatedAtoms, relatedEdges, relatedNodes }
}

/**
 * 搜索图谱节点
 */
export function searchGraphNodes(
  graph: KnowledgeGraphData,
  query: string
): GraphNode[] {
  const lowerQuery = query.toLowerCase()
  return graph.nodes.filter(n =>
    n.label.toLowerCase().includes(lowerQuery) ||
    n.description.toLowerCase().includes(lowerQuery)
  )
}

/**
 * 生成图谱摘要
 */
export function summarizeKnowledgeGraph(graph: KnowledgeGraphData): string {
  const { metadata } = graph
  const lines: string[] = [
    `知识图谱（来源：MemoryBody）`,
    `节点：${graph.nodes.length} | 边：${graph.edges.length}`,
    `记忆：${metadata.totalAtoms} | 实体：${metadata.totalEntities} | 关系：${metadata.totalRelations}`,
    `冲突边：${graph.edges.filter(e => e.category === 'conflict').length}`,
    `生成时间：${metadata.generatedAt}`
  ]
  return lines.join('\n')
}
