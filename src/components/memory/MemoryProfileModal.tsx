import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { MemoryContextPreview } from '../../memory/MemoryContextPreview'
import { MemoryProfileEditorUI } from '../../memory/MemoryProfileEditorUI'
import type { MemoryProfile } from '../../memory/memoryTypes'
import type { MemoryEvent } from '../../memory/memoryTypes'

interface MemoryProfileModalProps {
  isOpen: boolean
  profile: MemoryProfile
  events: MemoryEvent[]
  onClose: () => void
  onSave: (profile: MemoryProfile) => void
}

export const MemoryProfileModal: FC<MemoryProfileModalProps> = ({ isOpen, profile, events, onClose, onSave }) => (
  <AdaptiveModal
    isOpen={isOpen}
    onClose={onClose}
    title="了解你的独特风格"
    subtitle="Memory Profile · 记忆画像"
    ariaLabel="记忆画像"
  >
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
  </AdaptiveModal>
)
