import { View, Text, Image } from '@tarojs/components'
import { useMemo } from 'react'
import {
  calculateExpression,
  getPetFaceDataUri,
  generateDiaryForToday,
  type ExpressionConfig,
  type ExpressionContext,
  type DiaryEntry
} from '../engines/petAvatar'
import type { OutfitSlotMap } from '../types/wardrobeTypes'
import { resolveOutfitLayers } from '../engines/petAvatar/outfitRenderer'
import './PetAvatar.scss'

interface PetAvatarProps {
  species: 'dog' | 'cat'
  petName: string
  expressionContext: ExpressionContext
  size?: number
  showDiary?: boolean
  showLabel?: boolean
  className?: string
  customExpression?: ExpressionConfig
  outfitSlots?: OutfitSlotMap
}

export default function PetAvatar({
  species,
  petName,
  expressionContext,
  size = 100,
  showDiary = false,
  showLabel = false,
  className = '',
  customExpression,
  outfitSlots
}: PetAvatarProps) {
  const expression = useMemo(
    () => customExpression || calculateExpression(expressionContext),
    [customExpression, expressionContext]
  )

  const outfitLayers = useMemo(
    () => outfitSlots ? resolveOutfitLayers(outfitSlots, species) : [],
    [outfitSlots, species]
  )

  const faceUri = useMemo(
    () => getPetFaceDataUri(expression, species, size, outfitLayers),
    [expression, species, size, outfitLayers]
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

  return (
    <View className={`pet-avatar ${className}`}>
      <View className='pet-avatar__face'>
        <Image
          className={`pet-avatar__image ${animationClass}`}
          src={faceUri}
          mode='aspectFit'
          style={{ width: `${size}px`, height: `${size}px` }}
          lazyLoad
        />
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
