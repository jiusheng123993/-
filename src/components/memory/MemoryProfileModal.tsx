import type { FC } from 'react'
import { MemoryContextPreview } from '../../memory/MemoryContextPreview'
import { MemoryProfileEditorUI } from '../../memory/MemoryProfileEditorUI'
import type { MemoryProfile } from '../../memory/memoryTypes'
import type { MemoryEvent } from '../../memory/memoryTypes'

interface MemoryProfileModalProps {
  profile: MemoryProfile
  events: MemoryEvent[]
  onClose: () => void
  onSave: (profile: MemoryProfile) => void
}

export const MemoryProfileModal: FC<MemoryProfileModalProps> = ({ profile, events, onClose, onSave }) => (
  <div className="membership-modal-backdrop" onClick={onClose} role="presentation">
    <section
      aria-modal="true"
      className="membership-modal"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-label="记忆画像"
      style={{ maxWidth: 800 }}
    >
      <header className="membership-modal-hero">
        <div className="membership-modal-hero-text">
          <p className="eyebrow">Memory Profile · 记忆画像</p>
          <h2>了解你的独特风格</h2>
        </div>
        <button className="membership-modal-close" onClick={onClose} type="button" aria-label="关闭记忆画像">
          ×
        </button>
      </header>
      <div className="membership-modal-content">
        <MemoryContextPreview
          profile={profile}
          events={events}
          mode="chat"
        />
        <MemoryProfileEditorUI
          profile={profile}
          onSave={(p) => {
            onSave(p)
            onClose()
          }}
          onCancel={onClose}
        />
      </div>
    </section>
  </div>
)
