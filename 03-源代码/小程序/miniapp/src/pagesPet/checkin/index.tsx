import { View, Text, Input, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { usePet } from '../../hooks/usePet'
import { useCheckin } from '../../hooks/useCheckin'
import PetSwitcher from '../../components/PetSwitcher'
import FloatingNav from '../../components/FloatingNav'
import { PageLoading, PageError, EmotionResponseCard, PetAvatar } from '../../components'
import { useEmotionStore, buildEmotionContext } from '../../stores/emotionStore'
import { useSubscribeStore } from '../../stores/subscribeStore'
import type { ExpressionContext } from '../../engines/petAvatar'
import './index.scss'

const APPETITE_OPTIONS = [
  { value: 3 as const, emoji: '😋', label: '正常' },
  { value: 2 as const, emoji: '😐', label: '下降' },
  { value: 4 as const, emoji: '🍽️', label: '增加' },
  { value: 1 as const, emoji: '😷', label: '不吃' },
]

const SPIRIT_OPTIONS = [
  { value: 3 as const, emoji: '⚡', label: '正常' },
  { value: 2 as const, emoji: '😴', label: '偏低' },
  { value: 4 as const, emoji: '🤪', label: '亢奋' },
  { value: 1 as const, emoji: '😞', label: '萎靡' },
]

const POOP_OPTIONS = [
  { value: 3 as const, emoji: '💩', label: '正常' },
  { value: 4 as const, emoji: '🟤', label: '偏软' },
  { value: 2 as const, emoji: '💧', label: '腹泻' },
  { value: 5 as const, emoji: '🪨', label: '便秘' },
  { value: 1 as const, emoji: '🩸', label: '带血' },
]

const APPETITE_LABELS: Record<number, string> = { 1: '不吃', 2: '下降', 3: '正常', 4: '增加', 5: '增加' }
const SPIRIT_LABELS: Record<number, string> = { 1: '萎靡', 2: '偏低', 3: '正常', 4: '正常', 5: '亢奋' }
const POOP_LABELS: Record<number, string> = { 1: '带血', 2: '腹泻', 3: '正常', 4: '偏软', 5: '便秘' }
const APPETITE_EMOJIS: Record<number, string> = { 1: '😷', 2: '😐', 3: '😋', 4: '🍽️', 5: '🍽️' }
const SPIRIT_EMOJIS: Record<number, string> = { 1: '😞', 2: '😴', 3: '⚡', 4: '⚡', 5: '🤪' }
const POOP_EMOJIS: Record<number, string> = { 1: '🩸', 2: '💧', 3: '💩', 4: '🟤', 5: '🪨' }

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

export default function PetCheckin() {
  const { pets, currentPet, switchPet, isLoading: petLoading } = usePet()
  const { todayEntry, addCheckin, fetchTodayCheckin, stats, fetchStats, isLoading: checkinLoading, initUser, entries } = useCheckin()
  const userId = useAuthStore(s => s.user?.id) || ''

  const [formData, setFormData] = useState({
    appetiteLevel: 3 as 1 | 2 | 3 | 4 | 5,
    spiritLevel: 3 as 1 | 2 | 3 | 4 | 5,
    poopLevel: 3 as 1 | 2 | 3 | 4 | 5,
    exerciseLevel: 2 as 1 | 2 | 3,
    hasVomiting: false,
    weight: undefined as number | undefined,
    notes: '',
  })

  const [weightText, setWeightText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const emotionCard = useEmotionStore((s) => s.activeCard)
  const isCardVisible = useEmotionStore((s) => s.isCardVisible)
  const evaluateContext = useEmotionStore((s) => s.evaluateContext)
  const dismissCard = useEmotionStore((s) => s.dismissCard)

  const isAccepted = useSubscribeStore((s) => s.isAccepted)
  const requestAll = useSubscribeStore((s) => s.requestAll)

  const loadCheckinData = useCallback(async () => {
    setError('')
    try {
      if (userId) {
        await initUser(userId)
      }
      if (currentPet) {
        await Promise.all([
          fetchTodayCheckin(currentPet.id),
          fetchStats(currentPet.id),
        ])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败，请重试')
    }
  }, [userId, currentPet, initUser, fetchTodayCheckin, fetchStats])

  useEffect(() => {
    loadCheckinData()
  }, [loadCheckinData])

  useEffect(() => {
    if (!currentPet || !stats) return
    const consecutiveAnomalyDays = calculateConsecutiveAnomalyDays()
    if (consecutiveAnomalyDays >= 3) {
      const ctx = buildEmotionContext(currentPet.id, currentPet.name, currentPet.species as 'dog' | 'cat', {
        consecutiveAnomalyDays,
        streakDays: stats.streak,
        isDeceased: currentPet.isDeceased,
        deceasedDate: currentPet.deceasedDate,
      })
      evaluateContext(ctx)
    }
    if (stats.streak >= 7 && stats.streak % 7 === 0) {
      const ctx = buildEmotionContext(currentPet.id, currentPet.name, currentPet.species as 'dog' | 'cat', {
        streakDays: stats.streak,
        isDeceased: currentPet.isDeceased,
      })
      evaluateContext(ctx)
    }
  }, [currentPet, stats])

  const calculateConsecutiveAnomalyDays = (): number => {
    if (!entries || entries.length === 0) return 0
    const sorted = [...entries].sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
      return dateB - dateA
    })
    let count = 0
    for (const entry of sorted) {
      if (entry.hasAnomaly || entry.riskLevel === 'high' || entry.riskLevel === 'emergency') {
        count++
      } else {
        break
      }
    }
    return count
  }

  const handleSubmit = async () => {
    if (!currentPet) return
    setSubmitting(true)
    try {
      const result = await addCheckin({
        petId: currentPet.id,
        userId,
        appetiteLevel: formData.appetiteLevel,
        spiritLevel: formData.spiritLevel,
        poopLevel: formData.poopLevel,
        exerciseLevel: formData.exerciseLevel,
        weight: formData.weight,
        hasAnomaly: formData.hasVomiting || formData.poopLevel <= 2 || formData.appetiteLevel <= 2 || formData.spiritLevel <= 2,
        anomalyItems: [
          ...(formData.hasVomiting ? ['other' as const] : []),
          ...(formData.poopLevel <= 2 ? ['poop' as const] : []),
          ...(formData.appetiteLevel <= 2 ? ['appetite' as const] : []),
          ...(formData.spiritLevel <= 2 ? ['spirit' as const] : []),
        ],
        note: formData.notes || undefined,
      })

      if (result.riskLevel === 'emergency') {
        Taro.showModal({
          title: '⚠️ 紧急健康预警',
          content: result.aiFeedback || '检测到紧急健康信号，建议立即联系宠物医院',
          showCancel: false,
          confirmText: '我知道了',
          confirmColor: '#FF4D4F',
        })
      } else {
        Taro.showToast({ title: '打卡成功', icon: 'success' })
      }

      if (currentPet) {
        fetchStats(currentPet.id)
      }

      // 提示开启每日打卡提醒
      if (!isAccepted('MOOD_CHECKIN_TEMPLATE_ID_PLACEHOLDER')) {
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

  const isLoading = petLoading || checkinLoading

  const expressionContext = useMemo((): ExpressionContext | null => {
    if (!currentPet) return null
    const entry = todayEntry
    const anomalyItems = entry?.anomalyItems || []
    return {
      todayEntry: entry || null,
      hasAnomaly: entry?.hasAnomaly || false,
      anomalyCount: anomalyItems.length,
      riskLevel: entry?.riskLevel || null,
      streakDays: stats?.streak || 0,
      isBirthday: false,
      isVaccineComplete: false,
      isRecovery: false,
      isDeceased: currentPet.isDeceased || false,
    }
  }, [currentPet, todayEntry, stats])

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
      ) : todayEntry ? (
        <View className={`pet-checkin__result pet-checkin__result--${todayEntry.riskLevel}`}>
          <Text className='pet-checkin__result-title'>
            {RESULT_ICONS[todayEntry.riskLevel] || '✅'} 今日已打卡
          </Text>
          <Text className='pet-checkin__result-feedback'>{todayEntry.aiFeedback}</Text>
          <View className='pet-checkin__result-detail'>
            <Text className='pet-checkin__result-tag'>
              食欲：{APPETITE_EMOJIS[todayEntry.appetiteLevel]} {APPETITE_LABELS[todayEntry.appetiteLevel]}
            </Text>
            <Text className='pet-checkin__result-tag'>
              精力：{SPIRIT_EMOJIS[todayEntry.spiritLevel]} {SPIRIT_LABELS[todayEntry.spiritLevel]}
            </Text>
            <Text className='pet-checkin__result-tag'>
              便便：{POOP_EMOJIS[todayEntry.poopLevel]} {POOP_LABELS[todayEntry.poopLevel]}
            </Text>
            <Text className='pet-checkin__result-tag'>
              呕吐：{todayEntry.anomalyItems.includes('other') ? '🤮 有' : '✅ 无'}
            </Text>
            {todayEntry.weight && (
              <Text className='pet-checkin__result-tag'>体重：{todayEntry.weight}kg</Text>
            )}
          </View>
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
            <Text className='pet-checkin__section-title'>🤮 呕吐</Text>
            <View className='pet-checkin__toggle'>
              <View
                className={`pet-checkin__toggle-btn${!formData.hasVomiting ? ' pet-checkin__toggle-btn--active' : ''}`}
                onClick={() => setFormData((prev) => ({ ...prev, hasVomiting: false }))}
              >
                <Text className='pet-checkin__toggle-emoji'>✅</Text>
                <Text className='pet-checkin__toggle-label'>无</Text>
              </View>
              <View
                className={`pet-checkin__toggle-btn${formData.hasVomiting ? ' pet-checkin__toggle-btn--active-danger' : ''}`}
                onClick={() => setFormData((prev) => ({ ...prev, hasVomiting: true }))}
              >
                <Text className='pet-checkin__toggle-emoji'>🤮</Text>
                <Text className='pet-checkin__toggle-label'>有</Text>
              </View>
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

      {stats && (
        <View className='pet-checkin__stats'>
          <View className='pet-checkin__stats-item'>
            <Text className='pet-checkin__stats-value'>{stats.streak}</Text>
            <Text className='pet-checkin__stats-label'>连续打卡（天）</Text>
          </View>
          <View className='pet-checkin__stats-divider' />
          <View className='pet-checkin__stats-item'>
            <Text className='pet-checkin__stats-value'>{stats.monthlyCount}</Text>
            <Text className='pet-checkin__stats-label'>本月打卡（次）</Text>
          </View>
          <View className='pet-checkin__stats-divider' />
          <View className='pet-checkin__stats-item'>
            <Text className='pet-checkin__stats-value'>{stats.totalCheckins}</Text>
            <Text className='pet-checkin__stats-label'>累计打卡</Text>
          </View>
        </View>
      )}

      {isCardVisible && emotionCard && currentPet && (
        <EmotionResponseCard
          match={emotionCard}
          petName={currentPet.name}
          onDismiss={dismissCard}
        />
      )}

      <View className='pet-checkin__disclaimer'>
        <Text className='pet-checkin__disclaimer-text'>⚠️ 健康数据仅供参考，不替代兽医诊断。如发现异常请及时就医。</Text>
      </View>

      <FloatingNav />
    </View>
  )
}
