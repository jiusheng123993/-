import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { MetricsDashboardUI } from '../../metrics-dashboard/MetricsDashboardUI'
import type { MemoryProductMetricsResult } from '../../memory-body/metrics/memoryProductMetrics'
import type { MemoryAtom, MemoryScope } from '../../memory-body/core/memoryBodyTypes'

interface MetricsDashboardModalProps {
  isOpen: boolean
  onClose: () => void
  metrics: MemoryProductMetricsResult
  previousMetrics?: MemoryProductMetricsResult
  atoms: MemoryAtom[]
  scope: MemoryScope
}

export const MetricsDashboardModal: FC<MetricsDashboardModalProps> = ({ isOpen, onClose, metrics, previousMetrics, atoms, scope }) => {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="记忆仪表盘"
      subtitle="记忆系统健康概览"
      ariaLabel="记忆仪表盘"
    >
      <MetricsDashboardUI
        metrics={metrics}
        previousMetrics={previousMetrics}
        atoms={atoms}
        scope={scope}
        onClose={onClose}
      />
    </AdaptiveModal>
  )
}
