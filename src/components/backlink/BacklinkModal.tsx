import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { BacklinkPanel } from '../../backlink/BacklinkPanel'

interface BacklinkModalProps {
  isOpen: boolean
  onClose: () => void
}

export const BacklinkModal: FC<BacklinkModalProps> = ({ isOpen, onClose }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="双向链接"
      subtitle="查看笔记之间的关联"
      ariaLabel="双向链接"
      width={800}
      height={600}
    >
      <BacklinkPanel onClose={onClose} />
    </AdaptiveModal>
  )
}
