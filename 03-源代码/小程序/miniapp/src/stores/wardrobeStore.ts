import create from 'zustand'
import type {
  AccessorySlot,
  OutfitSlotMap,
  PetOutfit,
  UserAccessoryInventory,
  TryOnHistoryEntry,
  ThemeSuiteDef,
  ThemeSuiteTask,
  ThemeQuotaInfo,
} from '../types/wardrobeTypes'
import {
  getWardrobeOverview,
  equipAccessory,
  unequipAccessory,
  saveTryOnSnapshot,
  unlockAccessory,
  getLocalOutfitForPet,
  updateLocalOutfit,
  debouncedEquipAccessory,
  debouncedUnequipAccessory,
  clearOutfitSaveTimer,
} from '../services/wardrobeService'
import {
  getThemeSuiteOverview,
  generateThemeSuite,
  getThemeSuiteTaskStatus,
  pollThemeSuiteTask,
  getThemeQuota,
  canGenerateTheme,
  getActiveThemeTask,
} from '../services/themeSuiteService'
import {
  buildOutfitPreview,
  toggleSlotInOutfit,
  clearAllSlots,
  getEquippedCount,
  isOutfitEmpty,
  areOutfitsEqual,
  type OutfitPreview,
} from '../services/outfitComposition'

interface WardrobeState {
  userId: string | null
  petId: string | null
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

  initWardrobe: (userId: string, petId: string) => Promise<void>
  switchPet: (petId: string) => Promise<void>
  equip: (slot: AccessorySlot, accessoryId: string) => Promise<void>
  unequip: (slot: AccessorySlot) => Promise<void>
  toggleSlot: (slot: AccessorySlot, accessoryId: string) => void
  clearOutfit: () => void
  saveCurrentTryOn: () => Promise<void>
  unlock: (accessoryId: string, source: string) => Promise<void>
  generateTheme: (suiteId: string) => Promise<void>
  refreshThemeOverview: () => Promise<void>
  refreshOutfit: () => void
  clearError: () => void
  reset: () => void
}

const initialState = {
  userId: null as string | null,
  petId: null as string | null,
  inventory: [] as UserAccessoryInventory[],
  outfit: null as PetOutfit | null,
  preview: null as OutfitPreview | null,
  tryOnHistory: [] as TryOnHistoryEntry[],
  themeSuites: [] as ThemeSuiteDef[],
  themeQuota: { monthlyLimit: 0, usedThisMonth: 0, remaining: 0 } as ThemeQuotaInfo,
  activeThemeTask: null as ThemeSuiteTask | null,
  isLoading: false,
  isEquipping: false,
  isGenerating: false,
  error: null as string | null,
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  ...initialState,

  initWardrobe: async (userId: string, petId: string) => {
    set({ userId, petId, isLoading: true, error: null })
    try {
      const overview = await getWardrobeOverview(userId, petId)
      const outfit = overview.outfit || { petId, outfitSlots: {}, updatedAt: new Date().toISOString() }
      const preview = buildOutfitPreview(outfit.outfitSlots, 'dog')

      set({
        inventory: overview.accessories,
        outfit,
        preview,
        tryOnHistory: overview.tryOnHistory,
        isLoading: false,
      })

      get().refreshThemeOverview()
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载衣橱失败',
      })
    }
  },

  switchPet: async (petId: string) => {
    const { userId } = get()
    if (!userId) return

    clearOutfitSaveTimer()
    set({ petId, isLoading: true, error: null })
    try {
      const overview = await getWardrobeOverview(userId, petId)
      const outfit = overview.outfit || { petId, outfitSlots: {}, updatedAt: new Date().toISOString() }
      const preview = buildOutfitPreview(outfit.outfitSlots, 'dog')

      set({
        inventory: overview.accessories,
        outfit,
        preview,
        tryOnHistory: overview.tryOnHistory,
        isLoading: false,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '切换宠物失败',
      })
    }
  },

  equip: async (slot: AccessorySlot, accessoryId: string) => {
    const { userId, petId } = get()
    if (!userId || !petId) return

    set({ isEquipping: true, error: null })
    try {
      const result = await equipAccessory(userId, petId, slot, accessoryId)
      const preview = buildOutfitPreview(result.outfit.outfitSlots, 'dog')
      set({ outfit: result.outfit, preview, isEquipping: false })
    } catch (err) {
      set({
        isEquipping: false,
        error: err instanceof Error ? err.message : '装备失败',
      })
    }
  },

  unequip: async (slot: AccessorySlot) => {
    const { userId, petId } = get()
    if (!userId || !petId) return

    set({ isEquipping: true, error: null })
    try {
      const result = await unequipAccessory(userId, petId, slot)
      const preview = buildOutfitPreview(result.outfit.outfitSlots, 'dog')
      set({ outfit: result.outfit, preview, isEquipping: false })
    } catch (err) {
      set({
        isEquipping: false,
        error: err instanceof Error ? err.message : '卸下失败',
      })
    }
  },

  toggleSlot: (slot: AccessorySlot, accessoryId: string) => {
    const { userId, petId, outfit } = get()
    if (!userId || !petId) return

    const currentSlots = outfit?.outfitSlots || {}
    const updatedSlots = toggleSlotInOutfit(currentSlots, slot, accessoryId)
    const updatedOutfit: PetOutfit = {
      petId,
      outfitSlots: updatedSlots,
      updatedAt: new Date().toISOString(),
    }
    const preview = buildOutfitPreview(updatedSlots, 'dog')
    set({ outfit: updatedOutfit, preview })

    if (updatedSlots[slot]) {
      debouncedEquipAccessory(userId, petId, slot, accessoryId, (newOutfit) => {
        const currentOutfit = get().outfit
        if (currentOutfit && areOutfitsEqual(currentOutfit.outfitSlots, newOutfit.outfitSlots)) {
          set({ outfit: newOutfit })
        }
      })
    } else {
      debouncedUnequipAccessory(userId, petId, slot, (newOutfit) => {
        const currentOutfit = get().outfit
        if (currentOutfit && areOutfitsEqual(currentOutfit.outfitSlots, newOutfit.outfitSlots)) {
          set({ outfit: newOutfit })
        }
      })
    }
  },

  clearOutfit: () => {
    const { userId, petId, outfit } = get()
    if (!userId || !petId || !outfit) return

    const clearedSlots = clearAllSlots(outfit.outfitSlots)
    const updatedOutfit: PetOutfit = {
      petId,
      outfitSlots: clearedSlots,
      updatedAt: new Date().toISOString(),
    }
    const preview = buildOutfitPreview(clearedSlots, 'dog')
    set({ outfit: updatedOutfit, preview })

    for (const slot of Object.keys(outfit.outfitSlots) as AccessorySlot[]) {
      debouncedUnequipAccessory(userId, petId, slot, () => {})
    }
  },

  saveCurrentTryOn: async () => {
    const { userId, petId, outfit } = get()
    if (!userId || !petId || !outfit) return

    try {
      const entry = await saveTryOnSnapshot(userId, petId, outfit.outfitSlots)
      set(state => ({ tryOnHistory: [entry, ...state.tryOnHistory].slice(0, 20) }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存试穿记录失败' })
    }
  },

  unlock: async (accessoryId: string, source: string) => {
    const { userId } = get()
    if (!userId) return

    try {
      const item = await unlockAccessory(userId, accessoryId, source)
      set(state => ({ inventory: [...state.inventory, item] }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '解锁配饰失败' })
    }
  },

  generateTheme: async (suiteId: string) => {
    const { userId, petId } = get()
    if (!userId || !petId) return

    if (!canGenerateTheme(userId)) {
      set({ error: '本月生成次数已用完' })
      return
    }

    set({ isGenerating: true, error: null })
    try {
      const { taskId } = await generateThemeSuite(userId, petId, suiteId)

      const task: ThemeSuiteTask = {
        id: taskId,
        userId,
        petId,
        suiteId,
        status: 'pending',
        resultUrl: null,
        moderationResult: null,
        quotaConsumed: true,
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      set({ activeThemeTask: task })

      await pollThemeSuiteTask(
        userId,
        taskId,
        (updatedTask) => {
          set({ activeThemeTask: updatedTask })
        },
        (completedTask) => {
          set({ activeThemeTask: completedTask, isGenerating: false })
          get().refreshThemeOverview()
        },
        (error) => {
          set({ isGenerating: false, error: error.message })
        },
      )
    } catch (err) {
      set({
        isGenerating: false,
        error: err instanceof Error ? err.message : '生成主题套装失败',
      })
    }
  },

  refreshThemeOverview: async () => {
    const { userId } = get()
    if (!userId) return

    try {
      const overview = await getThemeSuiteOverview(userId)
      set({
        themeSuites: overview.suites,
        themeQuota: overview.quota,
        activeThemeTask: overview.activeTask,
      })
    } catch {
      // best-effort refresh
    }
  },

  refreshOutfit: () => {
    const { petId, outfit } = get()
    if (!petId) return

    const currentOutfit = outfit || getLocalOutfitForPet(petId)
    if (currentOutfit) {
      const preview = buildOutfitPreview(currentOutfit.outfitSlots, 'dog')
      set({ outfit: currentOutfit, preview })
    }
  },

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    clearOutfitSaveTimer()
    set(initialState)
  },
}))
