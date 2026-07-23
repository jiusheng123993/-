import { View, Text, Input } from '@tarojs/components'
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePet } from '../../hooks/usePet'
import { useFoodQuery } from '../../hooks/useFoodQuery'
import { useMembership } from '../../hooks/useMembership'
import { useAuthStore } from '../../stores/authStore'
import { useShareStore } from '../../stores/shareStore'
import PetSwitcher from '../../components/PetSwitcher'
import FloatingNav from '../../components/FloatingNav'
import PaywallPopup from '../../components/PaywallPopup'
import FoodShareCard from '../../components/FoodShareCard'
import AnxietyIntervention from '../../components/AnxietyIntervention'
import CrisisReferralCard from '../../components/CrisisReferralCard'
import { PageLoading, PageError, PetAvatar, EmergencyAlert } from '../../components'
import { incrementFoodQueryCount, isNewUser, getRecentFoodQueryCount, getRecentSymptomCheckCount } from '../../utils/usageTracking'
import { useAnxietyDetection } from '../../hooks/useAnxietyDetection'
import { useEmotionTracking } from '../../hooks/useEmotionTracking'
import { useAnalytics, usePageView } from '../../hooks/useAnalytics'
import { AnalyticsEventName } from '../../types/analyticsTypes'
import { EVENT } from '../../constants/analyticsEvents'
import type { ExpressionContext } from '../../engines/petAvatar'
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
import { checkNpsEligibility, submitNpsResponse, dismissNpsSurvey } from '../../services/npsService'
import NpsSurvey from '../../components/NpsSurvey'
import type { NpsTriggerEvent } from '../../types/npsTypes'
import './index.scss'

const SAFETY_LEVEL_LABELS: Record<string, string> = {
  safe: '安全',
  caution: '注意',
  dangerous: '危险',
  toxic: '有毒',
}

const SAFETY_LEVEL_COLORS: Record<string, string> = {
  safe: '#4CAF50',
  caution: '#FFC107',
  dangerous: '#FF9800',
  toxic: '#F44336',
}

export default function PetFoodQuery() {
  const { pets, currentPet, switchPet, isLoading: petLoading, initUser: initPetUser } = usePet()
  const { lastResult, history, stats, queryFood, fetchHistory, fetchStats, isLoading: queryLoading } = useFoodQuery()
  const { isMember, checkAccess, shouldShowPaywall, markPaywallShown, initUser: initMembership } = useMembership()
  const user = useAuthStore(s => s.user)
  const userId = user?.id || ''
  const inviteCode = useShareStore(s => s.inviteCode)
  const [searchText, setSearchText] = useState('')
  const [paywallVisible, setPaywallVisible] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [error, setError] = useState('')
  const [showNpsSurvey, setShowNpsSurvey] = useState(false)
  const [npsTriggerEvent, setNpsTriggerEvent] = useState<NpsTriggerEvent>('manual')
  const [showToxicAlert, setShowToxicAlert] = useState(false)
  const { anxietyState, checkNewOwnerAnxiety, dismissNewOwnerAnxiety } = useAnxietyDetection()
  const { showCrisisReferral, crisisSeverity, trackEvent: trackEmotion, dismissCrisisReferral, handleFollowUp } = useEmotionTracking(currentPet?.id || null)
  const { trackPageView, trackEvent } = useAnalytics()

  usePageView('food_query')

  useShareAppMessage(() => {
    return {
      title: lastResult
        ? `我家毛孩子能吃${lastResult.foodName}吗？快查查！`
        : '星寰海 - 宠物健康管家',
      path: `/pagesPet/food-query/index${inviteCode ? `?inviteCode=${inviteCode}` : ''}`,
    }
  })
  useShareTimeline(() => ({
    title: lastResult
      ? `我家毛孩子能吃${lastResult.foodName}吗？`
      : '星寰海 - 宠物健康管家',
    query: inviteCode ? `inviteCode=${inviteCode}` : '',
  }))

  const loadInitialData = useCallback(async () => {
    setError('')
    try {
      if (currentPet && userId) {
        await Promise.all([
          fetchHistory(currentPet.id, userId),
          fetchStats(currentPet.id, userId),
        ])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败，请重试')
    }
  }, [currentPet, userId, fetchHistory, fetchStats])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    if (userId) {
      initMembership(userId)
      initPetUser(userId)
    }
  }, [userId, initMembership, initPetUser])

  useEffect(() => {
    if (currentPet) {
      checkNewOwnerAnxiety(currentPet.id)
    }
  }, [currentPet, checkNewOwnerAnxiety])

  const handleSearch = async () => {
    if (!currentPet || !searchText.trim()) return
    if (!isMember && user?.id) {
      const access = await checkAccess('food_query')
      if (!access.allowed) {
        const showPaywall = await shouldShowPaywall('food_query')
        if (showPaywall) {
          await markPaywallShown('food_query')
          trackEvent('show_paywall', { feature: 'food_query' })
          setPaywallVisible(true)
        } else {
          Taro.switchTab({ url: '/pages/member/index' })
        }
        return
      }
    }
    if (stats && stats.remainingFree <= 0) {
      Taro.showToast({ title: '今日免费次数已用完', icon: 'none' })
      return
    }
    try {
      // 传递品种信息以实现品种特殊禁忌检查
      const result = await queryFood(userId, currentPet.id, searchText.trim(), currentPet.species)
      trackEvent(AnalyticsEventName.FoodQuery, { keyword: searchText.trim(), resultSafetyLevel: result.safetyLevel, isMember })
      incrementFoodQueryCount()
      if (result.safetyLevel === 'toxic') {
        setShowToxicAlert(true)
        trackEmotion('food_query', 'moderate')
      }
    } catch {
      Taro.showToast({ title: '查询失败，请重试', icon: 'none' })
    }
  }

  const handleHistoryClick = async (foodName: string) => {
    if (!currentPet) return
    if (!isMember && user?.id) {
      const access = await checkAccess('food_query')
      if (!access.allowed) {
        const showPaywall = await shouldShowPaywall('food_query')
        if (showPaywall) {
          await markPaywallShown('food_query')
          setPaywallVisible(true)
        } else {
          Taro.switchTab({ url: '/pages/member/index' })
        }
        return
      }
    }
    if (stats && stats.remainingFree <= 0) {
      Taro.showToast({ title: '今日免费次数已用完', icon: 'none' })
      return
    }
    try {
      await queryFood(userId, currentPet.id, foodName, currentPet.species)
    } catch {
      Taro.showToast({ title: '查询失败，请重试', icon: 'none' })
    }
  }

  const isLoading = petLoading || queryLoading

  const disclaimerText = useMemo(() => {
    if (!lastResult) return new MedicalDisclaimer().getFoodDisclaimer('caution')
    return new MedicalDisclaimer().getFoodDisclaimer(lastResult.safetyLevel)
  }, [lastResult])

  const expressionContext = useMemo((): ExpressionContext | null => {
    if (!currentPet) return null
    return {
      todayEntry: null,
      hasAnomaly: false,
      anomalyCount: 0,
      riskLevel: null,
      streakDays: 0,
      isBirthday: false,
      isVaccineComplete: false,
      isRecovery: false,
      isDeceased: currentPet.isDeceased || false,
    }
  }, [currentPet])

  if (isLoading && pets.length === 0) {
    return (
      <View className='pet-food-query'>
        <PageLoading />
        <FloatingNav />
      </View>
    )
  }

  if (error && pets.length === 0) {
    return (
      <View className='pet-food-query'>
        <PageError message={error} onRetry={loadInitialData} />
        <FloatingNav />
      </View>
    )
  }

  return (
    <View className='pet-food-query'>
      <PetSwitcher
        pets={pets}
        currentPetId={currentPet?.id || null}
        onSwitch={switchPet}
      />

      {currentPet && expressionContext && (
        <View className='pet-food-query__avatar'>
          <PetAvatar
            species={currentPet.species as 'dog' | 'cat'}
            petName={currentPet.name}
            expressionContext={expressionContext}
            size={80}
            showLabel
          />
        </View>
      )}

      {!currentPet ? (
        <View className='pet-food-query__empty'>
          <Text className='pet-food-query__empty-icon'>🐾</Text>
          <Text className='pet-food-query__empty-text'>请先添加宠物</Text>
        </View>
      ) : (
        <>
          <View className='pet-food-query__search'>
            <Input
              className='pet-food-query__input'
              placeholder='输入食物名称，如巧克力、葡萄...'
              placeholderClass='pet-food-query__input-placeholder'
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
              onConfirm={handleSearch}
            />
            <View
              className={`pet-food-query__search-btn${!isMember && stats && stats.remainingFree <= 0 ? ' pet-food-query__search-btn--disabled' : ''}`}
              onClick={!isMember && stats && stats.remainingFree <= 0 ? undefined : handleSearch}
            >
              <Text>搜索</Text>
            </View>
          </View>

          {stats && (
            <View className={`pet-food-query__quota${!isMember && stats.remainingFree <= 0 ? ' pet-food-query__quota--exhausted' : ''}`}>
              {isMember
                ? '会员无限查询'
                : stats.remainingFree > 0
                  ? `今日剩余免费查询：${stats.remainingFree} 次`
                  : '今日免费次数已用完'}
            </View>
          )}

          {lastResult ? (
            <View className={`pet-food-query__result pet-food-query__result--${lastResult.safetyLevel}`}>
              <View className='pet-food-query__result-header'>
                <Text className='pet-food-query__result-name'>{lastResult.foodName}</Text>
                <Text
                  className={`pet-food-query__result-badge pet-food-query__result-badge--${lastResult.safetyLevel}`}
                >
                  {SAFETY_LEVEL_LABELS[lastResult.safetyLevel] || '未知'}
                </Text>
              </View>

              {lastResult.dangerousCompounds && lastResult.dangerousCompounds.length > 0 && (
                <View className='pet-food-query__result-section'>
                  <Text className='pet-food-query__result-section-title'>⚠️ 危险成分</Text>
                  <View className='pet-food-query__result-tags'>
                    {lastResult.dangerousCompounds.map((compound, index) => (
                      <Text key={index} className='pet-food-query__result-tag pet-food-query__result-tag--danger'>
                        {compound}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {lastResult.toxicDoses && (
                <View className='pet-food-query__result-section'>
                  <Text className='pet-food-query__result-section-title'>⚖️ 中毒剂量</Text>
                  <Text className='pet-food-query__result-section-text'>{lastResult.toxicDoses}</Text>
                </View>
              )}

              {lastResult.symptoms && lastResult.symptoms.length > 0 && (
                <View className='pet-food-query__result-section'>
                  <Text className='pet-food-query__result-section-title'>🤒 中毒症状</Text>
                  <View className='pet-food-query__result-tags'>
                    {lastResult.symptoms.map((symptom, index) => (
                      <Text key={index} className='pet-food-query__result-tag'>
                        {symptom}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {lastResult.breedWarnings && lastResult.breedWarnings.length > 0 && (
                <View className='pet-food-query__result-section'>
                  <Text className='pet-food-query__result-section-title'>🐕 品种特别警告</Text>
                  <View className='pet-food-query__result-tags'>
                    {lastResult.breedWarnings.map((warning, index) => (
                      <Text key={index} className='pet-food-query__result-tag pet-food-query__result-tag--danger'>
                        {warning}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {lastResult.breedWarnings && lastResult.breedWarnings.length > 0 && (
                <View className='pet-food-query__result-section pet-food-query__result-section--breed'>
                  <Text className='pet-food-query__result-section-title'>⚠️ 品种特殊禁忌</Text>
                  {lastResult.breedWarnings.map((bw: string, index: number) => (
                    <View key={index} className='pet-food-query__breed-warning'>
                      <Text className='pet-food-query__breed-warning-reason'>{bw}</Text>
                    </View>
                  ))}
                </View>
              )}

              {lastResult.detail && (
                <View className='pet-food-query__result-section'>
                  <Text className='pet-food-query__result-section-title'>📋 详细说明</Text>
                  <Text className='pet-food-query__result-section-text'>{lastResult.detail}</Text>
                </View>
              )}

              {lastResult.firstAid && (
                <View className='pet-food-query__result-firstaid'>
                  <Text className='pet-food-query__result-firstaid-title'>🚑 急救措施</Text>
                  <Text className='pet-food-query__result-firstaid-text'>{lastResult.firstAid}</Text>
                </View>
              )}

              <View
                className='pet-food-query__result-share-btn'
                onClick={() => setShowShareCard(true)}
              >
                <Text className='pet-food-query__result-share-btn-text'>分享结果</Text>
              </View>

              {showShareCard && (
                <FoodShareCard
                  foodName={lastResult.foodName}
                  safetyLevel={lastResult.safetyLevel as 'safe' | 'caution' | 'dangerous' | 'toxic'}
                  petName={currentPet.name}
                  petAvatar={currentPet.avatarPhotoUrl}
                  dangerousCompounds={lastResult.dangerousCompounds}
                  symptoms={lastResult.symptoms}
                  detail={lastResult.detail}
                  inviteCode={inviteCode}
                  onShare={() => {
                    trackEvent(AnalyticsEventName.ShareAction, { type: 'food', platform: 'wechat' })
                    Taro.showShareMenu({ withShareTicket: true })
                    setShowShareCard(false)
                    if (user?.id) {
                      const npsStatus = checkNpsEligibility(user.id, user.createdAt || new Date().toISOString())
                      if (npsStatus.isEligible) {
                        setShowNpsSurvey(true)
                        setNpsTriggerEvent('after_share')
                      }
                    }
                  }}
                />
              )}
            </View>
          ) : (
            <View className='pet-food-query__empty'>
              <Text className='pet-food-query__empty-icon'>🔍</Text>
              <Text className='pet-food-query__empty-text'>输入食物名称，查询对宠物是否安全</Text>
            </View>
          )}

          {history.length > 0 && (
            <View className='pet-food-query__history'>
              <Text className='pet-food-query__history-title'>查询历史</Text>
              <View className='pet-food-query__history-list'>
                {history.slice(0, 10).map((item) => (
                  <View
                    key={item.id}
                    className='pet-food-query__history-item'
                    onClick={() => handleHistoryClick(item.foodName)}
                  >
                    <View className='pet-food-query__history-item-left'>
                      <Text className='pet-food-query__history-item-name'>{item.foodName}</Text>
                      <Text
                        className='pet-food-query__history-item-badge'
                        style={{ color: SAFETY_LEVEL_COLORS[item.safetyLevel] || '#999', background: `${SAFETY_LEVEL_COLORS[item.safetyLevel] || '#999'}18` }}
                      >
                        {SAFETY_LEVEL_LABELS[item.safetyLevel] || '未知'}
                      </Text>
                    </View>
                    <Text className='pet-food-query__history-item-time'>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {showNpsSurvey && user && (
        <NpsSurvey
          triggerEvent={npsTriggerEvent}
          onSubmit={(score, feedback) => {
            submitNpsResponse(user.id, score, npsTriggerEvent, feedback)
            setShowNpsSurvey(false)
          }}
          onDismiss={() => {
            dismissNpsSurvey()
            setShowNpsSurvey(false)
          }}
        />
      )}

      <View className='pet-food-query__disclaimer'>
        <Text className='pet-food-query__disclaimer-text'>{disclaimerText}</Text>
      </View>

      <PaywallPopup
        visible={paywallVisible}
        featureName="食物查询"
        remainingFree={stats?.remainingFree ?? 0}
        onUpgrade={() => { setPaywallVisible(false); Taro.switchTab({ url: '/pages/member/index' }) }}
        onClose={() => setPaywallVisible(false)}
      />

      <EmergencyAlert
        visible={showToxicAlert}
        title='有毒食物警告'
        message={`"${lastResult?.foodName || '该食物'}" 对宠物有毒！如果您的宠物已经误食，请立即联系宠物医院。常见中毒症状：呕吐、腹泻、精神萎靡、抽搐。`}
        showSymptomButton
        showFoodButton={false}
        petId={currentPet?.id || ''}
        symptoms={lastResult?.symptoms || []}
        alertType='food_toxic'
        onClose={() => setShowToxicAlert(false)}
      />

      {anxietyState.showNewOwnerAnxiety && anxietyState.newOwnerAnxietyContext && currentPet && (
        <AnxietyIntervention
          type='new_owner_anxiety'
          context={anxietyState.newOwnerAnxietyContext}
          petName={currentPet.name}
          species={currentPet.species as 'dog' | 'cat'}
          petId={currentPet.id}
          onDismiss={dismissNewOwnerAnxiety}
          onCrisisReferral={() => { dismissNewOwnerAnxiety() }}
        />
      )}

      {showCrisisReferral && (
        <CrisisReferralCard
          message='查询到有毒食物可能会让你感到焦虑，请保持冷静，及时采取正确的措施。'
          severity={crisisSeverity}
          onDismiss={dismissCrisisReferral}
          onFollowUp={handleFollowUp}
        />
      )}

      <FloatingNav />
    </View>
  )
}
