import { materialLabels, type StudyTheme, type ThemeId } from '../../themes/themeRegistry'

interface ThemeOptionButtonProps {
  activeThemeId: ThemeId
  onSelect: (themeId: ThemeId) => void
  theme: StudyTheme
}

export function ThemeOptionButton({ activeThemeId, onSelect, theme }: ThemeOptionButtonProps) {
  const isActive = theme.id === activeThemeId
  return (
    <button
      aria-label={theme.name}
      aria-pressed={isActive}
      className={isActive ? 'theme-option selected' : 'theme-option'}
      data-material={theme.material}
      key={theme.id}
      onClick={() => onSelect(theme.id)}
      type="button"
    >
      <span
        className="theme-option-preview"
        style={{
          background: theme.tokens.colors.background,
          borderColor: theme.tokens.colors.border
        }}
        aria-hidden="true"
      >
        <span
          className="theme-option-preview-card"
          style={{
            background: theme.tokens.gradients.card,
            color: theme.tokens.colors.primary,
            boxShadow: theme.tokens.effects.shadow
          }}
        >
          <span className="theme-option-preview-bar" style={{ background: theme.tokens.gradients.hero }} />
          <span className="theme-option-preview-line" style={{ background: theme.tokens.colors.border }} />
          <span
            className="theme-option-preview-line short"
            style={{ background: theme.tokens.colors.border }}
          />
        </span>
      </span>
      <span className="theme-option-meta">
        <span className="theme-option-headline">
          <span className="theme-option-name">{theme.name}</span>
          <span className="theme-option-material-tag" data-material={theme.material}>
            {materialLabels[theme.material]}
          </span>
        </span>
        <span className="theme-option-tone">{theme.design.tone}</span>
        <span className="theme-swatch-row" aria-hidden="true">
          <span className="theme-swatch" style={{ background: theme.tokens.colors.primary }} />
          <span className="theme-swatch" style={{ background: theme.tokens.colors.secondary }} />
          <span className="theme-swatch" style={{ background: theme.tokens.colors.accent }} />
        </span>
      </span>
      {isActive && <span className="theme-option-active-mark" aria-hidden="true">●</span>}
    </button>
  )
}
