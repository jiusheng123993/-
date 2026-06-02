import { useState } from 'react'
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
  onResize
}: CanvasCardProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const meta = sizeMeta[size]

  return (
    <article
      className={`canvas-card ${isDragging ? 'dragging' : ''} ${isHovered ? 'hovered' : ''}`}
      draggable
      onDragStart={() => {
        setIsDragging(true)
        onDragStart()
      }}
      onDragEnd={() => {
        setIsDragging(false)
        onDragEnd()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        gridColumn: `${position.x + 1} / span ${meta.columns}`,
        gridRow: `${position.y + 1} / span ${meta.rows}`,
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
      <div className="card-heading compact">
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{title}</h3>
        <span className="pill">{meta.label}</span>
      </div>
      <p style={{ margin: '8px 0 12px', fontSize: '14px', color: 'var(--muted)' }}>{description}</p>
      <div className="module-store-item-actions">
        <button className="module-store-btn module-store-btn-remove" onClick={() => onMove({ x: position.x - 1, y: position.y })} type="button">←</button>
        <button className="module-store-btn module-store-btn-remove" onClick={() => onMove({ x: position.x + 1, y: position.y })} type="button">→</button>
        <button className="module-store-btn module-store-btn-remove" onClick={() => onMove({ x: position.x, y: position.y + 1 })} type="button">↓</button>
        <select aria-label={`${title} 模块尺寸`} onChange={(event) => onResize(event.target.value as ModuleSize)} value={size}>
          {Object.entries(sizeMeta).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
        </select>
        <button className="module-store-btn module-store-btn-delete" onClick={onRemove} type="button">移除</button>
      </div>
    </article>
  )
}
