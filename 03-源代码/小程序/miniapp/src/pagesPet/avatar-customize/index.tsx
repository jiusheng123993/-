/**
 * 宠物形象定制页面
 * 当前形象展示 → 形象库 → 预设形象 → 形象操作区（形象生成 / 分享形象）→ 生成面板（文字/照片）
 * 说明：2026-08-24 移除冗余的"风格切换/表情系统"展示卡；文字生成改为
 * 手动选择画风+表情+描述，参考提示词模板指引；新增形象库按风格/表情分类保存
 * 说明：2026-08-24 场景区简化——移除使用率低的「头像」「聊天贴纸」入口，
 * 收敛为「形象生成」「分享形象」两个动作；原独立「生成新形象」大按钮的
 * 面板开合职责并入「形象生成」（避免删掉后面板打开就无处收起）
 */
import { View, Text, Image, Textarea, ScrollView } from '@tarojs/components'
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
import { getPresetsBySpecies, type AvatarPreset } from './data/avatarPresets'
import { getHomeStyleAvatarUrl } from '../../data/homeStyleAvatars'
import PresetAvatar from './PresetAvatar'
import {
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
  saveAvatarToLibrary,
  getAvatarLibrary,
  deleteAvatarLibraryItem,
  setMultiviewAsCurrent,
  type AvatarStyleOption,
  type AvatarLibraryItem,
} from '../../services/avatarService'
import type { AvatarCustomization, ExpressionContext, PetSpecies, Avatar2DImage, AvatarQuota } from '../../types/avatarTypes'
import type { PetProfile } from '../../services/petService'
import { usePetStore } from '../../stores/petStore'
import { useMembership } from '../../hooks/useMembership'
import { useAnalytics } from '../../hooks/useAnalytics'
import './index.scss'

// 生成画风（单选，key 与服务端 AVATAR_STYLE_OPTIONS 对齐，15 种）
// 来源：现有 5 种 + 项目提示词库《宠物回忆录-提示词库.md》§6/§7.1 通用视觉风格库
// 文字 Tab 与照片 Tab 共用此列表（2026-08-24 照片生成画风对齐文生图，原 cartoon/realistic 两卡选择器移除）
const GEN_STYLES: Array<{ key: string; label: string; icon: string }> = [
  { key: 'q', label: 'Q版萌系', icon: '🐾' },
  { key: 'japanese', label: '日系治愈', icon: '🌸' },
  { key: 'american', label: '美式卡通', icon: '🎬' },
  { key: 'watercolor', label: '水彩手绘', icon: '🎨' },
  { key: 'clay', label: '黏土萌宠', icon: '🧸' },
  { key: 'ghibli', label: '吉卜力动画', icon: '🍃' },
  { key: 'pixar', label: '皮克斯3D', icon: '🎈' },
  { key: 'pixel', label: '像素艺术', icon: '👾' },
  { key: 'ink', label: '水墨国风', icon: '🖌️' },
  { key: 'oil', label: '油画印象派', icon: '🖼️' },
  { key: 'cyberpunk', label: '赛博朋克', icon: '🌆' },
  { key: 'nordic', label: '极简北欧', icon: '🤍' },
  { key: 'lowpoly', label: '低多边形', icon: '🔷' },
  { key: 'lineart', label: '线稿素描', icon: '✏️' },
  { key: 'dark', label: '暗黑奇幻', icon: '🌙' },
]

// 生成表情（单选，key 与服务端 EXPRESSION_PROMPTS 对齐，12 种）
const GEN_EXPRESSIONS: Array<{ key: string; label: string; icon: string }> = [
  { key: 'happy', label: '开心', icon: '😊' },
  { key: 'excited', label: '兴奋', icon: '🤩' },
  { key: 'love', label: '温柔', icon: '🥰' },
  { key: 'cool', label: '得意', icon: '😎' },
  { key: 'sleepy', label: '困倦', icon: '😴' },
  { key: 'angry', label: '生气', icon: '😤' },
  { key: 'thinking', label: '思考', icon: '🤔' },
  { key: 'surprised', label: '惊讶', icon: '😱' },
  { key: 'crying', label: '委屈', icon: '😭' },
  { key: 'celebrate', label: '庆祝', icon: '🥳' },
  { key: 'naughty', label: '调皮', icon: '😜' },
  { key: 'sad', label: '难过', icon: '😢' },
]

// 生成背景（单选，key 与服务端 AVATAR_BACKGROUND_OPTIONS 对齐，8 种 + 默认）
// 文生图换景：选了则替换提示词里的"干净背景"，纯提示词层实现不加调用不加费用
const GEN_BACKGROUNDS: Array<{ key: string; label: string; icon: string }> = [
  { key: 'sky', label: '蓝天白云', icon: '☁️' },
  { key: 'sakura', label: '樱花', icon: '🌸' },
  { key: 'grass', label: '草坪花园', icon: '🌿' },
  { key: 'christmas', label: '圣诞', icon: '🎄' },
  { key: 'birthday', label: '生日派对', icon: '🎂' },
  { key: 'beach', label: '夏日海边', icon: '🌊' },
  { key: 'night', label: '星空夜', icon: '🌙' },
  { key: 'cozy', label: '奶油毛毯', icon: '🧶' },
]

/** 画风 key → 中文名（形象库分类/参考模板用） */
const GEN_STYLE_LABELS: Record<string, string> = Object.fromEntries(GEN_STYLES.map(s => [s.key, s.label]))
/** 表情 key → 中文名（形象库分类/参考模板用） */
const GEN_EXPR_LABELS: Record<string, string> = Object.fromEntries(GEN_EXPRESSIONS.map(e => [e.key, e.label]))

/** 画风 key → 光影/氛围词（参考提示词模板拼接用，对齐提示词库各风格关键词） */
const GEN_STYLE_ATMOS: Record<string, string> = {
  q: '萌系贴纸质感，柔和暖光，明亮干净背景',
  japanese: '奶油色柔和渐变，水彩晕染，温馨治愈氛围',
  american: '高饱和撞色，夸张生动，活力满满',
  watercolor: '透明水彩晕染，纸张纹理，淡雅清新',
  clay: '软陶立体，手作质感，柔和影棚光',
  ghibli: '手绘水彩背景，宫崎骏式温暖治愈，柔和光线',
  pixar: '光滑立体渲染，大眼睛高光，温暖光线，次表面散射毛发',
  pixel: '16-bit 复古像素，色彩分明，俏皮可爱',
  ink: '水墨宣纸质感，留白意境，禅意宁静',
  oil: '厚涂笔触，油画布纹理，浓郁艺术感',
  cyberpunk: '霓虹灯光，雨夜反光，紫青色调，未来都市氛围',
  nordic: '低饱和莫兰迪色，极简构图，宁静高级',
  lowpoly: '几何切面，扁平着色，简洁现代',
  lineart: '铅笔线稿，排线阴影，艺术手绘感',
  dark: '哥特月光，神秘雾气，戏剧性光影',
}

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
  // 生成结果（styleKey 指定画风时只有 1 项）
  const [styleOptions, setStyleOptions] = useState<AvatarStyleOption[] | null>(null)
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number | null>(null)
  // 文字描述生成：用户输入的外貌描述（可选，拼进提示词参与生图）
  const [textDescription, setTextDescription] = useState('')
  // 生成参数：手动选择画风 + 表情（对应服务端 AVATAR_STYLE_OPTIONS / EXPRESSION_PROMPTS）
  const [genStyle, setGenStyle] = useState<string>('q')
  const [genExpression, setGenExpression] = useState<string | null>(null)
  // 形象库：按风格/表情/类型分类保存的生成形象 + 筛选
  const [library, setLibrary] = useState<AvatarLibraryItem[]>([])
  const [libraryStyleFilter, setLibraryStyleFilter] = useState<string>('all')
  const [libraryExprFilter, setLibraryExprFilter] = useState<string>('all')
  // 类型筛选（迁移 030）：headshot=头像 / multiview=全方位设定图 / all=全部
  const [libraryViewFilter, setLibraryViewFilter] = useState<string>('all')
  // 预设头像库（免费用户入口）：选中的预设 ID
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  // 照片生成画风：与文生图（文字 Tab）同一套 15 种画风 key（GEN_STYLES，key 对齐服务端 AVATAR_STYLE_OPTIONS）
  const [photoStyle, setPhotoStyle] = useState<string>('q')
  // 照片生成表情（可选，null=不指定；对齐服务端 EXPRESSION_PROMPTS 白名单）
  const [photoExpression, setPhotoExpression] = useState<string | null>(null)
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
      // style 存的是 GEN_STYLES 画风 key（服务端 avatar_style 为自由字符串，历史 cartoon/realistic 值兼容共存）
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
    trackEvent('generate_avatar_options', { style: selectedStyle, species, genStyle, genExpression })
    setIsGenerating(true)
    setStyleOptions(null)
    setSelectedStyleIndex(null)
    try {
      // 按用户选择的画风+表情生成 1 张（styleKey 指定后服务端只生成该画风）
      // 用户描述（可选）拼进提示词参与生图
      const desc = textDescription.trim().slice(0, 100)
      const options = await generateAvatarOptions(petId, undefined, selectedStyle, desc || undefined, genStyle, genExpression || undefined)
      if (options && options.length > 0) {
        setStyleOptions(options)
        // 单选画风生成 1 张，默认选中它
        setSelectedStyleIndex(0)
        incrementGenerationCount()
        setGenCount(getGenerationCount())
        trackEvent('generate_avatar_options_success', { style: selectedStyle, genStyle, count: options.length })
        Taro.showToast({ title: '生成成功', icon: 'none' })
        // 生成结果在面板底部，滚动到页面底部让用户一眼看到
        Taro.nextTick(() => {
          Taro.pageScrollTo({ scrollTop: 99999, duration: 300 })
        })
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
  }, [canGenerate, isGenerating, species, petName, selectedStyle, selectedColor, isMember, textDescription, genStyle, genExpression, petId, trackEvent])

  // ---- 形象库：按风格/表情/类型分类保存的生成形象 ----

  /** 按当前筛选（画风/表情/类型）过滤形象库 */
  const filteredLibrary = useMemo(() => {
    return library.filter((item) => {
      const styleOk = libraryStyleFilter === 'all' || item.style === libraryStyleFilter
      const exprOk = libraryExprFilter === 'all' || (item.expression || '') === libraryExprFilter
      const viewOk = libraryViewFilter === 'all' || item.viewType === libraryViewFilter
      return styleOk && exprOk && viewOk
    })
  }, [library, libraryStyleFilter, libraryExprFilter, libraryViewFilter])

  /** 加载当前宠物的形象库 */
  const loadLibrary = useCallback(async (targetPetId: string) => {
    if (!targetPetId) return
    const items = await getAvatarLibrary(targetPetId)
    setLibrary(items)
  }, [])

  // 宠物切换/进入页面时加载形象库
  useEffect(() => {
    void loadLibrary(petId)
  }, [petId, loadLibrary])

  /**
   * 把生成结果存入形象库（一套两条：头像 headshot + 全方位设定图 multiview）
   * 设定图是全家福/回忆录的角色参考图，与头像分开入库便于按类型筛选
   * @param targetOption - 指定候选（显式传入时 style/表情以候选为准，避免控件状态错标）
   */
  const handleSaveToLibrary = useCallback(async (targetOption?: AvatarStyleOption) => {
    const current = targetOption ?? (styleOptions && selectedStyleIndex != null ? styleOptions[selectedStyleIndex] : null)
    if (!current || !petId) {
      if (!current) Taro.showToast({ title: '请先生成并选择形象', icon: 'none' })
      return
    }
    // 显式指定候选时用候选自身的画风；表情仅文字流程有（照片流程不选表情，错标会污染筛选）
    const style = targetOption ? targetOption.style : genStyle
    const expression = targetOption ? null : genExpression
    // 服务端 UPSERT 幂等：重复保存同一张图按"再次收藏"成功处理（审查修复：原 23505→500 会让重试永远失败）
    const okHead = await saveAvatarToLibrary(petId, style, expression, current.url, 'headshot')
    const okSheet = current.sheetUrl
      ? await saveAvatarToLibrary(petId, style, expression, current.sheetUrl, 'multiview')
      : null // 未尝试（无设定图）：不算成败，不影响文案四态判定
    if (okHead && okSheet !== false) {
      // 文字流程本就只有头像（设定图为照片流程专属），不加"仅头像"后缀避免困惑
      Taro.showToast({ title: okSheet ? '已存入形象库' : (targetOption ? '已存入形象库（仅头像）' : '已存入形象库'), icon: 'success' })
      await loadLibrary(petId)
    } else if (!okHead && okSheet === false) {
      Taro.showToast({ title: '存入失败，请重试', icon: 'none' })
    } else if (!okHead) {
      Taro.showToast({ title: '已存入设定图，头像失败', icon: 'none' })
      await loadLibrary(petId)
    } else {
      Taro.showToast({ title: '已存入头像，设定图失败', icon: 'none' })
      await loadLibrary(petId)
    }
  }, [styleOptions, selectedStyleIndex, petId, genStyle, genExpression, loadLibrary])

  /** 把形象库中的某个形象设为当前（按类型分流）：
   * - multiview 设定图 → 写 avatar_multiview_url，作为全家福/回忆录参考图，不动真实照片与头像
   * - headshot 头像 → 走原有 avatar_cartoon_url 流程
   */
  const handleUseLibraryItem = useCallback(async (item: AvatarLibraryItem) => {
    if (!petId) return
    if (item.viewType === 'multiview') {
      try {
        const updated = await setMultiviewAsCurrent(petId, item.imageUrl)
        const patch = updated
          ? (updated as unknown as Record<string, unknown>)
          : { avatarMultiviewUrl: item.imageUrl }
        await handleSaved(petId, patch)
        Taro.showToast({ title: '已设为参考图', icon: 'success' })
      } catch {
        Taro.showToast({ title: '设置失败，请重试', icon: 'none' })
      }
      return
    }
    try {
      const custom: AvatarCustomization = {
        species,
        style: 'cartoon',
        styleVariant: item.style,
        baseColor: '#FFD93D',
        generatedAt: new Date().toISOString(),
        cartoonUrl: item.imageUrl,
      }
      const updated = await saveAvatarCustomization(custom, petId)
      const patch = updated
        ? (updated as unknown as Record<string, unknown>)
        : { avatarCartoonUrl: custom.cartoonUrl, avatarStyle: custom.style, avatarPhotoUrl: null }
      await handleSaved(petId, patch)
      Taro.showToast({ title: '已设为当前形象', icon: 'success' })
    } catch {
      Taro.showToast({ title: '设置失败，请重试', icon: 'none' })
    }
  }, [petId, species, handleSaved])

  /** 删除形象库中的一条 */
  const handleDeleteLibraryItem = useCallback(async (id: string) => {
    Taro.showModal({
      title: '删除这个形象？',
      content: '删除后不可恢复',
      confirmText: '删除',
      confirmColor: '#E64340',
      success: async (r) => {
        if (!r.confirm) return
        const ok = await deleteAvatarLibraryItem(id)
        if (ok) {
          Taro.showToast({ title: '已删除', icon: 'none' })
          await loadLibrary(petId)
        } else {
          Taro.showToast({ title: '删除失败', icon: 'none' })
        }
      },
    })
  }, [petId, loadLibrary])

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
    trackEvent('generate_photo_options', { style: photoStyle, expression: photoExpression })
    setIsGenerating(true)
    setStyleOptions(null)
    setSelectedStyleIndex(null)
    try {
      // 与文生图一致：styleKey 指定画风后服务端只生成该画风 1 张；
      // 基调参数固定传 cartoon（legacy 兜底口径），画风/表情由 styleKey/expression 精确控制
      const options = await generateAvatarOptions(petId, referenceImageUrl, 'cartoon', undefined, photoStyle, photoExpression ?? undefined)
      if (options && options.length > 0) {
        setStyleOptions(options)
        // 单选画风生成 1 张默认选中（同文字 Tab 口径），否则单张结果分支的「设为当前形象」按钮不可点
        setSelectedStyleIndex(0)
        incrementPhotoOptionsCount()
        trackEvent('generate_photo_options_success', { style: photoStyle, count: options.length })
        Taro.showToast({ title: '生成成功', icon: 'none' })
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
  }, [canGenPhotoOptions, isGenerating, isMember, petId, photoStyle, photoExpression, showMemberGuide, trackEvent])

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

  const handle2DRetry = useCallback(() => {
    task2D.reset()
    handleGenerate2D()
  }, [task2D, handleGenerate2D])

  const existingCustom = useMemo(() => getAvatarCustomization(petId), [petId])

  /** 应用场景：跳转分享卡片页（场景区「分享形象」入口）。
   * 原「头像」（handleApplyAvatar）与「聊天贴纸」（handleSaveSticker）入口
   * 因使用率低于 2026-08-24 移除，相关保存/下载逻辑一并删除 */
  const handleGoShareCard = useCallback(() => {
    Taro.navigateTo({ url: '/pagesPet/share-card/index' })
  }, [])

  return (
    <View className={`avatar-customize ${themeClass}`}>
      {/* 1. 当前形象展示卡（移除冗余的预览画风/表情切换，直接展示当前形象） */}
      <View className='xhh-card avatar-stage'>
        <View className='avatar-stage__head'>
          <Text className='avatar-stage__badge'>当前形象</Text>
          <Text className='avatar-stage__style-tag'>{petName}</Text>
        </View>
        <View className='avatar-stage__img'>
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
              size={230}
            />
          )}
        </View>
        <Text className='avatar-stage__name'>{petName}</Text>
        <Text className='avatar-stage__desc'>{petDesc}</Text>
      </View>

      {/* 1.6 形象库（多次生成的形象按风格/表情分类保存） */}
      <View className='xhh-card avatar-library'>
        <View className='avatar-library__head'>
          <Text className='avatar-library__title'>📚 形象库</Text>
          <Text className='avatar-library__hint'>生成后点「存入形象库」，按风格/表情分类保存</Text>
        </View>

        {/* 筛选：画风 + 表情 */}
        <View className='avatar-library__filters'>
          <ScrollView className='avatar-library__filter-row' scrollX enhanced showScrollbar={false}>
            <View className='avatar-library__filter-inner'>
              {['all', ...GEN_STYLES.map(s => s.key)].map(key => (
                <View
                  key={`s-${key}`}
                  className={`avatar-library__filter-chip ${libraryStyleFilter === key ? 'avatar-library__filter-chip--active' : ''}`}
                  onClick={() => setLibraryStyleFilter(key)}
                >
                  <Text>{key === 'all' ? '全部风格' : GEN_STYLE_LABELS[key]}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <ScrollView className='avatar-library__filter-row' scrollX enhanced showScrollbar={false}>
            <View className='avatar-library__filter-inner'>
              {['all', ...GEN_EXPRESSIONS.map(e => e.key)].map(key => (
                <View
                  key={`e-${key}`}
                  className={`avatar-library__filter-chip ${libraryExprFilter === key ? 'avatar-library__filter-chip--active' : ''}`}
                  onClick={() => setLibraryExprFilter(key)}
                >
                  <Text>{key === 'all' ? '全部表情' : GEN_EXPR_LABELS[key]}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          {/* 类型筛选（迁移 030）：头像 / 全方位设定图 */}
          <ScrollView className='avatar-library__filter-row' scrollX enhanced showScrollbar={false}>
            <View className='avatar-library__filter-inner'>
              {[{ key: 'all', label: '全部类型' }, { key: 'headshot', label: '🖼️ 头像' }, { key: 'multiview', label: '📋 设定图' }].map(v => (
                <View
                  key={`v-${v.key}`}
                  className={`avatar-library__filter-chip ${libraryViewFilter === v.key ? 'avatar-library__filter-chip--active' : ''}`}
                  onClick={() => setLibraryViewFilter(v.key)}
                >
                  <Text>{v.label}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 形象网格（按筛选展示） */}
        {filteredLibrary.length === 0 ? (
          <View className='avatar-library__empty'>
            <Text>还没有保存的形象</Text>
            <Text className='avatar-library__empty-hint'>生成形象后点击「存入形象库」即可收藏分类</Text>
          </View>
        ) : (
          <View className='avatar-library__grid'>
            {filteredLibrary.map(item => (
              <View key={item.id} className='avatar-library__card'>
                <Image
                  className='avatar-library__img'
                  src={item.imageUrl}
                  mode={item.viewType === 'multiview' ? 'aspectFit' : 'aspectFill'}
                  lazyLoad
                  onClick={() => handleUseLibraryItem(item)}
                />
                <View className='avatar-library__tags'>
                  {/* 类型徽章（迁移 030）：设定图用白底描边样式区分，四视图图幅大用 aspectFit 防裁切 */}
                  <Text
                    className={`avatar-library__tag ${item.viewType === 'multiview' ? 'avatar-library__tag--multiview' : ''}`}
                    onClick={() => setLibraryViewFilter(item.viewType)}
                  >
                    {item.viewType === 'multiview' ? '📋 设定图' : '🖼️ 头像'}
                  </Text>
                  <Text className='avatar-library__tag'>{GEN_STYLE_LABELS[item.style] || item.style}</Text>
                  {item.expression && <Text className='avatar-library__tag'>{GEN_EXPR_LABELS[item.expression] || item.expression}</Text>}
                </View>
                <View className='avatar-library__actions'>
                  <Text className='avatar-library__use' onClick={() => handleUseLibraryItem(item)}>
                    {item.viewType === 'multiview' ? '设为参考图' : '设为当前'}
                  </Text>
                  <Text className='avatar-library__del' onClick={() => handleDeleteLibraryItem(item.id)}>删除</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 1.5 预设形象库（免费用户主入口：从现成的 10 款里选，无需 AI 生成） */}
      <View className='xhh-card avatar-preset'>
        <View className='avatar-preset__head'>
          <Text className='avatar-preset__title'>预设形象 · 免费</Text>
          <Text className='avatar-preset__hint'>{species === 'cat' ? '10 款猫咪' : '10 款狗狗'}，选一个直接用</Text>
        </View>
        <View className='avatar-preset__grid'>
          {presetList.map((preset, idx) => (
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
              {/* 预设只是"默认头像"，不标品种名——避免用户误以为这就是自家小猫的品种形象 */}
              <Text className='avatar-preset__label'>预设 {idx + 1}</Text>
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

      {/* 4. 形象操作区：原「头像/聊天贴纸」使用率低已移除，收敛为核心两动作；
          「形象生成」同时承担原独立大按钮的面板开合职责（文案随开合状态切换） */}
      <View className='avatar-scenes'>
        <View className='avatar-scenes__item' onClick={() => setShowPanel(v => !v)}>
          <View className='avatar-scenes__icon avatar-scenes__icon--coral'>✨</View>
          <Text className='avatar-scenes__label'>{showPanel ? '收起面板' : '形象生成'}</Text>
        </View>
        <View className='avatar-scenes__item' onClick={handleGoShareCard}>
          <View className='avatar-scenes__icon avatar-scenes__icon--teal'>📤</View>
          <Text className='avatar-scenes__label'>分享形象</Text>
        </View>
      </View>

      {/* 5. 生成面板（保留原文字/照片双 Tab 业务） */}
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
                <Text className='avatar-customize__member-only-desc'>AI 按你选的画风+表情生成专属形象；免费用户可直接使用上方「预设形象」，或在「照片生成」Tab 上传真实照片作头像</Text>
                <View className='avatar-customize__member-only-btn' onClick={() => showMemberGuide('开通会员即可使用 AI 生成专属形象（文字/照片）')}>
                  <Text className='avatar-customize__member-only-btn-text'>开通会员</Text>
                </View>
              </View>
            ) : (
              <>
              {/* 文字描述输入：让"文字描述生成"名副其实（此前没有输入框，用户无法输入描述） */}
              <View className='avatar-customize__section'>
                <Text className='avatar-customize__section-title'>描述你的宠物</Text>
                <Textarea
                  className='avatar-customize__desc-input'
                  value={textDescription}
                  onInput={(e) => setTextDescription(e.detail.value)}
                  placeholder='例如：橘色虎斑英短，橙底深棕条纹，额头M纹，圆脸，琥珀色大眼睛，粉色鼻头，白色下巴胸毛（写得越具体越像；有真实照片留空也能自动提取）'
                  maxlength={100}
                  autoHeight
                />
                <Text className='avatar-customize__desc-hint'>外貌写得越具体生成越像：毛色、花纹、体型、脸型、眼睛颜色、特殊标记；不要写宠物名字</Text>
              </View>

              {/* 参考提示词模板：按提示词库公式组织（主体+外貌+表情+画风+光影氛围+画质），实时示例可一键填入 */}
              <View className='avatar-customize__section avatar-customize__ref'>
                <Text className='avatar-customize__section-title'>💡 参考提示词模板</Text>
                <View className='avatar-customize__ref-formula'>
                  <Text className='avatar-customize__ref-formula-line'><Text className='avatar-customize__ref-tag'>主体</Text>一只{species === 'cat' ? '猫咪' : '狗狗'}（档案自动带上品种）</Text>
                  <Text className='avatar-customize__ref-formula-line'><Text className='avatar-customize__ref-tag'>外貌</Text>毛色 / 花纹 / 体型 / 脸型 / 眼睛颜色 / 特殊标记（写得越具体越像；有真实照片留空自动提取）</Text>
                  <Text className='avatar-customize__ref-formula-line'><Text className='avatar-customize__ref-tag'>表情</Text>{genExpression ? `${GEN_EXPR_LABELS[genExpression]}的表情` : '自然神态'}（下方选择）</Text>
                  <Text className='avatar-customize__ref-formula-line'><Text className='avatar-customize__ref-tag'>画风</Text>{GEN_STYLE_LABELS[genStyle]}（下方选择，15 种）</Text>
                  <Text className='avatar-customize__ref-formula-line'><Text className='avatar-customize__ref-tag'>氛围</Text>光影 / 质感 / 背景（自动配好）</Text>
                </View>
                <View className='avatar-customize__ref-box'>
                  <Text className='avatar-customize__ref-text'>
                    {`一只${currentPet?.breed || (species === 'cat' ? '猫咪' : '狗狗')}的头像，${textDescription.trim() || '毛色层次分明，橘色底色配深棕色虎斑条纹，额头有M形纹，圆脸，琥珀色大眼睛水汪汪，粉色鼻头，白色下巴和胸毛，四肢粗短胖乎乎的'}，${genExpression ? `${GEN_EXPR_LABELS[genExpression]}的表情，嘴角微扬，眼睛弯弯` : '神态自然'}，${GEN_STYLE_LABELS[genStyle]}风格：${GEN_STYLE_ATMOS[genStyle]}，高质量，细节丰富，干净背景`}
                  </Text>
                </View>
                <View className='avatar-customize__ref-actions'>
                  <View className='avatar-customize__ref-fill' onClick={() => {
                    // 一键填入"外貌+表情"部分（画风/表情由下方选择器控制，避免重复）
                    const desc = `${textDescription.trim() || '毛色层次分明，橘色底色配深棕色虎斑条纹，额头M纹，圆脸，琥珀色大眼睛，粉色鼻头，白下巴胸毛'}${genExpression ? `，${GEN_EXPR_LABELS[genExpression]}的表情` : ''}`
                    setTextDescription(desc.slice(0, 100))
                  }}
                  >
                    <Text className='avatar-customize__ref-fill-text'>填入外貌+表情</Text>
                  </View>
                </View>
                <Text className='avatar-customize__desc-hint'>按「外貌特征，表情，画风」组织描述；有真实照片时描述留空，生成时也会自动提取你家宠物的真实外貌</Text>
              </View>

              {/* 画风选择（单选，生成 1 张） */}
              <View className='avatar-customize__section'>
                <Text className='avatar-customize__section-title'>选择画风</Text>
                <View className='avatar-customize__gen-options'>
                  {GEN_STYLES.map(opt => (
                    <View
                      key={opt.key}
                      className={`avatar-customize__gen-chip ${genStyle === opt.key ? 'avatar-customize__gen-chip--active' : ''}`}
                      onClick={() => setGenStyle(opt.key)}
                    >
                      <Text className='avatar-customize__gen-chip-icon'>{opt.icon}</Text>
                      <Text className='avatar-customize__gen-chip-label'>{opt.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 表情选择（单选，可选"不选"） */}
              <View className='avatar-customize__section'>
                <Text className='avatar-customize__section-title'>选择表情</Text>
                <View className='avatar-customize__gen-options avatar-customize__gen-options--expr'>
                  <View
                    className={`avatar-customize__gen-chip ${genExpression === null ? 'avatar-customize__gen-chip--active' : ''}`}
                    onClick={() => setGenExpression(null)}
                  >
                    <Text className='avatar-customize__gen-chip-label'>无</Text>
                  </View>
                  {GEN_EXPRESSIONS.map(opt => (
                    <View
                      key={opt.key}
                      className={`avatar-customize__gen-chip ${genExpression === opt.key ? 'avatar-customize__gen-chip--active' : ''}`}
                      onClick={() => setGenExpression(opt.key)}
                    >
                      <Text className='avatar-customize__gen-chip-icon'>{opt.icon}</Text>
                      <Text className='avatar-customize__gen-chip-label'>{opt.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 背景选择（单选，可选"默认"；文生图换景——替换提示词的干净背景） */}
              <View className='avatar-customize__section'>
                <Text className='avatar-customize__section-title'>选择背景（可选）</Text>
                <View className='avatar-customize__gen-options avatar-customize__gen-options--expr'>
                  <View
                    className={`avatar-customize__gen-chip ${genBackground === '' ? 'avatar-customize__gen-chip--active' : ''}`}
                    onClick={() => setGenBackground('')}
                  >
                    <Text className='avatar-customize__gen-chip-label'>默认</Text>
                  </View>
                  {GEN_BACKGROUNDS.map(opt => (
                    <View
                      key={opt.key}
                      className={`avatar-customize__gen-chip ${genBackground === opt.key ? 'avatar-customize__gen-chip--active' : ''}`}
                      onClick={() => setGenBackground(opt.key)}
                    >
                      <Text className='avatar-customize__gen-chip-icon'>{opt.icon}</Text>
                      <Text className='avatar-customize__gen-chip-label'>{opt.label}</Text>
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
                  <Text className='avatar-customize__btn-text'>生成形象</Text>
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

              {/* 参考照片小贴士：AI 照着照片抄毛色/花纹/体型，图里看不清的特征就画不准 */}
              <View className='avatar-customize__photo-tips'>
                <Text className='avatar-customize__photo-tips-title'>📷 参考照片小贴士</Text>
                <Text className='avatar-customize__photo-tips-item'>· 自然光充足、对焦清晰，宠物占画面主体</Text>
                <Text className='avatar-customize__photo-tips-item'>· 正面或微侧面，五官看得清</Text>
                <Text className='avatar-customize__photo-tips-item'>· 尽量全身入镜——设定图的侧面/背面视角靠它推断</Text>
                <Text className='avatar-customize__photo-tips-item'>· 背景干净、只拍这一只；避免糊片、蜷睡、强滤镜</Text>
                <Text className='avatar-customize__photo-tips-note'>💡 上传后点「直接用此照片作头像」（免费），文字生成和全家福也会用它当参考</Text>
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
                {/* 画风/表情选择：与文生图（文字 Tab）完全同一套 GEN_STYLES 15 种画风 + GEN_EXPRESSIONS 12 种表情 */}
                <View className='avatar-customize__section'>
                  <Text className='avatar-customize__section-title'>选择画风</Text>
                  <View className='avatar-customize__gen-options'>
                    {GEN_STYLES.map(opt => (
                      <View
                        key={opt.key}
                        className={`avatar-customize__gen-chip ${photoStyle === opt.key ? 'avatar-customize__gen-chip--active' : ''}`}
                        onClick={() => setPhotoStyle(opt.key)}
                      >
                        <Text className='avatar-customize__gen-chip-icon'>{opt.icon}</Text>
                        <Text className='avatar-customize__gen-chip-label'>{opt.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className='avatar-customize__section'>
                  <Text className='avatar-customize__section-title'>选择表情（可选）</Text>
                  <View className='avatar-customize__gen-options avatar-customize__gen-options--expr'>
                    <View
                      className={`avatar-customize__gen-chip ${photoExpression === null ? 'avatar-customize__gen-chip--active' : ''}`}
                      onClick={() => setPhotoExpression(null)}
                    >
                      <Text className='avatar-customize__gen-chip-label'>无</Text>
                    </View>
                    {GEN_EXPRESSIONS.map(opt => (
                      <View
                        key={opt.key}
                        className={`avatar-customize__gen-chip ${photoExpression === opt.key ? 'avatar-customize__gen-chip--active' : ''}`}
                        onClick={() => setPhotoExpression(opt.key)}
                      >
                        <Text className='avatar-customize__gen-chip-icon'>{opt.icon}</Text>
                        <Text className='avatar-customize__gen-chip-label'>{opt.label}</Text>
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
                      <Text className='avatar-customize__btn-text'>按所选画风生成形象</Text>
                    </View>
                  </View>
                )}

                {/* 2D 任务轻提示（替代原 GenerationProgress 重进度卡）：生成中一行小字，失败可点重试 */}
                {task2D.isProcessing && (
                  <Text className='avatar-customize__task-hint'>⏳ 2D 形象包 AI 生成中，请稍候…</Text>
                )}
                {task2D.isFailed && (
                  <Text
                    className='avatar-customize__task-hint avatar-customize__task-hint--error'
                    onClick={handle2DRetry}
                  >
                    ❌ 2D 形象包生成失败，点击重试
                  </Text>
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

                {/* 3D 任务轻提示：同 2D 口径，失败点击重试（依赖其参考的 2D 任务存在） */}
                {task3D.isProcessing && (
                  <Text className='avatar-customize__task-hint'>⏳ 3D 模型 AI 生成中，请稍候…</Text>
                )}
                {task3D.isFailed && (
                  <Text
                    className='avatar-customize__task-hint avatar-customize__task-hint--error'
                    onClick={() => task3D.retry(petId, task2D.taskId!)}
                  >
                    ❌ 3D 模型生成失败，点击重试
                  </Text>
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
                  <Text className='avatar-customize__member-only-desc'>上传宠物照片后，选好画风（与文生图同一套 15 种）和表情，AI 参考照片生成专属形象（一套含头像+全方位设定图），会员每月限 3 次；免费用户可直接用上方照片作头像</Text>
                  <View className='avatar-customize__member-only-btn' onClick={() => showMemberGuide('开通会员即可用宠物照片生成专属形象，每月 3 次')}>
                    <Text className='avatar-customize__member-only-btn-text'>开通会员</Text>
                  </View>
                </View>
              )}
            </>
          )}
          {/* 生成结果：一套 = 头像 + 全方位设定图。单张结果走单卡（文字流指定画风 / 照片流按所选画风，
              两者生成成功都会 setSelectedStyleIndex(0)，单卡内保存/设当前均显式用下标 0，无死按钮）；
              多张（照片批量候选遗留路径，不传 styleKey 时服务端仍返回多套）走宫格选 1 */}
          {styleOptions && styleOptions.length > 0 && (
            styleOptions.length === 1 ? (
              <View className='avatar-options avatar-options--single'>
                <View className='avatar-options__head'>
                  <Text className='avatar-options__title'>生成结果</Text>
                  <Text className='avatar-options__hint'>
                    {GEN_STYLE_LABELS[activeTab === 'text' ? genStyle : photoStyle] || styleOptions[0].label}
                    {(activeTab === 'text' ? genExpression : photoExpression)
                      ? ` · ${GEN_EXPR_LABELS[(activeTab === 'text' ? genExpression : photoExpression)!]}`
                      : ''}
                  </Text>
                </View>
                <Image className='avatar-options__single-img' src={styleOptions[0].url} mode='aspectFit' lazyLoad />
                {/* 全方位角色设定图（一套两张之二）：正面特写/侧面/顶部/背面四视图，作全家福与回忆录参考图 */}
                {styleOptions[0].sheetUrl && (
                  <View className='avatar-options__sheet'>
                    <Text className='avatar-options__sheet-label'>📋 全方位角色设定图</Text>
                    <Image
                      className='avatar-options__sheet-img'
                      src={styleOptions[0].sheetUrl}
                      mode='aspectFit'
                      lazyLoad
                    />
                    <Text className='avatar-options__sheet-hint'>含正面特写 / 侧面 / 顶部 / 背面四视角 · 全家福与回忆录的角色参考图（随头像一并存入形象库）</Text>
                  </View>
                )}
                <View className='avatar-options__actions'>
                  <View className='avatar-options__btn avatar-options__btn--secondary' onClick={handleResetOptions}>
                    <Text className='avatar-options__btn-text'>重新生成</Text>
                  </View>
                  {/* 显式传第 0 张：文字流程 selectedStyleIndex 恒为 0，显式化后不依赖选中状态（防静默 no-op） */}
                  <View className='avatar-options__btn' onClick={() => handleSaveToLibrary(styleOptions[0])}>
                    <Text className='avatar-options__btn-text'>📚 存入形象库</Text>
                  </View>
                  <View
                    className={`avatar-options__btn ${selectedStyleIndex == null ? 'avatar-options__btn--disabled' : ''}`}
                    onClick={handleSaveSelectedOption}
                  >
                    <Text className='avatar-options__btn-text'>设为当前形象</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className='avatar-options'>
                <View className='avatar-options__head'>
                  <Text className='avatar-options__title'>选择你喜欢的形象</Text>
                  <Text className='avatar-options__hint'>每套含头像 + 全方位设定图 · 点选后可预览设定图</Text>
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
                      {/* 设定图小角标：有全方位图的套显示 📋，提示这套信息更全 */}
                      {option.sheetUrl && <Text className='avatar-options__sheet-badge'>📋</Text>}
                      <Text className='avatar-options__label'>{option.label}</Text>
                    </View>
                  ))}
                </View>
                {/* 选中套的设定图预览：全身多视角参考图，全家福/回忆录用它锁定体型花纹 */}
                {selectedStyleIndex != null && styleOptions[selectedStyleIndex]?.sheetUrl && (
                  <View className='avatar-options__sheet'>
                    <Text className='avatar-options__sheet-label'>📋 全方位角色设定图 · {styleOptions[selectedStyleIndex].label}</Text>
                    <Image
                      className='avatar-options__sheet-img'
                      src={styleOptions[selectedStyleIndex].sheetUrl!}
                      mode='aspectFit'
                      lazyLoad
                    />
                    <Text className='avatar-options__sheet-hint'>正面特写 / 侧面 / 顶部 / 背面 · 存入形象库后可在全家福与回忆录中作为角色参考</Text>
                  </View>
                )}
                <View className='avatar-options__actions'>
                  <View className='avatar-options__btn avatar-options__btn--secondary' onClick={handleResetOptions}>
                    <Text className='avatar-options__btn-text'>重新生成</Text>
                  </View>
                  <View
                    className={`avatar-options__btn avatar-options__btn--secondary ${selectedStyleIndex == null ? 'avatar-options__btn--disabled' : ''}`}
                    onClick={() => selectedStyleIndex != null && handleSaveToLibrary(styleOptions[selectedStyleIndex])}
                  >
                    <Text className='avatar-options__btn-text'>📚 存入形象库</Text>
                  </View>
                  <View
                    className={`avatar-options__btn ${selectedStyleIndex == null ? 'avatar-options__btn--disabled' : ''}`}
                    onClick={handleSaveSelectedOption}
                  >
                    <Text className='avatar-options__btn-text'>保存所选形象</Text>
                  </View>
                </View>
              </View>
            )
          )}
        </View>
      )}
    </View>
  )
}
