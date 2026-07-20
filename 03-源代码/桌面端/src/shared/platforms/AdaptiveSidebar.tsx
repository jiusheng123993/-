import { type ReactNode, useCallback, useState } from 'react'
import { usePlatform } from './usePlatform'

interface AdaptiveSidebarProps {
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}

const SIDEBAR_WIDTH_DESKTOP = '280px'
const SIDEBAR_WIDTH_MOBILE = '85vw'
const MAX_SIDEBAR_WIDTH_MOBILE = '320px'

export function AdaptiveSidebar({ isOpen, onToggle, children }: AdaptiveSidebarProps) {
  const { deviceCategory } = usePlatform()
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const isMobile = deviceCategory === 'mobile'
  const sidebarWidth = isMobile ? SIDEBAR_WIDTH_MOBILE : SIDEBAR_WIDTH_DESKTOP
  const maxWidth = isMobile ? MAX_SIDEBAR_WIDTH_MOBILE : SIDEBAR_WIDTH_DESKTOP

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return
    setTouchStartX(e.touches[0].clientX)
  }, [isMobile])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || touchStartX === null) return
    const deltaX = e.touches[0].clientX - touchStartX
    if (deltaX > 100 && isOpen) {
      onToggle()
      setTouchStartX(null)
    }
  }, [isMobile, touchStartX, isOpen, onToggle])

  const handleTouchEnd = useCallback(() => {
    setTouchStartX(null)
  }, [])

  return (
    <>
      <aside
        className={`sidebar ${isOpen ? 'open' : 'closed'}`}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: isMobile ? 'auto' : sidebarWidth,
          maxWidth: isMobile ? maxWidth : undefined,
          right: isMobile ? 0 : 'auto',
          height: '100vh',
          background: 'var(--surface)',
          backdropFilter: 'blur(20px)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          padding: isMobile ? '16px' : '24px',
          boxShadow: isOpen ? (isMobile ? '-4px 0 24px rgba(0, 0, 0, 0.15)' : '4px 0 24px rgba(0, 0, 0, 0.08)') : 'none',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: isMobile ? '0 16px 16px 0' : '0'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </aside>

      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onToggle}
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, isMobile ? 0.4 : 0.3)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      )}
    </>
  )
}
