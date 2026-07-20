import type { FC } from 'react'

interface MetricsDashboardUIProps {
  onClose?: () => void
}

export const MetricsDashboardUI: FC<MetricsDashboardUIProps> = () => {
  return (
    <div className="md-container">
      <div className="md-empty">
        <div className="md-empty-icon">📊</div>
        <p className="md-empty-title">功能精简中</p>
        <p className="md-empty-desc">记忆仪表盘模块正在重构，敬请期待</p>
      </div>
    </div>
  )
}
