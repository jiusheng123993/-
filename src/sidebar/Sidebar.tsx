import { useState } from 'react'
import { IdentitySelector } from '../identity/IdentitySelector'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  onOpenModuleStore: () => void
  onOpenAIRecommendation: () => void
  onOpenLayoutShare: () => void
  onOpenThemePicker: () => void
  onOpenMembership: () => void
  onOpenIdentitySelector: () => void
  onSwitchDevAuthRole: () => void
  devAuthLabel: string
  currentThemeName: string
  membershipTier: string
  aiQuota: number
  streakDays: number
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle,
  onOpenModuleStore,
  onOpenAIRecommendation,
  onOpenLayoutShare,
  onOpenThemePicker,
  onOpenMembership,
  onOpenIdentitySelector,
  onSwitchDevAuthRole,
  devAuthLabel,
  currentThemeName,
  membershipTier,
  aiQuota,
  streakDays
}) => {
  const [activeSection, setActiveSection] = useState<string>('identity')

  const sections = [
    { id: 'identity', label: '身份切换', icon: 'User' },
    { id: 'modules', label: '模块商店', icon: 'Grid' },
    { id: 'ai', label: 'AI 助手', icon: 'Bot' },
    { id: 'settings', label: '设置', icon: 'Settings' },
    { id: 'theme', label: '主题切换', icon: 'Palette' }
  ]

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId)
    
    switch (sectionId) {
      case 'modules':
        onOpenModuleStore()
        break
      case 'ai':
        onOpenAIRecommendation()
        break
      case 'theme':
        onOpenThemePicker()
        break
    }
  }

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
          boxShadow: isOpen ? '4px 0 24px rgba(0, 0, 0, 0.08)' : 'none',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="sidebar-header" style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>星寰海</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--muted)' }}>AI 个人空间</p>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <span 
            style={{ 
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              color: '#fff'
            }}
          >
            {membershipTier}
          </span>
          <span 
            style={{ 
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-elevated)',
              color: 'var(--text)'
            }}
          >
            AI {aiQuota}
          </span>
          <span 
            style={{ 
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-elevated)',
              color: 'var(--text)'
            }}
          >
            连续 {streakDays} 天
          </span>
        </div>

        <nav className="sidebar-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => handleSectionClick(section.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeSection === section.id ? 'var(--primary)' : 'transparent',
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

        <div style={{ flex: 1, overflow: 'auto', marginTop: '16px' }}>
          {activeSection === 'identity' && <IdentitySelector />}
          
          {activeSection === 'settings' && (
            <div style={{ padding: '8px 0' }}>
              <button
                onClick={onOpenMembership}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}
              >
                <span>👑</span>
                <span>会员中心</span>
              </button>
              <button
                onClick={onOpenLayoutShare}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}
              >
                <span>📤</span>
                <span>布局分享</span>
              </button>
              <button
                onClick={onOpenIdentitySelector}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}
              >
                <span>✨</span>
                <span>创建身份</span>
              </button>
              <button
                onClick={onSwitchDevAuthRole}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                <span>🔑</span>
                <span>{devAuthLabel}</span>
              </button>
            </div>
          )}
        </div>

        <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--surface-elevated)',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '14px' }}>🎨</span>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>当前主题：</span>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{currentThemeName}</span>
          </div>
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
              backgroundColor: 'transparent',
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
