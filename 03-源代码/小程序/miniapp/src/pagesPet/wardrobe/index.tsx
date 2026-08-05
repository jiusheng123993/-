/**
 * 宠物换装页面
 * 宠物配饰搭配、主题套装预览与切换
 */
import { View, Text } from '@tarojs/components'
import { useState, useCallback, useMemo } from 'react'
import Taro from '@tarojs/taro'
import { useThemeClass } from '../../hooks/useThemeClass'
import { useWardrobe } from '../../hooks/useWardrobe'
import { usePetStore } from '../../stores/petStore'
import { useAuthStore } from '../../stores/authStore'
import { shareCardService } from '../../services/shareCardService'
import type { AccessorySlot, ThemeSuiteTask } from '../../types/wardrobeTypes'
import OutfitPreview from '../../components/Wardrobe/OutfitPreview'
import AccessoryPicker from '../../components/Wardrobe/AccessoryPicker'
import ThemeSuiteGallery from '../../components/Wardrobe/ThemeSuiteGallery'
import MyWardrobe from '../../components/Wardrobe/MyWardrobe'
import AccessoryUnlockModal from '../../components/Wardrobe/AccessoryUnlockModal'
import SaveOutfitBar from '../../components/Wardrobe/SaveOutfitBar'
import ThemeSuiteProgress from '../../components/Wardrobe/ThemeSuiteProgress'
import './index.scss'

type WardrobeTab = 'outfit' | 'theme' | 'wardrobe'

const TAB_CONFIG: Array<{ key: WardrobeTab; label: string; icon: string }> = [
  { key: 'outfit', label: '换装', icon: '👔' },
  { key: 'theme', label: '主题', icon: '🎨' },
  { key: 'wardrobe', label: '衣橱', icon: '📦' },
]

export default function WardrobePage() {
  const themeClass = useThemeClass()
  const { currentPet } = usePetStore()
  const authUserId = useAuthStore(s => s.user?.id || '')
  const wardrobe = useWardrobe()

  const [activeTab, setActiveTab] = useState<WardrobeTab>('outfit')
  const [activeSlot, setActiveSlot] = useState<AccessorySlot>('head')
  const [unlockTarget, setUnlockTarget] = useState<string | null>(null)
  const [unlockModalVisible, setUnlockModalVisible] = useState(false)
  const [sharing, setSharing] = useState(false)

  const species = currentPet?.species || 'dog'
  const petName = currentPet?.name || '毛孩子'

  const outfitSlots = wardrobe.outfit?.outfitSlots || {}
  const isDirty = useMemo(() => {
    if (!wardrobe.outfit) return false
    return Object.keys(outfitSlots).some(slot => outfitSlots[slot as AccessorySlot])
  }, [wardrobe.outfit, outfitSlots])

  const handleSlotTap = useCallback((slot: AccessorySlot) => {
    setActiveSlot(slot)
  }, [])

  const handleEquip = useCallback(
    (slot: AccessorySlot, accessoryId: string) => {
      const isOwned = wardrobe.inventory.some(i => i.accessoryId === accessoryId)
      if (!isOwned) {
        setUnlockTarget(accessoryId)
        setUnlockModalVisible(true)
        return
      }
      wardrobe.toggleSlot(slot, accessoryId)
    },
    [wardrobe.inventory, wardrobe.toggleSlot],
  )

  const handleUnlockRequest = useCallback((accessoryId: string, _source: string) => {
    setUnlockTarget(accessoryId)
    setUnlockModalVisible(true)
  }, [])

  const handleUnlockClose = useCallback(() => {
    setUnlockModalVisible(false)
    setUnlockTarget(null)
  }, [])

  const handleUnlocked = useCallback((_accessoryId: string) => {
    if (authUserId && currentPet?.id) {
      wardrobe.initWardrobe(authUserId, currentPet.id)
    }
  }, [authUserId, currentPet?.id, wardrobe.initWardrobe])

  const handleUpgrade = useCallback(() => {
    setUnlockModalVisible(false)
    Taro.navigateTo({ url: '/pages/member/index' })
  }, [])

  const handleSave = useCallback(async () => {
    await wardrobe.saveCurrentTryOn()
    Taro.showToast({ title: '形象已保存', icon: 'success' })
  }, [wardrobe.saveCurrentTryOn])

  const handleReset = useCallback(() => {
    wardrobe.clearOutfit()
  }, [wardrobe.clearOutfit])

  const handleShare = useCallback(async () => {
    if (sharing) return
    setSharing(true)
    try {
      // 生成配饰描述文字
      const pieces = Object.entries(outfitSlots)
        .filter(([, v]) => v)
        .map(([slot]) => {
          const labels: Record<string, string> = { head: '头饰', neck: '项圈', back: '背包', body: '衣服', feet: '鞋袜' }
          return labels[slot] || slot
        })
      const customText = pieces.length > 0
        ? `${petName}的今日穿搭：${pieces.join('、')}`
        : `${petName}的时尚造型`

      const card = await shareCardService.generateShareCard({
        card_type: 'wardrobe',
        source_data: {
          pet_id: currentPet?.id,
          custom_text: customText,
        },
        style: { theme: 'cute' },
      })

      // 预览生成的分享卡片
      Taro.previewImage({
        urls: [card.card_url],
        current: card.card_url,
      })
    } catch {
      Taro.showToast({ title: '生成分享卡片失败', icon: 'none' })
    } finally {
      setSharing(false)
    }
  }, [sharing, outfitSlots, petName, currentPet?.id])

  const handleGenerate = useCallback(
    async (suiteId: string) => {
      await wardrobe.generateTheme(suiteId)
    },
    [wardrobe.generateTheme],
  )

  const handleViewResult = useCallback(
    (task: ThemeSuiteTask) => {
      if (task.resultUrl) {
        Taro.previewImage({
          urls: [task.resultUrl],
          current: task.resultUrl,
        })
      }
    },
    [],
  )

  const handleRetry = useCallback(async () => {
    if (wardrobe.activeThemeTask) {
      await wardrobe.generateTheme(wardrobe.activeThemeTask.suiteId)
    }
  }, [wardrobe.activeThemeTask, wardrobe.generateTheme])

  const handleDismissProgress = useCallback(() => {
    wardrobe.clearError()
  }, [wardrobe.clearError])

  const handleHistoryTap = useCallback(() => {
    setActiveTab('wardrobe')
  }, [])

  const handleThemeTap = useCallback(
    (task: ThemeSuiteTask) => {
      if (task.resultUrl) {
        Taro.previewImage({
          urls: [task.resultUrl],
          current: task.resultUrl,
        })
      }
    },
    [],
  )

  if (wardrobe.isLoading) {
    return (
      <View className={`wardrobe-page ${themeClass}`}>
        <View className='wardrobe-page__loading'>
          <View className='wardrobe-page__loading-spinner' />
          <Text className='wardrobe-page__loading-text'>加载衣橱中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className={`wardrobe-page ${themeClass}`}>
      <View className='wardrobe-page__tabs'>
        {TAB_CONFIG.map(({ key, label, icon }) => (
          <View
            key={key}
            className={`wardrobe-page__tab${activeTab === key ? ' wardrobe-page__tab--active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Text className='wardrobe-page__tab-icon'>{icon}</Text>
            <Text className='wardrobe-page__tab-label'>{label}</Text>
          </View>
        ))}
      </View>

      {wardrobe.error && (
        <View className='wardrobe-page__error'>
          <Text className='wardrobe-page__error-text'>{wardrobe.error}</Text>
          <View className='wardrobe-page__error-close' onClick={wardrobe.clearError}>
            <Text className='wardrobe-page__error-close-icon'>✕</Text>
          </View>
        </View>
      )}

      <View className='wardrobe-page__content'>
        {activeTab === 'outfit' && (
          <View className='wardrobe-page__outfit'>
            <OutfitPreview
              species={species}
              petName={petName}
              outfitSlots={outfitSlots}
              preview={wardrobe.preview}
              onSlotTap={handleSlotTap}
              activeSlot={activeSlot}
            />

            <AccessoryPicker
              inventory={wardrobe.inventory}
              activeSlot={activeSlot}
              equippedSlots={outfitSlots}
              onEquip={handleEquip}
              onUnlockRequest={handleUnlockRequest}
            />

            <SaveOutfitBar
              outfitSlots={outfitSlots}
              isDirty={isDirty}
              isSaving={false}
              onSave={handleSave}
              onReset={handleReset}
              onShare={handleShare}
            />
          </View>
        )}

        {activeTab === 'theme' && (
          <View className='wardrobe-page__theme'>
            <ThemeSuiteProgress
              task={wardrobe.activeThemeTask}
              isGenerating={wardrobe.isGenerating}
              onRetry={handleRetry}
              onViewResult={handleViewResult}
              onDismiss={handleDismissProgress}
            />

            <ThemeSuiteGallery
              themes={wardrobe.themeSuites}
              quota={wardrobe.themeQuota}
              activeTask={wardrobe.activeThemeTask}
              isGenerating={wardrobe.isGenerating}
              onGenerate={handleGenerate}
              onViewResult={handleViewResult}
            />
          </View>
        )}

        {activeTab === 'wardrobe' && (
          <View className='wardrobe-page__collection'>
            <MyWardrobe
              inventory={wardrobe.inventory}
              tryOnHistory={wardrobe.tryOnHistory}
              themeHistory={[]}
              onHistoryTap={handleHistoryTap}
              onThemeTap={handleThemeTap}
            />
          </View>
        )}
      </View>

      <AccessoryUnlockModal
        visible={unlockModalVisible}
        accessoryId={unlockTarget}
        onClose={handleUnlockClose}
        onUpgrade={handleUpgrade}
        onUnlocked={handleUnlocked}
      />
    </View>
  )
}
