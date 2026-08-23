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
import { getPresetsBySpecies, type AvatarPreset } from './data/avatarPresets'
import { getHomeStyleAvatarUrl } from '../../data/homeStyleAvatars'
import PresetAvatar from './PresetAvatar'
import {
  generateAvatarImage,
  generateAvatarOptions,
  getAvatarCustomization,
  saveAvatarCustomization,
  canGenerateAvatar,
  getGenerationCount,
  incrementGenerationCount,
  uploadPetPhoto,
  setPetPhotoAsAvatar,
  generate2DAvatar,
  generate3DAvatar,
  getAvatar2DImages,
  getAvatar3DModel,
  canGeneratePhoto,
  canGeneratePhotoOptions,
  getPhotoGenerationCount,
  getPhotoOptionsCount,
  incrementPhotoOptionsCount,
  canGenerate3D,
  getAvatarQuota,
  type AvatarStyleOption,
} from '../../services/avatarService'
import type { AvatarCustomization } from '../../types/avatarTypes'
import type { PetProfile } from '../../services/petService'
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
  // 多风格候选形象（5 种画风选 1，猫狗各有专属提示词）
  const [styleOptions, setStyleOptions] = useState<AvatarStyleOption[] | null>(null)
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number | null>(null)
  // 预设头像库（免费用户入口）：选中的预设 ID
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [photoStyle, setPhotoStyle] = useState<'cartoon' | 'realistic'>('cartoon')
  const [serverQuota, setServerQuota] = useState<AvatarQuota | null>(null)

  // 当前宠物物种对应的 10 张预设形象
  const presetList = useMemo(() => getPresetsBySpecies(species), [species])
  const selectedPreset = useMemo(
    () => presetList.find((item) => item.id === selectedPresetId) || null,
    [presetList, selectedPresetId],
  )

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

  // 当前展示形象（优先交互中的选择 → 宠物档案已保存的头像 → 本地缓存兜底 → 默认品牌头像）
  const previewUrl = useMemo(() => {
    if (isGenerating) return null
    if (styleOptions && selectedStyleIndex != null && styleOptions[selectedStyleIndex]) {
      return styleOptions[selectedStyleIndex].url
    }
    if (selectedPreset) return selectedPreset.image
    if (generatedUrl) return generatedUrl
    // 宠物档案是权威数据：真实照片优先于卡通/AI 形象，避免多宠物互相串头像
    if (currentPet?.avatarPhotoUrl) return currentPet.avatarPhotoUrl
    if (currentPet?.avatarCartoonUrl) return currentPet.avatarCartoonUrl
    const custom = getAvatarCustomization(petId)
    if (custom?.cartoonUrl) return custom.cartoonUrl
    // 默认形象：没有自定义头像时按品种匹配品牌小动物头像，与家庭页头像保持一致（同图同源）
    if (currentPet) return getHomeStyleAvatarUrl(currentPet)
    return null
  }, [isGenerating, generatedUrl, styleOptions, selectedStyleIndex, selectedPreset, currentPet, petId])

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

  // 照片专属多风格头像（会员每月 3 次，与服务端口径一致）
  const canGenPhotoOptions = useMemo(
    () => canGeneratePhotoOptions(isMember),
    [isMember],
  )

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
    // 照片生成（参照自家宠物）为会员专享，每月 3 次
    if (!isMember) return '照片生成仅限会员 · 每月 3 次'
    const remaining = Math.max(0, 3 - getPhotoOptionsCount())
    return `照片生成（会员）：剩余 ${remaining}/3 次`
  }, [isMember])

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
        if (res.confirm) Taro.navigateTo({ url: '/pagesUser/member/index' })
      },
    })
  }, [])

  /**
   * 把某只宠物在 petStore 里的头像字段即时合并（patch）
   * 不用 fetchPets 回读的原因：离线时 fetchPets 会从本地缓存拉旧数据覆盖 store，
   * 把刚设置的本地头像变更冲掉；在线时服务端 PUT 已返回最新档案，直接合并即可。
   * 坑点：null 值表示"清空该字段"（如保存卡通形象时清 avatarPhotoUrl）——
   * 必须删除键而不是保留旧值，否则展示优先级 photo > cartoon 会一直显示旧照片，
   * 导致"保存了卡通头像但到处还是旧照片"的不一致。
   * @param targetPetId - 宠物 ID
   * @param patch - 要合并进宠物对象的字段；null 值表示清空该字段（删除键）
   */
  const patchStorePet = useCallback((targetPetId: string, patch: Record<string, unknown>) => {
    usePetStore.setState((state) => {
      const applyPatch = (pet: PetProfile) => {
        if (pet.id !== targetPetId) return pet
        const merged: Record<string, unknown> = { ...pet }
        for (const [key, value] of Object.entries(patch)) {
          if (value === null) {
            delete merged[key]
          } else {
            merged[key] = value
          }
        }
        return merged as unknown as PetProfile
      }
      return {
        pets: state.pets.map(applyPatch),
        currentPet: state.currentPet ? applyPatch(state.currentPet) : state.currentPet,
      }
    })
  }, [])

  /**
   * 保存成功后的统一收尾：把最新头像合并进 petStore，再提示并返回
   * @param targetPetId - 宠物 ID
   * @param patch - 服务端返回的最新档案，或本地构造的头像字段补丁
   */
  const handleSaved = useCallback(async (targetPetId: string, patch: Record<string, unknown>) => {
    if (!targetPetId) {
      Taro.showToast({ title: '宠物信息缺失，保存失败', icon: 'none' })
      return
    }
    patchStorePet(targetPetId, patch)
    Taro.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => safeNavigateBack(), 1500)
  }, [patchStorePet])

  /**
   * 直接把上传/拍摄的照片设为头像（所有用户可用，免费，不消耗 AI 配额）
   */
  const handleUsePhotoAsAvatar = useCallback(async () => {
    if (!uploadedPhotoUrl) return
    trackEvent('use_photo_as_avatar', { petId })
    try {
      const result = await setPetPhotoAsAvatar(petId, uploadedPhotoUrl)
      if (result.success) {
        // 在线：服务端返回最新档案直接合并；离线：用补全后的照片地址本地合并
        const patch = result.pet ? (result.pet as unknown as Record<string, unknown>) : { avatarPhotoUrl: result.photoUrl }
        await handleSaved(petId, patch)
      } else {
        Taro.showToast({ title: '设置失败，请重试', icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '设置失败，请重试', icon: 'none' })
    }
  }, [uploadedPhotoUrl, petId, trackEvent, handleSaved])

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
      showMemberGuide('照片生成专属形象仅限会员使用，请先开通会员')
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
      const custom: AvatarCustomization = {
        species,
        style: photoStyle,
        baseColor: '#FFD93D',
        generatedAt: new Date().toISOString(),
        cartoonUrl: image.imageUrl,
      }
      const updated = await saveAvatarCustomization(custom, petId)
      // 在线用服务端最新档案合并；离线用本地定制构造补丁（同时清照片保证卡通可见）
      const patch = updated
        ? (updated as unknown as Record<string, unknown>)
        : { avatarCartoonUrl: custom.cartoonUrl, avatarStyle: custom.style, avatarPhotoUrl: null }
      await handleSaved(petId, patch)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }, [species, photoStyle, petId, trackEvent, handleSaved])

  const handleTextGenerate = useCallback(async () => {
    if (!canGenerate || isGenerating) return
    trackEvent('generate_avatar_options', { style: selectedStyle, species })
    setIsGenerating(true)
    setStyleOptions(null)
    setSelectedStyleIndex(null)
    try {
      // 一次生成 5 种画风候选（Q版萌系/日系治愈/美式卡通/水彩手绘/黏土萌宠），供用户 5 选 1
      const options = await generateAvatarOptions(petId, undefined, selectedStyle)
      if (options && options.length > 0) {
        setStyleOptions(options)
        incrementGenerationCount()
        setGenCount(getGenerationCount())
        trackEvent('generate_avatar_options_success', { style: selectedStyle, count: options.length })
        Taro.showToast({ title: '生成成功，请选择喜欢的形象', icon: 'none' })
      } else if (!canGenerateAvatar(isMember)) {
        Taro.showModal({
          title: '生成次数已用完',
          content: '免费用户仅可生成1次，开通会员可无限生成',
          confirmText: '开通会员',
          success: (res) => {
            if (res.confirm) Taro.navigateTo({ url: '/pagesUser/member/index' })
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

  /**
   * 照片生成多风格候选（带参考照片，保证形象像宠物本人）
   * @param referenceImageUrl - 已上传的照片 URL
   */
  const handleGeneratePhotoOptions = useCallback(async (referenceImageUrl: string) => {
    if (!referenceImageUrl || !canGenPhotoOptions || isGenerating) return
    if (!isMember) {
      showMemberGuide('照片生成专属形象仅限会员使用，请先开通会员')
      return
    }
    trackEvent('generate_photo_options', { style: photoStyle })
    setIsGenerating(true)
    setStyleOptions(null)
    setSelectedStyleIndex(null)
    try {
      const options = await generateAvatarOptions(petId, referenceImageUrl, photoStyle)
      if (options && options.length > 0) {
        setStyleOptions(options)
        incrementPhotoOptionsCount()
        trackEvent('generate_photo_options_success', { count: options.length })
        Taro.showToast({ title: '生成成功，请选择喜欢的形象', icon: 'none' })
      } else {
        Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
      }
    } catch (err) {
      trackEvent('generate_avatar_failure')
      // 展示服务端返回的具体原因（如"仅限会员"、"本月次数已用完"）
      Taro.showToast({ title: err instanceof Error ? err.message : '生成失败，请重试', icon: 'none' })
    } finally {
      setIsGenerating(false)
    }
  }, [canGenPhotoOptions, isGenerating, isMember, petId, photoStyle, showMemberGuide, trackEvent])

  /** 保存用户选中的候选形象并返回宠物主页 */
  const handleSaveSelectedOption = useCallback(async () => {
    if (selectedStyleIndex == null || !styleOptions || !styleOptions[selectedStyleIndex]) {
      Taro.showToast({ title: '请先选择一个形象', icon: 'none' })
      return
    }
    const option = styleOptions[selectedStyleIndex]
    trackEvent('save_avatar_option', { style: option.style })
    try {
      const custom: AvatarCustomization = {
        species,
        style: selectedStyle,
        styleVariant: option.style,
        baseColor: selectedColor,
        generatedAt: new Date().toISOString(),
        cartoonUrl: option.url,
      }
      const updated = await saveAvatarCustomization(custom, petId)
      const patch = updated
        ? (updated as unknown as Record<string, unknown>)
        : { avatarCartoonUrl: custom.cartoonUrl, avatarStyle: custom.style, avatarPhotoUrl: null }
      await handleSaved(petId, patch)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }, [selectedStyleIndex, styleOptions, species, selectedStyle, selectedColor, petId, trackEvent, handleSaved])

  /** 清空候选，允许重新生成 */
  const handleResetOptions = useCallback(() => {
    setStyleOptions(null)
    setSelectedStyleIndex(null)
  }, [])

  /** 保存选中的预设头像并返回宠物主页（免费用户主入口） */
  const handleSavePreset = useCallback(async () => {
    if (!selectedPreset) {
      Taro.showToast({ title: '请先选择一个形象', icon: 'none' })
      return
    }
    trackEvent('save_preset_avatar', { presetId: selectedPreset.id })
    try {
      const custom: AvatarCustomization = {
        species,
        style: 'cartoon',
        styleVariant: selectedPreset.id,
        baseColor: '#FFD93D',
        generatedAt: new Date().toISOString(),
        cartoonUrl: selectedPreset.image,
      }
      const updated = await saveAvatarCustomization(custom, petId)
      const patch = updated
        ? (updated as unknown as Record<string, unknown>)
        : { avatarCartoonUrl: custom.cartoonUrl, avatarStyle: custom.style, avatarPhotoUrl: null }
      await handleSaved(petId, patch)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }, [selectedPreset, species, petId, trackEvent, handleSaved])

  const handleTextSave = useCallback(async () => {
    if (!generatedUrl) return
    trackEvent('save_avatar')
    try {
      const custom: AvatarCustomization = {
        species,
        style: selectedStyle,
        baseColor: selectedColor,
        generatedAt: new Date().toISOString(),
        cartoonUrl: generatedUrl,
      }
      const updated = await saveAvatarCustomization(custom, petId)
      const patch = updated
        ? (updated as unknown as Record<string, unknown>)
        : { avatarCartoonUrl: custom.cartoonUrl, avatarStyle: custom.style, avatarPhotoUrl: null }
      await handleSaved(petId, patch)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }, [generatedUrl, species, selectedStyle, selectedColor, petId, trackEvent, handleSaved])

  const handle2DRetry = useCallback(() => {
    task2D.reset()
    handleGenerate2D()
  }, [task2D, handleGenerate2D])

  const existingCustom = useMemo(() => getAvatarCustomization(petId), [petId])

  /** 应用场景：保存为头像 */
  const handleApplyAvatar = useCallback(() => {
    // 只用"生成面板里的形象"或"已保存的卡通/AI 形象"，
    // 不能回退到本地缓存 cartoonUrl——它可能存的是照片 URL，会误写进服务端 avatarCartoonUrl
    const url = generatedUrl || currentPet?.avatarCartoonUrl
    if (!url) {
      Taro.showToast({ title: '请先生成形象', icon: 'none' })
      return
    }
    trackEvent('apply_avatar')
    const custom: AvatarCustomization = {
      species,
      style: selectedStyle,
      baseColor: selectedColor,
      generatedAt: new Date().toISOString(),
      cartoonUrl: url,
    }
    saveAvatarCustomization(custom, petId).then(async (updated) => {
      const patch = updated
        ? (updated as unknown as Record<string, unknown>)
        : { avatarCartoonUrl: custom.cartoonUrl, avatarStyle: custom.style, avatarPhotoUrl: null }
      await handleSaved(petId, patch)
    }).catch(() => {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    })
  }, [generatedUrl, currentPet, species, selectedStyle, selectedColor, petId, trackEvent, handleSaved])

  /** 应用场景：保存聊天贴纸到相册 */
  const handleSaveSticker = useCallback(() => {
    const url = generatedUrl || currentPet?.avatarCartoonUrl
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
  }, [generatedUrl, currentPet, trackEvent])

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

      {/* 1.5 预设形象库（免费用户主入口：从现成的 10 款里选，无需 AI 生成） */}
      <View className='xhh-card avatar-preset'>
        <View className='avatar-preset__head'>
          <Text className='avatar-preset__title'>预设形象 · 免费</Text>
          <Text className='avatar-preset__hint'>{species === 'cat' ? '10 款猫咪' : '10 款狗狗'}，选一个直接用</Text>
        </View>
        <View className='avatar-preset__grid'>
          {presetList.map((preset) => (
            <View
              key={preset.id}
              className={`avatar-preset__card ${selectedPresetId === preset.id ? 'avatar-preset__card--active' : ''}`}
              onClick={() => setSelectedPresetId(preset.id)}
            >
              <View className='avatar-preset__img-wrap'>
                <PresetAvatar
                  src={preset.image}
                  species={preset.species}
                  imgClass='avatar-preset__img'
                  fallbackClass='avatar-preset__fallback'
                />
                {selectedPresetId === preset.id && (
                  <View className='avatar-preset__check'>
                    <Text className='avatar-preset__check-text'>✓</Text>
                  </View>
                )}
              </View>
              <Text className='avatar-preset__label'>{preset.breed}</Text>
            </View>
          ))}
        </View>
        <View className='avatar-preset__actions'>
          <View
            className={`avatar-preset__btn ${!selectedPreset ? 'avatar-preset__btn--disabled' : ''}`}
            onClick={handleSavePreset}
          >
            <Text className='avatar-preset__btn-text'>保存所选形象</Text>
          </View>
        </View>
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
            !isMember ? (
              <View className='avatar-customize__member-only'>
                <Text className='avatar-customize__member-only-icon'>✨</Text>
                <Text className='avatar-customize__member-only-title'>AI 形象生成 · 会员专享</Text>
                <Text className='avatar-customize__member-only-desc'>AI 生成 5 种画风候选并挑选；免费用户可直接使用上方"预设形象"</Text>
                <View className='avatar-customize__member-only-btn' onClick={() => showMemberGuide('开通会员即可使用 AI 生成专属形象（文字/照片）')}>
                  <Text className='avatar-customize__member-only-btn-text'>开通会员</Text>
                </View>
              </View>
            ) : (
              <>
              <View className='avatar-customize__preview'>
                {isGenerating ? (
                  <View className='avatar-customize__generating'>
                    <View className='avatar-customize__generating-spinner' />
                    <Text className='avatar-customize__generating-text'>AI 正在为你生成专属形象...</Text>
                  </View>
                ) : styleOptions && selectedStyleIndex != null && styleOptions[selectedStyleIndex] ? (
                  <Image
                    className='avatar-customize__generated-img'
                    src={styleOptions[selectedStyleIndex].url}
                    mode='aspectFit'
                  />
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
                <View
                  className={`avatar-customize__btn ${!canGenerate ? 'avatar-customize__btn--disabled' : ''}`}
                  onClick={handleTextGenerate}
                >
                  <Text className='avatar-customize__btn-text'>生成 5 种风格头像</Text>
                </View>
              </View>
            </>
            ))}

          {/* Tab 2: 照片生成（上传/直接用照片作头像对所有用户开放，AI 生成会员专享） */}
          {activeTab === 'photo' && (
            <>
              <View className='avatar-customize__section'>
                <Text className='avatar-customize__section-title'>上传宠物照片</Text>
                <PhotoUploader value={photoUrl} onChange={handlePhotoChange} disabled={isUploading} />
              </View>

              {/* 直接把照片设为头像：免费、所有用户可用（不消耗 AI 配额） */}
              {uploadedPhotoUrl && (
                <View className='avatar-customize__section'>
                  <View className='avatar-customize__actions'>
                    <View
                      className='avatar-customize__btn avatar-customize__btn--photo-as-avatar'
                      onClick={handleUsePhotoAsAvatar}
                    >
                      <Text className='avatar-customize__btn-text'>📸 直接用此照片作头像</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* AI 照片生成：会员专享（服务端同样强制校验会员，不能只靠前端隐藏） */}
              {isMember ? (
                <>
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

                {!task2D.isProcessing && !task2D.isComplete && !task2D.isFailed && (
                  <View className='avatar-customize__actions avatar-customize__actions--spaced'>
                    <View
                      className={`avatar-customize__btn avatar-customize__btn--secondary ${(!uploadedPhotoUrl || !canGenPhotoOptions || isGenerating) ? 'avatar-customize__btn--disabled' : ''}`}
                      onClick={() => uploadedPhotoUrl && handleGeneratePhotoOptions(uploadedPhotoUrl)}
                    >
                      <Text className='avatar-customize__btn-text'>生成 5 种风格头像</Text>
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
                      src={currentPet?.avatarPhotoUrl || currentPet?.avatarCartoonUrl || existingCustom.cartoonUrl || ''}
                      mode='aspectFit'
                      lazyLoad
                    />
                  </View>
                )}
              </>
              ) : (
                <View className='avatar-customize__member-only'>
                  <Text className='avatar-customize__member-only-icon'>✨</Text>
                  <Text className='avatar-customize__member-only-title'>AI 照片生成 · 会员专享</Text>
                  <Text className='avatar-customize__member-only-desc'>上传宠物照片后，AI 生成专属风格形象（2D 形象包 / 5 种画风），会员每月限 3 次；免费用户可直接用上方照片作头像</Text>
                  <View className='avatar-customize__member-only-btn' onClick={() => showMemberGuide('开通会员即可用宠物照片生成专属形象，每月 3 次')}>
                    <Text className='avatar-customize__member-only-btn-text'>开通会员</Text>
                  </View>
                </View>
              )}
            </>
          )}
          {/* 多风格候选：5 选 1（两个 Tab 共用） */}
          {styleOptions && styleOptions.length > 0 && (
            <View className='avatar-options'>
              <View className='avatar-options__head'>
                <Text className='avatar-options__title'>选择你喜欢的形象</Text>
                <Text className='avatar-options__hint'>Q版萌系 / 日系治愈 / 美式卡通 / 水彩手绘 / 黏土萌宠</Text>
              </View>
              <View className='avatar-options__grid'>
                {styleOptions.map((option, index) => (
                  <View
                    key={option.style}
                    className={`avatar-options__card ${selectedStyleIndex === index ? 'avatar-options__card--active' : ''}`}
                    onClick={() => setSelectedStyleIndex(index)}
                  >
                    <View className='avatar-options__img-wrap'>
                      <Image className='avatar-options__img' src={option.url} mode='aspectFill' lazyLoad />
                      {selectedStyleIndex === index && (
                        <View className='avatar-options__check'>
                          <Text className='avatar-options__check-text'>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text className='avatar-options__label'>{option.label}</Text>
                  </View>
                ))}
              </View>
              <View className='avatar-options__actions'>
                <View className='avatar-options__btn avatar-options__btn--secondary' onClick={handleResetOptions}>
                  <Text className='avatar-options__btn-text'>重新生成</Text>
                </View>
                <View
                  className={`avatar-options__btn ${selectedStyleIndex == null ? 'avatar-options__btn--disabled' : ''}`}
                  onClick={handleSaveSelectedOption}
                >
                  <Text className='avatar-options__btn-text'>保存所选形象</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  )
}
