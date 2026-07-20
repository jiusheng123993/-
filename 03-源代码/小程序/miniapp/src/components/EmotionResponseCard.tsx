import { View, Text } from '@tarojs/components'
import type { EmotionMatchResult } from '../engines/emotion/EmotionEngine'
import { formatResponseContent, formatSuggestions } from '../engines/emotion/EmotionEngine'
import './EmotionResponseCard.scss'

interface EmotionResponseCardProps {
  match: EmotionMatchResult
  petName: string
  onDismiss?: () => void
  onSuggestionClick?: (suggestion: string) => void
}

const CATEGORY_ICON: Record<string, string> = {
  grief: '💜',
  anxiety: '🤗',
  celebration: '🎉',
  daily_care: '☀️',
  health_concern: '💊'
}

const TONE_STYLE: Record<string, string> = {
  gentle: 'emotion-card--gentle',
  encouraging: 'emotion-card--encouraging',
  empathetic: 'emotion-card--empathetic',
  celebratory: 'emotion-card--celebratory',
  informative: 'emotion-card--informative'
}

export default function EmotionResponseCard({
  match,
  petName,
  onDismiss,
  onSuggestionClick
}: EmotionResponseCardProps) {
  const { scene, response } = match
  const icon = CATEGORY_ICON[scene.category] || '💬'
  const toneClass = TONE_STYLE[response.tone] || ''
  const content = formatResponseContent(response.content, petName)
  const suggestions = formatSuggestions(response.suggestions, petName)

  return (
    <View className={`emotion-card ${toneClass}`}>
      <View className='emotion-card__header'>
        <Text className='emotion-card__icon'>{icon}</Text>
        <Text className='emotion-card__title'>{scene.name}</Text>
        {onDismiss && (
          <View className='emotion-card__dismiss' onClick={onDismiss}>
            <Text className='emotion-card__dismiss-text'>✕</Text>
          </View>
        )}
      </View>

      <View className='emotion-card__body'>
        <Text className='emotion-card__content'>{content}</Text>
      </View>

      {suggestions.length > 0 && (
        <View className='emotion-card__suggestions'>
          {suggestions.map((suggestion, index) => (
            <View
              key={`${scene.id}-suggestion-${index}`}
              className='emotion-card__suggestion'
              onClick={() => onSuggestionClick?.(suggestion)}
            >
              <Text className='emotion-card__suggestion-bullet'>•</Text>
              <Text className='emotion-card__suggestion-text'>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
