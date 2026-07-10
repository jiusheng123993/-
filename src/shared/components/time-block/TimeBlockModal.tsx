import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { TimeBlockUI } from '../../timeblock/TimeBlockUI'

interface TimeBlockModalProps {
  isOpen: boolean
  onClose: () => void
}

export const TimeBlockModal: FC<TimeBlockModalProps> = ({ isOpen, onClose }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="时间块"
      subtitle="规划你的时间"
      ariaLabel="时间块"
      width={600}
      height={600}
    >
      <TimeBlockUI />
    </AdaptiveModal>
  )
}
