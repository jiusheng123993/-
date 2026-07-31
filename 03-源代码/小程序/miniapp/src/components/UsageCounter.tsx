/**
 * 使用额度统计组件
 * 展示免费版与会员版的功能额度对比
 */
import { View, Text } from '@tarojs/components'
import { MEMBERSHIP_BENEFITS } from '../services/membershipService'
import type { MembershipBenefit } from '../services/membershipService'
import './UsageCounter.scss'

interface UsageCounterProps {
  isMember: boolean
}

export default function UsageCounter({ isMember }: UsageCounterProps) {
  return (
    <View className='usage-counter'>
      <View className='usage-counter__header'>
        <View className='usage-counter__col usage-counter__col--feature'>
          <Text className='usage-counter__col-text'>功能</Text>
        </View>
        <View className='usage-counter__col usage-counter__col--free'>
          <Text className='usage-counter__col-text'>免费</Text>
        </View>
        <View className='usage-counter__col usage-counter__col--member'>
          <Text className='usage-counter__col-text'>会员</Text>
        </View>
      </View>
      {MEMBERSHIP_BENEFITS.map((benefit: MembershipBenefit) => (
        <View
          key={benefit.featureKey}
          className={`usage-counter__row ${benefit.isHighlight ? 'usage-counter__row--highlight' : ''}`}
        >
          <View className='usage-counter__col usage-counter__col--feature'>
            <Text className='usage-counter__feature-name'>{benefit.featureName}</Text>
          </View>
          <View className='usage-counter__col usage-counter__col--free'>
            <Text className={`usage-counter__value ${benefit.freeValue === '❌' ? 'usage-counter__value--disabled' : ''}`}>
              {benefit.freeValue}
            </Text>
          </View>
          <View className='usage-counter__col usage-counter__col--member'>
            <Text className={`usage-counter__value ${benefit.memberValue === '✅' || benefit.memberValue === '不限' ? 'usage-counter__value--active' : ''}`}>
              {benefit.memberValue}
            </Text>
          </View>
        </View>
      ))}
      {isMember && (
        <View className='usage-counter__member-badge'>
          <Text className='usage-counter__member-badge-text'>当前为会员</Text>
        </View>
      )}
    </View>
  )
}
