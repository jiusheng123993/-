/**
 * 付费墙弹窗组件
 * 功能次数用完后引导用户开通会员，展示套餐对比和选择
 */
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import { MEMBERSHIP_PLANS, MEMBERSHIP_BENEFITS, type MembershipPlan } from '../services/membershipService'
import { trackEvent } from '../services/analyticsService'
import './PaywallPopup.scss'

const COMPARISON_ITEMS = [
  { featureName: '食物查询', freeValue: '5次/天', memberValue: '无限' },
  { featureName: '症状初筛', freeValue: '2次/天', memberValue: '无限' },
  { featureName: '健康趋势', freeValue: '7天', memberValue: '30天' },
  { featureName: '宠物数量', freeValue: '2只', memberValue: '5只' },
  { featureName: '宠物形象', freeValue: '预设头像 20款', memberValue: 'AI生成+照片专属' },
]

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
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan>('yearly')

  if (!visible) return null

  const selectedPlanConfig = MEMBERSHIP_PLANS.find(p => p.plan === selectedPlan)!

  const handleUpgrade = () => {
    trackEvent('paywall_upgrade_click', { featureName, selectedPlan })
    onClose()
    Taro.navigateTo({ url: '/pages/member/index' })
  }

  const handleDismiss = () => {
    trackEvent('paywall_dismiss', { featureName })
    onClose()
  }

  return (
    <View className='paywall-popup'>
      <View className='paywall-popup__overlay' onClick={handleDismiss} />
      <View className='paywall-popup__card'>
        <View className='paywall-popup__bar' />

        <Text className='paywall-popup__title'>🔒 {featureName} 次数已用完</Text>

        <View className='paywall-popup__info'>
          <View className='paywall-popup__info-row'>
            <Text className='paywall-popup__info-label'>今日剩余免费次数</Text>
            <Text className='paywall-popup__info-value'>{remainingFree}</Text>
          </View>
        </View>

        <View className='paywall-popup__plans'>
          <Text className='paywall-popup__section-title'>选择套餐</Text>
          <View className='paywall-popup__plan-options'>
            {MEMBERSHIP_PLANS.map((plan) => (
              <View
                key={plan.plan}
                className={`paywall-popup__plan${selectedPlan === plan.plan ? ' paywall-popup__plan--active' : ''}${plan.plan === 'yearly' ? ' paywall-popup__plan--best' : ''}`}
                onClick={() => setSelectedPlan(plan.plan)}
              >
                {plan.plan === 'yearly' && (
                  <View className='paywall-popup__plan-badge'>
                    <Text className='paywall-popup__plan-badge-text'>最划算</Text>
                  </View>
                )}
                <Text className='paywall-popup__plan-label'>{plan.label}</Text>
                <Text className='paywall-popup__plan-price'>
                  <Text className='paywall-popup__plan-price-symbol'>¥</Text>
                  {plan.price}
                </Text>
                {plan.discountLabel && (
                  <Text className='paywall-popup__plan-discount'>{plan.discountLabel}</Text>
                )}
                {selectedPlan === plan.plan && (
                  <View className='paywall-popup__plan-check'>✓</View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View className='paywall-popup__compare'>
          <Text className='paywall-popup__section-title'>免费版 vs 会员版</Text>
          <View className='paywall-popup__compare-table'>
            <View className='paywall-popup__compare-header'>
              <Text className='paywall-popup__compare-header-feature'>功能</Text>
              <Text className='paywall-popup__compare-header-free'>免费版</Text>
              <Text className='paywall-popup__compare-header-member'>会员版</Text>
            </View>
            {COMPARISON_ITEMS.map((item) => (
              <View key={item.featureName} className='paywall-popup__compare-row'>
                <Text className='paywall-popup__compare-feature'>{item.featureName}</Text>
                <Text className='paywall-popup__compare-free'>{item.freeValue}</Text>
                <Text className='paywall-popup__compare-member'>{item.memberValue}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className='paywall-popup__actions'>
          <View className='paywall-popup__btn paywall-popup__btn--upgrade' onClick={handleUpgrade}>
            <Text>立即开通 · ¥{selectedPlanConfig.price}/{selectedPlanConfig.plan === 'monthly' ? '月' : selectedPlanConfig.plan === 'quarterly' ? '季' : '年'}</Text>
          </View>
          <View className='paywall-popup__btn paywall-popup__btn--close' onClick={handleDismiss}>
            <Text>暂不需要</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
