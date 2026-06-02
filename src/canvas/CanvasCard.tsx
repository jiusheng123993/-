import { useState } from 'react'
import type { ModuleSize } from '../module-store/types'

interface CanvasCardProps {
  title: string
  description: string
  size: ModuleSize
  onDragStart: () => void
  onDragEnd: () => void
  onClick: () => void
  onDoubleClick: () => void
}

export const CanvasCard: React.FC<CanvasCardProps> = ({
  title,
  description,
  size,
  onDragStart,
  onDragEnd,
  onClick,
  onDoubleClick
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-1',
    large: 'col-span-2 row-span-2',
    'full-width': 'col-span-1 row-span-2'
  }

  return (
    <div
      className={`canvas-card ${sizeClasses[size]} ${isDragging ? 'dragging' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseDown={() => {
        setIsDragging(true)
        onDragStart()
      }}
      onMouseUp={() => {
        setIsDragging(false)
        onDragEnd()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{
        background: 'var(--surface)',
        borderRadius: '16px',
        padding: '16px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isDragging
          ? '0 12px 32px rgba(0, 0, 0, 0.16)'
          : isHovered
            ? '0 8px 24px rgba(0, 0, 0, 0.12)'
            : '0 2px 8px rgba(0, 0, 0, 0.08)',
        transform: isDragging ? 'scale(1.02)' : isHovered ? 'translateY(-4px)' : 'none',
        opacity: isDragging ? 0.8 : 1
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>{description}</p>
    </div>
  )
}
