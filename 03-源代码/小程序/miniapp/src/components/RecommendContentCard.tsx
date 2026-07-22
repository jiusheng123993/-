import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './RecommendContentCard.scss'

interface RecommendItem {
  key: string
  icon: string
  title: string
  desc: string
  path: string
}

interface RecommendContentCardProps {
  onNavigate: (path: string) => void
}

const RECOMMEND_ITEMS: RecommendItem[] = [
  { key: 'breed', icon: '🐱', title: '热门品种百科', desc: '了解40+品种特征和护理要点', path: '/pagesPet/breed/index' },
  { key: 'food', icon: '🍖', title: '食物安全速查', desc: '巧克力、葡萄...这些不能吃！', path: '/pagesPet/food-query/index' },
  { key: 'health', icon: '💡', title: '健康小贴士', desc: '每天3秒打卡，守护毛孩子', path: '/pagesPet/checkin/index' },
]

const DISMISSED_KEY = 'xhh_recommend_dismissed'

export default function RecommendContentCard({ onNavigate }: RecommendContentCardProps) {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return Taro.getStorageSync(DISMISSED_KEY) || false
  })

  if (dismissed) return null

  const handleDismiss = (): void => {
    setDismissed(true)
    Taro.setStorageSync(DISMISSED_KEY, true)
  }

  return (
    <View className='recommend-content-card'>
      <View className='recommend-content-card__header'>
        <Text className='recommend-content-card__title'>为你推荐</Text>
        <View className='recommend-content-card__close' onClick={handleDismiss}>
          <Text className='recommend-content-card__close-text'>✕</Text>
        </View>
      </View>

      <View className='recommend-content-card__list'>
        {RECOMMEND_ITEMS.map(item => (
          <View
            key={item.key}
            className='recommend-content-card__item'
            onClick={() => onNavigate(item.path)}
          >
            <View className='recommend-content-card__item-icon'>
              <Text className='recommend-content-card__item-emoji'>{item.icon}</Text>
            </View>
            <View className='recommend-content-card__item-info'>
              <Text className='recommend-content-card__item-title'>{item.title}</Text>
              <Text className='recommend-content-card__item-desc'>{item.desc}</Text>
            </View>
            <Text className='recommend-content-card__item-arrow'>›</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
