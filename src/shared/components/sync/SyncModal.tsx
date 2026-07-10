import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { SyncUI } from '../../data/SyncUI'

interface SyncModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SyncModal: FC<SyncModalProps> = ({ isOpen, onClose }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="云同步"
      subtitle="同步你的数据到云端"
      ariaLabel="云同步"
    >
      <SyncUI onClose={onClose} />
    </AdaptiveModal>
  )
}
