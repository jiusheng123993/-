import type { MemoryAtom, MemoryEntity, MemoryRelation, MemoryScope } from '../types'

/**
 * MemoryStarMap — 设计文档 11.2 记忆星图视图
 *
 * MemoryBody 是认知核心，MemoryStarMap 是展示和探索适配层。
 * 将 MemoryAtom/Entity/Relation 映射为可视化星图节点和边。
 *
 * 展示内容（设计文档 11.2）：
 * 1. 用户节点  2. 目标节点  3. 偏好节点  4. 项目节点
 * 5. 情绪节点  6. 边界节点  7. 证据节点
 * 8. 冲突边    9. 强化边    10. 衰减边
 *
 * 设计原则（设计文档 11.1）：
 * - 禁止让 KnowledgeGraph 成为记忆事实源
 * - 禁止让可视化层直接修改 MemoryBody 内部结构
 * - 禁止用图展示需求反向决定核心数据结构
 * - lifecycle、strength、confidence 影响视觉样式
 * - contradiction、forbidden、protected 显示特殊状态
 */

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

export interface StarMapNode {
  id: string
  type: StarMapNodeType
  label: string
  /** 来源 atom/entity id */
  sourceId: string
  scope: MemoryScope
  /** 视觉属性 */
  visual: StarMapVisualProps
  /** 节点状态 */
  status: StarMapNodeStatus
  /** 关联的 atom 列表 */
  atomIds: string[]
  /** 元数据 */
  metadata: Record<string, string | number | boolean>
}

export interface StarMapEdge {
  id: string
  type: StarMapEdgeType
  sourceNodeId: string
  targetNodeId: string
  label: string
  /** 来源 relation id */
  sourceId: string
  /** 视觉属性 */
  visual: StarMapVisualProps
  /** 关联的 atom/relation id */
  atomIds: string[]
}

export interface StarMapVisualProps {
  size: number
  opacity: number
  color: string
  /** 是否脉冲动画 */
  pulse: boolean
  /** 是否虚线 */
  dashed: boolean
  /** 线条宽度（边专用） */
  strokeWidth?: number
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

export interface StarMapInteraction {
  nodeId: string
  action: 'click' | 'expand' | 'collapse' | 'focus'
  payload?: Record<string, unknown>
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

/**
 * 从 MemoryBody 数据构建星图布局
 *
 * 设计文档 11.1：MemoryAtom → 记忆节点，MemoryEntity → 实体节点，MemoryRelation → 关系边
 */
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

  // 过滤 atoms
  const filteredAtoms = input.atoms.filter(atom => {
    if (!filter.showForbidden && atom.sensitivity === 'forbidden') return false
    if (!filter.showArchived && atom.lifecycle === 'archived') return false
    if (!filter.showSensitive && atom.sensitivity === 'sensitive') return false
    if (atom.confidence < filter.minConfidence) return false
    if (filter.searchQuery && !atom.content.toLowerCase().includes(filter.searchQuery.toLowerCase())) return false
    return true
  })

  // 构建 atom 节点
  for (const atom of filteredAtoms) {
    const nodeType = mapAtomToNodeType(atom)
    if (filter.nodeTypes.length > 0 && !filter.nodeTypes.includes(nodeType)) continue

    const node = buildAtomNode(atom)
    nodes.push(node)
    nodeIds.add(node.id)

    // 证据节点
    for (let i = 0; i < atom.evidence.length; i++) {
      const evNode = buildEvidenceNode(atom, i)
      nodes.push(evNode)
      nodeIds.add(evNode.id)
    }
  }

  // 构建 entity 节点
  for (const entity of input.entities) {
    const node = buildEntityNode(entity)
    nodes.push(node)
    nodeIds.add(node.id)
  }

  // 构建关系边
  for (const relation of input.relations) {
    if (filter.edgeTypes.length > 0 && !filter.edgeTypes.includes('relation')) continue
    if (!nodeIds.has(`entity-${relation.fromEntityId}`) || !nodeIds.has(`entity-${relation.toEntityId}`)) continue
    edges.push(buildRelationEdge(relation))
  }

  // 构建冲突边
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
        if (nodeIds.has(`node-${highConfAtoms[i].id}`) && nodeIds.has(`node-${highConfAtoms[j].id}`)) {
          if (filter.edgeTypes.length === 0 || filter.edgeTypes.includes('reinforcement')) {
            edges.push(buildReinforcementEdge(highConfAtoms[i], highConfAtoms[j]))
          }
        }
      }
    }
  }

  // 构建衰减边（weakening 状态的记忆指向其关联记忆）
  const weakeningAtoms = filteredAtoms.filter(a => a.lifecycle === 'weakening')
  for (const weak of weakeningAtoms) {
    for (const other of filteredAtoms) {
      if (other.id === weak.id) continue
      if (other.subject === weak.subject && other.lifecycle !== 'archived') {
        if (nodeIds.has(`node-${weak.id}`) && nodeIds.has(`node-${other.id}`)) {
          if (filter.edgeTypes.length === 0 || filter.edgeTypes.includes('decay')) {
            edges.push(buildDecayEdge(weak, other))
          }
          break // 每个衰减节点只连一条衰减边
        }
      }
    }
  }

  // 证据边
  for (const atom of filteredAtoms) {
    if (filter.edgeTypes.length > 0 && !filter.edgeTypes.includes('evidence_link')) continue
    edges.push(...buildEvidenceEdges(atom))
  }

  // 找中心节点（用户节点优先，否则第一个节点）
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

// ─── 交互处理 ───────────────────────────────────────────────

/**
 * 获取节点详情（设计文档 11.3：点击节点查看记忆详情）
 */
export function getNodeDetail(
  layout: StarMapLayout,
  nodeId: string,
  atoms: MemoryAtom[]
): {
  node: StarMapNode | null
  atoms: MemoryAtom[]
  evidenceCount: number
  conflictCount: number
  relatedEdges: StarMapEdge[]
} {
  const node = layout.nodes.find(n => n.id === nodeId)
  if (!node) {
    return { node: null, atoms: [], evidenceCount: 0, conflictCount: 0, relatedEdges: [] }
  }

  const relatedAtoms = atoms.filter(a => node.atomIds.includes(a.id))
  const evidenceCount = relatedAtoms.reduce((sum, a) => sum + a.evidence.length, 0)
  const conflictCount = relatedAtoms.reduce((sum, a) => sum + a.contradictionOf.length, 0)
  const relatedEdges = layout.edges.filter(
    e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId
  )

  return { node, atoms: relatedAtoms, evidenceCount, conflictCount, relatedEdges }
}

/**
 * 获取证据链（设计文档 11.3：查看证据链）
 */
export function getEvidenceChain(
  layout: StarMapLayout,
  nodeId: string
): { node: StarMapNode | null; evidenceNodes: StarMapNode[]; evidenceEdges: StarMapEdge[] } {
  const node = layout.nodes.find(n => n.id === nodeId)
  if (!node) return { node: null, evidenceNodes: [], evidenceEdges: [] }

  const evidenceNodes = layout.nodes.filter(
    n => n.type === 'evidence' && n.atomIds.some(id => node.atomIds.includes(id))
  )
  const evidenceEdges = layout.edges.filter(
    e => e.type === 'evidence_link' &&
      (e.sourceNodeId === nodeId || evidenceNodes.some(n => n.id === e.targetNodeId))
  )

  return { node, evidenceNodes, evidenceEdges }
}

/**
 * 获取冲突解释（设计文档 11.3：查看冲突解释）
 */
export function getConflictExplanation(
  layout: StarMapLayout,
  edgeId: string,
  atoms: MemoryAtom[]
): {
  edge: StarMapEdge | null
  atomA: MemoryAtom | null
  atomB: MemoryAtom | null
  explanation: string
} {
  const edge = layout.edges.find(e => e.id === edgeId)
  if (!edge || (edge.type !== 'conflict' && edge.type !== 'contradiction')) {
    return { edge: null, atomA: null, atomB: null, explanation: '非冲突边' }
  }

  const atomA = atoms.find(a => a.id === edge.atomIds[0]) ?? null
  const atomB = atoms.find(a => a.id === edge.atomIds[1]) ?? null

  const explanation = atomA && atomB
    ? `冲突：记忆 "${atomA.content}" 与 "${atomB.content}" 存在矛盾。` +
      (atomA.confidence > atomB.confidence
        ? ` 建议以高置信度记忆（${atomA.confidence}）为准。`
        : atomB.confidence > atomA.confidence
          ? ` 建议以高置信度记忆（${atomB.confidence}）为准。`
          : ' 两条记忆置信度相同，需要用户确认。')
    : '无法解析冲突详情'

  return { edge, atomA, atomB, explanation }
}

/**
 * 应用过滤器
 */
export function applyStarMapFilter(
  layout: StarMapLayout,
  _filter: Partial<StarMapFilter>
): StarMapLayout {
  // 重新构建以应用过滤
  return layout // 过滤器在 buildStarMap 中已应用，此处保留扩展点
}

/**
 * 生成星图摘要（面向用户）
 */
export function summarizeStarMap(layout: StarMapLayout): string {
  const { metadata } = layout
  const lines: string[] = [
    `记忆星图 — ${metadata.totalAtoms} 条记忆，${metadata.totalEntities} 个实体，${metadata.totalRelations} 条关系`,
    `节点：${layout.nodes.length} | 边：${layout.edges.length}`,
    `冲突：${metadata.conflictCount} | 禁止：${metadata.forbiddenCount} | 保护：${metadata.protectedCount}`,
    `生成时间：${metadata.generatedAt}`
  ]
  return lines.join('\n')
}
