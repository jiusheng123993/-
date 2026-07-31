/**
 * 症状初筛页面
 * 宠物症状选择、AI分析、风险评级、就医建议
 */
import { View, Text, Textarea, Input, ScrollView } from '@tarojs/components'
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useThemeClass } from '../../hooks/useThemeClass'
import { usePet } from '../../hooks/usePet'
import { useSymptom } from '../../hooks/useSymptom'
import { useMembership } from '../../hooks/useMembership'
import { useAuthStore } from '../../stores/authStore'
import { useShareStore } from '../../stores/shareStore'
import { safeNavigateBack } from '../../utils/navigation'
import PetSwitcher from '../../components/PetSwitcher'
import PaywallPopup from '../../components/PaywallPopup'
import AnxietyIntervention from '../../components/AnxietyIntervention'
import CrisisReferralCard from '../../components/CrisisReferralCard'
import { PageLoading, PageError, PetAvatar, EmergencyAlert } from '../../components'
import { incrementSymptomCheckCount, isNewUser, getRecentFoodQueryCount, getRecentSymptomCheckCount } from '../../utils/usageTracking'
import { useAnxietyDetection } from '../../hooks/useAnxietyDetection'
import { useEmotionTracking } from '../../hooks/useEmotionTracking'
import type { EmotionSeverity } from '../../services/emotionTrackingService'
import { useAnalytics, usePageView } from '../../hooks/useAnalytics'
import { AnalyticsEventName } from '../../types/analyticsTypes'
import { EVENT } from '../../constants/analyticsEvents'
import type { ExpressionContext } from '../../engines/petAvatar'
import { getCrisisMessage } from '../../engines/emotion'
import type { CrisisTriggerSource } from '../../engines/emotion'
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
import type { UrgencyLevel } from '../../engines/petSafety/PetSafetyHandler'
import './index.scss'

const DURATION_OPTIONS = [
  { value: 'today', label: '今天刚发现' },
  { value: '1-2天', label: '1-2天' },
  { value: '2-3天', label: '2-3天' },
  { value: '3天以上', label: '3天以上' },
]

const FREQUENCY_OPTIONS = [
  { value: 'occasional', label: '偶尔' },
  { value: 'frequent', label: '频繁' },
  { value: 'continuous', label: '持续' },
]

const SEVERITY_OPTIONS = [
  { value: 'mild', label: '轻微', emoji: '🟢' },
  { value: 'moderate', label: '明显', emoji: '🟡' },
  { value: 'severe', label: '严重', emoji: '🔴' },
]

const APPETITE_OPTIONS = [
  { value: 'normal', label: '正常' },
  { value: 'decreased', label: '下降' },
  { value: 'none', label: '不吃' },
]

const ENERGY_OPTIONS = [
  { value: 'normal', label: '正常' },
  { value: 'low', label: '偏低' },
  { value: 'lethargic', label: '萎靡' },
]

const RISK_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  normal: { label: '状态良好', emoji: '✅', color: '#52C41A' },
  caution: { label: '注意观察', emoji: '💡', color: '#FAAD14' },
  warning: { label: '密切观察', emoji: '🔔', color: '#FF8C42' },
  emergency: { label: '立即就医', emoji: '🚨', color: '#FF4D4F' },
}

const STEP_LABELS = ['选择症状', '补充信息', 'AI分析', '结果建议']

const CATEGORY_ICONS: Record<string, string> = {
  digestive: '🍽️',
  respiratory: '🫁',
  skin: '🔬',
  urinary: '💧',
  nervous: '🧠',
  behavior: '🐾',
  eye_ear_mouth: '👁️',
}

/** 常见症状组合预设 */
const QUICK_SYMPTOM_COMBOS = [
  { label: '🤧 感冒症状', symptoms: ['打喷嚏', '流鼻涕', '精神萎靡', '食欲不振'] },
  { label: '🤢 消化问题', symptoms: ['呕吐', '腹泻', '食欲不振', '腹痛'] },
  { label: '🩹 皮肤问题', symptoms: ['瘙痒', '脱毛', '红疹', '皮屑'] },
  { label: '👀 眼部异常', symptoms: ['眼屎增多', '流泪', '眼睛红肿', '畏光'] },
]

export default function PetSymptomCheck() {
  const { pets, currentPet, switchPet, isLoading: petLoading } = usePet()
  const {
    categories,
    selectedSymptoms,
    currentResult,
    isLoading: symptomLoading,
    error,
    fetchCategories,
    selectSymptom,
    deselectSymptom,
    analyzeSymptoms,
    clearSelection,
    clearError,
  } = useSymptom()
  const { isMember, checkAccess, shouldShowPaywall, markPaywallShown } = useMembership()
  const user = useAuthStore(s => s.user)
  const inviteCode = useShareStore(s => s.inviteCode)

  const [step, setStep] = useState(0)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [symptomSearchText, setSymptomSearchText] = useState('')
  const [showSymptomSearchSuggestions, setShowSymptomSearchSuggestions] = useState(false)
  const [additionalInfo, setAdditionalInfo] = useState({
    duration: 'today',
    frequency: 'occasional',
    severity: 'mild',
    appetite: 'normal',
    energy: 'normal',
    otherNotes: '',
  })
  const [analyzing, setAnalyzing] = useState(false)
  const [paywallVisible, setPaywallVisible] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [showSymptomCrisisReferral, setShowSymptomCrisisReferral] = useState(false)
  const { anxietyState, checkSickAnxiety, dismissSickAnxiety } = useAnxietyDetection()
  const { showCrisisReferral, crisisSeverity, trackEvent: trackEmotion, dismissCrisisReferral, handleFollowUp } = useEmotionTracking(currentPet?.id || null)
  const { trackPageView, trackEvent } = useAnalytics()

  usePageView('symptom_check')
  const RISK_TO_URGENCY: Record<string, UrgencyLevel> = {
    normal: 'green',
    caution: 'yellow',
    warning: 'orange',
    emergency: 'red',
  }

  const disclaimerText = useMemo(() => {
    if (!currentResult) return new MedicalDisclaimer().getSymptomDisclaimer('green')
    return new MedicalDisclaimer().getSymptomDisclaimer(RISK_TO_URGENCY[currentResult.riskLevel] || 'green')
  }, [currentResult])

  useShareAppMessage(() => {
    return {
      title: currentResult
        ? `我家毛孩子的症状分析结果，快来看看！`
        : '星寰海 - 宠物健康管家',
      path: `/pagesPet/symptom-check/index${inviteCode ? `?inviteCode=${inviteCode}` : ''}`,
    }
  })
  useShareTimeline(() => ({
    title: currentResult
      ? `我家毛孩子的症状分析结果`
      : '星寰海 - 宠物健康管家',
    query: inviteCode ? `inviteCode=${inviteCode}` : '',
  }))

  const loadSymptomData = useCallback(async () => {
    setLoadError('')
    try {
      if (currentPet) {
        await fetchCategories(currentPet.species)
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '加载失败，请重试')
    }
  }, [currentPet, fetchCategories])

  useEffect(() => {
    loadSymptomData()
  }, [loadSymptomData])

  useEffect(() => {
    if (error) {
      Taro.showToast({ title: error, icon: 'none' })
      clearError()
    }
  }, [error, clearError])

  useEffect(() => {
    if (currentPet) {
      checkSickAnxiety(currentPet.id, currentPet.name)
    }
  }, [currentPet, checkSickAnxiety])

  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId))
  }

  const handleToggleSymptom = (symptomId: string) => {
    if (selectedSymptoms.includes(symptomId)) {
      deselectSymptom(symptomId)
    } else {
      selectSymptom(symptomId)
    }
  }

  const handleNextStep = () => {
    if (step === 0 && selectedSymptoms.length === 0) {
      Taro.showToast({ title: '请至少选择一个症状', icon: 'none' })
      return
    }
    if (step === 1) {
      handleAnalyze()
      return
    }
    setStep((prev) => prev + 1)
  }

  const handlePrevStep = () => {
    setStep((prev) => Math.max(0, prev - 1))
  }

  const handleAnalyze = async () => {
    if (!currentPet) return
    if (!isMember && user?.id) {
      const access = await checkAccess('symptom_check')
      if (!access.allowed) {
        const showPaywall = await shouldShowPaywall('symptom_check')
        if (showPaywall) {
          await markPaywallShown('symptom_check')
          trackEvent('show_paywall', { feature: 'symptom_check' })
          setPaywallVisible(true)
        } else {
          Taro.switchTab({ url: '/pages/member/index' })
        }
        return
      }
    }
    setStep(2)
    setAnalyzing(true)
    try {
      const result = await analyzeSymptoms(
        currentPet.id,
        {
          duration: additionalInfo.duration,
          frequency: additionalInfo.frequency,
          severity: additionalInfo.severity,
          appetite: additionalInfo.appetite,
          energy: additionalInfo.energy,
          otherNotes: additionalInfo.otherNotes || undefined,
        },
        currentPet
      )
      setStep(3)
      incrementSymptomCheckCount()
      const riskToSeverity: Record<string, EmotionSeverity> = {
        normal: 'mild',
        caution: 'mild',
        warning: 'moderate',
        emergency: 'severe',
      }
      trackEmotion('symptom_check', riskToSeverity[result.riskLevel] || 'mild')
      trackEvent(AnalyticsEventName.SymptomCheck, {
        petId: currentPet.id,
        symptoms: selectedSymptoms,
        urgencyLevel: RISK_TO_URGENCY[result.riskLevel] || 'green',
      })
      if (result.riskLevel === 'emergency') {
        setShowSymptomCrisisReferral(true)
      }
    } catch {
      setStep(1)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleReset = () => {
    clearSelection()
    setStep(0)
    setExpandedCategory(null)
    setAdditionalInfo({
      duration: 'today',
      frequency: 'occasional',
      severity: 'mild',
      appetite: 'normal',
      energy: 'normal',
      otherNotes: '',
    })
  }

  // 搜索过滤：根据输入实时过滤症状
  const filteredCategories = useMemo(() => {
    const q = symptomSearchText.trim().toLowerCase()
    if (!q) return categories // 无搜索词时返回全部

    return categories
      .map((cat) => ({
        ...cat,
        symptoms: cat.symptoms.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.symptoms.length > 0)
  }, [categories, symptomSearchText])

  // 搜索建议：从所有症状中匹配前 8 条
  const symptomSearchSuggestions = useMemo(() => {
    const q = symptomSearchText.trim().toLowerCase()
    if (!q) return []
    const all: { id: string; name: string; categoryName: string }[] = []
    for (const cat of categories) {
      for (const s of cat.symptoms) {
        if (s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) {
          all.push({ id: s.id, name: s.name, categoryName: cat.name })
        }
      }
    }
    return all.slice(0, 8)
  }, [categories, symptomSearchText])

  // 根据搜索词自动展开匹配的分类
  useEffect(() => {
    if (!symptomSearchText.trim()) {
      setExpandedCategory(null)
      return
    }
    // 展开第一个有匹配的分类
    if (filteredCategories.length > 0) {
      setExpandedCategory(filteredCategories[0].id)
    }
  }, [symptomSearchText, filteredCategories])

  const handleQuickCombo = (comboSymptoms: string[]) => {
    // 在所有分类中查找匹配的症状 ID
    const matchedIds: string[] = []
    for (const cat of categories) {
      for (const s of cat.symptoms) {
        if (comboSymptoms.includes(s.name) && !selectedSymptoms.includes(s.id)) {
          matchedIds.push(s.id)
        }
      }
    }
    // 批量选中
    matchedIds.forEach((id) => selectSymptom(id))
    // 不可合并的滚动到顶部提示
    if (matchedIds.length === 0) {
      Taro.showToast({ title: '当前没有匹配的症状', icon: 'none' })
    }
  }

  const handleSymptomSearchInput = (value: string) => {
    setSymptomSearchText(value)
    setShowSymptomSearchSuggestions(value.trim().length > 0)
  }

  const handleSelectSearchSuggestion = (symptomId: string) => {
    if (!selectedSymptoms.includes(symptomId)) {
      selectSymptom(symptomId)
    }
    setSymptomSearchText('')
    setShowSymptomSearchSuggestions(false)
  }

  const isLoading = petLoading || symptomLoading

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
      <View className='pet-symptom-check'>
          <PageLoading />
      </View>
    )
  }

  if (loadError && pets.length === 0) {
    return (
      <View className='pet-symptom-check'>
        <PageError message={loadError} onRetry={loadSymptomData} />
      </View>
    )
  }

  return (
    <View className='pet-symptom-check'>
      <PetSwitcher
        pets={pets}
        currentPetId={currentPet?.id || null}
        onSwitch={switchPet}
      />

      {currentPet && expressionContext && (
        <View className='pet-symptom-check__avatar'>
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
        <View className='pet-symptom-check__empty'>
          <Text className='pet-symptom-check__empty-icon'>🐾</Text>
          <Text className='pet-symptom-check__empty-text'>请先添加宠物</Text>
        </View>
      ) : (
        <View className='pet-symptom-check__content'>
          <View className='pet-symptom-check__steps'>
            {STEP_LABELS.map((label, index) => (
              <View key={label} className='pet-symptom-check__step-item'>
                <View
                  className={`pet-symptom-check__step-dot${
                    index < step ? ' pet-symptom-check__step-dot--done' : ''
                  }${index === step ? ' pet-symptom-check__step-dot--current' : ''}`}
                >
                  {index < step ? (
                    <Text className='pet-symptom-check__step-check'>✓</Text>
                  ) : (
                    <Text className='pet-symptom-check__step-num'>{index + 1}</Text>
                  )}
                </View>
                <Text
                  className={`pet-symptom-check__step-label${
                    index === step ? ' pet-symptom-check__step-label--current' : ''
                  }${index < step ? ' pet-symptom-check__step-label--done' : ''}`}
                >
                  {label}
                </Text>
                {index < STEP_LABELS.length - 1 && (
                  <View
                    className={`pet-symptom-check__step-line${
                      index < step ? ' pet-symptom-check__step-line--done' : ''
                    }`}
                  />
                )}
              </View>
            ))}
          </View>

          {step === 0 && (
            <View className='pet-symptom-check__step-content'>
              {/* 搜索框 */}
              <View className='pet-symptom-check__search-section'>
                <View className='pet-symptom-check__search-wrapper'>
                  <Text className='pet-symptom-check__search-icon'>🔍</Text>
                  <Input
                    className='pet-symptom-check__search-input'
                    placeholder='搜索症状名称...'
                    placeholderClass='pet-symptom-check__search-placeholder'
                    value={symptomSearchText}
                    onInput={(e) => handleSymptomSearchInput(e.detail.value)}
                    onFocus={() => {
                      if (symptomSearchText.trim()) {
                        setShowSymptomSearchSuggestions(true)
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSymptomSearchSuggestions(false), 200)
                    }}
                    onConfirm={() => {
                      if (symptomSearchSuggestions.length > 0) {
                        handleSelectSearchSuggestion(symptomSearchSuggestions[0].id)
                      }
                    }}
                  />
                  {symptomSearchText && (
                    <View
                      className='pet-symptom-check__search-clear'
                      onClick={() => {
                        setSymptomSearchText('')
                        setShowSymptomSearchSuggestions(false)
                      }}
                    >
                      <Text>✕</Text>
                    </View>
                  )}

                  {/* 搜索建议下拉 */}
                  {showSymptomSearchSuggestions && symptomSearchSuggestions.length > 0 && (
                    <View className='pet-symptom-check__search-suggestions'>
                      {symptomSearchSuggestions.map((s) => (
                        <View
                          key={s.id}
                          className={`pet-symptom-check__search-suggestion${
                            selectedSymptoms.includes(s.id) ? ' pet-symptom-check__search-suggestion--selected' : ''
                          }`}
                          onClick={() => handleSelectSearchSuggestion(s.id)}
                        >
                          <Text className='pet-symptom-check__search-suggestion-name'>{s.name}</Text>
                          <Text className='pet-symptom-check__search-suggestion-cat'>{s.categoryName}</Text>
                          {selectedSymptoms.includes(s.id) && (
                            <Text className='pet-symptom-check__search-suggestion-check'>✓</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View className='pet-symptom-check__search-meta'>
                  <Text className='pet-symptom-check__search-meta-text'>
                    已选 {selectedSymptoms.length} 个症状
                  </Text>
                  {selectedSymptoms.length > 0 && (
                    <View
                      className='pet-symptom-check__search-clear-all'
                      onClick={clearSelection}
                    >
                      <Text className='pet-symptom-check__search-clear-all-text'>清空</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 快捷症状组合 */}
              {!symptomSearchText && (
                <View className='pet-symptom-check__quick-combos'>
                  <Text className='pet-symptom-check__quick-combos-title'>🐾 快速选择</Text>
                  <ScrollView scrollX className='pet-symptom-check__quick-combos-scroll'>
                    {QUICK_SYMPTOM_COMBOS.map((combo) => (
                      <View
                        key={combo.label}
                        className='pet-symptom-check__quick-combo'
                        onClick={() => handleQuickCombo(combo.symptoms)}
                      >
                        <Text className='pet-symptom-check__quick-combo-label'>{combo.label}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 症状分类列表 */}
              <View className='pet-symptom-check__categories'>
                {(symptomSearchText ? filteredCategories : categories).map((category) => (
                  <View key={category.id} className='pet-symptom-check__category'>
                    <View
                      className={`pet-symptom-check__category-header${
                        expandedCategory === category.id ? ' pet-symptom-check__category-header--expanded' : ''
                      }`}
                      onClick={() => handleToggleCategory(category.id)}
                    >
                      <View className='pet-symptom-check__category-title'>
                        <Text className='pet-symptom-check__category-icon'>
                          {CATEGORY_ICONS[category.id] || '📋'}
                        </Text>
                        <Text className='pet-symptom-check__category-name'>{category.name}</Text>
                        {symptomSearchText && (
                          <Text className='pet-symptom-check__category-count'>
                            {category.symptoms.length}项
                          </Text>
                        )}
                      </View>
                      <Text className='pet-symptom-check__category-arrow'>
                        {expandedCategory === category.id ? '▲' : '▼'}
                      </Text>
                    </View>

                    {expandedCategory === category.id && (
                      <View className='pet-symptom-check__symptoms'>
                        {category.symptoms.map((symptom) => {
                          const isSelected = selectedSymptoms.includes(symptom.id)
                          return (
                            <View
                              key={symptom.id}
                              className={`pet-symptom-check__symptom${
                                isSelected ? ' pet-symptom-check__symptom--selected' : ''
                              }`}
                              onClick={() => handleToggleSymptom(symptom.id)}
                            >
                              <Text className='pet-symptom-check__symptom-name'>{symptom.name}</Text>
                              <Text className='pet-symptom-check__symptom-desc'>{symptom.description}</Text>
                              {isSelected && (
                                <Text className='pet-symptom-check__symptom-check'>✓</Text>
                              )}
                            </View>
                          )
                        })}
                      </View>
                    )}
                  </View>
                ))}

                {/* 搜索结果为空 */}
                {symptomSearchText && filteredCategories.length === 0 && (
                  <View className='pet-symptom-check__no-results'>
                    <Text className='pet-symptom-check__no-results-icon'>🔍</Text>
                    <Text className='pet-symptom-check__no-results-text'>
                      没有找到「{symptomSearchText}」相关的症状
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {step === 1 && (
            <View className='pet-symptom-check__step-content'>
              <View className='pet-symptom-check__section'>
                <Text className='pet-symptom-check__section-title'>📋 补充信息</Text>
                <Text className='pet-symptom-check__section-hint'>
                  帮助AI更准确地评估毛孩子的状况
                </Text>
              </View>

              <View className='pet-symptom-check__form-section'>
                <Text className='pet-symptom-check__form-label'>⏱️ 持续多久了？</Text>
                <View className='pet-symptom-check__options'>
                  {DURATION_OPTIONS.map((option) => (
                    <View
                      key={option.value}
                      className={`pet-symptom-check__option${
                        additionalInfo.duration === option.value ? ' pet-symptom-check__option--active' : ''
                      }`}
                      onClick={() =>
                        setAdditionalInfo((prev) => ({ ...prev, duration: option.value }))
                      }
                    >
                      <Text className='pet-symptom-check__option-label'>{option.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className='pet-symptom-check__form-section'>
                <Text className='pet-symptom-check__form-label'>🔄 发生频率</Text>
                <View className='pet-symptom-check__options'>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <View
                      key={option.value}
                      className={`pet-symptom-check__option${
                        additionalInfo.frequency === option.value ? ' pet-symptom-check__option--active' : ''
                      }`}
                      onClick={() =>
                        setAdditionalInfo((prev) => ({ ...prev, frequency: option.value }))
                      }
                    >
                      <Text className='pet-symptom-check__option-label'>{option.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className='pet-symptom-check__form-section'>
                <Text className='pet-symptom-check__form-label'>📊 严重程度</Text>
                <View className='pet-symptom-check__options'>
                  {SEVERITY_OPTIONS.map((option) => (
                    <View
                      key={option.value}
                      className={`pet-symptom-check__option${
                        additionalInfo.severity === option.value ? ' pet-symptom-check__option--active' : ''
                      }`}
                      onClick={() =>
                        setAdditionalInfo((prev) => ({ ...prev, severity: option.value }))
                      }
                    >
                      <Text className='pet-symptom-check__option-label'>{option.emoji} {option.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className='pet-symptom-check__form-section'>
                <Text className='pet-symptom-check__form-label'>🍽️ 食欲状况</Text>
                <View className='pet-symptom-check__options'>
                  {APPETITE_OPTIONS.map((option) => (
                    <View
                      key={option.value}
                      className={`pet-symptom-check__option${
                        additionalInfo.appetite === option.value ? ' pet-symptom-check__option--active' : ''
                      }`}
                      onClick={() =>
                        setAdditionalInfo((prev) => ({ ...prev, appetite: option.value }))
                      }
                    >
                      <Text className='pet-symptom-check__option-label'>{option.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className='pet-symptom-check__form-section'>
                <Text className='pet-symptom-check__form-label'>⚡ 精力状态</Text>
                <View className='pet-symptom-check__options'>
                  {ENERGY_OPTIONS.map((option) => (
                    <View
                      key={option.value}
                      className={`pet-symptom-check__option${
                        additionalInfo.energy === option.value ? ' pet-symptom-check__option--active' : ''
                      }`}
                      onClick={() =>
                        setAdditionalInfo((prev) => ({ ...prev, energy: option.value }))
                      }
                    >
                      <Text className='pet-symptom-check__option-label'>{option.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className='pet-symptom-check__form-section'>
                <Text className='pet-symptom-check__form-label'>📝 其他补充（选填）</Text>
                <Textarea
                  className='pet-symptom-check__notes'
                  placeholder='还有什么想告诉AI的...'
                  placeholderClass='pet-symptom-check__notes-placeholder'
                  maxlength={200}
                  value={additionalInfo.otherNotes}
                  onInput={(e) =>
                    setAdditionalInfo((prev) => ({ ...prev, otherNotes: e.detail.value }))
                  }
                />
                <Text className='pet-symptom-check__notes-count'>
                  {additionalInfo.otherNotes.length}/200
                </Text>
              </View>
            </View>
          )}

          {step === 2 && (
            <View className='pet-symptom-check__step-content'>
              <View className='pet-symptom-check__analyzing'>
                <View className='pet-symptom-check__analyzing-pulse'>
                  <View className='pet-symptom-check__analyzing-ring' />
                  <View className='pet-symptom-check__analyzing-ring pet-symptom-check__analyzing-ring--inner' />
                  <Text className='pet-symptom-check__analyzing-icon'>🔍</Text>
                </View>
                <Text className='pet-symptom-check__analyzing-title'>AI正在分析中...</Text>
                <Text className='pet-symptom-check__analyzing-desc'>
                  正在综合评估{currentPet.name}的症状信息
                </Text>
                <View className='pet-symptom-check__analyzing-dots'>
                  <View className='pet-symptom-check__analyzing-dot' />
                  <View className='pet-symptom-check__analyzing-dot' />
                  <View className='pet-symptom-check__analyzing-dot' />
                </View>
              </View>
            </View>
          )}

          {step === 3 && currentResult && (
            <View className='pet-symptom-check__step-content'>
              {/* 风险等级可视化仪表 */}
              <View className='pet-symptom-check__gauge'>
                <View className='pet-symptom-check__gauge-bg'>
                  <View className='pet-symptom-check__gauge-track'>
                    <View
                      className={`pet-symptom-check__gauge-fill pet-symptom-check__gauge-fill--${currentResult.riskLevel}`}
                      style={{ width: currentResult.riskLevel === 'normal' ? '25%' : currentResult.riskLevel === 'caution' ? '50%' : currentResult.riskLevel === 'warning' ? '75%' : '100%' }}
                    />
                  </View>
                  <View className='pet-symptom-check__gauge-marks'>
                    <View className='pet-symptom-check__gauge-mark'>
                      <Text className='pet-symptom-check__gauge-dot' />
                      <Text className='pet-symptom-check__gauge-label'>良好</Text>
                    </View>
                    <View className='pet-symptom-check__gauge-mark'>
                      <Text className='pet-symptom-check__gauge-dot' />
                      <Text className='pet-symptom-check__gauge-label'>注意</Text>
                    </View>
                    <View className='pet-symptom-check__gauge-mark'>
                      <Text className='pet-symptom-check__gauge-dot' />
                      <Text className='pet-symptom-check__gauge-label'>密切</Text>
                    </View>
                    <View className='pet-symptom-check__gauge-mark'>
                      <Text className='pet-symptom-check__gauge-dot' />
                      <Text className='pet-symptom-check__gauge-label'>紧急</Text>
                    </View>
                  </View>
                </View>

                {/* 当前结果指标卡片 */}
                <View className='pet-symptom-check__gauge-card'>
                  <View className='pet-symptom-check__gauge-card-icon' style={{ backgroundColor: RISK_CONFIG[currentResult.riskLevel]?.color || '#52C41A' }}>
                    <Text className='pet-symptom-check__gauge-card-emoji'>
                      {RISK_CONFIG[currentResult.riskLevel]?.emoji || '✅'}
                    </Text>
                  </View>
                  <View className='pet-symptom-check__gauge-card-info'>
                    <Text className='pet-symptom-check__gauge-card-level'>
                      {RISK_CONFIG[currentResult.riskLevel]?.label || '未知'}
                    </Text>
                    <Text className='pet-symptom-check__gauge-card-desc'>
                      基于 {selectedSymptoms.length} 个症状的综合评估
                    </Text>
                  </View>
                </View>

                {/* 症状摘要标签 */}
                <View className='pet-symptom-check__gauge-symptoms'>
                  {selectedSymptoms.map((sid) => {
                    const s = categories.flatMap((c) => c.symptoms).find((s) => s.id === sid)
                    if (!s) return null
                    return (
                      <Text key={sid} className='pet-symptom-check__gauge-symptom-tag'>
                        {s.name}
                      </Text>
                    )
                  })}
                </View>
              </View>

              <View
                className={`pet-symptom-check__result pet-symptom-check__result--${currentResult.riskLevel}`}
              >
                <View className='pet-symptom-check__result-advice'>
                  <Text className='pet-symptom-check__result-advice-text'>
                    {currentResult.aiAdvice}
                  </Text>
                </View>

                {currentResult.possibleConditions.length > 0 && (
                  <View className='pet-symptom-check__result-section'>
                    <Text className='pet-symptom-check__result-section-title'>🔬 可能相关</Text>
                    <View className='pet-symptom-check__result-tags'>
                      {currentResult.possibleConditions.map((condition) => (
                        <Text key={condition} className='pet-symptom-check__result-tag'>
                          {condition}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                {currentResult.recommendedActions.length > 0 && (
                  <View className='pet-symptom-check__result-section'>
                    <Text className='pet-symptom-check__result-section-title'>📋 建议行动</Text>
                    <View className='pet-symptom-check__result-actions'>
                      {currentResult.recommendedActions.map((action, index) => (
                        <View key={index} className='pet-symptom-check__result-action'>
                          <Text className='pet-symptom-check__result-action-num'>{index + 1}</Text>
                          <Text className='pet-symptom-check__result-action-text'>{action}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {currentResult.personalizedInsights && currentResult.personalizedInsights.length > 0 && (
                  <View className='pet-symptom-check__result-section'>
                    <Text className='pet-symptom-check__result-section-title'>🧠 基于记忆的个性化判断</Text>
                    <View className='pet-symptom-check__insights'>
                      {currentResult.personalizedInsights.map((insight, index) => {
                        const isHistorical = insight.type === 'similar_past_event' || insight.type === 'seasonal_pattern' || insight.type === 'recovery_reference'
                        return (
                          <View
                            key={index}
                            className={`pet-symptom-check__insight pet-symptom-check__insight--${insight.type}${isHistorical ? ' pet-symptom-check__insight--historical' : ''}`}
                          >
                            <Text className='pet-symptom-check__insight-icon'>{insight.icon}</Text>
                            <View className='pet-symptom-check__insight-content'>
                              {insight.title && <Text className='pet-symptom-check__insight-title'>{insight.title}</Text>}
                              <Text className='pet-symptom-check__insight-message'>{insight.message}</Text>
                              {insight.pastDate && (
                                <Text className='pet-symptom-check__insight-date'>
                                  📅 {insight.pastDate.replace(/-/g, '/')}
                                  {insight.recoveryDays != null && insight.recoveryDays > 0 ? ` · 恢复用时${insight.recoveryDays}天` : ''}
                                </Text>
                              )}
                            </View>
                          </View>
                        )
                      })}
                    </View>
                  </View>
                )}

                <View className='pet-symptom-check__result-disclaimer'>
                  <Text className='pet-symptom-check__result-disclaimer-text'>
                    ⚠️ 以上建议仅供参考，不替代兽医诊断。如症状持续或加重，请及时就医。
                  </Text>
                </View>
              </View>

              <View className='pet-symptom-check__result-actions-bar'>
                {(currentResult.riskLevel === 'warning' || currentResult.riskLevel === 'emergency') && (
                  <View
                    className='pet-symptom-check__btn pet-symptom-check__btn--hospital'
                    onClick={() => {
                      trackEvent(AnalyticsEventName.FindHospital, { petId: currentPet?.id || '', urgencyLevel: RISK_TO_URGENCY[currentResult?.riskLevel || ''] || 'green', source: 'symptom_check' })
                      Taro.navigateTo({ url: '/pagesPet/hospital/index' })
                    }}
                  >
                    <Text className='pet-symptom-check__btn-text pet-symptom-check__btn-text--white'>🏥 找医院</Text>
                  </View>
                )}
                <View className='pet-symptom-check__btn pet-symptom-check__btn--outline' onClick={handleReset}>
                  <Text className='pet-symptom-check__btn-text'>重新检查</Text>
                </View>
                <View
                  className='pet-symptom-check__btn pet-symptom-check__btn--primary'
                  onClick={() => {
                    safeNavigateBack()
                  }}
                >
                  <Text className='pet-symptom-check__btn-text pet-symptom-check__btn-text--white'>完成</Text>
                </View>
              </View>
            </View>
          )}

          {step < 2 && (
            <View className='pet-symptom-check__footer'>
              {step > 0 && (
                <View className='pet-symptom-check__btn pet-symptom-check__btn--outline' onClick={handlePrevStep}>
                  <Text className='pet-symptom-check__btn-text'>上一步</Text>
                </View>
              )}
              <View
                className={`pet-symptom-check__btn pet-symptom-check__btn--primary${
                  step === 0 && selectedSymptoms.length === 0 ? ' pet-symptom-check__btn--disabled' : ''
                }`}
                onClick={handleNextStep}
              >
                <Text className='pet-symptom-check__btn-text pet-symptom-check__btn-text--white'>
                  {step === 0 ? '下一步' : '开始分析'}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      <PaywallPopup
        visible={paywallVisible}
        featureName="AI症状初筛"
        remainingFree={0}
        onUpgrade={() => { setPaywallVisible(false); Taro.switchTab({ url: '/pages/member/index' }) }}
        onClose={() => setPaywallVisible(false)}
      />

      <EmergencyAlert
        visible={step === 3 && !!currentResult && currentResult.riskLevel === 'emergency'}
        title='紧急症状预警'
        message={currentResult?.aiAdvice || '检测到紧急症状信号，建议立即联系宠物医院进行专业诊断。'}
        showSymptomButton={false}
        showFoodButton={false}
        petId={currentPet?.id || ''}
        symptoms={selectedSymptoms}
        alertType='symptom_emergency'
        onClose={() => {}}
      />

      {anxietyState.showSickAnxiety && anxietyState.sickAnxietyContext && currentPet && (
        <AnxietyIntervention
          type='sick_anxiety'
          context={anxietyState.sickAnxietyContext}
          petName={currentPet.name}
          species={currentPet.species as 'dog' | 'cat'}
          petId={currentPet.id}
          onDismiss={dismissSickAnxiety}
          onCrisisReferral={() => { dismissSickAnxiety() }}
        />
      )}

      {showCrisisReferral && (
        <CrisisReferralCard
          message='我们注意到你最近频繁关注毛孩子的健康状况，持续焦虑可能影响你的判断和状态。'
          severity={crisisSeverity}
          onDismiss={dismissCrisisReferral}
          onFollowUp={handleFollowUp}
        />
      )}

      {showSymptomCrisisReferral && (
        <CrisisReferralCard
          message={getCrisisMessage('sick_anxiety', 'severe')}
          severity='severe'
          triggerSource='symptom_emergency'
          onDismiss={() => setShowSymptomCrisisReferral(false)}
          onFollowUp={handleFollowUp}
        />
      )}

    </View>
  )
}
