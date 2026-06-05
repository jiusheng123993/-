import { useMemo, useState } from 'react'
import type { Module, ModuleCategory, ModuleSize, ModuleStoreState } from './types'
import { createCustomModule } from './moduleStoreLogic'

const categoryLabels: Record<ModuleCategory | 'all', string> = {
  all: '全部',
  productivity: '效率',
  learning: '学习',
  health: '健康',
  life: '生活',
  custom: '自定义'
}

const presetSizes: { columns: number; rows: number; label: string }[] = [
  { columns: 1, rows: 1, label: '1×1 小卡片' },
  { columns: 2, rows: 1, label: '2×1 标准' },
  { columns: 3, rows: 1, label: '3×1 宽' },
  { columns: 4, rows: 1, label: '4×1 通栏' },
  { columns: 1, rows: 2, label: '1×2 高' },
  { columns: 2, rows: 2, label: '2×2 大' },
  { columns: 3, rows: 2, label: '3×2 超大' },
  { columns: 4, rows: 2, label: '4×2 全屏' }
]

const sizeToKey = (size: ModuleSize) => `${size.columns}x${size.rows}`
const keyToSize = (key: string): ModuleSize => {
  const [c, r] = key.split('x').map(Number)
  return { columns: c || 2, rows: r || 1 }
}

type ModuleStoreUIProps = {
  state: ModuleStoreState
  onClose: () => void
  onAddModule: (moduleId: string) => void
  onRemoveModule: (moduleId: string, deleteCustomModule?: boolean) => void
  onCreateCustomModule: (module: Module) => void
}

export const ModuleStoreUI = ({
  state,
  onClose,
  onAddModule,
  onRemoveModule,
  onCreateCustomModule
}: ModuleStoreUIProps) => {
  const [activeCategory, setActiveCategory] = useState<ModuleCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sizeKey, setSizeKey] = useState('2x1')
  const activeIds = new Set(state.activeModules.map((item) => item.moduleId))
  const activeCount = state.activeModules.length
  const totalCount = state.availableModules.length
  const categories = useMemo<(ModuleCategory | 'all')[]>(() => {
    const values = new Set<ModuleCategory>(state.availableModules.map((module) => module.category))
    return ['all', ...Array.from(values)]
  }, [state.availableModules])
  const visibleModules = useMemo(() => {
    return state.availableModules.filter((module) => {
      const matchesCategory = activeCategory === 'all' || module.category === activeCategory
      const matchesSearch = searchQuery.trim() === '' || 
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [state.availableModules, activeCategory, searchQuery])

  const createModule = () => {
    const module = createCustomModule({
      title,
      description,
      icon: 'Sparkles',
      category: 'custom',
      size: keyToSize(sizeKey),
      isCustom: true
    })
    onCreateCustomModule(module)
    setTitle('')
    setDescription('')
    setSizeKey('2x1')
  }

  const formatSizeLabel = (size: ModuleSize) => `${size.columns}×${size.rows}`

  return (
    <div className="module-store-backdrop" onClick={onClose} role="presentation">
      <section
        aria-label="模块商店"
        aria-modal="true"
        className="module-store-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="module-store-header">
          <div>
            <p className="eyebrow">Module Store · 工作台组件库</p>
            <h2>模块商店 <span className="module-store-count">已激活 {activeCount}/{totalCount}</span></h2>
          </div>
          <button aria-label="关闭模块商店" className="module-store-close" onClick={onClose} type="button">×</button>
        </header>

        <div className="module-store-categories" role="tablist" aria-label="模块分类">
          {categories.map((category) => (
            <button
              aria-selected={activeCategory === category}
              className={activeCategory === category ? 'module-store-category active' : 'module-store-category'}
              key={category}
              onClick={() => setActiveCategory(category)}
              role="tab"
              type="button"
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        <div className="module-store-search">
          <input
            aria-label="搜索模块"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="搜索模块名称或描述..."
            type="search"
            value={searchQuery}
          />
        </div>

        <div className="module-store-grid">
          {visibleModules.map((module) => {
            const isActive = activeIds.has(module.id)
            const isExpanded = expandedModuleId === module.id
            return (
              <article 
                className={isExpanded ? 'module-store-item expanded' : (isActive ? 'module-store-item active' : 'module-store-item')} 
                key={module.id}
                onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
              >
                <div className="module-store-item-header">
                  <span className="module-store-item-icon" aria-hidden="true">{module.icon === 'Sparkles' ? '✦' : '◈'}</span>
                  <div className="module-store-item-info">
                    <h4>{module.title}</h4>
                    <p>{module.description}</p>
                  </div>
                </div>
                {isExpanded && (
                  <div className="module-store-item-details">
                    <p className="module-store-item-full-desc">{module.description}</p>
                    <div className="module-store-item-meta">
                      <span className="module-store-item-size">{formatSizeLabel(module.size)}</span>
                      <span className="module-store-item-category">{categoryLabels[module.category]}</span>
                    </div>
                    <div className="module-store-item-actions" onClick={(event) => event.stopPropagation()}>
                      {isActive ? (
                        <button className="module-store-btn module-store-btn-remove" onClick={() => onRemoveModule(module.id)} type="button">
                          从画布移除
                        </button>
                      ) : (
                        <button className="module-store-btn module-store-btn-add" onClick={() => onAddModule(module.id)} type="button">
                          添加到画布
                        </button>
                      )}
                      {module.isCustom && (
                        <button className="module-store-btn module-store-btn-delete" onClick={() => onRemoveModule(module.id, true)} type="button">
                          删除自定义
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {!isExpanded && (
                  <>
                    <div className="module-store-item-meta">
                      <span className="module-store-item-size">{formatSizeLabel(module.size)}</span>
                      <span className="module-store-item-category">{categoryLabels[module.category]}</span>
                    </div>
                    <div className="module-store-item-actions">
                      {isActive ? (
                        <button className="module-store-btn module-store-btn-remove" onClick={(event) => { event.stopPropagation(); onRemoveModule(module.id) }} type="button">
                          从画布移除
                        </button>
                      ) : (
                        <button className="module-store-btn module-store-btn-add" onClick={(event) => { event.stopPropagation(); onAddModule(module.id) }} type="button">
                          添加到画布
                        </button>
                      )}
                      {module.isCustom && (
                        <button className="module-store-btn module-store-btn-delete" onClick={(event) => { event.stopPropagation(); onRemoveModule(module.id, true) }} type="button">
                          删除自定义
                        </button>
                      )}
                    </div>
                  </>
                )}
              </article>
            )
          })}
        </div>

        <footer className="module-store-footer">
          <div className="module-store-create-form">
            <h4>创建自定义模块</h4>
            <input aria-label="自定义模块名称" onChange={(event) => setTitle(event.target.value)} placeholder="例如：晨间复盘" value={title} />
            <input aria-label="自定义模块描述" onChange={(event) => setDescription(event.target.value)} placeholder="这个模块要帮你记录什么？" value={description} />
            <select aria-label="自定义模块尺寸" onChange={(event) => setSizeKey(event.target.value)} value={sizeKey}>
              {presetSizes.map(({ columns, rows, label }) => (
                <option key={`${columns}x${rows}`} value={`${columns}x${rows}`}>{label}</option>
              ))}
            </select>
            <button className="module-store-btn module-store-btn-create" onClick={createModule} type="button">创建并添加到商店</button>
          </div>
        </footer>
      </section>
    </div>
  )
}
