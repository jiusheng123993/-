/**
 * 家庭页面快捷入口组件
 * 展示功能快捷入口卡片
 */
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { QuickEntry } from './utils'

interface FamilyQuickGridProps {
  entries: QuickEntry[]
}

export default function FamilyQuickGrid({ entries }: FamilyQuickGridProps) {
  const handleQuickEntry = (entry: QuickEntry) => {
    if (!entry.url) {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: entry.url })
  }

  return (
    <>
      <View className='family-section-header' style={{ marginTop: '28rpx' }}>
        <Text className='family-section-title'>快捷入口</Text>
      </View>

      <View className='family-quick-grid'>
        {entries.map(entry => (
          <View
            key={entry.label}
            className='family-quick-card'
            onClick={() => handleQuickEntry(entry)}
          >
            <Text className='family-quick-icon'>{entry.icon}</Text>
            <Text className='family-quick-label'>{entry.label}</Text>
          </View>
        ))}
      </View>
    </>
  )
}