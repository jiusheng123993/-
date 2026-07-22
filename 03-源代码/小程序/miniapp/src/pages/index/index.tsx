import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { usePetStore } from '../../stores/petStore'
import { useShareStore } from '../../stores/shareStore'
import { useMembership } from '../../hooks/useMembership'
import { useCheckinStore } from '../../stores/checkinStore'
import { useEmotionStore } from '../../stores/emotionStore'
import { useAnalytics, usePageView } from '../../hooks/useAnalytics'
import { AnalyticsEventName } from '../../types/analyticsTypes'
import { PageLoading, PageError, PetAvatar, NpsSurvey, EmotionResponseCard, AchievementCard, AchievementShareCard, CrisisReferralCard, EmptyStateGuide, NewbieTaskCard, RecommendContentCard } from '../../components'
import AnxietyIntervention from '../../components/AnxietyIntervention'
import { checkAllAchievements } from '../../services/achievementService'
import type { AchievementConfig } from '../../components/AchievementCard'
import { checkNpsEligibility, getTriggerEvent, submitNpsResponse, dismissNpsSurvey } from '../../services/npsService'
import { isNewUser, getRecentFoodQueryCount, getRecentSymptomCheckCount, recordAppOpen, getRecentOpenCount } from '../../utils/usageTracking'
import { generateAutoVaccineSchedule, getVaccineReminders, getReminderMessage } from '../../engines/vaccineScheduler'
import type { ExpressionContext } from '../../engines/petAvatar'
import type { NpsTriggerEvent } from '../../types/npsTypes'
import type { EmotionIntervention, CrisisTriggerSource } from '../../engines/emotion'
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
import { updateLastActiveTime, checkAndRecall } from '../../services/churnDetectionService'
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
  const [showCrisisReferral, setShowCrisisReferral] = useState(false)
  const [crisisMessage, setCrisisMessage] = useState('')
  const [showAnxietyIntervention, setShowAnxietyIntervention] = useState(false)
  const [crisisTriggerSource, setCrisisTriggerSource] = useState<CrisisTriggerSource>('grief')
  const [achievement, setAchievement] = useState<AchievementConfig | null>(null)
  const [showAchievementShare, setShowAchievementShare] = useState(false)
  const [allNewbieTasksCompleted, setAllNewbieTasksCompleted] = useState<boolean>(() => {
    return Taro.getStorageSync('xhh_newbie_tasks_completed') || false
  })
  const [recommendDismissed, setRecommendDismissed] = useState<boolean>(() => {
    return Taro.getStorageSync('xhh_recommend_dismissed') || false
  })
  const user = useAuthStore(s => s.user)
  const inviteCode = useShareStore(s => s.inviteCode)
  const { currentPet, pets, initUser: initPetUser, fetchPets } = usePetStore()
  const { isMember, checkAccess, shouldShowPaywall, markPaywallShown } = useMembership()
  const todayEntry = useCheckinStore(s => s.todayEntry)
  const fetchTodayCheckin = useCheckinStore(s => s.fetchTodayCheckin)
  const initCheckinUser = useCheckinStore(s => s.initUser)
  const stats = useCheckinStore(s => s.stats)
  const fetchStats = useCheckinStore(s => s.fetchStats)
  const fetchCheckins = useCheckinStore(s => s.fetchCheckins)
  const consecutiveAnomalyDays = useCheckinStore(s => s.consecutiveAnomalyDays)
  const activeIntervention = useEmotionStore(s => s.activeIntervention)
  const checkSickAnxiety = useEmotionStore(s => s.checkSickAnxiety)
  const checkNewOwnerAnxiety = useEmotionStore(s => s.checkNewOwnerAnxiety)
  const dismissIntervention = useEmotionStore(s => s.dismissIntervention)
  const respondToIntervention = useEmotionStore(s => s.respondToIntervention)

  const loadHomeData = useCallback(async () => {
    setError('')
    setIsLoading(true)
    try {
      if (!user?.id) {
        setIsLoading(false)
        return
      }
      await Promise.all([
        initPetUser(user.id),
        initCheckinUser(user.id),
        fetchPets(),
      ])
      recordAppOpen()
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
      fetchStats(currentPet.id)
      fetchCheckins(currentPet.id)
    }
  }, [currentPet?.id, fetchTodayCheckin, fetchStats, fetchCheckins])

  usePageView('home')

  useDidShow(() => {
    updateLastActiveTime()
    checkAndRecall(currentPet?.id)
  })

  useEffect(() => {
    if (!user?.id || !currentPet?.id || activeIntervention) return
    const entry = useCheckinStore.getState().todayEntry
    if (entry?.hasAnomaly && entry.anomalyItems) {
      checkSickAnxiety(
        currentPet.id,
        currentPet.name,
        consecutiveAnomalyDays,
        getRecentOpenCount(),
        entry.anomalyItems,
        0,
        user.id,
      )
    }
  }, [user?.id, currentPet?.id, currentPet?.name, activeIntervention, checkSickAnxiety, consecutiveAnomalyDays])

  useEffect(() => {
    if (!user?.id || !currentPet?.id || activeIntervention) return
    if (!isNewUser()) return
    const accountAgeDays = user.createdAt
      ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    checkNewOwnerAnxiety(
      user.id,
      accountAgeDays,
      getRecentFoodQueryCount(),
      getRecentSymptomCheckCount(),
      0,
      false,
      currentPet.name,
      currentPet.species || 'dog',
    )
  }, [user?.id, user?.createdAt, currentPet?.id, currentPet?.name, currentPet?.species, activeIntervention, checkNewOwnerAnxiety])

  useEffect(() => {
    if (!currentPet?.id) return
    const result = checkAllAchievements({
      petId: currentPet.id,
      birthDate: currentPet.birthDate,
      streakDays: stats?.streak ?? 0,
      isDeceased: currentPet.isDeceased || false,
    })
    if (result) {
      trackEvent('show_achievement')
      setAchievement(result)
    }
  }, [currentPet?.id, currentPet?.birthDate, currentPet?.isDeceased, stats?.streak])

  useEffect(() => {
    if (!currentPet?.id || !currentPet?.birthDate) return
    const today = new Date().toISOString().split('T')[0]
    const lastReminderDate = Taro.getStorageSync('vaccine_reminder_date') || ''
    if (lastReminderDate === today) return

    const schedule = generateAutoVaccineSchedule({
      species: currentPet.species as 'dog' | 'cat',
      birthDate: currentPet.birthDate,
      existingVaccines: [],
    })
    const reminders = getVaccineReminders(schedule)
    if (reminders.length === 0) return

    const mostUrgent = reminders.reduce((prev, curr) =>
      curr.reminderLevel > prev.reminderLevel ? curr : prev
    )
    const message = getReminderMessage(mostUrgent.reminderLevel as 1 | 2 | 3, 'vaccine', mostUrgent.vaccineName)

    Taro.showModal({
      title: message.title,
      content: message.content,
      confirmText: '去查看',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({ url: '/pagesPet/vaccine/index' })
        }
      },
    })
    Taro.setStorageSync('vaccine_reminder_date', today)
  }, [currentPet?.id, currentPet?.birthDate, currentPet?.species])

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
    const now = new Date()
    const birth = currentPet.birthDate ? new Date(currentPet.birthDate) : null
    const isBirthday = birth
      ? now.getMonth() === birth.getMonth() && now.getDate() === birth.getDate()
      : false
    return {
      todayEntry: entry || null,
      hasAnomaly: entry?.hasAnomaly || false,
      anomalyCount: anomalyItems.length,
      riskLevel: entry?.riskLevel || null,
      streakDays: stats?.streak ?? 0,
      isBirthday,
      isVaccineComplete: false,
      isRecovery: false,
      isDeceased: currentPet.isDeceased || false,
    }
  }, [currentPet, todayEntry])

  const handleCheckin = useCallback(() => {
    Taro.navigateTo({ url: '/pagesPet/checkin/index' })
  }, [])

  const { trackPageView, trackEvent } = useAnalytics()

  const handleQuickAction = useCallback(async (action: QuickAction) => {
    trackEvent('click_quick_action', { actionKey: action.key })
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

  const handleEmotionAction = useCallback((_intervention: EmotionIntervention) => {
    respondToIntervention()
    if (_intervention.requiresCrisisReferral) {
      trackEvent(AnalyticsEventName.EmotionTrigger, { type: 'crisis_referral', source: _intervention.type })
      const sourceMap: Record<string, CrisisTriggerSource> = {
        grief: 'grief',
        sick_anxiety: 'checkin_severe',
        new_owner_anxiety: 'grief',
      }
      setCrisisTriggerSource(sourceMap[_intervention.type] || 'grief')
      setCrisisMessage(_intervention.message)
      setShowCrisisReferral(true)
    } else {
      trackEvent(AnalyticsEventName.EmotionTrigger, { type: 'intervention', source: _intervention.type })
      Taro.showToast({ title: '我们在一起 ❤️', icon: 'none' })
    }
  }, [respondToIntervention])

  const handleEmotionDismiss = useCallback((_intervention: EmotionIntervention) => {
    dismissIntervention()
  }, [dismissIntervention])

  const handleAchievementClose = useCallback(() => {
    setAchievement(null)
  }, [])

  const handleAchievementShare = useCallback(() => {
    trackEvent(AnalyticsEventName.ShareAction, { type: 'achievement', platform: 'wechat' })
    setShowAchievementShare(true)
  }, [trackEvent])

  const handleAchievementShareClose = useCallback(() => {
    setShowAchievementShare(false)
  }, [])

  const handleCrisisDismiss = useCallback(() => {
    setShowCrisisReferral(false)
    setCrisisMessage('')
    dismissIntervention()
  }, [dismissIntervention])

  const disclaimerText = new MedicalDisclaimer().getDisclaimer('green', 'checkin')

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

  if (!isLoading && pets.length === 0) {
    return (
      <View className='home-page'>
        <EmptyStateGuide
          onAddPet={() => Taro.navigateTo({ url: '/pagesPet/add/index' })}
          onExplore={() => Taro.navigateTo({ url: '/pagesPet/breed/index' })}
        />
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

      {currentPet && !allNewbieTasksCompleted && (
        <NewbieTaskCard
          hasPet={true}
          hasCheckin={!!todayEntry}
          hasFoodQuery={getRecentFoodQueryCount() > 0}
          onComplete={() => setAllNewbieTasksCompleted(true)}
        />
      )}

      {isNewUser() && !recommendDismissed && (
        <RecommendContentCard
          onNavigate={(path: string) => Taro.navigateTo({ url: path })}
        />
      )}

      {activeIntervention && activeIntervention.type === 'sick_anxiety' && currentPet && (
        <AnxietyIntervention
          type='sick_anxiety'
          context={{ petName: currentPet.name, consecutiveAnomalyDays }}
          petName={currentPet.name}
          species={currentPet.species as 'dog' | 'cat'}
          petId={currentPet.id}
          anomalyItems={todayEntry?.anomalyItems}
          onDismiss={() => {
            dismissIntervention()
            setShowAnxietyIntervention(false)
          }}
          onAction={(action) => {
            if (action === 'crisis_referral') {
              trackEvent(AnalyticsEventName.EmotionTrigger, { type: 'crisis_referral', source: activeIntervention.type })
              setCrisisMessage(activeIntervention.message)
              setShowCrisisReferral(true)
            } else {
              trackEvent(AnalyticsEventName.EmotionTrigger, { type: 'intervention', source: activeIntervention.type })
            }
            respondToIntervention()
          }}
        />
      )}

      {activeIntervention && activeIntervention.type !== 'sick_anxiety' && (
        <EmotionResponseCard
          intervention={activeIntervention}
          onAction={handleEmotionAction}
          onDismiss={handleEmotionDismiss}
        />
      )}

      {achievement && currentPet && (
        <AchievementCard
          achievement={achievement}
          petName={currentPet.name}
          species={currentPet.species as 'dog' | 'cat'}
          onClose={handleAchievementClose}
          onShare={handleAchievementShare}
        />
      )}

      {showCrisisReferral && (
        <CrisisReferralCard
          message={crisisMessage}
          onDismiss={handleCrisisDismiss}
          triggerSource={crisisTriggerSource}
        />
      )}

      {showAchievementShare && achievement && currentPet && (
        <AchievementShareCard
          petName={currentPet.name}
          petAvatar={currentPet.avatarPhotoUrl || ''}
          achievementType={achievement.type}
          achievementTitle={achievement.title}
          achievementSubtitle={achievement.subtitle}
          achievementIcon={achievement.icon}
          achievementColor={achievement.color}
          inviteCode={inviteCode}
          onClose={handleAchievementShareClose}
        />
      )}

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

      <View className='home-page__disclaimer'>
        <Text className='home-page__disclaimer-text'>{disclaimerText}</Text>
      </View>

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
