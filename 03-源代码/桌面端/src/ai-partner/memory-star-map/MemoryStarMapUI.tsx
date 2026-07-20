import { useState, useEffect, useRef, useCallback } from 'react'
import { usePlatform, useAdaptiveTooltip } from '../../shared/platforms'
import {
  buildStarMap
} from './starMapBuilder'
import type {
  StarMapNode,
  StarMapEdge,
  StarMapNodeType,
  MemoryAtom,
  MemoryEntity,
  MemoryRelation,
  MemoryScope
} from './starMapBuilder'
import './MemoryStarMapUI.css'

interface MemoryStarMapUIProps {
  atoms: MemoryAtom[]
  entities: MemoryEntity[]
  relations: MemoryRelation[]
  scope: MemoryScope
  onClose?: () => void
}

// ─── 颜色常量（memoryStarMap.ts 中为 const 未导出，此处重新定义） ───

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

// ─── 中文标签 ───────────────────────────────────────────────

const NODE_TYPE_LABELS: Record<StarMapNodeType, string> = {
  user: '用户',
  goal: '目标',
  preference: '偏好',
  project: '项目',
  emotion: '情绪',
  boundary: '边界',
  evidence: '证据',
  entity: '实体',
  insight: '洞察',
  relationship_node: '关系'
}

const LIFECYCLE_LABELS: Record<string, string> = {
  draft: '草稿',
  active: '活跃',
  confirmed: '已确认',
  stable: '稳定',
  weakening: '衰减中',
  archived: '已归档',
  contradicted: '矛盾',
  protected: '受保护',
  forbidden: '禁止'
}

// ─── 力导向布局 ─────────────────────────────────────────────

interface LayoutNode extends StarMapNode {
  x?: number
  y?: number
  vx?: number
  vy?: number
}

function initializeNodePositions(nodes: LayoutNode[], width: number, height: number): LayoutNode[] {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) * 0.35

  return nodes.map((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI
    const r = radius * (0.3 + Math.random() * 0.7)
    return {
      ...node,
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2
    }
  })
}

function simulateForces(nodes: LayoutNode[], edges: StarMapEdge[], iterations: number): LayoutNode[] {
  const result = nodes.map(n => ({ ...n }))
  const repulsionStrength = 5000
  const attractionStrength = 0.01
  const damping = 0.9

  for (let iter = 0; iter < iterations; iter++) {
    // 斥力
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]
        const b = result[j]
        if (a.x === undefined || a.y === undefined || b.x === undefined || b.y === undefined) continue
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = repulsionStrength / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        if (a.vx !== undefined) a.vx -= fx
        if (a.vy !== undefined) a.vy -= fy
        if (b.vx !== undefined) b.vx += fx
        if (b.vy !== undefined) b.vy += fy
      }
    }

    // 引力
    for (const edge of edges) {
      const source = result.find(n => n.id === edge.sourceNodeId)
      const target = result.find(n => n.id === edge.targetNodeId)
      if (!source || !target || source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) continue
      const dx = target.x - source.x
      const dy = target.y - source.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const force = dist * attractionStrength
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      if (source.vx !== undefined) source.vx += fx
      if (source.vy !== undefined) source.vy += fy
      if (target.vx !== undefined) target.vx -= fx
      if (target.vy !== undefined) target.vy -= fy
    }

    // 阻尼 + 更新位置
    for (const node of result) {
      if (node.vx !== undefined) node.vx *= damping
      if (node.vy !== undefined) node.vy *= damping
      if (node.x !== undefined && node.vx !== undefined) node.x += node.vx
      if (node.y !== undefined && node.vy !== undefined) node.y += node.vy
    }
  }

  return result
}

// ─── 组件 ───────────────────────────────────────────────────

export function MemoryStarMapUI({ atoms, entities, relations, scope, onClose: _onClose }: MemoryStarMapUIProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { deviceCategory } = usePlatform()
  const isMobile = deviceCategory === 'mobile'
  const [nodes, setNodes] = useState<LayoutNode[]>([])
  const [edges, setEdges] = useState<StarMapEdge[]>([])
  const [hoveredNode, setHoveredNode] = useState<LayoutNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [isSimulating, setIsSimulating] = useState(true)
  const zoomInTooltip = useAdaptiveTooltip('放大')
  const zoomOutTooltip = useAdaptiveTooltip('缩小')
  const resetTooltip = useAdaptiveTooltip('重置')
  const simTooltip = useAdaptiveTooltip(isSimulating ? '暂停' : '继续')
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const animationRef = useRef<number>()

  useEffect(() => {
    const data = buildStarMap({
      atoms,
      entities,
      relations,
      scope
    })
    if (data.nodes.length > 0 && containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect()
      const positionedNodes = initializeNodePositions([...data.nodes], width, height)
      const simulatedNodes = simulateForces(positionedNodes, data.edges, 150)
      setNodes(simulatedNodes)
      setEdges(data.edges)
      setTimeout(() => setIsSimulating(false), 500)
    }
  }, [atoms, entities, relations, scope])

  useEffect(() => {
    if (!isSimulating || nodes.length === 0) return

    const animate = () => {
      setNodes(prevNodes => {
        const newNodes = [...prevNodes]
        const damping = 0.95
        const centerX = containerRef.current ? containerRef.current.getBoundingClientRect().width / 2 : 400
        const centerY = containerRef.current ? containerRef.current.getBoundingClientRect().height / 2 : 300

        newNodes.forEach(node => {
          if (node.x === undefined || node.y === undefined || node.vx === undefined || node.vy === undefined) return

          const dx = centerX - node.x
          const dy = centerY - node.y
          const distToCenter = Math.sqrt(dx * dx + dy * dy)
          if (distToCenter > 200) {
            node.vx += dx * 0.0001
            node.vy += dy * 0.0001
          }

          node.vx *= damping
          node.vy *= damping
          node.x += node.vx
          node.y += node.vy

          const margin = 50
          const bounds = containerRef.current?.getBoundingClientRect()
          if (bounds) {
            if (node.x < margin) { node.x = margin; node.vx *= -0.5 }
            if (node.x > bounds.width - margin) { node.x = bounds.width - margin; node.vx *= -0.5 }
            if (node.y < margin) { node.y = margin; node.vy *= -0.5 }
            if (node.y > bounds.height - margin) { node.y = bounds.height - margin; node.vy *= -0.5 }
          }
        })

        return newNodes
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isSimulating, nodes.length])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.min(Math.max(prev * delta, 0.3), 3))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }
  }, [offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleNodeClick = useCallback((node: LayoutNode, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNode(node)
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }, [])

  const handleNodeHover = useCallback((node: LayoutNode | null, e?: React.MouseEvent) => {
    setHoveredNode(node)
    if (node && e) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setTooltipPos({
          x: (node.x ?? 0) + node.visual.size + 10,
          y: node.y ?? 0
        })
      }
    }
  }, [])

  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setScale(prev => Math.max(prev * 0.8, 0.3))
  const handleReset = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  const renderStars = () => {
    const stars = []
    for (let i = 0; i < 100; i++) {
      const size = Math.random() > 0.9 ? 'large' : Math.random() > 0.5 ? 'medium' : ''
      const delay = Math.random() * 5
      const top = Math.random() * 100
      const left = Math.random() * 100
      stars.push(
        <div
          key={i}
          className={`star ${size}`}
          style={{
            top: `${top}%`,
            left: `${left}%`,
            animationDelay: `${delay}s`
          }}
        />
      )
    }
    return stars
  }

  const getConnectedEdges = (nodeId: string) => {
    return edges.filter(e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId)
  }

  const isEdgeHighlighted = (edge: StarMapEdge) => {
    if (!hoveredNode) return false
    return edge.sourceNodeId === hoveredNode.id || edge.targetNodeId === hoveredNode.id
  }

  const getNodeColor = (node: LayoutNode): string => {
    return node.visual.color
  }

  const getNodeLifecycle = (node: LayoutNode): string => {
    return (node.metadata.lifecycle as string) ?? 'active'
  }

  const getNodeConfidence = (node: LayoutNode): number => {
    return (node.metadata.confidence as number) ?? 0
  }

  const getNodeStrength = (node: LayoutNode): number => {
    return (node.metadata.strength as number) ?? 0
  }

  const getNodeEvidenceCount = (node: LayoutNode): number => {
    return (node.metadata.evidenceCount as number) ?? 0
  }

  const getNodeContradictionCount = (node: LayoutNode): number => {
    return (node.metadata.contradictionCount as number) ?? 0
  }

  const activeNode = hoveredNode || selectedNode

  return (
    <div className="memory-star-map-container" ref={containerRef}>
      <div className="cosmos-background">
        <div className="star-field">{renderStars()}</div>
        <div className="nebula nebula-1" />
        <div className="nebula nebula-2" />
        <div className="nebula nebula-3" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
      </div>

      <div className="graph-header">
        <div className="header-title">记忆星图</div>
        <div className="header-subtitle">
          你的记忆星系 · {nodes.length} 个节点 · {edges.length} 条边
        </div>
      </div>

      <div className="graph-legend">
        <div className="legend-title">节点类型</div>
        <div className="legend-items">
          {Object.entries(NODE_TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="legend-item">
              <div
                className="legend-dot"
                style={{
                  backgroundColor: NODE_TYPE_COLORS[type as StarMapNodeType],
                  color: NODE_TYPE_COLORS[type as StarMapNodeType]
                }}
              />
              <span className="legend-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌌</div>
          <div className="empty-title">记忆星系等待点亮</div>
          <div className="empty-description">
            当记忆体积累足够数据后，你的记忆星图将在此展现，揭示记忆之间的关联与冲突
          </div>
        </div>
      ) : (
        <svg
          className="graph-canvas"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => { setSelectedNode(null); setTooltipPos(null) }}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center'
          }}
        >
          <defs>
            {nodes.map(node => (
              <radialGradient key={`gradient-${node.id}`} id={`glow-${node.id}`}>
                <stop offset="0%" stopColor={getNodeColor(node)} stopOpacity="1" />
                <stop offset="50%" stopColor={getNodeColor(node)} stopOpacity="0.5" />
                <stop offset="100%" stopColor={getNodeColor(node)} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {edges.map((edge, index) => {
            const sourceNode = nodes.find(n => n.id === edge.sourceNodeId)
            const targetNode = nodes.find(n => n.id === edge.targetNodeId)
            if (!sourceNode || !targetNode || sourceNode.x === undefined || sourceNode.y === undefined || targetNode.x === undefined || targetNode.y === undefined) return null

            return (
              <line
                key={`edge-${index}`}
                className={`graph-edge ${isEdgeHighlighted(edge) ? 'highlighted' : ''}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={edge.visual.color}
                strokeWidth={edge.visual.strokeWidth ?? 1}
                strokeDasharray={edge.visual.dashed ? '4,4' : undefined}
                strokeOpacity={isEdgeHighlighted(edge) ? 0.8 : edge.visual.opacity * 0.5}
              />
            )
          })}

          {nodes.map((node, index) => {
            if (node.x === undefined || node.y === undefined) return null

            const isHovered = hoveredNode?.id === node.id
            const connectedEdges = getConnectedEdges(node.id)
            const isConnected = connectedEdges.length > 0

            return (
              <g
                key={node.id}
                className="graph-node"
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => handleNodeClick(node, e)}
                onMouseEnter={isMobile ? undefined : (e) => handleNodeHover(node, e)}
                onMouseLeave={isMobile ? undefined : () => handleNodeHover(null)}
                onTouchStart={isMobile ? () => handleNodeHover(node) : undefined}
                onTouchEnd={isMobile ? () => handleNodeHover(null) : undefined}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <circle
                  className="node-glow"
                  r={node.visual.size * 1.5}
                  fill={`url(#glow-${node.id})`}
                  opacity={isHovered ? 1 : node.visual.opacity * 0.6}
                />
                <circle
                  className="node-core"
                  r={node.visual.size * (isHovered ? 1.2 : 1)}
                  fill={getNodeColor(node)}
                  opacity={isHovered ? 1 : node.visual.opacity}
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 ${node.visual.size}px ${getNodeColor(node)})` : 'none'
                  }}
                />
                {isConnected && (
                  <circle
                    className="pulse-ring"
                    r={node.visual.size * 1.3}
                    fill="none"
                    stroke={getNodeColor(node)}
                    strokeWidth="1"
                    opacity={0.4}
                  />
                )}
                {node.visual.pulse && (
                  <circle
                    className="pulse-ring"
                    r={node.visual.size * 1.5}
                    fill="none"
                    stroke={getNodeColor(node)}
                    strokeWidth="0.5"
                    opacity={0.3}
                    style={{ animationDelay: '0.5s' }}
                  />
                )}
                <text
                  className={`node-label ${isHovered ? 'highlighted' : ''}`}
                  y={node.visual.size + 16}
                  textAnchor="middle"
                  fill="white"
                  style={{
                    opacity: isHovered ? 1 : 0.7,
                    fontSize: isHovered ? '12px' : '11px'
                  }}
                >
                  {node.label}
                </text>
              </g>
            )
          })}
        </svg>
      )}

      {tooltipPos && activeNode && (
        <div
          className="graph-tooltip"
          style={{
            left: tooltipPos.x + offset.x,
            top: tooltipPos.y + offset.y
          }}
        >
          <div className="tooltip-title">{activeNode.label}</div>
          <div className="tooltip-type">
            {NODE_TYPE_LABELS[activeNode.type]} · {LIFECYCLE_LABELS[getNodeLifecycle(activeNode)] ?? getNodeLifecycle(activeNode)}
          </div>
          <div className="tooltip-info">
            <div className="tooltip-info-row">
              <span className="tooltip-info-label">置信度</span>
              <span className="tooltip-info-value">{Math.round(getNodeConfidence(activeNode) * 100)}%</span>
            </div>
            <div className="tooltip-info-row">
              <span className="tooltip-info-label">强度</span>
              <span className="tooltip-info-value">{Math.round(getNodeStrength(activeNode) * 100)}%</span>
            </div>
            <div className="tooltip-info-row">
              <span className="tooltip-info-label">证据</span>
              <span className="tooltip-info-value">{getNodeEvidenceCount(activeNode)} 条</span>
            </div>
            {getNodeContradictionCount(activeNode) > 0 && (
              <div className="tooltip-info-row">
                <span className="tooltip-info-label">矛盾</span>
                <span className="tooltip-info-value">{getNodeContradictionCount(activeNode)} 条</span>
              </div>
            )}
            <div className="tooltip-info-row">
              <span className="tooltip-info-label">关联边</span>
              <span className="tooltip-info-value">{getConnectedEdges(activeNode.id).length} 条</span>
            </div>
          </div>
          <div
            className="tooltip-status"
            style={{
              backgroundColor: LIFECYCLE_COLORS[getNodeLifecycle(activeNode)] + '33',
              color: LIFECYCLE_COLORS[getNodeLifecycle(activeNode)] ?? '#9CA3AF'
            }}
          >
            {LIFECYCLE_LABELS[getNodeLifecycle(activeNode)] ?? getNodeLifecycle(activeNode)}
          </div>
        </div>
      )}

      <div className="graph-controls">
        <button className="control-btn" onClick={handleZoomIn} {...zoomInTooltip.tooltipProps}>+</button>
        <button className="control-btn" onClick={handleZoomOut} {...zoomOutTooltip.tooltipProps}>−</button>
        <button className="control-btn" onClick={handleReset} {...resetTooltip.tooltipProps}>⟲</button>
        <button className="control-btn" onClick={() => setIsSimulating(!isSimulating)} {...simTooltip.tooltipProps}>
          {isSimulating ? '⏸' : '▶'}
        </button>
      </div>
      {zoomInTooltip.tooltipElement}
      {zoomOutTooltip.tooltipElement}
      {resetTooltip.tooltipElement}
      {simTooltip.tooltipElement}
    </div>
  )
}
