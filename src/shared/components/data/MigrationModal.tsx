import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { MigrationUI } from '../../data/migration/MigrationUI'

interface MigrationModalProps {
  isOpen: boolean
  onClose: () => void
  dataSource: string
  userId: string
  addToast: (toast: { type: string; title: string; message: string }) => void
  onNavigateToSupabase: () => void
}

export const MigrationModal: FC<MigrationModalProps> = ({
  isOpen,
  onClose,
  dataSource,
  userId,
  addToast,
  onNavigateToSupabase,
}) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="数据迁移"
      subtitle="将本地数据迁移到云端"
      ariaLabel="数据迁移"
      width={600}
      height={500}
    >
      {dataSource !== 'supabase' ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ marginBottom: 16, color: 'var(--muted)' }}>
            数据迁移需要先配置 Supabase 云端数据库连接。
          </p>
          <button
            onClick={() => {
              onClose()
              onNavigateToSupabase()
            }}
            style={{
              padding: '10px 24px',
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 15
            }}
          >
            前往配置 Supabase
          </button>
        </div>
      ) : (
        <MigrationUI
          userId={userId}
          onComplete={() => {
            onClose()
            addToast({ type: 'success', title: '迁移完成', message: '数据已成功迁移' })
          }}
        />
      )}
    </AdaptiveModal>
  )
}
