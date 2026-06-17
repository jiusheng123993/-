import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { AdminConsolePage } from './AdminConsolePage'

interface AdminConsoleModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AdminConsoleModal: FC<AdminConsoleModalProps> = ({ isOpen, onClose }) => (
  <AdaptiveModal
    isOpen={isOpen}
    onClose={onClose}
    title="商品配置与权益管理"
    subtitle="Admin Console · 管理后台"
    ariaLabel="管理后台"
  >
    <AdminConsolePage onClose={onClose} />
  </AdaptiveModal>
)
