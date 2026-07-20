import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { QuickNotesUI } from '../../quicknotes/QuickNotesUI'

interface QuickNotesModalProps {
  isOpen: boolean
  onClose: () => void
}

export const QuickNotesModal: FC<QuickNotesModalProps> = ({ isOpen, onClose }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="快速笔记"
      subtitle="随时记录灵感"
      ariaLabel="快速笔记"
      width={600}
      height={600}
    >
      <QuickNotesUI />
    </AdaptiveModal>
  )
}
