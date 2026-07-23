import { usePlatform } from '../platforms'

interface SidebarToggleProps {
  isOpen: boolean
  onToggle: () => void
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({ isOpen, onToggle }) => {
  const { deviceCategory } = usePlatform()
  const isMobile = deviceCategory === 'mobile'

  return (
    <button
      aria-label={isOpen ? '关闭侧边栏' : '打开侧边栏'}
      className="sidebar-toggle"
      onClick={onToggle}
      style={{
        position: 'fixed',
        left: isOpen ? (isMobile ? '85%' : '280px') : (isMobile ? '8px' : '16px'),
        top: isMobile ? '12px' : '16px',
        zIndex: 1001,
        width: isMobile ? '44px' : '40px',
        height: isMobile ? '44px' : '40px',
        borderRadius: isMobile ? '50%' : '12px',
        border: 'none',
        background: isMobile ? 'var(--primary)' : 'var(--surface)',
        boxShadow: isMobile
          ? '0 4px 16px rgba(0, 0, 0, 0.2)'
          : '0 2px 8px rgba(0, 0, 0, 0.08)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        color: isMobile ? '#fff' : undefined
      }}
    >
      <span style={{ fontSize: isMobile ? '22px' : '20px' }}>{isOpen ? '✕' : '☰'}</span>
    </button>
  )
}
