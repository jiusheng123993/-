import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { usePetStore } from '../../stores/petStore'
import { useMembership } from '../../hooks/useMembership'
import { useCheckinStore } from '../../stores/checkinStore'
import { PageLoading, PageError, PetAvatar, NpsSurvey } from '../../components'
import { checkNpsEligibility, getTriggerEvent, submitNpsResponse, dismissNpsSurvey } from '../../services/npsService'
import type { ExpressionContext } from '../../engines/petAvatar'
import type { NpsTriggerEvent } from '../../types/npsTypes'
import './index.scss'

interface QuickAction {
  key: string
  icon: string
  label: string
  path: string
  featureKey?: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { key: 'food', icon: '🍖', label: '食物查询', path: '/pagesPet/food-query/index', featureKey: 'food_query' },
  { key: 'symptom', icon: '🩺', label: '症状初筛', path: '/pagesPet/symptom-check/index', featureKey: 'symptom_check' },
  { key: 'vaccine', icon: '💉', label: '疫苗日历', path: '/pagesPet/vaccine/index' },
  { key: 'trend', icon: '📊', label: '健康趋势', path: '/pagesPet/trends/index', featureKey: 'health_trend' },
  { key: 'breed', icon: '📖', label: '品种百科', path: '/pagesPet/breed/index' },
]

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNps, setShowNps] = useState(false)
  const [npsTriggerEvent, setNpsTriggerEvent] = useState<NpsTriggerEvent>('manual')
  const user = useAuthStore(s => s.user)
  const { currentPet, pets, initUser: initPetUser, fetchPets } = usePetStore()
  const { isMember, checkAccess, shouldShowPaywall, markPaywallShown } = useMembership()
  const todayEntry = useCheckinStore(s => s.todayEntry)
  const fetchTodayCheckin = useCheckinStore(s => s.fetchTodayCheckin)
  const initCheckinUser = useCheckinStore(s => s.initUser)

  const loadHomeData = useCallback(async () => {
    if (!user?.id) return
    setError('')
    setIsLoading(true)
    try {
      await Promise.all([
        initPetUser(user.id),
        initCheckinUser(user.id),
        fetchPets(),
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, initPetUser, initCheckinUser, fetchPets])

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    loadHomeData()
  }, [loadHomeData])

  useEffect(() => {
    if (!user?.id || !user?.createdAt) return
    const createdAt = user.createdAt
    const npsStatus = checkNpsEligibility(user.id, createdAt)
    if (npsStatus.isEligible) {
      const event = getTriggerEvent(createdAt)
      setNpsTriggerEvent(event)
      const timer = setTimeout(() => setShowNps(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [user?.id, user?.createdAt])

  useEffect(() => {
    if (currentPet?.id) {
      fetchTodayCheckin(currentPet.id)
    }
  }, [currentPet?.id, fetchTodayCheckin])

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
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`
  }, [])

  const expressionContext = useMemo((): ExpressionContext | null => {
    if (!currentPet) return null
    const entry = todayEntry
    const anomalyItems = entry?.anomalyItems || []
    return {
      todayEntry: entry || null,
      hasAnomaly: entry?.hasAnomaly || false,
      anomalyCount: anomalyItems.length,
      riskLevel: entry?.riskLevel || null,
      streakDays: entry ? 1 : 0,
      isBirthday: false,
      isVaccineComplete: false,
      isRecovery: false,
      isDeceased: currentPet.isDeceased || false,
    }
  }, [currentPet, todayEntry])

  const handleCheckin = useCallback(() => {
    Taro.navigateTo({ url: '/pagesPet/checkin/index' })
  }, [])

  const handleQuickAction = useCallback(async (action: QuickAction) => {
    try {
      if (action.featureKey && user?.id) {
        const access = await checkAccess(action.featureKey)
        if (!access.allowed) {
          const showPaywall = await shouldShowPaywall(action.featureKey)
          if (showPaywall) {
            await markPaywallShown(action.featureKey)
            Taro.navigateTo({ url: '/pages/member/index' })
            return
          }
          Taro.navigateTo({ url: '/pages/member/index' })
          return
        }
      }
      Taro.navigateTo({ url: action.path })
    } catch {
      Taro.showToast({ title: '操作失败，请重试', icon: 'none' })
    }
  }, [user?.id, checkAccess, shouldShowPaywall, markPaywallShown])

  const handlePetSwitch = useCallback(() => {
    Taro.switchTab({ url: '/pages/pet-profile/index' })
  }, [])

  const handleNpsSubmit = useCallback(async (score: number, feedback: string) => {
    if (!user?.id) return
    await submitNpsResponse(user.id, score, npsTriggerEvent, feedback)
  }, [user?.id, npsTriggerEvent])

  const handleNpsDismiss = useCallback(() => {
    dismissNpsSurvey()
    setShowNps(false)
  }, [])

  if (isLoading && pets.length === 0) {
    return (
      <View className='home-page'>
        <PageLoading />
      </View>
    )
  }

  if (error && pets.length === 0) {
    return (
      <View className='home-page'>
        <PageError message={error} onRetry={loadHomeData} />
      </View>
    )
  }

  return (
    <View className={`home-page ${isVisible ? 'visible' : ''}`}>
      <View className='home-page__header'>
        <View className='home-page__greeting'>
          <Text className='home-page__greeting-text'>{greeting}</Text>
          <Text className='home-page__greeting-name'>{user?.nickname || '铲屎官'}</Text>
        </View>
        {currentPet && (
          <View className='home-page__pet-switch' onClick={handlePetSwitch}>
            <Text className='home-page__pet-emoji'>🐾</Text>
            <Text className='home-page__pet-name'>{currentPet.name}</Text>
            <Text className='home-page__pet-arrow'>›</Text>
          </View>
        )}
      </View>

      {currentPet && expressionContext && (
        <View className='home-page__avatar'>
          <PetAvatar
            species={currentPet.species as 'dog' | 'cat'}
            petName={currentPet.name}
            expressionContext={expressionContext}
            size={120}
            showLabel
            showDiary
          />
        </View>
      )}

      <View className='home-page__checkin-card'>
        <View className='home-page__checkin-main' onClick={handleCheckin}>
          <View className='home-page__checkin-icon'>
            <Text className='home-page__checkin-emoji'>📋</Text>
          </View>
          <View className='home-page__checkin-info'>
            <Text className='home-page__checkin-title'>
              {todayEntry ? '今日已打卡 ✓' : '3秒健康打卡'}
            </Text>
            <Text className='home-page__checkin-sub'>
              {todayEntry ? '查看AI反馈' : '便便·食欲·精神·运动·体重'}
            </Text>
          </View>
          {!todayEntry && (
            <View className='home-page__checkin-btn'>
              <Text className='home-page__checkin-btn-text'>打卡</Text>
            </View>
          )}
        </View>
      </View>

      <View className='home-page__quick-actions'>
        <Text className='home-page__section-title'>快捷功能</Text>
        <View className='home-page__action-grid'>
          {QUICK_ACTIONS.map(action => (
            <View
              key={action.key}
              className='home-page__action-item'
              onClick={() => handleQuickAction(action)}
            >
              <View className='home-page__action-icon'>
                <Text className='home-page__action-emoji'>{action.icon}</Text>
              </View>
              <Text className='home-page__action-label'>{action.label}</Text>
              {action.featureKey && !isMember && (
                <View className='home-page__action-free-tag'>
                  <Text className='home-page__action-free-text'>免费</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {!isMember && (
        <View className='home-page__member-banner' onClick={() => Taro.navigateTo({ url: '/pages/member/index' })}>
          <View className='home-page__member-banner-left'>
            <Text className='home-page__member-banner-icon'>👑</Text>
            <View className='home-page__member-banner-text'>
              <Text className='home-page__member-banner-title'>升级会员</Text>
              <Text className='home-page__member-banner-desc'>解锁无限查询·AI深度分析</Text>
            </View>
          </View>
          <Text className='home-page__member-banner-arrow'>9.9元/月 ›</Text>
        </View>
      )}

      <View className='home-page__footer'>
        <Text className='home-page__footer-text'>{today}</Text>
      </View>

      {showNps && (
        <NpsSurvey
          triggerEvent={npsTriggerEvent}
          onSubmit={handleNpsSubmit}
          onDismiss={handleNpsDismiss}
        />
      )}
    </View>
  )
}
