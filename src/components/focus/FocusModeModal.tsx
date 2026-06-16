import type { FC } from 'react'
import { FocusModeUI } from '../../focus-mode/FocusModeUI'

interface FocusModeModalProps {
  onClose: () => void
}

export const FocusModeModal: FC<FocusModeModalProps> = ({ onClose }) => {
  return <FocusModeUI onClose={onClose} />
}
