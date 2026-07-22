import { View, Text } from '@tarojs/components'
import { useMemo } from 'react'
import { generateCarePlan, type CarePlan } from '../engines/emotion'
import './CarePlanCard.scss'

interface CarePlanCardProps {
  visible: boolean
  petName: string
  anomalyItems?: string[]
  onClose: () => void
}

export default function CarePlanCard({ visible, petName, anomalyItems, onClose }: CarePlanCardProps) {
  const carePlan = useMemo((): CarePlan | null => {
    if (!visible) return null
    return generateCarePlan(petName, anomalyItems)
  }, [visible, petName, anomalyItems])

  if (!visible || !carePlan) return null

  return (
    <View className='care-plan-card'>
      <View className='care-plan-card__overlay' onClick={onClose} />
      <View className='care-plan-card__content'>
        <View className='care-plan-card__header'>
          <Text className='care-plan-card__title'>📋 3天护理计划</Text>
          <View className='care-plan-card__close' onClick={onClose}>
            <Text>✕</Text>
          </View>
        </View>
        <View className='care-plan-card__body'>
          <Text className='care-plan-card__subtitle'>
            为{petName}定制的3天观察护理方案
          </Text>
          {carePlan.days.map((day) => (
            <View key={day.day} className='care-plan-card__day'>
              <View className='care-plan-card__day-header'>
                <Text className='care-plan-card__day-icon'>{day.icon}</Text>
                <Text className='care-plan-card__day-title'>
                  Day{day.day} {day.title}
                </Text>
              </View>
              <View className='care-plan-card__day-suggestions'>
                {day.suggestions.map((suggestion, idx) => (
                  <View key={idx} className='care-plan-card__suggestion'>
                    <Text className='care-plan-card__suggestion-dot'>•</Text>
                    <Text className='care-plan-card__suggestion-text'>{suggestion}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
        <View className='care-plan-card__footer'>
          <View className='care-plan-card__confirm-btn' onClick={onClose}>
            <Text>我知道了</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
