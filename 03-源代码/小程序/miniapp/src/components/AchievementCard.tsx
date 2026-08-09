/**
 * 成就卡片组件
 * 展示宠物各类成就（生日、疫苗、连续打卡等），含宠物头像和成就信息
 */
import { View, Text } from '@tarojs/components'
import './AchievementCard.scss'

export interface AchievementConfig {
  id?: string
  type: 'birthday' | 'vaccine_complete' | 'streak_7' | 'streak_30' | 'streak_100' | 'rainbow_bridge' | 'holiday'
  title: string
  subtitle: string
  icon: string
  color: string
}

const ACHIEVEMENT_DEFS: Record<string, AchievementConfig> = {
  birthday: {
    type: 'birthday',
    title: '生日快乐',
    subtitle: '又长大一岁了',
    icon: '🎂',
    color: '#FF69B4'
  },
  vaccine_complete: {
    type: 'vaccine_complete',
    title: '疫苗全勤',
    subtitle: '年度疫苗全部完成',
    icon: '💉',
    color: '#4CAF50'
  },
  streak_7: {
    type: 'streak_7',
    title: '连续7天',
    subtitle: '一周健康打卡',
    icon: '⭐',
    color: '#FFD700'
  },
  streak_30: {
    type: 'streak_30',
    title: '连续30天',
    subtitle: '月度健康达人',
    icon: '🏆',
    color: '#FF9800'
  },
  streak_100: {
    type: 'streak_100',
    title: '连续100天',
    subtitle: '百天守护勋章',
    icon: '👑',
    color: '#9C27B0'
  },
  rainbow_bridge: {
    type: 'rainbow_bridge',
    title: '彩虹桥',
    subtitle: '永远记得你',
    icon: '🌈',
    color: '#9B8EC4'
  },
  holiday: {
    type: 'holiday',
    title: '节日快乐',
    subtitle: '和毛孩子一起过节',
    icon: '🎄',
    color: '#F44336'
  }
}

interface AchievementCardProps {
  achievement: AchievementConfig
  petName: string
  species: 'dog' | 'cat'
  onClose?: () => void
  onShare?: () => void
}

export default function AchievementCard({
  achievement,
  petName,
  species,
  onClose,
  onShare
}: AchievementCardProps) {
  // 兜底形象：物种 emoji + 渐变圆底（替代简笔画 SVG 脸）
  const fallbackEmoji = species === 'cat' ? '🐱' : '🐶'
  const fallbackClass = species === 'cat' ? 'achievement-card__face-badge--cat' : 'achievement-card__face-badge--dog'

  return (
    <View className='achievement-card' style={{ borderColor: achievement.color }}>
      {onClose && (
        <View className='achievement-card__close' onClick={onClose}>
          <Text className='achievement-card__close-text'>✕</Text>
        </View>
      )}

      <View className='achievement-card__icon'>
        <Text className='achievement-card__icon-text'>{achievement.icon}</Text>
      </View>

      <View className='achievement-card__body'>
        <View className='achievement-card__face'>
          <View className={`achievement-card__face-badge ${fallbackClass}`}>
            <Text className='achievement-card__face-emoji'>{fallbackEmoji}</Text>
          </View>
        </View>

        <View className='achievement-card__info'>
          <Text className='achievement-card__title' style={{ color: achievement.color }}>
            {achievement.title}
          </Text>
          <Text className='achievement-card__subtitle'>{achievement.subtitle}</Text>
          <Text className='achievement-card__pet-name'>{petName}</Text>
        </View>
      </View>

      <View className='achievement-card__footer' style={{ backgroundColor: achievement.color }}>
        <Text className='achievement-card__footer-text'>成就纪念卡</Text>
      </View>

      {onShare && (
        <View className='achievement-card__actions'>
          <View className='achievement-card__share-btn' onClick={onShare}>
            <Text className='achievement-card__share-btn-text'>炫耀一下</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export { ACHIEVEMENT_DEFS }
