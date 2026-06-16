import type { FC } from 'react'
import { AdminConsolePage } from './AdminConsolePage'

interface AdminConsoleModalProps {
  onClose: () => void
}

export const AdminConsoleModal: FC<AdminConsoleModalProps> = ({ onClose }) => (
  <div className="membership-modal-backdrop" onClick={onClose} role="presentation">
    <section
      aria-modal="true"
      className="membership-modal"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-label="管理后台"
      style={{ maxWidth: 900 }}
    >
      <header className="membership-modal-hero">
        <div className="membership-modal-hero-text">
          <p className="eyebrow">Admin Console · 管理后台</p>
          <h2>商品配置与权益管理</h2>
        </div>
        <button className="membership-modal-close" onClick={onClose} type="button" aria-label="关闭管理后台">
          ×
        </button>
      </header>
      <div className="membership-modal-content">
        <AdminConsolePage onClose={onClose} />
      </div>
    </section>
  </div>
)
