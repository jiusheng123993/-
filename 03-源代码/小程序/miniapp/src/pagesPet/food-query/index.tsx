import { View, Text, Input } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePet } from '../../hooks/usePet'
import { useFoodQuery } from '../../hooks/useFoodQuery'
import { useMembership } from '../../hooks/useMembership'
import { useAuthStore } from '../../stores/authStore'
import PetSwitcher from '../../components/PetSwitcher'
import FloatingNav from '../../components/FloatingNav'
import PaywallPopup from '../../components/PaywallPopup'
import FoodShareCard from '../../components/FoodShareCard'
import { PageLoading, PageError, EmotionResponseCard, PetAvatar } from '../../components'
import { useEmotionStore, buildEmotionContext, incrementFoodQueryCount, isNewUser, getRecentFoodQueryCount, getRecentSymptomCheckCount } from '../../stores/emotionStore'
import type { ExpressionContext } from '../../engines/petAvatar'
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
  const { pets, currentPet, switchPet, isLoading: petLoading } = usePet()
  const { lastResult, history, stats, queryFood, fetchHistory, fetchStats, isLoading: queryLoading } = useFoodQuery()
  const { isMember, checkAccess, shouldShowPaywall, markPaywallShown } = useMembership()
  const user = useAuthStore(s => s.user)
  const userId = user?.id || ''
  const [searchText, setSearchText] = useState('')
  const [paywallVisible, setPaywallVisible] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [error, setError] = useState('')

  useShareAppMessage(() => {
    return {
      title: lastResult
        ? `我家毛孩子能吃${lastResult.foodName}吗？快查查！`
        : '星寰海 - 宠物健康管家',
      path: '/pagesPet/food-query/index',
    }
  })

  const emotionCard = useEmotionStore((s) => s.activeCard)
  const isCardVisible = useEmotionStore((s) => s.isCardVisible)
  const evaluateContext = useEmotionStore((s) => s.evaluateContext)
  const dismissCard = useEmotionStore((s) => s.dismissCard)

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

  const handleSearch = async () => {
    if (!currentPet || !searchText.trim()) return
    if (!isMember && user?.id) {
      const access = await checkAccess('food_query')
      if (!access.allowed) {
        const showPaywall = await shouldShowPaywall('food_query')
        if (showPaywall) {
          await markPaywallShown('food_query')
          setPaywallVisible(true)
        } else {
          Taro.navigateTo({ url: '/pages/member/index' })
        }
        return
      }
    }
    if (stats && stats.remainingFree <= 0) {
      Taro.showToast({ title: '今日免费次数已用完', icon: 'none' })
      return
    }
    try {
      await queryFood(userId, currentPet.id, searchText.trim(), currentPet.species)
      incrementFoodQueryCount()
      checkNewUserAnxiety()
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
          Taro.navigateTo({ url: '/pages/member/index' })
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

  const checkNewUserAnxiety = useCallback(() => {
    if (!currentPet) return
    if (isNewUser() && getRecentFoodQueryCount() >= 3) {
      const ctx = buildEmotionContext(currentPet.id, currentPet.name, currentPet.species as 'dog' | 'cat', {
        isNewUser: true,
        recentFoodQueryCount: getRecentFoodQueryCount(),
        recentSymptomCheckCount: getRecentSymptomCheckCount(),
        isDeceased: currentPet.isDeceased,
      })
      evaluateContext(ctx)
    }
  }, [currentPet, evaluateContext])

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
                  onShare={() => { Taro.showShareMenu({ withShareTicket: true }); setShowShareCard(false) }}
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

      {isCardVisible && emotionCard && currentPet && (
        <EmotionResponseCard
          match={emotionCard}
          petName={currentPet.name}
          onDismiss={dismissCard}
        />
      )}

      <View className='pet-food-query__disclaimer'>
        <Text className='pet-food-query__disclaimer-text'>⚠️ 食物安全信息仅供参考，不替代兽医诊断。如有疑问请咨询专业兽医。</Text>
      </View>

      <PaywallPopup
        visible={paywallVisible}
        featureName="食物查询"
        remainingFree={stats?.remainingFree ?? 0}
        onUpgrade={() => { setPaywallVisible(false); Taro.navigateTo({ url: '/pages/member/index' }) }}
        onClose={() => setPaywallVisible(false)}
      />

      <FloatingNav />
    </View>
  )
}
