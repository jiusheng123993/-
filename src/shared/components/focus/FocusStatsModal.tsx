import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { FocusStatsUI } from '../../focusstats/FocusStatsUI'
import type { WorkspaceState } from '../../data/workspaceStore'

interface FocusStatsModalProps {
  isOpen: boolean
  onClose: () => void
  getWorkspaceState: () => WorkspaceState
}

export const FocusStatsModal: FC<FocusStatsModalProps> = ({ isOpen, onClose, getWorkspaceState }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="专注统计"
      subtitle="查看你的专注数据"
      ariaLabel="专注统计"
      width={800}
      height={600}
    >
      <FocusStatsUI getWorkspaceState={getWorkspaceState} />
    </AdaptiveModal>
  )
}
