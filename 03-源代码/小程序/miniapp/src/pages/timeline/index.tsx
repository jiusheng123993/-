/**
 * 时光页面
 * 宠物时光线展示、回忆记录、年度回顾、视频回忆录入口
 * 页面结构：固定顶部（头部+功能卡片）+ 可滚动时间线区域
 */
import { View, Text, ScrollView, Image, Canvas, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useThemeClass } from '../../hooks/useThemeClass'
import { usePetStore } from '../../stores/petStore'
import { useAuthStore } from '../../stores/authStore'
import { getCheckins } from '../../services/checkinService'
import { timelineService } from '../../services/timelineService'
import { CONFIG } from '../../config'
import { storage } from '../../utils/storage'
import { chooseImageWithPrivacy } from '../../utils/privacy'
import {
  generateYearlyReview,
  renderYearlyReview,
  saveYearlyReview,
} from '../../services/yearlyReviewService'
import type { YearlyReviewData } from '../../services/yearlyReviewService'
import type { PetProfile } from '../../services/petService'
import type { PetHealthEntry } from '../../memory-body/types/memoryBodyTypes'
import './index.scss'

interface TimelineEvent {
  id: string
  date: string
  title: string
  type: 'milestone' | 'memory' | 'ghost' | 'flashback'
  emoji: string
  photos: string[]
  description: string
  flashbackYear?: number
}

interface FlashbackMemory {
  title: string
  emoji: string
  description: string
  yearsAgo: number
}

const GHOST_EVENTS: TimelineEvent[] = [
  {
    id: 'ghost-1',
    date: '即将上线',
    title: 'AI年度记忆卡片',
    type: 'ghost',
    emoji: '🤖',
    photos: [],
    description: 'AI正在整理你的年度回忆，敬请期待...',
  },
]

function entryDateStr(entry: PetHealthEntry): string {
  if (entry.createdAt instanceof Date) {
    return entry.createdAt.toISOString().slice(0, 10)
  }
  return String(entry.createdAt).slice(0, 10)
}

function getMonthDay(dateStr: string): string {
  return dateStr.slice(5, 10)
}

function findFlashbackMemory(
  pet: PetProfile | null,
  entries: PetHealthEntry[],
): FlashbackMemory | null {
  if (!pet) return null

  const today = new Date()
  const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const currentYear = today.getFullYear()

  const birthday = pet.birthDate
  if (birthday) {
    const birthMD = getMonthDay(birthday)
    if (birthMD === todayMD) {
      const years = currentYear - new Date(birthday).getFullYear()
      if (years >= 1) {
        return {
          title: `${pet.name}的生日`,
          emoji: '🎂',
          description: `${years}年前的今天，${pet.name}来到了这个世界`,
          yearsAgo: years,
        }
      }
    }
  }

  const createdAt = pet.createdAt || ''
  if (createdAt && getMonthDay(createdAt) === todayMD) {
    const adoptYear = new Date(createdAt).getFullYear()
    const yearsAgo = currentYear - adoptYear
    if (yearsAgo >= 1 && (!birthday || getMonthDay(birthday) !== todayMD)) {
      return {
        title: '加入家庭',
        emoji: '🏠',
        description: `${yearsAgo}年前的今天，${pet.name}成为了家庭的一员`,
        yearsAgo,
      }
    }
  }

  if (entries.length > 0) {
    const sameDayEntries = entries.filter(e => {
      const d = entryDateStr(e)
      const md = getMonthDay(d)
      const year = parseInt(d.slice(0, 4))
      return md === todayMD && year < currentYear
    })

    if (sameDayEntries.length > 0) {
      sameDayEntries.sort((a, b) => entryDateStr(b).localeCompare(entryDateStr(a)))
      const bestEntry = sameDayEntries[0]
      const entryYear = parseInt(entryDateStr(bestEntry).slice(0, 4))
      const yearsAgo = currentYear - entryYear

      if (bestEntry.riskLevel === 'emergency') {
        return {
          title: '渡过难关',
          emoji: '💪',
          description: `${yearsAgo}年前的今天，${pet.name}经历了一次健康预警。现在它很健康，感谢你的悉心照顾。`,
          yearsAgo,
        }
      }

      if (bestEntry.note) {
        return {
          title: '往日时光',
          emoji: '💭',
          description: `${yearsAgo}年前的今天，你记录了：${bestEntry.note.length > 30 ? bestEntry.note.slice(0, 30) + '...' : bestEntry.note}`,
          yearsAgo,
        }
      }

      if (bestEntry.weight !== undefined && bestEntry.weight !== null) {
        return {
          title: '体重记录',
          emoji: '⚖️',
          description: `${yearsAgo}年前的今天，${pet.name}的体重是${bestEntry.weight}kg`,
          yearsAgo,
        }
      }
    }
  }

  return null
}

function generateTimelineFromData(pet: PetProfile | null, entries: PetHealthEntry[]): TimelineEvent[] {
  const events: TimelineEvent[] = []

  if (pet) {
    const birthday = pet.birthDate
    if (birthday) {
      const birthDate = new Date(birthday)
      const ageYears = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      events.push({
        id: 'milestone-birth',
        date: birthday,
        title: `${pet.name}的生日`,
        type: 'milestone',
        emoji: '🎂',
        photos: [],
        description: `来到这个世界的第一天${ageYears > 0 ? `，现在已经${ageYears}岁了` : ''}`,
      })
    }

    const createdAt = pet.createdAt || ''
    if (createdAt && (!birthday || createdAt.slice(0, 10) !== pet.birthDate.slice(0, 10))) {
      events.push({
        id: 'milestone-adopt',
        date: createdAt,
        title: '加入家庭的第1天',
        type: 'milestone',
        emoji: '🏠',
        photos: [],
        description: `欢迎${pet.name}成为家庭的一员`,
      })
    }
  }

  const sortedEntries = [...entries].sort((a, b) => {
    const aDate = entryDateStr(a)
    const bDate = entryDateStr(b)
    return bDate.localeCompare(aDate)
  })

  const recentEntries = sortedEntries.slice(0, 6)
  for (const entry of recentEntries) {
    const dateStr = entryDateStr(entry)
    const note = entry.note || ''

    if (entry.riskLevel === 'emergency') {
      events.push({
        id: `memory-${entry.id}`,
        date: dateStr,
        title: '健康预警',
        type: 'memory',
        emoji: '🚨',
        photos: [],
        description: note || '检测到紧急健康信号，请关注宠物状态',
      })
    } else if (entry.weight !== undefined && entry.weight !== null) {
      events.push({
        id: `memory-${entry.id}`,
        date: dateStr,
        title: `体重记录：${entry.weight}kg`,
        type: 'memory',
        emoji: '⚖️',
        photos: [],
        description: note || '定期体重监测',
      })
    } else if (note) {
      events.push({
        id: `memory-${entry.id}`,
        date: dateStr,
        title: '日常记录',
        type: 'memory',
        emoji: '📝',
        photos: [],
        description: note,
      })
    }
  }

  return events
}

export default function TimelinePage() {
  const [showBanner, setShowBanner] = useState(true)
  const [dynamicEvents, setDynamicEvents] = useState<TimelineEvent[]>([])
  const [flashback, setFlashback] = useState<FlashbackMemory | null>(null)
  const [flashbackAdded, setFlashbackAdded] = useState(false)
  const [yearlyReview, setYearlyReview] = useState<YearlyReviewData | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewImageUrl, setReviewImageUrl] = useState('')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const reviewCanvasRef = useRef(false)
  const themeClass = useThemeClass()
  const currentPet = usePetStore((s) => s.currentPet)
  const userId = usePetStore((s) => s.userId)

  // 新增回忆弹窗状态
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false)
  const [memoryText, setMemoryText] = useState('')
  const [memoryPhotoPath, setMemoryPhotoPath] = useState<string | null>(null)
  const [isMemorySubmitting, setIsMemorySubmitting] = useState(false)

  useEffect(() => {
    async function loadTimelineData() {
      try {
        if (currentPet?.id && userId) {
          const entries = await getCheckins(currentPet.id, userId)
          const generated = generateTimelineFromData(currentPet, entries)
          setDynamicEvents(generated)

          const memory = findFlashbackMemory(currentPet, entries)
          setFlashback(memory)
          setFlashbackAdded(false)
        } else if (currentPet) {
          const generated = generateTimelineFromData(currentPet, [])
          setDynamicEvents(generated)
          const memory = findFlashbackMemory(currentPet, [])
          setFlashback(memory)
          setFlashbackAdded(false)
        }
      } catch {
        if (currentPet) {
          const generated = generateTimelineFromData(currentPet, [])
          setDynamicEvents(generated)
          const memory = findFlashbackMemory(currentPet, [])
          setFlashback(memory)
          setFlashbackAdded(false)
        }
      }
    }
    loadTimelineData()
  }, [currentPet?.id, userId])

  const timelineEvents = useMemo(() => {
    const allEvents: TimelineEvent[] = []

    if (flashback && flashbackAdded) {
      allEvents.push({
        id: 'flashback-auto',
        date: `${flashback.yearsAgo}年前`,
        title: flashback.title,
        type: 'flashback',
        emoji: flashback.emoji,
        photos: [],
        description: flashback.description,
        flashbackYear: flashback.yearsAgo,
      })
    }

    if (dynamicEvents.length > 0) {
      const sorted = [...dynamicEvents].sort((a, b) => {
        if (a.type === 'ghost') return 1
        if (b.type === 'ghost') return -1
        return b.date.localeCompare(a.date)
      })
      allEvents.push(...sorted)
    }

    allEvents.push(...GHOST_EVENTS)
    return allEvents
  }, [dynamicEvents, flashback, flashbackAdded])

  const handleAddMemory = () => {
    if (!currentPet) {
      Taro.showToast({ title: '请先选择宠物', icon: 'none' })
      return
    }
    setMemoryText('')
    setMemoryPhotoPath(null)
    setShowAddMemoryModal(true)
  }

  /** 选择回忆照片 */
  const handleAddMemoryPhoto = async () => {
    try {
      const res = await chooseImageWithPrivacy({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      if (!res.tempFilePaths.length) return
      setMemoryPhotoPath(res.tempFilePaths[0])
    } catch (err) {
      if ((err as { errMsg?: string }).errMsg?.includes('cancel')) return
      Taro.showToast({ title: '选择照片失败', icon: 'none' })
    }
  }

  /** 提交回忆 */
  const handleAddMemorySubmit = async () => {
    const text = memoryText.trim()
    if (!text) {
      Taro.showToast({ title: '请写一段回忆描述', icon: 'none' })
      return
    }
    if (!currentPet || !userId) return

    setIsMemorySubmitting(true)
    try {
      let photoUrl: string | null = null
      if (memoryPhotoPath) {
        const token = storage.getToken()
        const uploadRes = await Taro.uploadFile({
          url: `${CONFIG.API_BASE_URL}/api/timeline/photo/upload`,
          filePath: memoryPhotoPath,
          name: 'photo',
          header: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const uploadData = JSON.parse(uploadRes.data) as { success: boolean; data?: { url: string } }
        if (uploadData.success) {
          photoUrl = uploadData.data?.url || null
        }
      }

      await timelineService.addMoment({
        userId,
        petId: currentPet.id,
        type: 'memory',
        content: {
          petName: currentPet.name,
          petEmoji: currentPet.species === 'cat' ? '🐱' : currentPet.species === 'dog' ? '🐕' : '🐾',
          description: text,
        },
        photos: photoUrl ? [photoUrl] : [],
      })

      setShowAddMemoryModal(false)
      Taro.showToast({ title: '回忆已保存 ✦', icon: 'success' })

      const entries = await getCheckins(currentPet.id, userId)
      const generated = generateTimelineFromData(currentPet, entries)
      setDynamicEvents(generated)
    } catch {
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    } finally {
      setIsMemorySubmitting(false)
    }
  }

  const handleEventClick = (event: TimelineEvent) => {
    if (event.type === 'ghost') {
      Taro.showToast({ title: '即将上线，敬请期待', icon: 'none' })
      return
    }
    if (event.type === 'flashback') {
      Taro.showToast({ title: `回顾${event.flashbackYear || ''}年前的记忆`, icon: 'none' })
      return
    }
    Taro.showToast({ title: `查看：${event.title}`, icon: 'none' })
  }

  const handleFlashbackAction = () => {
    if (flashback && !flashbackAdded) {
      setFlashbackAdded(true)
      setShowBanner(false)
      Taro.showToast({ title: `已添加到时光线`, icon: 'success' })
    }
  }

  const handleYearlyReview = useCallback(async () => {
    if (reviewLoading || !currentPet || !userId) return
    setReviewLoading(true)
    try {
      const currentYear = new Date().getFullYear()
      const reviewData = await generateYearlyReview(currentPet, userId, currentYear)
      setYearlyReview(reviewData)

      reviewCanvasRef.current = true
      await new Promise(resolve => setTimeout(resolve, 300))

      const result = await renderYearlyReview(reviewData, {
        canvasId: 'yearly-review-canvas',
        pixelRatio: 2,
      })
      setReviewImageUrl(result.tempFilePath)
      setShowReviewModal(true)
    } catch (err: unknown) {
      const error = err as { message?: string }
      Taro.showToast({ title: error.message || '生成失败，请重试', icon: 'none' })
    } finally {
      setReviewLoading(false)
    }
  }, [reviewLoading, currentPet, userId])

  const handleSaveReview = useCallback(async () => {
    if (!reviewImageUrl) return
    try {
      await saveYearlyReview(reviewImageUrl)
    } catch (err: unknown) {
      const error = err as { message?: string }
      Taro.showToast({ title: error.message || '保存失败', icon: 'none' })
    }
  }, [reviewImageUrl])

  const handleCloseReview = useCallback(() => {
    setShowReviewModal(false)
    setReviewImageUrl('')
    reviewCanvasRef.current = false
  }, [])

  /** 跳转到日常回忆录页面 */
  const handleDailyMemoir = () => {
    if (!currentPet) {
      Taro.showToast({ title: '请先选择宠物', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: `/pagesPet/memoir-daily/index?petId=${currentPet.id}` })
  }

  /** 跳转到纪念Vlog页面 */
  const handleMemorialVlog = () => {
    if (!currentPet) {
      Taro.showToast({ title: '请先选择宠物', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: `/pagesPet/memoir-vlog/index?petId=${currentPet.id}` })
  }

  const petName = currentPet?.name || '你的宠物'

  return (
    <View className={`timeline-page ${themeClass}`}>
      {/* ===== 固定顶部：头部 + 功能卡片 ===== */}
      <View className='timeline-fixed-top'>
        <View className='timeline-header'>
          <Text className='timeline-title'>{petName}的时光</Text>
          <Text className='timeline-title-star'>✦</Text>
          <View className='timeline-add-btn' onClick={handleAddMemory}>
            <Text className='timeline-add-icon'>+</Text>
            <Text className='timeline-add-text'>新增回忆</Text>
          </View>
        </View>

        <View className='timeline-function-row'>
          {/* 年度回忆卡片 */}
          <View className={`timeline-func-card ${reviewLoading ? 'timeline-func-card--loading' : ''}`} onClick={handleYearlyReview}>
            <View className='timeline-func-card-icon timeline-func-card-icon--yearly'>
              <Text className='timeline-func-card-emoji'>📖</Text>
            </View>
            <View className='timeline-func-card-text'>
              <Text className='timeline-func-card-title'>年度回忆</Text>
              <Text className='timeline-func-card-desc'>一键生成年度图集</Text>
            </View>
            <View className='timeline-func-card-arrow'>
              <Text>{reviewLoading ? '⏳' : '→'}</Text>
            </View>
          </View>

          {/* 日常回忆录卡片 */}
          <View className='timeline-func-card' onClick={handleDailyMemoir}>
            <View className='timeline-func-card-icon timeline-func-card-icon--daily'>
              <Text className='timeline-func-card-emoji'>🎬</Text>
            </View>
            <View className='timeline-func-card-text'>
              <Text className='timeline-func-card-title'>日常回忆录</Text>
              <Text className='timeline-func-card-desc'>静图动效·温暖短片</Text>
            </View>
            <View className='timeline-func-card-arrow'>
              <Text>→</Text>
            </View>
          </View>

          {/* 纪念Vlog卡片 */}
          <View className='timeline-func-card' onClick={handleMemorialVlog}>
            <View className='timeline-func-card-icon timeline-func-card-icon--memorial'>
              <Text className='timeline-func-card-emoji'>💎</Text>
            </View>
            <View className='timeline-func-card-text'>
              <Text className='timeline-func-card-title'>纪念Vlog</Text>
              <Text className='timeline-func-card-desc'>AI叙事·珍藏记忆</Text>
            </View>
            <View className='timeline-func-card-arrow'>
              <Text>→</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ===== 可滚动区域：横幅 + 时间线 ===== */}
      <ScrollView className='timeline-scroll' scrollY>
        {showBanner && (
          <View className='timeline-banner'>
            <View className={`timeline-banner-inner ${flashback ? 'timeline-banner-inner--flashback' : ''}`}>
              <View className='timeline-banner-glow' />
              <View className='timeline-banner-content'>
                <Text className='timeline-banner-icon'>
                  {flashback ? flashback.emoji : '💫'}
                </Text>
                <View className='timeline-banner-text-wrap'>
                  <Text className='timeline-banner-title'>
                    {flashback ? flashback.title : '旧时光提醒'}
                  </Text>
                  <Text className='timeline-banner-desc'>
                    {flashback
                      ? flashback.description
                      : `坚持打卡，记录${petName}的每一天`
                    }
                  </Text>
                </View>
                {flashback && (
                  <View className='timeline-banner-action' onClick={handleFlashbackAction}>
                    <Text className='timeline-banner-action-text'>添加到时光线</Text>
                  </View>
                )}
              </View>
              <View className='timeline-banner-close' onClick={() => setShowBanner(false)}>
                <Text>✕</Text>
              </View>
            </View>
          </View>
        )}

        <View className='timeline-list'>
          {timelineEvents.map((event, index) => (
            <View key={event.id} className='timeline-item' onClick={() => handleEventClick(event)}>
              <View className='timeline-line-col'>
                <View className={`timeline-dot timeline-dot--${event.type}`}>
                  <Text className='timeline-dot-emoji'>{event.emoji}</Text>
                </View>
                {index < timelineEvents.length - 1 && (
                  <View className='timeline-line' />
                )}
              </View>
              <View className={`timeline-card timeline-card--${event.type}`}>
                <View className='timeline-card-date'>
                  <Text className='timeline-date-text'>{event.date}</Text>
                  {event.type === 'milestone' && (
                    <View className='timeline-milestone-badge'>
                      <Text className='timeline-milestone-badge-text'>里程碑</Text>
                    </View>
                  )}
                  {event.type === 'flashback' && (
                    <View className='timeline-flashback-badge'>
                      <Text className='timeline-flashback-badge-text'>旧时光</Text>
                    </View>
                  )}
                  {event.type === 'ghost' && (
                    <View className='timeline-ghost-badge'>
                      <Text className='timeline-ghost-badge-text'>即将上线</Text>
                    </View>
                  )}
                </View>
                <Text className='timeline-card-title'>{event.title}</Text>
                <Text className='timeline-card-desc'>{event.description}</Text>
                {event.photos.length > 0 ? (
                  <View className='timeline-photo-grid'>
                    {event.photos.map((photo, pi) => (
                      <View key={pi} className='timeline-photo-placeholder'>
                        <Text className='timeline-photo-icon'>📷</Text>
                      </View>
                    ))}
                  </View>
                ) : event.type !== 'ghost' ? (
                  <View className='timeline-photo-empty'>
                    <View className='timeline-photo-dashed'>
                      <Text className='timeline-photo-add-icon'>+</Text>
                      <Text className='timeline-photo-add-text'>添加照片</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View className='timeline-bottom-safe' />
      </ScrollView>

      {/* ===== 年度回忆弹窗 ===== */}
      {showReviewModal && reviewImageUrl && yearlyReview && (
        <View className='timeline-review-overlay' onClick={handleCloseReview}>
          <View className='timeline-review-modal' onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
            <View className='timeline-review-header'>
              <Text className='timeline-review-header-title'>
                {yearlyReview.year}年度回忆 · {yearlyReview.petEmoji} {yearlyReview.petName}
              </Text>
              <View className='timeline-review-header-close' onClick={handleCloseReview}>
                <Text>✕</Text>
              </View>
            </View>
            <View className='timeline-review-image-wrap'>
              <View
                className='timeline-review-image'
                style={{ backgroundImage: `url(${reviewImageUrl})` }}
                onClick={() => Taro.previewImage({ urls: [reviewImageUrl], current: reviewImageUrl })}
              />
            </View>
            <View className='timeline-review-actions'>
              <View className='timeline-review-btn timeline-review-btn--primary' onClick={handleSaveReview}>
                <Text className='timeline-review-btn-text'>💾 保存到相册</Text>
              </View>
              <View className='timeline-review-btn timeline-review-btn--outline' onClick={handleCloseReview}>
                <Text className='timeline-review-btn-text'>关闭</Text>
              </View>
            </View>
          </View>
        </View>
      )}
      <Canvas
        className='timeline-review-canvas'
        canvasId='yearly-review-canvas'
        id='yearly-review-canvas'
        style={{ display: reviewCanvasRef.current ? 'block' : 'none', position: 'fixed', left: '-9999px', top: '-9999px', width: '750px', height: '1334px' }}
        type='2d'
      />

      {/* ===== 新增回忆弹窗 ===== */}
      {showAddMemoryModal && (
        <View className='timeline-review-overlay' onClick={() => setShowAddMemoryModal(false)}>
          <View className='timeline-review-modal' onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
            <View className='timeline-review-header'>
              <Text className='timeline-review-header-title'>新增回忆 ✦</Text>
              <View className='timeline-review-header-close' onClick={() => setShowAddMemoryModal(false)}>
                <Text>✕</Text>
              </View>
            </View>
            <View className='timeline-add-memory-body'>
              <Textarea
                className='timeline-add-memory-textarea'
                placeholder='写下这个值得记住的瞬间...'
                value={memoryText}
                onInput={(e: { detail: { value: string } }) => setMemoryText(e.detail.value)}
                maxlength={500}
                autoHeight
              />
              <View className='timeline-add-memory-photo-row'>
                {memoryPhotoPath ? (
                  <View className='timeline-add-memory-photo-preview'>
                    <Image
                      className='timeline-add-memory-photo-img'
                      src={memoryPhotoPath}
                      mode='aspectFill'
                    />
                    <View
                      className='timeline-add-memory-photo-remove'
                      onClick={() => setMemoryPhotoPath(null)}
                    >
                      <Text>✕</Text>
                    </View>
                  </View>
                ) : (
                  <View className='timeline-add-memory-photo-btn' onClick={handleAddMemoryPhoto}>
                    <Text className='timeline-add-memory-photo-icon'>📷</Text>
                    <Text className='timeline-add-memory-photo-label'>拍照/上传照片</Text>
                  </View>
                )}
                {memoryPhotoPath && (
                  <View className='timeline-add-memory-photo-change' onClick={handleAddMemoryPhoto}>
                    <Text>更换照片</Text>
                  </View>
                )}
              </View>
            </View>
            <View className='timeline-review-actions'>
              <View
                className={`timeline-review-btn timeline-review-btn--primary ${isMemorySubmitting ? 'timeline-review-btn--disabled' : ''}`}
                onClick={isMemorySubmitting ? undefined : handleAddMemorySubmit}
              >
                <Text className='timeline-review-btn-text'>
                  {isMemorySubmitting ? '保存中...' : '💾 保存回忆'}
                </Text>
              </View>
              <View className='timeline-review-btn timeline-review-btn--outline' onClick={() => setShowAddMemoryModal(false)}>
                <Text className='timeline-review-btn-text'>取消</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
