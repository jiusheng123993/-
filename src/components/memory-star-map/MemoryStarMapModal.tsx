import { useState, useEffect, type FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { MemoryStarMapUI } from '../../memory-star-map/MemoryStarMapUI'
import type { MemoryAtom, MemoryEntity, MemoryRelation, MemoryScope } from '../../memory-body'

interface MemoryStarMapModalProps {
  isOpen: boolean
  onClose: () => void
  atoms: MemoryAtom[]
  entities: MemoryEntity[]
  relations: MemoryRelation[]
  scope: MemoryScope
}

type LoadState = 'loading' | 'ready' | 'error'

export const MemoryStarMapModal: FC<MemoryStarMapModalProps> = ({ isOpen, onClose, atoms, entities, relations, scope }) => {
  const [loadState, setLoadState] = useState<LoadState>('loading')

  useEffect(() => {
    if (!isOpen) {
      setLoadState('loading')
      return
    }
    try {
      // 数据已由外部传入，直接标记就绪
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
      title="记忆星图"
      subtitle="可视化你的记忆星系"
      ariaLabel="记忆星图"
      width={900}
      height={700}
    >
      {loadState === 'loading' && (
        <div className="memory-star-map-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div className="empty-state">
            <div className="empty-icon">🌌</div>
            <div className="empty-title">加载中...</div>
            <div className="empty-description">正在准备记忆星图数据</div>
          </div>
        </div>
      )}
      {loadState === 'error' && (
        <div className="memory-star-map-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <div className="empty-title">加载失败</div>
            <div className="empty-description">无法加载记忆星图数据，请稍后重试</div>
          </div>
        </div>
      )}
      {loadState === 'ready' && (
        <MemoryStarMapUI
          atoms={atoms}
          entities={entities}
          relations={relations}
          scope={scope}
          onClose={onClose}
        />
      )}
    </AdaptiveModal>
  )
}
