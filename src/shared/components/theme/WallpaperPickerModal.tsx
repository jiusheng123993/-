import type { FC } from 'react'
import { AdaptiveModal } from '../../platforms'
import { WallpaperPicker } from '../../wallpaper/WallpaperPicker'
import { wallpaperService } from '../../wallpaper/wallpaperService'
import type { Theme } from '../../themes/themeRegistry'

interface WallpaperPickerModalProps {
  isOpen: boolean
  activeTheme: Theme
  onClose: () => void
  onWallpaperSelected: (dataUrl: string) => void
}

export const WallpaperPickerModal: FC<WallpaperPickerModalProps> = ({
  isOpen,
  activeTheme,
  onClose,
  onWallpaperSelected
}) => (
  <AdaptiveModal
    isOpen={isOpen}
    onClose={onClose}
    title="为当前主题搭配壁纸"
    subtitle={`Wallpaper · 壁纸设置 · 当前 ${activeTheme.name}`}
    ariaLabel="壁纸设置"
  >
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
  </AdaptiveModal>
)
