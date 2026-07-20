import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import './PaywallPopup.scss'

interface PaywallPopupProps {
  visible: boolean
  featureName: string
  remainingFree: number
  onUpgrade: () => void
  onClose: () => void
}

export default function PaywallPopup({
  visible,
  featureName,
  remainingFree,
  onUpgrade,
  onClose,
}: PaywallPopupProps) {
  if (!visible) return null

  return (
    <View className='paywall-popup'>
      <View className='paywall-popup__overlay' onClick={onClose} />
      <View className='paywall-popup__card'>
        <View className='paywall-popup__bar' />

        <Text className='paywall-popup__title'>🔒 {featureName} 次数已用完</Text>

        <View className='paywall-popup__info'>
          <View className='paywall-popup__info-row'>
            <Text className='paywall-popup__info-label'>今日剩余免费次数</Text>
            <Text className='paywall-popup__info-value'>{remainingFree}</Text>
          </View>
        </View>

        <View className='paywall-popup__benefits'>
          <Text className='paywall-popup__benefits-title'>升级会员享以下权益：</Text>
          <View className='paywall-popup__benefit-item'>
            <Text className='paywall-popup__benefit-dot'>•</Text>
            <Text className='paywall-popup__benefit-text'>每日更多使用次数</Text>
          </View>
          <View className='paywall-popup__benefit-item'>
            <Text className='paywall-popup__benefit-dot'>•</Text>
            <Text className='paywall-popup__benefit-text'>AI 深度健康分析</Text>
          </View>
          <View className='paywall-popup__benefit-item'>
            <Text className='paywall-popup__benefit-dot'>•</Text>
            <Text className='paywall-popup__benefit-text'>专属健康报告</Text>
          </View>
        </View>

        <View className='paywall-popup__actions'>
          <View className='paywall-popup__btn paywall-popup__btn--upgrade' onClick={() => { onClose(); Taro.navigateTo({ url: '/pages/member/index' }) }}>
            <Text>升级会员</Text>
          </View>
          <View className='paywall-popup__btn paywall-popup__btn--close' onClick={onClose}>
            <Text>暂不需要</Text>
          </View>
        </View>
      </View>
    </View>
  )
}