/**
 * 情绪响应卡片组件
 * 根据情绪干预类型显示对应的提示信息和操作按钮
 */
import { View, Text } from '@tarojs/components'
import { useCallback } from 'react'
import type { EmotionIntervention } from '../engines/emotion'
import './EmotionResponseCard.scss'

interface EmotionResponseCardProps {
  intervention: EmotionIntervention
  onAction: (intervention: EmotionIntervention) => void
  onDismiss: (intervention: EmotionIntervention) => void
}

const SCENE_CONFIG: Record<string, { icon: string; actionLabel: string }> = {
  sick_anxiety: { icon: '💜', actionLabel: '深呼吸' },
  new_owner_anxiety: { icon: '🌟', actionLabel: '看看建议' },
  grief: { icon: '🤍', actionLabel: '想说说' },
}

export default function EmotionResponseCard({ intervention, onAction, onDismiss }: EmotionResponseCardProps) {
  const config = SCENE_CONFIG[intervention.type] || SCENE_CONFIG.sick_anxiety

  const handleAction = useCallback(() => {
    onAction(intervention)
  }, [intervention, onAction])

  const handleDismiss = useCallback(() => {
    onDismiss(intervention)
  }, [intervention, onDismiss])

  return (
    <View className={`emotion-inline emotion-inline--${intervention.type}`}>
      <Text className='emotion-inline__icon'>{config.icon}</Text>
      <Text className='emotion-inline__message'>{intervention.message}</Text>
      <View className='emotion-inline__action' onClick={handleAction}>
        <Text className='emotion-inline__action-text'>{config.actionLabel}</Text>
      </View>
      <View className='emotion-inline__dismiss' onClick={handleDismiss}>
        <Text className='emotion-inline__dismiss-text'>✕</Text>
      </View>
    </View>
  )
}
