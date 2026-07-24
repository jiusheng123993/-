import { useEffect, useCallback, useRef } from 'react'
import { useWardrobeStore } from '../stores/wardrobeStore'
import { useAuthStore } from '../stores/authStore'
import { usePetStore } from '../stores/petStore'
import type { AccessorySlot, OutfitSlotMap, PetOutfit, UserAccessoryInventory, ThemeSuiteDef, ThemeSuiteTask, ThemeQuotaInfo, TryOnHistoryEntry } from '../types/wardrobeTypes'
import type { OutfitPreview } from '../services/outfitComposition'
import { getEquippedCount, getEmptySlots, isOutfitEmpty, getSlotLabel } from '../services/outfitComposition'

interface UseWardrobeReturn {
  inventory: UserAccessoryInventory[]
  outfit: PetOutfit | null
  preview: OutfitPreview | null
  tryOnHistory: TryOnHistoryEntry[]
  themeSuites: ThemeSuiteDef[]
  themeQuota: ThemeQuotaInfo
  activeThemeTask: ThemeSuiteTask | null
  isLoading: boolean
  isEquipping: boolean
  isGenerating: boolean
  error: string | null
  equippedCount: number
  emptySlots: AccessorySlot[]
  isOutfitEmpty: boolean
  initWardrobe: (userId: string, petId: string) => Promise<void>
  switchPet: (petId: string) => Promise<void>
  toggleSlot: (slot: AccessorySlot, accessoryId: string) => void
  clearOutfit: () => void
  saveCurrentTryOn: () => Promise<void>
  unlock: (accessoryId: string, source: string) => Promise<void>
  generateTheme: (suiteId: string) => Promise<void>
  refreshThemeOverview: () => Promise<void>
  clearError: () => void
  getSlotLabel: (slot: AccessorySlot) => string
}

export function useWardrobe(): UseWardrobeReturn {
  const store = useWardrobeStore()
  const authUserId = useAuthStore(s => s.user?.id || '')
  const currentPet = usePetStore(s => s.currentPet)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (authUserId && currentPet?.id && !initializedRef.current) {
      initializedRef.current = true
      store.initWardrobe(authUserId, currentPet.id)
    }
  }, [authUserId, currentPet?.id])

  useEffect(() => {
    if (authUserId && currentPet?.id && initializedRef.current && store.petId !== currentPet.id) {
      store.switchPet(currentPet.id)
    }
  }, [currentPet?.id])

  useEffect(() => {
    return () => {
      store.reset()
    }
  }, [])

  const handleToggleSlot = useCallback(
    (slot: AccessorySlot, accessoryId: string) => {
      store.toggleSlot(slot, accessoryId)
    },
    [store.toggleSlot],
  )

  const handleClearOutfit = useCallback(() => {
    store.clearOutfit()
  }, [store.clearOutfit])

  const handleSaveTryOn = useCallback(async () => {
    await store.saveCurrentTryOn()
  }, [store.saveCurrentTryOn])

  const handleUnlock = useCallback(
    async (accessoryId: string, source: string) => {
      await store.unlock(accessoryId, source)
    },
    [store.unlock],
  )

  const handleGenerateTheme = useCallback(
    async (suiteId: string) => {
      await store.generateTheme(suiteId)
    },
    [store.generateTheme],
  )

  const handleRefreshTheme = useCallback(async () => {
    await store.refreshThemeOverview()
  }, [store.refreshThemeOverview])

  const handleClearError = useCallback(() => {
    store.clearError()
  }, [store.clearError])

  const outfitSlots = store.outfit?.outfitSlots || {}

  return {
    inventory: store.inventory,
    outfit: store.outfit,
    preview: store.preview,
    tryOnHistory: store.tryOnHistory,
    themeSuites: store.themeSuites,
    themeQuota: store.themeQuota,
    activeThemeTask: store.activeThemeTask,
    isLoading: store.isLoading,
    isEquipping: store.isEquipping,
    isGenerating: store.isGenerating,
    error: store.error,
    equippedCount: getEquippedCount(outfitSlots),
    emptySlots: getEmptySlots(outfitSlots),
    isOutfitEmpty: isOutfitEmpty(outfitSlots),
    initWardrobe: store.initWardrobe,
    switchPet: store.switchPet,
    toggleSlot: handleToggleSlot,
    clearOutfit: handleClearOutfit,
    saveCurrentTryOn: handleSaveTryOn,
    unlock: handleUnlock,
    generateTheme: handleGenerateTheme,
    refreshThemeOverview: handleRefreshTheme,
    clearError: handleClearError,
    getSlotLabel,
  }
}
