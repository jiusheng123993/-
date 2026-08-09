/**
 * 宠物日记页面
 * 日记头部卡 + 心情筛选 + 时间轴日记流 + 写日记入口
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useShareAppMessage, useShareTimeline, useDidShow } from '@tarojs/taro'
import { useState, useEffect, useCallback, useMemo } from 'react'
import PetSwitcher from '../../components/PetSwitcher'
import { PageLoading, PageError } from '../../components'
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

const TONE_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'happy', label: '开心' },
  { key: 'neutral', label: '平静' },
  { key: 'tired', label: '疲惫' },
  { key: 'sick', label: '不舒服' },
  { key: 'proud', label: '骄傲' },
]

const PET_EMOJI: Record<string, string> = { cat: '🐱', dog: '🐕' }

function formatFullDate(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length >= 3) {
    const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`)
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${parts[1]}月${parts[2]}日 · ${weekDays[d.getDay()]}`
  }
  return dateStr
}

/** 计算宠物年龄：X岁X个月 */
function calcAge(birthDate: string | null | undefined): string {
  if (!birthDate) return ''
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return ''
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (months < 0) months = 0
  const years = Math.floor(months / 12)
  const restMonths = months % 12
  if (years > 0) return `${years}岁${restMonths}个月`
  if (restMonths > 0) return `${restMonths}个月`
  return '刚出生'
}

/** 相伴天数 */
function daysTogether(birthDate: string | null | undefined): number {
  if (!birthDate) return 0
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return 0
  return Math.max(1, Math.floor((Date.now() - birth.getTime()) / 86400000))
}

export default function PetDiaryPage() {
  const { pets, currentPet, fetchPets, switchPet } = usePetStore()
  const user = useAuthStore(s => s.user)
  const { checkins, fetchCheckins, isLoading: checkinLoading, initUser } = useCheckinStore()

  const [diaryRecords, setDiaryRecords] = useState<DiaryRecord[]>([])
  const [toneFilter, setToneFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { trackPageView, trackEvent } = useAnalytics()

  useShareAppMessage(() => ({
    title: '星河宠记 - 宠物日记',
    path: '/pagesPet/diary/index',
  }))
  useShareTimeline(() => ({
    title: '星河宠记 - 宠物日记',
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

  /** 心情筛选 */
  const filteredRecords = useMemo(() => {
    if (toneFilter === 'all') return diaryRecords
    return diaryRecords.filter(r => r.diary.tone === toneFilter)
  }, [diaryRecords, toneFilter])

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

  const petEmoji = PET_EMOJI[currentPet?.species || ''] || '🐾'
  const ageText = currentPet ? calcAge(currentPet.birthDate) : ''
  const breedText = currentPet?.breed || (currentPet?.species === 'cat' ? '猫咪' : '狗狗')

  return (
    <View className='pet-diary'>
      {/* 全屏动态背景层 */}
      <View className='xhh-bg-layer'>
        <View className='xhh-blob xhh-blob-a' />
        <View className='xhh-blob xhh-blob-b' />
        <View className='xhh-blob xhh-blob-c' />
        <View className='xhh-blob xhh-blob-d' />
        <View className='xhh-bg-glow' />
      </View>

      <PetSwitcher
        pets={pets}
        currentPetId={currentPet?.id || null}
        onSwitch={handlePetSwitch}
      />

      <View className='pet-diary__content'>
        {/* ===== 日记头部卡 ===== */}
        {currentPet && (
          <View className='pdiary-head'>
            <View className='pdiary-head__row'>
              <View className='pdiary-avatar'>
                <Text className='pdiary-avatar__emoji'>{petEmoji}</Text>
              </View>
              <View className='pdiary-head__info'>
                <View className='pdiary-head__name-row'>
                  <Text className='pdiary-head__name'>{currentPet.name}</Text>
                  <Text className='pdiary-head__meta'>
                    {breedText}{ageText ? ` · ${ageText}` : ''}
                  </Text>
                </View>
                <Text className='pdiary-head__slogan'>毛孩子的每一刻，都值得被记下</Text>
                <View className='pdiary-head__stats'>
                  <View className='pdiary-stat'>
                    <Text className='pdiary-stat__icon'>📖</Text>
                    <Text className='pdiary-stat__text'>日记 <Text className='pdiary-stat__num'>{diaryRecords.length}</Text> 篇</Text>
                  </View>
                  <View className='pdiary-stat'>
                    <Text className='pdiary-stat__icon'>✅</Text>
                    <Text className='pdiary-stat__text'>打卡 <Text className='pdiary-stat__num'>{checkins.length}</Text> 次</Text>
                  </View>
                  <View className='pdiary-stat'>
                    <Text className='pdiary-stat__icon'>💕</Text>
                    <Text className='pdiary-stat__text'>相伴 <Text className='pdiary-stat__num'>{daysTogether(currentPet.birthDate)}</Text> 天</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ===== 心情标签筛选行 ===== */}
        <ScrollView scrollX className='pdiary-filters' showScrollbar={false}>
          <View className='pdiary-filters__inner'>
            {TONE_FILTERS.map(f => (
              <View
                key={f.key}
                className={`pdiary-filter${toneFilter === f.key ? ' pdiary-filter--active' : ''}`}
                onClick={() => setToneFilter(f.key)}
              >
                <Text className='pdiary-filter__text'>{f.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* ===== 时间轴日记流 ===== */}
        <ScrollView scrollY className='pdiary-scroll' enhanced showScrollbar={false}>
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
          ) : filteredRecords.length === 0 ? (
            <View className='pet-diary__empty'>
              <Text className='pet-diary__empty-icon'>📔</Text>
              <Text className='pet-diary__empty-text'>
                {diaryRecords.length === 0 ? '还没有日记哦~' : '该心情下暂无日记'}
              </Text>
              <Text className='pet-diary__empty-hint'>每天打卡后会自动生成一篇日记</Text>
            </View>
          ) : (
            <View className='pdiary-timeline'>
              <View className='pdiary-section-head'>
                <Text className='pdiary-section-title'>时光轴</Text>
                <Text className='pdiary-section-count'>共 {filteredRecords.length} 篇</Text>
              </View>
              {filteredRecords.map((record, index) => (
                <View key={record.entry.id} className='pdiary-item'>
                  <View className='pdiary-rail'>
                    <View
                      className='pdiary-dot'
                      style={{ backgroundColor: TONE_COLORS[record.diary.tone] || '#8C8C8C' }}
                    />
                    {index < filteredRecords.length - 1 && <View className='pdiary-rail__line' />}
                  </View>
                  <View className='pdiary-card'>
                    <View className='pdiary-card__top'>
                      <Text className='pdiary-date'>{formatFullDate(record.date)}</Text>
                      <View
                        className='pdiary-mood'
                        style={{ backgroundColor: TONE_COLORS[record.diary.tone] || '#8C8C8C' }}
                      >
                        <Text className='pdiary-mood__text'>{record.diary.emoji} {TONE_LABELS[record.diary.tone] || record.diary.tone}</Text>
                      </View>
                    </View>
                    <View className='pdiary-photo'>
                      <Text className='pdiary-photo__emoji'>{record.diary.emoji}</Text>
                      <Text className='pdiary-photo__caption'>来自 {record.date} 的日常</Text>
                    </View>
                    <Text className='pdiary-card__text'>"{record.diary.text}"</Text>
                    {record.entry.note && (
                      <View className='pdiary-note'>
                        <Text className='pdiary-note__label'>📝 备注：</Text>
                        <Text className='pdiary-note__text'>{record.entry.note}</Text>
                      </View>
                    )}
                    <View className='pdiary-card__actions'>
                      <View
                        className='pdiary-card__share'
                        onClick={() => handleShareEntry(record)}
                      >
                        <Text className='pdiary-card__share-text'>📤 分享这篇日记</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      <View className='pet-diary__disclaimer'>
        <Text className='pet-diary__disclaimer-text'>{disclaimerText}</Text>
      </View>

      {/* 写日记浮动入口 */}
      <View
        className='pdiary-fab'
        onClick={() => {
          trackEvent('click_write_diary')
          Taro.navigateTo({ url: '/pagesPet/checkin/index' })
        }}
      >
        <Text className='pdiary-fab__icon'>✏️</Text>
      </View>
    </View>
  )
}
