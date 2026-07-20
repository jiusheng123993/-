import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'

interface MetricsDashboardModalProps {
  isOpen: boolean
  onClose: () => void
}

export const MetricsDashboardModal: FC<MetricsDashboardModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="记忆仪表盘"
      subtitle="记忆系统健康概览"
      ariaLabel="记忆仪表盘"
    >
      <div className="md-container">
        <div className="md-empty">
          <div className="md-empty-icon">📊</div>
          <p className="md-empty-title">功能精简中</p>
          <p className="md-empty-desc">记忆仪表盘模块正在重构，敬请期待</p>
        </div>
      </div>
    </AdaptiveModal>
  )
}
