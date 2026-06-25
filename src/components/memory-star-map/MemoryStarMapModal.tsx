import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { MemoryStarMapUI } from '../../memory-star-map/MemoryStarMapUI'

interface MemoryStarMapModalProps {
  isOpen: boolean
  onClose: () => void
}

export const MemoryStarMapModal: FC<MemoryStarMapModalProps> = ({ isOpen, onClose }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="记忆星图"
      subtitle="可视化你的记忆星系"
      ariaLabel="记忆星图"
      width={900}
      height={700}
    >
      <MemoryStarMapUI onClose={onClose} />
    </AdaptiveModal>
  )
}
