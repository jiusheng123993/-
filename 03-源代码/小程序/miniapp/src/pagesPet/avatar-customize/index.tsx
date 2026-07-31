/**
 * 宠物形象定制页面
 * 宠物虚拟形象生成、装饰搭配
 */
import { View, Text, Image } from '@tarojs/components'
import { useState, useMemo, useCallback, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useThemeClass } from '../../hooks/useThemeClass'
import { useAvatar2DTask } from '../../hooks/useAvatar2DTask'
import { useAvatar3DTask } from '../../hooks/useAvatar3DTask'
import { safeNavigateBack } from '../../utils/navigation'
import PetAvatar from '../../components/PetAvatar'
import PhotoUploader from '../../components/PetAvatar/PhotoUploader'
import ImageGallery from '../../components/PetAvatar/ImageGallery'
import Model3DViewer from '../../components/PetAvatar/Model3DViewer'
import GenerationProgress from '../../components/PetAvatar/GenerationProgress'
import {
  generateAvatarImage,
  getAvatarCustomization,
  saveAvatarCustomization,
  canGenerateAvatar,
  getGenerationCount,
  uploadPetPhoto,
  generate2DAvatar,
  generate3DAvatar,
  getAvatar2DImages,
  getAvatar3DModel,
  canGeneratePhoto,
  getPhotoGenerationCount,
  canGenerate3D,
  getAvatarQuota,
} from '../../services/avatarService'
import { usePetStore } from '../../stores/petStore'
import { useMembership } from '../../hooks/useMembership'
import { useAnalytics } from '../../hooks/useAnalytics'
import type { ExpressionContext, PetSpecies, Avatar2DImage, AvatarQuota } from '../../types/avatarTypes'
import './index.scss'

const STYLE_OPTIONS: Array<{ value: 'cartoon' | 'realistic'; label: string; desc: string }> = [
  { value: 'cartoon', label: '卡通风格', desc: '可爱萌趣' },
  { value: 'realistic', label: '写实风格', desc: '真实细腻' },
]

const BASE_COLORS = [
  { value: '#FFD93D', label: '暖阳金' },
  { value: '#FF8C42', label: '活力橙' },
  { value: '#6BCB77', label: '清新绿' },
  { value: '#4D96FF', label: '天空蓝' },
  { value: '#FF6B6B', label: '甜蜜粉' },
  { value: '#9B8EC4', label: '梦幻紫' },
  { value: '#FFF8E7', label: '奶白色' },
  { value: '#2C3E50', label: '酷黑色' },
]

type TabType = 'text' | 'photo'

export default function AvatarCustomizePage() {
  const themeClass = useThemeClass()
  const { currentPet } = usePetStore()
  const { isMember } = useMembership()
  const { trackPageView, trackEvent } = useAnalytics()

  const [activeTab, setActiveTab] = useState<TabType>('text')

  const species = (currentPet?.species || 'dog') as PetSpecies
  const petName = currentPet?.name || '毛孩子'
  const petId = currentPet?.id || ''

  const task2D = useAvatar2DTask(petId)
  const task3D = useAvatar3DTask(petId)

  const [selectedStyle, setSelectedStyle] = useState<'cartoon' | 'realistic'>('cartoon')
  const [selectedColor, setSelectedColor] = useState('#FFD93D')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [genCount, setGenCount] = useState(getGenerationCount())

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [photoStyle, setPhotoStyle] = useState<'cartoon' | 'realistic'>('cartoon')
  const [serverQuota, setServerQuota] = useState<AvatarQuota | null>(null)

  useEffect(() => {
    trackPageView('avatar_customize')
  }, [trackPageView])

  const expressionContext = useMemo((): ExpressionContext => ({
    todayEntry: null,
    hasAnomaly: false,
    anomalyCount: 0,
    riskLevel: null,
    streakDays: 0,
    isBirthday: false,
    isVaccineComplete: false,
    isRecovery: false,
    isDeceased: false,
  }), [])

  const canGenerate = useMemo(() => {
    if (serverQuota) {
      return serverQuota.isMember || serverQuota.generation2D.used < serverQuota.generation2D.limit
    }
    return canGenerateAvatar(isMember)
  }, [serverQuota, isMember, genCount])

  const canGenPhoto = useMemo(() => {
    if (serverQuota) {
      return serverQuota.isMember || serverQuota.generation2D.used < serverQuota.generation2D.limit
    }
    return canGeneratePhoto(isMember)
  }, [serverQuota, isMember])

  const canGen3D = useMemo(() => {
    if (serverQuota) {
      return serverQuota.isMember && serverQuota.generation3D.used < serverQuota.generation3D.limit
    }
    return canGenerate3D(isMember)
  }, [serverQuota, isMember])

  const textQuotaText = useMemo(() => {
    if (serverQuota) {
      if (serverQuota.isMember) return '会员无限生成'
      const remaining = Math.max(0, serverQuota.generation2D.limit - serverQuota.generation2D.used)
      return `剩余次数：${remaining}/${serverQuota.generation2D.limit}`
    }
    return isMember ? '会员无限生成' : `剩余次数：${Math.max(0, 1 - genCount)}/1`
  }, [serverQuota, isMember, genCount])

  const photoQuotaText = useMemo(() => {
    if (serverQuota) {
      if (serverQuota.isMember) return '会员无限生成'
      const remaining = Math.max(0, serverQuota.generation2D.limit - serverQuota.generation2D.used)
      return `剩余照片生成次数：${remaining}/${serverQuota.generation2D.limit}`
    }
    return isMember ? '会员无限生成' : `剩余照片生成次数：${Math.max(0, 1 - getPhotoGenerationCount())}/1`
  }, [serverQuota, isMember])

  useEffect(() => {
    if (!petId) return
    let cancelled = false

    const loadExisting = async () => {
      try {
        const [pack2D, result3D, quota] = await Promise.all([
          getAvatar2DImages(petId),
          getAvatar3DModel(petId),
          getAvatarQuota(),
        ])
        if (cancelled) return

        if (pack2D.task) {
          task2D.restoreFromTask(pack2D.task, pack2D)
        }

        if (result3D.task) {
          task3D.restoreFromTask(result3D.task, result3D)
        }

        if (quota) {
          setServerQuota(quota)
        }
      } catch {
        // 加载失败静默处理
      }
    }

    loadExisting()
    return () => { cancelled = true }
  }, [petId]) // eslint-disable-line react-hooks/exhaustive-deps

  const showMemberGuide = useCallback((content: string) => {
    Taro.showModal({
      title: '开通会员',
      content,
      confirmText: '去开通',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) Taro.switchTab({ url: '/pages/member/index' })
      },
    })
  }, [])

  const handlePhotoChange = useCallback(async (path: string) => {
    setPhotoUrl(path)
    if (!path) {
      setUploadedPhotoUrl(null)
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadPetPhoto(petId, path)
      if (result.success && result.data?.url) {
        setUploadedPhotoUrl(result.data.url)
      } else {
        Taro.showToast({ title: result.message || '上传失败', icon: 'none' })
        setPhotoUrl(null)
      }
    } catch {
      Taro.showToast({ title: '上传失败，请重试', icon: 'none' })
      setPhotoUrl(null)
    } finally {
      setIsUploading(false)
    }
  }, [petId])

  const handleGenerate2D = useCallback(async () => {
    if (!uploadedPhotoUrl) return

    if (!canGenPhoto) {
      showMemberGuide('免费用户每月仅可生成 1 次 2D 形象，开通会员可无限生成')
      return
    }

    trackEvent('generate_2d_avatar_photo', { style: photoStyle })
    try {
      const result = await generate2DAvatar(petId, uploadedPhotoUrl, photoStyle)
      if (result.success && result.data?.taskId) {
        task2D.startPolling(result.data.taskId)
      } else {
        Taro.showToast({ title: result.message || '创建生成任务失败', icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    }
  }, [uploadedPhotoUrl, canGenPhoto, petId, photoStyle, trackEvent, task2D, showMemberGuide])

  const handleGenerate3D = useCallback(async () => {
    if (!task2D.taskId || task3D.isGenerating) return

    if (!canGen3D) {
      if (!isMember) {
        showMemberGuide('3D 模型生成仅限会员使用，开通会员每月可生成 3 次')
      } else {
        Taro.showToast({ title: '本月 3D 生成次数已用完，请下月再试', icon: 'none' })
      }
      return
    }

    trackEvent('generate_3d_model')
    try {
      const result = await generate3DAvatar(petId, task2D.taskId)
      if (result.success && result.data?.taskId) {
        task3D.startPolling(result.data.taskId)
      } else {
        Taro.showToast({ title: result.message || '创建 3D 任务失败', icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '3D 生成失败，请重试', icon: 'none' })
    }
  }, [task2D.taskId, task3D.isGenerating, petId, trackEvent, task3D, showMemberGuide, canGen3D, isMember])

  const handleSaveAsAvatar = useCallback(async (image: Avatar2DImage) => {
    trackEvent('save_photo_avatar')
    try {
      await saveAvatarCustomization({
        species,
        style: photoStyle,
        baseColor: '#FFD93D',
        generatedAt: new Date().toISOString(),
        cartoonUrl: image.imageUrl,
      })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => safeNavigateBack(), 1500)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }, [species, photoStyle, trackEvent])

  const handleTextGenerate = useCallback(async () => {
    if (!canGenerate || isGenerating) return
    trackEvent('generate_avatar', { style: selectedStyle, species })
    setIsGenerating(true)
    try {
      const result = await generateAvatarImage(species, petName, selectedStyle, undefined, selectedColor)
      if (result?.success && result.imageUrl) {
        setGeneratedUrl(result.imageUrl)
        setGenCount(getGenerationCount())
        trackEvent('generate_avatar_success', { style: selectedStyle })
        Taro.showToast({ title: '生成成功', icon: 'success' })
      } else if (!canGenerateAvatar(isMember)) {
        Taro.showModal({
          title: '生成次数已用完',
          content: '免费用户仅可生成1次，开通会员可无限生成',
          confirmText: '开通会员',
          success: (res) => {
            if (res.confirm) Taro.switchTab({ url: '/pages/member/index' })
          },
        })
      } else {
        Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
      }
    } catch {
      trackEvent('generate_avatar_failure')
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      setIsGenerating(false)
    }
  }, [canGenerate, isGenerating, species, petName, selectedStyle, selectedColor, isMember, trackEvent])

  const handleTextSave = useCallback(async () => {
    if (!generatedUrl) return
    trackEvent('save_avatar')
    try {
      await saveAvatarCustomization({
        species,
        style: selectedStyle,
        baseColor: selectedColor,
        generatedAt: new Date().toISOString(),
        cartoonUrl: generatedUrl,
      })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => safeNavigateBack(), 1500)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }, [generatedUrl, species, selectedStyle, selectedColor, trackEvent])

  const handle2DRetry = useCallback(() => {
    task2D.reset()
    handleGenerate2D()
  }, [task2D, handleGenerate2D])

  const existingCustom = useMemo(() => getAvatarCustomization(), [])

  return (
    <View className={`avatar-customize ${themeClass}`}>
      {/* Tab 切换 */}
      <View className='avatar-customize__tabs'>
        <View
          className={`avatar-customize__tab ${activeTab === 'text' ? 'avatar-customize__tab--active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          <Text className='avatar-customize__tab-text'>文字描述生成</Text>
        </View>
        <View
          className={`avatar-customize__tab ${activeTab === 'photo' ? 'avatar-customize__tab--active' : ''}`}
          onClick={() => setActiveTab('photo')}
        >
          <Text className='avatar-customize__tab-text'>照片生成</Text>
        </View>
      </View>

      {/* Tab 1: 文字描述生成 */}
      {activeTab === 'text' && (
        <>
          <View className='avatar-customize__preview'>
            {isGenerating ? (
              <View className='avatar-customize__generating'>
                <View className='avatar-customize__generating-spinner' />
                <Text className='avatar-customize__generating-text'>AI 正在为你生成专属形象...</Text>
              </View>
            ) : generatedUrl ? (
              <Image className='avatar-customize__generated-img' src={generatedUrl} mode='aspectFit' />
            ) : (
              <PetAvatar species={species} petName={petName} expressionContext={expressionContext} size={160} showLabel />
            )}
          </View>

          <View className='avatar-customize__section'>
            <Text className='avatar-customize__section-title'>风格选择</Text>
            <View className='avatar-customize__style-options'>
              {STYLE_OPTIONS.map(opt => (
                <View
                  key={opt.value}
                  className={`avatar-customize__style-item ${selectedStyle === opt.value ? 'avatar-customize__style-item--active' : ''}`}
                  onClick={() => setSelectedStyle(opt.value)}
                >
                  <Text className='avatar-customize__style-label'>{opt.label}</Text>
                  <Text className='avatar-customize__style-desc'>{opt.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='avatar-customize__section'>
            <Text className='avatar-customize__section-title'>基础配色</Text>
            <View className='avatar-customize__color-options'>
              {BASE_COLORS.map(color => (
                <View
                  key={color.value}
                  className={`avatar-customize__color-item ${selectedColor === color.value ? 'avatar-customize__color-item--active' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                >
                  {selectedColor === color.value && <Text className='avatar-customize__color-check'>✓</Text>}
                </View>
              ))}
            </View>
          </View>

          <View className='avatar-customize__quota'>
            <Text className='avatar-customize__quota-text'>
              {textQuotaText}
            </Text>
          </View>

          <View className='avatar-customize__actions'>
            {!generatedUrl ? (
              <View
                className={`avatar-customize__btn ${!canGenerate ? 'avatar-customize__btn--disabled' : ''}`}
                onClick={handleTextGenerate}
              >
                <Text className='avatar-customize__btn-text'>生成头像</Text>
              </View>
            ) : (
              <View className='avatar-customize__btn-group'>
                <View className='avatar-customize__btn avatar-customize__btn--secondary' onClick={() => setGeneratedUrl(null)}>
                  <Text className='avatar-customize__btn-text'>重新生成</Text>
                </View>
                <View className='avatar-customize__btn' onClick={handleTextSave}>
                  <Text className='avatar-customize__btn-text'>保存头像</Text>
                </View>
              </View>
            )}
          </View>
        </>
      )}

      {/* Tab 2: 照片生成 */}
      {activeTab === 'photo' && (
        <>
          <View className='avatar-customize__section'>
            <Text className='avatar-customize__section-title'>上传宠物照片</Text>
            <PhotoUploader value={photoUrl} onChange={handlePhotoChange} disabled={isUploading} />
          </View>

          <View className='avatar-customize__section'>
            <Text className='avatar-customize__section-title'>风格选择</Text>
            <View className='avatar-customize__style-options'>
              {STYLE_OPTIONS.map(opt => (
                <View
                  key={opt.value}
                  className={`avatar-customize__style-item ${photoStyle === opt.value ? 'avatar-customize__style-item--active' : ''}`}
                  onClick={() => setPhotoStyle(opt.value)}
                >
                  <Text className='avatar-customize__style-label'>{opt.label}</Text>
                  <Text className='avatar-customize__style-desc'>{opt.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {!task2D.isProcessing && !task2D.isComplete && !task2D.isFailed && (
            <View className='avatar-customize__quota'>
              <Text className='avatar-customize__quota-text'>
                {photoQuotaText}
              </Text>
            </View>
          )}

          {!task2D.isProcessing && !task2D.isComplete && !task2D.isFailed && (
            <View className='avatar-customize__actions'>
              <View
                className={`avatar-customize__btn ${(!uploadedPhotoUrl || !canGenPhoto) ? 'avatar-customize__btn--disabled' : ''}`}
                onClick={handleGenerate2D}
              >
                <Text className='avatar-customize__btn-text'>生成 2D 形象包</Text>
              </View>
            </View>
          )}

          {(task2D.isProcessing || task2D.isFailed) && (
            <GenerationProgress
              progress={task2D.progress}
              status={task2D.status === 'pending' ? 'processing' : task2D.status}
              type='2d'
              error={task2D.error}
              onRetry={task2D.isFailed ? handle2DRetry : undefined}
            />
          )}

          {task2D.isComplete && task2D.pack.images.length > 0 && (
            <ImageGallery
              images={task2D.pack.images}
              onSaveAsAvatar={handleSaveAsAvatar}
              onGenerate3D={handleGenerate3D}
              isGenerating3D={task3D.isGenerating}
              canGenerate3D={canGen3D}
            />
          )}

          {(task3D.isProcessing || task3D.isFailed) && (
            <GenerationProgress
              progress={task3D.progress}
              status={task3D.status === 'pending' ? 'processing' : task3D.status}
              type='3d'
              error={task3D.error}
              onRetry={task3D.isFailed ? () => task3D.retry(petId, task2D.taskId!) : undefined}
            />
          )}

          {task3D.isComplete && task3D.result.model && (
            <Model3DViewer
              modelUrl={task3D.result.model.modelUrl}
              thumbnailUrl={task3D.result.model.thumbnailUrl}
            />
          )}

          {existingCustom && !task2D.isComplete && !task3D.isComplete && !task2D.isProcessing && !task3D.isProcessing && (
            <View className='avatar-customize__existing'>
              <Text className='avatar-customize__existing-label'>当前头像</Text>
              <Image
                className='avatar-customize__existing-img'
                src={existingCustom.cartoonUrl || ''}
                mode='aspectFit'
                lazyLoad
              />
            </View>
          )}
        </>
      )}
    </View>
  )
}
