import type { Module } from './types'

type AIRecommendationUIProps = {
  modules: Module[]
  identityDescription: string
  onClose: () => void
  onApply: (moduleIds: string[]) => void
}

export const AIRecommendationUI = ({ modules, identityDescription, onClose, onApply }: AIRecommendationUIProps) => (
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
        <p className="persona-brief" style={{ margin: 0 }}>{identityDescription}</p>
      </section>
      <section className="ai-recommendation-section">
        <h3>推荐开启</h3>
        <div className="module-store-grid" style={{ maxHeight: 320 }}>
          {modules.map((module) => (
            <article className="module-store-item active" key={module.id}>
              <div className="module-store-item-header">
                <span className="module-store-item-icon" aria-hidden="true">✦</span>
                <div className="module-store-item-info">
                  <h4>{module.title}</h4>
                  <p>{module.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <button className="module-store-btn module-store-btn-create" onClick={() => onApply(modules.map((module) => module.id))} type="button">
        应用推荐布局
      </button>
    </section>
  </div>
)
