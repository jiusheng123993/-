interface SidebarToggleProps {
  isOpen: boolean
  onToggle: () => void
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({ isOpen, onToggle }) => {
  return (
    <button
      className="sidebar-toggle"
      onClick={onToggle}
      style={{
        position: 'fixed',
        left: isOpen ? '280px' : '16px',
        top: '16px',
        zIndex: 1001,
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        border: 'none',
        background: 'var(--surface)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <span style={{ fontSize: '20px' }}>{isOpen ? '✕' : '☰'}</span>
    </button>
  )
}
