import { useCallback, useState } from 'react'
import { flushSync } from 'react-dom'
import type { Order } from '../entitlement/orderTypes'
import type { Product } from '../entitlement/productTypes'
import type { ModuleStoreState } from '../module-store/types'
import type { MemoryProfile } from '../memory/memoryTypes'
import type { ThemeFamilyId } from '../themes/themeRegistry'

export interface PanelState {
  isThemePickerOpen: boolean
  setIsThemePickerOpen: (v: boolean) => void
  isWallpaperPickerOpen: boolean
  setIsWallpaperPickerOpen: (v: boolean) => void
  isIdentitySelectorOpen: boolean
  setIsIdentitySelectorOpen: (v: boolean) => void
  isAIRecommendationOpen: boolean
  setIsAIRecommendationOpen: (v: boolean) => void
  isLayoutShareOpen: boolean
  setIsLayoutShareOpen: (v: boolean) => void
  isMembershipOpen: boolean
  setIsMembershipOpen: (v: boolean) => void
  isPaymentOpen: boolean
  setIsPaymentOpen: (v: boolean) => void
  isAdminConsoleOpen: boolean
  setIsAdminConsoleOpen: (v: boolean) => void
  isRelationshipSpaceOpen: boolean
  setIsRelationshipSpaceOpen: (v: boolean) => void
  isAgentChatOpen: boolean
  setIsAgentChatOpen: (v: boolean) => void
  isMemoryProfileOpen: boolean
  setIsMemoryProfileOpen: (v: boolean) => void
  isCycleTrackerOpen: boolean
  setIsCycleTrackerOpen: (v: boolean) => void
  isAvatarManagerOpen: boolean
  setIsAvatarManagerOpen: (v: boolean) => void
  isPersonaSelectorOpen: boolean
  setIsPersonaSelectorOpen: (v: boolean) => void
  isCustomPersonaEditorOpen: boolean
  setIsCustomPersonaEditorOpen: (v: boolean) => void
  isCommunityPersonaOpen: boolean
  setIsCommunityPersonaOpen: (v: boolean) => void
  isCameoStorefrontOpen: boolean
  setIsCameoStorefrontOpen: (v: boolean) => void
  isDataBackupOpen: boolean
  setIsDataBackupOpen: (v: boolean) => void
  isApiKeySettingsOpen: boolean
  setIsApiKeySettingsOpen: (v: boolean) => void
  isSyncOpen: boolean
  setIsSyncOpen: (v: boolean) => void
  isKnowledgeGraphOpen: boolean
  setIsKnowledgeGraphOpen: (v: boolean) => void
  isScheduleOpen: boolean
  setIsScheduleOpen: (v: boolean) => void
  isBacklinkOpen: boolean
  setIsBacklinkOpen: (v: boolean) => void
  isFocusModeOpen: boolean
  setIsFocusModeOpen: (v: boolean) => void
  isTemplateOpen: boolean
  setIsTemplateOpen: (v: boolean) => void
  isReviewSchedulerOpen: boolean
  setIsReviewSchedulerOpen: (v: boolean) => void
  isSupabaseConfigOpen: boolean
  setIsSupabaseConfigOpen: (v: boolean) => void
  isReportOpen: boolean
  setIsReportOpen: (v: boolean) => void
  isGlobalSearchOpen: boolean
  setIsGlobalSearchOpen: (v: boolean) => void
  isQuickNotesOpen: boolean
  setIsQuickNotesOpen: (v: boolean) => void
  isTimeBlockOpen: boolean
  setIsTimeBlockOpen: (v: boolean) => void
  isFocusStatsOpen: boolean
  setIsFocusStatsOpen: (v: boolean) => void
  isFocusHistoryOpen: boolean
  setIsFocusHistoryOpen: (v: boolean) => void
  isMigrationOpen: boolean
  setIsMigrationOpen: (v: boolean) => void
  isMemoryStarMapOpen: boolean
  setIsMemoryStarMapOpen: (v: boolean) => void
  isMetricsDashboardOpen: boolean
  setIsMetricsDashboardOpen: (v: boolean) => void
  isLoginOpen: boolean
  setIsLoginOpen: (v: boolean) => void
  isRegisterOpen: boolean
  setIsRegisterOpen: (v: boolean) => void
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
  const [isAIRecommendationOpen, setIsAIRecommendationOpen] = useState(false)
  const [isLayoutShareOpen, setIsLayoutShareOpen] = useState(false)
  const [isMembershipOpen, setIsMembershipOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isAdminConsoleOpen, setIsAdminConsoleOpen] = useState(false)
  const [isRelationshipSpaceOpen, setIsRelationshipSpaceOpen] = useState(false)
  const [isAgentChatOpen, setIsAgentChatOpen] = useState(false)
  const [isMemoryProfileOpen, setIsMemoryProfileOpen] = useState(false)
  const [isCycleTrackerOpen, setIsCycleTrackerOpen] = useState(false)
  const [isAvatarManagerOpen, setIsAvatarManagerOpen] = useState(false)
  const [isPersonaSelectorOpen, setIsPersonaSelectorOpen] = useState(false)
  const [isCustomPersonaEditorOpen, setIsCustomPersonaEditorOpen] = useState(false)
  const [isCommunityPersonaOpen, setIsCommunityPersonaOpen] = useState(false)
  const [isCameoStorefrontOpen, setIsCameoStorefrontOpen] = useState(false)
  const [isDataBackupOpen, setIsDataBackupOpen] = useState(false)
  const [isApiKeySettingsOpen, setIsApiKeySettingsOpen] = useState(false)
  const [isSyncOpen, setIsSyncOpen] = useState(false)
  const [isKnowledgeGraphOpen, setIsKnowledgeGraphOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isBacklinkOpen, setIsBacklinkOpen] = useState(false)
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false)
  const [isTemplateOpen, setIsTemplateOpen] = useState(false)
  const [isReviewSchedulerOpen, setIsReviewSchedulerOpen] = useState(false)
  const [isSupabaseConfigOpen, setIsSupabaseConfigOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false)
  const [isTimeBlockOpen, setIsTimeBlockOpen] = useState(false)
  const [isFocusStatsOpen, setIsFocusStatsOpen] = useState(false)
  const [isFocusHistoryOpen, setIsFocusHistoryOpen] = useState(false)
  const [isMigrationOpen, setIsMigrationOpen] = useState(false)
  const [isMemoryStarMapOpen, setIsMemoryStarMapOpen] = useState(false)
  const [isMetricsDashboardOpen, setIsMetricsDashboardOpen] = useState(false)
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
      setIsAIRecommendationOpen(false)
      setIsLayoutShareOpen(false)
      setIsPaymentOpen(false)
      setIsAdminConsoleOpen(false)
      if (except !== 'agentChat') setIsAgentChatOpen(false); else setIsAgentChatOpen(true)
      if (except !== 'identitySelector') setIsIdentitySelectorOpen(false); else setIsIdentitySelectorOpen(true)
      if (except !== 'personaSelector') setIsPersonaSelectorOpen(false); else setIsPersonaSelectorOpen(true)
      if (except !== 'relationshipSpace') setIsRelationshipSpaceOpen(false); else setIsRelationshipSpaceOpen(true)
      if (except !== 'knowledgeGraph') setIsKnowledgeGraphOpen(false); else setIsKnowledgeGraphOpen(true)
      if (except !== 'membership') setIsMembershipOpen(false); else setIsMembershipOpen(true)
      if (except !== 'dataBackup') setIsDataBackupOpen(false); else setIsDataBackupOpen(true)
      if (except !== 'apiKeySettings') setIsApiKeySettingsOpen(false); else setIsApiKeySettingsOpen(true)
      if (except !== 'supabaseConfig') setIsSupabaseConfigOpen(false); else setIsSupabaseConfigOpen(true)
      if (except !== 'migration') setIsMigrationOpen(false); else setIsMigrationOpen(true)
      if (except !== 'settings') setIsSettingsOpen(false); else setIsSettingsOpen(true)
      setIsMemoryProfileOpen(false)
      setIsCycleTrackerOpen(false)
      setIsAvatarManagerOpen(false)
      setIsScheduleOpen(false)
      setIsBacklinkOpen(false)
      setIsTemplateOpen(false)
      setIsReviewSchedulerOpen(false)
      setIsReportOpen(false)
      setIsGlobalSearchOpen(false)
      setIsQuickNotesOpen(false)
      setIsTimeBlockOpen(false)
      setIsFocusStatsOpen(false)
      setIsFocusHistoryOpen(false)
      if (except !== 'memoryStarMap') setIsMemoryStarMapOpen(false); else setIsMemoryStarMapOpen(true)
      if (except !== 'metricsDashboard') setIsMetricsDashboardOpen(false); else setIsMetricsDashboardOpen(true)
      setSidebarOpen(false)
      setModuleStoreState((current) => ({ ...current, isStoreOpen: false }))
    })
  }, [])

  return {
    isThemePickerOpen, setIsThemePickerOpen,
    isWallpaperPickerOpen, setIsWallpaperPickerOpen,
    isIdentitySelectorOpen, setIsIdentitySelectorOpen,
    isAIRecommendationOpen, setIsAIRecommendationOpen,
    isLayoutShareOpen, setIsLayoutShareOpen,
    isMembershipOpen, setIsMembershipOpen,
    isSettingsOpen, setIsSettingsOpen,
    isPaymentOpen, setIsPaymentOpen,
    isAdminConsoleOpen, setIsAdminConsoleOpen,
    isRelationshipSpaceOpen, setIsRelationshipSpaceOpen,
    isAgentChatOpen, setIsAgentChatOpen,
    isMemoryProfileOpen, setIsMemoryProfileOpen,
    isCycleTrackerOpen, setIsCycleTrackerOpen,
    isAvatarManagerOpen, setIsAvatarManagerOpen,
    isPersonaSelectorOpen, setIsPersonaSelectorOpen,
    isCustomPersonaEditorOpen, setIsCustomPersonaEditorOpen,
    isCommunityPersonaOpen, setIsCommunityPersonaOpen,
    isCameoStorefrontOpen, setIsCameoStorefrontOpen,
    isDataBackupOpen, setIsDataBackupOpen,
    isApiKeySettingsOpen, setIsApiKeySettingsOpen,
    isSyncOpen, setIsSyncOpen,
    isKnowledgeGraphOpen, setIsKnowledgeGraphOpen,
    isScheduleOpen, setIsScheduleOpen,
    isBacklinkOpen, setIsBacklinkOpen,
    isFocusModeOpen, setIsFocusModeOpen,
    isTemplateOpen, setIsTemplateOpen,
    isReviewSchedulerOpen, setIsReviewSchedulerOpen,
    isSupabaseConfigOpen, setIsSupabaseConfigOpen,
    isReportOpen, setIsReportOpen,
    isGlobalSearchOpen, setIsGlobalSearchOpen,
    isQuickNotesOpen, setIsQuickNotesOpen,
    isTimeBlockOpen, setIsTimeBlockOpen,
    isFocusStatsOpen, setIsFocusStatsOpen,
    isFocusHistoryOpen, setIsFocusHistoryOpen,
    isMigrationOpen, setIsMigrationOpen,
    isMemoryStarMapOpen, setIsMemoryStarMapOpen,
    isMetricsDashboardOpen, setIsMetricsDashboardOpen,
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
