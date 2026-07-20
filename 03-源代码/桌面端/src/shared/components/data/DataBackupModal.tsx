import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { DataBackupUI } from '../../data/DataBackupUI'

interface DataBackupModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DataBackupModal: FC<DataBackupModalProps> = ({ isOpen, onClose }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="数据备份"
      subtitle="备份与恢复你的数据"
      ariaLabel="数据备份"
    >
      <DataBackupUI onClose={onClose} />
    </AdaptiveModal>
  )
}
