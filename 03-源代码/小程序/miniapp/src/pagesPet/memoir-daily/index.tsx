/**
 * 日常回忆录页面（按高保真原型 1:1 重构）
 * 标题区 + hero + 双产品线卡 + 三步流程（上传素材 → AI生成 → 预览保存）
 * 保留完整业务：照片选择、风格/BGM、Ken Burns 预览、生成任务、WS+轮询、保存分享
 */
import { View, Text, ScrollView, Canvas, Image, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useRef, useCallback } from 'react'
import { CONFIG } from '../../config'
import { storage } from '../../utils/storage'
import { wsClient } from '../../services/wsClient'
import { timelineService } from '../../services/timelineService'
import { useThemeClass } from '../../hooks/useThemeClass'
import { usePetStore } from '../../stores/petStore'
import './index.scss'

// ==================== 类型定义 ====================

/** 预设风格 */
interface MemoirStyle {
  key: string
  emoji: string
  name: string
  desc: string
}

/** BGM 选项 */
interface BGMOption {
  key: string
  emoji: string
  name: string
  tag: string
  previewUrl: string
}

/** 已选照片项 */
interface PhotoItem {
  path: string
  size: number
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

// ==================== 常量 ====================

const STYLE_OPTIONS: MemoirStyle[] = [
  { key: 'warm', emoji: '🎠', name: '温馨回忆', desc: '柔和的淡入淡出 + 缓慢缩放' },
  { key: 'joyful', emoji: '🎪', name: '欢乐时光', desc: '活泼的弹跳 + 旋转' },
  { key: 'sunset', emoji: '🌅', name: '温暖夕阳', desc: '暖色调滤镜 + 渐显' },
  { key: 'night', emoji: '🌙', name: '静谧之夜', desc: '暗色调 + 柔和光晕' },
]

const BGM_OPTIONS: BGMOption[] = [
  { key: 'piano', emoji: '🎵', name: '温柔时光', tag: '钢琴曲', previewUrl: `${CONFIG.ASSETS_BASE_URL}/bgm/piano-preview.mp3` },
  { key: 'guitar', emoji: '🎵', name: '暖心回忆', tag: '吉他', previewUrl: `${CONFIG.ASSETS_BASE_URL}/bgm/guitar-preview.mp3` },
  { key: 'strings', emoji: '🎵', name: '深情告白', tag: '弦乐', previewUrl: `${CONFIG.ASSETS_BASE_URL}/bgm/strings-preview.mp3` },
  { key: 'upbeat', emoji: '🎵', name: '欢快瞬间', tag: '轻快节奏', previewUrl: `${CONFIG.ASSETS_BASE_URL}/bgm/upbeat-preview.mp3` },
]

// 三步流程（原型：上传素材 / AI生成 / 预览保存）
const STEP_LABELS = ['上传素材', 'AI生成', '预览保存']

// ==================== 组件 ====================

export default function MemoirDaily() {
  const themeClass = useThemeClass()
  const routerParams = Taro.getCurrentInstance().router?.params as Record<string, string> | undefined
  const petId = routerParams?.petId || ''

  // —— 步骤控制 ——
  const [step, setStep] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  // —— 步骤1：选照片 ——
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [story, setStory] = useState('')

  // —— 步骤2：选风格 ——
  const [selectedStyle, setSelectedStyle] = useState('warm')
  const [selectedBGM, setSelectedBGM] = useState('piano')
  const [playingBGM, setPlayingBGM] = useState<string | null>(null)
  const bgmAudioRef = useRef<Taro.InnerAudioContext | null>(null)

  // —— 步骤3：预览加载 ——
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('正在生成...')
  const canvasRef = useRef<any>(null)
  const animFrameRef = useRef<number | null>(null)

  // —— 步骤4：结果 ——
  const [taskId, setTaskId] = useState('')
  const [outputUrl, setOutputUrl] = useState('')
  const [polling, setPolling] = useState(false)
  /** WS 事件触发计数：收到 memoir_status 时自增，驱动立即刷新（替代等待轮询） */
  const [refreshKey, setRefreshKey] = useState(0)

  // ==================== Ken Burns 动画 ====================

  const startKenBurns = useCallback(() => {
    const canvasNode = canvasRef.current
    if (!canvasNode || photos.length === 0) return

    Taro.createSelectorQuery()
      .select('#memoirCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0]?.node
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        const width = res[0].width || 600
        const height = res[0].height || 480
        canvas.width = width
        canvas.height = height

        let currentIndex = 0
        let progress = 0
        const DURATION = 3000 // 每张3秒
        const SCALE_MAX = 1.15

        const images: HTMLImageElement[] = []
        let loadedCount = 0

        photos.forEach((photo) => {
          const img = canvas.createImage()
          img.src = photo.path
          img.onload = () => {
            loadedCount++
          }
          img.onerror = () => {
            loadedCount++
          }
          images.push(img)
        })

        let lastTime = Date.now()

        function draw(timestamp: number) {
          if (photos.length === 0) return

          const delta = timestamp - lastTime
          lastTime = timestamp
          progress += delta

          if (progress >= DURATION) {
            progress = 0
            currentIndex = (currentIndex + 1) % photos.length
          }

          const img = images[currentIndex]
          if (!img || !img.width) {
            animFrameRef.current = requestAnimationFrame(draw)
            return
          }

          const ratio = Math.min(progress / DURATION, 1)
          const scale = 1 + (SCALE_MAX - 1) * ratio
          const tx = (width * (scale - 1)) / 2 * 0.3
          const ty = (height * (scale - 1)) / 2 * 0.15

          ctx.clearRect(0, 0, width, height)

          // 绘制暗色背景
          ctx.fillStyle = '#1A1410'
          ctx.fillRect(0, 0, width, height)

          ctx.save()
          ctx.translate(width / 2, height / 2)
          ctx.scale(scale, scale)
          ctx.translate(-width / 2 + tx, -height / 2 + ty)

          // 将图片居中裁剪适配canvas
          const imgAspect = img.width / img.height
          const canvasAspect = width / height
          let sx = 0, sy = 0, sw = img.width, sh = img.height

          if (imgAspect > canvasAspect) {
            sw = img.height * canvasAspect
            sx = (img.width - sw) / 2
          } else {
            sh = img.width / canvasAspect
            sy = (img.height - sh) / 2
          }

          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
          ctx.restore()

          // 顶部/底部渐隐遮罩
          const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.15)
          gradient.addColorStop(0, 'rgba(26,20,16,0.4)')
          gradient.addColorStop(1, 'rgba(26,20,16,0)')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, width, height * 0.15)

          const gradientBottom = ctx.createLinearGradient(0, height * 0.85, 0, height)
          gradientBottom.addColorStop(0, 'rgba(26,20,16,0)')
          gradientBottom.addColorStop(1, 'rgba(26,20,16,0.4)')
          ctx.fillStyle = gradientBottom
          ctx.fillRect(0, height * 0.85, width, height * 0.15)

          animFrameRef.current = requestAnimationFrame(draw)
        }

        animFrameRef.current = requestAnimationFrame(draw)
      })
  }, [photos])

  // ==================== BGM 预览 ====================

  const handleBGMPreview = useCallback((bgmKey: string, previewUrl: string) => {
    if (playingBGM === bgmKey) {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.stop()
        bgmAudioRef.current.destroy()
        bgmAudioRef.current = null
      }
      setPlayingBGM(null)
      return
    }
    if (bgmAudioRef.current) {
      bgmAudioRef.current.stop()
      bgmAudioRef.current.destroy()
      bgmAudioRef.current = null
    }
    const audioCtx = Taro.createInnerAudioContext()
    audioCtx.src = previewUrl
    audioCtx.autoplay = true
    audioCtx.loop = false
    audioCtx.onPlay(() => setPlayingBGM(bgmKey))
    audioCtx.onEnded(() => {
      setPlayingBGM(null)
      if (bgmAudioRef.current) { bgmAudioRef.current.destroy(); bgmAudioRef.current = null }
    })
    audioCtx.onError(() => {
      setPlayingBGM(null)
      if (bgmAudioRef.current) { bgmAudioRef.current.destroy(); bgmAudioRef.current = null }
      Taro.showToast({ title: '试听暂不可用', icon: 'none' })
    })
    bgmAudioRef.current = audioCtx
  }, [playingBGM])

  useEffect(() => {
    return () => {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.stop()
        bgmAudioRef.current.destroy()
        bgmAudioRef.current = null
      }
    }
  }, [])

  // ==================== 步骤切换 ====================

  const goToStep = useCallback((next: number) => {
    setAnimKey(prev => prev + 1)
    setStep(next)
  }, [])

  // ==================== 照片操作 ====================

  const handleAddPhoto = useCallback(() => {
    const remain = 3 - photos.length
    if (remain <= 0) {
      Taro.showToast({ title: '最多选择3张照片', icon: 'none' })
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
        setPhotos(prev => [...prev, ...newPhotos].slice(0, 3))
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

  // ==================== 生成回忆录 ====================

  const handleGenerate = useCallback(async () => {
    if (!petId) {
      Taro.showToast({ title: '宠物信息缺失', icon: 'none' })
      return
    }

    setLoading(true)
    setLoadingText('正在生成...')

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
          memoir_type: 'daily',
          source_photos: photos.map(p => p.path),
          music_style: selectedBGM,
          style_preset: selectedStyle,
          story: story.trim() || undefined,
        },
      })

      if (res.statusCode === 201 && res.data?.data?.id) {
        setTaskId(res.data.data.id)
        setLoadingText('正在处理...')
        // 开始轮询
        setPolling(true)
      } else {
        Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
        setLoading(false)
      }
    } catch {
      Taro.showToast({ title: '网络异常，请重试', icon: 'none' })
      setLoading(false)
    }
  }, [petId, photos, selectedStyle, selectedBGM, story])

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
        })

        if (stopped) return

        if (res.statusCode === 200) {
          const data = res.data?.data
          if (data?.status === 'completed') {
            setOutputUrl(data.video_url || '')
            setLoading(false)
            setPolling(false)
            Taro.showToast({ title: '生成成功', icon: 'success' })
            goToStep(3)
          } else if (data?.status === 'failed') {
            setLoading(false)
            setPolling(false)
            Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
          } else {
            // 继续轮询
            setLoadingText(data?.status === 'processing' ? '正在处理...' : '排队中...')
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

  // ==================== 进入预览步骤时启动动画 ====================

  useEffect(() => {
    if (step === 2 && photos.length > 0) {
      setTimeout(() => startKenBurns(), 300)
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [step, photos, startKenBurns])

  // ==================== 重新制作 ====================

  const handleReset = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    setPhotos([])
    setStory('')
    setSelectedStyle('warm')
    setTaskId('')
    setOutputUrl('')
    setLoading(false)
    setPolling(false)
    goToStep(0)
  }, [goToStep])

  const handleShare = useCallback(() => {
    Taro.showShareMenu({
      withShareTicket: true,
    })
  }, [])

  const handleSaveToTimeline = useCallback(async () => {
    if (!petId || !outputUrl) {
      Taro.showToast({ title: '保存失败', icon: 'none' })
      return
    }
    try {
      const userId = usePetStore.getState().userId || ''
      await timelineService.addMoment({
        userId,
        petId,
        type: 'memory',
        content: {
          petName: '毛孩子',
          petEmoji: '🐾',
          description: outputUrl,
        },
        photos: [outputUrl],
      })
      Taro.showToast({ title: '已保存到时光线', icon: 'success' })
    } catch {
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  }, [petId, outputUrl])

  /** 保存到相册 */
  const handleSaveAlbum = useCallback(() => {
    if (!outputUrl) {
      Taro.showToast({ title: '保存失败', icon: 'none' })
      return
    }
    Taro.downloadFile({
      url: outputUrl,
      success: (res) => {
        if (res.statusCode !== 200) {
          Taro.showToast({ title: '保存失败', icon: 'none' })
          return
        }
        Taro.saveVideoToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => Taro.showToast({ title: '已保存到相册', icon: 'success' }),
          fail: () => Taro.showModal({
            title: '需要相册权限',
            content: '请在设置中开启「保存到相册」权限后重试',
            confirmText: '去设置',
            success: (m) => {
              if (m.confirm) Taro.openSetting()
            },
          }),
        })
      },
      fail: () => Taro.showToast({ title: '保存失败', icon: 'none' }),
    })
  }, [outputUrl])

  /** 播放生成的视频 */
  const handlePlayVideo = useCallback(() => {
    if (!outputUrl) return
    Taro.previewMedia({
      sources: [{ url: outputUrl, type: 'video' }],
    })
  }, [outputUrl])

  /** 跳转纪念Vlog */
  const handleGoVlog = useCallback(() => {
    Taro.navigateTo({ url: `/pagesPet/memoir-vlog/index${petId ? `?petId=${petId}` : ''}` })
  }, [petId])

  // ==================== 渲染：步骤指示器 ====================

  const renderStepIndicator = () => {
    // step 0 → 上传素材；step 1/2 → AI生成；step 3 → 预览保存
    const activeIdx = step === 0 ? 0 : (step <= 2 ? 1 : 2)
    return (
      <View className='memoir__steps'>
        {STEP_LABELS.map((label, i) => (
          <View key={label} className='memoir__step-wrap'>
            <View className='memoir__step'>
              <View
                className={`memoir__step-dot${i === activeIdx ? ' memoir__step-dot--active' : ''}${i < activeIdx ? ' memoir__step-dot--done' : ''}`}
              >
                <Text className='memoir__step-num'>{i < activeIdx ? '✓' : i + 1}</Text>
              </View>
              <Text className={`memoir__step-label${i === activeIdx ? ' memoir__step-label--active' : ''}`}>{label}</Text>
            </View>
            {i < STEP_LABELS.length - 1 && <View className='memoir__step-line' />}
          </View>
        ))}
      </View>
    )
  }

  // ==================== 渲染：上传素材卡（step 0） ====================

  const renderStepUpload = () => (
    <View className='xhh-card memoir__panel'>
      <Text className='memoir__section-title'>上传素材</Text>

      <View className='memoir__photo-grid'>
        {photos.map((photo, index) => (
          <View
            key={index}
            className='memoir__photo-slot'
            onClick={() => handlePreviewPhoto(index)}
          >
            <Image className='memoir__photo-image' src={photo.path} mode='aspectFill' />
            <View
              className='memoir__photo-delete'
              onClick={(e) => {
                e.stopPropagation()
                handleDeletePhoto(index)
              }}
            >
              ✕
            </View>
          </View>
        ))}

        {photos.length < 3 && (
          <View className='memoir__photo-slot memoir__photo-slot--add' onClick={handleAddPhoto}>
            <Text className='memoir__photo-add-icon'>📷</Text>
            <Text className='memoir__photo-add-text'>添加</Text>
          </View>
        )}
      </View>

      <View
        className={`memoir__pick-btn ${photos.length === 3 ? 'memoir__pick-btn--disabled' : ''}`}
        onClick={handleAddPhoto}
      >
        <Text className='memoir__pick-btn-text'>🖼️ 选择照片（{photos.length}/3）</Text>
      </View>

      <Textarea
        className='memoir__story'
        value={story}
        onInput={e => setStory(e.detail.value)}
        placeholder='写点什么，让 AI 更懂 TA 的故事…'
        placeholderClass='memoir__placeholder'
        maxlength={200}
        autoHeight
      />

      <View className='memoir__lockbar'>
        <Text className='memoir__lockbar-icon'>🔒</Text>
        <Text className='memoir__lockbar-text'>已锁定角色特征，全视频保持一致</Text>
      </View>
    </View>
  )

  // ==================== 渲染：AI 生成卡（step 1） ====================

  const renderStepGenerate = () => (
    <View className='xhh-card memoir__panel'>
      <Text className='memoir__section-title'>选择动画风格</Text>
      <Text className='memoir__section-sub'>为你的回忆短片挑选一个喜欢的风格</Text>

      <View className='memoir__style-list'>
        {STYLE_OPTIONS.map((style) => (
          <View
            key={style.key}
            className={`memoir__style-card${selectedStyle === style.key ? ' memoir__style-card--active' : ''}`}
            onClick={() => setSelectedStyle(style.key)}
          >
            <View className='memoir__style-emoji'>
              <Text>{style.emoji}</Text>
            </View>
            <View className='memoir__style-info'>
              <Text className='memoir__style-name'>{style.name}</Text>
              <Text className='memoir__style-desc'>{style.desc}</Text>
            </View>
            <View className={`memoir__style-check${selectedStyle === style.key ? ' memoir__style-check--checked' : ''}`}>
              {selectedStyle === style.key && <Text>✓</Text>}
            </View>
          </View>
        ))}
      </View>

      <Text className='memoir__section-title' style={{ marginTop: '40rpx' }}>选择背景音乐</Text>
      <Text className='memoir__section-sub'>选择一首你喜欢的背景音乐</Text>

      <View className='memoir__bgm-list'>
        {BGM_OPTIONS.map((bgm) => (
          <View
            key={bgm.key}
            className={`memoir__bgm-card${selectedBGM === bgm.key ? ' memoir__bgm-card--active' : ''}`}
            onClick={() => setSelectedBGM(bgm.key)}
          >
            <View className='memoir__bgm-emoji'>
              <Text>{bgm.emoji}</Text>
            </View>
            <View className='memoir__bgm-info'>
              <Text className='memoir__bgm-name'>{bgm.name}</Text>
              <Text className='memoir__bgm-tag'>{bgm.tag}</Text>
            </View>
            <View
              className={`memoir__bgm-preview${playingBGM === bgm.key ? ' memoir__bgm-preview--playing' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                handleBGMPreview(bgm.key, bgm.previewUrl)
              }}
            >
              <Text>{playingBGM === bgm.key ? '⏸' : '▶'}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )

  // ==================== 渲染：AI 生成进度卡（loading 时） ====================

  const renderGenerating = () => (
    <View className='xhh-card memoir__panel'>
      <Text className='memoir__section-title'>AI 生成</Text>
      <View className='memoir__progress'>
        <View className='memoir__progress-track'>
          <View className='memoir__progress-bar' />
        </View>
        <Text className='memoir__progress-pct'>进行中</Text>
      </View>
      <Text className='memoir__gen-text'>AI 正在编排你的回忆…</Text>
      <View className='memoir__gen-hint'>
        <Text className='memoir__gen-hint-icon'>⏱️</Text>
        <Text className='memoir__gen-hint-text'>预计 5-15 分钟，生成后自动提醒</Text>
      </View>
      <Text className='memoir__gen-status'>{loadingText}</Text>
    </View>
  )

  // ==================== 渲染：预览（step 2，Ken Burns） ====================

  const renderPreview = () => (
    <View className='xhh-card memoir__panel'>
      <Text className='memoir__section-title'>预览效果</Text>
      <View className='memoir__cover'>
        <Canvas
          id='memoirCanvas'
          className='memoir__preview-canvas'
          type='2d'
          ref={canvasRef}
        />
      </View>
      <View className='memoir__preview-info'>
        <Text className='memoir__preview-icon'>🎵</Text>
        <View className='memoir__preview-texts'>
          <Text className='memoir__preview-text'>
            BGM：{BGM_OPTIONS.find(b => b.key === selectedBGM)?.name || selectedBGM}
          </Text>
          <Text className='memoir__preview-label'>
            风格：{STYLE_OPTIONS.find(s => s.key === selectedStyle)?.name || selectedStyle}
          </Text>
        </View>
      </View>
    </View>
  )

  // ==================== 渲染：预览保存卡（step 3，结果） ====================

  const renderResult = () => (
    <View className='xhh-card memoir__panel'>
      <Text className='memoir__section-title'>预览保存</Text>
      <View className='memoir__cover' onClick={handlePlayVideo}>
        {outputUrl ? (
          <Image className='memoir__cover-image' src={outputUrl} mode='aspectFill' />
        ) : (
          <View className='memoir__cover-placeholder'>
            <Text className='memoir__cover-placeholder-icon'>📸</Text>
            <Text className='memoir__cover-placeholder-text'>回忆录已生成</Text>
          </View>
        )}
        <View className='memoir__cover-play'>
          <View className='memoir__cover-play-btn'>
            <Text className='memoir__cover-play-icon'>▶</Text>
          </View>
        </View>
        <View className='memoir__cover-duration'>
          <Text className='memoir__cover-duration-text'>15-30 秒</Text>
        </View>
      </View>

      <View className='memoir__result-actions'>
        <View className='memoir__btn memoir__btn--primary' onClick={handleSaveAlbum}>
          <Text className='memoir__btn-text'>⬇️ 保存到相册</Text>
        </View>
        <View className='memoir__btn memoir__btn--ghost' onClick={handleSaveToTimeline}>
          <Text className='memoir__btn-text--ghost'>💾 保存到时光线</Text>
        </View>
        <View className='memoir__btn memoir__btn--ghost' onClick={handleShare}>
          <Text className='memoir__btn-text--ghost'>📤 分享</Text>
        </View>
        <View className='memoir__btn memoir__btn--ghost' onClick={handleReset}>
          <Text className='memoir__btn-text--ghost'>🔄 重新生成</Text>
        </View>
      </View>
    </View>
  )

  // ==================== 底部按钮 ====================

  const renderFooter = () => {
    if (step === 0) {
      return (
        <View
          className={`memoir__btn memoir__btn--primary${photos.length === 0 ? ' memoir__btn--disabled' : ''}`}
          onClick={photos.length > 0 ? () => goToStep(1) : undefined}
        >
          <Text className='memoir__btn-text'>下一步</Text>
        </View>
      )
    }

    if (step === 1) {
      return (
        <View className='memoir__btn memoir__btn--primary' onClick={() => goToStep(2)}>
          <Text className='memoir__btn-text'>下一步：预览</Text>
        </View>
      )
    }

    if (step === 2) {
      return (
        <View className='memoir__btn memoir__btn--primary' onClick={handleGenerate}>
          <Text className='memoir__btn-text'>生成回忆录</Text>
        </View>
      )
    }

    return null
  }

  // ==================== 主渲染 ====================

  return (
    <View className={`memoir ${themeClass}`}>
      {/* 标题区 */}
      <View className='memoir__head'>
        <Text className='memoir__title'>宠物回忆录</Text>
        <Text className='memoir__subtitle'>把 TA 的一生，讲成一个故事</Text>
      </View>

      {/* hero 横幅 */}
      <View className='memoir__hero'>
        <View className='memoir__hero-bg'>
          <Text className='memoir__hero-emoji'>🐱</Text>
        </View>
        <View className='memoir__hero-badge'>
          <Text className='memoir__hero-badge-text'>✨ AI 时光电影</Text>
        </View>
      </View>

      {/* 双产品线卡 */}
      <View className='memoir__product-list'>
        <View
          className='memoir__product-card memoir__product-card--coral'
          onClick={() => goToStep(0)}
        >
          <View className='memoir__product-head'>
            <View className='memoir__product-icon'>✨</View>
            <View className='memoir__product-titles'>
              <Text className='memoir__product-name'>日常回忆录</Text>
              <Text className='memoir__product-price'>免费 · 月 3 次</Text>
            </View>
            <Text className='memoir__product-arrow'>›</Text>
          </View>
          <View className='memoir__product-tags'>
            <Text className='memoir__pill'>15-30 秒静图动效</Text>
            <Text className='memoir__pill'>1-3 张照片</Text>
            <Text className='memoir__pill'>温暖治愈</Text>
          </View>
        </View>

        <View className='memoir__product-card memoir__product-card--gold' onClick={handleGoVlog}>
          <View className='memoir__product-head'>
            <View className='memoir__product-icon'>🎬</View>
            <View className='memoir__product-titles'>
              <Text className='memoir__product-name'>纪念Vlog</Text>
              <Text className='memoir__product-price'>会员 ¥99 / 非会员 ¥149</Text>
            </View>
            <View className='memoir__badge-paid'>
              <Text className='memoir__badge-paid-text'>付费</Text>
            </View>
          </View>
          <View className='memoir__product-tags'>
            <Text className='memoir__pill'>45-60 秒 AI 视频</Text>
            <Text className='memoir__pill'>5-15 张照片</Text>
            <Text className='memoir__pill'>深刻催泪</Text>
          </View>
        </View>
      </View>

      {/* 步骤指示器 */}
      {renderStepIndicator()}

      <ScrollView
        className='memoir__content'
        scrollY
        enhanced
        showScrollbar={false}
        key={animKey}
      >
        {step === 0 && renderStepUpload()}
        {step === 1 && renderStepGenerate()}
        {step === 2 && (loading ? renderGenerating() : renderPreview())}
        {step === 3 && renderResult()}
      </ScrollView>

      {step < 3 && !loading && (
        <View className='memoir__footer'>
          {renderFooter()}
        </View>
      )}

      {loading && step < 3 && (
        <View className='memoir__loading-overlay'>
          {renderGenerating()}
        </View>
      )}
    </View>
  )
}
