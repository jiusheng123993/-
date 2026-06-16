import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { FocusHistoryUI } from '../../focushistory/FocusHistoryUI'
import type { WorkspaceState } from '../../data/workspaceStore'

interface FocusHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  getWorkspaceState: () => WorkspaceState
}

export const FocusHistoryModal: FC<FocusHistoryModalProps> = ({ isOpen, onClose, getWorkspaceState }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="专注历史"
      subtitle="回顾你的专注历程"
      ariaLabel="专注历史"
      width={800}
      height={600}
    >
      <FocusHistoryUI getWorkspaceState={getWorkspaceState} />
    </AdaptiveModal>
  )
}
