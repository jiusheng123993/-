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
import { IdentityProvider } from './identity/IdentityProvider'
import { IdentitySelector } from './identity/IdentitySelector'
import { Sidebar } from './sidebar/Sidebar'
import { SidebarToggle } from './sidebar/SidebarToggle'
import { getPersonaTemplateById } from './personas/personaTemplates'
import { getDefaultMiniProgramModules, miniProgramBlueprint } from './platforms/miniProgramBlueprint'
import {
  getThemeById,
  materialLabels,
  themeFamilyMeta,
  themeRegistry,
  type StudyTheme,
  type ThemeFamilyId,
  type ThemeId
} from './themes/themeRegistry'
import { getFocusBriefStyleById } from './components/focusBrief/focusBriefRegistry'
import type { FocusBriefStyleId } from './components/focusBrief/types'
import { FocusBriefStylePicker } from './components/focusBrief/FocusBriefStylePicker'
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
import { AdminConsolePage } from './components/membership/AdminConsolePage'
import { createRoleSession, loadDevAuthSession, saveDevAuthSession, type DevAuthSession } from './auth/devAuthSession'
import { SpaceList, SpaceDetail, RelationshipSpaceProvider } from './relationship'
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
import { DraggableModal } from './canvas/DraggableModal'
import { getDailyQuote } from './quotes/dailyQuote'
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
import type { CanvasItem, ModuleSize, ModuleStoreState } from './module-store/types'
import { CycleTracker } from './cycle'
import { AvatarManager } from './avatar'
import { BadgeDisplay } from './badges/BadgeDisplay'
import { HabitTracker } from './habits/HabitTrackerUI'
import { JournalUI } from './journal/JournalUI'
import { GoalTrackerUI } from './goals/GoalTrackerUI'
import { StudyDashboardUI } from './study/StudyDashboardUI'
import { createStudyService } from './study/studyService'
import { CreatorWorkbenchUI } from './creator/CreatorWorkbenchUI'
import { FinanceUI } from './finance/FinanceUI'
import { createFinanceService } from './finance/financeService'
import { ReadingUI } from './reading/ReadingUI'
import { createReadingService } from './reading/readingService'
import { ProjectUI } from './project/ProjectUI'
import { createProjectService } from './project/projectService'
import { WellnessUI } from './wellness/WellnessUI'
import { createWellnessService } from './wellness/wellnessService'
import { QuickNotesUI } from './quicknotes/QuickNotesUI'
import { createQuickNotesService } from './quicknotes/quickNotesService'
import { ReportUI } from './report/ReportUI'
import { GlobalSearchUI } from './globalsearch/GlobalSearchUI'
import { MoodUI } from './mood/MoodUI'
import { createMoodService } from './mood/moodService'
import { TimeBlockUI } from './timeblock/TimeBlockUI'
import { createTimeBlockService } from './timeblock/timeBlockService'
import { FocusStatsUI } from './focusstats/FocusStatsUI'
import { FocusHistoryUI } from './focushistory/FocusHistoryUI'
import { QuoteUI } from './quotes/QuoteUI'
import { EnglishUI } from './english/EnglishUI'
import { WatchListUI } from './watchlist/WatchListUI'
import { TemplateUI } from './templates/TemplateUI'
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

const entitlementService = createEntitlementService()
const aiQuotaProvider = createAiQuotaProvider(entitlementService)
const orderService = createOrderService()

const defaultMiniProgramModules = getDefaultMiniProgramModules()

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
  'mini-program-preview',
  'theme-center',
  'statistics',
  'cycle-today',
  'memory-profile',
  'badge-display',
  'habit-tracker',
  'journal',
  'goal-tracker',
  'study-dashboard',
  'creator-workbench',
  'finance-tracker',
  'reading-list',
  'project-manager',
  'wellness-life',
  'quick-notes',
  'report-center',
  'global-search',
  'mood-tracker',
  'time-block',
  'focus-stats',
  'focus-history',
  'quote-collection',
  'english-learning',
  'watch-list',
  'template-center'
]

const createDefaultWorkbenchState = () =>
  defaultWorkbenchModuleIds.reduce(
    (state, moduleId) => addModuleToLayout(state, moduleId),
    createInitialModuleStoreState(defaultModules)
  )

const loadInitialModuleStoreState = (): ModuleStoreState => {
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
  const totalFocusMinutes = todoTasks.reduce((total, task) => total + task.minutes, 0)
  const nextFocusTask = todoTasks[0]
  const activeProvider = getAiProviderById(workspaceState.integrations.ai.providerId)
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
  const [growthRewardClaimed, setGrowthRewardClaimed] = useState(false)
  const [aiCoachDraft, setAiCoachDraft] = useState<string | null>(null)
  const [miniProgramPreviewMode, setMiniProgramPreviewMode] = useState<'home' | 'modules'>('home')
  const focusIntervalRef = useRef<number | null>(null)
  const savedWorkspaceStateRef = useRef<WorkspaceState | null>(null)
  const isFocusRunning = focusEndsAt !== null
  const candidateFocusTask = focusTaskId
    ? workspaceState.tasks.find((task) => task.id === focusTaskId) ?? null
    : null
  const activeFocusTask =
    candidateFocusTask && candidateFocusTask.status === 'todo' ? candidateFocusTask : null
  const normalizedThemeSearch = themeSearchQuery.trim().toLowerCase()
  const [authSession, setAuthSession] = useState<DevAuthSession>(() => loadDevAuthSession())
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
  const [currentPersonaId, setCurrentPersonaId] = useState<string | undefined>(undefined)
  const [memoryProfile, setMemoryProfile] = useState<MemoryProfile>(() => workspaceState.memoryProfile)
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [userTrials, setUserTrials] = useState<{code: string; expireAt: string; used: boolean}[]>([])
  const [userCoupons, setUserCoupons] = useState<{code: string; type: string; discount: number; used: boolean}[]>([])
  const [inviteRewards] = useState<{inviteeName: string; rewardDays: number; status: string}[]>([])
  const { pendingEntry, handleEvolutionAccept, handleEvolutionReject } = useEvolutionRitual(authSession?.userId ?? 'anonymous', memoryEvents, memoryProfile)
  
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
    saveDevAuthSession(authSession)
    localStorage.setItem('user_id', authSession.userId)
  }, [authSession])

  const userId = authSession.userId
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

  const { 
    pendingEntry, 
    handleAccept: handleEvolutionAccept,
    handleReject: handleEvolutionReject,
    handleModify: handleEvolutionModify,
    handleClose: handleEvolutionClose
  } = useEvolutionRitual(authSession?.userId, memoryEvents, memoryProfile)

  const { suggestions: silentSuggestions } = useSilentSuggestions(memoryProfile, memoryEvents)
  
  const switchDevAuthRole = () => {
    setAuthSession((current) => createRoleSession(current.role === 'admin' ? 'user' : 'admin'))
  }
  
  const handleSubscribe = (product: Product) => {
    setSelectedProduct(product)
    setIsPaymentOpen(true)
  }
  
  const handlePayment = async (channel: 'wechat' | 'alipay' | 'apple') => {
    if (!selectedProduct) return
    
    const order = orderService.createOrder({
      userId: authSession.userId,
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
    return orderService.getOrdersByUser(authSession.userId).slice(0, 5)
  }, [authSession.userId])
  
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
  }, [focusEndsAt, remainingMsFromEnds, focusTaskId, memoryObserver, refreshMemoryEvents])

  const closeAllSidebarPanels = () => {
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
      setIsAgentChatOpen(false)
      setIsMemoryProfileOpen(false)
      setIsCycleTrackerOpen(false)
      setIsAvatarManagerOpen(false)
      setIsPersonaSelectorOpen(false)
      setModuleStoreState((current) => ({ ...current, isStoreOpen: false }))
    })
  }

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

  const focusBriefStyleId: FocusBriefStyleId =
    workspaceState.preferences.focusBriefStyle ?? 'minimal-arc'
  const FocusBriefStyleComponent = getFocusBriefStyleById(focusBriefStyleId).Component
  const switchFocusBriefStyle = (nextStyleId: FocusBriefStyleId) => {
    setWorkspaceState((current) => ({
      ...current,
      preferences: { ...current.preferences, focusBriefStyle: nextStyleId }
    }))
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

  const completeTaskFromWorkbench = (taskId: string) => {
    setWorkspaceState((state) => {
      const target = state.tasks.find((task) => task.id === taskId)
      if (!target || target.status === 'done') return state

      memoryObserver?.onTaskCompleted(target)
      refreshMemoryEvents()

      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, status: 'done', dueLabel: '已完成' } : task
        ),
        growth: {
          ...state.growth,
          experience: state.growth.experience + target.rewardPoints,
          achievements: state.growth.achievements + 1
        }
      }
    })
  }

  const forgetFocusSession = (sessionId: string) => {
    setWorkspaceState((state) => ({
      ...state,
      focusSessions: state.focusSessions.filter((session) => session.id !== sessionId)
    }))
  }

  const claimGrowthReward = () => {
    if (growthRewardClaimed) return
    setWorkspaceState((state) => ({
      ...state,
      growth: {
        ...state.growth,
        experience: state.growth.experience + 20,
        streakDays: state.growth.streakDays + 1
      }
    }))
    setGrowthRewardClaimed(true)
  }

  const generateAiCoachDraft = () => {
    const targetTask = nextFocusTask ?? visibleTasks[0]
    setAiCoachDraft(targetTask
      ? `今日先推进「${targetTask.title}」，用 ${Math.min(25, targetTask.minutes)} 分钟完成第一轮行动，再根据复盘结果拆下一步。`
      : `今日先推进「${activePersona.modules[0]?.title ?? activePersona.mainModuleTitle}」，用一个 25 分钟行动块建立启动感。`
    )
  }

  const markSyncReady = () => {
    setWorkspaceState((state) => state.sync.status === 'sync-ready'
      ? state
      : {
        ...state,
        sync: {
          ...state.sync,
          status: 'sync-ready'
        }
      }
    )
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



  const ClockDisplay = () => {
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

  return (
    <IdentityProvider>
      <SidebarToggle isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(false)}
        onOpenModuleStore={() => {
          closeAllSidebarPanels()
          setModuleStoreState((current) => ({ ...current, isStoreOpen: true }))
        }}
        onOpenAIRecommendation={() => {
          closeAllSidebarPanels()
          setIsAIRecommendationOpen(true)
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
        onOpenRelationshipSpace={() => {
          closeAllSidebarPanels()
          setIsRelationshipSpaceOpen(true)
        }}
        onOpenAgentChat={() => {
          closeAllSidebarPanels()
          setIsAgentChatOpen(true)
        }}
        onSwitchDevAuthRole={switchDevAuthRole}
        devAuthLabel={`${authSession.role === 'admin' ? '管理员' : '用户'} · ${authSession.userId}`}
        currentThemeName={activeTheme.name}
        membershipTier={currentTier.label}
        aiQuota={totalQuota}
        streakDays={workspaceState.growth.streakDays}
      />
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
          </div>
          <div className="hero-quote">
            <span className="hero-quote-text">"{getDailyQuote().content}"</span>
            <span className="hero-quote-author">—— {getDailyQuote().author}</span>
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
                'focus-overview': (
                  <section
                    className="card focus-brief-card"
                    aria-label="桌面专注概览"
                    data-style={focusBriefStyleId}
                    data-aesthetic={activeTheme.aesthetic}
                    data-material={activeTheme.material}
                  >
                    <FocusBriefStyleComponent
                      data={{
                        progress: weeklyProgress,
                        todoCount: todoTasks.length,
                        totalMinutes: totalFocusMinutes,
                        completedCount: completedTasks.length
                      }}
                      context={{
                        aesthetic: activeTheme.aesthetic,
                        material: activeTheme.material
                      }}
                    />
                    <FocusBriefStylePicker currentStyleId={focusBriefStyleId} onStyleChange={switchFocusBriefStyle} />
                    <div className="focus-brief-legacy-meta" aria-hidden="true">
                      <span>{todoTasks.length} 个待办</span>
                      <span>{totalFocusMinutes} 分钟</span>
                      <span>{completedTasks.length} 个已完成</span>
                    </div>
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
                'mini-program-preview': (
                  <section className="panel side-card mini-program-card">
                    <p>{miniProgramBlueprint.positioning}</p>
                    <span className="implementation-pill">微信小程序原生</span>
                    <div className="boundary-grid">
                      <article><span>桌面端</span><strong>{miniProgramBlueprint.desktopBoundary}</strong></article>
                      <article><span>小程序</span><strong>{miniProgramBlueprint.mobileBoundary}</strong></article>
                    </div>
                    <div className="phone-preview" aria-label="小程序首页预览">
                      <div className="phone-preview-top"><strong>今天</strong><span>{getThemeById(miniProgramBlueprint.recommendedThemeId).name}</span></div>
                      <div className="phone-priority"><strong>优先做 3 件事</strong><small>{activePersona.name} · {activePersona.modules[0]?.signal ?? activePersona.mainModuleTitle}</small></div>
                      <div className="phone-module-grid">
                        {defaultMiniProgramModules.slice(0, 4).map((mod) => (
                          <article key={mod.id}><strong>{mod.title}</strong><small>{mod.privacyLevel}</small></article>
                        ))}
                      </div>
                      <div className="phone-tabbar">
                        {miniProgramBlueprint.navigation.map((nav) => (
                          <span key={nav.id}>{nav.label}</span>
                        ))}
                      </div>
                    </div>
                    <small className="sync-note">{miniProgramBlueprint.syncStrategy}</small>
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
                        {memoryProfile.identity.mbti !== 'unknown' ? memoryProfile.identity.mbti : '未设置'}
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
                        学习风格：{memoryProfile.learning.style === 'visual' ? '视觉型' : 
                                  memoryProfile.learning.style === 'auditory' ? '听觉型' : 
                                  memoryProfile.learning.style === 'kinesthetic' ? '动觉型' : '未设置'}
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
                'badge-display': (
                  <section className="panel side-card badge-display-card" role="region" aria-label="成就徽章">
                    <BadgeDisplay
                      progress={{
                        totalFocusSessions: workspaceState.focusSessions.length,
                        streakDays: workspaceState.growth.streakDays,
                        completedTasks: completedTasks.length,
                        usedPersonas: [activePersona.id],
                        themeSwitches: 1,
                        hasMemoryProfile: memoryProfile.identity.mbti !== 'unknown',
                        hasAvatar: false,
                        cycleDaysRecorded: 0,
                        earlyBirdSessions: 0,
                        nightOwlSessions: 0
                      }}
                      compact
                    />
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
                'goal-tracker': (
                  <section className="panel side-card goal-tracker-card" role="region" aria-label="目标管理">
                    <GoalTrackerUI compact />
                  </section>
                ),
                'study-dashboard': (
                  <section className="panel side-card study-dashboard-card" role="region" aria-label="学习仪表盘">
                    <StudyDashboardUI compact />
                  </section>
                ),
                'creator-workbench': (
                  <section className="panel side-card creator-workbench-card" role="region" aria-label="内容创作工作台">
                    <CreatorWorkbenchUI compact />
                  </section>
                ),
                'finance-tracker': (
                  <section className="panel side-card finance-tracker-card" role="region" aria-label="财务管理">
                    <FinanceUI compact />
                  </section>
                ),
                'reading-list': (
                  <section className="panel side-card reading-list-card" role="region" aria-label="阅读清单">
                    <ReadingUI compact />
                  </section>
                ),
                'project-manager': (
                  <section className="panel side-card project-manager-card" role="region" aria-label="项目管理">
                    <ProjectUI compact />
                  </section>
                ),
                'wellness-life': (
                  <section className="panel side-card wellness-life-card" role="region" aria-label="健康生活">
                    <WellnessUI compact />
                  </section>
                ),
                'quick-notes': (
                  <section className="panel side-card quick-notes-card" role="region" aria-label="速记">
                    <QuickNotesUI compact />
                  </section>
                ),
                'report-center': (
                  <section className="panel side-card report-center-card" role="region" aria-label="报告中心">
                    <ReportUI compact />
                  </section>
                ),
                'global-search': (
                  <section className="panel side-card global-search-card" role="region" aria-label="全局搜索">
                    <GlobalSearchUI compact />
                  </section>
                ),
                'mood-tracker': (
                  <section className="panel side-card mood-tracker-card" role="region" aria-label="心情追踪">
                    <MoodUI compact />
                  </section>
                ),
                'time-block': (
                  <section className="panel side-card time-block-card" role="region" aria-label="时间块">
                    <TimeBlockUI compact />
                  </section>
                ),
                'focus-stats': (
                  <section className="panel side-card focus-stats-card" role="region" aria-label="专注统计">
                    <FocusStatsUI compact />
                  </section>
                ),
                'focus-history': (
                  <section className="panel side-card focus-history-card" role="region" aria-label="专注历史">
                    <FocusHistoryUI compact />
                  </section>
                ),
                'quote-collection': (
                  <section className="panel side-card quote-collection-card" role="region" aria-label="语录收藏">
                    <QuoteUI compact />
                  </section>
                ),
                'english-learning': (
                  <section className="panel side-card english-learning-card" role="region" aria-label="英语学习">
                    <EnglishUI compact />
                  </section>
                ),
                'watch-list': (
                  <section className="panel side-card watch-list-card" role="region" aria-label="观影记录">
                    <WatchListUI compact />
                  </section>
                ),
                'template-center': (
                  <section className="panel side-card template-center-card" role="region" aria-label="模板中心">
                    <TemplateUI compact />
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
      />
      </div>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'persona-plan'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title={activePersona.mainModuleTitle}
        subtitle="从画布卡片打开后才渲染完整内容"
        ariaLabel="考试冲刺计划 · 工作台详情"
      >
        <div className="persona-brief">
          <strong>默认行动建议</strong>
          <em>{activeTemplate.defaultAction}</em>
          <small>复盘问题：{activeTemplate.reviewQuestion}</small>
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'mini-program-preview'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="小程序试验版"
        subtitle={`${miniProgramBlueprint.positioning} · ${getThemeById(miniProgramBlueprint.recommendedThemeId).name}`}
        ariaLabel="小程序试验版 · 工作台详情"
        className="mini-program-detail-modal"
      >
        <div className="mini-program-detail-grid">
          <section className="workbench-detail-panel mini-program-phone-panel" aria-label="小程序交互预览">
            <div className="card-heading compact">
              <h3>微信小程序原生</h3>
              <button
                className="mini-program-mode-button"
                onClick={() => setMiniProgramPreviewMode((mode) => mode === 'home' ? 'modules' : 'home')}
                type="button"
              >
                {miniProgramPreviewMode === 'home' ? '切换到模块页' : '切换到首页预览'}
              </button>
            </div>
            <div className="phone-preview large" aria-label="小程序详情预览">
              <div className="phone-preview-top"><strong>{miniProgramPreviewMode === 'home' ? '今天' : '模块'}</strong><span>{getThemeById(miniProgramBlueprint.recommendedThemeId).name}</span></div>
              {miniProgramPreviewMode === 'home' ? (
                <>
                  <div className="phone-priority"><strong>优先做 3 件事</strong><small>{activePersona.name} · {activePersona.modules[0]?.signal ?? activePersona.mainModuleTitle}</small></div>
                  <div className="phone-module-grid">
                    {defaultMiniProgramModules.slice(0, 4).map((mod) => (
                      <article key={mod.id}><strong>{mod.title}</strong><small>{mod.privacyLevel}</small></article>
                    ))}
                  </div>
                </>
              ) : (
                <div className="phone-module-grid detail">
                  {miniProgramBlueprint.modules.map((mod) => (
                    <article key={mod.id}><strong>{mod.title}</strong><small>{mod.description}</small></article>
                  ))}
                </div>
              )}
              <div className="phone-tabbar">
                {miniProgramBlueprint.navigation.map((nav) => (
                  <span key={nav.id}>{nav.label}</span>
                ))}
              </div>
            </div>
          </section>
          <aside className="workbench-detail-panel mini-program-boundary-panel" aria-label="小程序边界说明">
            <h3>边界与同步</h3>
            <div className="boundary-grid">
              <article><span>桌面端</span><strong>{miniProgramBlueprint.desktopBoundary}</strong></article>
              <article><span>小程序</span><strong>{miniProgramBlueprint.mobileBoundary}</strong></article>
            </div>
            <p>{miniProgramBlueprint.syncStrategy}</p>
          </aside>
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'platform-matrix'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="多端预留"
        subtitle={`${workspaceState.sync.mode} · ${workspaceState.sync.status} · ${miniProgramBlueprint.implementationRoute.framework}`}
        ariaLabel="多端预留 · 工作台详情"
        className="platform-matrix-detail-modal"
      >
        <div className="platform-matrix-detail-grid">
          <section className="workbench-detail-panel platform-matrix-route" aria-label="多端实现路线">
            <div className="card-heading compact">
              <h3>实现路线</h3>
              <span className="implementation-pill">{miniProgramBlueprint.implementationRoute.platform}</span>
            </div>
            <p>{miniProgramBlueprint.implementationRoute.reason}</p>
            <div className="platform-stage-list">
              <article><span>Desktop</span><strong>{miniProgramBlueprint.desktopBoundary}</strong></article>
              <article><span>微信小程序</span><strong>{miniProgramBlueprint.mobileBoundary}</strong></article>
              <article><span>Web/PWA</span><strong>复用数据契约与 Provider 接口</strong></article>
              <article><span>iOS</span><strong>保留原生容器与同步适配层</strong></article>
              <article><span>HarmonyOS</span><strong>保留跨端流转与主题一致性</strong></article>
            </div>
          </section>
          <aside className="workbench-detail-panel platform-sync-panel" aria-label="同步预留状态">
            <h3>同步预留状态</h3>
            <div className="metric-grid compact">
              <article><strong>{workspaceState.sync.mode}</strong><span>同步模式</span></article>
              <article><strong>{workspaceState.sync.status}</strong><span>接口状态</span></article>
              <article><strong>{miniProgramBlueprint.modules.length}</strong><span>移动模块</span></article>
            </div>
            <p>{miniProgramBlueprint.syncStrategy}</p>
            <button
              className="platform-sync-button"
              disabled={workspaceState.sync.status === 'sync-ready'}
              onClick={markSyncReady}
              type="button"
            >
              {workspaceState.sync.status === 'sync-ready' ? '同步接口已预留' : '标记同步接口已预留'}
            </button>
          </aside>
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'ai-coach'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title={activePersona.aiRole}
        subtitle={`${activeProvider.name} · ${workspaceState.integrations.ai.status === 'ready' ? '已配置，可生成建议' : '未配置 API Key，使用本地草稿模式'}`}
        ariaLabel={`${activePersona.aiRole} · 工作台详情`}
        className="ai-coach-detail-modal"
      >
        <div className="ai-coach-detail-grid">
          <section className="workbench-detail-panel ai-coach-prompt-panel" aria-label="AI 提示词草稿">
            <div className="card-heading compact">
              <h3>{promptDraft.title}</h3>
              <span className="pill">{activeProvider.name}</span>
            </div>
            <div className="ai-prompt-preview">
              <strong>系统提示</strong>
              <p>{promptDraft.systemPrompt}</p>
              <strong>用户上下文</strong>
              <p>{promptDraft.userPrompt}</p>
            </div>
            <button className="ai-generate-button" onClick={generateAiCoachDraft} type="button">
              生成本地行动草稿
            </button>
          </section>
          <aside className="workbench-detail-panel ai-coach-result-panel" aria-label="AI 行动草稿">
            <h3>{aiCoachDraft ? '本地草稿已生成' : '待生成行动草稿'}</h3>
            <p>{aiCoachDraft ?? '点击生成后，会基于当前身份、待办和 AI Provider 设置生成一条可执行行动建议。'}</p>
            <div className="ai-actions">
              {activePersona.aiActions.map((action) => (
                <span key={action}>{createAiPromptDraft(activeProvider.id, { kind: action, input: activePersona.primaryFlow }).title}</span>
              ))}
            </div>
          </aside>
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'badge-display'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="成就徽章"
        subtitle="完成专注和任务来解锁更多徽章"
        ariaLabel="成就徽章 · 工作台详情"
        className="badge-display-detail-modal"
      >
        <div className="membership-modal-content">
          <BadgeDisplay
            progress={{
              totalFocusSessions: workspaceState.focusSessions.length,
              streakDays: workspaceState.growth.streakDays,
              completedTasks: completedTasks.length,
              usedPersonas: [activePersona.id],
              themeSwitches: 1,
              hasMemoryProfile: memoryProfile.identity.mbti !== 'unknown',
              hasAvatar: false,
              cycleDaysRecorded: 0,
              earlyBirdSessions: 0,
              nightOwlSessions: 0
            }}
          />
        </div>
      </DraggableModal>

      <DraggableModal
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
      </DraggableModal>

      <DraggableModal
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
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'goal-tracker'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="目标管理"
        subtitle="设定目标、追踪关键结果"
        ariaLabel="目标管理 · 工作台详情"
        className="goal-tracker-detail-modal"
      >
        <div className="membership-modal-content">
          <GoalTrackerUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'study-dashboard'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="学习仪表盘"
        subtitle="管理学习目标、任务、笔记和复习计划"
        ariaLabel="学习仪表盘 · 工作台详情"
        className="study-dashboard-detail-modal"
      >
        <div className="membership-modal-content">
          <StudyDashboardUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'creator-workbench'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="内容创作工作台"
        subtitle="灵感收集、内容生产、发布日历和客户交付管理"
        ariaLabel="内容创作工作台 · 工作台详情"
        className="creator-workbench-detail-modal"
      >
        <div className="membership-modal-content">
          <CreatorWorkbenchUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'finance-tracker'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="财务管理"
        subtitle="收入支出追踪、预算管理、财务目标进度"
        ariaLabel="财务管理 · 工作台详情"
        className="finance-tracker-detail-modal"
      >
        <div className="membership-modal-content">
          <FinanceUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'reading-list'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="阅读清单"
        subtitle="书籍管理、阅读进度追踪、读书笔记"
        ariaLabel="阅读清单 · 工作台详情"
        className="reading-list-detail-modal"
      >
        <div className="membership-modal-content">
          <ReadingUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'project-manager'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="项目管理"
        subtitle="项目看板、里程碑、任务分解和进度追踪"
        ariaLabel="项目管理 · 工作台详情"
        className="project-manager-detail-modal"
      >
        <div className="membership-modal-content">
          <ProjectUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'wellness-life'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="健康生活"
        subtitle="饮食记录、饮水追踪、运动管理和健康目标"
        ariaLabel="健康生活 · 工作台详情"
        className="wellness-life-detail-modal"
      >
        <div className="membership-modal-content">
          <WellnessUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'quick-notes'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="速记"
        subtitle="快速捕捉想法、置顶重要笔记、全文搜索"
        ariaLabel="速记 · 工作台详情"
        className="quick-notes-detail-modal"
      >
        <div className="membership-modal-content">
          <QuickNotesUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'report-center'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="报告中心"
        subtitle="周报/月报生成，数据可视化汇总"
        ariaLabel="报告中心 · 工作台详情"
        className="report-center-detail-modal"
      >
        <div className="membership-modal-content">
          <ReportUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'global-search'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="全局搜索"
        subtitle="搜索所有任务、笔记、目标等内容"
        ariaLabel="全局搜索 · 工作台详情"
        className="global-search-detail-modal"
      >
        <div className="membership-modal-content">
          <GlobalSearchUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'mood-tracker'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="心情追踪"
        subtitle="记录每日心情，查看趋势和统计"
        ariaLabel="心情追踪 · 工作台详情"
        className="mood-tracker-detail-modal"
      >
        <div className="membership-modal-content">
          <MoodUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'time-block'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="时间块"
        subtitle="一天时间块规划和管理"
        ariaLabel="时间块 · 工作台详情"
        className="time-block-detail-modal"
      >
        <div className="membership-modal-content">
          <TimeBlockUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'focus-stats'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="专注统计"
        subtitle="专注时长趋势、任务分布、效率分析"
        ariaLabel="专注统计 · 工作台详情"
        className="focus-stats-detail-modal"
      >
        <div className="membership-modal-content">
          <FocusStatsUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'focus-history'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="专注历史"
        subtitle="专注时段热力图、周分布、效率趋势"
        ariaLabel="专注历史 · 工作台详情"
        className="focus-history-detail-modal"
      >
        <div className="membership-modal-content">
          <FocusHistoryUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'quote-collection'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="语录收藏"
        subtitle="收集励志语录、名人名言、灵感句子"
        ariaLabel="语录收藏 · 工作台详情"
        className="quote-collection-detail-modal"
      >
        <div className="membership-modal-content">
          <QuoteUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'english-learning'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="英语学习"
        subtitle="单词记忆、语法笔记、学习进度"
        ariaLabel="英语学习 · 工作台详情"
        className="english-learning-detail-modal"
      >
        <div className="membership-modal-content">
          <EnglishUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'watch-list'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="观影记录"
        subtitle="电影/电视剧/纪录片观看记录和推荐"
        ariaLabel="观影记录 · 工作台详情"
        className="watch-list-detail-modal"
      >
        <div className="membership-modal-content">
          <WatchListUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'template-center'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="模板中心"
        subtitle="任务模板、快速添加常用任务集"
        ariaLabel="模板中心 · 工作台详情"
        className="template-center-detail-modal"
      >
        <div className="membership-modal-content">
          <TemplateUI />
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'growth-rpg'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="成长等级"
        subtitle={`连续 ${workspaceState.growth.streakDays} 天 · ${workspaceState.growth.achievements} 个成就 · ${weeklyProgress}% 本场景进度`}
        ariaLabel="成长等级 · 工作台详情"
        className="growth-rpg-detail-modal"
      >
        <div className="growth-rpg-detail-grid">
          <section className="workbench-detail-panel growth-rpg-hero" aria-label="成长等级概览">
            <span className="growth-level-badge">Lv. {workspaceState.growth.level}</span>
            <strong>{workspaceState.growth.experience} 积分</strong>
            <div className="xp-track" aria-label="等级经验进度">
              <span style={{ width: `${Math.min(100, workspaceState.growth.experience % 100)}%` }} />
            </div>
            <p>{activePersona.primaryFlow}</p>
            <button
              className="growth-reward-button"
              disabled={growthRewardClaimed}
              onClick={claimGrowthReward}
              type="button"
            >
              {growthRewardClaimed ? '今日奖励已领取' : '领取今日成长奖励'}
            </button>
          </section>
          <aside className="workbench-detail-panel growth-rpg-summary" aria-label="成长成就摘要">
            <h3>成长账本</h3>
            <div className="metric-grid compact">
              <article><strong>{workspaceState.growth.streakDays}</strong><span>连续天数</span></article>
              <article><strong>{workspaceState.growth.achievements}</strong><span>成就数</span></article>
              <article><strong>{completedTasks.length}</strong><span>本场景完成</span></article>
            </div>
            <div className="growth-achievement-list">
              <article><span>主线进度</span><strong>{weeklyProgress}%</strong></article>
              <article><span>待专注分钟</span><strong>{totalFocusMinutes}</strong></article>
              <article><span>今日待办</span><strong>{todoTasks.length}</strong></article>
            </div>
          </aside>
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'today-actions'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="今日行动"
        subtitle={`${todoTasks.length} 个待办 · ${completedTasks.length} 个已完成 · ${totalFocusMinutes} 分钟计划`}
        ariaLabel="今日行动 · 工作台详情"
        className="today-actions-detail-modal"
      >
        <div className="today-actions-detail-grid">
          <section className="workbench-detail-panel" aria-label="今日待办列表">
            <div className="card-heading compact">
              <h3>待推进任务</h3>
              <span className="pill">{visibleTasks.length} 项</span>
            </div>
            <div className="today-actions-detail-list">
              {visibleTasks.map((task) => (
                <article key={task.id} className={task.status === 'done' ? 'done' : ''}>
                  <span className="task-status-dot" aria-hidden="true" />
                  <div>
                    <strong>{task.title}</strong>
                    <small>{task.dueLabel} · {task.minutes} 分钟 · {task.rewardPoints} 积分</small>
                  </div>
                  <button
                    type="button"
                    className="task-complete-button"
                    disabled={task.status === 'done'}
                    onClick={() => completeTaskFromWorkbench(task.id)}
                  >
                    {task.status === 'done' ? `已完成 ${task.title}` : `完成 ${task.title}`}
                  </button>
                </article>
              ))}
            </div>
          </section>
          <aside className="workbench-detail-panel today-actions-summary" aria-label="今日行动摘要">
            <h3>行动摘要</h3>
            <div className="metric-grid compact">
              <article><strong>{weeklyProgress}%</strong><span>本场景进度</span></article>
              <article><strong>{todoTasks.length}</strong><span>剩余待办</span></article>
              <article><strong>{workspaceState.growth.experience}</strong><span>成长积分</span></article>
            </div>
            <p>{activePersona.primaryFlow}</p>
          </aside>
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'memory-insights'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="记忆洞察"
        subtitle={`${workspaceState.focusSessions.length} 条专注记忆 · 最近上下文优先展示`}
        ariaLabel="记忆洞察 · 工作台详情"
        className="memory-insights-detail-modal"
      >
        <div className="memory-insights-detail-grid">
          <section className="workbench-detail-panel" aria-label="专注记忆时间线">
            <div className="card-heading compact">
              <h3>专注记忆时间线</h3>
              <span className="pill">{workspaceState.focusSessions.length} 条</span>
            </div>
            {workspaceState.focusSessions.length === 0 ? (
              <p className="empty-state">暂无记忆记录，完成专注后会显示在这里。</p>
            ) : (
              <ul className="memory-detail-timeline">
                {workspaceState.focusSessions.map((session) => (
                  <li key={session.id}>
                    <span className="memory-event-time">
                      {new Date(session.completedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div>
                      <strong>{session.taskTitle}</strong>
                      <small>完成 {session.minutes} 分钟专注：{session.taskTitle}</small>
                      <em>{session.rewardPoints} 积分 · {session.workspaceType}</em>
                    </div>
                    <button
                      className="memory-forget-btn"
                      onClick={() => forgetFocusSession(session.id)}
                      type="button"
                    >
                      忘记 {session.taskTitle}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <aside className="workbench-detail-panel memory-insights-summary" aria-label="记忆洞察摘要">
            <h3>上下文摘要</h3>
            <div className="metric-grid compact">
              <article><strong>{workspaceState.focusSessions.length}</strong><span>记忆数</span></article>
              <article><strong>{totalFocusMinutes}</strong><span>待专注分钟</span></article>
              <article><strong>{completedTasks.length}</strong><span>完成任务</span></article>
            </div>
            <p>{workspaceState.focusSessions[0] ? `最近完成：${workspaceState.focusSessions[0].taskTitle}` : '完成一次专注后，系统会把任务、分钟数和积分沉淀为上下文。'}</p>
          </aside>
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'focus-session'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="任务专注"
        subtitle={focusDisplayTask ? `${focusDisplayTask.dueLabel} · ${focusTargetMinutes} 分钟 · ${focusRewardPoints} 积分` : '当前场景暂无待办任务'}
        ariaLabel="任务专注 · 工作台详情"
        className="focus-session-detail-modal"
      >
        <div className="focus-session-detail-grid">
          <section className="workbench-detail-panel focus-session-hero" aria-label="详情专注计时器">
            <span className="focus-session-time">{`${focusMinuteText}:${focusSecondText}`}</span>
            <h3>{focusDisplayTask ? focusDisplayTask.title : '当前场景暂无待办任务'}</h3>
            <p>{activePersona.primaryFlow}</p>
            <div className="duration-control" aria-label="详情自定义专注时长">
              <button
                type="button"
                className="duration-step"
                disabled={!focusDisplayTask || isFocusRunning || focusTargetMinutes <= FOCUS_MIN_MINUTES}
                onClick={() => adjustFocusDuration(-FOCUS_STEP_MINUTES)}
                aria-label="减少详情专注时长"
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
                  aria-label="详情专注时长（分钟）"
                />
                <span>分钟</span>
              </label>
              <button
                type="button"
                className="duration-step"
                disabled={!focusDisplayTask || isFocusRunning || focusTargetMinutes >= FOCUS_MAX_MINUTES}
                onClick={() => adjustFocusDuration(FOCUS_STEP_MINUTES)}
                aria-label="增加详情专注时长"
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
          <aside className="workbench-detail-panel focus-session-queue" aria-label="专注任务队列">
            <h3>任务队列</h3>
            <div className="today-actions-detail-list">
              {todoTasks.map((task) => (
                <article key={task.id} className={task.id === focusDisplayTask?.id ? 'active' : ''}>
                  <span className="task-status-dot" aria-hidden="true" />
                  <div>
                    <strong>{task.title}</strong>
                    <small>{task.dueLabel} · {task.minutes} 分钟 · {task.rewardPoints} 积分</small>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'statistics'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="数据统计"
        subtitle={`${completedTasks.length} 个已完成 · ${todoTasks.length} 个待办 · ${workspaceState.growth.streakDays} 天连续`}
        ariaLabel="数据统计 · 工作台详情"
        className="statistics-detail-modal"
      >
        <div className="statistics-detail-grid">
          <section className="workbench-detail-panel statistics-overview" aria-label="统计概览">
            <div className="card-heading compact">
              <h3>综合统计</h3>
              <span className="pill">{visibleTasks.length} 项任务</span>
            </div>
            <div className="statistics-detail-cards">
              <article className="statistics-detail-card">
                <span className="statistics-detail-icon">✓</span>
                <div className="statistics-detail-content">
                  <span className="statistics-detail-value">{completedTasks.length}</span>
                  <span className="statistics-detail-label">已完成任务</span>
                </div>
              </article>
              <article className="statistics-detail-card">
                <span className="statistics-detail-icon">⏳</span>
                <div className="statistics-detail-content">
                  <span className="statistics-detail-value">{todoTasks.length}</span>
                  <span className="statistics-detail-label">待办任务</span>
                </div>
              </article>
              <article className="statistics-detail-card">
                <span className="statistics-detail-icon">⏱</span>
                <div className="statistics-detail-content">
                  <span className="statistics-detail-value">{(workspaceState.focusSessions ?? []).reduce((sum, s) => sum + s.minutes, 0)}</span>
                  <span className="statistics-detail-label">累计专注分钟</span>
                </div>
              </article>
              <article className="statistics-detail-card">
                <span className="statistics-detail-icon">🔥</span>
                <div className="statistics-detail-content">
                  <span className="statistics-detail-value">{workspaceState.growth.streakDays}</span>
                  <span className="statistics-detail-label">连续天数</span>
                </div>
              </article>
              <article className="statistics-detail-card">
                <span className="statistics-detail-icon">⭐</span>
                <div className="statistics-detail-content">
                  <span className="statistics-detail-value">{workspaceState.growth.experience}</span>
                  <span className="statistics-detail-label">成长积分</span>
                </div>
              </article>
              <article className="statistics-detail-card">
                <span className="statistics-detail-icon">🏆</span>
                <div className="statistics-detail-content">
                  <span className="statistics-detail-value">{workspaceState.growth.achievements}</span>
                  <span className="statistics-detail-label">成就数</span>
                </div>
              </article>
            </div>
          </section>
          <aside className="workbench-detail-panel statistics-summary" aria-label="统计摘要">
            <h3>进度摘要</h3>
            <div className="metric-grid compact">
              <article><strong>{weeklyProgress}%</strong><span>场景进度</span></article>
              <article><strong>{totalFocusMinutes}</strong><span>计划分钟</span></article>
              <article><strong>{workspaceState.growth.level}</strong><span>等级</span></article>
            </div>
            <div className="statistics-progress-detail">
              <div className="statistics-progress-header">
                <span>本场景完成度</span>
                <span>{weeklyProgress}%</span>
              </div>
              <div className="statistics-progress-bar large">
                <div className="statistics-progress-fill" style={{ width: `${weeklyProgress}%` }} />
              </div>
            </div>
            <p>{activePersona.primaryFlow}</p>
          </aside>
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'focus-overview'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="桌面专注概览"
        subtitle={`${todoTasks.length} 个待办 · ${totalFocusMinutes} 分钟 · ${completedTasks.length} 个已完成`}
        ariaLabel="桌面专注概览 · 工作台详情"
      >
        <div className="focus-overview-detail">
          <FocusBriefStyleComponent
            data={{
              progress: weeklyProgress,
              todoCount: todoTasks.length,
              totalMinutes: totalFocusMinutes,
              completedCount: completedTasks.length
            }}
            context={{
              aesthetic: activeTheme.aesthetic,
              material: activeTheme.material
            }}
          />
          <FocusBriefStylePicker currentStyleId={focusBriefStyleId} onStyleChange={switchFocusBriefStyle} />
          <div className="focus-overview-stats">
            <article><strong>{todoTasks.length}</strong><span>待办任务</span></article>
            <article><strong>{totalFocusMinutes}</strong><span>计划分钟</span></article>
            <article><strong>{completedTasks.length}</strong><span>已完成</span></article>
            <article><strong>{weeklyProgress}%</strong><span>完成率</span></article>
          </div>
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'key-metrics'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="关键指标"
        subtitle={`${activePersona.name} 场景核心数据`}
        ariaLabel="关键指标 · 工作台详情"
      >
        <div className="key-metrics-detail">
          <div className="metrics-detail-grid">
            {activePersona.keyMetrics.map((metric, index) => (
              <article key={metric} className="metrics-detail-card">
                <span className="metrics-detail-icon">
                  {index === 0 ? '📅' : index === 1 ? '⏱' : index === 2 ? '📊' : '✅'}
                </span>
                <div className="metrics-detail-content">
                  <strong>{metric}</strong>
                  <span className="metrics-detail-value">
                    {index === 0 ? (activePersona.modules[0]?.signal ?? activePersona.mainModuleTitle) : `${70 + index * 6}%`}
                  </span>
                </div>
              </article>
            ))}
          </div>
          <div className="metrics-progress-section">
            <h3>场景进度</h3>
            <div className="statistics-progress-bar large">
              <div className="statistics-progress-fill" style={{ width: `${weeklyProgress}%` }} />
            </div>
            <span>{weeklyProgress}% 完成</span>
          </div>
        </div>
      </DraggableModal>

      <DraggableModal
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
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'theme-center'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="主题中心"
        subtitle={`当前：${activeTheme.name} · ${themeRegistry.length} 款主题`}
        ariaLabel="主题中心 · 工作台详情"
      >
        <div className="theme-center-detail">
          <div className="theme-center-current">
            <div className="theme-center-preview" style={{ background: activeTheme.tokens.gradients.hero }}>
              <span className="theme-center-preview-name">{activeTheme.name}</span>
              <span className="theme-center-preview-tone">{activeTheme.design.tone}</span>
            </div>
            <div className="theme-center-info">
              <p>{activeTheme.design.principle}</p>
              <div className="theme-center-swatches">
                <span className="theme-swatch" style={{ background: activeTheme.tokens.colors.primary }} />
                <span className="theme-swatch" style={{ background: activeTheme.tokens.colors.secondary }} />
                <span className="theme-swatch" style={{ background: activeTheme.tokens.colors.accent }} />
              </div>
            </div>
          </div>
          <div className="theme-center-actions">
            <button className="theme-recommend-button" onClick={() => { restorePersonaTheme(); setOpenWorkbenchDetail(null) }} type="button">
              恢复场景推荐主题
            </button>
            <button className="theme-picker-button" onClick={() => { openThemePicker(); setOpenWorkbenchDetail(null) }} type="button">
              打开主题库 ({themeRegistry.length} 款)
            </button>
            <button className="wallpaper-picker-button" onClick={() => { setIsWallpaperPickerOpen(true); setOpenWorkbenchDetail(null) }} type="button">
              壁纸设置
            </button>
          </div>
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'cycle-today'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="今日周期"
        subtitle="查看周期阶段和能量建议"
        ariaLabel="今日周期 · 工作台详情"
      >
        <div className="cycle-today-detail">
          <div className="cycle-today-phase-display">
            <span className="cycle-phase-dot" style={{ background: 'var(--primary)' }} />
            <div>
              <strong>当前阶段</strong>
              <p>查看今日周期阶段和能量建议</p>
            </div>
          </div>
          <div className="cycle-today-metrics-detail">
            <article>
              <span className="cycle-metric-value-large">--</span>
              <span className="cycle-metric-label">周期天数</span>
            </article>
            <article>
              <span className="cycle-metric-value-large">--</span>
              <span className="cycle-metric-label">能量等级</span>
            </article>
          </div>
          <button
            className="cycle-detail-open-btn"
            onClick={() => { setIsCycleTrackerOpen(true); setOpenWorkbenchDetail(null) }}
            type="button"
          >
            打开完整周期追踪
          </button>
        </div>
      </DraggableModal>

      <DraggableModal
        isOpen={openWorkbenchDetail === 'memory-profile'}
        onClose={() => setOpenWorkbenchDetail(null)}
        title="记忆画像"
        subtitle={`${memoryProfile.identity.mbti !== 'unknown' ? memoryProfile.identity.mbti : '未设置'} · ${memoryProfile.rhythm.energyPeak === 'morning' ? '晨间型' : memoryProfile.rhythm.energyPeak === 'afternoon' ? '午后型' : memoryProfile.rhythm.energyPeak === 'evening' ? '晚间型' : '未设置'}`}
        ariaLabel="记忆画像 · 工作台详情"
      >
        <div className="memory-profile-detail">
          <MemoryContextPreview
            profile={memoryProfile}
            events={memoryEvents}
            mode="chat"
          />
          <button
            className="memory-profile-edit-btn"
            onClick={() => { setIsMemoryProfileOpen(true); setOpenWorkbenchDetail(null) }}
            type="button"
          >
            编辑完整画像
          </button>
        </div>
      </DraggableModal>

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
              onClose={() => setIsWallpaperPickerOpen(false)}
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
                userId={authSession.userId}
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
        <div className="membership-modal-backdrop" onClick={() => setIsRelationshipSpaceOpen(false)} role="presentation">
          <section
            aria-modal="true"
            className="membership-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="关系空间"
            style={{ maxWidth: 900 }}
          >
            <header className="membership-modal-hero">
              <div className="membership-modal-hero-text">
                <p className="eyebrow">Relationship Space · 关系空间</p>
                <h2>与伙伴一起成长</h2>
              </div>
              <button className="membership-modal-close" onClick={() => setIsRelationshipSpaceOpen(false)} type="button" aria-label="关闭关系空间">
                ×
              </button>
            </header>
            <div className="membership-modal-content">
              <RelationshipSpaceProvider>
                {selectedSpaceId ? (
                  <SpaceDetail
                    spaceId={selectedSpaceId}
                    userId={authSession.userId}
                    onBack={() => setSelectedSpaceId(null)}
                  />
                ) : (
                  <SpaceList
                    userId={authSession.userId}
                    onSelectSpace={setSelectedSpaceId}
                    onCreateSpace={() => {}}
                  />
                )}
              </RelationshipSpaceProvider>
            </div>
          </section>
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
                userId={authSession.userId}
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
        />
      )}
      {!isAgentChatOpen && (
        <AgentChatToggle onClick={() => setIsAgentChatOpen(true)} />
      )}

      <SilentSuggestionUI suggestions={silentSuggestions} />
    </main>
    </IdentityProvider>
  )
}
