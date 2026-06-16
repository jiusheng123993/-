import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createBrowserWorkspaceStore,
  createInitialWorkspaceState,
  type WorkspaceState
} from './data/workspaceStore'
import type { PersonaId } from './personas/personaRegistry'
import { PersonaSwitcher } from './personas/PersonaSwitcher'
import { buildTriggerContextFromMemoryObserver } from './personas/cameoTriggerEngine'
import { PRESET_PERSONAS } from './personas/personaScheduler'
import { CustomPersonaEditorModal } from './components/persona/CustomPersonaEditorModal'
import { CommunityPersonaModal } from './components/persona/CommunityPersonaModal'
import { CameoStorefrontModal } from './components/persona/CameoStorefrontModal'
import { IdentityProvider } from './identity/IdentityProvider'
import { Sidebar } from './sidebar/Sidebar'
import { SidebarToggle } from './sidebar/SidebarToggle'
import { AdaptiveSidebar } from './platforms'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './auth/LoginPage'
import { RegisterPage } from './auth/RegisterPage'
import { RelationshipSpaceModal } from './components/relationship/RelationshipSpaceModal'
import { createBrowserMemoryStore } from './memory/memoryStore'
import { createMemoryObserver } from './memory/memoryObserver'
import { withWorkspaceMemoryObserver } from './memory/workspaceMemoryMiddleware'
import type { MemoryEvent, MemoryScope } from './memory/memoryTypes'
import { EvolutionRitualUI } from './agent/evolution/EvolutionRitualUI'
import { useEvolutionRitual } from './agent/evolution/useEvolutionRitual'
import { AgentChatUI, AgentChatToggle } from './agent/AgentChatUI'
import { SilentSuggestionUI, useSilentSuggestions } from './agent/SilentSuggestionUI'
import { useToast } from './components/toast/Toast'
import { useApiKeyStatus } from './hooks/useApiKeyStatus'
import { SidebarPanel } from './sidebar-panel'
import { PlatformContext, getPlatformInfo } from './platforms'
import { AIRecommendationUI } from './module-store/AIRecommendationUI'
import { LayoutShareUI } from './module-store/LayoutShareUI'
import { ModuleStoreUI } from './module-store/ModuleStoreUI'
import { defaultModules } from './module-store/ModuleRegistry'
import {
  addModuleToLayout,
  createInitialModuleStoreState,
  exportModuleLayout,
  importModuleLayout,
  recommendModulesForIdentity
} from './module-store/moduleStoreLogic'
import type { ModuleStoreState } from './module-store/types'
import { DataBackupModal } from './components/data/DataBackupModal'
import { MigrationModal } from './components/data/MigrationModal'
import { ApiKeySettingsModal } from './components/settings/ApiKeySettingsModal'
import { SupabaseConfigModal } from './components/settings/SupabaseConfigModal'
import { SyncModal } from './components/sync/SyncModal'
import { OnboardingUI } from './onboarding/OnboardingUI'
import { BacklinkModal } from './components/backlink/BacklinkModal'
import { FocusModeModal } from './components/focus/FocusModeModal'
import { KnowledgeGraphModal } from './components/knowledge-graph/KnowledgeGraphModal'
import { ScheduleModal } from './components/schedule/ScheduleModal'
import { createScheduleService } from './schedule/scheduleService'
import { TemplateModal } from './components/template/TemplateModal'
import { ReviewSchedulerModal } from './components/review/ReviewSchedulerModal'
import { ReportModal } from './components/report/ReportModal'
import { GlobalSearchModal } from './components/search/GlobalSearchModal'
import { QuickNotesModal } from './components/notes/QuickNotesModal'
import { TimeBlockModal } from './components/time-block/TimeBlockModal'
import { FocusStatsModal } from './components/focus/FocusStatsModal'
import { FocusHistoryModal } from './components/focus/FocusHistoryModal'
import { NotificationBanner } from './notifications/NotificationBanner'
import { seedDevEntitlements } from './data/devEntitlements'
import { ThemePickerModal } from './components/theme/ThemePickerModal'
import { WallpaperPickerModal } from './components/theme/WallpaperPickerModal'
import { CycleTrackerModal } from './components/cycle/CycleTrackerModal'
import { AvatarManagerModal } from './components/avatar/AvatarManagerModal'
import { MemoryProfileModal } from './components/memory/MemoryProfileModal'
import { PersonaSelectorModal } from './components/persona/PersonaSelectorModal'
import { IdentitySelectorModal } from './components/identity/IdentitySelectorModal'
import { AdminConsoleModal } from './components/membership/AdminConsoleModal'
import { ClockDisplay } from './components/common/ClockDisplay'
import { usePanelState } from './hooks/usePanelState'
import { useFocusTimer } from './hooks/useFocusTimer'
import { useThemeManager } from './hooks/useThemeManager'
import { useMembershipFlow } from './hooks/useMembershipFlow'
import { useCanvasModules } from './hooks/useCanvasModules'
import { usePersonaManager } from './hooks/usePersonaManager'
import { useStoreInitialization } from './hooks/useStoreInitialization'
import { useSidebarCallbacks } from './hooks/useSidebarCallbacks'
import { WorkbenchDetailPanel } from './components/workbench/WorkbenchDetailPanel'
import { WorkbenchCanvas } from './components/workbench/WorkbenchCanvas'
import { MembershipModal } from './components/membership/MembershipModal'
import { SettingsPanel } from './components/SettingsPanel'
import { PaymentModal } from './components/membership/PaymentModal'
import { OrderDetailModal } from './components/membership/OrderDetailModal'
import {
  entitlementService,
  notificationService,
  cameoEngine,
  personaScheduleStorage,
  personaScheduler,
  safetyIncidentLog,
  personaSafetyGate,
  relationshipHealthMonitor,
  personaAvatarGen,
  communityPersonaService,
  personaProvider,
  customPersonaService
} from './services/instances'

const store = typeof window === 'undefined' ? undefined : createBrowserWorkspaceStore()
const memoryStore = typeof window === 'undefined' ? undefined : createBrowserMemoryStore()
const moduleLayoutStorageKey = 'xinghuanhai-module-layout-state'
const onboardingDataKey = 'xinghuanhai-onboarding-data'

seedDevEntitlements(entitlementService)

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
  
  const persona = usePersonaManager({ workspaceState, setWorkspaceState })
  const {
    activePersona,
    activeTemplate,
    todoTasks,
    completedTasks,
    nextFocusTask,
    activeProvider,
    promptDraft,
    weeklyProgress,
    switchPersona
  } = persona
  const platformInfo = useMemo(() => getPlatformInfo(), [])
  const panel = usePanelState(loadInitialModuleStoreState(), workspaceState.memoryProfile)
  const {
    isThemePickerOpen, setIsThemePickerOpen,
    isWallpaperPickerOpen, setIsWallpaperPickerOpen,
    isIdentitySelectorOpen, setIsIdentitySelectorOpen,
    moduleStoreState, setModuleStoreState,
    isAIRecommendationOpen, setIsAIRecommendationOpen,
    isLayoutShareOpen, setIsLayoutShareOpen,
    layoutImportError, setLayoutImportError,
    openWorkbenchDetail, setOpenWorkbenchDetail,
    sidebarOpen, setSidebarOpen,
    themeSearchQuery, setThemeSearchQuery,
    activeThemeFamily, setActiveThemeFamily,
    isLoginOpen, setIsLoginOpen,
    isRegisterOpen, setIsRegisterOpen,
    isMembershipOpen, setIsMembershipOpen,
    isSettingsOpen, setIsSettingsOpen,
    isPaymentOpen, setIsPaymentOpen,
    selectedProduct, setSelectedProduct,
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
    dataSource, setDataSource,
    isReportOpen, setIsReportOpen,
    isGlobalSearchOpen, setIsGlobalSearchOpen,
    isQuickNotesOpen, setIsQuickNotesOpen,
    isTimeBlockOpen, setIsTimeBlockOpen,
    isFocusStatsOpen, setIsFocusStatsOpen,
    isFocusHistoryOpen, setIsFocusHistoryOpen,
    isMigrationOpen, setIsMigrationOpen,
    currentPersonaId, setCurrentPersonaId,
    memoryProfile, setMemoryProfile,
    selectedSpaceId, setSelectedSpaceId,
    isCreatingSpace, setIsCreatingSpace,
    relationshipSpaceWallpaper, setRelationshipSpaceWallpaper,
    selectedOrder, setSelectedOrder,
    userTrials, setUserTrials,
    userCoupons, setUserCoupons,
    inviteRewards,
    closeAllSidebarPanels
  } = panel
  const checkCameoTriggerRef = useRef<(() => void) | undefined>(undefined)
  const memoryObserverRef = useRef<import('./memory/memoryObserver').MemoryObserver | null>(null)
  const refreshMemoryEventsRef = useRef<(() => void) | undefined>(undefined)
  const focus = useFocusTimer({
    workspaceState,
    nextFocusTask,
    memoryObserver: memoryObserverRef.current,
    refreshMemoryEvents: () => refreshMemoryEventsRef.current?.(),
    checkCameoTriggerRef,
    setWorkspaceState
  })
  const {
    focusPausedRemainingMs,
    isFocusRunning,
    activeFocusTask,
    focusDisplayTask,
    focusTargetMinutes,
    focusSeconds,
    focusMinuteText,
    focusSecondText,
    focusRewardPoints,
    FOCUS_MIN_MINUTES,
    FOCUS_MAX_MINUTES,
    FOCUS_STEP_MINUTES,
    startFocusTimer,
    pauseFocusTimer,
    resetFocusTimer,
    adjustFocusDuration,
    handleFocusDurationInput
  } = focus
  const savedWorkspaceStateRef = useRef<WorkspaceState | null>(null)
  const themeManager = useThemeManager({
    workspaceState,
    setWorkspaceState,
    themeSearchQuery,
    setThemeSearchQuery,
    activeThemeFamily,
    isThemePickerOpen,
    setIsThemePickerOpen,
    isWallpaperPickerOpen,
    setIsWallpaperPickerOpen,
    openWorkbenchDetail,
    setOpenWorkbenchDetail
  })
  const {
    activeTheme,
    themeFamilies,
    filteredThemes,
    openThemePicker,
    closeThemePicker,
    switchTheme,
    restorePersonaTheme
  } = themeManager
  const {
    login,
    register,
    switchRole,
    isLoggingIn,
    loginError,
    userId,
    role
  } = useAuth()
  const membership = useMembershipFlow({
    userId,
    role,
    switchRole,
    addToast,
    selectedProduct,
    setSelectedProduct,
    setIsPaymentOpen,
    setIsMembershipOpen,
    selectedOrder,
    setSelectedOrder,
    userTrials,
    setUserTrials,
    userCoupons,
    setUserCoupons
  })
  const {
    totalQuota,
    currentTier
  } = membership
  const stores = useStoreInitialization({ workspaceState })
  const {
    getWorkspaceState,
    getStudyState,
    getHabitState,
    getJournalState,
    getReadingState,
    getGoalsState,
    getFinanceState,
    getWellnessState,
    getProjectState,
    onboardingCompleted,
    handleOnboardingComplete,
    handleOnboardingSkip
  } = stores

  useEffect(() => {
    localStorage.setItem('user_id', userId)
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
  memoryObserverRef.current = memoryObserver
  const recommendedModules = useMemo(() => recommendModulesForIdentity({
    identityDescription: `${activePersona.name} ${activePersona.targetUser} ${activePersona.painPoint} ${activePersona.primaryFlow}`,
    personaModuleTitles: activePersona.modules.map((module) => module.title)
  }), [activePersona])
  const exportedModuleLayout = useMemo(() => exportModuleLayout(moduleStoreState), [moduleStoreState])
  const refreshMemoryEvents = useCallback(() => {
    if (!memoryStore) return
    setMemoryEvents(memoryStore.listEvents(memoryScope))
  }, [memoryScope])
  refreshMemoryEventsRef.current = refreshMemoryEvents

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

  checkCameoTriggerRef.current = checkCameoTrigger

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
  }, [closeAllSidebarPanels, setIsApiKeySettingsOpen, setIsMembershipOpen])

  const canvasModules = useCanvasModules({
    moduleStoreState,
    setModuleStoreState,
    setIsAIRecommendationOpen,
    setLayoutImportError,
    setIsLayoutShareOpen
  })
  const {
    addCanvasModule,
    removeCanvasModule,
    updateCanvasItems,
    createCustomCanvasModule,
    applyRecommendedModules,
    importLayout,
    moveWorkbenchItem
  } = canvasModules

  const sidebarCallbacks = useSidebarCallbacks({
    closeAllSidebarPanels,
    openThemePicker,
    setModuleStoreState,
    setIsIdentitySelectorOpen,
    setIsPersonaSelectorOpen,
    setIsRelationshipSpaceOpen,
    setIsAgentChatOpen,
    setIsSettingsOpen,
    setIsMembershipOpen,
    setIsDataBackupOpen,
    setIsApiKeySettingsOpen,
    setIsSupabaseConfigOpen,
    setIsMigrationOpen
  })

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
        onOpenModuleStore={sidebarCallbacks.onOpenModuleStore}
        onOpenThemePicker={sidebarCallbacks.onOpenThemePicker}
        onOpenIdentitySelector={sidebarCallbacks.onOpenIdentitySelector}
        onOpenPersonaSelector={sidebarCallbacks.onOpenPersonaSelector}
        onOpenRelationshipSpace={sidebarCallbacks.onOpenRelationshipSpace}
        onOpenAgentChat={sidebarCallbacks.onOpenAgentChat}
        onOpenSettings={sidebarCallbacks.onOpenSettings}
        currentThemeName={activeTheme.name}
        membershipTier={currentTier.label}
        aiQuota={totalQuota}
        streakDays={workspaceState.growth.streakDays}
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

        <WorkbenchCanvas
          moduleStoreState={moduleStoreState}
          activeTheme={activeTheme}
          activePersona={activePersona}
          activeTemplate={activeTemplate}
          promptDraft={promptDraft}
          activeProvider={activeProvider}
          workspaceState={workspaceState}
          todoTasks={todoTasks}
          completedTasks={completedTasks}
          focusMinuteText={focusMinuteText}
          focusSecondText={focusSecondText}
          focusDisplayTask={focusDisplayTask}
          focusRewardPoints={focusRewardPoints}
          focusTargetMinutes={focusTargetMinutes}
          isFocusRunning={isFocusRunning}
          activeFocusTask={activeFocusTask}
          nextFocusTask={nextFocusTask}
          focusPausedRemainingMs={focusPausedRemainingMs}
          weeklyProgress={weeklyProgress}
          memoryProfile={memoryProfile}
          userId={userId}
          FOCUS_MIN_MINUTES={FOCUS_MIN_MINUTES}
          FOCUS_MAX_MINUTES={FOCUS_MAX_MINUTES}
          FOCUS_STEP_MINUTES={FOCUS_STEP_MINUTES}
          layoutImportError={layoutImportError}
          moveWorkbenchItem={moveWorkbenchItem}
          removeCanvasModule={removeCanvasModule}
          updateCanvasItems={updateCanvasItems}
          setOpenWorkbenchDetail={setOpenWorkbenchDetail}
          setIsWallpaperPickerOpen={setIsWallpaperPickerOpen}
          setIsCycleTrackerOpen={setIsCycleTrackerOpen}
          setIsMemoryProfileOpen={setIsMemoryProfileOpen}
          openThemePicker={openThemePicker}
          restorePersonaTheme={restorePersonaTheme}
          startFocusTimer={startFocusTimer}
          pauseFocusTimer={pauseFocusTimer}
          resetFocusTimer={resetFocusTimer}
          adjustFocusDuration={adjustFocusDuration}
          handleFocusDurationInput={handleFocusDurationInput}
          setWorkspaceState={setWorkspaceState}
          addToast={addToast}
        />
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

      <WorkbenchDetailPanel
        detail={openWorkbenchDetail}
        onClose={() => setOpenWorkbenchDetail(null)}
        activeTheme={activeTheme}
        userId={userId}
        activePersona={activePersona}
        workspaceState={workspaceState}
        todoTasks={todoTasks}
        completedTasks={completedTasks}
        focusMinuteText={focusMinuteText}
        focusSecondText={focusSecondText}
        focusDisplayTask={focusDisplayTask ? { id: focusDisplayTask.id, title: focusDisplayTask.title, dueLabel: focusDisplayTask.dueLabel } : null}
        focusRewardPoints={focusRewardPoints}
        weeklyProgress={weeklyProgress}
        memoryProfile={memoryProfile}
        onOpenCycleTracker={() => setIsCycleTrackerOpen(true)}
        onOpenMemoryProfile={() => setIsMemoryProfileOpen(true)}
      />

      {isThemePickerOpen && (
        <ThemePickerModal
          activeTheme={activeTheme}
          themeFamilies={themeFamilies}
          filteredThemes={filteredThemes}
          themeSearchQuery={themeSearchQuery}
          activeThemeFamily={activeThemeFamily}
          onClose={closeThemePicker}
          onOpenWallpaper={() => { setIsThemePickerOpen(false); setIsWallpaperPickerOpen(true) }}
          onSearchChange={setThemeSearchQuery}
          onFamilyChange={setActiveThemeFamily}
          onSwitchTheme={switchTheme}
        />
      )}

      {isWallpaperPickerOpen && (
        <WallpaperPickerModal
          activeTheme={activeTheme}
          onClose={() => setIsWallpaperPickerOpen(false)}
          onWallpaperSelected={setRelationshipSpaceWallpaper}
        />
      )}

      {isMembershipOpen && (
        <MembershipModal
          flow={membership}
          userId={userId}
          inviteRewards={inviteRewards}
          addToast={addToast}
          onClose={() => setIsMembershipOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsPanel
          onClose={() => setIsSettingsOpen(false)}
          onOpenMembership={() => { setIsSettingsOpen(false); setIsMembershipOpen(true) }}
          onOpenDataBackup={() => { setIsSettingsOpen(false); setIsDataBackupOpen(true) }}
          onOpenApiKeySettings={() => { setIsSettingsOpen(false); setIsApiKeySettingsOpen(true) }}
          onOpenSupabaseConfig={() => { setIsSettingsOpen(false); setIsSupabaseConfigOpen(true) }}
          onOpenMigration={() => { setIsSettingsOpen(false); setIsMigrationOpen(true) }}
        />
      )}

      {isPaymentOpen && selectedProduct && (
        <PaymentModal
          flow={membership}
          onClose={() => setIsPaymentOpen(false)}
        />
      )}

      {isCycleTrackerOpen && (
        <CycleTrackerModal onClose={() => setIsCycleTrackerOpen(false)} />
      )}

      {isDataBackupOpen && (
        <DataBackupModal onClose={() => setIsDataBackupOpen(false)} />
      )}

      {isApiKeySettingsOpen && (
        <ApiKeySettingsModal onClose={() => setIsApiKeySettingsOpen(false)} />
      )}

      {isSupabaseConfigOpen && (
        <SupabaseConfigModal
          onConfigured={() => {
            setDataSource('supabase')
            setIsSupabaseConfigOpen(false)
            addToast({ type: 'success', title: 'Supabase 已连接', message: '数据源已切换至云端' })
          }}
          onBack={() => setIsSupabaseConfigOpen(false)}
        />
      )}

      {isReportOpen && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          getWorkspaceState={getWorkspaceState}
          getStudyState={getStudyState}
          getHabitState={getHabitState}
          getFinanceState={getFinanceState}
          getReadingState={getReadingState}
          getWellnessState={getWellnessState}
          getJournalState={getJournalState}
        />
      )}

      {isGlobalSearchOpen && (
        <GlobalSearchModal
          isOpen={isGlobalSearchOpen}
          onClose={() => setIsGlobalSearchOpen(false)}
          getWorkspaceState={getWorkspaceState}
          getStudyState={getStudyState}
          getHabitState={getHabitState}
          getFinanceState={getFinanceState}
          getReadingState={getReadingState}
          getJournalState={getJournalState}
          getGoalsState={getGoalsState}
          getProjectState={getProjectState}
        />
      )}

      {isQuickNotesOpen && (
        <QuickNotesModal
          isOpen={isQuickNotesOpen}
          onClose={() => setIsQuickNotesOpen(false)}
        />
      )}

      {isTimeBlockOpen && (
        <TimeBlockModal
          isOpen={isTimeBlockOpen}
          onClose={() => setIsTimeBlockOpen(false)}
        />
      )}

      {isFocusStatsOpen && (
        <FocusStatsModal
          isOpen={isFocusStatsOpen}
          onClose={() => setIsFocusStatsOpen(false)}
          getWorkspaceState={getWorkspaceState}
        />
      )}

      {isFocusHistoryOpen && (
        <FocusHistoryModal
          isOpen={isFocusHistoryOpen}
          onClose={() => setIsFocusHistoryOpen(false)}
          getWorkspaceState={getWorkspaceState}
        />
      )}

      {isMigrationOpen && (
        <MigrationModal
          isOpen={isMigrationOpen}
          onClose={() => setIsMigrationOpen(false)}
          dataSource={dataSource}
          userId={userId}
          addToast={addToast}
          onNavigateToSupabase={() => setIsSupabaseConfigOpen(true)}
        />
      )}

      {isSyncOpen && (
        <SyncModal onClose={() => setIsSyncOpen(false)} />
      )}

      <KnowledgeGraphModal
        isOpen={isKnowledgeGraphOpen}
        onClose={() => setIsKnowledgeGraphOpen(false)}
      />

      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
      />

      <BacklinkModal
        isOpen={isBacklinkOpen}
        onClose={() => setIsBacklinkOpen(false)}
      />

      {isFocusModeOpen && (
        <FocusModeModal onClose={() => setIsFocusModeOpen(false)} />
      )}

      <TemplateModal
        isOpen={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
      />

      <ReviewSchedulerModal
        isOpen={isReviewSchedulerOpen}
        onClose={() => setIsReviewSchedulerOpen(false)}
        userId={userId}
        dataSource={dataSource}
      />

      {isAvatarManagerOpen && (
        <AvatarManagerModal
          userId={userId}
          onClose={() => setIsAvatarManagerOpen(false)}
          onAvatarSelect={(avatarId) => {
            setWorkspaceState((prev) => ({
              ...prev,
              preferences: { ...prev.preferences, avatarId }
            }))
            addToast({ type: 'success', title: '角色已更新', message: `已选择新角色形象。` })
          }}
        />
      )}

      {isRelationshipSpaceOpen && (
        <RelationshipSpaceModal
          wallpaper={relationshipSpaceWallpaper}
          userId={userId}
          selectedSpaceId={selectedSpaceId}
          isCreatingSpace={isCreatingSpace}
          onClose={() => setIsRelationshipSpaceOpen(false)}
          onOpenWallpaper={() => setIsWallpaperPickerOpen(true)}
          onSelectSpace={setSelectedSpaceId}
          onCreateSpace={() => setIsCreatingSpace(true)}
          onCancelCreate={() => setIsCreatingSpace(false)}
          onSpaceCreated={(spaceId) => setSelectedSpaceId(spaceId)}
          onBack={() => setSelectedSpaceId(null)}
        />
      )}

      {isMemoryProfileOpen && (
        <MemoryProfileModal
          profile={memoryProfile}
          events={memoryEvents}
          onClose={() => setIsMemoryProfileOpen(false)}
          onSave={(profile) => {
            setMemoryProfile(profile)
            setWorkspaceState(prev => ({ ...prev, memoryProfile: profile }))
          }}
        />
      )}

      {isPersonaSelectorOpen && (
        <PersonaSelectorModal
          userId={userId}
          currentPersonaId={currentPersonaId}
          onClose={() => setIsPersonaSelectorOpen(false)}
          onSelect={(personaId) => {
            setCurrentPersonaId(personaId)
          }}
        />
      )}

      {isCustomPersonaEditorOpen && (
        <CustomPersonaEditorModal
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
        <CommunityPersonaModal
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
        <CameoStorefrontModal
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
        <AdminConsoleModal onClose={() => setIsAdminConsoleOpen(false)} />
      )}

      {selectedOrder && (
        <OrderDetailModal
          flow={membership}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {isIdentitySelectorOpen && (
        <IdentitySelectorModal onClose={() => setIsIdentitySelectorOpen(false)} />
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
