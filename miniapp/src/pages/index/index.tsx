import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

export default function HomePage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)

  const mainEmotions = [
    { key: 'sad', label: '我好难过', color: '#4fc3f7' },
    { key: 'anxious', label: '我好焦虑', color: '#ff8a65' },
    { key: 'tired', label: '我好累', color: '#9fa8da' },
    { key: 'lonely', label: '我好孤独', color: '#80deea' },
    { key: 'unclear', label: '我说不出来', color: '#ce93d8' }
  ]

  const handleEmotionClick = (flowId: string) => {
    setSelectedMood(flowId)
    Taro.navigateTo({ url: `/pages/emergency/index?flowId=${flowId}` })
  }

  return (
    <View className="home-page">
      <View className="home-container">
        <Text className="home-title">你怎么了？</Text>
        <Text className="home-subtitle">选一个最接近的，我们慢慢聊</Text>
        <View className="emotion-buttons">
          {mainEmotions.map((emotion) => (
            <Button
              key={emotion.key}
              className={`emotion-btn ${selectedMood === emotion.key ? 'selected' : ''}`}
              style={{ backgroundColor: emotion.color }}
              onClick={() => handleEmotionClick(emotion.key)}
            >
              <Text className="emotion-label">{emotion.label}</Text>
            </Button>
          ))}
        </View>
        <Text className="home-footer">这里没有评判，只有倾听</Text>
      </View>
    </View>
  )
}