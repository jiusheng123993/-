/**
 * 骨架屏通用组件
 * 支持 text/rect/circle/card 四种变体，可自定义行数、宽度和高度
 */
import { View } from '@tarojs/components'
import './Skeleton.scss'

interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle' | 'card'
  width?: string
  height?: string
  rows?: number
  className?: string
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  rows = 1,
  className = '',
}: SkeletonProps) {
  if (variant === 'card') {
    return (
      <View className={`skeleton-card ${className}`}>
        <View className='skeleton-card__header'>
          <View className='skeleton-card__avatar' />
          <View className='skeleton-card__meta'>
            <View className='skeleton-card__title' />
            <View className='skeleton-card__subtitle' />
          </View>
        </View>
        <View className='skeleton-card__body'>
          {Array.from({ length: rows }).map((_, i) => (
            <View key={i} className='skeleton-card__line' />
          ))}
        </View>
      </View>
    )
  }

  const style: React.CSSProperties = {}
  if (width) style.width = width
  if (height) style.height = height

  const classNames = ['skeleton', `skeleton--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  if (rows > 1) {
    return (
      <View className={className}>
        {Array.from({ length: rows }).map((_, i) => (
          <View key={i} className={classNames} style={style} />
        ))}
      </View>
    )
  }

  return <View className={classNames} style={style} />
}