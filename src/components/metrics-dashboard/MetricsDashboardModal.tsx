import { useState, useEffect, type FC } from 'react'
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

type LoadState = 'loading' | 'ready' | 'error'

export const MetricsDashboardModal: FC<MetricsDashboardModalProps> = ({ isOpen, onClose, metrics, previousMetrics, atoms, scope }) => {
  const [loadState, setLoadState] = useState<LoadState>('loading')

  useEffect(() => {
    if (!isOpen) {
      setLoadState('loading')
      return
    }
    try {
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="记忆仪表盘"
      subtitle="记忆系统健康概览"
      ariaLabel="记忆仪表盘"
    >
      {loadState === 'loading' && (
        <div className="md-container">
          <div className="md-empty">
            <div className="md-empty-icon">📊</div>
            <p className="md-empty-title">加载中...</p>
            <p className="md-empty-desc">正在计算记忆产品指标</p>
          </div>
        </div>
      )}
      {loadState === 'error' && (
        <div className="md-container">
          <div className="md-empty">
            <div className="md-empty-icon">⚠️</div>
            <p className="md-empty-title">加载失败</p>
            <p className="md-empty-desc">无法加载指标数据，请稍后重试</p>
          </div>
        </div>
      )}
      {loadState === 'ready' && (
        <MetricsDashboardUI
          metrics={metrics}
          previousMetrics={previousMetrics}
          atoms={atoms}
          scope={scope}
          onClose={onClose}
        />
      )}
    </AdaptiveModal>
  )
}
