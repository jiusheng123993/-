import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { CycleTracker } from '../../../growth/cycle/CycleTracker'

interface CycleTrackerModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CycleTrackerModal: FC<CycleTrackerModalProps> = ({ isOpen, onClose }) => (
  <AdaptiveModal
    isOpen={isOpen}
    onClose={onClose}
    title="了解你的身体节奏"
    subtitle="Cycle Tracker · 周期追踪"
    ariaLabel="周期追踪"
  >
    <CycleTracker />
  </AdaptiveModal>
)
