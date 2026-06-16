import type { FC } from 'react'
import { DataBackupUI } from '../../data/DataBackupUI'

interface DataBackupModalProps {
  onClose: () => void
}

export const DataBackupModal: FC<DataBackupModalProps> = ({ onClose }) => {
  return <DataBackupUI onClose={onClose} />
}
