import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { SupabaseConfigUI } from '../../settings/SupabaseConfigUI'

interface SupabaseConfigModalProps {
  isOpen: boolean
  onConfigured: () => void
  onBack: () => void
}

export const SupabaseConfigModal: FC<SupabaseConfigModalProps> = ({ isOpen, onConfigured, onBack }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onBack}
      title="Supabase 配置"
      subtitle="配置云同步数据库"
      ariaLabel="Supabase 配置"
    >
      <SupabaseConfigUI onConfigured={onConfigured} onBack={onBack} />
    </AdaptiveModal>
  )
}
