import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { PersonaSelectorUI } from '../../personas/PersonaSelectorUI'

interface PersonaSelectorModalProps {
  isOpen: boolean
  userId: string
  currentPersonaId: string | null
  onClose: () => void
  onSelect: (personaId: string) => void
}

export const PersonaSelectorModal: FC<PersonaSelectorModalProps> = ({ isOpen, userId, currentPersonaId, onClose, onSelect }) => (
  <AdaptiveModal
    isOpen={isOpen}
    onClose={onClose}
    title="选择适合你的 AI 伙伴"
    subtitle="Persona · 人格"
    ariaLabel="人格切换"
  >
    <PersonaSelectorUI
      userId={userId}
      currentPersonaId={currentPersonaId}
      onSelect={(personaId) => {
        onSelect(personaId)
        onClose()
      }}
    />
  </AdaptiveModal>
)
