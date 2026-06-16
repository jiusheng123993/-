import type { FC } from 'react'
import { WallpaperPicker } from '../../wallpaper/WallpaperPicker'
import { wallpaperService } from '../../wallpaper/wallpaperService'
import type { Theme } from '../../themes/themeRegistry'

interface WallpaperPickerModalProps {
  activeTheme: Theme
  onClose: () => void
  onWallpaperSelected: (dataUrl: string) => void
}

export const WallpaperPickerModal: FC<WallpaperPickerModalProps> = ({
  activeTheme,
  onClose,
  onWallpaperSelected
}) => (
  <div className="theme-modal-backdrop" onClick={onClose} role="presentation">
    <section
      aria-modal="true"
      className="theme-modal wallpaper-modal"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-label="壁纸设置"
    >
      <header className="theme-modal-hero">
        <div className="theme-modal-hero-text">
          <p className="eyebrow">Wallpaper · 壁纸设置</p>
          <h2>为当前主题搭配壁纸</h2>
          <small>
            当前主题 <strong>{activeTheme.name}</strong> · 壁纸效果与主题自动联动
          </small>
        </div>
        <button className="theme-modal-close" onClick={onClose} type="button" aria-label="关闭壁纸设置">
          ×
        </button>
      </header>
      <WallpaperPicker
        currentThemeId={activeTheme.id}
        onClose={() => {
          const wallpaper = wallpaperService.getActiveWallpaper()
          if (wallpaper?.thumbnailDataUrl) {
            onWallpaperSelected(wallpaper.thumbnailDataUrl)
          }
          onClose()
        }}
      />
    </section>
  </div>
)
