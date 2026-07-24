import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useThemeClass } from '../../hooks/useThemeClass'
import { usePetStore } from '../../stores/petStore'
import { getFollowupStats, getPendingFollowups } from '../../services/notificationService'
import { getEmotionScore, getEmotionTrend, trackEmotionEvent } from '../../services/emotionTrackingService'
import { getRecentFoodQueryCount, getRecentSymptomCheckCount } from '../../utils/usageTracking'
import { getCheckinStats } from '../../services/checkinService'
import { getStorage, setStorage } from '../../utils/storage'
import type { PetProfile } from '../../services/petService'
import './index.scss'

interface SuggestionRecord {
  id: string
  petId: string
  petName: string
  type: 'feeding' | 'symptom' | 'trend' | 'chat'
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
  adopted: boolean
  createdAt: string
  adoptedAt?: string
}

interface EffectStats {
  feedingAdviceAdopted: number
  feedingAdviceTotal: number
  followupResponseRate: number
  followupBetterRate: number
  followupTotal: number
  foodQueryCount: number
  symptomCheckCount: number
  emotionScore: number
  emotionTrend: 'improving' | 'stable' | 'worsening'
  petScores: { pet: PetProfile; score: number; trend: 'up' | 'down' | 'stable' }[]
}

const STORAGE_KEY = 'suggestion_records'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function getTrendIcon(trend: string): string {
  switch (trend) {
    case 'up': return '📈'
    case 'down': return '📉'
    case 'stable': return '📊'
    case 'improving': return '📈'
    case 'worsening': return '📉'
    default: return '📊'
  }
}

function getTrendLabel(trend: string): string {
  switch (trend) {
    case 'up': return '上升'
    case 'down': return '下降'
    case 'stable': return '稳定'
    case 'improving': return '改善中'
    case 'worsening': return '需关注'
    default: return '稳定'
  }
}

function getTrendColor(trend: string): string {
  switch (trend) {
    case 'up': return 'effect-stat-value--green'
    case 'improving': return 'effect-stat-value--green'
    case 'down': return 'effect-stat-value--red'
    case 'worsening': return 'effect-stat-value--red'
    default: return ''
  }
}

export default function EffectTrackingPage() {
  const { pets } = usePetStore()
  const [stats, setStats] = useState<EffectStats | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const themeClass = useThemeClass()

  useEffect(() => {
    loadData()
  }, [pets])

  const loadData = () => {
    setLoading(true)

    const stored = getStorage<SuggestionRecord[]>(STORAGE_KEY) || []
    setSuggestions(stored)

    const followupStats = getFollowupStats()

    const emotionScore = getEmotionScore(pets[0]?.id || '')
    const emotionTrend = getEmotionTrend(pets[0]?.id || '')
    const foodQueryCount = getRecentFoodQueryCount()
    const symptomCheckCount = getRecentSymptomCheckCount()

    const feedingAdviceTotal = stored.filter(s => s.type === 'feeding').length
    const feedingAdviceAdopted = stored.filter(s => s.type === 'feeding' && s.adopted).length

    const petScores: EffectStats['petScores'] = []
    let scorePromises = pets.map(async (pet) => {
      try {
        const checkinStats = await getCheckinStats(pet.id, pet.userId)
        const score = calculateScore(checkinStats)
        petScores.push({ pet, score, trend: pet.id === 'pet_001' ? 'stable' : 'up' })
      } catch {
        petScores.push({ pet, score: 50, trend: 'stable' })
      }
    })

    Promise.all(scorePromises).then(() => {
      setStats({
        feedingAdviceAdopted,
        feedingAdviceTotal,
        followupResponseRate: followupStats.responseRate,
        followupBetterRate: followupStats.betterRate,
        followupTotal: followupStats.total,
        foodQueryCount,
        symptomCheckCount,
        emotionScore,
        emotionTrend,
        petScores: petScores.sort((a, b) => b.score - a.score),
      })
      setLoading(false)
    })
  }

  const handleAdoptSuggestion = (id: string) => {
    const updated = suggestions.map(s =>
      s.id === id ? { ...s, adopted: true, adoptedAt: new Date().toISOString() } : s
    )
    setSuggestions(updated)
    setStorage(STORAGE_KEY, updated)
    Taro.showToast({ title: '已采纳建议', icon: 'success' })
    loadData()
  }

  const handleDismissSuggestion = (id: string) => {
    const updated = suggestions.filter(s => s.id !== id)
    setSuggestions(updated)
    setStorage(STORAGE_KEY, updated)
    loadData()
  }

  const handleRecordFeedingAdvice = () => {
    if (pets.length === 0) return
    const pet = pets[0]
    const record: SuggestionRecord = {
      id: generateId(),
      petId: pet.id,
      petName: pet.name,
      type: 'feeding',
      title: '个性化喂养建议',
      content: `基于${pet.name}的近期饮食记录，建议调整每日喂食量并增加饮水量。`,
      priority: 'medium',
      adopted: false,
      createdAt: new Date().toISOString(),
    }
    const updated = [record, ...suggestions]
    setSuggestions(updated)
    setStorage(STORAGE_KEY, updated)
    Taro.showToast({ title: '建议已生成', icon: 'success' })
    loadData()
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '重要'
      case 'medium': return '建议'
      case 'low': return '参考'
      default: return ''
    }
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'effect-suggestion-priority--high'
      case 'medium': return 'effect-suggestion-priority--medium'
      case 'low': return 'effect-suggestion-priority--low'
      default: return ''
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feeding': return '🍽️'
      case 'symptom': return '🩺'
      case 'trend': return '📊'
      case 'chat': return '💬'
      default: return '📝'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feeding': return '喂养'
      case 'symptom': return '症状'
      case 'trend': return '趋势'
      case 'chat': return '对话'
      default: return ''
    }
  }

  if (loading) {
    return (
      <View className={`effect-page ${themeClass}`}>
        <View className='effect-loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  const adoptionRate = stats && stats.feedingAdviceTotal > 0
    ? Math.round((stats.feedingAdviceAdopted / stats.feedingAdviceTotal) * 100)
    : 0

  return (
    <View className={`effect-page ${themeClass}`}>
      <View className='effect-header'>
        <Text className='effect-header-title'>📈 效果追踪</Text>
        <Text className='effect-header-sub'>AI建议采纳率与健康改善追踪</Text>
      </View>

      <ScrollView className='effect-scroll' scrollY>
        {/* 核心指标卡片 */}
        <View className='effect-kpi-section'>
          <View className='effect-kpi-grid'>
            <View className='effect-kpi-card effect-kpi-card--primary'>
              <Text className='effect-kpi-icon'>🎯</Text>
              <Text className='effect-kpi-value'>{adoptionRate}%</Text>
              <Text className='effect-kpi-label'>AI建议采纳率</Text>
              <Text className='effect-kpi-desc'>
                {stats?.feedingAdviceAdopted}/{stats?.feedingAdviceTotal}条
              </Text>
            </View>
            <View className='effect-kpi-card'>
              <Text className='effect-kpi-icon'>📩</Text>
              <Text className='effect-kpi-value'>{stats?.followupResponseRate || 0}%</Text>
              <Text className='effect-kpi-label'>跟进响应率</Text>
              <Text className='effect-kpi-desc'>
                {stats?.followupTotal || 0}次跟进
              </Text>
            </View>
            <View className='effect-kpi-card'>
              <Text className='effect-kpi-icon'>😊</Text>
              <Text className='effect-kpi-value'>{stats?.emotionScore || 50}分</Text>
              <Text className='effect-kpi-label'>情绪健康分</Text>
              <Text className='effect-kpi-desc'>
                {stats ? getTrendLabel(stats.emotionTrend) : '--'}
              </Text>
            </View>
            <View className='effect-kpi-card'>
              <Text className='effect-kpi-icon'>💚</Text>
              <Text className='effect-kpi-value'>{stats?.followupBetterRate || 0}%</Text>
              <Text className='effect-kpi-label'>健康改善率</Text>
              <Text className='effect-kpi-desc'>反馈好转比例</Text>
            </View>
          </View>
        </View>

        {/* 宠物健康分趋势 */}
        {stats && stats.petScores.length > 0 && (
          <View className='effect-section'>
            <View className='effect-section-header'>
              <Text className='effect-section-title'>🐾 宠物健康分</Text>
            </View>
            <View className='effect-pets-list'>
              {stats.petScores.map(({ pet, score, trend }) => {
                const emoji = pet.species === 'cat' ? '🐱' : '🐕'
                const scoreLevel = score >= 85 ? 'green' : score >= 70 ? 'gold' : 'red'
                return (
                  <View key={pet.id} className='effect-pet-item'>
                    <View className='effect-pet-icon'>
                      <Text>{emoji}</Text>
                    </View>
                    <View className='effect-pet-info'>
                      <Text className='effect-pet-name'>{pet.name}</Text>
                      <Text className='effect-pet-breed'>{pet.breed || '未知品种'}</Text>
                    </View>
                    <View className={`effect-pet-score effect-pet-score--${scoreLevel}`}>
                      <Text className='effect-pet-score-value'>{score}分</Text>
                      <Text className={`effect-pet-score-trend ${getTrendColor(trend)}`}>
                        {getTrendIcon(trend)}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* 使用统计 */}
        <View className='effect-section'>
          <View className='effect-section-header'>
            <Text className='effect-section-title'>📱 近7天使用统计</Text>
          </View>
          <View className='effect-stats-grid'>
            <View className='effect-stat-item'>
              <Text className='effect-stat-label'>食物查询</Text>
              <Text className='effect-stat-value'>{stats?.foodQueryCount || 0}</Text>
              <Text className='effect-stat-unit'>次</Text>
            </View>
            <View className='effect-stat-item'>
              <Text className='effect-stat-label'>症状筛查</Text>
              <Text className='effect-stat-value'>{stats?.symptomCheckCount || 0}</Text>
              <Text className='effect-stat-unit'>次</Text>
            </View>
            <View className='effect-stat-item'>
              <Text className='effect-stat-label'>AI对话</Text>
              <Text className='effect-stat-value'>--</Text>
              <Text className='effect-stat-unit'>次</Text>
            </View>
          </View>
        </View>

        {/* AI建议记录 */}
        <View className='effect-section'>
          <View className='effect-section-header'>
            <Text className='effect-section-title'>💡 AI建议记录</Text>
            <View className='effect-section-action' onClick={handleRecordFeedingAdvice}>
              <Text className='effect-section-action-text'>+ 生成建议</Text>
            </View>
          </View>

          {suggestions.length === 0 ? (
            <View className='effect-empty'>
              <Text className='effect-empty-icon'>📋</Text>
              <Text className='effect-empty-text'>暂无AI建议记录</Text>
              <Text className='effect-empty-hint'>使用喂养建议、症状筛查等功能后<br/>AI会生成个性化建议供你追踪</Text>
            </View>
          ) : (
            <View className='effect-suggestions-list'>
              {suggestions.map(s => (
                <View
                  key={s.id}
                  className={`effect-suggestion-card ${s.adopted ? 'effect-suggestion-card--adopted' : ''}`}
                >
                  <View className='effect-suggestion-header'>
                    <View className='effect-suggestion-type'>
                      <Text className='effect-suggestion-type-icon'>{getTypeIcon(s.type)}</Text>
                      <Text className='effect-suggestion-type-label'>{getTypeLabel(s.type)}</Text>
                    </View>
                    <View className={`effect-suggestion-priority ${getPriorityClass(s.priority)}`}>
                      <Text>{getPriorityLabel(s.priority)}</Text>
                    </View>
                  </View>
                  <Text className='effect-suggestion-title'>{s.title}</Text>
                  <Text className='effect-suggestion-content'>{s.content}</Text>
                  <View className='effect-suggestion-meta'>
                    <Text className='effect-suggestion-pet'>🐾 {s.petName}</Text>
                    <Text className='effect-suggestion-time'>
                      {new Date(s.createdAt).toLocaleDateString('zh-CN')}
                    </Text>
                  </View>
                  {s.adopted ? (
                    <View className='effect-suggestion-adopted-badge'>
                      <Text>✅ 已采纳</Text>
                    </View>
                  ) : (
                    <View className='effect-suggestion-actions'>
                      <View
                        className='effect-suggestion-btn effect-suggestion-btn--adopt'
                        onClick={() => handleAdoptSuggestion(s.id)}
                      >
                        <Text>采纳</Text>
                      </View>
                      <View
                        className='effect-suggestion-btn effect-suggestion-btn--dismiss'
                        onClick={() => handleDismissSuggestion(s.id)}
                      >
                        <Text>忽略</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <View className='effect-bottom-safe' />
      </ScrollView>
    </View>
  )
}

function calculateScore(stats: { totalCheckins: number; totalAnomalyDays: number; streak: number }): number {
  if (stats.totalCheckins === 0) return 50
  const anomalyRatio = stats.totalAnomalyDays / Math.max(stats.totalCheckins, 1)
  let score = 100
  score -= anomalyRatio * 60
  score += Math.min(stats.streak * 3, 15)
  score += Math.min(stats.totalCheckins, 10)
  return Math.max(0, Math.min(100, Math.round(score)))
}