import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { ThemeOptionButton } from './ThemeOptionButton'
import { materialLabels, themeRegistry } from '../../themes/themeRegistry'
import { themeFamilyLabels } from '../../hooks/useTheme'
import type { Theme } from '../../themes/themeRegistry'

interface ThemePickerModalProps {
  isOpen: boolean
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
  isOpen,
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
  <AdaptiveModal
    isOpen={isOpen}
    onClose={onClose}
    title="挑一个今天的氛围"
    subtitle={`Theme Library · 主题库 · 当前 ${activeTheme.name}`}
    ariaLabel="主题库"
  >
    <div className="theme-modal-hero-preview" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <span
        className="theme-modal-hero-orb"
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: activeTheme.tokens.gradients.hero,
          boxShadow: activeTheme.tokens.effects.shadow
        }}
      />
      <span className="theme-modal-hero-meta" style={{ display: 'flex', gap: 8, fontSize: 13 }}>
        <span>{themeFamilyLabels[activeTheme.aesthetic]}</span>
        <span className="theme-option-material-tag" data-material={activeTheme.material}>
          {materialLabels[activeTheme.material]}
        </span>
      </span>
    </div>
    <div className="theme-wallpaper-btn-row" style={{ marginBottom: 16 }}>
      <button
        className="theme-wallpaper-btn"
        onClick={onOpenWallpaper}
        type="button"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--surface-elevated)',
          color: 'var(--text)',
          cursor: 'pointer',
          fontSize: 14
        }}
      >
        <span>🖼️</span>
        <span>壁纸设置</span>
      </button>
    </div>

    <div className="theme-modal-toolbar" style={{ marginBottom: 16 }}>
      <label className="theme-search" style={{ display: 'block', marginBottom: 12 }}>
        <span style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>搜索主题</span>
        <input
          aria-label="搜索主题"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜索鸿蒙、液态玻璃、多巴胺、水墨..."
          type="search"
          value={themeSearchQuery}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 14
          }}
        />
      </label>
      <div className="theme-family-nav" role="tablist" aria-label="主题分类" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          role="tab"
          aria-selected={activeThemeFamily === 'all'}
          className={activeThemeFamily === 'all' ? 'theme-family-chip active' : 'theme-family-chip'}
          onClick={() => onFamilyChange('all')}
          type="button"
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: activeThemeFamily === 'all' ? '2px solid var(--primary)' : '1px solid var(--border)',
            background: activeThemeFamily === 'all' ? 'var(--primary-bg)' : 'var(--surface)',
            color: activeThemeFamily === 'all' ? 'var(--primary)' : 'var(--text)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: activeThemeFamily === 'all' ? 600 : 400
          }}
        >
          <span>全部</span>
          <span style={{ marginLeft: 4, opacity: 0.6 }}>{themeRegistry.length}</span>
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
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: isActive ? 'var(--primary-bg)' : 'var(--surface)',
                color: isActive ? 'var(--primary)' : 'var(--text)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400
              }}
            >
              <span>{family.label}</span>
              <span style={{ marginLeft: 4, opacity: 0.6 }}>{family.themes.length}</span>
            </button>
          )
        })}
      </div>
    </div>

    {activeThemeFamily !== 'all' && (
      <div className="theme-family-blurb" style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: 'var(--surface-elevated)', fontSize: 13, color: 'var(--muted)' }}>
        {(() => {
          const family = themeFamilies.find((f) => f.id === activeThemeFamily)
          if (!family) return null
          return (
            <>
              <strong style={{ display: 'block', color: 'var(--text)', marginBottom: 4 }}>{family.label}</strong>
              <span style={{ display: 'block' }}>{family.subtitle}</span>
              <small style={{ display: 'block', marginTop: 4 }}>{family.description}</small>
            </>
          )
        })()}
      </div>
    )}

    <div className="theme-modal-grid" aria-label="主题列表" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
      {filteredThemes.map((theme) => (
        <ThemeOptionButton activeThemeId={activeTheme.id} key={theme.id} onSelect={onSwitchTheme} theme={theme} />
      ))}
      {filteredThemes.length === 0 && (
        <div className="theme-empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
          <strong style={{ display: 'block', marginBottom: 8 }}>没有找到匹配主题</strong>
          <small>换个关键词或切换到「全部」分类再试一次。</small>
        </div>
      )}
    </div>
  </AdaptiveModal>
)
