import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { TemplateUI } from '../../templates/TemplateUI'

interface TemplateModalProps {
  isOpen: boolean
  onClose: () => void
}

export const TemplateModal: FC<TemplateModalProps> = ({ isOpen, onClose }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="模板中心"
      subtitle="管理你的任务模板"
      ariaLabel="模板中心"
      width={800}
      height={600}
    >
      <TemplateUI onClose={onClose} />
    </AdaptiveModal>
  )
}
