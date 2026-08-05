/**
 * 纪念Vlog页面
 * 5步流程：选照片 → 写叙事 → 选BGM → 确认支付 → 生成结果
 */
import { View, Text, ScrollView, Image, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useCallback, useRef } from 'react'
import { CONFIG } from '../../config'
import { storage } from '../../utils/storage'
import { wsClient } from '../../services/wsClient'
import './index.scss'

// ==================== 类型定义 ====================

/** 已选照片项 */
interface PhotoItem {
  path: string
  size: number
}

/** BGM 选项 */
interface BGMOption {
  key: string
  emoji: string
  name: string
  tag: string
  /** BGM 预览音频 URL */
  previewUrl: string
}

/** API 响应类型 */
interface CreateTaskResponse {
  success?: boolean
  data?: {
    id: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
  }
}

interface TaskStatusResponse {
  success?: boolean
  data?: {
    id: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    video_url?: string
    preview_url?: string
  }
}

interface MemberCheckResponse {
  isMember: boolean
}

// ==================== 常量 ====================

const BGM_OPTIONS: BGMOption[] = [
  { key: 'piano', emoji: '🎵', name: '温柔时光', tag: '钢琴曲', previewUrl: `${CONFIG.ASSETS_BASE_URL}/bgm/piano-preview.mp3` },
  { key: 'guitar', emoji: '🎵', name: '暖心回忆', tag: '吉他', previewUrl: `${CONFIG.ASSETS_BASE_URL}/bgm/guitar-preview.mp3` },
  { key: 'strings', emoji: '🎵', name: '深情告白', tag: '弦乐', previewUrl: `${CONFIG.ASSETS_BASE_URL}/bgm/strings-preview.mp3` },
  { key: 'upbeat', emoji: '🎵', name: '欢快瞬间', tag: '轻快节奏', previewUrl: `${CONFIG.ASSETS_BASE_URL}/bgm/upbeat-preview.mp3` },
]

const STEP_LABELS = ['选照片', '写叙事', '选BGM', '确认', '完成']

const LOADING_STEPS = ['提交成功', '处理中', 'AI编排中', '生成视频中']

const MAX_PHOTOS = 15
const MIN_PHOTOS = 5
const NARRATIVE_MAX_LENGTH = 500

/** BGM key → 后端 music_style 枚举映射 */
function mapBGMToMusicStyle(bgmKey: string): string {
  const map: Record<string, string> = {
    piano: 'peaceful',
    guitar: 'warm',
    strings: 'nostalgic',
    upbeat: 'cheerful',
  }
  return map[bgmKey] || 'warm'
}

// ==================== 组件 ====================

export default function MemoirVlog() {
  const routerParams = Taro.getCurrentInstance().router?.params as Record<string, string> | undefined
  const petId = routerParams?.petId || ''

  // —— 步骤控制 ——
  const [step, setStep] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  // —— 步骤1：选照片 ——
  const [photos, setPhotos] = useState<PhotoItem[]>([])

  // —— 步骤2：写叙事 ——
  const [narrative, setNarrative] = useState('')

  // —— 步骤3：选BGM ——
  const [selectedBGM, setSelectedBGM] = useState('piano')
  const [playingBGM, setPlayingBGM] = useState<string | null>(null)
  const bgmAudioRef = useRef<Taro.InnerAudioContext | null>(null)

  // —— 步骤4：确认支付 ——
  const [isMember, setIsMember] = useState<boolean | null>(null)
  const [checkingMember, setCheckingMember] = useState(false)

  // —— 步骤5：生成与结果 ——
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [loadingStepIndex, setLoadingStepIndex] = useState(0)
  const [taskId, setTaskId] = useState('')
  const [outputUrl, setOutputUrl] = useState('')
  const [polling, setPolling] = useState(false)
  /** WS 事件触发计数：收到 memoir_status 时自增，驱动立即刷新（替代等待轮询） */
  const [refreshKey, setRefreshKey] = useState(0)
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ==================== 步骤切换 ====================

  const goToStep = useCallback((next: number) => {
    setAnimKey(prev => prev + 1)
    setStep(next)
  }, [])

  // ==================== 照片操作 ====================

  const handleAddPhoto = useCallback(() => {
    const remain = MAX_PHOTOS - photos.length
    if (remain <= 0) {
      Taro.showToast({ title: '最多选择15张照片', icon: 'none' })
      return
    }

    Taro.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPhotos = res.tempFilePaths.map((path, i) => ({
          path,
          size: res.tempFiles[i]?.size || 0,
        }))
        setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS))
      },
      fail: () => {
        // 用户取消选择，不做处理
      },
    })
  }, [photos])

  const handleDeletePhoto = useCallback((index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handlePreviewPhoto = useCallback((index: number) => {
    const urls = photos.map(p => p.path)
    Taro.previewImage({
      current: urls[index],
      urls,
    })
  }, [photos])

  // ==================== BGM 预览 ====================

  const handleBGMPreview = useCallback((bgmKey: string, previewUrl: string) => {
    // 如果正在播放同一首 BGM，则停止
    if (playingBGM === bgmKey) {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.stop()
        bgmAudioRef.current.destroy()
        bgmAudioRef.current = null
      }
      setPlayingBGM(null)
      return
    }

    // 停止当前播放的 BGM
    if (bgmAudioRef.current) {
      bgmAudioRef.current.stop()
      bgmAudioRef.current.destroy()
      bgmAudioRef.current = null
    }

    // 创建新的音频上下文
    const audioCtx = Taro.createInnerAudioContext()
    audioCtx.src = previewUrl
    audioCtx.autoplay = true
    audioCtx.loop = false

    audioCtx.onPlay(() => {
      setPlayingBGM(bgmKey)
    })

    audioCtx.onEnded(() => {
      setPlayingBGM(null)
      if (bgmAudioRef.current) {
        bgmAudioRef.current.destroy()
        bgmAudioRef.current = null
      }
    })

    audioCtx.onError((err) => {
      console.warn('[BGM Preview] 音频播放失败:', err.errMsg)
      setPlayingBGM(null)
      if (bgmAudioRef.current) {
        bgmAudioRef.current.destroy()
        bgmAudioRef.current = null
      }
      Taro.showToast({ title: '试听暂不可用', icon: 'none' })
    })

    bgmAudioRef.current = audioCtx
  }, [playingBGM])

  // 组件卸载时清理音频
  useEffect(() => {
    return () => {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.stop()
        bgmAudioRef.current.destroy()
        bgmAudioRef.current = null
      }
    }
  }, [])

  // ==================== 检查会员状态 ====================

  const checkMembership = useCallback(async () => {
    if (!petId) return
    setCheckingMember(true)

    try {
      const token = storage.getToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await Taro.request<MemberCheckResponse>({
        url: `${CONFIG.API_BASE_URL}/api/pets/${petId}/membership`,
        method: 'GET',
        header: headers,
      })

      if (res.statusCode === 200) {
        setIsMember(res.data?.isMember ?? false)
      } else {
        setIsMember(false)
      }
    } catch {
      setIsMember(false)
    } finally {
      setCheckingMember(false)
    }
  }, [petId])

  // 进入步骤4时检查会员
  useEffect(() => {
    if (step === 3 && isMember === null) {
      checkMembership()
    }
  }, [step, isMember, checkMembership])

  // ==================== 支付流程 ====================

  const handlePayment = useCallback(async () => {
    const amount = isMember ? 99 : 149

    Taro.showModal({
      title: '确认支付',
      content: `支付金额：¥${amount}`,
      confirmText: '确认支付',
      cancelText: '再想想',
      success: async (res) => {
        if (res.confirm) {
          // 调用支付接口（占位实现）
          try {
            const token = storage.getToken()
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            }
            if (token) {
              headers['Authorization'] = `Bearer ${token}`
            }

            const payRes = await Taro.request({
              url: `${CONFIG.API_BASE_URL}/api/pets/${petId}/memoir/pay`,
              method: 'POST',
              header: headers,
              data: {
                amount,
                type: 'memorial',
              },
            })

            if (payRes.statusCode === 200) {
              Taro.showToast({ title: '支付成功', icon: 'success' })
              handleGenerate()
            } else {
              Taro.showToast({ title: '支付失败，请重试', icon: 'none' })
            }
          } catch {
            Taro.showToast({ title: '网络异常，请重试', icon: 'none' })
          }
        }
      },
    })
  }, [isMember, petId])

  // ==================== 生成Vlog ====================

  const handleGenerate = useCallback(async () => {
    if (!petId) {
      Taro.showToast({ title: '宠物信息缺失', icon: 'none' })
      return
    }

    setLoading(true)
    setLoadingText('提交成功')
    setLoadingStepIndex(0)

    // 启动加载进度动画
    loadingTimerRef.current = setInterval(() => {
      setLoadingStepIndex(prev => {
        const next = prev + 1
        if (next < LOADING_STEPS.length) {
          setLoadingText(LOADING_STEPS[next])
          return next
        }
        return prev
      })
    }, 3000)

    try {
      const token = storage.getToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await Taro.request<CreateTaskResponse>({
        url: `${CONFIG.API_BASE_URL}/api/pets/${petId}/memoir`,
        method: 'POST',
        header: headers,
        data: {
          memoir_type: 'memorial',
          source_photos: photos.map(p => p.path),
          music_style: mapBGMToMusicStyle(selectedBGM),
          source_text: narrative.trim() || '',
        },
      })

      if (res.statusCode === 201 && res.data?.data?.id) {
        setTaskId(res.data.data.id)
        // 开始轮询
        setPolling(true)
      } else {
        Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
        setLoading(false)
        if (loadingTimerRef.current) {
          clearInterval(loadingTimerRef.current)
          loadingTimerRef.current = null
        }
      }
    } catch {
      Taro.showToast({ title: '网络异常，请重试', icon: 'none' })
      setLoading(false)
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current)
        loadingTimerRef.current = null
      }
    }
  }, [petId, photos, selectedBGM, narrative])

  // ==================== 轮询任务状态 ====================

  // 订阅 WS 事件：视频生成完成/失败时立即触发刷新（替代等待下一次轮询）
  useEffect(() => {
    if (!polling || !petId || !taskId) return

    const unsubscribe = wsClient.on('memoir_status', (data) => {
      if (data.taskId !== taskId) return
      setRefreshKey((k) => k + 1)
    })
    return unsubscribe
  }, [polling, petId, taskId])

  useEffect(() => {
    if (!polling || !petId || !taskId) return

    let timer: ReturnType<typeof setTimeout> | null = null
    let stopped = false

    const poll = async () => {
      if (stopped) return

      try {
        const token = storage.getToken()
        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const res = await Taro.request<TaskStatusResponse>({
          url: `${CONFIG.API_BASE_URL}/api/pets/${petId}/memoir/status`,
          method: 'GET',
          header: headers,
          data: { taskId },
        })

        if (stopped) return

        if (res.statusCode === 200) {
          const data = res.data?.data
          if (data?.status === 'completed') {
            setOutputUrl(data.video_url || '')
            setLoading(false)
            setPolling(false)
            if (loadingTimerRef.current) {
              clearInterval(loadingTimerRef.current)
              loadingTimerRef.current = null
            }
            Taro.showToast({ title: '生成成功', icon: 'success' })
            goToStep(4)
          } else if (data?.status === 'failed') {
            setLoading(false)
            setPolling(false)
            if (loadingTimerRef.current) {
              clearInterval(loadingTimerRef.current)
              loadingTimerRef.current = null
            }
            Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
          } else {
            timer = setTimeout(poll, 2000)
          }
        } else {
          timer = setTimeout(poll, 2000)
        }
      } catch {
        if (!stopped) {
          timer = setTimeout(poll, 2000)
        }
      }
    }

    poll()

    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
    }
  }, [polling, petId, taskId, goToStep, refreshKey])

  // ==================== 重新制作 ====================

  const handleReset = useCallback(() => {
    setPhotos([])
    setNarrative('')
    setSelectedBGM('piano')
    setTaskId('')
    setOutputUrl('')
    setLoading(false)
    setPolling(false)
    setIsMember(null)
    goToStep(0)
  }, [goToStep])

  const handleShare = useCallback(() => {
    Taro.showShareMenu({
      withShareTicket: true,
    })
  }, [])

  const handlePlayVideo = useCallback(() => {
    if (outputUrl) {
      Taro.previewMedia({
        sources: [{ url: outputUrl, type: 'video' }],
        current: 0,
      }).catch(() => {
        Taro.showToast({ title: '视频播放失败', icon: 'none' })
      })
    }
  }, [outputUrl])

  // ==================== 渲染步骤指示器 ====================

  const renderStepIndicator = () => (
    <View className='memoir-vlog__steps'>
      {STEP_LABELS.map((label, i) => (
        <View key={label} style={{ display: 'flex', alignItems: 'center', gap: '12rpx' }}>
          <View
            className={`memoir-vlog__step-dot${
              i === step ? ' memoir-vlog__step-dot--active' : ''
            }${i < step ? ' memoir-vlog__step-dot--done' : ''}`}
          />
          {i < STEP_LABELS.length - 1 && (
            <View className='memoir-vlog__step-connector' />
          )}
        </View>
      ))}
    </View>
  )

  // ==================== 步骤一：选照片 ====================

  const renderStepPhoto = () => (
    <View className='memoir-vlog__step-enter'>
      <View className='memoir-vlog__photo-header'>
        <Text className='memoir-vlog__title'>
          选择照片·<Text className='gold-accent'>5-15张</Text>
        </Text>
        <Text className='memoir-vlog__photo-count'>已选 {photos.length}/{MAX_PHOTOS} 张</Text>
      </View>
      <Text className='memoir-vlog__hint'>
        建议选择不同角度和场景的照片，让视频更丰富
      </Text>

      <View className='memoir-vlog__photo-grid'>
        {photos.map((photo, index) => (
          <View
            key={index}
            className='memoir-vlog__photo-item'
            onClick={() => handlePreviewPhoto(index)}
          >
            <Image
              className='memoir-vlog__photo-image'
              src={photo.path}
              mode='aspectFill'
            />
            <View
              className='memoir-vlog__photo-delete'
              onClick={(e) => {
                e.stopPropagation()
                handleDeletePhoto(index)
              }}
            >
              ✕
            </View>
          </View>
        ))}

        {photos.length < MAX_PHOTOS && (
          <View className='memoir-vlog__photo-add' onClick={handleAddPhoto}>
            <Text className='memoir-vlog__photo-add-icon'>+</Text>
            <Text className='memoir-vlog__photo-add-text'>
              {photos.length === 0 ? '添加照片' : '继续添加'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )

  // ==================== 步骤二：写叙事文字 ====================

  const renderStepNarrative = () => (
    <View className='memoir-vlog__step-enter'>
      <Text className='memoir-vlog__title'>写下你想说的故事</Text>
      <Text className='memoir-vlog__hint'>好的故事让视频更有情感</Text>

      <Textarea
        className='memoir-vlog__narrative-textarea'
        placeholder='写下你和它之间的故事，AI会根据文字编排视频叙事...'
        value={narrative}
        onInput={(e) => {
          const val = e.detail.value
          if (val.length <= NARRATIVE_MAX_LENGTH) {
            setNarrative(val)
          }
        }}
        maxlength={NARRATIVE_MAX_LENGTH}
        autoFocus={false}
        showCount
      />
    </View>
  )

  // ==================== 步骤三：选BGM ====================

  const renderStepBGM = () => (
    <View className='memoir-vlog__step-enter'>
      <Text className='memoir-vlog__title'>选择背景音乐</Text>
      <Text className='memoir-vlog__hint'>选择一首你喜欢的背景音乐</Text>

      <View className='memoir-vlog__bgm-list'>
        {BGM_OPTIONS.map((bgm) => (
          <View
            key={bgm.key}
            className={`memoir-vlog__bgm-card${
              selectedBGM === bgm.key ? ' memoir-vlog__bgm-card--active' : ''
            }`}
            onClick={() => setSelectedBGM(bgm.key)}
          >
            <View className='memoir-vlog__bgm-card-emoji'>
              <Text>{bgm.emoji}</Text>
            </View>
            <View className='memoir-vlog__bgm-card-info'>
              <Text className='memoir-vlog__bgm-card-name'>{bgm.name}</Text>
              <Text className='memoir-vlog__bgm-card-tag'>{bgm.tag}</Text>
            </View>
            <View
              className={`memoir-vlog__bgm-card-preview${playingBGM === bgm.key ? ' memoir-vlog__bgm-card-preview--playing' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                handleBGMPreview(bgm.key, bgm.previewUrl)
              }}
            >
              <Text>{playingBGM === bgm.key ? '⏸' : '▶'}</Text>
            </View>
            <View
              className={`memoir-vlog__bgm-card-check${
                selectedBGM === bgm.key ? ' memoir-vlog__bgm-card-check--checked' : ''
              }`}
            >
              {selectedBGM === bgm.key && <Text>✓</Text>}
            </View>
          </View>
        ))}
      </View>
    </View>
  )

  // ==================== 步骤四：确认与支付 ====================

  const renderStepConfirm = () => {
    const narrativeSummary = narrative.trim()
      ? narrative.trim().substring(0, 20) + '...'
      : '无'

    return (
      <View className='memoir-vlog__step-enter'>
        <Text className='memoir-vlog__title'>确认制作</Text>
        <Text className='memoir-vlog__hint'>请确认以下信息</Text>

        <View className='memoir-vlog__confirm-summary'>
          <View className='memoir-vlog__confirm-item'>
            <Text className='memoir-vlog__confirm-item-icon'>📸</Text>
            <View style={{ flex: 1 }}>
              <Text className='memoir-vlog__confirm-item-text'>{photos.length}张照片</Text>
              <Text className='memoir-vlog__confirm-item-label'>已选择的照片数量</Text>
            </View>
          </View>

          <View className='memoir-vlog__confirm-item'>
            <Text className='memoir-vlog__confirm-item-icon'>✍</Text>
            <View style={{ flex: 1 }}>
              <Text className='memoir-vlog__confirm-item-text'>叙事文字：{narrativeSummary}</Text>
              <Text className='memoir-vlog__confirm-item-label'>AI会根据文字编排视频叙事</Text>
            </View>
          </View>

          <View className='memoir-vlog__confirm-item'>
            <Text className='memoir-vlog__confirm-item-icon'>🎵</Text>
            <View style={{ flex: 1 }}>
              <Text className='memoir-vlog__confirm-item-text'>
                已选BGM：{BGM_OPTIONS.find(b => b.key === selectedBGM)?.name || selectedBGM}
              </Text>
              <Text className='memoir-vlog__confirm-item-label'>背景音乐</Text>
            </View>
          </View>

          <View className='memoir-vlog__confirm-item'>
            <Text className='memoir-vlog__confirm-item-icon'>⏱</Text>
            <View style={{ flex: 1 }}>
              <Text className='memoir-vlog__confirm-item-text'>预计60秒视频</Text>
              <Text className='memoir-vlog__confirm-item-label'>AI自动生成叙事视频</Text>
            </View>
          </View>
        </View>

        <View className='memoir-vlog__price-area'>
          {checkingMember ? (
            <Text className='memoir-vlog__price-sub'>正在查询会员信息...</Text>
          ) : isMember ? (
            <>
              <Text>
                <Text className='memoir-vlog__price-amount'>¥99</Text>
                <Text className='memoir-vlog__price-suffix'>/次</Text>
              </Text>
              <Text className='memoir-vlog__price-sub'>会员专享价</Text>
            </>
          ) : (
            <>
              <Text>
                <Text className='memoir-vlog__price-amount'>¥149</Text>
                <Text className='memoir-vlog__price-suffix'>/次</Text>
              </Text>
              <Text className='memoir-vlog__price-sub'>开通会员仅需¥9.9/月，享3次免费日常回忆录</Text>
            </>
          )}
        </View>
      </View>
    )
  }

  // ==================== 步骤五：生成结果 ====================

  const renderStepResult = () => (
    <View className='memoir-vlog__step-enter'>
      <Text className='memoir-vlog__title' style={{ textAlign: 'center' }}>✨ <Text className='gold-accent'>制作完成</Text></Text>
      <Text className='memoir-vlog__hint' style={{ textAlign: 'center' }}>纪念Vlog已生成，快来分享吧</Text>

      <View className='memoir-vlog__result-preview'>
        {outputUrl ? (
          <>
            <Image className='memoir-vlog__result-image' src={outputUrl} mode='aspectFill' />
            <View className='memoir-vlog__result-play-btn' onClick={handlePlayVideo}>
              ▶
            </View>
          </>
        ) : (
          <View className='memoir-vlog__result-placeholder'>
            <Text className='memoir-vlog__result-placeholder-icon'>🎬</Text>
            <Text className='memoir-vlog__result-placeholder-text'>纪念Vlog已生成</Text>
          </View>
        )}
      </View>

      <View className='memoir-vlog__result-actions'>
        <View className='memoir-vlog__btn memoir-vlog__btn--gold' onClick={handleShare}>
          <Text className='memoir-vlog__btn-text'>📤 分享</Text>
        </View>
        <View className='memoir-vlog__btn memoir-vlog__btn--secondary' onClick={handleReset}>
          <Text className='memoir-vlog__btn-text'>🔄 重新制作</Text>
        </View>
      </View>
    </View>
  )

  // ==================== 底部按钮 ====================

  const renderFooter = () => {
    if (step === 0) {
      const canNext = photos.length >= MIN_PHOTOS
      return (
        <View
          className={`memoir-vlog__btn memoir-vlog__btn--primary${
            !canNext ? ' memoir-vlog__btn--disabled' : ''
          }`}
          onClick={canNext ? () => goToStep(1) : undefined}
        >
          <Text className='memoir-vlog__btn-text'>下一步</Text>
        </View>
      )
    }

    if (step === 1) {
      return (
        <View
          className='memoir-vlog__btn memoir-vlog__btn--primary'
          onClick={() => goToStep(2)}
        >
          <Text className='memoir-vlog__btn-text'>下一步</Text>
        </View>
      )
    }

    if (step === 2) {
      return (
        <View
          className='memoir-vlog__btn memoir-vlog__btn--primary'
          onClick={() => goToStep(3)}
        >
          <Text className='memoir-vlog__btn-text'>下一步</Text>
        </View>
      )
    }

    if (step === 3) {
      return (
        <View
          className='memoir-vlog__btn memoir-vlog__btn--gold'
          onClick={handlePayment}
        >
          <Text className='memoir-vlog__btn-text'>
            {isMember ? '会员价 ¥99 · 确认支付' : '¥149 · 确认支付'}
          </Text>
        </View>
      )
    }

    return null
  }

  // ==================== 主渲染 ====================

  return (
    <View className='memoir-vlog'>
      {renderStepIndicator()}

      <ScrollView
        className='memoir-vlog__content'
        scrollY
        enhanced
        showScrollbar={false}
        key={animKey}
      >
        {step === 0 && renderStepPhoto()}
        {step === 1 && renderStepNarrative()}
        {step === 2 && renderStepBGM()}
        {step === 3 && renderStepConfirm()}
        {step === 4 && renderStepResult()}
      </ScrollView>

      {step < 4 && (
        <View className='memoir-vlog__footer'>
          {renderFooter()}
        </View>
      )}

      {loading && (
        <View className='memoir-vlog__loading-overlay'>
          <View className='memoir-vlog__loading-spinner' />
          <Text className='memoir-vlog__loading-text'>
            AI正在为你创作专属纪念Vlog...
          </Text>
          <View className='memoir-vlog__loading-progress'>
            {LOADING_STEPS.map((s, i) => (
              <Text
                key={s}
                className={`memoir-vlog__loading-step${
                  i < loadingStepIndex ? ' memoir-vlog__loading-step--done' : ''
                }${i === loadingStepIndex ? ' memoir-vlog__loading-step--active' : ''}`}
              >
                {i <= loadingStepIndex ? '✓ ' : '○ '}{s}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}
