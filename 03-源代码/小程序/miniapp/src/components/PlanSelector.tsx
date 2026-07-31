/**
 * 套餐选择器组件
 * 展示会员套餐列表，支持月度/季度/年度选择
 */
import { View, Text } from '@tarojs/components'
import type { MembershipPlan, MembershipPlanConfig } from '../services/membershipService'
import { MEMBERSHIP_PLANS } from '../services/membershipService'
import './PlanSelector.scss'

interface PlanSelectorProps {
  selectedPlan: MembershipPlan
  onSelectPlan: (plan: MembershipPlan) => void
}

export default function PlanSelector({ selectedPlan, onSelectPlan }: PlanSelectorProps) {
  return (
    <View className='plan-selector'>
      {MEMBERSHIP_PLANS.map((plan: MembershipPlanConfig) => (
        <View
          key={plan.plan}
          className={`plan-selector__card ${selectedPlan === plan.plan ? 'plan-selector__card--active' : ''}`}
          onClick={() => onSelectPlan(plan.plan)}
        >
          {plan.discountLabel && (
            <View className='plan-selector__badge'>
              <Text className='plan-selector__badge-text'>{plan.discountLabel}</Text>
            </View>
          )}
          <Text className='plan-selector__label'>{plan.label}</Text>
          <View className='plan-selector__price-row'>
            <Text className='plan-selector__price'>¥{plan.price}</Text>
            {plan.originalPrice > plan.price && (
              <Text className='plan-selector__original-price'>¥{plan.originalPrice}</Text>
            )}
          </View>
          <Text className='plan-selector__unit'>/月</Text>
          {selectedPlan === plan.plan && (
            <View className='plan-selector__check'>
              <Text className='plan-selector__check-icon'>✓</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  )
}
