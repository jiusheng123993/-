import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { IdentitySelector } from '../../identity/IdentitySelector'

interface IdentitySelectorModalProps {
  isOpen: boolean
  onClose: () => void
}

export const IdentitySelectorModal: FC<IdentitySelectorModalProps> = ({ isOpen, onClose }) => (
  <AdaptiveModal
    isOpen={isOpen}
    onClose={onClose}
    title="身份管理"
    subtitle="Identity · 身份管理"
    ariaLabel="身份管理"
  >
    <IdentitySelector />
  </AdaptiveModal>
)
