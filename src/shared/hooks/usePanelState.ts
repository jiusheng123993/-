import { useCallback, useState } from 'react'
import { flushSync } from 'react-dom'
import type { Order } from '../entitlement/orderTypes'
import type { Product } from '../entitlement/productTypes'
import type { ModuleStoreState } from '../module-store/types'
import type { MemoryProfile } from '../../ai-partner/memory/memoryTypes'
import type { ThemeFamilyId } from '../themes/themeRegistry'

export interface PanelState {
  isThemePickerOpen: boolean
  setIsThemePickerOpen: (v: boolean) => void
  isWallpaperPickerOpen: boolean
  setIsWallpaperPickerOpen: (v: boolean) => void
  isIdentitySelectorOpen: boolean
  setIsIdentitySelectorOpen: (v: boolean) => void
  isMembershipOpen: boolean
  setIsMembershipOpen: (v: boolean) => void
  isPaymentOpen: boolean
  setIsPaymentOpen: (v: boolean) => void
  isRelationshipSpaceOpen: boolean
  setIsRelationshipSpaceOpen: (v: boolean) => void
  isAgentChatOpen: boolean
  setIsAgentChatOpen: (v: boolean) => void
  isMemoryProfileOpen: boolean
  setIsMemoryProfileOpen: (v: boolean) => void
  isPersonaSelectorOpen: boolean
  setIsPersonaSelectorOpen: (v: boolean) => void
  isMemoryStarMapOpen: boolean
  setIsMemoryStarMapOpen: (v: boolean) => void
  isLoginOpen: boolean
  setIsLoginOpen: (v: boolean) => void
  isRegisterOpen: boolean
  setIsRegisterOpen: (v: boolean) => void
  isSettingsOpen: boolean
  setIsSettingsOpen: (v: boolean) => void
  openWorkbenchDetail: string | null
  setOpenWorkbenchDetail: (v: string | null) => void
  selectedProduct: Product | null
  setSelectedProduct: (v: Product | null) => void
  selectedOrder: Order | null
  setSelectedOrder: (v: Order | null) => void
  moduleStoreState: ModuleStoreState
  setModuleStoreState: (v: ModuleStoreState | ((prev: ModuleStoreState) => ModuleStoreState)) => void
  themeSearchQuery: string
  setThemeSearchQuery: (v: string) => void
  activeThemeFamily: ThemeFamilyId | 'all'
  setActiveThemeFamily: (v: ThemeFamilyId | 'all') => void
  dataSource: 'local' | 'supabase'
  setDataSource: (v: 'local' | 'supabase') => void
  currentPersonaId: string | undefined
  setCurrentPersonaId: (v: string | undefined) => void
  memoryProfile: MemoryProfile
  setMemoryProfile: (v: MemoryProfile) => void
  selectedSpaceId: string | null
  setSelectedSpaceId: (v: string | null) => void
  isCreatingSpace: boolean
  setIsCreatingSpace: (v: boolean) => void
  relationshipSpaceWallpaper: string | null
  setRelationshipSpaceWallpaper: (v: string | null) => void
  userTrials: { code: string; expireAt: string; used: boolean }[]
  setUserTrials: (v: { code: string; expireAt: string; used: boolean }[]) => void
  userCoupons: { code: string; type: string; discount: number; used: boolean }[]
  setUserCoupons: (v: { code: string; type: string; discount: number; used: boolean }[]) => void
  inviteRewards: { inviteeName: string; rewardDays: number; status: string }[]
  layoutImportError: string | null
  setLayoutImportError: (v: string | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  closeAllSidebarPanels: (except?: string) => void
}

export function usePanelState(
  initialModuleStoreState: ModuleStoreState,
  initialMemoryProfile: MemoryProfile
): PanelState {
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false)
  const [isWallpaperPickerOpen, setIsWallpaperPickerOpen] = useState(false)
  const [isIdentitySelectorOpen, setIsIdentitySelectorOpen] = useState(false)
  const [isMembershipOpen, setIsMembershipOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isRelationshipSpaceOpen, setIsRelationshipSpaceOpen] = useState(false)
  const [isAgentChatOpen, setIsAgentChatOpen] = useState(false)
  const [isMemoryProfileOpen, setIsMemoryProfileOpen] = useState(false)
  const [isPersonaSelectorOpen, setIsPersonaSelectorOpen] = useState(false)
  const [isMemoryStarMapOpen, setIsMemoryStarMapOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [openWorkbenchDetail, setOpenWorkbenchDetail] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [moduleStoreState, setModuleStoreState] = useState<ModuleStoreState>(initialModuleStoreState)
  const [themeSearchQuery, setThemeSearchQuery] = useState('')
  const [activeThemeFamily, setActiveThemeFamily] = useState<ThemeFamilyId | 'all'>('all')
  const [dataSource, setDataSource] = useState<'local' | 'supabase'>('local')
  const [currentPersonaId, setCurrentPersonaId] = useState<string | undefined>(undefined)
  const [memoryProfile, setMemoryProfile] = useState<MemoryProfile>(initialMemoryProfile)
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [isCreatingSpace, setIsCreatingSpace] = useState(false)
  const [relationshipSpaceWallpaper, setRelationshipSpaceWallpaper] = useState<string | null>(null)
  const [userTrials, setUserTrials] = useState<{ code: string; expireAt: string; used: boolean }[]>([])
  const [userCoupons, setUserCoupons] = useState<{ code: string; type: string; discount: number; used: boolean }[]>([])
  const [inviteRewards] = useState<{ inviteeName: string; rewardDays: number; status: string }[]>([])
  const [layoutImportError, setLayoutImportError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeAllSidebarPanels = useCallback((except?: string) => {
    flushSync(() => {
      setIsThemePickerOpen(false)
      setIsWallpaperPickerOpen(false)
      if (except !== 'agentChat') setIsAgentChatOpen(false); else setIsAgentChatOpen(true)
      if (except !== 'identitySelector') setIsIdentitySelectorOpen(false); else setIsIdentitySelectorOpen(true)
      if (except !== 'personaSelector') setIsPersonaSelectorOpen(false); else setIsPersonaSelectorOpen(true)
      if (except !== 'relationshipSpace') setIsRelationshipSpaceOpen(false); else setIsRelationshipSpaceOpen(true)
      if (except !== 'membership') setIsMembershipOpen(false); else setIsMembershipOpen(true)
      if (except !== 'settings') setIsSettingsOpen(false); else setIsSettingsOpen(true)
      setIsMemoryProfileOpen(false)
      if (except !== 'memoryStarMap') setIsMemoryStarMapOpen(false); else setIsMemoryStarMapOpen(true)
      setSidebarOpen(false)
      setModuleStoreState((current) => ({ ...current, isStoreOpen: false }))
    })
  }, [])

  return {
    isThemePickerOpen, setIsThemePickerOpen,
    isWallpaperPickerOpen, setIsWallpaperPickerOpen,
    isIdentitySelectorOpen, setIsIdentitySelectorOpen,
    isMembershipOpen, setIsMembershipOpen,
    isSettingsOpen, setIsSettingsOpen,
    isPaymentOpen, setIsPaymentOpen,
    isRelationshipSpaceOpen, setIsRelationshipSpaceOpen,
    isAgentChatOpen, setIsAgentChatOpen,
    isMemoryProfileOpen, setIsMemoryProfileOpen,
    isPersonaSelectorOpen, setIsPersonaSelectorOpen,
    isMemoryStarMapOpen, setIsMemoryStarMapOpen,
    isLoginOpen, setIsLoginOpen,
    isRegisterOpen, setIsRegisterOpen,
    openWorkbenchDetail, setOpenWorkbenchDetail,
    selectedProduct, setSelectedProduct,
    selectedOrder, setSelectedOrder,
    moduleStoreState, setModuleStoreState,
    themeSearchQuery, setThemeSearchQuery,
    activeThemeFamily, setActiveThemeFamily,
    dataSource, setDataSource,
    currentPersonaId, setCurrentPersonaId,
    memoryProfile, setMemoryProfile,
    selectedSpaceId, setSelectedSpaceId,
    isCreatingSpace, setIsCreatingSpace,
    relationshipSpaceWallpaper, setRelationshipSpaceWallpaper,
    userTrials, setUserTrials,
    userCoupons, setUserCoupons,
    inviteRewards,
    layoutImportError, setLayoutImportError,
    sidebarOpen, setSidebarOpen,
    closeAllSidebarPanels
  }
}
