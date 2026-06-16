import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { GlobalSearchUI } from '../../globalsearch/GlobalSearchUI'
import type { WorkspaceState } from '../../data/workspaceStore'
import type { StudyState } from '../../study/studyTypes'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  getWorkspaceState: () => WorkspaceState
  getStudyState: () => StudyState
  getHabitState: () => Record<string, unknown>
  getFinanceState: () => Record<string, unknown>
  getReadingState: () => Record<string, unknown>
  getJournalState: () => Record<string, unknown>
  getGoalsState: () => Record<string, unknown>
  getProjectState: () => Record<string, unknown>
}

export const GlobalSearchModal: FC<GlobalSearchModalProps> = ({ isOpen, onClose, ...getters }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="全局搜索"
      subtitle="搜索你的所有数据"
      ariaLabel="全局搜索"
      width={700}
      height={600}
    >
      <GlobalSearchUI {...getters} />
    </AdaptiveModal>
  )
}
