import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { ModuleSize } from '../module-store/types'

interface CanvasCardProps {
  title: string
  description: string
  size: ModuleSize
  position: { x: number; y: number }
  onDragStart: () => void
  onDragEnd: () => void
  onMove: (position: { x: number; y: number }) => void
  onRemove: () => void
  onResize: (size: ModuleSize) => void
  onDragMove?: (gridPosition: { x: number; y: number }) => void
  children?: ReactNode
  onOpenDetails?: () => void
  collisionEnabled?: boolean
  onCollision?: (moduleId: string, targetPosition: { x: number; y: number }) => void
}

const sizeMeta: Record<ModuleSize, { columns: number; rows: number; label: string }> = {
  small: { columns: 1, rows: 1, label: '小' },
  medium: { columns: 2, rows: 1, label: '中' },
  large: { columns: 2, rows: 2, label: '大' },
  'full-width': { columns: 4, rows: 1, label: '通栏' }
}

export const CanvasCard = ({
  title,
  description,
  size,
  position,
  onDragStart,
  onDragEnd,
  onMove,
  onRemove,
  onResize,
  onDragMove,
  children,
  onOpenDetails,
  collisionEnabled = true,
  onCollision
}: CanvasCardProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [visualPosition, setVisualPosition] = useState<{ x: number; y: number } | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const cardRef = useRef<HTMLElement>(null)
  const dragStartRef = useRef<{ x: number; y: number; gridX: number; gridY: number } | null>(null)
  const visualPositionRef = useRef<{ x: number; y: number } | null>(null)
  const onMoveRef = useRef(onMove)
  const onDragEndRef = useRef(onDragEnd)
  const onDragMoveRef = useRef(onDragMove)
  const onCollisionRef = useRef(onCollision)
  const meta = sizeMeta[size]

  onMoveRef.current = onMove
  onDragEndRef.current = onDragEnd
  onDragMoveRef.current = onDragMove
  onCollisionRef.current = onCollision

  useEffect(() => {
    if (!isDragging) {
      setVisualPosition(null)
      visualPositionRef.current = null
    }
  }, [isDragging, position])

  useEffect(() => {
    if (!isDragging) return

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStartRef.current || !cardRef.current) return

      const canvas = cardRef.current.closest('.draggable-canvas') as HTMLElement
      if (!canvas) return

      const canvasRect = canvas.getBoundingClientRect()
      const columnWidth = canvasRect.width / 4
      const rowHeight = 148

      const deltaX = event.clientX - dragStartRef.current.x
      const deltaY = event.clientY - dragStartRef.current.y

      const newGridX = dragStartRef.current.gridX + deltaX / columnWidth
      const newGridY = dragStartRef.current.gridY + deltaY / rowHeight

      const snappedX = Math.max(0, Math.min(4 - meta.columns, Math.round(newGridX)))
      const snappedY = Math.max(0, Math.round(newGridY))

      const newPos = { x: snappedX, y: snappedY }
      setVisualPosition(newPos)
      visualPositionRef.current = newPos
      setDragOffset({
        x: (newGridX - snappedX) * columnWidth,
        y: (newGridY - snappedY) * rowHeight
      })

      if (onDragMoveRef.current) {
        onDragMoveRef.current(newPos)
      }
    }

    const handlePointerUp = () => {
      const finalPos = visualPositionRef.current
      if (dragStartRef.current && finalPos) {
        if (collisionEnabled && onCollisionRef.current) {
          onCollisionRef.current(title, finalPos)
        } else {
          onMoveRef.current(finalPos)
        }
      }
      setIsDragging(false)
      setDragOffset({ x: 0, y: 0 })
      dragStartRef.current = null
      visualPositionRef.current = null
      onDragEndRef.current()
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDragging, meta.columns, collisionEnabled, title])

  const startDrag = useCallback((event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const canvas = cardRef.current?.closest('.draggable-canvas') as HTMLElement
    if (!canvas) return

    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      gridX: position.x,
      gridY: position.y
    }

    const startPos = { x: position.x, y: position.y }
    setIsDragging(true)
    setVisualPosition(startPos)
    visualPositionRef.current = startPos
    onDragStart()
  }, [position.x, position.y, onDragStart])

  const displayPosition = visualPosition ?? position

  const handleResizePointerDown = useCallback((direction: string) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    
    const canvas = cardRef.current?.closest('.draggable-canvas') as HTMLElement
    if (!canvas) return

    const startX = e.clientX
    const startY = e.clientY
    const startSize = size

    const handleResizeMove = (moveEvent: PointerEvent) => {
      const canvasRect = canvas.getBoundingClientRect()
      const columnWidth = canvasRect.width / 4
      const rowHeight = 148

      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      const deltaCols = Math.round(deltaX / columnWidth)
      const deltaRows = Math.round(deltaY / rowHeight)

      let newSize: ModuleSize = startSize

      if (direction === 'e' || direction === 'se') {
        if (deltaCols > 0) newSize = 'medium'
        if (deltaCols > 1 || startSize === 'medium' && deltaCols > 0) newSize = 'large'
        if (deltaCols > 2 || startSize === 'large' && deltaCols > 0) newSize = 'full-width'
      }
      if (direction === 's' || direction === 'se') {
        if (deltaRows > 0 && startSize !== 'full-width') newSize = 'large'
      }

      if (newSize !== size) {
        onResize(newSize)
      }
    }

    const handleResizeUp = () => {
      setIsResizing(false)
      window.removeEventListener('pointermove', handleResizeMove)
      window.removeEventListener('pointerup', handleResizeUp)
    }

    window.addEventListener('pointermove', handleResizeMove)
    window.addEventListener('pointerup', handleResizeUp)
  }, [size, onResize])

  return (
    <article
      ref={cardRef}
      className={`canvas-card ${isDragging ? 'dragging' : ''} ${isHovered ? 'hovered' : ''} ${isResizing ? 'resizing' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !isDragging && setIsHovered(false)}
      style={{
        gridColumn: `${displayPosition.x + 1} / span ${meta.columns}`,
        gridRow: `${displayPosition.y + 1} / span ${meta.rows}`,
        background: 'var(--surface)',
        borderRadius: '16px',
        padding: '16px',
        cursor: 'default',
        transition: isDragging ? 'none' : 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isDragging
          ? '0 12px 32px rgba(0, 0, 0, 0.16)'
          : isHovered
            ? '0 8px 24px rgba(0, 0, 0, 0.12)'
            : '0 2px 8px rgba(0, 0, 0, 0.08)',
        transform: isDragging
          ? `scale(1.02) translate(${dragOffset.x}px, ${dragOffset.y}px)`
          : isHovered
            ? 'translateY(-4px)'
            : 'none',
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 1,
        userSelect: 'none'
      }}
    >
      <div className="card-heading compact">
        <button
          aria-label={`拖动 ${title}`}
          className="canvas-card-drag-handle"
          onPointerDown={startDrag}
          type="button"
        >
          ⠿
        </button>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, flex: 1 }}>{title}</h3>
        <span className="pill">{meta.label}</span>
        <button
          aria-label={`关闭 ${title}`}
          className="canvas-card-close-btn"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          type="button"
        >
          ×
        </button>
      </div>
      <p style={{ margin: '8px 0 12px', fontSize: '14px', color: 'var(--muted)' }}>{description}</p>
      {children && <div className="canvas-card-content">{children}</div>}
      {onOpenDetails && (
        <button className="canvas-card-detail-button" onClick={onOpenDetails} type="button">
          打开 {title}详情
        </button>
      )}
      <div 
        className="canvas-card-resize-handles"
        style={{ pointerEvents: isHovered ? 'auto' : 'none' }}
      >
        <div 
          className="resize-handle resize-handle-e"
          onPointerDown={handleResizePointerDown('e')}
        />
        <div 
          className="resize-handle resize-handle-s"
          onPointerDown={handleResizePointerDown('s')}
        />
        <div 
          className="resize-handle resize-handle-se"
          onPointerDown={handleResizePointerDown('se')}
        />
      </div>
    </article>
  )
}
