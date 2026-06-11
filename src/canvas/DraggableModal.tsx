import { useCallback, useRef, useState, type ReactNode } from 'react'

interface DraggableModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  ariaLabel: string
  children: ReactNode
  className?: string
}

const MIN_WIDTH = 480
const MIN_HEIGHT = 360
const DEFAULT_WIDTH = 1100
const DEFAULT_HEIGHT = 700
const MAXIMIZED_PADDING = 16

export const DraggableModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  ariaLabel,
  children,
  className = ''
}: DraggableModalProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [modalSize, setModalSize] = useState<{ width: number; height: number } | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const savedStateRef = useRef<{ position: { x: number; y: number }; size: { width: number; height: number } | null } | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null)
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  const modalRef = useRef<HTMLElement>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!modalRef.current) return
    if (isMaximized) return
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    }
  }, [position, isMaximized])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return
    const deltaX = e.clientX - dragStartRef.current.x
    const deltaY = e.clientY - dragStartRef.current.y
    setPosition({
      x: dragStartRef.current.posX + deltaX,
      y: dragStartRef.current.posY + deltaY
    })
  }, [isDragging])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    dragStartRef.current = null
  }, [])

  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!modalRef.current || isMaximized) return

    const rect = modalRef.current.getBoundingClientRect()
    setIsResizing(true)
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height
    }

    const handleMove = (moveEvent: PointerEvent) => {
      if (!resizeStartRef.current) return
      const deltaX = moveEvent.clientX - resizeStartRef.current.x
      const deltaY = moveEvent.clientY - resizeStartRef.current.y
      setModalSize({
        width: Math.max(MIN_WIDTH, resizeStartRef.current.width + deltaX),
        height: Math.max(MIN_HEIGHT, resizeStartRef.current.height + deltaY)
      })
    }

    const handleUp = () => {
      setIsResizing(false)
      resizeStartRef.current = null
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }, [isMaximized])

  const handleMaximize = useCallback(() => {
    if (isMaximized) {
      const saved = savedStateRef.current
      if (saved) {
        setPosition(saved.position)
        setModalSize(saved.size)
      }
      savedStateRef.current = null
      setIsMaximized(false)
    } else {
      savedStateRef.current = {
        position: { ...position },
        size: modalSize ? { ...modalSize } : null
      }
      setPosition({ x: 0, y: 0 })
      setModalSize({
        width: window.innerWidth - MAXIMIZED_PADDING * 2,
        height: window.innerHeight - MAXIMIZED_PADDING * 2
      })
      setIsMaximized(true)
    }
  }, [isMaximized, position, modalSize])

  const handleHeaderDoubleClick = useCallback(() => {
    handleMaximize()
  }, [handleMaximize])

  if (!isOpen) return null

  const currentWidth = modalSize ? modalSize.width : DEFAULT_WIDTH
  const currentHeight = modalSize ? modalSize.height : DEFAULT_HEIGHT

  return (
    <div
      className="theme-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <section
        ref={modalRef}
        aria-modal="true"
        className={`theme-modal workbench-detail-modal ${isMaximized ? 'modal-maximized' : ''} ${className}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label={ariaLabel}
        style={{
          transform: isMaximized ? 'none' : `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging || isResizing ? 'none' : 'transform 0.2s ease, width 0.25s ease, height 0.25s ease',
          cursor: isDragging ? 'grabbing' : undefined,
          width: `${currentWidth}px`,
          height: `${currentHeight}px`,
          maxWidth: isMaximized ? 'none' : (modalSize ? '9999px' : undefined),
          maxHeight: isMaximized ? 'none' : (modalSize ? '9999px' : undefined),
          borderRadius: isMaximized ? '0' : undefined
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <header
          className="theme-modal-hero"
          onPointerDown={handlePointerDown}
          onDoubleClick={handleHeaderDoubleClick}
        >
          <div className="theme-modal-hero-text">
            <p className="eyebrow">Workbench Detail · 按需加载</p>
            <h2>{title}</h2>
            {subtitle && <small>{subtitle}</small>}
          </div>
          <button
            className="theme-modal-maximize"
            onClick={handleMaximize}
            type="button"
            aria-label={isMaximized ? '还原窗口' : '最大化窗口'}
            title={isMaximized ? '还原' : '最大化'}
          >
            {isMaximized ? '🗗' : '🗖'}
          </button>
          <button
            className="theme-modal-close"
            onClick={onClose}
            type="button"
            aria-label="关闭工作台详情"
          >
            ×
          </button>
        </header>
        {children}
        {!isMaximized && (
          <div
            className="modal-resize-handle"
            onPointerDown={handleResizePointerDown}
          />
        )}
      </section>
    </div>
  )
}
