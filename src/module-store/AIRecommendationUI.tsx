import { useState, useRef, useEffect, useCallback } from 'react'
import type { Module, ModuleCategory, ModuleSize } from './types'

type AIRecommendationUIProps = {
  modules: Module[]
  identityDescription: string
  onClose: () => void
  onApply: (moduleIds: string[]) => void
  onReRecommend?: (description: string) => void
}

type EditingModule = {
  id: string
  title: string
  description: string
  category: ModuleCategory
  size: ModuleSize
}

interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}

const getRecommendReason = (category: ModuleCategory, _title: string): string => {
  const reasons: Record<ModuleCategory, string> = {
    productivity: '提升效率，帮你更好地管理任务',
    learning: '助力学习，让知识沉淀更高效',
    health: '关注健康，保持良好状态',
    life: '生活助手，让日常更有序',
    custom: '个性化定制，贴合你的需求'
  }
  return reasons[category] || '适合你的使用场景'
}

const LONG_PRESS_DURATION = 500

export const AIRecommendationUI = ({ 
  modules, 
  identityDescription, 
  onClose, 
  onApply, 
  onReRecommend 
}: AIRecommendationUIProps) => {
  const [description, setDescription] = useState(identityDescription)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(modules.map(m => m.id)))
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isDetailView, setIsDetailView] = useState(false)
  const [editingModule, setEditingModule] = useState<EditingModule | null>(null)
  const [cardOrder, setCardOrder] = useState<string[]>(modules.map(m => m.id))
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  })
  const modalRef = useRef<HTMLElement>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)

  const handleToggleModule = useCallback((moduleId: string) => {
    if (!isExpanded) return
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }, [isExpanded])

  const bringCardToFront = (moduleId: string) => {
    setCardOrder(prev => {
      const idx = prev.indexOf(moduleId)
      if (idx <= 0) return prev
      const next = [...prev]
      next.splice(idx, 1)
      next.unshift(moduleId)
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(modules.map(m => m.id)))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleReRecommend = () => {
    if (onReRecommend && description.trim()) {
      onReRecommend(description.trim())
    }
  }

  const handleApply = () => {
    onApply(Array.from(selectedIds))
  }

  const handleCardMouseDown = useCallback((_moduleId: string) => {
    isLongPressRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      setIsExpanded(true)
    }, LONG_PRESS_DURATION)
  }, [])

  const handleCardMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleCardClick = useCallback((moduleId: string) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false
      return
    }
    const module = modules.find(m => m.id === moduleId)
    if (!module) return
    setEditingModule({
      id: module.id,
      title: module.title,
      description: module.description,
      category: module.category,
      size: module.size
    })
    setIsDetailView(true)
  }, [modules])

  const handleBackdropClick = () => {
    if (isExpanded) {
      setIsExpanded(false)
    } else {
      onClose()
    }
  }

  const handleCollapse = () => {
    setIsExpanded(false)
  }

  const handleMinimize = () => {
    setIsMinimized(true)
  }

  const handleRestore = () => {
    setIsMinimized(false)
  }

  const handleHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: 0,
      offsetY: 0
    })
  }, [])

  const handleCardDoubleClick = useCallback((moduleId: string) => {
    if (!isExpanded) return
    bringCardToFront(moduleId)
    handleToggleModule(moduleId)
  }, [isExpanded, handleToggleModule])

  const handleCloseDetail = useCallback(() => {
    setIsDetailView(false)
    setEditingModule(null)
  }, [])

  const handleSaveEdit = useCallback(() => {
    handleCloseDetail()
  }, [handleCloseDetail])

  useEffect(() => {
    if (!dragState.isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      setDragState(prev => ({
        ...prev,
        offsetX: e.clientX - prev.startX,
        offsetY: e.clientY - prev.startY
      }))
    }

    const handleMouseUp = () => {
      setDragState(prev => ({
        ...prev,
        isDragging: false
      }))
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState.isDragging])

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  const selectedCount = selectedIds.size
  const totalCount = modules.length

  const getCardStyle = (visualIndex: number, total: number, isExpandedState: boolean) => {
    if (isExpandedState) {
      const translateY = visualIndex * 88
      const scale = 1 - visualIndex * 0.04
      const rotateX = visualIndex * 2
      const opacity = 1 - visualIndex * 0.1
      return {
        transform: `translateY(${translateY}px) rotateX(${rotateX}deg) scale(${scale})`,
        zIndex: total - visualIndex,
        opacity: Math.max(opacity, 0.5),
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transitionDelay: `${visualIndex * 60}ms`
      }
    }
    const row = Math.floor(visualIndex / 2)
    const col = visualIndex % 2
    const rowOffset = row * 110
    const colOffset = col * 10
    return {
      transform: `translateY(${rowOffset}px) translateX(${colOffset}px)`,
      zIndex: total - visualIndex,
      opacity: 1,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDelay: '0ms'
    }
  }

  if (isMinimized) {
    return (
      <div className="ai-recommendation-backdrop" onClick={handleRestore} role="presentation">
        <section
          className="ai-recommendation-modal minimized"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
        >
          <div className="ai-recommendation-minimized-content">
            <span className="ai-recommendation-minimized-icon">✦</span>
            <span>AI 推荐模块</span>
            <button 
              aria-label="还原窗口" 
              className="ai-recommendation-minimized-restore"
              onClick={handleRestore}
              type="button"
            >
              ◧
            </button>
          </div>
        </section>
      </div>
    )
  }

  if (isDetailView && editingModule) {
    const isSelected = selectedIds.has(editingModule.id)
    return (
      <div className="ai-recommendation-backdrop" onClick={handleCloseDetail} role="presentation">
        <section
          className="ai-recommendation-modal detail-view"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
        >
          <header className="ai-recommendation-header">
            <div>
              <h2>模块详情</h2>
            </div>
            <button aria-label="关闭详情" className="module-store-close" onClick={handleCloseDetail} type="button">×</button>
          </header>
          <div className="ai-recommendation-detail-content">
            <div className="ai-recommendation-detail-section">
              <h3>标题</h3>
              <input
                type="text"
                className="ai-recommendation-edit-input"
                value={editingModule.title}
                onChange={(e) => setEditingModule(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="请输入模块标题"
              />
            </div>
            <div className="ai-recommendation-detail-section">
              <h3>描述</h3>
              <textarea
                className="ai-recommendation-edit-textarea"
                value={editingModule.description}
                onChange={(e) => setEditingModule(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="请输入模块描述"
                rows={3}
              />
            </div>
            <div className="ai-recommendation-detail-section">
              <h3>分类</h3>
              <select
                className="ai-recommendation-edit-select"
                value={editingModule.category}
                onChange={(e) => setEditingModule(prev => prev ? { ...prev, category: e.target.value as ModuleCategory } : null)}
              >
                <option value="productivity">效率</option>
                <option value="learning">学习</option>
                <option value="health">健康</option>
                <option value="life">生活</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div className="ai-recommendation-detail-section">
              <h3>尺寸</h3>
              <select
                className="ai-recommendation-edit-select"
                value={editingModule.size}
                onChange={(e) => setEditingModule(prev => prev ? { ...prev, size: e.target.value as ModuleSize } : null)}
              >
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
                <option value="full-width">全宽</option>
              </select>
            </div>
            <div className="ai-recommendation-detail-section">
              <h3>推荐理由</h3>
              <p>💡 {getRecommendReason(editingModule.category, editingModule.title)}</p>
            </div>
            <div className="ai-recommendation-detail-section">
              <label className="ai-recommendation-detail-checkbox">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleModule(editingModule.id)}
                />
                <span>启用此模块</span>
              </label>
            </div>
          </div>
          <div className="ai-recommendation-detail-actions">
            <button 
              className="module-store-btn module-store-btn-secondary" 
              onClick={handleCloseDetail} 
              type="button"
            >
              取消
            </button>
            <button 
              className="module-store-btn module-store-btn-create" 
              onClick={handleSaveEdit} 
              type="button"
            >
              保存
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="ai-recommendation-backdrop" onClick={handleBackdropClick} role="presentation">
      <section
        ref={modalRef}
        aria-label="AI 推荐模块"
        aria-modal="true"
        className="ai-recommendation-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        style={dragState.isDragging ? {
          transform: `translate(${dragState.offsetX}px, ${dragState.offsetY}px)`,
          cursor: 'grabbing'
        } : undefined}
      >
        <header 
          className="ai-recommendation-header draggable"
          onMouseDown={handleHeaderMouseDown}
        >
          <div>
            <p className="eyebrow">AI Recommendation · 身份驱动默认模块</p>
            <h2>AI 推荐模块</h2>
          </div>
          <div className="ai-recommendation-header-actions">
            <button 
              aria-label="最小化" 
              className="ai-recommendation-header-btn"
              onClick={handleMinimize}
              type="button"
            >
              −
            </button>
            <button aria-label="关闭 AI 推荐模块" className="module-store-close" onClick={onClose} type="button">×</button>
          </div>
        </header>
        <section className="ai-recommendation-section">
          <h3>身份描述</h3>
          <textarea
            className="ai-recommendation-textarea"
            placeholder="请输入你的身份描述，例如：我是一名产品经理，需要管理多个项目..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="ai-recommendation-actions">
            <button 
              className="module-store-btn module-store-btn-secondary" 
              onClick={handleReRecommend} 
              type="button"
              disabled={!description.trim() || !onReRecommend}
            >
              重新推荐
            </button>
          </div>
        </section>
        <section className="ai-recommendation-section">
          <div className="ai-recommendation-section-header">
            <h3>推荐开启</h3>
            <div className="ai-recommendation-batch-actions">
              <button 
                className="ai-recommendation-link-btn" 
                onClick={handleSelectAll} 
                type="button"
              >
                全选
              </button>
              <span className="ai-recommendation-divider">|</span>
              <button 
                className="ai-recommendation-link-btn" 
                onClick={handleDeselectAll} 
                type="button"
              >
                取消全选
              </button>
            </div>
          </div>
          
          <div className="ai-recommendation-card-stack-container">
            <div 
              className={`ai-recommendation-card-stack ${isExpanded ? 'expanded' : ''}`}
              onMouseLeave={() => {
                if (isExpanded) {
                  handleCollapse()
                }
              }}
            >
              {cardOrder.map((moduleId, visualIndex) => {
                const module = modules.find(m => m.id === moduleId)!
                const isSelected = selectedIds.has(moduleId)
                const cardStyle = getCardStyle(visualIndex, cardOrder.length, isExpanded)
                
                return (
                  <article 
                    className={`ai-recommendation-stack-card ${isSelected ? 'selected' : ''}`}
                    key={moduleId}
                    style={cardStyle}
                    onMouseDown={() => handleCardMouseDown(moduleId)}
                    onMouseUp={handleCardMouseUp}
                    onClick={() => handleCardClick(moduleId)}
                    onDoubleClick={() => handleCardDoubleClick(moduleId)}
                  >
                    <div className="ai-recommendation-card-content">
                      <div className="ai-recommendation-card-header">
                        <span className="ai-recommendation-card-icon" aria-hidden="true">✦</span>
                        <div className="ai-recommendation-card-info">
                          <h4>{module.title}</h4>
                          <p>{module.description}</p>
                        </div>
                        {isExpanded && (
                          <div className="ai-recommendation-card-checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleModule(moduleId)}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`选择 ${module.title}`}
                            />
                          </div>
                        )}
                      </div>
                      <p className="ai-recommendation-card-reason">
                        💡 {getRecommendReason(module.category, module.title)}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>
            
            <div className="ai-recommendation-stack-hint">
              {isExpanded ? (
                <span>点击卡片选择，移开鼠标收起</span>
              ) : (
                <span>长按卡片展开选择</span>
              )}
            </div>
          </div>
        </section>
        <button 
          className="module-store-btn module-store-btn-create" 
          disabled={selectedCount === 0}
          onClick={handleApply} 
          type="button"
        >
          应用推荐布局 ({selectedCount}/{totalCount})
        </button>
      </section>
    </div>
  )
}
