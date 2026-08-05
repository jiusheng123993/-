/**
 * 宠物形象定制页面（按高保真原型 1:1 重构）
 * 当前形象展示 → 风格切换 → 表情系统 → 应用场景 → 生成新形象面板
 * 保留完整业务：2D/3D 生成任务、会员配额、照片上传、形象保存
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
import { EXPRESSION_MAP, type PetExpression } from '../../engines/petAvatar'
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

// 画风预览（原型 4 风格，纯展示交互）
type StylePreviewKey = 'q' | 'watercolor' | 'pixel' | 'lineart'
const STYLE_PREVIEWS: Array<{ key: StylePreviewKey; label: string; icon: string }> = [
  { key: 'q', label: 'Q版', icon: '🐾' },
  { key: 'watercolor', label: '水彩', icon: '🎨' },
  { key: 'pixel', label: '像素', icon: '👾' },
  { key: 'lineart', label: '线稿', icon: '✏️' },
]

// 表情系统（原型 2x2，映射到表情引擎）
const EXPR_OPTIONS: Array<{ key: PetExpression; label: string; desc: string; icon: string }> = [
  { key: 'happy', label: '开心', desc: '尾巴翘起来啦', icon: '😊' },
  { key: 'excited', label: '撒娇', desc: '蹭蹭求抱抱', icon: '🥰' },
  { key: 'anxious', label: '生气', desc: '耳朵都竖起来', icon: '😤' },
  { key: 'sleepy', label: '困倦', desc: '要睡觉觉了', icon: '😴' },
]

type TabType = 'text' | 'photo'

/** 计算年龄（岁/月） */
function calcAge(birthDate?: string): string {
  if (!birthDate) return '年龄未知'
  const birth = new Date(birthDate.replace(/-/g, '/'))
  if (Number.isNaN(birth.getTime())) return '年龄未知'
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months -= 1
  if (months < 0) months = 0
  if (months < 12) return `${months}个月`
  return `${Math.floor(months / 12)}岁${months % 12 ? `${months % 12}个月` : ''}`
}

export default function AvatarCustomizePage() {
  const themeClass = useThemeClass()
  const { currentPet } = usePetStore()
  const { isMember } = useMembership()
  const { trackPageView, trackEvent } = useAnalytics()

  const [activeTab, setActiveTab] = useState<TabType>('text')
  const [showPanel, setShowPanel] = useState(false)
  const [previewStyle, setPreviewStyle] = useState<StylePreviewKey>('q')
  const [selectedExpr, setSelectedExpr] = useState<PetExpression>('happy')

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

  // 当前展示形象（优先生成结果 → 已保存形象 → 默认卡通脸）
  const previewUrl = useMemo(() => {
    if (isGenerating) return null
    if (generatedUrl) return generatedUrl
    const custom = getAvatarCustomization()
    return custom?.cartoonUrl || null
  }, [isGenerating, generatedUrl])

  // 形象卡副标题：品种 · 年龄 · 状态
  const petDesc = useMemo(() => {
    const speciesLabel = species === 'cat' ? '猫咪' : '狗狗'
    const breed = currentPet?.breed || speciesLabel
    const age = calcAge(currentPet?.birthDate)
    const status = currentPet?.isDeceased ? '永远的宝贝' : '元气满满'
    return `${breed} · ${age} · ${status}`
  }, [species, currentPet])

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
        if (res.confirm) Taro.navigateTo({ url: '/pages/member/index' })
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
      const result = await generateAvatarImage(petId, species, petName, selectedStyle, undefined, selectedColor)
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
            if (res.confirm) Taro.navigateTo({ url: '/pages/member/index' })
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

  /** 应用场景：保存为头像 */
  const handleApplyAvatar = useCallback(() => {
    const url = generatedUrl || existingCustom?.cartoonUrl
    if (!url) {
      Taro.showToast({ title: '请先生成形象', icon: 'none' })
      return
    }
    trackEvent('apply_avatar')
    saveAvatarCustomization({
      species,
      style: selectedStyle,
      baseColor: selectedColor,
      generatedAt: new Date().toISOString(),
      cartoonUrl: url,
    }).then(() => {
      Taro.showToast({ title: '已设为头像', icon: 'success' })
      setTimeout(() => safeNavigateBack(), 1200)
    }).catch(() => {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    })
  }, [generatedUrl, existingCustom, species, selectedStyle, selectedColor, trackEvent])

  /** 应用场景：保存聊天贴纸到相册 */
  const handleSaveSticker = useCallback(() => {
    const url = generatedUrl || existingCustom?.cartoonUrl
    if (!url) {
      Taro.showToast({ title: '请先生成形象', icon: 'none' })
      return
    }
    trackEvent('save_avatar_sticker')
    Taro.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode !== 200) {
          Taro.showToast({ title: '贴纸保存失败', icon: 'none' })
          return
        }
        Taro.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => Taro.showToast({ title: '贴纸已保存到相册', icon: 'success' }),
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
      fail: () => Taro.showToast({ title: '贴纸保存失败', icon: 'none' }),
    })
  }, [generatedUrl, existingCustom, trackEvent])

  /** 应用场景：跳转分享卡片 */
  const handleGoShareCard = useCallback(() => {
    Taro.navigateTo({ url: '/pagesPet/share-card/index' })
  }, [])

  return (
    <View className={`avatar-customize ${themeClass}`}>
      {/* 1. 当前形象展示卡 */}
      <View className='xhh-card avatar-stage'>
        <View className='avatar-stage__head'>
          <Text className='avatar-stage__badge'>当前形象</Text>
          <Text className='avatar-stage__style-tag'>Q版 · {petName}</Text>
        </View>
        <View className={`avatar-stage__img avatar-stage__frame--${previewStyle}`}>
          {isGenerating ? (
            <View className='avatar-stage__loading'>
              <View className='avatar-stage__spinner' />
              <Text className='avatar-stage__loading-text'>AI 正在生成专属形象...</Text>
            </View>
          ) : previewUrl ? (
            <Image className='avatar-stage__photo' src={previewUrl} mode='aspectFit' lazyLoad />
          ) : (
            <PetAvatar
              species={species}
              petName={petName}
              expressionContext={expressionContext}
              customExpression={EXPRESSION_MAP[selectedExpr]}
              size={230}
            />
          )}
        </View>
        <Text className='avatar-stage__name'>{petName}</Text>
        <Text className='avatar-stage__desc'>{petDesc}</Text>
      </View>

      {/* 2. 风格切换 */}
      <View className='xhh-card avatar-style'>
        <View className='avatar-style__head'>
          <Text className='avatar-style__title'>风格</Text>
          <Text className='avatar-style__hint'>换一种画风</Text>
        </View>
        <View className='avatar-style__grid'>
          {STYLE_PREVIEWS.map(style => (
            <View
              key={style.key}
              className={`avatar-style__chip ${previewStyle === style.key ? 'avatar-style__chip--active' : ''}`}
              onClick={() => setPreviewStyle(style.key)}
            >
              <Text className='avatar-style__chip-icon'>{style.icon}</Text>
              <Text className='avatar-style__chip-label'>{style.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 3. 表情系统 2x2 */}
      <View className='xhh-card avatar-expr'>
        <View className='avatar-expr__head'>
          <Text className='avatar-expr__title'>表情</Text>
          <Text className='avatar-expr__hint'>点一点看变化</Text>
        </View>
        <View className='avatar-expr__grid'>
          {EXPR_OPTIONS.map(expr => (
            <View
              key={expr.key}
              className={`avatar-expr__card ${selectedExpr === expr.key ? 'avatar-expr__card--active' : ''}`}
              onClick={() => setSelectedExpr(expr.key)}
            >
              <View className='avatar-expr__icon'>{expr.icon}</View>
              <View className='avatar-expr__info'>
                <Text className='avatar-expr__label'>{expr.label}</Text>
                <Text className='avatar-expr__desc'>{expr.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 4. 形象应用场景 */}
      <View className='avatar-scenes'>
        <View className='avatar-scenes__item' onClick={handleApplyAvatar}>
          <View className='avatar-scenes__icon avatar-scenes__icon--coral'>👤</View>
          <Text className='avatar-scenes__label'>头像</Text>
        </View>
        <View className='avatar-scenes__item' onClick={handleSaveSticker}>
          <View className='avatar-scenes__icon avatar-scenes__icon--gold'>🎨</View>
          <Text className='avatar-scenes__label'>聊天贴纸</Text>
        </View>
        <View className='avatar-scenes__item' onClick={handleGoShareCard}>
          <View className='avatar-scenes__icon avatar-scenes__icon--teal'>📤</View>
          <Text className='avatar-scenes__label'>分享卡片</Text>
        </View>
      </View>

      {/* 5. 生成新形象按钮 */}
      <View className='avatar-gen-btn' onClick={() => setShowPanel(v => !v)}>
        <Text className='avatar-gen-btn__icon'>✨</Text>
        <Text className='avatar-gen-btn__text'>{showPanel ? '收起生成面板' : '生成新形象'}</Text>
      </View>

      {/* 6. 生成面板（保留原文字/照片双 Tab 业务） */}
      {showPanel && (
        <View className='avatar-panel'>
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
      )}
    </View>
  )
}
