import { useState } from 'react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [activeSection, setActiveSection] = useState<string>('identity')

  const sections = [
    { id: 'identity', label: '身份切换', icon: 'User' },
    { id: 'modules', label: '模块商店', icon: 'Grid' },
    { id: 'ai', label: 'AI 助手', icon: 'Bot' },
    { id: 'settings', label: '设置', icon: 'Settings' },
    { id: 'theme', label: '主题切换', icon: 'Palette' }
  ]

  return (
    <>
      <aside
        className={`sidebar ${isOpen ? 'open' : 'closed'}`}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '280px',
          height: '100vh',
          background: 'var(--surface)',
          backdropFilter: 'blur(20px)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          padding: '24px',
          boxShadow: isOpen ? '4px 0 24px rgba(0, 0, 0, 0.08)' : 'none'
        }}
      >
        <div className="sidebar-header" style={{ marginBottom: '32px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>星寰海 Sidebar</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--muted)' }}>AI 个人空间</p>
        </div>

        <nav className="sidebar-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: activeSection === section.id ? 'var(--primary)' : 'transparent',
                color: activeSection === section.id ? '#fff' : 'var(--text)',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: '4px'
              }}
            >
              <span>{section.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '24px' }}>
          <button
            className="layout-lock-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            <span>🔒</span>
            <span>锁定布局</span>
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onToggle}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.3)',
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
