import { useCallback, useState } from 'react'
import { CanvasCard } from './CanvasCard'
import type { CanvasItem, Module, ModuleSize } from '../module-store/types'
import { moveModuleInLayout, resizeModuleInLayout } from '../module-store/moduleStoreLogic'

interface DraggableCanvasProps {
  items: CanvasItem[]
  modules: Module[]
  onItemsChange: (items: CanvasItem[]) => void
  onRemoveModule: (moduleId: string) => void
}

export const DraggableCanvas = ({ items, modules, onItemsChange, onRemoveModule }: DraggableCanvasProps) => {
  const [, setDraggingId] = useState<string | null>(null)
  const moduleMap = new Map(modules.map((module) => [module.id, module]))

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
  }, [])

  const moveItem = (moduleId: string, position: { x: number; y: number }) => {
    const next = moveModuleInLayout({ availableModules: modules, activeModules: items, isStoreOpen: false }, moduleId, position)
    onItemsChange(next.activeModules)
  }

  const resizeItem = (moduleId: string, size: ModuleSize) => {
    const next = resizeModuleInLayout({ availableModules: modules, activeModules: items, isStoreOpen: false }, moduleId, size)
    onItemsChange(next.activeModules)
  }

  return (
    <div
      className="draggable-canvas"
      style={{
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
      {items.map((item) => {
        const module = moduleMap.get(item.moduleId)
        if (!module) return null
        return (
          <CanvasCard
            description={module.description}
            key={item.moduleId}
            onDragEnd={handleDragEnd}
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
