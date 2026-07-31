/**
 * 首页骨架屏组件
 * 首页数据加载时展示的占位骨架，包含头部、宠物卡片、功能网格和卡片区域
 */
import { View } from '@tarojs/components'
import './HomeSkeleton.scss'

export default function HomeSkeleton() {
  return (
    <View className='home-skeleton'>
      <View className='home-skeleton__header'>
        <View className='home-skeleton__title' />
        <View className='home-skeleton__icon' />
      </View>

      <View className='home-skeleton__pet-card'>
        <View className='home-skeleton__avatar' />
        <View className='home-skeleton__info'>
          <View className='home-skeleton__name' />
          <View className='home-skeleton__detail' />
        </View>
      </View>

      <View className='home-skeleton__section'>
        <View className='home-skeleton__section-title' />
        <View className='home-skeleton__grid'>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} className='home-skeleton__action'>
              <View className='home-skeleton__action-icon' />
              <View className='home-skeleton__action-label' />
            </View>
          ))}
        </View>
      </View>

      <View className='home-skeleton__section'>
        <View className='home-skeleton__section-title' />
        <View className='home-skeleton__card'>
          <View className='home-skeleton__card-header'>
            <View className='home-skeleton__card-icon' />
            <View className='home-skeleton__card-title' />
          </View>
          <View className='home-skeleton__card-body'>
            <View className='home-skeleton__card-line' />
            <View className='home-skeleton__card-line' />
          </View>
        </View>
      </View>
    </View>
  )
}