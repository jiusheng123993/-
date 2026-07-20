import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { ReportUI } from '../../report/ReportUI'
import type { WorkspaceState } from '../../data/workspaceStore'
import type { StudyState } from '../../study/studyTypes'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  getWorkspaceState: () => WorkspaceState
  getStudyState: () => StudyState
  getHabitState: () => Record<string, unknown>
  getFinanceState: () => Record<string, unknown>
  getReadingState: () => Record<string, unknown>
  getWellnessState: () => Record<string, unknown>
  getJournalState: () => Record<string, unknown>
}

export const ReportModal: FC<ReportModalProps> = ({ isOpen, onClose, ...getters }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="数据报告"
      subtitle="查看你的成长数据报告"
      ariaLabel="数据报告"
      width={800}
      height={700}
    >
      <ReportUI {...getters} />
    </AdaptiveModal>
  )
}
