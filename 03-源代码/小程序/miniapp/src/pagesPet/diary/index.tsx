import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useShareAppMessage, useShareTimeline, useDidShow } from '@tarojs/taro'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useThemeClass } from '../../hooks/useThemeClass'
import PetSwitcher from '../../components/PetSwitcher'
import { PageLoading, PageError, PetAvatar } from '../../components'
import { usePetStore } from '../../stores/petStore'
import { useAuthStore } from '../../stores/authStore'
import { useCheckinStore } from '../../stores/checkinStore'
import { generateDiaryFromEntries, type DiaryRecord } from '../../services/diaryService'
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
import { useAnalytics, usePageView } from '../../hooks/useAnalytics'
import './index.scss'

const TONE_COLORS: Record<string, string> = {
  happy: '#52C41A',
  neutral: '#8C8C8C',
  tired: '#FAAD14',
  sick: '#FF4D4F',
  proud: '#FF8C42',
}

const TONE_LABELS: Record<string, string> = {
  happy: '开心',
  neutral: '平静',
  tired: '疲惫',
  sick: '不舒服',
  proud: '骄傲',
}

function formatDateDisplay(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length >= 3) {
    return `${parts[1]}月${parts[2]}日`
  }
  return dateStr
}

function formatFullDate(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length >= 3) {
    const year = parts[0]
    const month = parts[1]
    const day = parts[2]
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const d = new Date(`${year}-${month}-${day}`)
    const weekDay = weekDays[d.getDay()]
    return `${month}月${day}日 ${weekDay}`
  }
  return dateStr
}

export default function PetDiaryPage() {
  const themeClass = useThemeClass()
  const { pets, currentPet, fetchPets, switchPet } = usePetStore()
  const user = useAuthStore(s => s.user)
  const { checkins, fetchCheckins, isLoading: checkinLoading, initUser } = useCheckinStore()

  const [diaryRecords, setDiaryRecords] = useState<DiaryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { trackPageView, trackEvent } = useAnalytics()

  useShareAppMessage(() => ({
    title: '星寰海 - 宠物日记',
    path: '/pagesPet/diary/index',
  }))
  useShareTimeline(() => ({
    title: '星寰海 - 宠物日记',
  }))

  usePageView('diary')

  useDidShow(() => {
    if (user?.id) {
      fetchPets(user.id)
    }
  })

  const loadDiaryData = useCallback(async () => {
    setError('')
    setIsLoading(true)
    try {
      if (!currentPet?.id || !user?.id) {
        setIsLoading(false)
        return
      }
      await initUser(user.id)
      await fetchCheckins(currentPet.id)
      const records = generateDiaryFromEntries(checkins as any, currentPet.birthDate || null)
      setDiaryRecords(records)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [currentPet?.id, user?.id, checkins, initUser, fetchCheckins])

  useEffect(() => {
    if (currentPet?.id && user?.id) {
      loadDiaryData()
    }
  }, [loadDiaryData])

  const handlePetSwitch = useCallback((petId: string) => {
    switchPet(petId)
  }, [switchPet])

  const handleShareEntry = useCallback((record: DiaryRecord) => {
    trackEvent('share_diary', { date: record.date, tone: record.diary.tone })
    Taro.showShareMenu({ withShareTicket: true })
  }, [])

  const expressionContext = useMemo(() => {
    if (!currentPet) return null
    const lastEntry = diaryRecords.length > 0 ? diaryRecords[0].entry : null
    return {
      todayEntry: lastEntry,
      hasAnomaly: lastEntry?.hasAnomaly || false,
      anomalyCount: lastEntry?.anomalyItems?.length || 0,
      riskLevel: lastEntry?.riskLevel || null,
      streakDays: diaryRecords.length,
      isBirthday: false,
      isVaccineComplete: false,
      isRecovery: false,
      isDeceased: currentPet.isDeceased || false,
    }
  }, [currentPet, diaryRecords])

  const disclaimerText = useMemo(() => {
    return new MedicalDisclaimer().getCheckinDisclaimer(false)
  }, [])

  if (isLoading && pets.length === 0) {
    return (
      <View className='pet-diary'>
        <PageLoading />
      </View>
    )
  }

  if (error && pets.length === 0) {
    return (
      <View className='pet-diary'>
        <PageError message={error} onRetry={loadDiaryData} />
      </View>
    )
  }

  return (
    <View className={`pet-diary ${themeClass}`}>
      <PetSwitcher
        pets={pets}
        currentPetId={currentPet?.id || null}
        onSwitch={handlePetSwitch}
      />

      {currentPet && expressionContext && (
        <View className='pet-diary__avatar'>
          <PetAvatar
            species={currentPet.species as 'dog' | 'cat'}
            petName={currentPet.name}
            expressionContext={expressionContext}
            size={80}
            showLabel
          />
        </View>
      )}

      <View className='pet-diary__header'>
        <Text className='pet-diary__title'>宠物日记</Text>
        <Text className='pet-diary__subtitle'>
          {currentPet?.name || ''}的成长记录
        </Text>
      </View>

      <ScrollView scrollY className='pet-diary__content' enhanced showScrollbar={false}>
        {isLoading ? (
          <View className='pet-diary__loading'>
            <Text className='pet-diary__loading-text'>加载中...</Text>
          </View>
        ) : error ? (
          <View className='pet-diary__error'>
            <Text className='pet-diary__error-text'>{error}</Text>
            <View className='pet-diary__retry-btn' onClick={loadDiaryData}>
              <Text className='pet-diary__retry-text'>重试</Text>
            </View>
          </View>
        ) : diaryRecords.length === 0 ? (
          <View className='pet-diary__empty'>
            <Text className='pet-diary__empty-icon'>📔</Text>
            <Text className='pet-diary__empty-text'>还没有日记哦~</Text>
            <Text className='pet-diary__empty-hint'>每天打卡后会自动生成一篇日记</Text>
          </View>
        ) : (
          <View className='pet-diary__timeline'>
            {diaryRecords.map((record, index) => (
              <View key={record.entry.id} className='pet-diary__entry'>
                <View className='pet-diary__entry-left'>
                  <View
                    className='pet-diary__dot'
                    style={{ backgroundColor: TONE_COLORS[record.diary.tone] || '#8C8C8C' }}
                  />
                  {index < diaryRecords.length - 1 && (
                    <View className='pet-diary__line' />
                  )}
                </View>
                <View className='pet-diary__entry-right'>
                  <View className='pet-diary__entry-header'>
                    <Text className='pet-diary__entry-date'>
                      {formatFullDate(record.date)}
                    </Text>
                    <View
                      className='pet-diary__tone-badge'
                      style={{ backgroundColor: TONE_COLORS[record.diary.tone] || '#8C8C8C' }}
                    >
                      <Text className='pet-diary__tone-text'>
                        {TONE_LABELS[record.diary.tone] || record.diary.tone}
                      </Text>
                    </View>
                  </View>
                  <View className='pet-diary__entry-body'>
                    <Text className='pet-diary__entry-emoji'>{record.diary.emoji}</Text>
                    <Text className='pet-diary__entry-text'>"{record.diary.text}"</Text>
                  </View>
                  {record.entry.note && (
                    <View className='pet-diary__entry-note'>
                      <Text className='pet-diary__note-label'>📝 备注：</Text>
                      <Text className='pet-diary__note-text'>{record.entry.note}</Text>
                    </View>
                  )}
                  <View
                    className='pet-diary__entry-share'
                    onClick={() => handleShareEntry(record)}
                  >
                    <Text className='pet-diary__share-text'>📤 分享这篇日记</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View className='pet-diary__disclaimer'>
        <Text className='pet-diary__disclaimer-text'>{disclaimerText}</Text>
      </View>

    </View>
  )
}