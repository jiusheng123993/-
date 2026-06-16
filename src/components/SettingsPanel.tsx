import React from 'react'

interface SettingsPanelProps {
  onClose: () => void
  onOpenMembership: () => void
  onOpenDataBackup: () => void
  onOpenApiKeySettings: () => void
  onOpenSupabaseConfig: () => void
  onOpenMigration: () => void
}

const settingsItems = [
  { icon: '👑', label: '会员中心', desc: '查看/升级会员', onClick: 'membership' as const },
  { icon: '💾', label: '数据管理', desc: '备份与恢复', onClick: 'dataBackup' as const },
  { icon: '🔑', label: 'AI 服务配置', desc: '配置 API Key', onClick: 'apiKey' as const },
  { icon: '☁️', label: '数据源配置', desc: '本地/云端存储', onClick: 'supabase' as const },
  { icon: '📦', label: '数据迁移', desc: '迁移工具', onClick: 'migration' as const },
]

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onClose,
  onOpenMembership,
  onOpenDataBackup,
  onOpenApiKeySettings,
  onOpenSupabaseConfig,
  onOpenMigration,
}) => {
  const handleClick = (item: typeof settingsItems[number]) => {
    switch (item.onClick) {
      case 'membership':
        onOpenMembership()
        break
      case 'dataBackup':
        onOpenDataBackup()
        break
      case 'apiKey':
        onOpenApiKeySettings()
        break
      case 'supabase':
        onOpenSupabaseConfig()
        break
      case 'migration':
        onOpenMigration()
        break
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '20px',
          padding: '32px',
          width: '420px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>⚙️ 设置</h2>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--surface-elevated)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            type="button"
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {settingsItems.map((item) => (
            <button
              key={item.onClick}
              onClick={() => handleClick(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                width: '100%',
                padding: '16px 20px',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                background: 'var(--surface-elevated)',
                color: 'var(--text)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
              }}
              type="button"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: '24px', flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '2px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  {item.desc}
                </div>
              </div>
              <span style={{ color: 'var(--muted)', fontSize: '14px' }}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
