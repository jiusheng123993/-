/**
 * 宠物头像组件
 * 展示优先级：imageUrl（显式传入）→ pet 档案形象（照片/AI 卡通）→ 渐变底 + 物种 emoji 兜底
 * 注意：调用方只要传入 pet 对象，即使没显式传 imageUrl，也会自动用档案里的形象，
 * 只有宠物完全没设置形象时才显示 emoji（不再使用简笔画 SVG）
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
  /** 优先展示的头像图片（AI 卡通形象或真实照片），显式传入时优先级最高 */
  imageUrl?: string
  /**
   * 宠物档案对象（可选）：未显式传 imageUrl 时，
   * 自动回退使用档案里的真实照片 avatarPhotoUrl / AI 卡通形象 avatarCartoonUrl。
   * 字段类型显式放宽为可空（服务端/本地缓存可能返回 null，见 avatar-customize 保存逻辑）
   */
  pet?: {
    avatarPhotoUrl?: string | null
    avatarCartoonUrl?: string | null
  } | null
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
  pet,
  size = 100,
  showDiary = false,
  showLabel = false,
  className = '',
  customExpression
}: PetAvatarProps) {
  // 头像图解析：显式 imageUrl 优先，其次档案里的照片/AI 卡通形象；三者都为空（falsy）时自然得到 undefined，回退 emoji
  const resolvedImageUrl = imageUrl || pet?.avatarPhotoUrl || pet?.avatarCartoonUrl
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
        {resolvedImageUrl ? (
          <Image
            className={`pet-avatar__image ${animationClass}`}
            src={resolvedImageUrl}
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
