import type { FC } from 'react'
import { PersonaSelectorUI } from '../../personas/PersonaSelectorUI'

interface PersonaSelectorModalProps {
  userId: string
  currentPersonaId: string
  onClose: () => void
  onSelect: (personaId: string) => void
}

export const PersonaSelectorModal: FC<PersonaSelectorModalProps> = ({ userId, currentPersonaId, onClose, onSelect }) => (
  <div className="membership-modal-backdrop" onClick={onClose} role="presentation">
    <section
      aria-modal="true"
      className="membership-modal"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-label="人格切换"
      style={{ maxWidth: 600 }}
    >
      <header className="membership-modal-hero">
        <div className="membership-modal-hero-text">
          <p className="eyebrow">Persona · 人格</p>
          <h2>选择适合你的 AI 伙伴</h2>
        </div>
        <button className="membership-modal-close" onClick={onClose} type="button" aria-label="关闭人格选择">
          ×
        </button>
      </header>
      <div className="membership-modal-content">
        <PersonaSelectorUI
          userId={userId}
          currentPersonaId={currentPersonaId}
          onSelect={(personaId) => {
            onSelect(personaId)
            onClose()
          }}
        />
      </div>
    </section>
  </div>
)
