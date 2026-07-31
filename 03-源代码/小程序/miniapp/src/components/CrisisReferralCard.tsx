/**
 * 危机转介卡片组件
 * 提供心理援助热线拨打、紧急就医引导及后续跟进功能
 */
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useCallback } from 'react'
import { HOTLINE_NUMBER } from '../constants'
import type { CrisisTriggerSource } from '../engines/emotion'
import { trackEvent as trackEventService } from '../services/analyticsService'
import './CrisisReferralCard.scss'

interface CrisisReferralCardProps {
  message: string
  onDismiss: () => void
  severity?: 'moderate' | 'severe'
  onFollowUp?: (action: 'contacted' | 'okay') => void
  triggerSource?: CrisisTriggerSource
}

export default function CrisisReferralCard({ message, onDismiss, severity = 'severe', onFollowUp, triggerSource = 'grief' }: CrisisReferralCardProps) {
  const handleCallHotline = useCallback(() => {
    trackEventService('crisis_hotline_call', { source: triggerSource })
    Taro.makePhoneCall({ phoneNumber: HOTLINE_NUMBER.replace(/-/g, '') })
  }, [triggerSource])

  const handleFollowUp = useCallback((action: 'contacted' | 'okay') => {
    trackEventService('crisis_referral_follow_up', { action, source: triggerSource })
    if (onFollowUp) {
      onFollowUp(action)
    }
    onDismiss()
  }, [onFollowUp, onDismiss, triggerSource])

  const isSevere = severity === 'severe'

  return (
    <View className={`crisis-referral crisis-referral--${severity}`}>
      <View className='crisis-referral__card'>
        <Text className='crisis-referral__icon'>{isSevere ? '🆘' : '💛'}</Text>
        <Text className='crisis-referral__message'>{message}</Text>

        {isSevere && (
          <View className='crisis-referral__hotline' onClick={handleCallHotline}>
            <Text className='crisis-referral__hotline-icon'>📞</Text>
            <Text className='crisis-referral__hotline-number'>{HOTLINE_NUMBER}</Text>
            <Text className='crisis-referral__hotline-label'>24h心理援助热线</Text>
          </View>
        )}

        {isSevere && (
          <View className='crisis-referral__emergency-section'>
            <View className='crisis-referral__emergency-item' onClick={() => Taro.navigateTo({ url: '/pagesPet/symptom-check/index' })}>
              <Text className='crisis-referral__emergency-icon'>🏥</Text>
              <Text className='crisis-referral__emergency-text'>找宠物医院</Text>
            </View>
            <View className='crisis-referral__emergency-item' onClick={handleCallHotline}>
              <Text className='crisis-referral__emergency-icon'>☎️</Text>
              <Text className='crisis-referral__emergency-text'>紧急联系</Text>
            </View>
          </View>
        )}

        {!isSevere && (
          <View className='crisis-referral__moderate-tips'>
            <View className='crisis-referral__tip-item'>
              <Text className='crisis-referral__tip-icon'>🫁</Text>
              <Text className='crisis-referral__tip-text'>试试深呼吸，放松一下</Text>
            </View>
            <View className='crisis-referral__tip-item'>
              <Text className='crisis-referral__tip-icon'>💤</Text>
              <Text className='crisis-referral__tip-text'>适当休息，不要过度焦虑</Text>
            </View>
            <View className='crisis-referral__tip-item'>
              <Text className='crisis-referral__tip-icon'>📊</Text>
              <Text className='crisis-referral__tip-text'>查看健康数据趋势</Text>
            </View>
          </View>
        )}

        <View className='crisis-referral__actions'>
          {isSevere && (
            <View className='crisis-referral__call-btn' onClick={handleCallHotline}>
              <Text className='crisis-referral__call-text'>拨打热线</Text>
            </View>
          )}
        </View>

        <View className='crisis-referral__follow-up'>
          <View
            className='crisis-referral__follow-up-btn crisis-referral__follow-up-btn--primary'
            onClick={() => handleFollowUp('contacted')}
          >
            <Text className='crisis-referral__follow-up-text'>我已联系帮助</Text>
          </View>
          <View
            className='crisis-referral__follow-up-btn crisis-referral__follow-up-btn--secondary'
            onClick={() => handleFollowUp('okay')}
          >
            <Text className='crisis-referral__follow-up-text'>我没事，谢谢关心</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
