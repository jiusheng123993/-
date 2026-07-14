import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useMemo, useEffect } from 'react'
import FloatingNav from '../../components/FloatingNav'
import './index.scss'

export default function HomePage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const emotions = [
    { key: 'sad', label: '难过', desc: '想哭，心里堵', color: '#8a9aad', icon: 'rain' },
    { key: 'anxious', label: '焦虑', desc: '静不下来', color: '#a89a8a', icon: 'lightning' },
    { key: 'tired', label: '疲惫', desc: '身心俱疲', color: '#9a8a9a', icon: 'moon' },
    { key: 'lonely', label: '孤独', desc: '没人懂我', color: '#8a9a8a', icon: 'star' }
  ]

  const routines = [
    { key: 'breathe', label: '呼吸', icon: 'wind' },
    { key: 'journal', label: '记录', icon: 'pen', active: true },
    { key: 'treehole', label: '树洞', icon: 'tree' },
    { key: 'more', label: '更多', icon: 'plus' }
  ]

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 12) return '早上好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }, [])

  const today = useMemo(() => {
    const date = new Date()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${date.getMonth() + 1}月${date.getDate()}日 · ${weekDays[date.getDay()]}`
  }, [])

  const handleEmotionClick = (flowId: string) => {
    setSelectedMood(flowId)
    setTimeout(() => {
      Taro.navigateTo({ url: `/pages/emergency/index?flowId=${flowId}` })
    }, 220)
  }

  // SVG 图标
  const Icon = ({ name, size = 20, color = 'currentColor' }: { name: string; size?: number; color?: string }) => {
    const icons: Record<string, string> = {
      rain: 'M12 3c-4.5 0-8 3.5-8 8 0 4.5 3.5 8 8 8s8-3.5 8-8c0-4.5-3.5-8-8-8zm-1 12l-2-2m2 2l2-2m-2 2v-6',
      lightning: 'M13 2L4 14h7l-2 8 9-10h-7l2-8z',
      moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
      star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
      wind: 'M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2',
      pen: 'M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z',
      tree: 'M12 22V8m0 0L4 16m8-8l8 8M7 8l5-6 5 6',
      plus: 'M12 5v14M5 12h14',
      sun: 'M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 7a5 5 0 100 10 5 5 0 000-10z',
      chevron: 'M9 18l6-6-6-6'
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={icons[name] || icons.star} />
      </svg>
    )
  }

  return (
    <View className={`home-page ${isVisible ? 'visible' : ''}`}>
      {/* 水墨背景装饰 */}
      <View className='ink-bg-decoration ink-bg-1' />
      <View className='ink-bg-decoration ink-bg-2' />

      {/* 顶部 */}
      <View className='home-header ink-item' style={{ animationDelay: '0.1s' }}>
        <View className='greeting-group'>
          <Text className='greeting-small'>{greeting}</Text>
          <Text className='greeting-name'>星寰海</Text>
        </View>
        <View className='avatar'>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </View>
      </View>

      {/* 今日状态卡片 */}
      <View className='status-card ink-item' style={{ animationDelay: '0.2s' }}>
        <View className='status-main'>
          <Text className='status-label'>今天状态</Text>
          <Text className='status-value'>值得被倾听</Text>
        </View>
        <View className='status-divider' />
        <View className='status-side'>
          <View className='status-side-item'>
            <Text className='status-side-label'>连续记录</Text>
            <Text className='status-side-value'>3 天</Text>
          </View>
          <View className='status-side-item'>
            <Text className='status-side-label'>今日已聊</Text>
            <Text className='status-side-value'>1 次</Text>
          </View>
        </View>
      </View>

      {/* 情绪卡片区 */}
      <View className='emotion-section ink-item' style={{ animationDelay: '0.3s' }}>
        <View className='section-header'>
          <Text className='section-title'>此刻的心情</Text>
          <Text className='section-action'>See All</Text>
        </View>

        <View className='emotion-grid'>
          {emotions.map((emotion, index) => (
            <View
              key={emotion.key}
              className={`emotion-card ink-item ${selectedMood === emotion.key ? 'selected' : ''}`}
              style={{
                animationDelay: `${0.4 + index * 0.1}s`,
                backgroundColor: emotion.color
              }}
              onClick={() => handleEmotionClick(emotion.key)}
            >
              <View className='emotion-icon-wrap'>
                <Icon name={emotion.icon} size={22} color="#ffffff" />
              </View>
              <Text className='emotion-label'>{emotion.label}</Text>
              <Text className='emotion-desc'>{emotion.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 快捷 Routine */}
      <View className='routine-section ink-item' style={{ animationDelay: '0.7s' }}>
        <Text className='section-title'>快捷方式</Text>
        <View className='routine-list'>
          {routines.map((routine, index) => (
            <View
              key={routine.key}
              className={`routine-chip ink-item ${routine.active ? 'active' : ''}`}
              style={{ animationDelay: `${0.8 + index * 0.05}s` }}
            >
              <View className='routine-icon-wrap'>
                <Icon name={routine.icon} size={18} color={routine.active ? '#ffffff' : '#5a5a5a'} />
              </View>
              <Text className='routine-label'>{routine.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 底部 */}
      <View className='home-footer ink-item' style={{ animationDelay: '0.9s' }}>
        <Text className='footer-text'>{today}</Text>
      </View>

      {/* 悬浮导航 */}
      <FloatingNav />
    </View>
  )
}
