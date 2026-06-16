import type { FC } from 'react'
import { AvatarManager } from '../../avatar/AvatarManager'

interface AvatarManagerModalProps {
  userId: string
  onClose: () => void
  onAvatarSelect: (avatarId: string) => void
}

export const AvatarManagerModal: FC<AvatarManagerModalProps> = ({ userId, onClose, onAvatarSelect }) => (
  <div className="membership-modal-backdrop" onClick={onClose} role="presentation">
    <section
      aria-modal="true"
      className="membership-modal"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-label="我的角色"
      style={{ maxWidth: 900 }}
    >
      <header className="membership-modal-hero">
        <div className="membership-modal-hero-text">
          <p className="eyebrow">Avatar Manager · 我的角色</p>
          <h2>创建你的 3D 角色</h2>
        </div>
        <button className="membership-modal-close" onClick={onClose} type="button" aria-label="关闭角色管理">
          ×
        </button>
      </header>
      <div className="membership-modal-content">
        <AvatarManager
          userId={userId}
          onAvatarSelect={onAvatarSelect}
        />
      </div>
    </section>
  </div>
)
