import { useCallback, useRef, useState, useEffect, type ReactNode } from 'react'

interface FullScreenModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  ariaLabel: string
  children: ReactNode
  className?: string
}

const SWIPE_THRESHOLD = 80

export const FullScreenModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  ariaLabel,
  children,
  className = ''
}: FullScreenModalProps) => {
  const [translateY, setTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartRef = useRef<{ y: number; translateY: number } | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setTranslateY(0)
    }
  }, [isOpen])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop > 0) return
    setIsDragging(true)
    touchStartRef.current = {
      y: e.touches[0].clientY,
      translateY
    }
  }, [translateY])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !touchStartRef.current) return
    const deltaY = e.touches[0].clientY - touchStartRef.current.y
    setTranslateY(Math.max(0, touchStartRef.current.translateY + deltaY))
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    touchStartRef.current = null
    if (translateY > SWIPE_THRESHOLD) {
      onClose()
      setTranslateY(0)
    } else {
      setTranslateY(0)
    }
  }, [translateY, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fullscreen-modal-backdrop"
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end'
      }}
    >
      <section
        aria-modal="true"
        className={`fullscreen-modal ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={ariaLabel}
        style={{
          width: '100%',
          maxHeight: '92vh',
          background: 'var(--surface)',
          borderRadius: '20px 20px 0 0',
          display: 'flex',
          flexDirection: 'column',
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            padding: '16px 20px 12px',
            borderBottom: '1px solid var(--border)',
            cursor: 'grab',
            userSelect: 'none'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              background: 'var(--border)',
              margin: '0 auto 12px'
            }}
          />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{title}</h2>
          {subtitle && (
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }}>
              {subtitle}
            </p>
          )}
          <button
            onClick={onClose}
            type="button"
            aria-label="关闭"
            style={{
              position: 'absolute',
              top: '16px',
              right: '20px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'var(--surface-elevated)',
              color: 'var(--text)',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
        <div
          ref={contentRef}
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px 20px 24px',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {children}
        </div>
      </section>
    </div>
  )
}
