import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { AvatarManager } from '../../../ai-partner/avatar/AvatarManager'

interface AvatarManagerModalProps {
  isOpen: boolean
  userId: string
  onClose: () => void
  onAvatarSelect: (avatarId: string) => void
}

export const AvatarManagerModal: FC<AvatarManagerModalProps> = ({ isOpen, userId, onClose, onAvatarSelect }) => (
  <AdaptiveModal
    isOpen={isOpen}
    onClose={onClose}
    title="创建你的 3D 角色"
    subtitle="Avatar Manager · 我的角色"
    ariaLabel="我的角色"
  >
    <AvatarManager
      userId={userId}
      onAvatarSelect={onAvatarSelect}
    />
  </AdaptiveModal>
)
