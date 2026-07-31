/**
 * 隐私弹窗组件
 * 使用功能前展示隐私协议同意弹窗
 */
import { View, Text } from '@tarojs/components'
import './PrivacyPopup.scss'

interface PrivacyPopupProps {
  visible: boolean
  onAgree: () => void
  onReject: () => void
}

export default function PrivacyPopup({ visible, onAgree, onReject }: PrivacyPopupProps) {
  if (!visible) return null

  return (
    <View className='privacy-popup'>
      <View className='privacy-popup__overlay' />
      <View className='privacy-popup__content'>
        <Text className='privacy-popup__title'>隐私保护提示</Text>
        <Text className='privacy-popup__text'>
          在使用该功能前，请仔细阅读
          <Text className='privacy-popup__link'>《用户协议》</Text>
          和
          <Text className='privacy-popup__link'>《隐私政策》</Text>
          。如你同意，请点击"同意"开始使用。
        </Text>
        <View className='privacy-popup__actions'>
          <View className='privacy-popup__btn privacy-popup__btn--agree' onClick={onAgree}>
            <Text>同意</Text>
          </View>
          <View className='privacy-popup__btn privacy-popup__btn--reject' onClick={onReject}>
            <Text>拒绝</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
