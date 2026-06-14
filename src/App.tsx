import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  Bot,
  Minus,
  Plus
} from 'lucide-react'
import { createAiPromptDraft, getAiProviderById } from './ai/aiProvider'
import {
  createBrowserWorkspaceStore,
  createInitialWorkspaceState,
  type FocusSessionRecord,
  type WorkspaceState,
  type WorkspaceType
} from './data/workspaceStore'
import { getPersonaById, type PersonaId } from './personas/personaRegistry'
import { PersonaSelectorUI } from './personas/PersonaSelectorUI'
import { PersonaSwitcher } from './personas/PersonaSwitcher'
import { createCameoTriggerEngine, buildTriggerContextFromMemoryObserver } from './personas/cameoTriggerEngine'
import { createPersonaScheduler, PRESET_PERSONAS } from './personas/personaScheduler'
import { createPersonaScheduleStorage } from './personas/personaScheduleStore'
import { createSafetyIncidentLog } from './personas/safetyIncidentLog'
import { createRelationshipHealthMonitor } from './personas/relationshipHealthMonitor'
import { CustomPersonaEditorUI } from './personas/CustomPersonaEditorUI'
import { createPersonaSafetyGate } from './personas/personaSafetyGate'
import { createPersonaAvatarGen } from './personas/personaAvatarGen'
import { createAvatarAiGenQuotaProvider } from './entitlement/avatarAiGenProvider'
import { avatarAIProvider } from './avatar'
import { createCommunityPersonaService } from './personas/community/communityPersonaService'
import { addCustomPersona, loadCustomPersonas } from './personas/customPersona'
import { CommunityPersonaUI } from './personas/community/CommunityPersonaUI'
import { CameoStorefrontUI } from './personas/CameoStorefrontUI'
import { createPersonaProvider } from './entitlement/personaProvider'
import { createCustomPersonaService } from './personas/customPersonaService'
import { IdentityProvider } from './identity/IdentityProvider'
import { IdentitySelector } from './identity/IdentitySelector'
import { Sidebar } from './sidebar/Sidebar'
import { SidebarToggle } from './sidebar/SidebarToggle'
import { AdaptiveSidebar } from './platforms'
import { getPersonaTemplateById } from './personas/personaTemplates'
import {
  getThemeById,
  materialLabels,
  themeFamilyMeta,
  themeRegistry,
  type StudyTheme,
  type ThemeFamilyId,
  type ThemeId
} from './themes/themeRegistry'
import { createEntitlementService } from './entitlement/entitlementService'
import { createAiQuotaProvider } from './entitlement/aiQuotaProvider'
import { getActiveProducts } from './entitlement/productCatalog'
import { createOrderService } from './entitlement/orderService'
import { paymentAdapters } from './entitlement/paymentAdapters'
import type { Product } from './entitlement/productTypes'
import type { Order } from './entitlement/orderTypes'
import { themeFamilyLabels, applyThemeToDOM } from './hooks/useTheme'
import { WallpaperPicker } from './wallpaper/WallpaperPicker'
import { deriveWallpaperFromTheme } from './wallpaper/wallpaperConfig'
import { wallpaperService } from './wallpaper/wallpaperService'
import { AdminConsolePage } from './components/membership/AdminConsolePage'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './auth/LoginPage'
import { RegisterPage } from './auth/RegisterPage'
import { SpaceList, SpaceDetail, CreateSpaceForm, RelationshipSpaceProvider } from './relationship'
import { createBrowserMemoryStore } from './memory/memoryStore'
import { createMemoryObserver } from './memory/memoryObserver'
import { withWorkspaceMemoryObserver } from './memory/workspaceMemoryMiddleware'
import type { MemoryEvent, MemoryScope, MemoryProfile } from './memory/memoryTypes'
import { MemoryProfileEditorUI } from './memory/MemoryProfileEditorUI'
import { MemoryContextPreview } from './memory/MemoryContextPreview'
import { EvolutionRitualUI } from './agent/evolution/EvolutionRitualUI'
import { useEvolutionRitual } from './agent/evolution/useEvolutionRitual'
import { AgentChatUI, AgentChatToggle } from './agent/AgentChatUI'
import { SilentSuggestionUI, useSilentSuggestions } from './agent/SilentSuggestionUI'
import { useToast } from './components/toast/Toast'
import { useApiKeyStatus } from './hooks/useApiKeyStatus'
import { CanvasCard } from './canvas/CanvasCard'
import { SidebarPanel } from './sidebar-panel'
import { PlatformContext, AdaptiveModal, getPlatformInfo } from './platforms'
import { AIRecommendationUI } from './module-store/AIRecommendationUI'
import { LayoutShareUI } from './module-store/LayoutShareUI'
import { ModuleStoreUI } from './module-store/ModuleStoreUI'
import { defaultModules } from './module-store/ModuleRegistry'
import {
  addModuleToLayout,
  createInitialModuleStoreState,
  exportModuleLayout,
  importModuleLayout,
  recommendModulesForIdentity,
  removeModuleFromLayout,
  upsertCustomModule
} from './module-store/moduleStoreLogic'
import type { CanvasItem, ModuleStoreState } from './module-store/types'
import { CycleTracker } from './cycle'
import { DataBackupUI } from './data/DataBackupUI'
import { ApiKeySettingsUI } from './settings/ApiKeySettingsUI'
import { SupabaseConfigUI } from './settings/SupabaseConfigUI'
import { SyncUI } from './data/SyncUI'
import { AvatarManager } from './avatar'
import { HabitTracker } from './habits/HabitTrackerUI'
import { JournalUI } from './journal/JournalUI'
import { ReadingUI } from './reading/ReadingUI'
import { ErrorBookUI } from './error-book/ErrorBookUI'
import { MemoryCardsUI } from './memory-cards/MemoryCardsUI'
import { ExamTrackerUI } from './exam-tracker/ExamTrackerUI'
import { StudyPlannerUI } from './study-planner/StudyPlannerUI'
import { FocusTimerUI } from './focus-timer/FocusTimerUI'
import { StudyCompanionUI } from './study-companion/StudyCompanionUI'
import { MoodJournalUI } from './mood-journal/MoodJournalUI'
import { OnboardingUI } from './onboarding/OnboardingUI'
import { BacklinkPanel } from './backlink/BacklinkPanel'
import { FocusModeUI } from './focus-mode'
import { KnowledgeGraphUI } from './knowledge-graph/KnowledgeGraphUI'
import { ScheduleUI } from './schedule/ScheduleUI'
import { createScheduleService } from './schedule/scheduleService'
import { TemplateUI } from './templates/TemplateUI'
import { ReviewSchedulerUI } from './review/ReviewSchedulerUI'
import { ReportUI } from './report/ReportUI'
import { GlobalSearchUI } from './globalsearch/GlobalSearchUI'
import { QuickNotesUI } from './quicknotes/QuickNotesUI'
import { TimeBlockUI } from './timeblock/TimeBlockUI'
import { FocusStatsUI } from './focusstats/FocusStatsUI'
import { FocusHistoryUI } from './focushistory/FocusHistoryUI'
import { MigrationUI } from './data/migration/MigrationUI'
import { createNotificationService } from './notifications/notificationService'
import { NotificationBanner } from './notifications/NotificationBanner'
import { createBrowserStudyStore } from './data/localStudyStore'
import { createHabitBrowserStore } from './habits/habitService'
import { createJournalBrowserStore } from './journal/journalService'
import { createReadingService } from './reading/readingService'
import { createGoalBrowserStore } from './data/localGoalStore'
import { createFinanceBrowserStore } from './data/localFinanceStore'
import { createWellnessBrowserStore } from './data/localWellnessStore'
import { createProjectBrowserStore } from './data/localProjectStore'
import styles from './components/membership/MembershipPage.module.css'

const personaWorkspaceMap: Record<PersonaId, WorkspaceType> = {
  'exam-student': 'study',
  'office-worker': 'work',
  creator: 'growth',
  'self-growth': 'growth',
  'grad-exam': 'study',
  'civil-service': 'study',
  'cert-exam': 'study',
  'english-cet': 'study'
}

const store = typeof window === 'undefined' ? undefined : createBrowserWorkspaceStore()
const memoryStore = typeof window === 'undefined' ? undefined : createBrowserMemoryStore()
const moduleLayoutStorageKey = 'xinghuanhai-module-layout-state'
const onboardingStorageKey = 'xinghuanhai-onboarding-completed'
const onboardingDataKey = 'xinghuanhai-onboarding-data'

const entitlementService = createEntitlementService()
const aiQuotaProvider = createAiQuotaProvider(entitlementService)
const orderService = createOrderService()
const notificationService = createNotificationService()
const cameoEngine = createCameoTriggerEngine()
const personaScheduleStorage = createPersonaScheduleStorage()
const personaScheduler = createPersonaScheduler(personaScheduleStorage, entitlementService, cameoEngine)
const safetyIncidentLog = createSafetyIncidentLog()
const personaSafetyGate = createPersonaSafetyGate(safetyIncidentLog)
const relationshipHealthMonitor = createRelationshipHealthMonitor(safetyIncidentLog, personaScheduleStorage, personaScheduler)
const avatarGenQuotaProvider = createAvatarAiGenQuotaProvider(entitlementService)
const personaAvatarGen = createPersonaAvatarGen({
  quotaProvider: avatarGenQuotaProvider,
  aiProvider: avatarAIProvider,
  getPersonaById: (id) => PRESET_PERSONAS.find((p) => p.id === id)
})
const communityPersonaService = createCommunityPersonaService({
  safetyGate: personaSafetyGate,
  getCustomPersonaById: (id) => loadCustomPersonas().find((p) => p.id === id),
  getCustomPersonasByUser: (userId) => loadCustomPersonas().filter((p) => p.creatorUserId === userId),
  addCustomPersona: (input) => addCustomPersona(input)
})
const personaProvider = createPersonaProvider(entitlementService)
const customPersonaService = createCustomPersonaService({
  safetyGate: personaSafetyGate,
  incidentLog: safetyIncidentLog
})

if (import.meta.env.DEV) {
  const devUserId = 'dev-user-001'
  const devAdminId = 'dev-admin-001'
  const devEntitlements: Array<{ code: string; source: string; expireAt: null; remaining?: number }> = [
    { code: 'agent_plus', source: 'early_bird_gift', expireAt: null },
    { code: 'agent', source: 'early_bird_gift', expireAt: null },
    { code: 'study', source: 'early_bird_gift', expireAt: null },
    { code: 'avatar_rpm', source: 'early_bird_gift', expireAt: null },
    { code: 'avatar_ai_gen', source: 'early_bird_gift', expireAt: null, remaining: 999 },
    { code: 'memory_sync', source: 'early_bird_gift', expireAt: null },
    { code: 'evolution_ritual', source: 'early_bird_gift', expireAt: null },
    { code: 'evolution_realtime', source: 'early_bird_gift', expireAt: null },
    { code: 'avatar_evolution', source: 'early_bird_gift', expireAt: null },
    { code: 'agent_tool_call', source: 'early_bird_gift', expireAt: null },
    { code: 'ai_quota', source: 'early_bird_gift', expireAt: null, remaining: 9999 },
    { code: 'persona_cameo', source: 'early_bird_gift', expireAt: null },
    { code: 'persona_custom_slot', source: 'early_bird_gift', expireAt: null },
    { code: 'persona_avatar_ai_gen', source: 'early_bird_gift', expireAt: null, remaining: 999 },
    { code: 'reflection_realtime', source: 'early_bird_gift', expireAt: null },
    { code: 'reflection_weekly', source: 'early_bird_gift', expireAt: null },
    { code: 'reflection_teaser', source: 'early_bird_gift', expireAt: null },
    { code: 'space', source: 'early_bird_gift', expireAt: null },
    { code: 'org', source: 'early_bird_gift', expireAt: null }
  ]
  for (const userId of [devUserId, devAdminId]) {
    for (const e of devEntitlements) {
      entitlementService.grant(userId, e as Parameters<typeof entitlementService.grant>[1])
    }
  }
}

const themeFamilies = themeFamilyMeta.map((family) => ({
  ...family,
  themes: themeRegistry.filter((theme) => family.includes.includes(theme.aesthetic))
}))

const ThemeOptionButton = ({
  activeThemeId,
  onSelect,
  theme
}: {
  activeThemeId: ThemeId
  onSelect: (themeId: ThemeId) => void
  theme: StudyTheme
}) => {
  const isActive = theme.id === activeThemeId
  return (
    <button
      aria-label={theme.name}
      aria-pressed={isActive}
      className={isActive ? 'theme-option selected' : 'theme-option'}
      data-material={theme.material}
      key={theme.id}
      onClick={() => onSelect(theme.id)}
      type="button"
    >
      <span
        className="theme-option-preview"
        style={{
          background: theme.tokens.colors.background,
          borderColor: theme.tokens.colors.border
        }}
        aria-hidden="true"
      >
        <span
          className="theme-option-preview-card"
          style={{
            background: theme.tokens.gradients.card,
            color: theme.tokens.colors.primary,
            boxShadow: theme.tokens.effects.shadow
          }}
        >
          <span className="theme-option-preview-bar" style={{ background: theme.tokens.gradients.hero }} />
          <span className="theme-option-preview-line" style={{ background: theme.tokens.colors.border }} />
          <span
            className="theme-option-preview-line short"
            style={{ background: theme.tokens.colors.border }}
          />
        </span>
      </span>
      <span className="theme-option-meta">
        <span className="theme-option-headline">
          <span className="theme-option-name">{theme.name}</span>
          <span className="theme-option-material-tag" data-material={theme.material}>
            {materialLabels[theme.material]}
          </span>
        </span>
        <span className="theme-option-tone">{theme.design.tone}</span>
        <span className="theme-swatch-row" aria-hidden="true">
          <span className="theme-swatch" style={{ background: theme.tokens.colors.primary }} />
          <span className="theme-swatch" style={{ background: theme.tokens.colors.secondary }} />
          <span className="theme-swatch" style={{ background: theme.tokens.colors.accent }} />
        </span>
      </span>
      {isActive && <span className="theme-option-active-mark" aria-hidden="true">●</span>}
    </button>
  )
}

const loadInitialState = (): WorkspaceState => {
  if (!store) return createInitialWorkspaceState()
  return store.load()
}

const defaultWorkbenchModuleIds = [
  'persona-plan',
  'today-actions',
  'focus-session',
  'focus-overview',
  'growth-rpg',
  'key-metrics',
  'focus-history',
  'memory-insights',
  'ai-coach',
  'platform-matrix',
  'theme-center',
  'statistics',
  'cycle-today',
  'memory-profile',
  'habit-tracker',
  'journal',
  'reading-list',
  'error-book',
  'memory-cards'
]

const createDefaultWorkbenchState = () =>
  defaultWorkbenchModuleIds.reduce(
    (state, moduleId) => addModuleToLayout(state, moduleId),
    createInitialModuleStoreState(defaultModules)
  )

const loadInitialModuleStoreState = (): ModuleStoreState => {
  if (typeof window !== 'undefined') {
    const onboardingDataStr = window.localStorage.getItem(onboardingDataKey)
    if (onboardingDataStr) {
      try {
        const onboardingData = JSON.parse(onboardingDataStr) as { selectedModules?: string[] }
        if (onboardingData.selectedModules && onboardingData.selectedModules.length > 0) {
          return onboardingData.selectedModules.reduce(
            (state, moduleId) => addModuleToLayout(state, moduleId),
            createInitialModuleStoreState(defaultModules)
          )
        }
      } catch {
        // ignore parse error
      }
    }
  }

  const fallback = createDefaultWorkbenchState()

  if (typeof window === 'undefined') return fallback
  const saved = window.localStorage.getItem(moduleLayoutStorageKey)
  if (!saved) return fallback

  try {
    return importModuleLayout(saved, defaultModules)
  } catch {
    return fallback
  }
}

function CouponRedeemInput({ onRedeem }: { onRedeem: (code: string) => void }) {
  const [code, setCode] = useState('')

  const handleRedeem = () => {
    const trimmed = code.trim()
    if (trimmed) {
      onRedeem(trimmed)
      setCode('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRedeem()
    }
  }

  return (
    <div className="membership-coupon-input-group">
      <input
        type="text"
        className="membership-coupon-input"
        placeholder="输入优惠券码"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button className="membership-coupon-apply" onClick={handleRedeem}>使用</button>
    </div>
  )
}

function ClockDisplay() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  const weekdayStr = weekdays[now.getDay()]

  return (
    <>
      <span className="hero-date">{dateStr}</span>
      <span className="hero-weekday">{weekdayStr}</span>
      <span className="hero-time">{timeStr}</span>
    </>
  )
}

export default function App() {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(() => loadInitialState())
  const { addToast } = useToast()
  const { status: apiKeyStatus } = useApiKeyStatus()

  useEffect(() => {
    if (apiKeyStatus === 'ready' && workspaceState.integrations.ai.status !== 'ready') {
      setWorkspaceState(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          ai: {
            ...prev.integrations.ai,
            status: 'ready'
          }
        }
      }))
    }
  }, [apiKeyStatus, workspaceState.integrations.ai.status])
  
  const activeTheme = useMemo(() => getThemeById(workspaceState.preferences.themeId), [workspaceState.preferences.themeId])
  const activePersona = getPersonaById(workspaceState.preferences.activePersona)
  const activeTemplate = getPersonaTemplateById(activePersona.id)
  const activeWorkspaceType = personaWorkspaceMap[activePersona.id]
  const visibleTasks = workspaceState.tasks.filter((task) => task.workspaceType === activeWorkspaceType)
  const todoTasks = visibleTasks.filter((task) => task.status === 'todo')
  const completedTasks = visibleTasks.filter((task) => task.status === 'done')
  const nextFocusTask = todoTasks[0]
  const activeProvider = getAiProviderById(workspaceState.integrations.ai.providerId)
  const platformInfo = useMemo(() => getPlatformInfo(), [])
  const promptDraft = createAiPromptDraft(activeProvider.id, {
    kind: activePersona.aiActions[0],
    input: activePersona.primaryFlow,
    context: `${activePersona.name}：${activePersona.painPoint}`
  })
  const weeklyProgress = visibleTasks.length === 0 ? 0 : Math.round((completedTasks.length / visibleTasks.length) * 100)
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false)
  const [isWallpaperPickerOpen, setIsWallpaperPickerOpen] = useState(false)
  const [isIdentitySelectorOpen, setIsIdentitySelectorOpen] = useState(false)
  const [moduleStoreState, setModuleStoreState] = useState<ModuleStoreState>(() => loadInitialModuleStoreState())
  const [isAIRecommendationOpen, setIsAIRecommendationOpen] = useState(false)
  const [isLayoutShareOpen, setIsLayoutShareOpen] = useState(false)
  const [layoutImportError, setLayoutImportError] = useState<string | null>(null)
  const [openWorkbenchDetail, setOpenWorkbenchDetail] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [themeSearchQuery, setThemeSearchQuery] = useState('')
  const [activeThemeFamily, setActiveThemeFamily] = useState<ThemeFamilyId | 'all'>('all')
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null)
  const [focusEndsAt, setFocusEndsAt] = useState<number | null>(null)
  const [focusPausedRemainingMs, setFocusPausedRemainingMs] = useState<number | null>(null)
  const [focusNow, setFocusNow] = useState<number>(() => Date.now())
  const [focusDurationDraft, setFocusDurationDraft] = useState<Record<string, number>>({})
  const focusIntervalRef = useRef<number | null>(null)
  const savedWorkspaceStateRef = useRef<WorkspaceState | null>(null)
  const isFocusRunning = focusEndsAt !== null
  const candidateFocusTask = focusTaskId
    ? workspaceState.tasks.find((task) => task.id === focusTaskId) ?? null
    : null
  const activeFocusTask =
    candidateFocusTask && candidateFocusTask.status === 'todo' ? candidateFocusTask : null
  const normalizedThemeSearch = themeSearchQuery.trim().toLowerCase()
  const {
    login,
    register,
    switchRole,
    isLoggingIn,
    loginError,
    userId,
    role
  } = useAuth()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isMembershipOpen, setIsMembershipOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
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
  const [dataSource, setDataSource] = useState<'local' | 'supabase'>('local')
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false)
  const [isTimeBlockOpen, setIsTimeBlockOpen] = useState(false)
  const [isFocusStatsOpen, setIsFocusStatsOpen] = useState(false)
  const [isFocusHistoryOpen, setIsFocusHistoryOpen] = useState(false)
  const [isMigrationOpen, setIsMigrationOpen] = useState(false)
  const [currentPersonaId, setCurrentPersonaId] = useState<string | undefined>(undefined)
  const [memoryProfile, setMemoryProfile] = useState<MemoryProfile>(() => workspaceState.memoryProfile)
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [isCreatingSpace, setIsCreatingSpace] = useState(false)
  const [relationshipSpaceWallpaper, setRelationshipSpaceWallpaper] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [userTrials, setUserTrials] = useState<{code: string; expireAt: string; used: boolean}[]>([])
  const [userCoupons, setUserCoupons] = useState<{code: string; type: string; discount: number; used: boolean}[]>([])
  const [inviteRewards] = useState<{inviteeName: string; rewardDays: number; status: string}[]>([])
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(onboardingStorageKey) === 'true'
  })
  
  const getWorkspaceState = useCallback(() => workspaceState, [workspaceState])

  const studyStore = useMemo(() => createBrowserStudyStore(), [])
  const getStudyState = useCallback(() => studyStore.load(), [studyStore])

  const habitStore = useMemo(() => createHabitBrowserStore(), [])
  const getHabitState = useCallback(() => habitStore.load(), [habitStore])

  const journalStore = useMemo(() => createJournalBrowserStore(), [])
  const getJournalState = useCallback(() => journalStore.load(), [journalStore])

  const readingService = useMemo(() => createReadingService(), [])
  const getReadingState = useCallback(() => readingService.getState(), [readingService])

  const goalStore = useMemo(() => createGoalBrowserStore(), [])
  const getGoalsState = useCallback(() => goalStore.load(), [goalStore])

  const financeStore = useMemo(() => createFinanceBrowserStore(), [])
  const getFinanceState = useCallback(() => financeStore.load(), [financeStore])

  const wellnessStore = useMemo(() => createWellnessBrowserStore(), [])
  const getWellnessState = useCallback(() => wellnessStore.load(), [wellnessStore])

  const projectStore = useMemo(() => createProjectBrowserStore(), [])
  const getProjectState = useCallback(() => projectStore.load(), [projectStore])

  const handleOnboardingComplete = useCallback((data: OnboardingData) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(onboardingStorageKey, 'true')
      window.localStorage.setItem(onboardingDataKey, JSON.stringify(data))
    }
    setOnboardingCompleted(true)
  }, [])

  const handleOnboardingSkip = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(onboardingStorageKey, 'true')
    }
    setOnboardingCompleted(true)
  }, [])

  const filteredThemes = themeRegistry.filter((theme) => {
    const searchableText = [
      theme.name,
      themeFamilyLabels[theme.aesthetic],
      theme.visualComfort,
      theme.accessibilityNotes,
      theme.design.tone,
      theme.design.scene,
      theme.design.principle,
      ...theme.recommendedFor
    ].join(' ').toLowerCase()

    const matchesSearch = normalizedThemeSearch.length === 0 || searchableText.includes(normalizedThemeSearch)
    const matchesFamily = activeThemeFamily === 'all' || themeFamilyMeta.find((f) => f.id === activeThemeFamily)?.includes.includes(theme.aesthetic)

    return matchesSearch && matchesFamily
  })

  useEffect(() => {
    localStorage.setItem('user_id', userId)
  }, [userId])

  const quotaStatus = useMemo(() => aiQuotaProvider.getQuotaStatus(userId), [userId])
  const totalQuota = useMemo(() => 
    (quotaStatus.free?.remaining || 0) + 
    (quotaStatus.study?.remaining || 0) + 
    (quotaStatus.agent?.remaining || 0) + 
    (quotaStatus.pack?.remaining || 0)
  , [quotaStatus])
  
  const currentTier = useMemo(() => {
    if (entitlementService.has(userId, 'agent_plus')) return { level: 'agent_plus', label: 'Agent PLUS', color: '#8b5cf6' }
    if (entitlementService.has(userId, 'agent')) return { level: 'agent', label: 'Agent 会员', color: '#6366f1' }
    if (entitlementService.has(userId, 'study')) return { level: 'study', label: '学习会员', color: '#10b981' }
    return { level: 'free', label: '免费用户', color: 'var(--muted, #94a3b8)' }
  }, [userId])
  const memoryScope = useMemo<MemoryScope>(() => ({
    userId,
    projectId: 'growth-workbench'
  }), [userId])
  const [memoryEvents, setMemoryEvents] = useState<MemoryEvent[]>(() =>
    memoryStore ? memoryStore.listEvents(memoryScope) : []
  )
  const [memoryObserver] = useState(
    () => memoryStore ? createMemoryObserver({ scope: memoryScope, store: memoryStore }) : null
  )
  const recommendedModules = useMemo(() => recommendModulesForIdentity({
    identityDescription: `${activePersona.name} ${activePersona.targetUser} ${activePersona.painPoint} ${activePersona.primaryFlow}`,
    personaModuleTitles: activePersona.modules.map((module) => module.title)
  }), [activePersona])
  const exportedModuleLayout = useMemo(() => exportModuleLayout(moduleStoreState), [moduleStoreState])
  const refreshMemoryEvents = useCallback(() => {
    if (!memoryStore) return
    setMemoryEvents(memoryStore.listEvents(memoryScope))
  }, [memoryScope])

  const checkCameoTrigger = useCallback(() => {
    const schedule = personaScheduleStorage.get(userId)
    if (!schedule || schedule.cameoFrequency === 'off') return

    const baseContext = {
      now: new Date(),
      schedule: {
        cameoFrequency: schedule.cameoFrequency,
        lastFocusMinutes: schedule.lastFocusMinutes,
        completedTaskCount: schedule.completedTaskCount,
        consecutiveFocusDays: schedule.consecutiveFocusDays,
        userBirthday: schedule.userBirthday,
        userAnniversary: schedule.userAnniversary,
      },
    }
    const context = buildTriggerContextFromMemoryObserver(
      memoryObserver, baseContext, memoryStore, memoryScope
    )
    const result = cameoEngine.evaluate(context, PRESET_PERSONAS)
    if (result.triggered && result.persona) {
      personaScheduler.activateCameo(userId, result.persona.id, 1, result.triggerDetail)
    }
  }, [userId, memoryObserver, memoryScope])

  const handleConversationComplete = useCallback((_userMessage: string, _agentResponse: string) => {
    const metrics = {
      userId,
      dailyMinutes: 0,
      weeklyMinutes: 0,
      monthlyMinutes: 0,
      consecutiveDays: 0,
      averageSessionMinutes: 0,
      lateNightSessions: 0,
      emotionalKeywords: [],
      dependencyKeywords: [],
      crisisKeywords: [],
    }
    relationshipHealthMonitor.assess(userId, metrics)
  }, [userId])

  const { 
    pendingEntry, 
    handleAccept: handleEvolutionAccept,
    handleReject: handleEvolutionReject,
    handleModify: handleEvolutionModify,
    handleClose: handleEvolutionClose
  } = useEvolutionRitual(userId, memoryEvents, memoryProfile, (updatedProfile) => {
    setMemoryProfile(updatedProfile)
    setWorkspaceState((prev) => ({ ...prev, memoryProfile: updatedProfile }))
  })

  const { suggestions: silentSuggestions } = useSilentSuggestions(memoryProfile, memoryEvents)
  
  const handleSwitchRole = () => {
    switchRole()
    addToast({
      type: 'info',
      title: '角色已切换',
      message: `当前角色：${role === 'admin' ? '用户' : '管理员'}`
    })
  }
  
  const handleSubscribe = (product: Product) => {
    setSelectedProduct(product)
    setIsPaymentOpen(true)
  }
  
  const handlePayment = async (channel: 'wechat' | 'alipay' | 'apple') => {
    if (!selectedProduct) return
    
    const order = orderService.createOrder({
      userId,
      productId: selectedProduct.id,
      amount: selectedProduct.price,
      channel
    })
    
    const adapter = paymentAdapters[channel]
    const result = await adapter.createPayment(order.id, order.amount)
    
    if (result.qrCode) {
      window.open(result.qrCode, '_blank')
    } else if (result.paymentUrl) {
      window.open(result.paymentUrl, '_blank')
    }
    
    setIsPaymentOpen(false)
    setIsMembershipOpen(false)
    addToast({
      type: 'success',
      title: '订单已创建',
      message: `订单号：${order.id}，请在打开的页面中完成支付，支付完成后刷新页面查看会员状态。`
    })
  }
  
  const userOrders = useMemo(() => {
    return orderService.getOrdersByUser(userId).slice(0, 5)
  }, [userId])
  
  const hasActiveTrial = (code: string) => {
    return userTrials.some(t => t.code === code && !t.used)
  }
  
  const handleStartTrial = (trialCode: string, durationDays: number) => {
    const expireTime = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    const newTrial = {
      code: trialCode,
      expireAt: expireTime,
      used: false
    }
    setUserTrials(prev => [...prev, newTrial])
    entitlementService.grant(userId, {
      code: trialCode as 'study' | 'agent' | 'agent_plus',
      source: 'trial',
      expireAt: expireTime
    })
    addToast({
      type: 'success',
      title: '试用已开启',
      message: `您将享受 ${durationDays} 天的会员权益。`
    })
  }
  
  const handleRedeemCoupon = (code: string) => {
    if (!code.trim()) {
      addToast({ type: 'warning', title: '请输入优惠券码' })
      return
    }
    const validCoupons: Record<string, {type: string; discount: number}> = {
      'WELCOME10': { type: 'percent', discount: 10 },
      'NEWUSER50': { type: 'amount', discount: 50 },
      'AGENT2024': { type: 'percent', discount: 20 },
      'VIP888': { type: 'amount', discount: 100 }
    }
    const coupon = validCoupons[code.toUpperCase()]
    if (coupon) {
      setUserCoupons(prev => [...prev, { code: code.toUpperCase(), ...coupon, used: false }])
      addToast({ type: 'success', title: '兑换成功', message: `优惠券 ${code.toUpperCase()} 已添加到您的账户。` })
    } else {
      addToast({ type: 'error', title: '优惠券码无效' })
    }
  }
  
  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId)
    return product?.name || productId
  }
  
  const getChannelLabel = (channel: string) => {
    const map: Record<string, string> = { wechat: '微信', alipay: '支付宝', apple: 'Apple Pay' }
    return map[channel] || channel
  }
  
  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = { pending: '待支付', paid: '已支付', refunded: '已退款', failed: '失败' }
    return map[status] || status
  }
  
  const getStatusColor = (status: string) => {
    const map: Record<string, string> = { pending: '#f59e0b', paid: '#10b981', refunded: 'var(--muted, #6b7280)', failed: '#ef4444' }
    return map[status] || 'var(--muted, #6b7280)'
  }
  
  const handleRefundOrder = (orderId: string) => {
    try {
      orderService.markAsRefunded(orderId)
      addToast({ type: 'success', title: '退款申请已提交', message: '请耐心等待处理。' })
    } catch (e) {
      addToast({ type: 'error', title: '退款失败', message: e instanceof Error ? e.message : '未知错误' })
    }
  }
  
  const products = useMemo(() => getActiveProducts(), [])
  
  const getProductsByTier = (tier: 'study' | 'agent' | 'agent_plus') => {
    const tierProducts = products.filter(p => {
      if (tier === 'study') return p.id.startsWith('study')
      if (tier === 'agent') return p.id.startsWith('agent') && !p.id.includes('plus')
      if (tier === 'agent_plus') return p.id.includes('plus')
      return false
    })
    
    const periods = ['month', 'quarter', 'year'] as const
    return periods.map(period => {
      const filtered = tierProducts.filter(p => p.period === period)
      return filtered.find(p => p.originalPrice) ?? filtered[0]
    }).filter(Boolean) as Product[]
  }
  
  const studyProducts = getProductsByTier('study')
  const agentProducts = getProductsByTier('agent')
  const agentPlusProducts = getProductsByTier('agent_plus')
  
  const formatPrice = (cents: number) => `¥${(cents / 100).toFixed(0)}`
  
  const getPeriodLabel = (period: string) => {
    const map: Record<string, string> = { month: '月', quarter: '季', year: '年' }
    return map[period] || period
  }
  
  const getTierInfo = (tier: string) => {
    const map: Record<string, { name: string; badge: string; color: string; features: string[] }> = {
      study: { name: '学习会员', badge: '基础', color: '#10b981', features: ['高级主题全解锁', '云同步', '高级统计', '50次AI额度/月'] },
      agent: { name: 'Agent 会员', badge: '热门', color: '#6366f1', features: ['有记忆的AI搭子', '自我进化机制', '角色系统', 'RPM捏脸', '200次AI额度/月'] },
      agent_plus: { name: 'Agent PLUS', badge: '旗舰', color: '#8b5cf6', features: ['AI 3D角色生成', '实时反思', '工具调用能力', '角色进化全解锁', '无限AI额度'] }
    }
    return map[tier] || { name: tier, badge: '', color: '#6366f1', features: [] }
  }
  
  const getGrantLabel = (code: string) => {
    const map: Record<string, string> = {
      study: '学习会员',
      agent: 'Agent 会员',
      agent_plus: 'Agent PLUS',
      avatar_rpm: 'RPM捏脸',
      memory_sync: '记忆同步',
      evolution_ritual: '进化仪式',
      avatar_evolution: '角色进化',
      evolution_realtime: '实时反思',
      agent_tool_call: '工具调用'
    }
    return map[code] || code
  }

  useEffect(() => {
    applyThemeToDOM(workspaceState.preferences.themeId, workspaceState.preferences.wallpaperConfig)
  }, [workspaceState.preferences.themeId, workspaceState.preferences.wallpaperConfig])

  useEffect(() => {
    if (!store) return
    if (savedWorkspaceStateRef.current === workspaceState) return
    const previousState = savedWorkspaceStateRef.current
    savedWorkspaceStateRef.current = workspaceState
    if (previousState && memoryObserver) {
      const wrappedStore = withWorkspaceMemoryObserver(store, memoryObserver)
      wrappedStore.save(workspaceState)
    } else {
      store.save(workspaceState)
    }
    refreshMemoryEvents()
  }, [workspaceState, memoryObserver, refreshMemoryEvents])

  useEffect(() => {
    // Layout persistence concern: module layout is saved independently from workspace state
    window.localStorage.setItem(moduleLayoutStorageKey, exportModuleLayout(moduleStoreState))
  }, [moduleStoreState])

  useEffect(() => {
    if (!isThemePickerOpen && !isWallpaperPickerOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsThemePickerOpen(false)
        setIsWallpaperPickerOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isThemePickerOpen, isWallpaperPickerOpen])

  useEffect(() => {
    if (!isFocusRunning) {
      if (focusIntervalRef.current !== null) {
        window.clearInterval(focusIntervalRef.current)
        focusIntervalRef.current = null
      }
      return
    }

    focusIntervalRef.current = window.setInterval(() => {
      setFocusNow(Date.now())
    }, 250)

    return () => {
      if (focusIntervalRef.current !== null) {
        window.clearInterval(focusIntervalRef.current)
        focusIntervalRef.current = null
      }
    }
  }, [isFocusRunning])

  const remainingMsFromEnds = focusEndsAt !== null ? Math.max(0, focusEndsAt - focusNow) : 0
  const focusRemainingSeconds =
    focusEndsAt !== null
      ? Math.round(remainingMsFromEnds / 1000)
      : focusPausedRemainingMs !== null
        ? Math.round(focusPausedRemainingMs / 1000)
        : 0

  useEffect(() => {
    if (focusEndsAt === null || remainingMsFromEnds > 0) return

    const completedTaskId = focusTaskId
    const finish = () => {
      setFocusEndsAt(null)
      setFocusPausedRemainingMs(null)
      if (!completedTaskId) return

      setWorkspaceState((state) => {
        const target = state.tasks.find((task) => task.id === completedTaskId)
        if (!target || target.status === 'done') return state

        const session: FocusSessionRecord = {
          id: `focus-${Date.now()}`,
          taskId: target.id,
          taskTitle: target.title,
          workspaceType: target.workspaceType,
          minutes: target.minutes,
          rewardPoints: target.rewardPoints,
          completedAt: new Date().toISOString()
        }

        memoryObserver?.onFocusSessionCompleted(session)
        memoryObserver?.onTaskCompleted(target)
        refreshMemoryEvents()
        checkCameoTrigger()

        return {
          ...state,
          tasks: state.tasks.map((task) =>
            task.id === completedTaskId ? { ...task, status: 'done', dueLabel: '已完成' } : task
          ),
          growth: {
            ...state.growth,
            experience: state.growth.experience + target.rewardPoints,
            achievements: state.growth.achievements + 1
          },
          focusSessions: [session, ...state.focusSessions].slice(0, 20)
        }
      })
      setFocusTaskId(null)
      setFocusDurationDraft((current) => {
        if (!(completedTaskId in current)) return current
        const next = { ...current }
        delete next[completedTaskId]
        return next
      })
    }

    const handle = window.setTimeout(finish, 0)
    return () => window.clearTimeout(handle)
  }, [focusEndsAt, remainingMsFromEnds, focusTaskId, memoryObserver, refreshMemoryEvents, checkCameoTrigger])

  useEffect(() => {
    const checkReminders = () => {
      const scheduleService = createScheduleService()
      notificationService.checkScheduleReminders(() =>
        scheduleService.getDueReminders().map(e => ({ id: e.id, title: e.title, time: e.time }))
      )
    }
    checkReminders()
    const interval = setInterval(checkReminders, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (openWorkbenchDetail === 'theme-center') {
      setIsThemePickerOpen(true)
      setOpenWorkbenchDetail(null)
    }
  }, [openWorkbenchDetail])

  const closeAllSidebarPanels = (except?: string) => {
    flushSync(() => {
      setIsThemePickerOpen(false)
      setIsWallpaperPickerOpen(false)
      setIsIdentitySelectorOpen(false)
      setIsAIRecommendationOpen(false)
      setIsLayoutShareOpen(false)
      setIsMembershipOpen(false)
      setIsPaymentOpen(false)
      setIsAdminConsoleOpen(false)
      setIsRelationshipSpaceOpen(false)
      if (except !== 'agentChat') setIsAgentChatOpen(false)
      setIsMemoryProfileOpen(false)
      setIsCycleTrackerOpen(false)
      setIsAvatarManagerOpen(false)
      setIsPersonaSelectorOpen(false)
      setIsDataBackupOpen(false)
      setIsApiKeySettingsOpen(false)
      setIsKnowledgeGraphOpen(false)
      setIsScheduleOpen(false)
      setIsBacklinkOpen(false)
      setIsTemplateOpen(false)
      setIsReviewSchedulerOpen(false)
      setIsSupabaseConfigOpen(false)
      setIsReportOpen(false)
      setIsGlobalSearchOpen(false)
      setIsQuickNotesOpen(false)
      setIsTimeBlockOpen(false)
      setIsFocusStatsOpen(false)
      setIsFocusHistoryOpen(false)
      setIsMigrationOpen(false)
      setModuleStoreState((current) => ({ ...current, isStoreOpen: false }))
    })
  }

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const { page } = (event as CustomEvent<{ page: string }>).detail || {}
      closeAllSidebarPanels()
      if (page === 'membership') {
        setIsMembershipOpen(true)
      } else if (page === 'settings') {
        setIsApiKeySettingsOpen(true)
      }
    }

    window.addEventListener('navigate', handleNavigate)
    return () => window.removeEventListener('navigate', handleNavigate)
  }, [])

  const openThemePicker = () => {
    setThemeSearchQuery('')
    setIsThemePickerOpen(true)
  }

  const closeThemePicker = () => {
    setIsThemePickerOpen(false)
  }

  const switchTheme = (themeId: ThemeId) => {
    const newTheme = getThemeById(themeId)
    const derivedWallpaper = deriveWallpaperFromTheme(newTheme)
    setWorkspaceState((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        themeId,
        themeMode: 'manual',
        wallpaperConfig: current.preferences.wallpaperConfig
          ? { ...current.preferences.wallpaperConfig, themeIdAtCapture: themeId }
          : derivedWallpaper
      }
    }))
    setIsThemePickerOpen(false)
  }

  const addCanvasModule = (moduleId: string) => {
    setModuleStoreState((current) => addModuleToLayout(current, moduleId))
  }

  const removeCanvasModule = (moduleId: string, deleteCustomModule = false) => {
    setModuleStoreState((current) => removeModuleFromLayout(current, moduleId, { deleteCustomModule }))
  }

  const updateCanvasItems = (items: CanvasItem[]) => {
    setModuleStoreState((current) => ({ ...current, activeModules: items }))
  }

  const createCustomCanvasModule = (module: typeof moduleStoreState.availableModules[number]) => {
    setModuleStoreState((current) => upsertCustomModule(current, module))
  }

  const applyRecommendedModules = (moduleIds: string[]) => {
    setModuleStoreState((current) => moduleIds.reduce((state, moduleId) => addModuleToLayout(state, moduleId), current))
    setIsAIRecommendationOpen(false)
  }

  const importLayout = (value: string) => {
    try {
      setModuleStoreState(importModuleLayout(value, defaultModules))
      setLayoutImportError(null)
      setIsLayoutShareOpen(false)
    } catch (error) {
      setLayoutImportError(error instanceof Error ? error.message : '布局导入失败')
    }
  }

  const moveWorkbenchItem = (moduleId: string, position: { x: number; y: number }) => {
    setModuleStoreState((current) => {
      const target = current.activeModules.find((item) => item.moduleId === moduleId)
      if (!target) return current
      const next = importModuleLayout(exportModuleLayout(current), current.availableModules)
      return {
        ...next,
        activeModules: next.activeModules.map((item) =>
          item.moduleId === moduleId ? { ...item, position } : item
        )
      }
    })
  }

  const switchPersona = (personaId: PersonaId) => {
    setWorkspaceState((current) => {
      const nextPersona = getPersonaById(personaId)
      const shouldUseRecommendedTheme = current.preferences.themeMode === 'persona-recommended'

      return {
        ...current,
        preferences: {
          ...current.preferences,
          activePersona: personaId,
          activeWorkspace: personaWorkspaceMap[personaId],
          themeId: shouldUseRecommendedTheme ? nextPersona.recommendedThemeId : current.preferences.themeId
        }
      }
    })
  }

  const restorePersonaTheme = () => {
    setWorkspaceState((current) => {
      const persona = getPersonaById(current.preferences.activePersona)

      return {
        ...current,
        preferences: {
          ...current.preferences,
          themeId: persona.recommendedThemeId,
          themeMode: 'persona-recommended'
        }
      }
    })
  }

  const focusDisplayTask = activeFocusTask ?? nextFocusTask
  const FOCUS_MIN_MINUTES = 5
  const FOCUS_MAX_MINUTES = 180
  const FOCUS_STEP_MINUTES = 5
  const DEFAULT_FOCUS_ID = '__default_focus__'
  const focusTargetMinutes = focusDisplayTask
    ? focusDurationDraft[focusDisplayTask.id] ?? focusDisplayTask.minutes
    : focusDurationDraft[DEFAULT_FOCUS_ID] ?? 25

  const focusSeconds = activeFocusTask
    ? focusRemainingSeconds
    : focusTargetMinutes * 60
  const focusMinuteText = String(Math.floor(focusSeconds / 60)).padStart(2, '0')
  const focusSecondText = String(focusSeconds % 60).padStart(2, '0')
  const focusRewardPoints = focusDisplayTask
    ? Math.round((focusDisplayTask.rewardPoints * focusTargetMinutes) / focusDisplayTask.minutes)
    : 0

  const adjustFocusDuration = (delta: number) => {
    if (isFocusRunning) return
    const targetId = focusDisplayTask ? focusDisplayTask.id : DEFAULT_FOCUS_ID
    const currentMinutes = focusDisplayTask
      ? focusDurationDraft[focusDisplayTask.id] ?? focusDisplayTask.minutes
      : focusDurationDraft[DEFAULT_FOCUS_ID] ?? 25
    const next = Math.min(
      FOCUS_MAX_MINUTES,
      Math.max(FOCUS_MIN_MINUTES, currentMinutes + delta)
    )
    if (next === currentMinutes) return
    setFocusDurationDraft((current) => ({ ...current, [targetId]: next }))
    setFocusPausedRemainingMs(null)
  }

  const handleFocusDurationInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isFocusRunning) return
    const raw = Number(event.target.value)
    if (!Number.isFinite(raw)) return
    const clamped = Math.min(FOCUS_MAX_MINUTES, Math.max(FOCUS_MIN_MINUTES, Math.round(raw)))
    const targetId = focusDisplayTask ? focusDisplayTask.id : DEFAULT_FOCUS_ID
    setFocusDurationDraft((current) => ({ ...current, [targetId]: clamped }))
    setFocusPausedRemainingMs(null)
  }

  const startFocusTimer = () => {
    if (activeFocusTask) {
      const targetMs = focusTargetMinutes * 60 * 1000
      const remainingMs = focusPausedRemainingMs ?? targetMs
      const now = Date.now()
      setFocusEndsAt(now + remainingMs)
      setFocusNow(now)
      setFocusPausedRemainingMs(null)
      return
    }

    if (!nextFocusTask) return
    const now = Date.now()
    const minutes = focusDurationDraft[nextFocusTask.id] ?? nextFocusTask.minutes
    setFocusTaskId(nextFocusTask.id)
    setFocusEndsAt(now + minutes * 60 * 1000)
    setFocusNow(now)
    setFocusPausedRemainingMs(null)
  }

  const pauseFocusTimer = () => {
    if (focusEndsAt === null) return
    const now = Date.now()
    const remainingMs = Math.max(0, focusEndsAt - now)
    setFocusPausedRemainingMs(remainingMs)
    setFocusEndsAt(null)
    setFocusNow(now)
  }

  const resetFocusTimer = () => {
    const taskIdToClear = activeFocusTask?.id ?? focusDisplayTask?.id ?? null
    setFocusEndsAt(null)
    setFocusPausedRemainingMs(null)
    setFocusTaskId(null)
    setFocusNow(Date.now())
    if (taskIdToClear) {
      setFocusDurationDraft((current) => {
        if (!(taskIdToClear in current)) return current
        const next = { ...current }
        delete next[taskIdToClear]
        return next
      })
    }
  }



  

  if (!onboardingCompleted) {
    return (
      <OnboardingUI
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    )
  }

  if (isLoginOpen) {
    return (
      <LoginPage
        onLogin={async (provider, phoneNumber) => {
          const result = await login({ provider, code: '', phoneNumber })
          if (result.success) {
            setIsLoginOpen(false)
          }
        }}
        onRegister={() => {
          setIsLoginOpen(false)
          setIsRegisterOpen(true)
        }}
        isLoggingIn={isLoggingIn}
        error={loginError}
      />
    )
  }

  if (isRegisterOpen) {
    return (
      <RegisterPage
        onRegister={async (provider, phoneNumber, displayName, age) => {
          const result = await register({ provider, code: '', phoneNumber, displayName, age })
          if (result.success) {
            setIsRegisterOpen(false)
          }
        }}
        onBack={() => {
          setIsRegisterOpen(false)
          setIsLoginOpen(true)
        }}
        isLoggingIn={isLoggingIn}
        error={loginError}
      />
    )
  }

  return (
    <PlatformContext.Provider value={platformInfo}>
    <IdentityProvider>
      <SidebarToggle isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <AdaptiveSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(false)}
        onOpenModuleStore={() => {
          closeAllSidebarPanels()
          setModuleStoreState((current) => ({ ...current, isStoreOpen: true }))
        }}
        onOpenLayoutShare={() => {
          closeAllSidebarPanels()
          setIsLayoutShareOpen(true)
        }}
        onOpenThemePicker={() => {
          closeAllSidebarPanels()
          openThemePicker()
        }}
        onOpenMembership={() => {
          closeAllSidebarPanels()
          setIsMembershipOpen(true)
        }}
        onOpenIdentitySelector={() => {
          closeAllSidebarPanels()
          setIsIdentitySelectorOpen(true)
        }}
        onOpenCycleTracker={() => {
          closeAllSidebarPanels()
          setIsCycleTrackerOpen(true)
        }}
        onOpenAvatarManager={() => {
          closeAllSidebarPanels()
          setIsAvatarManagerOpen(true)
        }}
        onOpenMemoryProfile={() => {
          closeAllSidebarPanels()
          setIsMemoryProfileOpen(true)
        }}
        onOpenPersonaSelector={() => {
          closeAllSidebarPanels()
          setIsPersonaSelectorOpen(true)
        }}
        onOpenCustomPersonaEditor={() => {
          closeAllSidebarPanels()
          setIsCustomPersonaEditorOpen(true)
        }}
        onOpenCommunityPersona={() => {
          closeAllSidebarPanels()
          setIsCommunityPersonaOpen(true)
        }}
        onOpenCameoStorefront={() => {
          closeAllSidebarPanels()
          setIsCameoStorefrontOpen(true)
        }}
        onOpenRelationshipSpace={() => {
          closeAllSidebarPanels()
          setIsRelationshipSpaceOpen(true)
        }}
        onOpenAgentChat={() => {
          closeAllSidebarPanels('agentChat')
          flushSync(() => {
            setIsAgentChatOpen(true)
          })
        }}
        onSwitchRole={handleSwitchRole}
        onOpenDataBackup={() => {
          closeAllSidebarPanels()
          setIsDataBackupOpen(true)
        }}
        onOpenApiKeySettings={() => {
          closeAllSidebarPanels()
          setIsApiKeySettingsOpen(true)
        }}
        onOpenTemplate={() => {
          closeAllSidebarPanels()
          setIsTemplateOpen(true)
        }}
        onOpenReviewScheduler={() => {
          closeAllSidebarPanels()
          setIsReviewSchedulerOpen(true)
        }}
        onOpenKnowledgeGraph={() => {
          closeAllSidebarPanels()
          setIsKnowledgeGraphOpen(true)
        }}
        onOpenSchedule={() => {
          closeAllSidebarPanels()
          setIsScheduleOpen(true)
        }}
        onOpenBacklink={() => {
          closeAllSidebarPanels()
          setIsBacklinkOpen(true)
        }}
        onOpenFocusMode={() => {
          closeAllSidebarPanels()
          setIsFocusModeOpen(true)
        }}
        onOpenReport={() => {
          closeAllSidebarPanels()
          setIsReportOpen(true)
        }}
        onOpenGlobalSearch={() => {
          closeAllSidebarPanels()
          setIsGlobalSearchOpen(true)
        }}
        onOpenQuickNotes={() => {
          closeAllSidebarPanels()
          setIsQuickNotesOpen(true)
        }}
        onOpenTimeBlock={() => {
          closeAllSidebarPanels()
          setIsTimeBlockOpen(true)
        }}
        onOpenFocusStats={() => {
          closeAllSidebarPanels()
          setIsFocusStatsOpen(true)
        }}
        onOpenFocusHistory={() => {
          closeAllSidebarPanels()
          setIsFocusHistoryOpen(true)
        }}
        onOpenMigration={() => {
          closeAllSidebarPanels()
          setIsMigrationOpen(true)
        }}
        authLabel={`${role === 'admin' ? '管理员' : '用户'} · ${userId}`}
        currentThemeName={activeTheme.name}
        membershipTier={currentTier.label}
        aiQuota={totalQuota}
        streakDays={workspaceState.growth.streakDays}
        dataSource={dataSource}
        onSwitchDataSource={() => {
          closeAllSidebarPanels()
          setIsSupabaseConfigOpen(true)
        }}
      />
      </AdaptiveSidebar>
    <main className="app-shell">
      <svg className="liquid-glass-svg-defs" aria-hidden="true" focusable="false" width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <filter id="liquid-glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise">
              <animate attributeName="baseFrequency" dur="18s" values="0.008 0.012;0.014 0.018;0.008 0.012" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" xChannelSelector="R" yChannelSelector="G">
              <animate attributeName="scale" dur="10s" values="6;14;6" repeatCount="indefinite" />
            </feDisplacementMap>
          </filter>
          <filter id="liquid-glass-soft" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="3" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div className="workspace-layout">
      <section className="workspace">
        <header className="hero panel">
          <div className="hero-brand">
            <div className="hero-logo" aria-hidden="true">寰</div>
            <span className="hero-app-name">星寰海</span>
          </div>
          <div className="hero-datetime">
            <ClockDisplay />
            <NotificationBanner service={notificationService} />
          </div>
          <div className="hero-quote">
            <span className="hero-quote-text">"每一天都是新的开始"</span>
            <span className="hero-quote-author">—— 星寰海</span>
          </div>
          <div className="hero-meta">
            {workspaceState.growth.streakDays > 0 && (
              <span className="hero-streak">
                已坚持 <strong>{workspaceState.growth.streakDays}</strong> 天
              </span>
            )}
            <span className="hero-theme-name">{activeTheme.name}</span>
          </div>
        </header>

        <section className="workspace-switcher" aria-label="用户场景切换">
          <PersonaSwitcher
            activePersonaId={activePersona.id}
            onSwitchPersona={(personaId) => switchPersona(personaId as PersonaId)}
          />
        </section>

        <section className="panel" aria-label="工作台">
          <div className="card-heading">
            <div>
              <h2>工作台</h2>
            </div>
          </div>
          <div className="draggable-canvas workbench-canvas" role="region" aria-label="工作台画布">
            {moduleStoreState.activeModules.map((item) => {
              const module = moduleStoreState.availableModules.find((candidate) => candidate.id === item.moduleId)
              if (!module) return null

              const cardChildren: Record<string, React.ReactNode> = {
                'persona-plan': (
                  <div className="persona-brief">
                    <strong>{activeTemplate.title}</strong>
                    <small>{activeTemplate.operatingRhythm}</small>
                    <em>{activeTemplate.defaultAction}</em>
                  </div>
                ),
                'growth-rpg': (
                  <section className="growth-card card" style={{ background: activeTheme.tokens.gradients.card }}>
                    <h2>Lv. {workspaceState.growth.level}</h2>
                    <div className="xp-track"><span /></div>
                    <strong>{workspaceState.growth.achievements} 个成就 · {workspaceState.growth.experience} 积分</strong>
                  </section>
                ),
                'key-metrics': (
                  <section className="card">
                    <div className="metric-grid">
                      {activePersona.keyMetrics.map((metric, index) => (
                        <article key={metric}>
                          <strong>{metric}</strong>
                          <span>{index === 0 ? (activePersona.modules[0]?.signal ?? activePersona.mainModuleTitle) : `${70 + index * 6}%`}</span>
                        </article>
                      ))}
                    </div>
                  </section>
                ),
                'today-actions': (
                  <section className="panel side-card">
                    <div className="today-list">
                      {todoTasks.map((task) => (
                        <article key={task.id}><span /><div><strong>{task.title}</strong><small>{task.dueLabel} · {task.minutes} 分钟</small></div></article>
                      ))}
                    </div>
                  </section>
                ),
                'focus-session': (
                  <section className="panel side-card timer-card" role="region" aria-label="任务专注计时器">
                    <strong>{`${focusMinuteText}:${focusSecondText}`}</strong>
                    <p>{focusDisplayTask ? focusDisplayTask.title : '当前场景暂无待办任务'}</p>
                    <small>
                      {focusDisplayTask
                        ? `${focusDisplayTask.dueLabel} · ${focusRewardPoints} 积分`
                        : '可先切换场景或新增任务'}
                    </small>
                    <div className="duration-control" aria-label="自定义专注时长">
                      <button
                        type="button"
                        className="duration-step"
                        disabled={!focusDisplayTask || isFocusRunning || focusTargetMinutes <= FOCUS_MIN_MINUTES}
                        onClick={() => adjustFocusDuration(-FOCUS_STEP_MINUTES)}
                        aria-label="减少专注时长"
                      >
                        <Minus size={16} strokeWidth={3} aria-hidden="true" />
                      </button>
                      <label className="duration-input">
                        <input
                          type="number"
                          min={FOCUS_MIN_MINUTES}
                          max={FOCUS_MAX_MINUTES}
                          step={1}
                          value={focusTargetMinutes}
                          disabled={!focusDisplayTask || isFocusRunning}
                          onChange={handleFocusDurationInput}
                          aria-label="专注时长（分钟）"
                        />
                        <span>分钟</span>
                      </label>
                      <button
                        type="button"
                        className="duration-step"
                        disabled={!focusDisplayTask || isFocusRunning || focusTargetMinutes >= FOCUS_MAX_MINUTES}
                        onClick={() => adjustFocusDuration(FOCUS_STEP_MINUTES)}
                        aria-label="增加专注时长"
                      >
                        <Plus size={16} strokeWidth={3} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="timer-actions">
                      <button
                        className="timer-primary"
                        disabled={!nextFocusTask && !activeFocusTask}
                        onClick={isFocusRunning ? pauseFocusTimer : startFocusTimer}
                        type="button"
                      >
                        {isFocusRunning ? '暂停专注' : activeFocusTask ? '继续专注' : '绑定任务开始'}
                      </button>
                      <button
                        className="timer-secondary"
                        disabled={!activeFocusTask && focusPausedRemainingMs === null}
                        onClick={resetFocusTimer}
                        type="button"
                      >
                        重置
                      </button>
                    </div>
                  </section>
                ),
                'focus-history': (
                  <section className="panel side-card focus-history-card" role="region" aria-label="最近专注会话">
                    {workspaceState.focusSessions.length === 0 ? (
                      <p className="empty-state">完成首个任务后，会自动沉淀到这里。</p>
                    ) : (
                      <ul className="focus-history-list">
                        {workspaceState.focusSessions.slice(0, 3).map((session) => (
                          <li key={session.id}>
                            <strong>{session.taskTitle}</strong>
                            <small>
                              {session.minutes} 分钟 · {session.rewardPoints} 积分 · {new Date(session.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ),
                'memory-insights': (
                  <section className="panel side-card memory-insights-card" role="region" aria-label="记忆洞察">
                    <h3>近期上下文</h3>
                    {workspaceState.focusSessions.length > 0 ? (
                      <ul className="memory-events-list">
                        {workspaceState.focusSessions.slice(0, 4).map((session) => (
                          <li key={session.id}>
                            <span className="memory-event-time">
                              {new Date(session.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="memory-event-content">
                              完成 {session.minutes} 分钟专注：{session.taskTitle}
                            </span>
                            <button
                              className="memory-forget-btn"
                              onClick={() => {
                                setWorkspaceState((prev) => ({
                                  ...prev,
                                  focusSessions: prev.focusSessions.filter((s) => s.id !== session.id)
                                }))
                                addToast({ type: 'info', title: '已移除', message: `专注记录「${session.taskTitle}」已从上下文中移除。` })
                              }}
                              type="button"
                            >
                              忘记
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-state">暂无记忆记录，完成专注后会显示在这里。</p>
                    )}
                  </section>
                ),
                'ai-coach': (
                  <section className="panel side-card ai-card">
                    <div className="card-heading compact"><h2>{activePersona.aiRole}</h2><Bot size={20} /></div>
                    <p>{promptDraft.title}</p>
                    <strong>{activeProvider.name}</strong>
                    <small>{workspaceState.integrations.ai.status === 'ready' ? '已配置，可生成建议' : '未配置 API Key，已预留 Provider 接口'}</small>
                    <div className="ai-actions">
                      {activePersona.aiActions.map((action) => (
                        <span key={action}>{action}</span>
                      ))}
                    </div>
                  </section>
                ),
                'platform-matrix': (
                  <section className="panel side-card multi-end-card">
                    <p>当前桌面端优先，数据层已按本地优先和同步预留设计。</p>
                    <div className="platform-list">
                      <span>Desktop</span>
                      <span>微信小程序</span>
                      <span>Web/PWA</span>
                      <span>iOS</span>
                      <span>HarmonyOS</span>
                    </div>
                  </section>
                ),
                'theme-center': (
                  <section className="panel side-card theme-center">
                    <p>后期可继续新增学习、办公、游戏化和品牌主题包。</p>
                    <div className="design-note">
                      <span>设计定位</span>
                      <strong>{activeTheme.design.tone}</strong>
                      <small>{activeTheme.design.principle}</small>
                    </div>
                    <button
                      className="theme-recommend-button"
                      onClick={() => restorePersonaTheme()}
                      type="button"
                    >
                      恢复场景推荐主题
                    </button>
                    <button
                      className="theme-picker-button"
                      onClick={() => openThemePicker()}
                      type="button"
                    >
                      <span>打开主题库</span>
                      <small>{themeRegistry.length} 款主题 · 支持搜索和滑动选择</small>
                    </button>
                    <button
                      className="wallpaper-picker-button"
                      onClick={() => setIsWallpaperPickerOpen(true)}
                      type="button"
                    >
                      <span>壁纸设置</span>
                      <small>自定义壁纸与主题联动效果</small>
                    </button>
                    <div className="active-theme-preview" aria-label="当前主题预览">
                      <strong>{activeTheme.name}</strong>
                      <span className="theme-swatch-row" aria-hidden="true">
                        <span className="theme-swatch" style={{ background: activeTheme.tokens.colors.primary }} />
                        <span className="theme-swatch" style={{ background: activeTheme.tokens.colors.secondary }} />
                        <span className="theme-swatch" style={{ background: activeTheme.tokens.colors.accent }} />
                      </span>
                    </div>
                  </section>
                ),
                'statistics': (
                  <section className="panel side-card statistics-card" role="region" aria-label="数据统计">
                    <div className="statistics-grid">
                      <article className="statistics-item">
                        <span className="statistics-value">{completedTasks.length}</span>
                        <span className="statistics-label">已完成任务</span>
                      </article>
                      <article className="statistics-item">
                        <span className="statistics-value">{todoTasks.length}</span>
                        <span className="statistics-label">待办任务</span>
                      </article>
                      <article className="statistics-item">
                        <span className="statistics-value">{workspaceState.focusSessions.reduce((sum, s) => sum + s.minutes, 0)}</span>
                        <span className="statistics-label">专注分钟</span>
                      </article>
                      <article className="statistics-item">
                        <span className="statistics-value">{workspaceState.growth.streakDays}</span>
                        <span className="statistics-label">连续天数</span>
                      </article>
                    </div>
                    <div className="statistics-progress">
                      <div className="statistics-progress-header">
                        <span>本场景进度</span>
                        <span>{weeklyProgress}%</span>
                      </div>
                      <div className="statistics-progress-bar">
                        <div className="statistics-progress-fill" style={{ width: `${weeklyProgress}%` }} />
                      </div>
                    </div>
                  </section>
                ),
                'cycle-today': (
                  <section className="panel side-card cycle-today-card" role="region" aria-label="今日周期">
                    <div className="cycle-today-header">
                      <span className="cycle-phase-indicator" style={{ 
                        display: 'inline-block', 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        background: 'var(--primary)',
                        marginRight: 8 
                      }} />
                      <strong>当前阶段</strong>
                    </div>
                    <p className="cycle-today-phase">查看今日周期阶段和能量建议</p>
                    <div className="cycle-today-metrics">
                      <article>
                        <span className="cycle-metric-value">--</span>
                        <span className="cycle-metric-label">周期天数</span>
                      </article>
                      <article>
                        <span className="cycle-metric-value">--</span>
                        <span className="cycle-metric-label">能量等级</span>
                      </article>
                    </div>
                    <button
                      className="cycle-today-detail-btn"
                      onClick={() => setIsCycleTrackerOpen(true)}
                      type="button"
                    >
                      查看详情
                    </button>
                  </section>
                ),
                'memory-profile': (
                  <section className="panel side-card memory-profile-card" role="region" aria-label="记忆画像">
                    <div className="memory-profile-header">
                      <strong>记忆画像</strong>
                      <span className="memory-profile-badge" style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 8,
                        background: 'var(--surface-elevated)',
                        color: 'var(--muted)'
                      }}>
                        {memoryProfile.personality.mbtiTendency && memoryProfile.personality.mbtiTendency !== 'unknown' ? memoryProfile.personality.mbtiTendency : '未设置'}
                      </span>
                    </div>
                    <div className="memory-profile-traits">
                      {memoryProfile.personality.traits.length > 0 ? (
                        memoryProfile.personality.traits.slice(0, 3).map((trait) => (
                          <span key={trait} className="memory-trait-tag" style={{
                            display: 'inline-block',
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: 'var(--primary)',
                            color: '#fff',
                            marginRight: 4,
                            marginBottom: 4
                          }}>
                            {trait}
                          </span>
                        ))
                      ) : (
                        <p className="empty-state">点击下方按钮完善你的记忆画像</p>
                      )}
                    </div>
                    <div className="memory-profile-summary">
                      <small>
                        节奏：{memoryProfile.rhythm.energyPeak === 'morning' ? '晨间型' : 
                               memoryProfile.rhythm.energyPeak === 'afternoon' ? '午后型' : 
                               memoryProfile.rhythm.energyPeak === 'evening' ? '晚间型' : '未设置'}
                        {' · '}
                        学习风格：{memoryProfile.learning.learningStyle === 'visual' ? '视觉型' : 
                                  memoryProfile.learning.learningStyle === 'auditory' ? '听觉型' : 
                                  memoryProfile.learning.learningStyle === 'kinesthetic' ? '动觉型' : '未设置'}
                      </small>
                    </div>
                    <button
                      className="memory-profile-detail-btn"
                      onClick={() => setIsMemoryProfileOpen(true)}
                      type="button"
                    >
                      编辑画像
                    </button>
                  </section>
                ),
                'habit-tracker': (
                  <section className="panel side-card habit-tracker-card" role="region" aria-label="习惯追踪">
                    <HabitTracker compact />
                  </section>
                ),
                'journal': (
                  <section className="panel side-card journal-card" role="region" aria-label="复盘日记">
                    <JournalUI compact />
                  </section>
                ),
                'reading-list': (
                  <section className="panel side-card reading-list-card" role="region" aria-label="阅读清单">
                    <ReadingUI compact theme={activeTheme} />
                  </section>
                ),
                'error-book': (
                  <section className="panel side-card error-book-card" role="region" aria-label="错题本">
                    <ErrorBookUI userId={userId} />
                  </section>
                ),
                'memory-cards': (
                  <section className="panel side-card memory-cards-card" role="region" aria-label="记忆卡">
                    <MemoryCardsUI />
                  </section>
                ),
                'exam-tracker': (
                  <section className="panel side-card exam-tracker-card" role="region" aria-label="考试记录">
                    <ExamTrackerUI userId={userId} />
                  </section>
                ),
                'study-planner': (
                  <section className="panel side-card study-planner-card" role="region" aria-label="学习计划">
                    <StudyPlannerUI userId={userId} />
                  </section>
                ),
                'focus-timer': (
                  <section className="panel side-card focus-timer-card" role="region" aria-label="专注计时">
                    <FocusTimerUI userId={userId} />
                  </section>
                ),
                'study-companion': (
                  <section className="panel side-card study-companion-card" role="region" aria-label="备考陪伴">
                    <StudyCompanionUI userId={userId} />
                  </section>
                ),
                'mood-journal': (
                  <section className="panel side-card mood-journal-card" role="region" aria-label="情绪日记">
                    <MoodJournalUI userId={userId} />
                  </section>
                )
              }

              const personaTitleMap: Record<string, string> = {
                'persona-plan': activePersona.mainModuleTitle,
                'ai-coach': activePersona.aiRole
              }

              const checkCollision = (_moduleId: string, targetPos: { x: number; y: number }) => {
                const hasCollision = moduleStoreState.activeModules.some((other) => {
                  if (other.moduleId === item.moduleId) return false
                  const otherRight = other.position.x + other.size.columns
                  const otherBottom = other.position.y + other.size.rows
                  const targetRight = targetPos.x + item.size.columns
                  const targetBottom = targetPos.y + item.size.rows
                  return targetPos.x < otherRight && targetRight > other.position.x && targetPos.y < otherBottom && targetBottom > other.position.y
                })
                if (!hasCollision) {
                  moveWorkbenchItem(item.moduleId, targetPos)
                }
              }

              return (
                <CanvasCard
                  key={item.moduleId}
                  title={personaTitleMap[item.moduleId] || module.title}
                  description={module.description}
                  size={item.size}
                  position={item.position}
                  onDragStart={() => undefined}
                  onDragEnd={() => undefined}
                  onMove={(position) => moveWorkbenchItem(item.moduleId, position)}
                  onRemove={() => removeCanvasModule(item.moduleId)}
                  onResize={(size) => updateCanvasItems(moduleStoreState.activeModules.map((candidate) => (
                    candidate.moduleId === item.moduleId ? { ...candidate, size } : candidate
                  )))}
                  onOpenDetails={() => setOpenWorkbenchDetail(item.moduleId)}
                  collisionEnabled={true}
                  onCollision={checkCollision}
                >
                  {cardChildren[item.moduleId]}
                </CanvasCard>
              )
            })}
          </div>
          {layoutImportError && <small style={{ color: '#dc2626' }}>{layoutImportError}</small>}
        </section>
      </section>
      <SidebarPanel
        personaId={activePersona.id}
        streakDays={workspaceState.growth.streakDays}
        totalFocusMinutes={Math.floor(focusSeconds / 60)}
        completedTasks={completedTasks.length}
        todoTasks={todoTasks.map(t => ({ id: t.id, title: t.title, dueLabel: t.dueLabel, minutes: t.minutes }))}
        focusMinuteText={focusMinuteText}
        focusSecondText={focusSecondText}
        isFocusRunning={isFocusRunning}
        focusDisplayTask={focusDisplayTask ? { id: focusDisplayTask.id, title: focusDisplayTask.title, dueLabel: focusDisplayTask.dueLabel } : null}
        focusTargetMinutes={focusTargetMinutes}
        onStartFocus={startFocusTimer}
        onPauseFocus={pauseFocusTimer}
        onResetFocus={resetFocusTimer}
        onAdjustFocus={adjustFocusDuration}
        onOpenSchedule={() => setIsScheduleOpen(true)}
      />
      </div>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'habit-tracker'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="习惯追踪"
        subtitle="坚持每日打卡，养成好习惯"
        ariaLabel="习惯追踪 · 工作台详情"
        className="habit-tracker-detail-modal"
      >
        <div className="membership-modal-content">
          <HabitTracker />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'journal'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="复盘日记"
        subtitle="记录每日收获、反思和心情"
        ariaLabel="复盘日记 · 工作台详情"
        className="journal-detail-modal"
      >
        <div className="membership-modal-content">
          <JournalUI />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'reading-list'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="阅读清单"
        subtitle="书籍管理、阅读进度追踪、读书笔记"
        ariaLabel="阅读清单 · 工作台详情"
        className="reading-list-detail-modal"
      >
        <div className="membership-modal-content">
          <ReadingUI theme={activeTheme} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'error-book'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="错题本"
        subtitle="记录错题，AI 智能分析"
        ariaLabel="错题本 · 工作台详情"
        className="error-book-detail-modal"
      >
        <div className="membership-modal-content">
          <ErrorBookUI userId={userId} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'memory-cards'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="记忆卡"
        subtitle="间隔重复记忆，AI 自动提取知识点"
        ariaLabel="记忆卡 · 工作台详情"
        className="memory-cards-detail-modal"
      >
        <div className="membership-modal-content">
          <MemoryCardsUI />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'exam-tracker'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="考试记录"
        subtitle="记录每次考试各科分数，AI 对比分析进退步"
        ariaLabel="考试记录 · 工作台详情"
        className="exam-tracker-detail-modal"
      >
        <div className="membership-modal-content">
          <ExamTrackerUI userId={userId} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'study-planner'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="学习计划"
        subtitle="AI 驱动的备考规划，分阶段高效复习"
        ariaLabel="学习计划 · 工作台详情"
        className="study-planner-detail-modal"
      >
        <div className="membership-modal-content">
          <StudyPlannerUI userId={userId} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'focus-timer'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="专注计时"
        subtitle="专注数据看板，科目分布统计，专注趋势追踪"
        ariaLabel="专注计时 · 工作台详情"
        className="focus-timer-detail-modal"
      >
        <div className="membership-modal-content">
          <FocusTimerUI userId={userId} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'study-companion'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="备考陪伴"
        subtitle="AI 备考陪伴伙伴，情绪支持、呼吸放松、正念练习"
        ariaLabel="备考陪伴 · 工作台详情"
        className="study-companion-detail-modal"
      >
        <div className="membership-modal-content">
          <StudyCompanionUI userId={userId} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'mood-journal'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="情绪日记"
        subtitle="每日情绪记录，趋势追踪，低情绪预警关怀"
        ariaLabel="情绪日记 · 工作台详情"
        className="mood-journal-detail-modal"
      >
        <div className="membership-modal-content">
          <MoodJournalUI userId={userId} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'focus-history'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="最近专注"
        subtitle={`${workspaceState.focusSessions.length} 次专注记录`}
        ariaLabel="最近专注 · 工作台详情"
      >
        <div className="focus-history-detail">
          {workspaceState.focusSessions.length === 0 ? (
            <p className="empty-state">完成首个任务后，会自动沉淀到这里。</p>
          ) : (
            <ul className="focus-history-detail-list">
              {workspaceState.focusSessions.map((session) => (
                <li key={session.id} className="focus-history-detail-item">
                  <div className="focus-history-detail-main">
                    <strong>{session.taskTitle}</strong>
                    <span className="focus-history-detail-meta">
                      {session.minutes} 分钟 · {session.rewardPoints} 积分
                    </span>
                  </div>
                  <span className="focus-history-detail-time">
                    {new Date(session.completedAt).toLocaleString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="focus-history-summary">
            <article>
              <strong>{workspaceState.focusSessions.reduce((sum, s) => sum + s.minutes, 0)}</strong>
              <span>累计分钟</span>
            </article>
            <article>
              <strong>{workspaceState.focusSessions.length}</strong>
              <span>专注次数</span>
            </article>
            <article>
              <strong>{workspaceState.focusSessions.reduce((sum, s) => sum + s.rewardPoints, 0)}</strong>
              <span>累计积分</span>
            </article>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'persona-plan'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title={activePersona.mainModuleTitle}
        subtitle={activePersona.description}
        ariaLabel={`${activePersona.mainModuleTitle} · 工作台详情`}
      >
        <div className="membership-modal-content">
          <p style={{ padding: 20, color: 'var(--muted)' }}>该模块为当前场景的核心展示区域，详细内容请在画布模块中查看。</p>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'growth-rpg'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="成长等级"
        subtitle={`Lv. ${workspaceState.growth.level} · ${workspaceState.growth.experience} 积分`}
        ariaLabel="成长等级 · 工作台详情"
      >
        <div className="membership-modal-content">
          <section style={{ padding: 20 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ 
                width: 80, height: 80, borderRadius: '50%', 
                background: 'var(--primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 32, fontWeight: 700 
              }}>
                {workspaceState.growth.level}
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Lv. {workspaceState.growth.level}</h2>
              <p style={{ color: 'var(--muted)', margin: '8px 0 16px' }}>{workspaceState.growth.experience} 积分</p>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (workspaceState.growth.experience % 1000) / 10)}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0 0' }}>{1000 - (workspaceState.growth.experience % 1000)} 积分到下一级</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12 }}>
                <strong style={{ fontSize: 24 }}>{workspaceState.growth.achievements}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>成就</p>
              </div>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12 }}>
                <strong style={{ fontSize: 24 }}>{workspaceState.growth.streakDays}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>连续天数</p>
              </div>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12 }}>
                <strong style={{ fontSize: 24 }}>{workspaceState.growth.totalFocusMinutes}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>专注分钟</p>
              </div>
            </div>
          </section>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'key-metrics'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="关键指标"
        subtitle="当前场景的关键指标展示"
        ariaLabel="关键指标 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {activePersona.keyMetrics.map((metric, index) => (
                <div key={metric} style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12, textAlign: 'center' }}>
                  <strong style={{ fontSize: 20, color: 'var(--primary)' }}>{index === 0 ? (activePersona.modules[0]?.signal ?? activePersona.mainModuleTitle) : `${70 + index * 6}%`}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>{metric}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'today-actions'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="今日行动"
        subtitle={`${todoTasks.length} 个待办 · ${completedTasks.length} 已完成`}
        ariaLabel="今日行动 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20, maxHeight: 400, overflow: 'auto' }}>
            {todoTasks.length === 0 && completedTasks.length === 0 ? (
              <p className="empty-state">暂无任务</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {todoTasks.map((task) => (
                  <li key={task.id} style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" disabled />
                    <span>{task.title}</span>
                    {task.dueLabel && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{task.dueLabel}</span>}
                  </li>
                ))}
                {completedTasks.map((task) => (
                  <li key={task.id} style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.6 }}>
                    <input type="checkbox" checked disabled />
                    <span style={{ textDecoration: 'line-through' }}>{task.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'focus-session'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="任务专注计时器"
        subtitle={focusDisplayTask ? focusDisplayTask.title : '当前场景暂无待办任务'}
        ariaLabel="任务专注计时器 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20, textAlign: 'center' }}>
            <strong style={{ fontSize: 48, fontWeight: 300 }}>{`${focusMinuteText}:${focusSecondText}`}</strong>
            <p style={{ color: 'var(--muted)', margin: '8px 0' }}>
              {focusDisplayTask ? `${focusDisplayTask.dueLabel} · ${focusRewardPoints} 积分` : '可先切换场景或新增任务'}
            </p>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'memory-insights'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="记忆洞察"
        subtitle="近期上下文和记忆事件"
        ariaLabel="记忆洞察 · 工作台详情"
      >
        <div className="membership-modal-content">
          <p style={{ padding: 20, color: 'var(--muted)' }}>记忆洞察模块展示近期的上下文和记忆事件详情。</p>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'ai-coach'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="AI 教练"
        subtitle={activePersona.aiRole}
        ariaLabel="AI 教练 · 工作台详情"
      >
        <div className="membership-modal-content">
          <p style={{ padding: 20, color: 'var(--muted)' }}>AI 教练为当前场景提供智能辅导和建议。</p>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'platform-matrix'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="跨端数据"
        subtitle="多平台数据同步状态"
        ariaLabel="跨端数据 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20 }}>
            <p style={{ marginBottom: 16 }}>当前桌面端优先，数据层已按本地优先和同步预留设计。</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Desktop', '微信小程序', 'Web/PWA', 'iOS', 'HarmonyOS'].map((platform) => (
                <span key={platform} style={{ padding: '8px 16px', background: 'var(--surface-elevated)', borderRadius: 8, fontSize: 14 }}>{platform}</span>
              ))}
            </div>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'statistics'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="数据统计"
        subtitle="综合数据统计"
        ariaLabel="数据统计 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12, textAlign: 'center' }}>
                <strong style={{ fontSize: 28 }}>{completedTasks.length}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>已完成任务</p>
              </div>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12, textAlign: 'center' }}>
                <strong style={{ fontSize: 28 }}>{todoTasks.length}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>待办任务</p>
              </div>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12, textAlign: 'center' }}>
                <strong style={{ fontSize: 28 }}>{workspaceState.focusSessions.reduce((sum, s) => sum + s.minutes, 0)}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>专注分钟</p>
              </div>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12, textAlign: 'center' }}>
                <strong style={{ fontSize: 28 }}>{workspaceState.growth.streakDays}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>连续天数</p>
              </div>
            </div>
            <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12 }}>
              <strong style={{ fontSize: 16, marginBottom: 12, display: 'block' }}>本周进度</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${weeklyProgress}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{weeklyProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'cycle-today'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="今日周期"
        subtitle="生理周期追踪"
        ariaLabel="今日周期 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20 }}>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>点击下方按钮打开完整的周期追踪功能。</p>
            <button
              className="custom-persona-editor-btn primary"
              onClick={() => { setOpenWorkbenchDetail(null); setIsCycleTrackerOpen(true); }}
              style={{ width: '100%' }}
            >
              打开周期追踪
            </button>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={openWorkbenchDetail === 'memory-profile'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="记忆画像"
        subtitle="了解你的独特风格"
        ariaLabel="记忆画像 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <strong>MBTI 倾向</strong>
              <p style={{ color: 'var(--muted)', margin: '4px 0 0' }}>
                {memoryProfile.personality.mbtiTendency && memoryProfile.personality.mbtiTendency !== 'unknown' ? memoryProfile.personality.mbtiTendency : '未设置'}
              </p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>能量节奏</strong>
              <p style={{ color: 'var(--muted)', margin: '4px 0 0' }}>
                {memoryProfile.rhythm.energyPeak === 'morning' ? '晨间型' : 
                 memoryProfile.rhythm.energyPeak === 'afternoon' ? '午后型' : 
                 memoryProfile.rhythm.energyPeak === 'evening' ? '晚间型' : '未设置'}
              </p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <strong>学习风格</strong>
              <p style={{ color: 'var(--muted)', margin: '4px 0 0' }}>
                {memoryProfile.learning.learningStyle === 'visual' ? '视觉型' : 
                 memoryProfile.learning.learningStyle === 'auditory' ? '听觉型' : 
                 memoryProfile.learning.learningStyle === 'kinesthetic' ? '动觉型' : '未设置'}
              </p>
            </div>
            <button
              className="custom-persona-editor-btn primary"
              onClick={() => { setOpenWorkbenchDetail(null); setIsMemoryProfileOpen(true); }}
              style={{ width: '100%' }}
            >
              编辑画像
            </button>
          </div>
        </div>
      </AdaptiveModal>

      {isThemePickerOpen && (
        <div className="theme-modal-backdrop" onClick={closeThemePicker} role="presentation">
          <section
            aria-modal="true"
            className="theme-modal"
            data-material={activeTheme.material}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="主题库"
          >
            <header className="theme-modal-hero">
              <div className="theme-modal-hero-text">
                <p className="eyebrow">Theme Library · 主题库</p>
                <h2>挑一个今天的氛围</h2>
                <small>
                  当前 <strong>{activeTheme.name}</strong> · 共 {themeRegistry.length} 款主题、{themeFamilies.length} 个分类，按场景与材质归档
                </small>
              </div>
              <div className="theme-modal-hero-preview" aria-hidden="true">
                <span
                  className="theme-modal-hero-orb"
                  style={{
                    background: activeTheme.tokens.gradients.hero,
                    boxShadow: activeTheme.tokens.effects.shadow
                  }}
                />
                <span className="theme-modal-hero-meta">
                  <span>{themeFamilyLabels[activeTheme.aesthetic]}</span>
                  <span className="theme-option-material-tag" data-material={activeTheme.material}>
                    {materialLabels[activeTheme.material]}
                  </span>
                </span>
              </div>
              <button className="theme-modal-close" onClick={closeThemePicker} type="button" aria-label="关闭主题库">
                ×
              </button>
            </header>
            <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border)' }}>
              <button 
                className="custom-persona-editor-btn secondary" 
                onClick={() => { setIsThemePickerOpen(false); setIsWallpaperPickerOpen(true); }}
                style={{ padding: '8px 16px', fontSize: 13 }}
                type="button"
              >
                🖼️ 壁纸设置
              </button>
            </div>

            <div className="theme-modal-toolbar">
              <label className="theme-search">
                <span>搜索主题</span>
                <input
                  aria-label="搜索主题"
                  onChange={(event) => setThemeSearchQuery(event.target.value)}
                  placeholder="搜索鸿蒙、液态玻璃、多巴胺、水墨..."
                  type="search"
                  value={themeSearchQuery}
                />
              </label>
              <div className="theme-family-nav" role="tablist" aria-label="主题分类">
                <button
                  role="tab"
                  aria-selected={activeThemeFamily === 'all'}
                  className={activeThemeFamily === 'all' ? 'theme-family-chip active' : 'theme-family-chip'}
                  onClick={() => setActiveThemeFamily('all')}
                  type="button"
                >
                  <span className="theme-family-chip-label">全部</span>
                  <span className="theme-family-chip-count">{themeRegistry.length}</span>
                </button>
                {themeFamilies.map((family) => {
                  const isActive = activeThemeFamily === family.id
                  return (
                    <button
                      key={family.id}
                      role="tab"
                      aria-selected={isActive}
                      className={isActive ? 'theme-family-chip active' : 'theme-family-chip'}
                      onClick={() => setActiveThemeFamily(family.id)}
                      type="button"
                      title={family.description}
                    >
                      <span className="theme-family-chip-label">{family.label}</span>
                      <span className="theme-family-chip-count">{family.themes.length}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {activeThemeFamily !== 'all' && (
              <div className="theme-family-blurb">
                {(() => {
                  const family = themeFamilies.find((f) => f.id === activeThemeFamily)
                  if (!family) return null
                  return (
                    <>
                      <strong>{family.label}</strong>
                      <span>{family.subtitle}</span>
                      <small>{family.description}</small>
                    </>
                  )
                })()}
              </div>
            )}

            <div className="theme-modal-grid" aria-label="主题列表">
              {filteredThemes.map((theme) => (
                <ThemeOptionButton activeThemeId={activeTheme.id} key={theme.id} onSelect={switchTheme} theme={theme} />
              ))}
              {filteredThemes.length === 0 && (
                <div className="theme-empty-state">
                  <strong>没有找到匹配主题</strong>
                  <small>换个关键词或切换到「全部」分类再试一次。</small>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {isWallpaperPickerOpen && (
        <div className="theme-modal-backdrop" onClick={() => setIsWallpaperPickerOpen(false)} role="presentation">
          <section
            aria-modal="true"
            className="theme-modal wallpaper-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="壁纸设置"
          >
            <header className="theme-modal-hero">
              <div className="theme-modal-hero-text">
                <p className="eyebrow">Wallpaper · 壁纸设置</p>
                <h2>为当前主题搭配壁纸</h2>
                <small>
                  当前主题 <strong>{activeTheme.name}</strong> · 壁纸效果与主题自动联动
                </small>
              </div>
              <button className="theme-modal-close" onClick={() => setIsWallpaperPickerOpen(false)} type="button" aria-label="关闭壁纸设置">
                ×
              </button>
            </header>
            <WallpaperPicker
              currentThemeId={activeTheme.id}
              onClose={() => {
                const wallpaper = wallpaperService.getActiveWallpaper()
                if (wallpaper?.thumbnailDataUrl) {
                  setRelationshipSpaceWallpaper(wallpaper.thumbnailDataUrl)
                }
                setIsWallpaperPickerOpen(false)
              }}
            />
          </section>
        </div>
      )}

      {isMembershipOpen && (
        <div className="membership-modal-backdrop" onClick={() => setIsMembershipOpen(false)} role="presentation">
          <section
            aria-modal="true"
            className="membership-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="会员中心"
          >
            <header className="membership-modal-hero">
              <div className="membership-modal-hero-text">
                <p className="eyebrow">Membership · 会员中心</p>
                <h2>升级会员，解锁更多能力</h2>
                <small>
                  当前 <strong style={{ color: currentTier.color }}>{currentTier.label}</strong> · AI 额度 {totalQuota} 次
                </small>
              </div>
              <button className="membership-modal-close" onClick={() => setIsMembershipOpen(false)} type="button" aria-label="关闭会员中心">
                ×
              </button>
            </header>

            <div className="membership-modal-content">
              <section className="membership-quota-section">
                <h3>AI 额度</h3>
                <div className="membership-quota-grid">
                  <div className="membership-quota-card">
                    <span className="membership-quota-label">免费额度</span>
                    <span className="membership-quota-value">{quotaStatus.free?.remaining ?? 0}</span>
                  </div>
                  <div className="membership-quota-card">
                    <span className="membership-quota-label">会员额度</span>
                    <span className="membership-quota-value">{(quotaStatus.study?.remaining ?? 0) + (quotaStatus.agent?.remaining ?? 0)}</span>
                  </div>
                  <div className="membership-quota-card">
                    <span className="membership-quota-label">加油包</span>
                    <span className="membership-quota-value">{quotaStatus.pack?.remaining ?? 0}</span>
                  </div>
                </div>
              </section>

              <section className="membership-trial-section">
                <h3>免费试用</h3>
                <p className="membership-trial-desc">先体验再决定，开启会员试用</p>
                <div className="membership-trial-grid">
                  {!entitlementService.has(userId, 'study') && !hasActiveTrial('study') && (
                    <div className="membership-trial-card">
                      <div className="membership-trial-header">
                        <span className="membership-trial-name">学习会员试用</span>
                        <span className="membership-trial-badge">3天</span>
                      </div>
                      <ul className="membership-trial-features">
                        <li>高级主题全解锁</li>
                        <li>云同步功能</li>
                        <li>50次AI额度</li>
                      </ul>
                      <button className="membership-trial-button" style={{ background: '#10b981' }} onClick={() => handleStartTrial('study', 3)}>立即试用</button>
                    </div>
                  )}
                  {!entitlementService.has(userId, 'agent') && !hasActiveTrial('agent') && (
                    <div className="membership-trial-card">
                      <div className="membership-trial-header">
                        <span className="membership-trial-name">Agent 会员试用</span>
                        <span className="membership-trial-badge">7天</span>
                      </div>
                      <ul className="membership-trial-features">
                        <li>有记忆的AI搭子</li>
                        <li>自我进化机制</li>
                        <li>200次AI额度</li>
                      </ul>
                      <button className="membership-trial-button" style={{ background: '#6366f1' }} onClick={() => handleStartTrial('agent', 7)}>立即试用</button>
                    </div>
                  )}
                  {!entitlementService.has(userId, 'agent_plus') && !hasActiveTrial('agent_plus') && (
                    <div className="membership-trial-card featured">
                      <div className="membership-trial-header">
                        <span className="membership-trial-name">Agent PLUS 试用</span>
                        <span className="membership-trial-badge">5天</span>
                      </div>
                      <ul className="membership-trial-features">
                        <li>AI 3D角色生成</li>
                        <li>无限AI额度</li>
                        <li>全部进阶功能</li>
                      </ul>
                      <button className="membership-trial-button" style={{ background: '#8b5cf6' }} onClick={() => handleStartTrial('agent_plus', 5)}>立即试用</button>
                    </div>
                  )}
                  {userTrials.length > 0 && (
                    <div className="membership-trial-status">
                      <h4>您的试用</h4>
                      {userTrials.filter(t => !t.used).map((trial, i) => (
                        <div key={i} className="membership-trial-active">
                          <span>{trial.code === 'study' ? '学习会员' : trial.code === 'agent' ? 'Agent 会员' : 'Agent PLUS'}</span>
                          <span className="membership-trial-expire">有效期至 {new Date(trial.expireAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="membership-tiers-section">
                <h3>会员套餐</h3>
                
                {['study', 'agent', 'agent_plus'].map((tier, _tierIdx) => {
                  const tierProducts = tier === 'study' ? studyProducts : tier === 'agent' ? agentProducts : agentPlusProducts
                  const tierInfo = getTierInfo(tier)
                  return (
                    <div className={`membership-tier-group ${tier === 'agent' ? 'featured' : ''}`} key={tier}>
                      <div className="membership-tier-group-header">
                        <span className="membership-tier-name">{tierInfo.name}</span>
                        <span className="membership-tier-badge" style={{ background: tierInfo.color }}>{tierInfo.badge}</span>
                      </div>
                      <div className="membership-period-grid">
                        {tierProducts.map((product) => (
                          <div className="membership-period-card" key={product.id}>
                            <div className="membership-period-header">
                              <span className="membership-period-label">{getPeriodLabel(product.period || '')}付</span>
                              {product.originalPrice && (
                                <span className="membership-period-save">省{formatPrice(product.originalPrice - product.price)}</span>
                              )}
                            </div>
                            <div className="membership-period-price">
                              {product.originalPrice && (
                                <span className="original-price">{formatPrice(product.originalPrice)}</span>
                              )}
                              <span className="price">{formatPrice(product.price)}</span>
                            </div>
                            <ul className="membership-period-grants">
                              {product.grants.slice(0, 4).map((grant, idx) => (
                                <li key={idx}>{getGrantLabel(grant.code)}</li>
                              ))}
                              {product.grants.length > 4 && (
                                <li className="more">+{product.grants.length - 4} 更多</li>
                              )}
                            </ul>
                            <button className="membership-period-button" style={{ background: tierInfo.color }} onClick={() => handleSubscribe(product)}>
                              立即订阅
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </section>

              <section className="membership-benefits-section">
                <h3>权益对比</h3>
                <div className="table-responsive">
                <table className="membership-benefits-table data-table">
                  <thead>
                    <tr>
                      <th>权益项目</th>
                      <th>免费</th>
                      <th>学习会员</th>
                      <th>Agent</th>
                      <th>Agent PLUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>AI 额度</td>
                      <td>5次/天</td>
                      <td>50次/月</td>
                      <td>200次/月</td>
                      <td>无限</td>
                    </tr>
                    <tr>
                      <td>主题</td>
                      <td>3款</td>
                      <td>全部</td>
                      <td>全部</td>
                      <td>全部</td>
                    </tr>
                    <tr>
                      <td>云同步</td>
                      <td>❌</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                    </tr>
                    <tr>
                      <td>AI 角色</td>
                      <td>❌</td>
                      <td>❌</td>
                      <td>✅</td>
                      <td>✅</td>
                    </tr>
                    <tr>
                      <td>记忆系统</td>
                      <td>❌</td>
                      <td>❌</td>
                      <td>✅</td>
                      <td>✅</td>
                    </tr>
                    <tr>
                      <td>自我进化</td>
                      <td>❌</td>
                      <td>❌</td>
                      <td>✅</td>
                      <td>✅</td>
                    </tr>
                    <tr>
                      <td>3D角色生成</td>
                      <td>❌</td>
                      <td>❌</td>
                      <td>❌</td>
                      <td>10次/月</td>
                    </tr>
                    <tr>
                      <td>工具调用</td>
                      <td>❌</td>
                      <td>❌</td>
                      <td>❌</td>
                      <td>✅</td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </section>

              <section className="membership-dynamic-benefits-section">
                <h3>您的专属权益</h3>
                <div className="membership-dynamic-benefits">
                  {entitlementService.has(userId, 'study') || hasActiveTrial('study') ? (
                    <div className="membership-dynamic-benefit unlocked">
                      <span className="benefit-icon">✅</span>
                      <div className="benefit-content">
                        <span className="benefit-title">学习会员</span>
                        <span className="benefit-desc">高级主题全解锁 · 云同步 · 50次AI额度/月</span>
                      </div>
                    </div>
                  ) : (
                    <div className="membership-dynamic-benefit locked">
                      <span className="benefit-icon">🔒</span>
                      <div className="benefit-content">
                        <span className="benefit-title">学习会员</span>
                        <span className="benefit-desc">开通后解锁高级主题、云同步、50次AI额度</span>
                      </div>
                    </div>
                  )}
                  {entitlementService.has(userId, 'agent') || hasActiveTrial('agent') ? (
                    <div className="membership-dynamic-benefit unlocked">
                      <span className="benefit-icon">✅</span>
                      <div className="benefit-content">
                        <span className="benefit-title">Agent 会员</span>
                        <span className="benefit-desc">有记忆的AI搭子 · 自我进化 · 角色系统 · 200次AI额度</span>
                      </div>
                    </div>
                  ) : (
                    <div className="membership-dynamic-benefit locked">
                      <span className="benefit-icon">🔒</span>
                      <div className="benefit-content">
                        <span className="benefit-title">Agent 会员</span>
                        <span className="benefit-desc">开通后解锁AI搭子、记忆系统、自我进化</span>
                      </div>
                    </div>
                  )}
                  {entitlementService.has(userId, 'agent_plus') || hasActiveTrial('agent_plus') ? (
                    <div className="membership-dynamic-benefit unlocked">
                      <span className="benefit-icon">✅</span>
                      <div className="benefit-content">
                        <span className="benefit-title">Agent PLUS</span>
                        <span className="benefit-desc">AI 3D角色生成 · 无限AI额度 · 工具调用能力</span>
                      </div>
                    </div>
                  ) : (
                    <div className="membership-dynamic-benefit locked">
                      <span className="benefit-icon">🔒</span>
                      <div className="benefit-content">
                        <span className="benefit-title">Agent PLUS</span>
                        <span className="benefit-desc">开通后解锁AI 3D角色、无限额度、工具调用</span>
                      </div>
                    </div>
                  )}
                  {entitlementService.has(userId, 'avatar_rpm') && (
                    <div className="membership-dynamic-benefit unlocked">
                      <span className="benefit-icon">🎭</span>
                      <div className="benefit-content">
                        <span className="benefit-title">RPM 捏脸</span>
                        <span className="benefit-desc">Ready Player Me 3D角色定制</span>
                      </div>
                    </div>
                  )}
                  {entitlementService.has(userId, 'memory_sync') && (
                    <div className="membership-dynamic-benefit unlocked">
                      <span className="benefit-icon">☁️</span>
                      <div className="benefit-content">
                        <span className="benefit-title">记忆云同步</span>
                        <span className="benefit-desc">多设备同步记忆画像</span>
                      </div>
                    </div>
                  )}
                  {entitlementService.has(userId, 'avatar_ai_gen') && (
                    <div className="membership-dynamic-benefit unlocked">
                      <span className="benefit-icon">🎨</span>
                      <div className="benefit-content">
                        <span className="benefit-title">AI 3D角色生成</span>
                        <span className="benefit-desc">输入描述生成专属3D角色</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="membership-invite-section">
                <h3>邀请好友</h3>
                <p className="membership-invite-desc">邀请好友注册，双方都可获得奖励</p>
                <div className="membership-invite-card">
                  <div className="membership-invite-info">
                    <div className="membership-invite-reward">
                      <span className="reward-icon">🎁</span>
                      <div className="reward-details">
                        <span className="reward-title">邀请奖励</span>
                        <span className="reward-value">成功邀请 1 人，双方各得 <strong>7 天会员</strong></span>
                      </div>
                    </div>
                    <div className="membership-invite-reward">
                      <span className="reward-icon">👥</span>
                      <div className="reward-details">
                        <span className="reward-title">邀请人数</span>
                        <span className="reward-value">已邀请 <strong>{inviteRewards.length}</strong> 人</span>
                      </div>
                    </div>
                  </div>
                  <div className="membership-invite-actions">
                    <button className="membership-invite-copy" onClick={() => {
                      const inviteLink = `${window.location.origin}?invite=${userId}`
                      navigator.clipboard.writeText(inviteLink)
                      addToast({ type: 'info', title: '已复制', message: '邀请链接已复制到剪贴板！' })
                    }}>
                      复制邀请链接
                    </button>
                  </div>
                  {inviteRewards.length > 0 && (
                    <div className="membership-invite-list">
                      <h4>邀请记录</h4>
                      {inviteRewards.map((reward, i) => (
                        <div key={i} className="membership-invite-item">
                          <span className="invitee-name">{reward.inviteeName}</span>
                          <span className={`invite-status ${reward.status}`}>{reward.status === 'active' ? '已激活' : '待激活'}</span>
                          <span className="invite-reward">{reward.rewardDays}天</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="membership-coupon-section">
                <h3>优惠券</h3>
                <p className="membership-coupon-desc">输入优惠券码，享受专属折扣</p>
                <CouponRedeemInput onRedeem={handleRedeemCoupon} />
                {userCoupons.length > 0 && (
                  <div className="membership-coupon-list">
                    <h4>我的优惠券</h4>
                    {userCoupons.filter(c => !c.used).map((coupon, i) => (
                      <div key={i} className="membership-coupon-card">
                        <span className="coupon-discount">{coupon.type === 'percent' ? `${coupon.discount}% 折扣` : `¥${coupon.discount} 减免`}</span>
                        <span className="coupon-code">{coupon.code}</span>
                        <span className="coupon-status">未使用</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="membership-renewal-section">
                <h3>续费优惠</h3>
                <p className="membership-renewal-desc">会员到期前续费，享受专属折扣</p>
                {(() => {
                  const membershipExpireDays = Math.floor(Math.random() * 30) + 1
                  const hasActiveMembership = entitlementService.has(userId, 'study') || entitlementService.has(userId, 'agent') || entitlementService.has(userId, 'agent_plus')
                  if (!hasActiveMembership) {
                    return (
                      <div className="membership-renewal-empty">
                        <span>暂无续费优惠</span>
                        <small>开通会员后可享受续费优惠</small>
                      </div>
                    )
                  }
                  return (
                    <div className="membership-renewal-card">
                      <div className="membership-renewal-info">
                        <div className="renewal-status">
                          {membershipExpireDays <= 7 ? (
                            <span className="renewal-urgent">即将到期 · 还剩 {membershipExpireDays} 天</span>
                          ) : membershipExpireDays <= 14 ? (
                            <span className="renewal-soon">即将到期 · 还剩 {membershipExpireDays} 天</span>
                          ) : (
                            <span className="renewal-normal">会员有效 · 还剩 {membershipExpireDays} 天</span>
                          )}
                        </div>
                        <div className="renewal-discount">
                          <span className="discount-badge">限时优惠</span>
                          <span className="discount-text">续费享 <strong>8折</strong> 优惠</span>
                        </div>
                      </div>
                      <button className="membership-renewal-button" onClick={() => {
                        const renewalProduct = products.find(p => p.period === 'year' && p.id.startsWith('agent'))
                        if (renewalProduct) handleSubscribe(renewalProduct)
                      }}>
                        立即续费
                      </button>
                    </div>
                  )
                })()}
              </section>

              <section className="membership-badge-section">
                <h3>会员等级</h3>
                <div className="membership-badge-display">
                  <div className="membership-badge-card">
                    <div className="badge-icon">
                      {entitlementService.has(userId, 'agent_plus') ? '👑' : entitlementService.has(userId, 'agent') ? '⭐' : entitlementService.has(userId, 'study') ? '🌟' : '🎯'}
                    </div>
                    <div className="badge-info">
                      <span className="badge-level">
                        {entitlementService.has(userId, 'agent_plus') ? 'Agent PLUS' : entitlementService.has(userId, 'agent') ? 'Agent 会员' : entitlementService.has(userId, 'study') ? '学习会员' : '免费用户'}
                      </span>
                      <span className="badge-desc">
                        {entitlementService.has(userId, 'agent_plus') ? '尊享全部功能' : entitlementService.has(userId, 'agent') ? '解锁AI搭子' : entitlementService.has(userId, 'study') ? '基础会员' : '体验基础功能'}
                      </span>
                    </div>
                  </div>
                  <div className="membership-badge-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: entitlementService.has(userId, 'agent_plus') ? '100%' : entitlementService.has(userId, 'agent') ? '66%' : entitlementService.has(userId, 'study') ? '33%' : '10%' }}></div>
                    </div>
                    <div className="progress-labels">
                      <span>免费</span>
                      <span>学习</span>
                      <span>Agent</span>
                      <span>PLUS</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="membership-activity-section">
                <h3>会员专属活动</h3>
                <div className="membership-activity-grid">
                  <div className="membership-activity-card">
                    <span className="activity-tag">限时</span>
                    <span className="activity-title">新用户专享</span>
                    <span className="activity-desc">首月订阅享5折优惠</span>
                    <button className="activity-button">立即参与</button>
                  </div>
                  <div className="membership-activity-card">
                    <span className="activity-tag">热卖</span>
                    <span className="activity-title">年度套餐特惠</span>
                    <span className="activity-desc">年付低至6折起</span>
                    <button className="activity-button">查看详情</button>
                  </div>
                  <div className="membership-activity-card">
                    <span className="activity-tag">新品</span>
                    <span className="activity-title">邀请返利</span>
                    <span className="activity-desc">邀请好友得30天会员</span>
                    <button className="activity-button">邀请好友</button>
                  </div>
                </div>
              </section>

              <section className="membership-service-section">
                <h3>会员客服</h3>
                <div className="membership-service-grid">
                  <button className="membership-service-item">
                    <span className="service-icon">💬</span>
                    <span className="service-label">在线客服</span>
                    <span className="service-desc">工作日 9:00-18:00</span>
                  </button>
                  <button className="membership-service-item">
                    <span className="service-icon">📧</span>
                    <span className="service-label">邮件支持</span>
                    <span className="service-desc">24小时内回复</span>
                  </button>
                  <button className="membership-service-item">
                    <span className="service-icon">📱</span>
                    <span className="service-label">微信客服</span>
                    <span className="service-desc">添加微信咨询</span>
                  </button>
                  <button className="membership-service-item">
                    <span className="service-icon">❓</span>
                    <span className="service-label">常见问题</span>
                    <span className="service-desc">快速解答</span>
                  </button>
                </div>
              </section>

              <section className="membership-orders-section">
                <h3>订单记录</h3>
                {userOrders.length === 0 ? (
                  <p className="membership-orders-empty">暂无订单记录</p>
                ) : (
                  <div className="membership-orders-list">
                    {userOrders.map((order) => (
                      <div 
                        className="membership-order-item" 
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="membership-order-info">
                          <span className="membership-order-product">{getProductName(order.productId)}</span>
                          <span className="membership-order-date">{new Date(order.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                        <div className="membership-order-meta">
                          <span className="membership-order-amount">{formatPrice(order.amount)}</span>
                          <span className="membership-order-channel">{getChannelLabel(order.channel)}</span>
                          <span className="membership-order-status" style={{ color: getStatusColor(order.status) }}>{getStatusLabel(order.status)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      )}

      {isPaymentOpen && selectedProduct && (
        <div className="payment-modal-backdrop" onClick={() => setIsPaymentOpen(false)} role="presentation">
          <section
            aria-modal="true"
            className="payment-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="选择支付方式"
          >
            <header className="payment-modal-header">
              <h3>选择支付方式</h3>
              <button className="payment-modal-close" onClick={() => setIsPaymentOpen(false)} type="button">×</button>
            </header>
            <div className="payment-modal-content">
              <div className="payment-product-summary">
                <span className="payment-product-name">{selectedProduct.name}</span>
                <span className="payment-product-price">{formatPrice(selectedProduct.price)}/{selectedProduct.period}</span>
              </div>
              
              <div className="payment-channels">
                <button className="payment-channel-button" onClick={() => handlePayment('wechat')}>
                  <span className="payment-channel-icon">💬</span>
                  <span>微信支付</span>
                </button>
                <button className="payment-channel-button" onClick={() => handlePayment('alipay')}>
                  <span className="payment-channel-icon">💳</span>
                  <span>支付宝</span>
                </button>
                <button className="payment-channel-button" onClick={() => handlePayment('apple')}>
                  <span className="payment-channel-icon">🍎</span>
                  <span>Apple Pay</span>
                </button>
              </div>
              
              <p className="payment-note">点击上方按钮将跳转到对应支付平台完成付款</p>
            </div>
          </section>
        </div>
      )}

      {isCycleTrackerOpen && (
        <div className="membership-modal-backdrop" onClick={() => setIsCycleTrackerOpen(false)} role="presentation">
          <section
            aria-modal="true"
            className="membership-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="周期追踪"
            style={{ maxWidth: 800 }}
          >
            <header className="membership-modal-hero">
              <div className="membership-modal-hero-text">
                <p className="eyebrow">Cycle Tracker · 周期追踪</p>
                <h2>了解你的身体节奏</h2>
              </div>
              <button className="membership-modal-close" onClick={() => setIsCycleTrackerOpen(false)} type="button" aria-label="关闭周期追踪">
                ×
              </button>
            </header>
            <div className="membership-modal-content">
              <CycleTracker />
            </div>
          </section>
        </div>
      )}

      {isDataBackupOpen && (
        <DataBackupUI onClose={() => setIsDataBackupOpen(false)} />
      )}

      {isApiKeySettingsOpen && (
        <ApiKeySettingsUI onClose={() => setIsApiKeySettingsOpen(false)} />
      )}

      {isSupabaseConfigOpen && (
        <SupabaseConfigUI
          onConfigured={() => {
            setDataSource('supabase')
            setIsSupabaseConfigOpen(false)
            addToast({ type: 'success', title: 'Supabase 已连接', message: '数据源已切换至云端' })
          }}
          onBack={() => setIsSupabaseConfigOpen(false)}
        />
      )}

      {isReportOpen && (
        <AdaptiveModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          title="数据报告"
          subtitle="查看你的成长数据报告"
          ariaLabel="数据报告"
          width={800}
          height={700}
        >
          <ReportUI
            getWorkspaceState={getWorkspaceState}
            getStudyState={getStudyState}
            getHabitState={getHabitState}
            getFinanceState={getFinanceState}
            getReadingState={getReadingState}
            getWellnessState={getWellnessState}
            getJournalState={getJournalState}
          />
        </AdaptiveModal>
      )}

      {isGlobalSearchOpen && (
        <AdaptiveModal
          isOpen={isGlobalSearchOpen}
          onClose={() => setIsGlobalSearchOpen(false)}
          title="全局搜索"
          subtitle="搜索你的所有数据"
          ariaLabel="全局搜索"
          width={700}
          height={600}
        >
          <GlobalSearchUI
            getWorkspaceState={getWorkspaceState}
            getStudyState={getStudyState}
            getHabitState={getHabitState}
            getFinanceState={getFinanceState}
            getReadingState={getReadingState}
            getJournalState={getJournalState}
            getGoalsState={getGoalsState}
            getProjectState={getProjectState}
          />
        </AdaptiveModal>
      )}

      {isQuickNotesOpen && (
        <AdaptiveModal
          isOpen={isQuickNotesOpen}
          onClose={() => setIsQuickNotesOpen(false)}
          title="快速笔记"
          subtitle="随时记录灵感"
          ariaLabel="快速笔记"
          width={600}
          height={600}
        >
          <QuickNotesUI />
        </AdaptiveModal>
      )}

      {isTimeBlockOpen && (
        <AdaptiveModal
          isOpen={isTimeBlockOpen}
          onClose={() => setIsTimeBlockOpen(false)}
          title="时间块"
          subtitle="规划你的时间"
          ariaLabel="时间块"
          width={600}
          height={600}
        >
          <TimeBlockUI />
        </AdaptiveModal>
      )}

      {isFocusStatsOpen && (
        <AdaptiveModal
          isOpen={isFocusStatsOpen}
          onClose={() => setIsFocusStatsOpen(false)}
          title="专注统计"
          subtitle="查看你的专注数据"
          ariaLabel="专注统计"
          width={800}
          height={600}
        >
          <FocusStatsUI getWorkspaceState={getWorkspaceState} />
        </AdaptiveModal>
      )}

      {isFocusHistoryOpen && (
        <AdaptiveModal
          isOpen={isFocusHistoryOpen}
          onClose={() => setIsFocusHistoryOpen(false)}
          title="专注历史"
          subtitle="回顾你的专注历程"
          ariaLabel="专注历史"
          width={800}
          height={600}
        >
          <FocusHistoryUI getWorkspaceState={getWorkspaceState} />
        </AdaptiveModal>
      )}

      {isMigrationOpen && (
        <AdaptiveModal
          isOpen={isMigrationOpen}
          onClose={() => setIsMigrationOpen(false)}
          title="数据迁移"
          subtitle="将本地数据迁移到云端"
          ariaLabel="数据迁移"
          width={600}
          height={500}
        >
          {dataSource !== 'supabase' ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ marginBottom: 16, color: 'var(--muted)' }}>
                数据迁移需要先配置 Supabase 云端数据库连接。
              </p>
              <button
                onClick={() => {
                  setIsMigrationOpen(false)
                  setIsSupabaseConfigOpen(true)
                }}
                style={{
                  padding: '10px 24px',
                  background: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 15
                }}
              >
                前往配置 Supabase
              </button>
            </div>
          ) : (
            <MigrationUI
              userId={userId}
              onComplete={() => {
                setIsMigrationOpen(false)
                addToast({ type: 'success', title: '迁移完成', message: '数据已成功迁移' })
              }}
            />
          )}
        </AdaptiveModal>
      )}

      {isSyncOpen && (
        <SyncUI onClose={() => setIsSyncOpen(false)} />
      )}

      <AdaptiveModal
        isOpen={isKnowledgeGraphOpen}
        onClose={() => setIsKnowledgeGraphOpen(false)}
        title="知识图谱"
        subtitle="可视化你的知识星系"
        ariaLabel="知识图谱"
        width={900}
        height={700}
      >
        <KnowledgeGraphUI onClose={() => setIsKnowledgeGraphOpen(false)} />
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="日程管理"
        subtitle="安排你的时间"
        ariaLabel="日程管理"
        width={800}
        height={600}
      >
        <ScheduleUI onClose={() => setIsScheduleOpen(false)} />
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={isBacklinkOpen}
        onClose={() => setIsBacklinkOpen(false)}
        title="双向链接"
        subtitle="查看笔记之间的关联"
        ariaLabel="双向链接"
        width={800}
        height={600}
      >
        <BacklinkPanel onClose={() => setIsBacklinkOpen(false)} />
      </AdaptiveModal>

      {isFocusModeOpen && (
        <FocusModeUI onClose={() => setIsFocusModeOpen(false)} />
      )}

      <AdaptiveModal
        isOpen={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
        title="模板中心"
        subtitle="管理你的任务模板"
        ariaLabel="模板中心"
        width={800}
        height={600}
      >
        <TemplateUI onClose={() => setIsTemplateOpen(false)} />
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={isReviewSchedulerOpen}
        onClose={() => setIsReviewSchedulerOpen(false)}
        title="复习提醒"
        subtitle="间隔重复，高效记忆"
        ariaLabel="复习提醒"
        width={800}
        height={600}
      >
        <ReviewSchedulerUI userId={userId} onClose={() => setIsReviewSchedulerOpen(false)} dataSource={dataSource} />
      </AdaptiveModal>

      {isAvatarManagerOpen && (
        <div className="membership-modal-backdrop" onClick={() => setIsAvatarManagerOpen(false)} role="presentation">
          <section
            aria-modal="true"
            className="membership-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="我的角色"
            style={{ maxWidth: 900 }}
          >
            <header className="membership-modal-hero">
              <div className="membership-modal-hero-text">
                <p className="eyebrow">Avatar Manager · 我的角色</p>
                <h2>创建你的 3D 角色</h2>
              </div>
              <button className="membership-modal-close" onClick={() => setIsAvatarManagerOpen(false)} type="button" aria-label="关闭角色管理">
                ×
              </button>
            </header>
            <div className="membership-modal-content">
              <AvatarManager
                userId={userId}
                onAvatarSelect={(avatarId) => {
                  setWorkspaceState((prev) => ({
                    ...prev,
                    preferences: { ...prev.preferences, avatarId }
                  }))
                  addToast({ type: 'success', title: '角色已更新', message: `已选择新角色形象。` })
                }}
              />
            </div>
          </section>
        </div>
      )}

      {isRelationshipSpaceOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: relationshipSpaceWallpaper || 'var(--wallpaper-image, var(--background))',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            overflow: 'auto'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--wallpaper-overlay, rgba(0,0,0,0.3))',
              opacity: Number('var(--wallpaper-overlay-opacity, 0.3)') || 0.3
            }}
          />
          <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
            <div style={{
              position: 'absolute',
              top: 24,
              right: 24,
              display: 'flex',
              gap: 12,
              zIndex: 10
            }}>
              <button
                onClick={() => setIsWallpaperPickerOpen(true)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  fontSize: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                aria-label="更换壁纸"
                title="更换壁纸"
              >
                🖼️
              </button>
              <button
                onClick={() => setIsRelationshipSpaceOpen(false)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  fontSize: 28,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                aria-label="关闭关系空间"
              >
                ×
              </button>
            </div>
            <div style={{ padding: '100px 40px 40px', maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ marginBottom: 40 }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0, letterSpacing: '0.5px' }}>RELATIONSHIP SPACE</p>
                <h2 style={{ fontSize: 42, fontWeight: 700, margin: '12px 0 0', color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>与伙伴一起成长</h2>
              </div>
              <RelationshipSpaceProvider>
                {selectedSpaceId ? (
                  <SpaceDetail
                    spaceId={selectedSpaceId}
                    userId={userId}
                    onBack={() => setSelectedSpaceId(null)}
                  />
                ) : isCreatingSpace ? (
                  <CreateSpaceForm
                    userId={userId}
                    onCreated={(spaceId) => {
                      setIsCreatingSpace(false)
                      setSelectedSpaceId(spaceId)
                    }}
                    onCancel={() => setIsCreatingSpace(false)}
                  />
                ) : (
                  <SpaceList
                    userId={userId}
                    onSelectSpace={setSelectedSpaceId}
                    onCreateSpace={() => setIsCreatingSpace(true)}
                  />
                )}
              </RelationshipSpaceProvider>
            </div>
          </div>
        </div>
      )}

      {isMemoryProfileOpen && (
        <div className="membership-modal-backdrop" onClick={() => setIsMemoryProfileOpen(false)} role="presentation">
          <section
            aria-modal="true"
            className="membership-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="记忆画像"
            style={{ maxWidth: 800 }}
          >
            <header className="membership-modal-hero">
              <div className="membership-modal-hero-text">
                <p className="eyebrow">Memory Profile · 记忆画像</p>
                <h2>了解你的独特风格</h2>
              </div>
              <button className="membership-modal-close" onClick={() => setIsMemoryProfileOpen(false)} type="button" aria-label="关闭记忆画像">
                ×
              </button>
            </header>
            <div className="membership-modal-content">
              <MemoryContextPreview
                profile={memoryProfile}
                events={memoryEvents}
                mode="chat"
              />
              <MemoryProfileEditorUI
                profile={memoryProfile}
                onSave={(profile) => {
                  setMemoryProfile(profile)
                  setWorkspaceState(prev => ({ ...prev, memoryProfile: profile }))
                  setIsMemoryProfileOpen(false)
                }}
                onCancel={() => setIsMemoryProfileOpen(false)}
              />
            </div>
          </section>
        </div>
      )}

      {isPersonaSelectorOpen && (
        <div className="membership-modal-backdrop" onClick={() => setIsPersonaSelectorOpen(false)} role="presentation">
          <section
            aria-modal="true"
            className="membership-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="人格切换"
            style={{ maxWidth: 600 }}
          >
            <header className="membership-modal-hero">
              <div className="membership-modal-hero-text">
                <p className="eyebrow">Persona · 人格</p>
                <h2>选择适合你的 AI 伙伴</h2>
              </div>
              <button className="membership-modal-close" onClick={() => setIsPersonaSelectorOpen(false)} type="button" aria-label="关闭人格选择">
                ×
              </button>
            </header>
            <div className="membership-modal-content">
              <PersonaSelectorUI
                userId={userId}
                currentPersonaId={currentPersonaId}
                onSelect={(personaId) => {
                  setCurrentPersonaId(personaId)
                  setIsPersonaSelectorOpen(false)
                }}
              />
            </div>
          </section>
        </div>
      )}

      {isCustomPersonaEditorOpen && (
        <CustomPersonaEditorUI
          userId={userId}
          onClose={() => setIsCustomPersonaEditorOpen(false)}
          onCreate={(persona) => {
            setCurrentPersonaId(persona.id)
            setIsCustomPersonaEditorOpen(false)
          }}
          entitlementService={entitlementService}
          safetyGate={personaSafetyGate}
          incidentLog={safetyIncidentLog}
          avatarGen={personaAvatarGen}
          customPersonaService={customPersonaService}
        />
      )}

      {isCommunityPersonaOpen && (
        <CommunityPersonaUI
          userId={userId}
          communityService={communityPersonaService}
          onImportPersona={(persona) => {
            setCurrentPersonaId(persona.id)
            setIsCommunityPersonaOpen(false)
          }}
          onClose={() => setIsCommunityPersonaOpen(false)}
        />
      )}

      {isCameoStorefrontOpen && (
        <CameoStorefrontUI
          userId={userId}
          personaProvider={personaProvider}
          entitlementService={entitlementService}
          onClose={() => setIsCameoStorefrontOpen(false)}
          onPurchase={(personaId) => {
            setCurrentPersonaId(personaId)
            setIsCameoStorefrontOpen(false)
          }}
        />
      )}

      {pendingEntry && (
        <EvolutionRitualUI
          entry={pendingEntry}
          onAccept={handleEvolutionAccept}
          onReject={handleEvolutionReject}
          onModify={handleEvolutionModify}
          onClose={handleEvolutionClose}
        />
      )}

      {isAdminConsoleOpen && (
        <div className="membership-modal-backdrop" onClick={() => setIsAdminConsoleOpen(false)} role="presentation">
          <section
            aria-modal="true"
            className="membership-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="管理后台"
            style={{ maxWidth: 900 }}
          >
            <header className="membership-modal-hero">
              <div className="membership-modal-hero-text">
                <p className="eyebrow">Admin Console · 管理后台</p>
                <h2>商品配置与权益管理</h2>
              </div>
              <button className="membership-modal-close" onClick={() => setIsAdminConsoleOpen(false)} type="button" aria-label="关闭管理后台">
                ×
              </button>
            </header>
            <div className="membership-modal-content">
              <AdminConsolePage onClose={() => setIsAdminConsoleOpen(false)} />
            </div>
          </section>
        </div>
      )}

      {selectedOrder && (
        <div className="membership-modal-backdrop" onClick={() => setSelectedOrder(null)} role="presentation">
          <section
            aria-modal="true"
            className="membership-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="订单详情"
            style={{ maxWidth: 500 }}
          >
            <header className="membership-modal-hero">
              <div className="membership-modal-hero-text">
                <p className="eyebrow">Order Detail · 订单详情</p>
                <h2>订单 #{selectedOrder.id.slice(0, 12)}...</h2>
              </div>
              <button className="membership-modal-close" onClick={() => setSelectedOrder(null)} type="button">×</button>
            </header>
            <div className="membership-modal-content">
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <strong>订单 ID</strong>
                  <code style={{ display: 'block', marginTop: 4, fontSize: 12 }}>{selectedOrder.id}</code>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <strong>商品</strong>
                    <p style={{ margin: '4px 0 0' }}>{getProductName(selectedOrder.productId)}</p>
                  </div>
                  <div>
                    <strong>支付方式</strong>
                    <p style={{ margin: '4px 0 0' }}>{getChannelLabel(selectedOrder.channel)}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <strong>金额</strong>
                    <p style={{ margin: '4px 0 0', color: '#10b981', fontWeight: 'bold' }}>
                      {formatPrice(selectedOrder.amount)}
                    </p>
                  </div>
                  <div>
                    <strong>状态</strong>
                    <p style={{ margin: '4px 0 0', color: getStatusColor(selectedOrder.status) }}>
                      {getStatusLabel(selectedOrder.status)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <strong>创建时间</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                      {new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div>
                    <strong>支付时间</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                      {selectedOrder.paidAt ? new Date(selectedOrder.paidAt).toLocaleString('zh-CN') : '-'}
                    </p>
                  </div>
                </div>
                {selectedOrder.channelTradeNo && (
                  <div>
                    <strong>渠道订单号</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 12 }}>{selectedOrder.channelTradeNo}</p>
                  </div>
                )}
                {selectedOrder.status === 'paid' && (
                  <button
                    className={styles.purchaseButton}
                    onClick={() => handleRefundOrder(selectedOrder.id)}
                    style={{ background: '#ef4444', marginTop: 8 }}
                  >
                    申请退款
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {isIdentitySelectorOpen && (
        <div className="membership-modal-backdrop" onClick={() => setIsIdentitySelectorOpen(false)} role="presentation">
          <section
            aria-modal="true"
            className="membership-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="身份管理"
            style={{ maxWidth: 600 }}
          >
            <header className="membership-modal-hero">
              <div className="membership-modal-hero-text">
                <p className="eyebrow">Identity · 身份管理</p>
                <h2>身份管理</h2>
              </div>
              <button className="membership-modal-close" aria-label="关闭身份管理" onClick={() => setIsIdentitySelectorOpen(false)} type="button">×</button>
            </header>
            <div className="membership-modal-content">
              <IdentitySelector />
            </div>
          </section>
        </div>
      )}

      {moduleStoreState.isStoreOpen && (
        <ModuleStoreUI
          onAddModule={addCanvasModule}
          onClose={() => setModuleStoreState((current) => ({ ...current, isStoreOpen: false }))}
          onCreateCustomModule={createCustomCanvasModule}
          onRemoveModule={removeCanvasModule}
          state={moduleStoreState}
        />
      )}

      {isAIRecommendationOpen && (
        <AIRecommendationUI
          identityDescription={`${activePersona.name}：${activePersona.targetUser}`}
          modules={recommendedModules}
          onApply={applyRecommendedModules}
          onClose={() => setIsAIRecommendationOpen(false)}
        />
      )}

      {isLayoutShareOpen && (
        <LayoutShareUI
          exportedLayout={exportedModuleLayout}
          onClose={() => setIsLayoutShareOpen(false)}
          onImport={importLayout}
        />
      )}

      {isAgentChatOpen && (
        <AgentChatUI
          isOpen={isAgentChatOpen}
          onClose={() => setIsAgentChatOpen(false)}
          personaId={activePersona?.id}
          aiRole={activePersona?.aiRole}
          profile={memoryProfile}
          memoryEvents={memoryEvents}
          memoryObserver={memoryObserver}
          healthMonitor={relationshipHealthMonitor}
          onConversationComplete={handleConversationComplete}
        />
      )}
      {!isAgentChatOpen && (
        <AgentChatToggle onClick={() => setIsAgentChatOpen(true)} />
      )}

      <SilentSuggestionUI suggestions={silentSuggestions} />
    </main>
    </IdentityProvider>
    </PlatformContext.Provider>
  )
}
