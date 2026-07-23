import { View, Text, Image } from '@tarojs/components'
import { useState, useMemo, useCallback, useEffect } from 'react'
import Taro from '@tarojs/taro'
import PetAvatar from '../../components/PetAvatar'
import {
  generateAvatarImage,
  getAvatarCustomization,
  saveAvatarCustomization,
  canGenerateAvatar,
  getGenerationCount,
} from '../../services/avatarService'
import { usePetStore } from '../../stores/petStore'
import { useMembership } from '../../hooks/useMembership'
import { useAnalytics } from '../../hooks/useAnalytics'
import type { ExpressionContext, PetSpecies } from '../../types/avatarTypes'
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

export default function AvatarCustomizePage() {
  const { currentPet } = usePetStore()
  const { isMember } = useMembership()
  const { trackPageView, trackEvent } = useAnalytics()
  const [selectedStyle, setSelectedStyle] = useState<'cartoon' | 'realistic'>('cartoon')
  const [selectedColor, setSelectedColor] = useState('#FFD93D')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [genCount, setGenCount] = useState(getGenerationCount())

  const species = (currentPet?.species || 'dog') as PetSpecies
  const petName = currentPet?.name || '毛孩子'

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

  const canGenerate = useMemo(() => canGenerateAvatar(isMember), [isMember, genCount])

  const existingCustom = useMemo(() => getAvatarCustomization(), [])

  const handleGenerate = useCallback(async () => {
    if (!canGenerateAvatar(isMember)) {
      trackEvent('show_paywall', { source: 'avatar_generate' })
    }
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
            if (res.confirm) {
              Taro.switchTab({ url: '/pages/member/index' })
            }
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

  const handleSave = useCallback(async () => {
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
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }, [generatedUrl, species, selectedStyle, selectedColor, trackEvent])

  return (
    <View className='avatar-customize'>
      <View className='avatar-customize__preview'>
        {isGenerating ? (
          <View className='avatar-customize__generating'>
            <View className='avatar-customize__generating-spinner' />
            <Text className='avatar-customize__generating-text'>AI 正在为你生成专属形象...</Text>
          </View>
        ) : generatedUrl ? (
          <Image
            className='avatar-customize__generated-img'
            src={generatedUrl}
            mode='aspectFit'
          />
        ) : (
          <PetAvatar
            species={species}
            petName={petName}
            expressionContext={expressionContext}
            size={160}
            showLabel
          />
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
              {selectedColor === color.value && (
                <Text className='avatar-customize__color-check'>✓</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      <View className='avatar-customize__quota'>
        <Text className='avatar-customize__quota-text'>
          {isMember ? '会员无限生成' : `剩余次数：${Math.max(0, 1 - genCount)}/1`}
        </Text>
      </View>

      <View className='avatar-customize__actions'>
        {!generatedUrl ? (
          <View
            className={`avatar-customize__btn ${!canGenerate ? 'avatar-customize__btn--disabled' : ''}`}
            onClick={handleGenerate}
          >
            <Text className='avatar-customize__btn-text'>生成头像</Text>
          </View>
        ) : (
          <View className='avatar-customize__btn-group'>
            <View className='avatar-customize__btn avatar-customize__btn--secondary' onClick={() => setGeneratedUrl(null)}>
              <Text className='avatar-customize__btn-text'>重新生成</Text>
            </View>
            <View className='avatar-customize__btn' onClick={handleSave}>
              <Text className='avatar-customize__btn-text'>保存头像</Text>
            </View>
          </View>
        )}
      </View>

      {existingCustom && !generatedUrl && (
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
    </View>
  )
}
