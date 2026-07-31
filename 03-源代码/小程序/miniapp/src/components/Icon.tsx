/**
 * 图标组件
 * 通过 SVG data URI 渲染矢量图标，支持自定义大小和颜色
 */
import { Image } from '@tarojs/components'
import './Icon.scss'

interface IconProps {
  name: IconName
  size?: number
  color?: string
  className?: string
}

export type IconName =
  | 'home'
  | 'pet'
  | 'trend'
  | 'member'
  | 'mine'
  | 'checkin'
  | 'vaccine'
  | 'hospital'
  | 'food'
  | 'symptom'
  | 'avatar'
  | 'edit'
  | 'arrow-right'
  | 'arrow-down'
  | 'close'
  | 'check'
  | 'warning'
  | 'error'
  | 'info'
  | 'loading'
  | 'star'
  | 'heart'
  | 'settings'
  | 'logout'
  | 'crown'

const ICON_PATHS: Record<IconName, string> = {
  home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10',
  pet: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z M12 8a4 4 0 100 8 4 4 0 000-8z',
  trend: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  member: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  mine: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  checkin: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  vaccine: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l1.828 1.828a2 2 0 01.586 1.414V19H8v-1.172a2 2 0 00-.586-1.414L5.586 14.586A2 2 0 015 13.172V5l-1-1h8z',
  hospital: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  food: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  symptom: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  avatar: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  'arrow-right': 'M9 5l7 7-7 7',
  'arrow-down': 'M19 9l-7 7-7-7',
  close: 'M6 18L18 6M6 6l12 12',
  check: 'M5 13l4 4L19 7',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.876c1.035 0 1.87-1.035 1.648-2.047l-6.938-27.876c-.22-.88-1.395-1.395-2.276-1.395-.88 0-2.055.515-2.275 1.395L3.414 18.953c-.222 1.012.613 2.047 1.648 2.047z',
  error: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  loading: 'M4 4v5h.582a15.05 15.05 0 007.424-2.624M20 20v-5h-.581a15.05 15.05 0 01-7.424 2.624',
  star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.985 9.89c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.95-.69L11.05 2.927z',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.067 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.067c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.067c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.067-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37 1.608.926 3.62-.34 4.17-1.544zM12 15a3 3 0 100-6 3 3 0 000 6z',
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  crown: 'M5 16l3-9 3 6 3-6 3 9H5z',
}

function buildSvgDataUri(path: string, size: number, color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='${path}'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export default function Icon({
  name,
  size = 24,
  color = '#333333',
  className = '',
}: IconProps) {
  const path = ICON_PATHS[name]
  if (!path) return null

  const src = buildSvgDataUri(path, size, color)

  return (
    <Image
      className={`icon ${className}`}
      src={src}
      mode='aspectFit'
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  )
}