import type { FC } from 'react'
import { IdentitySelector } from '../../identity/IdentitySelector'

interface IdentitySelectorModalProps {
  onClose: () => void
}

export const IdentitySelectorModal: FC<IdentitySelectorModalProps> = ({ onClose }) => (
  <div className="membership-modal-backdrop" onClick={onClose} role="presentation">
    <section
      aria-modal="true"
      className="membership-modal"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-label="身份管理"
      style={{ maxWidth: 600 }}
    >
      <header className="membership-modal-hero">
        <div className="membership-modal-hero-text">
          <p className="eyebrow">Identity · 身份管理</p>
          <h2>身份管理</h2>
        </div>
        <button className="membership-modal-close" aria-label="关闭身份管理" onClick={onClose} type="button">×</button>
      </header>
      <div className="membership-modal-content">
        <IdentitySelector />
      </div>
    </section>
  </div>
)
