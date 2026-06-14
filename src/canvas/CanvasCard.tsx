import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { ModuleSize } from '../module-store/types'
import { usePlatform, useLongPress } from '../platforms'

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

const MIN_COLUMNS = 1
const MAX_COLUMNS = 4
const MIN_ROWS = 1
const MAX_ROWS = 6
const SNAP_THRESHOLD = 0.3

const sizeLabel = (size: ModuleSize) => `${size.columns}×${size.rows}`

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
  const { deviceCategory } = usePlatform()
  const isMobile = deviceCategory === 'mobile'

  const longPress = useLongPress({
    duration: 500,
    onLongPress: () => {
      if (isMobile && onOpenDetails) {
        onOpenDetails()
      } else {
        setIsHovered((prev) => !prev)
      }
    },
    onClick: isMobile ? undefined : undefined
  })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [visualPosition, setVisualPosition] = useState<{ x: number; y: number } | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [previewSize, setPreviewSize] = useState<ModuleSize | null>(null)
  const [isSnapped, setIsSnapped] = useState(false)
  const cardRef = useRef<HTMLElement>(null)
  const dragStartRef = useRef<{ x: number; y: number; gridX: number; gridY: number } | null>(null)
  const visualPositionRef = useRef<{ x: number; y: number } | null>(null)
  const onMoveRef = useRef(onMove)
  const onDragEndRef = useRef(onDragEnd)
  const onDragMoveRef = useRef(onDragMove)
  const onCollisionRef = useRef(onCollision)
  const isDraggingRef = useRef(false)
  const didDragRef = useRef(false)
  const handlePointerMoveRef = useRef<((event: PointerEvent) => void) | null>(null)
  const handlePointerUpRef = useRef<(() => void) | null>(null)

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

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!dragStartRef.current || !cardRef.current) return

    const canvas = cardRef.current.closest('.draggable-canvas') as HTMLElement
    if (!canvas) return

    const canvasRect = canvas.getBoundingClientRect()
    const columnWidth = canvasRect.width / 4
    const rowHeight = 148

    const deltaX = event.clientX - dragStartRef.current.x
    const deltaY = event.clientY - dragStartRef.current.y

    const dragThreshold = isMobile ? 8 : 3

    if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
      didDragRef.current = true
    }

    const newGridX = dragStartRef.current.gridX + deltaX / columnWidth
    const newGridY = dragStartRef.current.gridY + deltaY / rowHeight

    const snappedX = Math.max(0, Math.min(4 - size.columns, Math.round(newGridX)))
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
  }, [size.columns, isMobile])

  handlePointerMoveRef.current = handlePointerMove

  const handlePointerUp = useCallback(() => {
    const finalPos = visualPositionRef.current
    if (dragStartRef.current && finalPos && didDragRef.current) {
      if (collisionEnabled && onCollisionRef.current) {
        onCollisionRef.current(title, finalPos)
      } else {
        onMoveRef.current(finalPos)
      }
    }
    setIsDragging(false)
    isDraggingRef.current = false
    didDragRef.current = false
    setDragOffset({ x: 0, y: 0 })
    dragStartRef.current = null
    visualPositionRef.current = null
    if (handlePointerMoveRef.current) {
      window.removeEventListener('pointermove', handlePointerMoveRef.current)
    }
    if (handlePointerUpRef.current) {
      window.removeEventListener('pointerup', handlePointerUpRef.current)
    }
    onDragEndRef.current()
  }, [collisionEnabled, title])

  handlePointerUpRef.current = handlePointerUp

  const startDrag = useCallback((event: React.PointerEvent) => {
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
    isDraggingRef.current = true
    didDragRef.current = false
    setVisualPosition(startPos)
    visualPositionRef.current = startPos

    if (handlePointerMoveRef.current) {
      window.addEventListener('pointermove', handlePointerMoveRef.current)
    }
    if (handlePointerUpRef.current) {
      window.addEventListener('pointerup', handlePointerUpRef.current)
    }

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
    const startCols = size.columns
    const startRows = size.rows

    const handleResizeMove = (moveEvent: PointerEvent) => {
      const canvasRect = canvas.getBoundingClientRect()
      const columnWidth = canvasRect.width / 4
      const rowHeight = 148

      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      const rawCols = startCols + deltaX / columnWidth
      const rawRows = startRows + deltaY / rowHeight

      let newCols = startCols
      let newRows = startRows

      if (direction === 'e' || direction === 'se') {
        const snappedCols = Math.abs(rawCols - Math.round(rawCols)) < SNAP_THRESHOLD ? Math.round(rawCols) : rawCols
        newCols = Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, Math.floor(snappedCols)))
      }
      if (direction === 's' || direction === 'se') {
        const snappedRows = Math.abs(rawRows - Math.round(rawRows)) < SNAP_THRESHOLD ? Math.round(rawRows) : rawRows
        newRows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.floor(snappedRows)))
      }

      const snapped = (direction === 'e' || direction === 'se') && Math.abs(rawCols - Math.round(rawCols)) < SNAP_THRESHOLD ||
                       (direction === 's' || direction === 'se') && Math.abs(rawRows - Math.round(rawRows)) < SNAP_THRESHOLD
      setIsSnapped(snapped)
      setPreviewSize({ columns: newCols, rows: newRows })

      if (newCols !== size.columns || newRows !== size.rows) {
        onResize({ columns: newCols, rows: newRows })
      }
    }

    const handleResizeUp = () => {
      setIsResizing(false)
      setPreviewSize(null)
      setIsSnapped(false)
      window.removeEventListener('pointermove', handleResizeMove)
      window.removeEventListener('pointerup', handleResizeUp)
    }

    window.addEventListener('pointermove', handleResizeMove)
    window.addEventListener('pointerup', handleResizeUp)
  }, [size, onResize])

  return (
    <article
      ref={cardRef}
      className={`canvas-card ${isDragging ? 'dragging' : ''} ${isHovered ? 'hovered' : ''} ${isResizing ? 'resizing' : ''} ${isSnapped ? 'snap-indicator' : ''}`}
      onMouseEnter={isMobile ? undefined : () => setIsHovered(true)}
      onMouseLeave={isMobile ? undefined : () => !isDragging && setIsHovered(false)}
      {...(isMobile ? longPress.handlers : {})}
      onDoubleClick={() => {
        if (!didDragRef.current && onOpenDetails) onOpenDetails()
      }}
      title={isMobile ? '长按打开详情' : '双击打开详情'}
      style={{
        gridColumn: `${displayPosition.x + 1} / span ${size.columns}`,
        gridRow: `${displayPosition.y + 1} / span ${size.rows}`,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'default',
        transition: isDragging ? 'none' : undefined,
        transform: isDragging
          ? `scale(1.03) translate(${dragOffset.x}px, ${dragOffset.y}px)`
          : undefined,
        opacity: isDragging ? 0.85 : undefined,
        zIndex: isDragging || isResizing ? 1000 : undefined,
        userSelect: 'none'
      }}
    >
      <div className="card-heading compact" onPointerDown={startDrag}>
        <span className="canvas-card-drag-indicator">⠿</span>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, flex: 1 }}>{title}</h3>
        {previewSize ? (
          <span className="resize-preview-pill">{sizeLabel(previewSize)}</span>
        ) : (
          <span className="pill">{sizeLabel(size)}</span>
        )}
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
      <p className="canvas-card-description">{description}</p>
      {children && <div className="canvas-card-content">{children}</div>}
      <div className="canvas-card-resize-handles">
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
