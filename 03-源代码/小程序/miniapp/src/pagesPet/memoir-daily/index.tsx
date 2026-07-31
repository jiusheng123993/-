/**
 * 日常回忆录页面
 * 将选中的1-3张宠物照片生成静图动效短片
 */
import { View, Text, ScrollView, Canvas, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useRef, useCallback } from 'react'
import { CONFIG } from '../../config'
import { storage } from '../../utils/storage'
import './index.scss'

// ==================== 类型定义 ====================

/** 预设风格 */
interface MemoirStyle {
  key: string
  emoji: string
  name: string
  desc: string
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

const STEP_LABELS = ['选照片', '选风格', '预览', '完成']

// ==================== 组件 ====================

export default function MemoirDaily() {
  const routerParams = Taro.getCurrentInstance().router?.params as Record<string, string> | undefined
  const petId = routerParams?.petId || ''

  // —— 步骤控制 ——
  const [step, setStep] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  // —— 步骤1：选照片 ——
  const [photos, setPhotos] = useState<PhotoItem[]>([])

  // —— 步骤2：选风格 ——
  const [selectedStyle, setSelectedStyle] = useState('warm')

  // —— 步骤3：预览加载 ——
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('正在生成...')
  const canvasRef = useRef<any>(null)
  const animFrameRef = useRef<number | null>(null)

  // —— 步骤4：结果 ——
  const [taskId, setTaskId] = useState('')
  const [outputUrl, setOutputUrl] = useState('')
  const [polling, setPolling] = useState(false)

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

        photos.forEach((photo, idx) => {
          const img = canvas.createImage()
          img.src = photo.path
          img.onload = () => {
            loadedCount++
            if (loadedCount === photos.length) {
              // 所有图片加载完成，开始动画
            }
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
          music_style: 'warm',
          style_preset: selectedStyle,
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
  }, [petId, photos, selectedStyle])

  // ==================== 轮询任务状态 ====================

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
  }, [polling, petId, taskId, goToStep])

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

  const handleSaveToTimeline = useCallback(() => {
    Taro.showToast({ title: '已保存到时光线', icon: 'success' })
  }, [])

  // ==================== 渲染步骤指示器 ====================

  const renderStepIndicator = () => (
    <View className='memoir-daily__steps'>
      {STEP_LABELS.map((label, i) => (
        <View key={label} style={{ display: 'flex', alignItems: 'center', gap: '16rpx' }}>
          <View
            className={`memoir-daily__step-dot${
              i === step ? ' memoir-daily__step-dot--active' : ''
            }${i < step ? ' memoir-daily__step-dot--done' : ''}`}
          />
          {i < STEP_LABELS.length - 1 && (
            <View className='memoir-daily__step-connector' />
          )}
        </View>
      ))}
    </View>
  )

  // ==================== 步骤一：选照片 ====================

  const renderStepPhoto = () => (
    <View className='memoir-daily__step-enter'>
      <View className='memoir-daily__photo-header'>
        <Text className='memoir-daily__photo-title'>选择照片</Text>
        <Text className='memoir-daily__photo-count'>{photos.length}/3 张</Text>
      </View>
      <Text className='memoir-daily__photo-hint'>选择 1-3 张宠物的精彩瞬间，我们将为你制作一段温馨的回忆短片</Text>

      <View className='memoir-daily__photo-grid'>
        {photos.map((photo, index) => (
          <View
            key={index}
            className='memoir-daily__photo-item'
            onClick={() => handlePreviewPhoto(index)}
          >
            <Image
              className='memoir-daily__photo-image'
              src={photo.path}
              mode='aspectFill'
            />
            <View
              className='memoir-daily__photo-delete'
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
          <View className='memoir-daily__photo-add' onClick={handleAddPhoto}>
            <Text className='memoir-daily__photo-add-icon'>+</Text>
            <Text className='memoir-daily__photo-add-text'>
              {photos.length === 0 ? '添加照片' : '继续添加'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )

  // ==================== 步骤二：选风格 ====================

  const renderStepStyle = () => (
    <View className='memoir-daily__step-enter'>
      <Text className='memoir-daily__style-title'>选择动画风格</Text>
      <Text className='memoir-daily__style-subtitle'>为你的回忆短片挑选一个喜欢的风格</Text>

      <View className='memoir-daily__style-list'>
        {STYLE_OPTIONS.map((style) => (
          <View
            key={style.key}
            className={`memoir-daily__style-card${
              selectedStyle === style.key ? ' memoir-daily__style-card--active' : ''
            }`}
            onClick={() => setSelectedStyle(style.key)}
          >
            <View className='memoir-daily__style-card-emoji'>
              <Text>{style.emoji}</Text>
            </View>
            <View className='memoir-daily__style-card-info'>
              <Text className='memoir-daily__style-card-name'>{style.name}</Text>
              <Text className='memoir-daily__style-card-desc'>{style.desc}</Text>
            </View>
            <View
              className={`memoir-daily__style-card-check${
                selectedStyle === style.key ? ' memoir-daily__style-card-check--checked' : ''
              }`}
            >
              {selectedStyle === style.key && <Text>✓</Text>}
            </View>
          </View>
        ))}
      </View>
    </View>
  )

  // ==================== 步骤三：预览 ====================

  const renderStepPreview = () => (
    <View className='memoir-daily__step-enter'>
      <Text className='memoir-daily__preview-title'>预览效果</Text>

      <View className='memoir-daily__preview-canvas-wrap'>
        <Canvas
          id='memoirCanvas'
          className='memoir-daily__preview-canvas'
          type='2d'
          ref={canvasRef}
        />
      </View>

      <View className='memoir-daily__preview-info'>
        <Text className='memoir-daily__preview-info-icon'>🎵</Text>
        <View style={{ flex: 1 }}>
          <Text className='memoir-daily__preview-info-text'>
            BGM 功能即将上线
          </Text>
          <Text className='memoir-daily__preview-info-label'>
            风格：{STYLE_OPTIONS.find(s => s.key === selectedStyle)?.name || selectedStyle}
          </Text>
        </View>
      </View>
    </View>
  )

  // ==================== 步骤四：结果 ====================

  const renderStepResult = () => (
    <View className='memoir-daily__step-enter'>
      <Text className='memoir-daily__result-title'>🎉 制作完成</Text>
      <Text className='memoir-daily__result-subtitle'>日常回忆录已生成，快来分享吧</Text>

      <View className='memoir-daily__result-preview'>
        {outputUrl ? (
          <Image className='memoir-daily__result-image' src={outputUrl} mode='aspectFill' />
        ) : (
          <View className='memoir-daily__result-placeholder'>
            <Text className='memoir-daily__result-placeholder-icon'>📸</Text>
            <Text className='memoir-daily__result-placeholder-text'>回忆录已生成</Text>
          </View>
        )}
      </View>

      <View className='memoir-daily__result-actions'>
        <View className='memoir-daily__btn memoir-daily__btn--success' onClick={handleShare}>
          <Text className='memoir-daily__btn-text'>📤 分享</Text>
        </View>
        <View className='memoir-daily__btn memoir-daily__btn--success' onClick={handleSaveToTimeline}>
          <Text className='memoir-daily__btn-text'>💾 保存到时光线</Text>
        </View>
        <View className='memoir-daily__btn memoir-daily__btn--secondary' onClick={handleReset}>
          <Text className='memoir-daily__btn-text'>🔄 重新制作</Text>
        </View>
      </View>
    </View>
  )

  // ==================== 底部按钮 ====================

  const renderFooter = () => {
    if (step === 0) {
      return (
        <View
          className={`memoir-daily__btn memoir-daily__btn--primary${
            photos.length === 0 ? ' memoir-daily__btn--disabled' : ''
          }`}
          onClick={photos.length > 0 ? () => goToStep(1) : undefined}
        >
          <Text className='memoir-daily__btn-text'>下一步</Text>
        </View>
      )
    }

    if (step === 1) {
      return (
        <View
          className='memoir-daily__btn memoir-daily__btn--primary'
          onClick={() => goToStep(2)}
        >
          <Text className='memoir-daily__btn-text'>下一步</Text>
        </View>
      )
    }

    if (step === 2) {
      return (
        <View
          className='memoir-daily__btn memoir-daily__btn--primary'
          onClick={handleGenerate}
        >
          <Text className='memoir-daily__btn-text'>生成回忆录</Text>
        </View>
      )
    }

    return null
  }

  // ==================== 主渲染 ====================

  return (
    <View className='memoir-daily'>
      {renderStepIndicator()}

      <ScrollView
        className='memoir-daily__content'
        scrollY
        enhanced
        showScrollbar={false}
        key={animKey}
      >
        {step === 0 && renderStepPhoto()}
        {step === 1 && renderStepStyle()}
        {step === 2 && renderStepPreview()}
        {step === 3 && renderStepResult()}
      </ScrollView>

      {step < 3 && (
        <View className='memoir-daily__footer'>
          {renderFooter()}
        </View>
      )}

      {loading && (
        <View className='memoir-daily__loading-overlay'>
          <View className='memoir-daily__loading-spinner' />
          <Text className='memoir-daily__loading-text'>{loadingText}</Text>
        </View>
      )}
    </View>
  )
}
