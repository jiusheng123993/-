import { View, Text, Input, Textarea } from '@tarojs/components'
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useShareStore } from '../../stores/shareStore'
import { usePet } from '../../hooks/usePet'
import { useCheckin } from '../../hooks/useCheckin'
import PetSwitcher from '../../components/PetSwitcher'
import FloatingNav from '../../components/FloatingNav'
import { PageLoading, PageError, PetAvatar, AchievementCard, AchievementShareCard, EmergencyAlert, CarePlanCard } from '../../components'
import CrisisReferralCard from '../../components/CrisisReferralCard'
import { useSubscribeStore } from '../../stores/subscribeStore'
import { useCheckinStore } from '../../stores/checkinStore'
import { checkAllAchievements } from '../../services/achievementService'
import { useEmotionTracking } from '../../hooks/useEmotionTracking'
import type { EmotionSeverity } from '../../services/emotionTrackingService'
import { generateDiaryForToday, type DiaryEntry } from '../../engines/petAvatar/diaryEngine'
import type { ExpressionContext } from '../../engines/petAvatar'
import type { AchievementConfig } from '../../components/AchievementCard'
import { getCrisisMessage } from '../../engines/emotion'
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
import { updateLastCheckinDate } from '../../services/churnDetectionService'
import { useAnalytics, usePageView } from '../../hooks/useAnalytics'
import { AnalyticsEventName } from '../../types/analyticsTypes'
import { EVENT } from '../../constants/analyticsEvents'
import type { Checkin } from '../../types'
import './index.scss'

const APPETITE_OPTIONS = [
  { value: 3 as const, emoji: '😋', label: '正常' },
  { value: 2 as const, emoji: '😐', label: '少吃' },
  { value: 4 as const, emoji: '🍽️', label: '多吃' },
  { value: 1 as const, emoji: '😷', label: '不吃' },
  { value: 5 as const, emoji: '🤮', label: '呕吐' },
]

const SPIRIT_OPTIONS = [
  { value: 3 as const, emoji: '⚡', label: '正常' },
  { value: 2 as const, emoji: '😴', label: '安静' },
  { value: 4 as const, emoji: '😊', label: '兴奋' },
  { value: 5 as const, emoji: '🤪', label: '亢奋' },
  { value: 1 as const, emoji: '😞', label: '萎靡' },
]

const POOP_OPTIONS = [
  { value: 3 as const, emoji: '💩', label: '正常' },
  { value: 4 as const, emoji: '🟤', label: '偏软' },
  { value: 2 as const, emoji: '💧', label: '腹泻' },
  { value: 5 as const, emoji: '🪨', label: '便秘' },
  { value: 1 as const, emoji: '🩸', label: '带血' },
]

const EXERCISE_OPTIONS = [
  { value: 2 as const, emoji: '🏃', label: '正常' },
  { value: 1 as const, emoji: '🛋️', label: '少' },
  { value: 3 as const, emoji: '🏋️', label: '多' },
]

const APPETITE_LABELS: Record<number, string> = { 1: '不吃', 2: '少吃', 3: '正常', 4: '多吃', 5: '呕吐' }
const SPIRIT_LABELS: Record<number, string> = { 1: '萎靡', 2: '安静', 3: '正常', 4: '兴奋', 5: '亢奋' }
const POOP_LABELS: Record<number, string> = { 1: '带血', 2: '腹泻', 3: '正常', 4: '偏软', 5: '便秘' }
const EXERCISE_LABELS: Record<number, string> = { 1: '少', 2: '正常', 3: '多' }
const APPETITE_EMOJIS: Record<number, string> = { 1: '😷', 2: '😐', 3: '😋', 4: '🍽️', 5: '🤮' }
const SPIRIT_EMOJIS: Record<number, string> = { 1: '😞', 2: '😴', 3: '⚡', 4: '😊', 5: '🤪' }
const POOP_EMOJIS: Record<number, string> = { 1: '🩸', 2: '💧', 3: '💩', 4: '🟤', 5: '🪨' }
const EXERCISE_EMOJIS: Record<number, string> = { 1: '🛋️', 2: '🏃', 3: '🏋️' }

const RESULT_LABELS: Record<string, string> = {
  low: '状态良好',
  medium: '注意观察',
  high: '密切观察',
  emergency: '立即就医',
}

const RESULT_ICONS: Record<string, string> = {
  low: '✅',
  medium: '💡',
  high: '🔔',
  emergency: '⚠️',
}

const MOOD_DISPLAY: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: '😊', label: '开心' },
  normal: { emoji: '⚡', label: '正常' },
  sad: { emoji: '😞', label: '萎靡' },
}

const APPETITE_DISPLAY: Record<string, { emoji: string; label: string }> = {
  good: { emoji: '🍽️', label: '好' },
  normal: { emoji: '😋', label: '正常' },
  poor: { emoji: '😷', label: '差' },
}

const STOOL_DISPLAY: Record<string, { emoji: string; label: string }> = {
  normal: { emoji: '💩', label: '正常' },
  loose: { emoji: '💧', label: '腹泻' },
  hard: { emoji: '🪨', label: '便秘' },
}

function mapAppetiteLevel(level: number): Checkin['appetite'] {
  if (level <= 2) return 'poor'
  if (level === 3) return 'normal'
  return 'good'
}

function mapSpiritLevel(level: number): Checkin['mood'] {
  if (level <= 2) return 'sad'
  if (level === 3) return 'normal'
  return 'happy'
}

function mapPoopLevel(level: number): Checkin['stool'] {
  if (level <= 2) return 'loose'
  if (level === 3) return 'normal'
  return 'hard'
}

function computeRiskLevel(mood: Checkin['mood'], appetite: Checkin['appetite'], stool: Checkin['stool']): string {
  if (stool === 'loose' && appetite === 'poor' && mood === 'sad') return 'emergency'
  if (appetite === 'poor' && mood === 'sad') return 'high'
  if (stool === 'loose' || appetite === 'poor' || mood === 'sad') return 'medium'
  return 'low'
}

function computeAnomalyItems(mood: Checkin['mood'], appetite: Checkin['appetite'], stool: Checkin['stool']): string[] {
  const items: string[] = []
  if (mood === 'sad') items.push('spirit')
  if (appetite === 'poor') items.push('appetite')
  if (stool !== 'normal') items.push('poop')
  return items
}

function computeHasAnomaly(mood: Checkin['mood'], appetite: Checkin['appetite'], stool: Checkin['stool']): boolean {
  return mood === 'sad' || appetite === 'poor' || stool !== 'normal'
}

export default function PetCheckin() {
  const { pets, currentPet, switchPet, isLoading: petLoading } = usePet()
  const { checkins, todayCheckin, streakDays, isLoading: checkinLoading, initUser, doCheckin, fetchCheckins } = useCheckin()
  const userId = useAuthStore(s => s.user?.id) || ''
  const inviteCode = useShareStore(s => s.inviteCode)

  useShareAppMessage(() => ({
    title: '星寰海 - 宠物健康打卡',
    path: `/pagesPet/checkin/index${inviteCode ? `?inviteCode=${inviteCode}` : ''}`,
  }))
  useShareTimeline(() => ({
    title: '星寰海 - 宠物健康打卡',
    query: inviteCode ? `inviteCode=${inviteCode}` : '',
  }))

  const [formData, setFormData] = useState({
    appetiteLevel: 3 as 1 | 2 | 3 | 4 | 5,
    spiritLevel: 3 as 1 | 2 | 3 | 4 | 5,
    poopLevel: 3 as 1 | 2 | 3 | 4 | 5,
    exerciseLevel: 2 as 1 | 2 | 3,
    weight: undefined as number | undefined,
    notes: '',
  })

  const [weightText, setWeightText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [achievement, setAchievement] = useState<AchievementConfig | null>(null)
  const [showAchievementShare, setShowAchievementShare] = useState(false)
  const [feedbackResult, setFeedbackResult] = useState<{ riskLevel: string; feedback: string; anomalyItems?: string[] } | null>(null)
  const [diaryEntry, setDiaryEntry] = useState<DiaryEntry | null>(null)
  const [showCarePlan, setShowCarePlan] = useState(false)
  const [showCheckinCrisisReferral, setShowCheckinCrisisReferral] = useState(false)
  const { trackPageView, trackEvent } = useAnalytics()
  const { showCrisisReferral, crisisSeverity, trackEvent: trackEmotion, dismissCrisisReferral, handleFollowUp } = useEmotionTracking(currentPet?.id || null)

  const isAccepted = useSubscribeStore((s) => s.isAccepted)
  const requestAll = useSubscribeStore((s) => s.requestAll)

  const loadCheckinData = useCallback(async () => {
    setError('')
    try {
      if (userId) {
        await initUser(userId)
      }
      if (currentPet) {
        await fetchCheckins(currentPet.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败，请重试')
    }
  }, [userId, currentPet, initUser, fetchCheckins])

  useEffect(() => {
    trackPageView('checkin')
  }, [])

  useEffect(() => {
    loadCheckinData()
  }, [loadCheckinData])

  const calculateConsecutiveAnomalyDays = useCallback((): number => {
    if (!checkins || checkins.length === 0) return 0
    const sorted = [...checkins].sort((a, b) => b.date.localeCompare(a.date))
    let count = 0
    for (const entry of sorted) {
      const isAnomaly = entry.mood === 'sad' || entry.appetite === 'poor' || entry.stool !== 'normal'
      const risk = computeRiskLevel(entry.mood, entry.appetite, entry.stool)
      if (isAnomaly || risk === 'high' || risk === 'emergency') {
        count++
      } else {
        break
      }
    }
    return count
  }, [checkins])

  const handleSubmit = async () => {
    if (!currentPet) return
    const mood = mapSpiritLevel(formData.spiritLevel)
    const appetite = mapAppetiteLevel(formData.appetiteLevel)
    const stool = mapPoopLevel(formData.poopLevel)
    const hasAnomaly = computeHasAnomaly(mood, appetite, stool)
    const anomalyItems = computeAnomalyItems(mood, appetite, stool)
    const riskLevel = computeRiskLevel(mood, appetite, stool)
    const noteParts: string[] = []
    if (formData.notes) noteParts.push(formData.notes)
    if (formData.exerciseLevel !== 2) noteParts.push(`运动: ${EXERCISE_LABELS[formData.exerciseLevel]}`)
    if (anomalyItems.length > 0) noteParts.push(`异常项: ${anomalyItems.join(', ')}`)

    trackEvent(AnalyticsEventName.CheckinSubmit, {
      petId: currentPet.id,
      items: JSON.stringify({ appetite: formData.appetiteLevel, spirit: formData.spiritLevel, poop: formData.poopLevel, exercise: formData.exerciseLevel }),
      hasAnomaly,
    })
    setSubmitting(true)
    try {
      const result = await doCheckin({
        petId: currentPet.id,
        userId,
        date: new Date().toISOString().split('T')[0],
        mood,
        appetite,
        stool,
        weight: formData.weight,
        note: noteParts.length > 0 ? noteParts.join('; ') : undefined,
      })

      if (hasAnomaly) {
        trackEvent(AnalyticsEventName.CheckinAnomaly, {
          petId: currentPet.id,
          anomalyItems: JSON.stringify(anomalyItems),
          urgency: riskLevel,
        })
      }
      if (hasAnomaly) {
        const riskToSeverity: Record<string, EmotionSeverity> = {
          low: 'mild',
          medium: 'moderate',
          high: 'severe',
          emergency: 'severe',
        }
        trackEmotion('anomaly_detected', riskToSeverity[riskLevel] || 'moderate')
      }
      if (riskLevel === 'emergency') {
        setFeedbackResult({ riskLevel, feedback: '检测到紧急健康信号，建议立即联系宠物医院', anomalyItems })
      } else if (riskLevel === 'high' || riskLevel === 'medium') {
        setFeedbackResult({ riskLevel, feedback: '检测到异常指标，建议持续观察', anomalyItems })
      } else {
        Taro.showToast({ title: '打卡成功', icon: 'success' })
      }

      updateLastCheckinDate()

      const consecutiveDays = calculateConsecutiveAnomalyDays()
      if (consecutiveDays >= 7) {
        setShowCheckinCrisisReferral(true)
      }

      if (currentPet) {
        const currentStreakDays = useCheckinStore.getState().streakDays
        const birth = currentPet.birthDate ? new Date(currentPet.birthDate) : null
        const now = new Date()
        const isBirthday = birth
          ? now.getMonth() === birth.getMonth() && now.getDate() === birth.getDate()
          : false
        const diary = generateDiaryForToday(null, currentStreakDays, isBirthday, false)
        setDiaryEntry(diary)
      }

      if (currentPet) {
        fetchCheckins(currentPet.id)
      }

      if (currentPet) {
        const newStreakDays = useCheckinStore.getState().streakDays
        const detected = checkAllAchievements({
          petId: currentPet.id,
          birthDate: currentPet.birthDate,
          streakDays: newStreakDays,
          isDeceased: currentPet.isDeceased || false,
        })
        if (detected) {
          trackEvent('show_achievement')
          setAchievement(detected)
        }
      }

      if (!isAccepted('HEALTH_CHECKIN_TEMPLATE_ID_PLACEHOLDER')) {
        setTimeout(() => {
          Taro.showModal({
            title: '🔔 开启每日提醒',
            content: '是否开启每日打卡提醒？每天定时提醒你为毛孩子记录健康状态',
            confirmText: '开启',
            cancelText: '暂不',
            success: (modalRes) => {
              if (modalRes.confirm) {
                requestAll()
              }
            },
          })
        }, 1500)
      }
    } catch {
      Taro.showToast({ title: '打卡失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleWeightChange = (value: string) => {
    setWeightText(value)
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0) {
      setFormData((prev) => ({ ...prev, weight: num }))
    } else if (value === '') {
      setFormData((prev) => ({ ...prev, weight: undefined }))
    }
  }

  const handleAchievementShare = useCallback(() => {
    trackEvent(AnalyticsEventName.ShareAction, { type: 'achievement', platform: 'wechat' })
    setShowAchievementShare(true)
  }, [trackEvent, achievement?.id])

  const handleAchievementShareClose = useCallback(() => {
    setShowAchievementShare(false)
  }, [])

  const isLoading = petLoading || checkinLoading

  const todayHasAnomaly = todayCheckin ? computeHasAnomaly(todayCheckin.mood, todayCheckin.appetite, todayCheckin.stool) : false

  const disclaimerText = useMemo(() => {
    const disclaimer = new MedicalDisclaimer()
    return disclaimer.getCheckinDisclaimer(todayHasAnomaly)
  }, [todayHasAnomaly])

  const todayAnomalyItems = todayCheckin ? computeAnomalyItems(todayCheckin.mood, todayCheckin.appetite, todayCheckin.stool) : []
  const todayRiskLevel = todayCheckin ? computeRiskLevel(todayCheckin.mood, todayCheckin.appetite, todayCheckin.stool) : 'low'

  const expressionContext = useMemo((): ExpressionContext | null => {
    if (!currentPet) return null
    const now = new Date()
    const birth = currentPet.birthDate ? new Date(currentPet.birthDate) : null
    const isBirthday = birth
      ? now.getMonth() === birth.getMonth() && now.getDate() === birth.getDate()
      : false
    return {
      todayEntry: null,
      hasAnomaly: todayHasAnomaly,
      anomalyCount: todayAnomalyItems.length,
      riskLevel: todayRiskLevel as ExpressionContext['riskLevel'],
      streakDays,
      isBirthday,
      isVaccineComplete: false,
      isRecovery: false,
      isDeceased: currentPet.isDeceased || false,
    }
  }, [currentPet, todayHasAnomaly, todayAnomalyItems, todayRiskLevel, streakDays])

  const monthlyCount = useMemo(() => {
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return checkins.filter(c => c.date.startsWith(yearMonth)).length
  }, [checkins])

  const totalCheckins = checkins.length

  if (isLoading && pets.length === 0) {
    return (
      <View className='pet-checkin'>
        <PageLoading />
        <FloatingNav />
      </View>
    )
  }

  if (error && pets.length === 0) {
    return (
      <View className='pet-checkin'>
        <PageError message={error} onRetry={loadCheckinData} />
        <FloatingNav />
      </View>
    )
  }

  return (
    <View className='pet-checkin'>
      <PetSwitcher
        pets={pets}
        currentPetId={currentPet?.id || null}
        onSwitch={switchPet}
      />

      {currentPet && expressionContext && (
        <View className='pet-checkin__avatar'>
          <PetAvatar
            species={currentPet.species as 'dog' | 'cat'}
            petName={currentPet.name}
            expressionContext={expressionContext}
            size={100}
            showLabel
          />
        </View>
      )}

      {!currentPet ? (
        <View className='pet-checkin__empty'>
          <Text className='pet-checkin__empty-icon'>🐾</Text>
          <Text className='pet-checkin__empty-text'>请先添加宠物</Text>
        </View>
      ) : todayCheckin ? (
        <View className='pet-checkin__result-wrapper'>
          <View className={`pet-checkin__result pet-checkin__result--${todayRiskLevel}`}>
            <Text className='pet-checkin__result-title'>
              {RESULT_ICONS[todayRiskLevel] || '✅'} 今日已打卡
            </Text>
            <Text className='pet-checkin__result-feedback'>
              {todayRiskLevel === 'emergency' ? '检测到紧急健康信号，建议立即联系宠物医院' :
               todayRiskLevel === 'high' ? '检测到异常指标，建议持续观察' :
               todayRiskLevel === 'medium' ? '部分指标需要关注，请继续观察' :
               '今日状态良好'}
            </Text>
            <View className='pet-checkin__result-detail'>
              <Text className='pet-checkin__result-tag'>
                食欲：{APPETITE_DISPLAY[todayCheckin.appetite].emoji} {APPETITE_DISPLAY[todayCheckin.appetite].label}
              </Text>
              <Text className='pet-checkin__result-tag'>
                精力：{MOOD_DISPLAY[todayCheckin.mood].emoji} {MOOD_DISPLAY[todayCheckin.mood].label}
              </Text>
              <Text className='pet-checkin__result-tag'>
                便便：{STOOL_DISPLAY[todayCheckin.stool].emoji} {STOOL_DISPLAY[todayCheckin.stool].label}
              </Text>
              {todayCheckin.weight && (
                <Text className='pet-checkin__result-tag'>体重：{todayCheckin.weight}kg</Text>
              )}
            </View>
          </View>

          {diaryEntry && currentPet && (
            <View className='pet-checkin__diary'>
              <View className='pet-checkin__diary-header'>
                <PetAvatar
                  species={currentPet.species as 'dog' | 'cat'}
                  petName={currentPet.name}
                  expressionContext={expressionContext!}
                  size={48}
                  showLabel={false}
                />
                <Text className='pet-checkin__diary-title'>今日宠物日记</Text>
              </View>
              <View className='pet-checkin__diary-body'>
                <Text className='pet-checkin__diary-emoji'>{diaryEntry.emoji}</Text>
                <Text className='pet-checkin__diary-text'>"{diaryEntry.text}"</Text>
                <Text className='pet-checkin__diary-author'>—— {currentPet.name}</Text>
              </View>
              <View
                className='pet-checkin__diary-share'
                onClick={() => {
                  trackEvent(AnalyticsEventName.ShareAction, { type: 'diary', platform: 'wechat' })
                  Taro.showShareMenu({ withShareTicket: true })
                }}
              >
                <Text className='pet-checkin__diary-share-text'>📤 分享日记</Text>
              </View>
            </View>
          )}

          {todayRiskLevel !== 'low' && calculateConsecutiveAnomalyDays() >= 3 && (
            <View
              className='pet-checkin__care-plan-btn'
              onClick={() => setShowCarePlan(true)}
            >
              <Text className='pet-checkin__care-plan-btn-text'>📋 查看3天护理计划</Text>
            </View>
          )}
        </View>
      ) : (
        <View className='pet-checkin__form'>
          <View className='pet-checkin__section'>
            <Text className='pet-checkin__section-title'>🍽️ 食欲</Text>
            <View className='pet-checkin__options'>
              {APPETITE_OPTIONS.map((option) => (
                <View
                  key={option.value}
                  className={`pet-checkin__option${formData.appetiteLevel === option.value ? ' pet-checkin__option--active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, appetiteLevel: option.value }))}
                >
                  <Text className='pet-checkin__option-emoji'>{option.emoji}</Text>
                  <Text className='pet-checkin__option-label'>{option.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='pet-checkin__section'>
            <Text className='pet-checkin__section-title'>⚡ 精力</Text>
            <View className='pet-checkin__options'>
              {SPIRIT_OPTIONS.map((option) => (
                <View
                  key={option.value}
                  className={`pet-checkin__option${formData.spiritLevel === option.value ? ' pet-checkin__option--active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, spiritLevel: option.value }))}
                >
                  <Text className='pet-checkin__option-emoji'>{option.emoji}</Text>
                  <Text className='pet-checkin__option-label'>{option.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='pet-checkin__section'>
            <Text className='pet-checkin__section-title'>💩 便便</Text>
            <View className='pet-checkin__options'>
              {POOP_OPTIONS.map((option) => (
                <View
                  key={option.value}
                  className={`pet-checkin__option${formData.poopLevel === option.value ? ' pet-checkin__option--active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, poopLevel: option.value }))}
                >
                  <Text className='pet-checkin__option-emoji'>{option.emoji}</Text>
                  <Text className='pet-checkin__option-label'>{option.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='pet-checkin__section'>
            <Text className='pet-checkin__section-title'>🏃 运动</Text>
            <View className='pet-checkin__options'>
              {EXERCISE_OPTIONS.map((option) => (
                <View
                  key={option.value}
                  className={`pet-checkin__option${formData.exerciseLevel === option.value ? ' pet-checkin__option--active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, exerciseLevel: option.value }))}
                >
                  <Text className='pet-checkin__option-emoji'>{option.emoji}</Text>
                  <Text className='pet-checkin__option-label'>{option.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='pet-checkin__section'>
            <Text className='pet-checkin__section-title'>⚖️ 体重（选填，kg）</Text>
            <Input
              className='pet-checkin__weight-input'
              type='digit'
              placeholder='请输入体重'
              placeholderClass='pet-checkin__weight-placeholder'
              value={weightText}
              onInput={(e) => handleWeightChange(e.detail.value)}
            />
          </View>

          <View className='pet-checkin__section'>
            <Text className='pet-checkin__section-title'>📝 备注（选填）</Text>
            <Textarea
              className='pet-checkin__notes'
              placeholder='有什么想记录的吗...'
              placeholderClass='pet-checkin__notes-placeholder'
              maxlength={200}
              value={formData.notes}
              onInput={(e) => setFormData((prev) => ({ ...prev, notes: e.detail.value }))}
            />
            <Text className='pet-checkin__notes-count'>{formData.notes.length}/200</Text>
          </View>

          <View
            className={`pet-checkin__submit${submitting ? ' pet-checkin__submit--disabled' : ''}`}
            onClick={submitting ? undefined : handleSubmit}
          >
            <Text>{submitting ? '提交中...' : '提交打卡'}</Text>
          </View>
        </View>
      )}

      <View className='pet-checkin__stats'>
        <View className='pet-checkin__stats-item'>
          <Text className='pet-checkin__stats-value'>{streakDays}</Text>
          <Text className='pet-checkin__stats-label'>连续打卡（天）</Text>
        </View>
        <View className='pet-checkin__stats-divider' />
        <View className='pet-checkin__stats-item'>
          <Text className='pet-checkin__stats-value'>{monthlyCount}</Text>
          <Text className='pet-checkin__stats-label'>本月打卡（次）</Text>
        </View>
        <View className='pet-checkin__stats-divider' />
        <View className='pet-checkin__stats-item'>
          <Text className='pet-checkin__stats-value'>{totalCheckins}</Text>
          <Text className='pet-checkin__stats-label'>累计打卡</Text>
        </View>
      </View>

      {feedbackResult && feedbackResult.riskLevel !== 'emergency' && (
        <View className='pet-checkin__feedback-overlay' onClick={(e) => { e.stopPropagation() }}>
          <View className='pet-checkin__feedback-popup'>
            <View className='pet-checkin__feedback-header'>
              <Text className='pet-checkin__feedback-icon'>⚠️</Text>
              <Text className='pet-checkin__feedback-title'>异常指标提醒</Text>
            </View>
            <Text className='pet-checkin__feedback-text'>{feedbackResult.feedback}</Text>
            <View className='pet-checkin__feedback-actions'>
              <View
                className='pet-checkin__feedback-btn pet-checkin__feedback-btn--food'
                onClick={() => { setFeedbackResult(null); Taro.navigateTo({ url: '/pagesPet/food-query/index' }) }}
              >
                <Text className='pet-checkin__feedback-btn-text'>查食物</Text>
              </View>
              <View
                className='pet-checkin__feedback-btn pet-checkin__feedback-btn--close'
                onClick={() => setFeedbackResult(null)}
              >
                <Text className='pet-checkin__feedback-btn-text'>关闭</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <EmergencyAlert
        visible={!!feedbackResult && feedbackResult.riskLevel === 'emergency'}
        message={feedbackResult?.feedback || '检测到紧急健康信号，建议立即联系宠物医院'}
        showSymptomButton
        showFoodButton
        petId={currentPet?.id || ''}
        symptoms={feedbackResult?.anomalyItems || []}
        alertType='checkin_emergency'
        onClose={() => setFeedbackResult(null)}
      />

      {achievement && currentPet && (
        <View className='pet-checkin__achievement'>
          <AchievementCard
            achievement={achievement}
            petName={currentPet.name}
            species={currentPet.species as 'dog' | 'cat'}
            onClose={() => setAchievement(null)}
            onShare={handleAchievementShare}
          />
        </View>
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

      <View className='pet-checkin__disclaimer'>
        <Text className='pet-checkin__disclaimer-text'>{disclaimerText}</Text>
      </View>

      {showCrisisReferral && (
        <CrisisReferralCard
          message='我们注意到毛孩子近期健康数据持续异常，这可能会让你感到焦虑。照顾好自己，才能更好地照顾TA。'
          severity={crisisSeverity}
          onDismiss={dismissCrisisReferral}
          onFollowUp={handleFollowUp}
        />
      )}

      {currentPet && (
        <CarePlanCard
          visible={showCarePlan}
          petName={currentPet.name}
          anomalyItems={todayAnomalyItems}
          onClose={() => setShowCarePlan(false)}
        />
      )}

      {showCheckinCrisisReferral && (
        <CrisisReferralCard
          message={getCrisisMessage('sick_anxiety', 'severe')}
          severity='severe'
          triggerSource='checkin_severe'
          onDismiss={() => setShowCheckinCrisisReferral(false)}
          onFollowUp={handleFollowUp}
        />
      )}

      <FloatingNav />
    </View>
  )
}
