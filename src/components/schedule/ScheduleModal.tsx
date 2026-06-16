import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { ScheduleUI } from '../../schedule/ScheduleUI'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ScheduleModal: FC<ScheduleModalProps> = ({ isOpen, onClose }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="日程管理"
      subtitle="安排你的时间"
      ariaLabel="日程管理"
      width={800}
      height={600}
    >
      <ScheduleUI onClose={onClose} />
    </AdaptiveModal>
  )
}
