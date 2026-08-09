/**
 * 宠物头像组件
 * 展示优先级：AI 形象图/真实照片 → 渐变底 + 物种 emoji 兜底（不再使用简笔画 SVG）
 */
import { View, Text, Image } from '@tarojs/components'
import { useMemo } from 'react'
import {
  calculateExpression,
  generateDiaryForToday,
  type ExpressionConfig,
  type ExpressionContext,
  type DiaryEntry
} from '../engines/petAvatar'
import './PetAvatar.scss'

interface PetAvatarProps {
  species: 'dog' | 'cat'
  petName: string
  expressionContext: ExpressionContext
  /** 优先展示的头像图片（AI 卡通形象或真实照片） */
  imageUrl?: string
  size?: number
  showDiary?: boolean
  showLabel?: boolean
  className?: string
  customExpression?: ExpressionConfig
}

export default function PetAvatar({
  species,
  petName,
  expressionContext,
  imageUrl,
  size = 100,
  showDiary = false,
  showLabel = false,
  className = '',
  customExpression
}: PetAvatarProps) {
  const expression = useMemo(
    () => customExpression || calculateExpression(expressionContext),
    [customExpression, expressionContext]
  )

  const diary = useMemo(() => {
    if (!showDiary) return null
    return generateDiaryForToday(
      expressionContext.todayEntry,
      expressionContext.streakDays,
      expressionContext.isBirthday,
      expressionContext.isRecovery
    )
  }, [showDiary, expressionContext])

  const animationClass = `pet-avatar__image--${expression.animation}`
  // 兜底形象：物种 emoji + 渐变圆底（与品牌色系一致，比简笔画脸好看）
  const fallbackEmoji = species === 'cat' ? '🐱' : '🐶'
  const fallbackClass = species === 'cat' ? 'pet-avatar__placeholder--cat' : 'pet-avatar__placeholder--dog'

  return (
    <View className={`pet-avatar ${className}`}>
      <View className='pet-avatar__face'>
        {imageUrl ? (
          <Image
            className={`pet-avatar__image ${animationClass}`}
            src={imageUrl}
            mode='aspectFill'
            style={{ width: `${size}px`, height: `${size}px` }}
            lazyLoad
          />
        ) : (
          <View
            className={`pet-avatar__placeholder ${fallbackClass} ${animationClass}`}
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <Text
              className='pet-avatar__placeholder-emoji'
              style={{ fontSize: `${Math.round(size * 0.46)}px` }}
            >
              {fallbackEmoji}
            </Text>
          </View>
        )}
      </View>

      {showLabel && (
        <View className='pet-avatar__label' style={{ backgroundColor: expression.color }}>
          <Text className='pet-avatar__label-text'>{expression.label}</Text>
        </View>
      )}

      {diary && (
        <View className='pet-avatar__diary'>
          <Text className='pet-avatar__diary-emoji'>{diary.emoji}</Text>
          <Text className='pet-avatar__diary-text'>"{diary.text}"</Text>
          <Text className='pet-avatar__diary-author'>—— {petName}</Text>
        </View>
      )}
    </View>
  )
}
