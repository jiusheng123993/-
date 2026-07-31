/**
 * 空状态引导组件
 * 用户无宠物时展示欢迎语、添加宠物入口及核心功能亮点
 */
import { View, Text } from '@tarojs/components'
import './EmptyStateGuide.scss'

interface EmptyStateGuideProps {
  onAddPet: () => void
  onExplore: () => void
}

const FEATURE_HIGHLIGHTS = [
  { key: 'food', icon: '🍖', title: '食物查询', desc: '能不能吃一查便知', path: '/pagesPet/food-query/index' },
  { key: 'symptom', icon: '🩺', title: '症状初筛', desc: '异常表现早发现', path: '/pagesPet/symptom-check/index' },
  { key: 'breed', icon: '📖', title: '品种百科', desc: '40+品种全知道', path: '/pagesPet/breed/index' },
]

export default function EmptyStateGuide({ onAddPet, onExplore }: EmptyStateGuideProps) {
  return (
    <View className='empty-state-guide'>
      <View className='empty-state-guide__hero'>
        <Text className='empty-state-guide__hero-emoji'>🐾</Text>
        <Text className='empty-state-guide__hero-title'>欢迎来到星寰海</Text>
        <Text className='empty-state-guide__hero-subtitle'>你的宠物健康管家</Text>
      </View>

      <View className='empty-state-guide__actions'>
        <View className='empty-state-guide__primary-btn' onClick={onAddPet}>
          <Text className='empty-state-guide__primary-btn-text'>添加我的宠物</Text>
        </View>
        <View className='empty-state-guide__secondary-btn' onClick={onExplore}>
          <Text className='empty-state-guide__secondary-btn-text'>先逛逛</Text>
        </View>
      </View>

      <View className='empty-state-guide__highlights'>
        {FEATURE_HIGHLIGHTS.map(item => (
          <View key={item.key} className='empty-state-guide__highlight-item'>
            <View className='empty-state-guide__highlight-icon'>
              <Text className='empty-state-guide__highlight-emoji'>{item.icon}</Text>
            </View>
            <Text className='empty-state-guide__highlight-title'>{item.title}</Text>
            <Text className='empty-state-guide__highlight-desc'>{item.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
