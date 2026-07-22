import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useAnalytics } from '../../hooks/useAnalytics'
import { AnalyticsEventName } from '../../types/analyticsTypes'
import './EmergencyAlert.scss'

interface EmergencyAlertProps {
  visible: boolean
  title?: string
  message: string
  showSymptomButton?: boolean
  showFoodButton?: boolean
  showHospitalButton?: boolean
  petId?: string
  symptoms?: string[]
  alertType?: string
  onClose: () => void
}

export default function EmergencyAlert({
  visible,
  title = '紧急健康预警',
  message,
  showSymptomButton = true,
  showFoodButton = true,
  showHospitalButton = true,
  petId = '',
  symptoms = [],
  alertType = 'unknown',
  onClose,
}: EmergencyAlertProps) {
  const { trackEvent } = useAnalytics()
  const [canClose, setCanClose] = useState(false)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (visible && petId) {
      trackEvent(AnalyticsEventName.EmergencyAlert, { petId, symptoms, alertType })
    }
  }, [visible])

  useEffect(() => {
    if (!visible) {
      setCanClose(false)
      setCountdown(3)
      return
    }

    let timer: ReturnType<typeof setInterval>
    let count = 3
    setCountdown(3)

    timer = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count <= 0) {
        clearInterval(timer)
        setCanClose(true)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [visible])

  if (!visible) return null

  return (
    <View className='emergency-alert__overlay'>
      <View className='emergency-alert__popup'>
        <View className='emergency-alert__header'>
          <Text className='emergency-alert__icon'>🚨</Text>
          <Text className='emergency-alert__title'>{title}</Text>
        </View>

        <Text className='emergency-alert__message'>{message}</Text>

        <View className='emergency-alert__divider' />

        <Text className='emergency-alert__disclaimer'>
          ⚠️ 以上内容仅供参考，不能替代专业兽医诊断。如情况紧急，请立即联系宠物医院。
        </Text>

        <View className='emergency-alert__actions'>
          {showSymptomButton && (
            <View
              className='emergency-alert__btn emergency-alert__btn--symptom'
              onClick={() => {
                onClose()
                Taro.navigateTo({ url: '/pagesPet/symptom-check/index' })
              }}
            >
              <Text className='emergency-alert__btn-text'>记录症状</Text>
            </View>
          )}
          {showFoodButton && (
            <View
              className='emergency-alert__btn emergency-alert__btn--food'
              onClick={() => {
                onClose()
                Taro.navigateTo({ url: '/pagesPet/food-query/index' })
              }}
            >
              <Text className='emergency-alert__btn-text'>查食物</Text>
            </View>
          )}
          {showHospitalButton && (
            <View
              className='emergency-alert__btn emergency-alert__btn--hospital'
              onClick={() => {
                onClose()
                Taro.navigateTo({ url: '/pagesPet/symptom-check/index?tab=hospital' })
              }}
            >
              <Text className='emergency-alert__btn-text'>找医院</Text>
            </View>
          )}
          <View
            className={`emergency-alert__btn emergency-alert__btn--close ${canClose ? '' : 'emergency-alert__btn--disabled'}`}
            onClick={() => canClose && onClose()}
          >
            <Text className='emergency-alert__btn-text'>
              {canClose ? '我知道了' : `请仔细阅读 (${countdown}s)`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
