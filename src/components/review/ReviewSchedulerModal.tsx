import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { ReviewSchedulerUI } from '../../review/ReviewSchedulerUI'

interface ReviewSchedulerModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  dataSource: 'local' | 'supabase'
}

export const ReviewSchedulerModal: FC<ReviewSchedulerModalProps> = ({
  isOpen,
  onClose,
  userId,
  dataSource,
}) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="复习提醒"
      subtitle="间隔重复，高效记忆"
      ariaLabel="复习提醒"
      width={800}
      height={600}
    >
      <ReviewSchedulerUI userId={userId} onClose={onClose} dataSource={dataSource} />
    </AdaptiveModal>
  )
}
