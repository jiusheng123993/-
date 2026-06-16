import type { FC } from 'react'
import { SupabaseConfigUI } from '../../settings/SupabaseConfigUI'

interface SupabaseConfigModalProps {
  onConfigured: () => void
  onBack: () => void
}

export const SupabaseConfigModal: FC<SupabaseConfigModalProps> = ({ onConfigured, onBack }) => {
  return <SupabaseConfigUI onConfigured={onConfigured} onBack={onBack} />
}
