import type { FC } from 'react'
import { SyncUI } from '../../data/SyncUI'

interface SyncModalProps {
  onClose: () => void
}

export const SyncModal: FC<SyncModalProps> = ({ onClose }) => {
  return <SyncUI onClose={onClose} />
}
