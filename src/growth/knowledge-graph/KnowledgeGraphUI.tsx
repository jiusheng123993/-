import { useState, useEffect, useRef, useCallback } from 'react'
import { usePlatform, useAdaptiveTooltip } from '../../shared/platforms'
import {
  buildKnowledgeGraph,
  getNodeColor,
  initializeNodePositions,
  simulateForces,
  type GraphNode,
  type GraphEdge
} from './knowledgeGraphService'
import './knowledgeGraph.css'

interface KnowledgeGraphUIProps {
  onClose?: () => void
}

const TYPE_LABELS: Record<GraphNode['type'], string> = {
  journal: '日记',
  reading: '阅读',
  quicknote: '速记',
  goal: '目标',
  habit: '习惯',
  tag: '标签',
  mood: '心情',
  persona: '人格'
}

export function KnowledgeGraphUI({ onClose: _onClose }: KnowledgeGraphUIProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { deviceCategory } = usePlatform()
  const isMobile = deviceCategory === 'mobile'
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
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
    const data = buildKnowledgeGraph()
    if (data.nodes.length > 0 && containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect()
      const positionedNodes = initializeNodePositions([...data.nodes], width, height)
      const simulatedNodes = simulateForces(positionedNodes, data.edges, 150)
      setNodes(simulatedNodes)
      setEdges(data.edges)
      setTimeout(() => setIsSimulating(false), 500)
    }
  }, [])

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

  const handleNodeClick = useCallback((node: GraphNode, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNode(node)
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }, [])

  const handleNodeHover = useCallback((node: GraphNode | null, e?: React.MouseEvent) => {
    setHoveredNode(node)
    if (node && e) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setTooltipPos({
          x: node.x! + node.size + 10,
          y: node.y!
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
    return edges.filter(e => e.source === nodeId || e.target === nodeId)
  }

  const isEdgeHighlighted = (edge: GraphEdge) => {
    if (!hoveredNode) return false
    return edge.source === hoveredNode.id || edge.target === hoveredNode.id
  }

  return (
    <div className="knowledge-graph-container" ref={containerRef}>
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
        <div className="header-title">知识图谱</div>
        <div className="header-subtitle">你的知识星系 · {nodes.length} 个知识点</div>
      </div>

      <div className="graph-legend">
        <div className="legend-title">图例</div>
        <div className="legend-items">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="legend-item">
              <div
                className="legend-dot"
                style={{ backgroundColor: getNodeColor(type as GraphNode['type']), color: getNodeColor(type as GraphNode['type']) }}
              />
              <span className="legend-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌌</div>
          <div className="empty-title">知识星系等待点亮</div>
          <div className="empty-description">
            开始记录日记、添加阅读书籍、创建目标和习惯，你的知识图谱将逐渐形成
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
                <stop offset="0%" stopColor={getNodeColor(node.type)} stopOpacity="1" />
                <stop offset="50%" stopColor={getNodeColor(node.type)} stopOpacity="0.5" />
                <stop offset="100%" stopColor={getNodeColor(node.type)} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {edges.map((edge, index) => {
            const sourceNode = nodes.find(n => n.id === edge.source)
            const targetNode = nodes.find(n => n.id === edge.target)
            if (!sourceNode || !targetNode || sourceNode.x === undefined || sourceNode.y === undefined || targetNode.x === undefined || targetNode.y === undefined) return null

            return (
              <line
                key={`edge-${index}`}
                className={`graph-edge ${isEdgeHighlighted(edge) ? 'highlighted' : ''}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                strokeOpacity={isEdgeHighlighted(edge) ? 0.8 : 0.15}
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
                  r={node.size * 1.5}
                  fill={`url(#glow-${node.id})`}
                  opacity={isHovered ? 1 : node.brightness * 0.6}
                />
                <circle
                  className="node-core"
                  r={node.size * (isHovered ? 1.2 : 1)}
                  fill={getNodeColor(node.type)}
                  opacity={isHovered ? 1 : node.brightness}
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 ${node.size}px ${getNodeColor(node.type)})` : 'none'
                  }}
                />
                {isConnected && (
                  <circle
                    className="pulse-ring"
                    r={node.size * 1.3}
                    fill="none"
                    stroke={getNodeColor(node.type)}
                    strokeWidth="1"
                    opacity={0.4}
                  />
                )}
                <text
                  className={`node-label ${isHovered ? 'highlighted' : ''}`}
                  y={node.size + 16}
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

      {tooltipPos && (hoveredNode || selectedNode) && (
        <div
          className="graph-tooltip"
          style={{
            left: tooltipPos.x + offset.x,
            top: tooltipPos.y + offset.y
          }}
        >
          <div className="tooltip-title">{hoveredNode?.label || selectedNode?.label}</div>
          <div className="tooltip-type">{TYPE_LABELS[hoveredNode?.type || selectedNode?.type || 'tag']}</div>
          <div className="tooltip-info">
            {hoveredNode?.data?.date && `日期: ${hoveredNode.data.date}`}
            {hoveredNode?.data?.author && `作者: ${hoveredNode.data.author}`}
            {hoveredNode?.data?.category && `分类: ${hoveredNode.data.category}`}
            {hoveredNode?.data?.status && `状态: ${hoveredNode.data.status}`}
            {hoveredNode?.data?.count && `记录: ${hoveredNode.data.count} 次`}
            {!hoveredNode?.data?.date && !hoveredNode?.data?.author && !hoveredNode?.data?.category && !hoveredNode?.data?.status && !hoveredNode?.data?.count &&
              `关联: ${getConnectedEdges(hoveredNode?.id || selectedNode?.id || '').length} 条`}
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
