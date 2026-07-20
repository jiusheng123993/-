import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import {
  createBrowserWorkspaceStore,
  createInitialWorkspaceState,
  type WorkspaceState
} from './shared/data/workspaceStore'
import type { PersonaId } from './ai-partner/personas/personaRegistry'
import { PersonaSwitcher } from './ai-partner/personas/PersonaSwitcher'
import { buildTriggerContextFromMemoryObserver } from './ai-partner/personas/cameoTriggerEngine'
import { PRESET_PERSONAS } from './ai-partner/personas/personaScheduler'
import { IdentityProvider } from './shared/identity/IdentityProvider'
import { Sidebar } from './shared/sidebar/Sidebar'
import { SidebarToggle } from './shared/sidebar/SidebarToggle'
import { AdaptiveSidebar } from './shared/platforms'
import { useAuth } from './shared/hooks/useAuth'
import { LoginPage } from './shared/auth/LoginPage'
import { RegisterPage } from './shared/auth/RegisterPage'
import { createBrowserMemoryStore } from './ai-partner/memory/memoryStore'
import { createBrowserMemoryBodyStore } from './ai-partner/memory-body/store/browserMemoryBodyStore'

import type { MemoryAtom, MemoryEntity, MemoryRelation } from './ai-partner/memory-body/core/memoryBodyTypes'
import { createMemoryObserver } from './ai-partner/memory/memoryObserver'
import { withWorkspaceMemoryObserver } from './ai-partner/memory/workspaceMemoryMiddleware'
import type { MemoryEvent, MemoryScope } from './ai-partner/memory/memoryTypes'
import { useToast } from './shared/components/toast/Toast'
import { useApiKeyStatus } from './shared/hooks/useApiKeyStatus'
import { SidebarPanel } from './shared/sidebar-panel'
import { PlatformContext, getPlatformInfo } from './shared/platforms'
import { defaultModules } from './shared/module-store/ModuleRegistry'
import {
  addModuleToLayout,
  createInitialModuleStoreState,
  exportModuleLayout,
  importModuleLayout,
  recommendModulesForIdentity
} from './shared/module-store/moduleStoreLogic'
import type { ModuleStoreState } from './shared/module-store/types'
import { OnboardingUI } from './shared/onboarding/OnboardingUI'
// scheduleService was removed - using empty stub
const createScheduleService = () => ({ getDueReminders: () => [] })
import { NotificationBanner } from './shared/notifications/NotificationBanner'
import { seedDevEntitlements } from './shared/data/devEntitlements'
import { ClockDisplay } from './shared/components/common/ClockDisplay'
import { usePanelState } from './shared/hooks/usePanelState'
import { useFocusTimer } from './shared/hooks/useFocusTimer'
import { useThemeManager } from './shared/hooks/useThemeManager'
import { useMembershipFlow } from './shared/hooks/useMembershipFlow'
import { useCanvasModules } from './shared/hooks/useCanvasModules'
import { usePersonaManager } from './shared/hooks/usePersonaManager'
import { useStoreInitialization } from './shared/hooks/useStoreInitialization'
import { useSidebarCallbacks } from './shared/hooks/useSidebarCallbacks'
import { useEvolutionRitual } from './ai-partner/agent/evolution/useEvolutionRitual'
import { useSilentSuggestions } from './ai-partner/agent/useSilentSuggestions'
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
} from './shared/services/instances'

const EvolutionRitualUI = lazy(() => import('./ai-partner/agent/evolution/EvolutionRitualUI').then(m => ({ default: m.EvolutionRitualUI })))
const AgentChatUI = lazy(() => import('./ai-partner/agent/AgentChatUI').then(m => ({ default: m.AgentChatUI })))
const AgentChatToggle = lazy(() => import('./ai-partner/agent/AgentChatUI').then(m => ({ default: m.AgentChatToggle })))
const SilentSuggestionUI = lazy(() => import('./ai-partner/agent/SilentSuggestionUI').then(m => ({ default: m.SilentSuggestionUI })))
const WorkbenchDetailPanel = lazy(() => import('./shared/components/workbench/WorkbenchDetailPanel').then(m => ({ default: m.WorkbenchDetailPanel })))
const WorkbenchCanvas = lazy(() => import('./shared/components/workbench/WorkbenchCanvas').then(m => ({ default: m.WorkbenchCanvas })))
const MembershipModal = lazy(() => import('./shared/components/membership/MembershipModal').then(m => ({ default: m.MembershipModal })))
const SettingsPanel = lazy(() => import('./shared/components/SettingsPanel').then(m => ({ default: m.SettingsPanel })))
const PaymentModal = lazy(() => import('./shared/components/membership/PaymentModal').then(m => ({ default: m.PaymentModal })))
const OrderDetailModal = lazy(() => import('./shared/components/membership/OrderDetailModal').then(m => ({ default: m.OrderDetailModal })))
const RelationshipSpaceModal = lazy(() => import('./shared/components/relationship/RelationshipSpaceModal').then(m => ({ default: m.RelationshipSpaceModal })))
const ThemePickerModal = lazy(() => import('./shared/components/theme/ThemePickerModal').then(m => ({ default: m.ThemePickerModal })))
const WallpaperPickerModal = lazy(() => import('./shared/components/theme/WallpaperPickerModal').then(m => ({ default: m.WallpaperPickerModal })))
const PersonaSelectorModal = lazy(() => import('./shared/components/persona/PersonaSelectorModal').then(m => ({ default: m.PersonaSelectorModal })))
const IdentitySelectorModal = lazy(() => import('./shared/components/identity/IdentitySelectorModal').then(m => ({ default: m.IdentitySelectorModal })))
const MemoryStarMapModal = lazy(() => import('./shared/components/memory-star-map/MemoryStarMapModal').then(m => ({ default: m.MemoryStarMapModal })))
const MemoryProfileModal = lazy(() => import('./shared/components/memory/MemoryProfileModal').then(m => ({ default: m.MemoryProfileModal })))

const store = typeof window === 'undefined' ? undefined : createBrowserWorkspaceStore()
const memoryStore = typeof window === 'undefined' ? undefined : createBrowserMemoryStore()
const memoryBodyStore = typeof window === 'undefined' ? undefined : createBrowserMemoryBodyStore('default', 'growth-workbench')
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
    isRelationshipSpaceOpen, setIsRelationshipSpaceOpen,
    isAgentChatOpen, setIsAgentChatOpen,
    isMemoryProfileOpen, setIsMemoryProfileOpen,
    isPersonaSelectorOpen, setIsPersonaSelectorOpen,
    isMemoryStarMapOpen, setIsMemoryStarMapOpen,
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
  const memoryAtoms = useMemo<MemoryAtom[]>(() => {
    if (!memoryBodyStore) return []
    return memoryBodyStore.listActiveAtoms(memoryScope)
  }, [memoryScope])
  const memoryEntities = useMemo<MemoryEntity[]>(() => {
    if (!memoryBodyStore) return []
    return memoryBodyStore.load().entities
  }, [])
  const memoryRelations = useMemo<MemoryRelation[]>(() => {
    if (!memoryBodyStore) return []
    return memoryBodyStore.load().relations
  }, [])
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
        setIsSettingsOpen(true)
      }
    }

    window.addEventListener('navigate', handleNavigate)
    return () => window.removeEventListener('navigate', handleNavigate)
  }, [closeAllSidebarPanels, setIsSettingsOpen, setIsMembershipOpen])

  const canvasModules = useCanvasModules({
    moduleStoreState,
    setModuleStoreState,
    setLayoutImportError
  })
  const {
    addCanvasModule,
    removeCanvasModule,
    updateCanvasItems,
    createCustomCanvasModule,
    moveWorkbenchItem
  } = canvasModules

  const sidebarCallbacks = useSidebarCallbacks({
    closeAllSidebarPanels,
    openThemePicker,
    setModuleStoreState
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
        onOpenMemoryStarMap={sidebarCallbacks.onOpenMemoryStarMap}
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

        <Suspense fallback={null}>
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
        </Suspense>
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
      />
      </div>

      <Suspense fallback={null}>
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
          onOpenMemoryProfile={() => setIsMemoryProfileOpen(true)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ThemePickerModal
          isOpen={isThemePickerOpen}
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
      </Suspense>

      <Suspense fallback={null}>
        <WallpaperPickerModal
          isOpen={isWallpaperPickerOpen}
          activeTheme={activeTheme}
          onClose={() => setIsWallpaperPickerOpen(false)}
          onWallpaperSelected={setRelationshipSpaceWallpaper}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MembershipModal
          isOpen={isMembershipOpen}
          flow={membership}
          userId={userId}
          inviteRewards={inviteRewards}
          addToast={addToast}
          onClose={() => setIsMembershipOpen(false)}
        />
      </Suspense>

      {isSettingsOpen && (
        <Suspense fallback={null}>
          <SettingsPanel
            onClose={() => setIsSettingsOpen(false)}
            onOpenMembership={() => { setIsSettingsOpen(false); setIsMembershipOpen(true) }}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <PaymentModal
          isOpen={isPaymentOpen && !!selectedProduct}
          flow={membership}
          onClose={() => setIsPaymentOpen(false)}
        />
      </Suspense>


      <Suspense fallback={null}>
        <MemoryStarMapModal
          isOpen={isMemoryStarMapOpen}
          onClose={() => setIsMemoryStarMapOpen(false)}
          atoms={memoryAtoms}
          entities={memoryEntities}
          relations={memoryRelations}
          scope={memoryScope}
        />
      </Suspense>



      {isRelationshipSpaceOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      <Suspense fallback={null}>
        <MemoryProfileModal
          isOpen={isMemoryProfileOpen}
          profile={memoryProfile}
          events={memoryEvents}
          onClose={() => setIsMemoryProfileOpen(false)}
          onSave={(profile) => {
            setMemoryProfile(profile)
            setWorkspaceState(prev => ({ ...prev, memoryProfile: profile }))
          }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <PersonaSelectorModal
          isOpen={isPersonaSelectorOpen}
          userId={userId}
          currentPersonaId={currentPersonaId}
          onClose={() => setIsPersonaSelectorOpen(false)}
          onSelect={(personaId) => {
            setCurrentPersonaId(personaId)
          }}
        />
      </Suspense>


      {pendingEntry && (
        <Suspense fallback={null}>
          <EvolutionRitualUI
            entry={pendingEntry}
            onAccept={handleEvolutionAccept}
            onReject={handleEvolutionReject}
            onModify={handleEvolutionModify}
            onClose={handleEvolutionClose}
          />
        </Suspense>
      )}


      {selectedOrder && (
        <Suspense fallback={null}>
          <OrderDetailModal
            flow={membership}
            onClose={() => setSelectedOrder(null)}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <IdentitySelectorModal isOpen={isIdentitySelectorOpen} onClose={() => setIsIdentitySelectorOpen(false)} />
      </Suspense>


      {isAgentChatOpen && (
        <Suspense fallback={null}>
          <AgentChatUI
            isOpen={isAgentChatOpen}
            onClose={() => setIsAgentChatOpen(false)}
            personaId={activePersona?.id}
            aiRole={activePersona?.aiRole}
            userId={userId}
            profile={memoryProfile}
            memoryEvents={memoryEvents}
            memoryObserver={memoryObserver}
            healthMonitor={relationshipHealthMonitor}
            safetyGate={personaSafetyGate}
            onConversationComplete={handleConversationComplete}
          />
        </Suspense>
      )}
      {!isAgentChatOpen && (
        <Suspense fallback={null}>
          <AgentChatToggle onClick={() => setIsAgentChatOpen(true)} />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <SilentSuggestionUI suggestions={silentSuggestions} />
      </Suspense>
    </main>
    </IdentityProvider>
    </PlatformContext.Provider>
  )
}
