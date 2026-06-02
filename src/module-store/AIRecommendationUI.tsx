import { useState } from 'react'
import type { Module, ModuleCategory } from './types'

type AIRecommendationUIProps = {
  modules: Module[]
  identityDescription: string
  onClose: () => void
  onApply: (moduleIds: string[]) => void
  onReRecommend?: (description: string) => void
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

export const AIRecommendationUI = ({ 
  modules, 
  identityDescription, 
  onClose, 
  onApply, 
  onReRecommend 
}: AIRecommendationUIProps) => {
  const [description, setDescription] = useState(identityDescription)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(modules.map(m => m.id)))

  const handleToggleModule = (moduleId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
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

  const selectedCount = selectedIds.size
  const totalCount = modules.length

  return (
    <div className="ai-recommendation-backdrop" onClick={onClose} role="presentation">
      <section
        aria-label="AI 推荐模块"
        aria-modal="true"
        className="ai-recommendation-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="ai-recommendation-header">
          <div>
            <p className="eyebrow">AI Recommendation · 身份驱动默认模块</p>
            <h2>AI 推荐模块</h2>
          </div>
          <button aria-label="关闭 AI 推荐模块" className="module-store-close" onClick={onClose} type="button">×</button>
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
          <div className="module-store-grid" style={{ maxHeight: 320 }}>
            {modules.map((module) => {
              const isSelected = selectedIds.has(module.id)
              return (
                <article 
                  className={`module-store-item ${isSelected ? 'active' : ''}`} 
                  key={module.id}
                  onClick={() => handleToggleModule(module.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="module-store-item-header">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleModule(module.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`选择 ${module.title}`}
                      className="ai-recommendation-checkbox"
                    />
                    <span className="module-store-item-icon" aria-hidden="true">✦</span>
                    <div className="module-store-item-info">
                      <h4>{module.title}</h4>
                      <p>{module.description}</p>
                    </div>
                  </div>
                  <p className="ai-recommendation-reason">
                    💡 {getRecommendReason(module.category, module.title)}
                  </p>
                </article>
              )
            })}
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
