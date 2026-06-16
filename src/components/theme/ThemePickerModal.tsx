import type { FC } from 'react'
import { ThemeOptionButton } from './ThemeOptionButton'
import { materialLabels, themeRegistry } from '../../themes/themeRegistry'
import { themeFamilyLabels } from '../../hooks/useTheme'
import type { Theme } from '../../themes/themeRegistry'

interface ThemePickerModalProps {
  activeTheme: Theme
  themeFamilies: { id: string; label: string; subtitle: string; description: string; themes: Theme[] }[]
  filteredThemes: Theme[]
  themeSearchQuery: string
  activeThemeFamily: string
  onClose: () => void
  onOpenWallpaper: () => void
  onSearchChange: (query: string) => void
  onFamilyChange: (family: string) => void
  onSwitchTheme: (themeId: string) => void
}

export const ThemePickerModal: FC<ThemePickerModalProps> = ({
  activeTheme,
  themeFamilies,
  filteredThemes,
  themeSearchQuery,
  activeThemeFamily,
  onClose,
  onOpenWallpaper,
  onSearchChange,
  onFamilyChange,
  onSwitchTheme
}) => (
  <div className="theme-modal-backdrop" onClick={onClose} role="presentation">
    <section
      aria-modal="true"
      className="theme-modal"
      data-material={activeTheme.material}
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-label="主题库"
    >
      <header className="theme-modal-hero">
        <div className="theme-modal-hero-text">
          <p className="eyebrow">Theme Library · 主题库</p>
          <h2>挑一个今天的氛围</h2>
          <small>
            当前 <strong>{activeTheme.name}</strong> · 共 {themeRegistry.length} 款主题、{themeFamilies.length} 个分类，按场景与材质归档
          </small>
        </div>
        <div className="theme-modal-hero-preview" aria-hidden="true">
          <span
            className="theme-modal-hero-orb"
            style={{
              background: activeTheme.tokens.gradients.hero,
              boxShadow: activeTheme.tokens.effects.shadow
            }}
          />
          <span className="theme-modal-hero-meta">
            <span>{themeFamilyLabels[activeTheme.aesthetic]}</span>
            <span className="theme-option-material-tag" data-material={activeTheme.material}>
              {materialLabels[activeTheme.material]}
            </span>
          </span>
        </div>
        <button className="theme-modal-close" onClick={onClose} type="button" aria-label="关闭主题库">
          ×
        </button>
      </header>
      <div className="theme-wallpaper-btn-row">
        <button
          className="theme-wallpaper-btn"
          onClick={onOpenWallpaper}
          type="button"
        >
          <span className="theme-wallpaper-btn-icon">🖼️</span>
          <span className="theme-wallpaper-btn-text">壁纸设置</span>
        </button>
      </div>

      <div className="theme-modal-toolbar">
        <label className="theme-search">
          <span>搜索主题</span>
          <input
            aria-label="搜索主题"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="搜索鸿蒙、液态玻璃、多巴胺、水墨..."
            type="search"
            value={themeSearchQuery}
          />
        </label>
        <div className="theme-family-nav" role="tablist" aria-label="主题分类">
          <button
            role="tab"
            aria-selected={activeThemeFamily === 'all'}
            className={activeThemeFamily === 'all' ? 'theme-family-chip active' : 'theme-family-chip'}
            onClick={() => onFamilyChange('all')}
            type="button"
          >
            <span className="theme-family-chip-label">全部</span>
            <span className="theme-family-chip-count">{themeRegistry.length}</span>
          </button>
          {themeFamilies.map((family) => {
            const isActive = activeThemeFamily === family.id
            return (
              <button
                key={family.id}
                role="tab"
                aria-selected={isActive}
                className={isActive ? 'theme-family-chip active' : 'theme-family-chip'}
                onClick={() => onFamilyChange(family.id)}
                type="button"
                title={family.description}
              >
                <span className="theme-family-chip-label">{family.label}</span>
                <span className="theme-family-chip-count">{family.themes.length}</span>
              </button>
            )
          })}
        </div>
      </div>

      {activeThemeFamily !== 'all' && (
        <div className="theme-family-blurb">
          {(() => {
            const family = themeFamilies.find((f) => f.id === activeThemeFamily)
            if (!family) return null
            return (
              <>
                <strong>{family.label}</strong>
                <span>{family.subtitle}</span>
                <small>{family.description}</small>
              </>
            )
          })()}
        </div>
      )}

      <div className="theme-modal-grid" aria-label="主题列表">
        {filteredThemes.map((theme) => (
          <ThemeOptionButton activeThemeId={activeTheme.id} key={theme.id} onSelect={onSwitchTheme} theme={theme} />
        ))}
        {filteredThemes.length === 0 && (
          <div className="theme-empty-state">
            <strong>没有找到匹配主题</strong>
            <small>换个关键词或切换到「全部」分类再试一次。</small>
          </div>
        )}
      </div>
    </section>
  </div>
)
