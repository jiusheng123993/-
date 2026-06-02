import { useState, useCallback } from 'react'
import { CanvasCard } from './CanvasCard'
import type { CanvasItem } from '../module-store/types'

interface DraggableCanvasProps {
  items: CanvasItem[]
  onItemsChange: (items: CanvasItem[]) => void
}

export const DraggableCanvas: React.FC<DraggableCanvasProps> = ({ items }) => {
  const [, setDraggingId] = useState<string | null>(null)

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
  }, [])

  return (
    <div
      className="draggable-canvas"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        padding: '24px',
        minHeight: '100vh'
      }}
    >
      {items.map(item => (
        <CanvasCard
          key={item.moduleId}
          title={item.moduleId}
          description="Module description"
          size={item.size}
          onDragStart={() => handleDragStart(item.moduleId)}
          onDragEnd={handleDragEnd}
          onClick={() => {}}
          onDoubleClick={() => {}}
        />
      ))}
    </div>
  )
}
