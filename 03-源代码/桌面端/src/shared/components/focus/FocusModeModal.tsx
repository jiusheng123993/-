import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { FocusModeUI } from '../../../../growth/focus-mode/FocusModeUI'

interface FocusModeModalProps {
  isOpen: boolean
  onClose: () => void
}

export const FocusModeModal: FC<FocusModeModalProps> = ({ isOpen, onClose }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="专注模式"
      subtitle="番茄钟 · 背景音 · 成长树"
      ariaLabel="专注模式"
    >
      <FocusModeUI onClose={onClose} />
    </AdaptiveModal>
  )
}
