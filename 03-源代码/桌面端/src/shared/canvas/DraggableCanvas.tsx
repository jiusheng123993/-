import { useCallback, useRef, useState } from 'react'
import { CanvasCard } from './CanvasCard'
import type { CanvasItem, Module, ModuleSize } from '../module-store/types'
import { moveModuleInLayout, resizeModuleInLayout } from '../module-store/moduleStoreLogic'

interface AlignLine {
  type: 'horizontal' | 'vertical'
  position: number
}

interface DraggableCanvasProps {
  items: CanvasItem[]
  modules: Module[]
  onItemsChange: (items: CanvasItem[]) => void
  onRemoveModule: (moduleId: string) => void
}

const ALIGN_THRESHOLD = 0.3

const computeAlignLines = (
  dragItemId: string,
  dragPosition: { x: number; y: number },
  dragSize: ModuleSize,
  allItems: CanvasItem[]
): AlignLine[] => {
  const lines: AlignLine[] = []
  const dragWidth = dragSize.columns
  const dragHeight = dragSize.rows

  const dragLeft = dragPosition.x
  const dragRight = dragPosition.x + dragWidth
  const dragTop = dragPosition.y
  const dragBottom = dragPosition.y + dragHeight
  const dragCenterX = dragPosition.x + dragWidth / 2
  const dragCenterY = dragPosition.y + dragHeight / 2

  for (const item of allItems) {
    if (item.moduleId === dragItemId) continue

    const itemWidth = item.size.columns
    const itemHeight = item.size.rows
    const itemLeft = item.position.x
    const itemRight = item.position.x + itemWidth
    const itemTop = item.position.y
    const itemBottom = item.position.y + itemHeight
    const itemCenterX = item.position.x + itemWidth / 2
    const itemCenterY = item.position.y + itemHeight / 2

    if (Math.abs(dragLeft - itemLeft) < ALIGN_THRESHOLD) {
      lines.push({ type: 'vertical', position: itemLeft })
    }
    if (Math.abs(dragRight - itemRight) < ALIGN_THRESHOLD) {
      lines.push({ type: 'vertical', position: itemRight })
    }
    if (Math.abs(dragLeft - itemRight) < ALIGN_THRESHOLD) {
      lines.push({ type: 'vertical', position: itemRight })
    }
    if (Math.abs(dragRight - itemLeft) < ALIGN_THRESHOLD) {
      lines.push({ type: 'vertical', position: itemLeft })
    }
    if (Math.abs(dragCenterX - itemCenterX) < ALIGN_THRESHOLD) {
      lines.push({ type: 'vertical', position: itemCenterX })
    }

    if (Math.abs(dragTop - itemTop) < ALIGN_THRESHOLD) {
      lines.push({ type: 'horizontal', position: itemTop })
    }
    if (Math.abs(dragBottom - itemBottom) < ALIGN_THRESHOLD) {
      lines.push({ type: 'horizontal', position: itemBottom })
    }
    if (Math.abs(dragTop - itemBottom) < ALIGN_THRESHOLD) {
      lines.push({ type: 'horizontal', position: itemBottom })
    }
    if (Math.abs(dragBottom - itemTop) < ALIGN_THRESHOLD) {
      lines.push({ type: 'horizontal', position: itemTop })
    }
    if (Math.abs(dragCenterY - itemCenterY) < ALIGN_THRESHOLD) {
      lines.push({ type: 'horizontal', position: itemCenterY })
    }
  }

  const seen = new Set<string>()
  return lines.filter((line) => {
    const key = `${line.type}-${line.position}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const DraggableCanvas = ({ items, modules, onItemsChange, onRemoveModule }: DraggableCanvasProps) => {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [alignLines, setAlignLines] = useState<AlignLine[]>([])
  const [dragSize, setDragSize] = useState<ModuleSize | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const moduleMap = new Map(modules.map((module) => [module.id, module]))

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id)
    const item = items.find((i) => i.moduleId === id)
    if (item) {
      setDragSize(item.size)
    }
  }, [items])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setAlignLines([])
    setDragSize(null)
  }, [])

  const handleDragMove = useCallback((gridPosition: { x: number; y: number }) => {
    if (!draggingId || !dragSize) return
    const lines = computeAlignLines(draggingId, gridPosition, dragSize, items)
    setAlignLines(lines)
  }, [draggingId, dragSize, items])

  const moveItem = (moduleId: string, position: { x: number; y: number }) => {
    const next = moveModuleInLayout({ availableModules: modules, activeModules: items, isStoreOpen: false }, moduleId, position)
    onItemsChange(next.activeModules)
  }

  const resizeItem = (moduleId: string, size: ModuleSize) => {
    const next = resizeModuleInLayout({ availableModules: modules, activeModules: items, isStoreOpen: false }, moduleId, size)
    onItemsChange(next.activeModules)
  }

  const renderAlignLines = () => {
    if (!canvasRef.current || alignLines.length === 0) return null

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const columnWidth = canvasRect.width / 4
    const rowHeight = 148
    const gap = 16
    const padding = 18

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 999
        }}
      >
        {alignLines.map((line, index) => {
          if (line.type === 'vertical') {
            const left = padding + line.position * columnWidth + (line.position > 0 ? gap / 2 : 0)
            return (
              <div
                key={`v-${index}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left,
                  width: 1,
                  borderLeft: '2px dashed var(--accent, #6366f1)',
                  opacity: 0.7
                }}
              />
            )
          }

          const top = padding + line.position * (rowHeight + gap)
          return (
            <div
              key={`h-${index}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top,
                height: 1,
                borderTop: '2px dashed var(--accent, #6366f1)',
                opacity: 0.7
              }}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div
      ref={canvasRef}
      className="draggable-canvas"
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gridAutoRows: 'minmax(132px, auto)',
        gap: '16px',
        padding: '18px',
        minHeight: 360,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: 'calc(25% - 12px) 148px'
      }}
    >
      {renderAlignLines()}
      {items.map((item) => {
        const module = moduleMap.get(item.moduleId)
        if (!module) return null
        return (
          <CanvasCard
            description={module.description}
            key={item.moduleId}
            onDragEnd={handleDragEnd}
            onDragMove={item.moduleId === draggingId ? handleDragMove : undefined}
            onDragStart={() => handleDragStart(item.moduleId)}
            onMove={(position) => moveItem(item.moduleId, position)}
            onRemove={() => onRemoveModule(item.moduleId)}
            onResize={(size) => resizeItem(item.moduleId, size)}
            position={item.position}
            size={item.size}
            title={module.title}
          />
        )
      })}
    </div>
  )
}
