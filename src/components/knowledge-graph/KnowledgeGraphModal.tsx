import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { KnowledgeGraphUI } from '../../knowledge-graph/KnowledgeGraphUI'

interface KnowledgeGraphModalProps {
  isOpen: boolean
  onClose: () => void
}

export const KnowledgeGraphModal: FC<KnowledgeGraphModalProps> = ({ isOpen, onClose }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="知识图谱"
      subtitle="可视化你的知识星系"
      ariaLabel="知识图谱"
      width={900}
      height={700}
    >
      <KnowledgeGraphUI onClose={onClose} />
    </AdaptiveModal>
  )
}
