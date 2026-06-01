﻿import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Clock3,
  Crown,
  Flame,
  LineChart,
  Minus,
  MonitorSmartphone,
  Palette,
  Plus,
  Sparkles,
  Target,
  Trophy,
  Zap
} from 'lucide-react'
import { ExpandableCard } from './components/expandable/ExpandableCard'
import { createAiPromptDraft, getAiProviderById } from './ai/aiProvider'
import {
  createBrowserWorkspaceStore,
  createInitialWorkspaceState,
  type FocusSessionRecord,
  type WorkspaceState,
  type WorkspaceType
} from './data/workspaceStore'
import { getPersonaById, personaRegistry, type PersonaId } from './personas/personaRegistry'
import { getPersonaTemplateById } from './personas/personaTemplates'
import { getDefaultMiniProgramModules, miniProgramBlueprint } from './platforms/miniProgramBlueprint'
import {
  getThemeById,
  materialLabels,
  themeFamilyMeta,
  themeRegistry,
  type StudyTheme,
  type ThemeAesthetic,
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
import { AdminConsolePage } from './components/membership/AdminConsolePage'

const navigationItems = [
  { label: '首页仪表盘', icon: LineChart },
  { label: '学习目标', icon: Target },
  { label: '办公行动', icon: Briefcase },
  { label: '每日打卡', icon: Flame },
  { label: '番茄专注', icon: Clock3 },
  { label: '知识笔记', icon: BookOpen },
  { label: '复盘提醒', icon: Brain },
  { label: '数据统计', icon: Trophy },
  { label: '主题中心', icon: Palette },
  { label: '会员中心', icon: Crown },
  { label: '管理后台', icon: Zap }
]

const personaWorkspaceMap: Record<PersonaId, WorkspaceType> = {
  'exam-student': 'study',
  'office-worker': 'work',
  creator: 'growth',
  'self-growth': 'growth'
}

const store = typeof window === 'undefined' ? undefined : createBrowserWorkspaceStore()

const entitlementService = createEntitlementService()
const aiQuotaProvider = createAiQuotaProvider(entitlementService)
const orderService = createOrderService()

const defaultMiniProgramModules = getDefaultMiniProgramModules()

const themeFamilyLabels: Record<ThemeAesthetic, string> = {
  minimal: '极简',
  dopamine: '多巴胺',
  ink: '水墨',
  chinese: '国风',
  anime: '二次元',
  morandi: '莫兰迪',
  business: '商务',
  night: '夜间',
  clash: '撞色',
  huawei: '华为',
  liquid: '液态玻璃'
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

const applyTheme = (themeId: ThemeId) => {
  const theme = getThemeById(themeId)
  const root = document.documentElement
  root.dataset.theme = theme.id
  root.dataset.aesthetic = theme.aesthetic
  root.dataset.material = theme.material
  root.style.setProperty('--app-background', theme.tokens.colors.background)
  root.style.setProperty('--surface', theme.tokens.colors.surface)
  root.style.setProperty('--surface-strong', theme.tokens.colors.surfaceStrong)
  root.style.setProperty('--primary', theme.tokens.colors.primary)
  root.style.setProperty('--secondary', theme.tokens.colors.secondary)
  root.style.setProperty('--accent', theme.tokens.colors.accent)
  root.style.setProperty('--text', theme.tokens.colors.text)
  root.style.setProperty('--muted', theme.tokens.colors.muted)
  root.style.setProperty('--border', theme.tokens.colors.border)
  root.style.setProperty('--hero-gradient', theme.tokens.gradients.hero)
  root.style.setProperty('--card-gradient', theme.tokens.gradients.card)
  root.style.setProperty('--chart-plan', theme.tokens.charts.plan)
  root.style.setProperty('--chart-focus', theme.tokens.charts.focus)
  root.style.setProperty('--chart-review', theme.tokens.charts.review)
  root.style.setProperty('--radius', theme.tokens.effects.radius)
  root.style.setProperty('--shadow', theme.tokens.effects.shadow)
  root.style.setProperty('--glass', theme.tokens.effects.glass)
}

const loadInitialState = (): WorkspaceState => {
  if (!store) return createInitialWorkspaceState()
  return store.load()
}

export default function App() {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(() => loadInitialState())
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
  const [themeSearchQuery, setThemeSearchQuery] = useState('')
  const [activeThemeFamily, setActiveThemeFamily] = useState<ThemeFamilyId | 'all'>('all')
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null)
  const [focusEndsAt, setFocusEndsAt] = useState<number | null>(null)
  const [focusPausedRemainingMs, setFocusPausedRemainingMs] = useState<number | null>(null)
  const [focusNow, setFocusNow] = useState<number>(() => Date.now())
  const [focusDurationDraft, setFocusDurationDraft] = useState<Record<string, number>>({})
  const focusIntervalRef = useRef<number | null>(null)
  const isFocusRunning = focusEndsAt !== null
  const candidateFocusTask = focusTaskId
    ? workspaceState.tasks.find((task) => task.id === focusTaskId) ?? null
    : null
  const activeFocusTask =
    candidateFocusTask && candidateFocusTask.status === 'todo' ? candidateFocusTask : null
  const normalizedThemeSearch = themeSearchQuery.trim().toLowerCase()
  const [isMembershipOpen, setIsMembershipOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isAdminConsoleOpen, setIsAdminConsoleOpen] = useState(false)
  const [userTrials, setUserTrials] = useState<{code: string; expireAt: string; used: boolean}[]>([])
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

  const userId = localStorage.getItem('user_id') || 'anonymous'
  const quotaStatus = aiQuotaProvider.getQuotaStatus(userId)
  const totalQuota = 
    (quotaStatus.free?.remaining || 0) + 
    (quotaStatus.study?.remaining || 0) + 
    (quotaStatus.agent?.remaining || 0) + 
    (quotaStatus.pack?.remaining || 0)
  
  const getCurrentTier = () => {
    if (entitlementService.has(userId, 'agent_plus')) return { level: 'agent_plus', label: 'Agent PLUS', color: '#8b5cf6' }
    if (entitlementService.has(userId, 'agent')) return { level: 'agent', label: 'Agent 会员', color: '#6366f1' }
    if (entitlementService.has(userId, 'study')) return { level: 'study', label: '学习会员', color: '#10b981' }
    return { level: 'free', label: '免费用户', color: '#94a3b8' }
  }
  const currentTier = getCurrentTier()
  
  const handleSubscribe = (product: Product) => {
    setSelectedProduct(product)
    setIsPaymentOpen(true)
  }
  
  const handlePayment = async (channel: 'wechat' | 'alipay' | 'apple') => {
    if (!selectedProduct) return
    
    const userId = localStorage.getItem('user_id') || 'anonymous'
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
    alert(`订单已创建：${order.id}\n\n请在打开的页面中完成支付。\n\n支付完成后刷新页面查看会员状态。`)
  }
  
  const userOrders = useMemo(() => {
    const uid = localStorage.getItem('user_id') || 'anonymous'
    return orderService.getOrdersByUser(uid).slice(0, 5)
  }, [])
  
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
    alert(`试用已开启！您将享受 ${durationDays} 天的会员权益。`)
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
    const map: Record<string, string> = { pending: '#f59e0b', paid: '#10b981', refunded: '#6b7280', failed: '#ef4444' }
    return map[status] || '#6b7280'
  }
  
  const products = useMemo(() => getActiveProducts(), [])
  
  const getFirstProduct = (products: Product[], filter: (p: Product) => boolean) => {
    const filtered = products.filter(filter)
    return filtered.find(p => p.originalPrice) ?? filtered[0]
  }
  
  const studyProduct = getFirstProduct(products, p => p.id.startsWith('study') && p.period === 'month')
  const agentProduct = getFirstProduct(products, p => p.id.startsWith('agent') && !p.id.includes('plus') && p.period === 'month')
  const agentPlusProduct = getFirstProduct(products, p => p.id.includes('plus') && p.period === 'month')
  
  const formatPrice = (cents: number) => `¥${(cents / 100).toFixed(0)}`

  useEffect(() => {
    applyTheme(workspaceState.preferences.themeId)
    store?.save(workspaceState)
  }, [workspaceState])

  useEffect(() => {
    if (!isThemePickerOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsThemePickerOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isThemePickerOpen])

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
          rewardXp: target.rewardXp,
          completedAt: new Date().toISOString()
        }

        return {
          ...state,
          tasks: state.tasks.map((task) =>
            task.id === completedTaskId ? { ...task, status: 'done', dueLabel: '已完成' } : task
          ),
          growth: {
            ...state.growth,
            experience: state.growth.experience + target.rewardXp,
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
  }, [focusEndsAt, remainingMsFromEnds, focusTaskId])

  const openThemePicker = () => {
    setThemeSearchQuery('')
    setIsThemePickerOpen(true)
  }

  const closeThemePicker = () => {
    setIsThemePickerOpen(false)
  }

  const switchTheme = (themeId: ThemeId) => {
    setWorkspaceState((current) => ({
      ...current,
      preferences: { ...current.preferences, themeId, themeMode: 'manual' }
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
  const focusTargetMinutes = focusDisplayTask
    ? focusDurationDraft[focusDisplayTask.id] ?? focusDisplayTask.minutes
    : 25

  const focusSeconds = activeFocusTask
    ? focusRemainingSeconds
    : focusTargetMinutes * 60
  const focusMinuteText = String(Math.floor(focusSeconds / 60)).padStart(2, '0')
  const focusSecondText = String(focusSeconds % 60).padStart(2, '0')
  const focusRewardXp = focusDisplayTask
    ? Math.round((focusDisplayTask.rewardXp * focusTargetMinutes) / focusDisplayTask.minutes)
    : 0

  const adjustFocusDuration = (delta: number) => {
    if (!focusDisplayTask || isFocusRunning) return
    const next = Math.min(
      FOCUS_MAX_MINUTES,
      Math.max(FOCUS_MIN_MINUTES, focusTargetMinutes + delta)
    )
    if (next === focusTargetMinutes) return
    setFocusDurationDraft((current) => ({ ...current, [focusDisplayTask.id]: next }))
    setFocusPausedRemainingMs(null)
  }

  const handleFocusDurationInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!focusDisplayTask || isFocusRunning) return
    const raw = Number(event.target.value)
    if (!Number.isFinite(raw)) return
    const clamped = Math.min(FOCUS_MAX_MINUTES, Math.max(FOCUS_MIN_MINUTES, Math.round(raw)))
    setFocusDurationDraft((current) => ({ ...current, [focusDisplayTask.id]: clamped }))
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

  return (
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
      <aside className="sidebar panel">
        <div className="brand">
          <span className="brand-mark">G</span>
          <div>
            <strong>GrowthOS</strong>
            <small>个人效率与成长工作台</small>
          </div>
        </div>
        <nav className="nav-list" aria-label="主导航">
          {navigationItems.map((item, index) => {
            const Icon = item.icon
            const isMembership = item.label === '会员中心'
            const isAdmin = item.label === '管理后台'
            return (
              <button 
                className={(isMembership && isMembershipOpen) || (isAdmin && isAdminConsoleOpen) ? 'nav-item active' : index === 0 ? 'nav-item active' : 'nav-item'} 
                key={item.label} 
                type="button"
                onClick={() => {
                  if (isMembership) setIsMembershipOpen(true)
                  if (isAdmin) setIsAdminConsoleOpen(true)
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="hero panel">
          <div>
            <p className="eyebrow">桌面优先 · 多端预留 · AI 行动教练</p>
            <h1>{activePersona.name}</h1>
            <p className="hero-subtitle">{activePersona.hero}</p>
          </div>
          <div className="hero-actions">
            <button 
              className="pill membership-pill" 
              style={{ background: currentTier.color }}
              onClick={() => setIsMembershipOpen(true)}
            >
              <Crown size={14} />
              <span>{currentTier.label}</span>
            </button>
            <button 
              className="pill quota-pill"
              onClick={() => setIsMembershipOpen(true)}
            >
              <Zap size={14} />
              <span>AI {totalQuota}</span>
            </button>
            <span className="pill">当前主题：{activeTheme.name}</span>
            <span className="pill">{workspaceState.preferences.themeMode === 'manual' ? '手动主题' : '场景推荐'}</span>
            <span className="pill warm">连续 {workspaceState.growth.streakDays} 天</span>
          </div>
        </header>

        <section className="workspace-switcher" aria-label="用户场景切换">
          {personaRegistry.map((persona) => (
            <button
              className={persona.id === activePersona.id ? 'workspace-tab active' : 'workspace-tab'}
              key={persona.id}
              onClick={() => switchPersona(persona.id)}
              type="button"
            >
              <strong>{persona.name}</strong>
              <span>{persona.primaryFlow}</span>
            </button>
          ))}
        </section>

        <div className="dashboard-grid">
          <ExpandableCard
            expandedTitle={activePersona.mainModuleTitle}
            expandedContent={
              <>
                <div className="card-heading">
                  <div>
                    <p className="eyebrow">Persona Template · 完整视图</p>
                    <strong style={{ fontSize: 22, color: 'var(--primary)' }}>{activeTemplate.title}</strong>
                  </div>
                  <strong style={{ color: 'var(--primary)', fontSize: 32 }}>{weeklyProgress}%</strong>
                </div>
                <div className="progress-track"><span style={{ width: `${weeklyProgress}%` }} /></div>
                <div className="template-summary">
                  <strong>{activeTemplate.title}</strong>
                  <small>{activeTemplate.operatingRhythm}</small>
                </div>
                <div className="template-section-grid">
                  {activeTemplate.sections.map((section) => (
                    <article className="template-section" key={section.title}>
                      <strong>{section.title}</strong>
                      {section.items.map((item) => (
                        <div className="template-item" key={item.title}>
                          <span>{item.status}</span>
                          <div><b>{item.title}</b><small>{item.meta}</small></div>
                        </div>
                      ))}
                    </article>
                  ))}
                </div>
                <div className="persona-brief">
                  <strong>默认行动建议</strong>
                  <em>{activeTemplate.defaultAction}</em>
                  <small>复盘问题：{activeTemplate.reviewQuestion}</small>
                </div>
              </>
            }
          >
            <section className="plan-card card large-card">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Persona Template</p>
                  <h2>{activePersona.mainModuleTitle}</h2>
                </div>
                <strong>{weeklyProgress}%</strong>
              </div>
              <div className="progress-track" aria-label={`${activePersona.mainModuleTitle}进度`}><span style={{ width: `${weeklyProgress}%` }} /></div>
              <div className="template-summary">
                <strong>{activeTemplate.title}</strong>
                <small>{activeTemplate.operatingRhythm}</small>
              </div>
              <div className="template-section-grid">
                {activeTemplate.sections.map((section) => (
                  <article className="template-section" key={section.title}>
                    <strong>{section.title}</strong>
                    {section.items.map((item) => (
                      <div className="template-item" key={item.title}>
                        <span>{item.status}</span>
                        <div><b>{item.title}</b><small>{item.meta}</small></div>
                      </div>
                    ))}
                  </article>
                ))}
              </div>
            </section>
          </ExpandableCard>

          <ExpandableCard
            expandedTitle={`Lv. ${workspaceState.growth.level} · 成长档案`}
            expandedContent={
              <div className="growth-detail">
                <div className="growth-detail-level">
                  <strong>Lv. {workspaceState.growth.level}</strong>
                  <span>持续 {workspaceState.growth.streakDays} 天 · 累计 {workspaceState.growth.experience} XP</span>
                </div>
                <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>
                  在学习、办公、复盘等场景完成行动后，会自动沉淀经验值。坚持每日打卡可以激活连续奖励。
                </p>
                <div className="growth-detail-stats">
                  <article className="growth-detail-stat">
                    <strong>{workspaceState.growth.achievements}</strong>
                    <span>解锁成就</span>
                  </article>
                  <article className="growth-detail-stat">
                    <strong>{workspaceState.growth.experience}</strong>
                    <span>累计 XP</span>
                  </article>
                  <article className="growth-detail-stat">
                    <strong>{workspaceState.growth.streakDays}</strong>
                    <span>连续打卡</span>
                  </article>
                </div>
                <strong style={{ marginTop: 8 }}>近期里程碑</strong>
                <div className="growth-milestones">
                  {[
                    { name: '首次完成番茄专注', meta: '触发解锁条件', xp: 50, locked: false },
                    { name: '连续 7 天打卡', meta: '当前 ' + workspaceState.growth.streakDays + ' 天', xp: 120, locked: workspaceState.growth.streakDays < 7 },
                    { name: '完成 10 个学习目标', meta: '已完成 ' + completedTasks.length + ' 个', xp: 200, locked: completedTasks.length < 10 },
                    { name: '达到 Lv. 5', meta: '当前 Lv. ' + workspaceState.growth.level, xp: 500, locked: workspaceState.growth.level < 5 }
                  ].map((m) => (
                    <div className="growth-milestone" key={m.name}>
                      <span className={`growth-milestone-dot${m.locked ? ' locked' : ''}`} />
                      <div>
                        <strong>{m.name}</strong>
                        <span style={{ display: 'block' }}>{m.meta}</span>
                      </div>
                      <span className="growth-milestone-xp">+{m.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <section className="growth-card card" style={{ background: activeTheme.tokens.gradients.card }}>
              <p className="eyebrow">Growth RPG</p>
              <h2>Lv. {workspaceState.growth.level}</h2>
              <p>完成学习、办公和成长行动都会沉淀经验。</p>
              <div className="xp-track"><span /></div>
              <strong>{workspaceState.growth.achievements} 个成就 · {workspaceState.growth.experience} XP</strong>
            </section>
          </ExpandableCard>

          <ExpandableCard
            expandedTitle="桌面专注概览"
            expandedContent={
              <>
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
                <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <article>
                    <strong>{weeklyProgress}%</strong>
                    <span>本周进度</span>
                  </article>
                  <article>
                    <strong>{todoTasks.length}</strong>
                    <span>待办任务</span>
                  </article>
                  <article>
                    <strong>{totalFocusMinutes}</strong>
                    <span>计划分钟</span>
                  </article>
                  <article>
                    <strong>{completedTasks.length}</strong>
                    <span>已完成</span>
                  </article>
                </div>
                <strong style={{ marginTop: 8 }}>切换概览风格</strong>
                <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.7 }}>
                  你可以在主卡片右上角的图标切换不同的可视化风格：极简弧、统计条、半盘表，每种风格都会自动适配主题。
                </p>
              </>
            }
          >
            <section
              className="card focus-brief-card"
              aria-label="桌面专注概览"
              data-style={focusBriefStyleId}
              data-aesthetic={activeTheme.aesthetic}
              data-material={activeTheme.material}
            >
              <div className="card-heading compact">
                <h2>桌面专注概览</h2>
                <div
                  className="focus-brief-heading-actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Clock3 size={20} />
                  <FocusBriefStylePicker
                    currentStyleId={focusBriefStyleId}
                    onStyleChange={switchFocusBriefStyle}
                  />
                </div>
              </div>
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
              <div className="focus-brief-legacy-meta" aria-hidden="true">
                <span>{todoTasks.length} 个待办</span>
                <span>{totalFocusMinutes} 分钟</span>
                <span>{completedTasks.length} 个已完成</span>
              </div>
            </section>
          </ExpandableCard>

          <ExpandableCard
            expandedTitle="用户痛点 · 场景档案"
            expandedContent={
              <div className="persona-brief">
                <strong>{activePersona.targetUser}</strong>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', margin: '8px 0' }}>
                  {activePersona.painPoint}
                </p>
                <small style={{ fontSize: 14 }}>核心动线：{activePersona.primaryFlow}</small>
                <em>{activeTemplate.defaultAction}</em>
                <small style={{ fontSize: 14, marginTop: 8 }}>复盘问题：{activeTemplate.reviewQuestion}</small>
                <strong style={{ marginTop: 12 }}>关键模块</strong>
                <div className="stat-bar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {activePersona.modules.map((mod) => (
                    <article key={mod.title} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 16, background: 'var(--card-gradient)' }}>
                      <strong style={{ display: 'block', color: 'var(--text)' }}>{mod.title}</strong>
                      <small style={{ color: 'var(--muted)', display: 'block', marginTop: 6 }}>{mod.signal}</small>
                    </article>
                  ))}
                </div>
              </div>
            }
          >
            <section className="card">
              <div className="card-heading compact"><h2>用户痛点</h2><BookOpen size={20} /></div>
              <div className="persona-brief">
                <strong>{activePersona.targetUser}</strong>
                <p>{activePersona.painPoint}</p>
                <small>{activePersona.primaryFlow}</small>
                <em>{activeTemplate.defaultAction}</em>
                <small>{activeTemplate.reviewQuestion}</small>
              </div>
            </section>
          </ExpandableCard>

          <ExpandableCard
            expandedTitle="关键指标 · 全景"
            expandedContent={
              <>
                <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.7 }}>
                  {activePersona.name} 场景下的核心指标看板。每一项都对应一个可执行的成长动作。
                </p>
                <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {activePersona.keyMetrics.map((metric, index) => (
                    <article key={metric} style={{ padding: 18 }}>
                      <strong style={{ fontSize: 16 }}>{metric}</strong>
                      <span style={{ fontSize: 13 }}>
                        {index === 0 ? activePersona.modules[0].signal : `${70 + index * 6}%`}
                      </span>
                      <small style={{ color: 'var(--muted)', display: 'block', marginTop: 8, lineHeight: 1.6 }}>
                        {index === 0 ? '主信号：来自当前场景核心模块。' : '基线指标：根据近 7 日数据估算。'}
                      </small>
                    </article>
                  ))}
                </div>
              </>
            }
          >
            <section className="card">
              <div className="card-heading compact"><h2>关键指标</h2><Brain size={20} /></div>
              <div className="metric-grid">
                {activePersona.keyMetrics.map((metric, index) => (
                  <article key={metric}>
                    <strong>{metric}</strong>
                    <span>{index === 0 ? activePersona.modules[0].signal : `${70 + index * 6}%`}</span>
                  </article>
                ))}
              </div>
            </section>
          </ExpandableCard>
        </div>
      </section>

      <aside className="today-panel">
        <ExpandableCard
          expandedTitle="今日行动 · 完整清单"
          expandedContent={
            <div className="side-card-expanded">
              <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.7 }}>
                {activePersona.name} 场景的全部待办任务。点击卡片以聚焦完成。
              </p>
              <div className="today-list">
                {todoTasks.length === 0 ? (
                  <p style={{ color: 'var(--muted)' }}>暂无待办，先去添加任务吧。</p>
                ) : (
                  todoTasks.map((task) => (
                    <article key={task.id}>
                      <span />
                      <div>
                        <strong>{task.title}</strong>
                        <small>{task.dueLabel} · {task.minutes} 分钟 · {task.rewardXp} XP</small>
                      </div>
                    </article>
                  ))
                )}
              </div>
              {completedTasks.length > 0 && (
                <>
                  <strong>已完成 ({completedTasks.length})</strong>
                  <div className="today-list">
                    {completedTasks.map((task) => (
                      <article key={task.id} style={{ opacity: 0.7 }}>
                        <span style={{ background: 'var(--border)' }} />
                        <div>
                          <strong style={{ textDecoration: 'line-through' }}>{task.title}</strong>
                          <small>{task.dueLabel} · {task.minutes} 分钟</small>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          }
        >
          <section className="panel side-card">
            <h2>今日行动</h2>
            <div className="today-list">
              {todoTasks.map((task) => (
                <article key={task.id}><span /><div><strong>{task.title}</strong><small>{task.dueLabel} · {task.minutes} 分钟</small></div></article>
              ))}
            </div>
          </section>
        </ExpandableCard>

        <section className="panel side-card timer-card" aria-label="任务专注计时器">
          <h2>任务专注</h2>
          <strong>{`${focusMinuteText}:${focusSecondText}`}</strong>
          <p>{focusDisplayTask ? focusDisplayTask.title : '当前场景暂无待办任务'}</p>
          <small>
            {focusDisplayTask
              ? `${focusDisplayTask.dueLabel} · ${focusRewardXp} XP`
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

        <ExpandableCard
          expandedTitle="最近专注 · 完整记录"
          expandedContent={
            <div className="side-card-expanded">
              {workspaceState.focusSessions.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>完成首个任务后，会自动沉淀到这里。</p>
              ) : (
                <ul className="focus-history-list">
                  {workspaceState.focusSessions.map((session) => (
                    <li key={session.id}>
                      <strong>{session.taskTitle}</strong>
                      <small>
                        {session.minutes} 分钟 · {session.rewardXp} XP · {new Date(session.completedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          }
        >
          <section className="panel side-card focus-history-card" aria-label="最近专注会话">
            <h2>最近专注</h2>
            {workspaceState.focusSessions.length === 0 ? (
              <p className="empty-state">完成首个任务后，会自动沉淀到这里。</p>
            ) : (
              <ul className="focus-history-list">
                {workspaceState.focusSessions.slice(0, 3).map((session) => (
                  <li key={session.id}>
                    <strong>{session.taskTitle}</strong>
                    <small>
                      {session.minutes} 分钟 · {session.rewardXp} XP · {new Date(session.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </ExpandableCard>

        <ExpandableCard
          expandedTitle={`${activePersona.aiRole} · AI 行动教练`}
          expandedContent={
            <div className="ai-expanded">
              <div className="ai-prompt-preview">
                <strong>建议提示词</strong>
                <p style={{ margin: '10px 0 0', color: 'var(--text)' }}>{promptDraft.title}</p>
                <small style={{ display: 'block', marginTop: 12, color: 'var(--muted)' }}>
                  Provider：{activeProvider.name} · 状态：
                  {workspaceState.integrations.ai.status === 'ready' ? '已配置' : '未配置 API Key（已预留 Provider 接口）'}
                </small>
              </div>
              <strong>支持的 AI 动作</strong>
              <div className="ai-actions" style={{ marginTop: 0 }}>
                {activePersona.aiActions.map((action) => (
                  <span key={action}>{action}</span>
                ))}
              </div>
              <strong style={{ marginTop: 8 }}>AI 教练职责</strong>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                {activePersona.aiRole} 会根据当前场景的痛点、关键模块和近期专注记录，生成可执行的下一步建议，
                并在你完成任务后协助复盘。
              </p>
            </div>
          }
        >
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
        </ExpandableCard>

        <ExpandableCard
          expandedTitle="多端预留 · 平台矩阵"
          expandedContent={
            <div className="platform-expanded">
              <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.7 }}>
                当前桌面端优先，数据层已按本地优先和同步预留设计。以下是各平台规划：
              </p>
              {[
                { name: 'Desktop', desc: '主战场 · Electron + React · 已上线', icon: '🖥️' },
                { name: '微信小程序', desc: '碎片化场景 · 原生小程序 · 试验版已构建', icon: '💚' },
                { name: 'Web / PWA', desc: '跨设备访问 · 离线可用 · 计划中', icon: '🌐' },
                { name: 'iOS', desc: '原生体验 · 计划接入', icon: '🍎' },
                { name: 'HarmonyOS', desc: '鸿蒙原生 · 适配 ArkUI · 计划中', icon: '🟢' }
              ].map((p) => (
                <article className="platform-detail" key={p.name}>
                  <span className="platform-detail-icon" style={{ fontSize: 20 }}>{p.icon}</span>
                  <div>
                    <strong>{p.name}</strong>
                    <span style={{ display: 'block', marginTop: 4 }}>{p.desc}</span>
                  </div>
                </article>
              ))}
            </div>
          }
        >
          <section className="panel side-card multi-end-card">
            <div className="card-heading compact"><h2>多端预留</h2><MonitorSmartphone size={20} /></div>
            <p>当前桌面端优先，数据层已按本地优先和同步预留设计。</p>
            <div className="platform-list">
              <span>Desktop</span>
              <span>微信小程序</span>
              <span>Web/PWA</span>
              <span>iOS</span>
              <span>HarmonyOS</span>
            </div>
          </section>
        </ExpandableCard>

        <ExpandableCard
          expandedTitle="小程序试验版 · 完整预览"
          expandedContent={
            <div className="mini-program-expanded">
              <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.7 }}>{miniProgramBlueprint.positioning}</p>
              <span className="implementation-pill">微信小程序原生</span>
              <div className="boundary-grid" style={{ gridTemplateColumns: '1fr 1fr', margin: 0 }}>
                <article><span>桌面端</span><strong>{miniProgramBlueprint.desktopBoundary}</strong></article>
                <article><span>小程序</span><strong>{miniProgramBlueprint.mobileBoundary}</strong></article>
              </div>
              <div className="phone-preview" aria-label="小程序首页预览">
                <div className="phone-preview-top"><strong>今天</strong><span>{getThemeById(miniProgramBlueprint.recommendedThemeId).name}</span></div>
                <div className="phone-priority"><strong>优先做 3 件事</strong><small>{activePersona.name} · {activePersona.modules[0].signal}</small></div>
                <div className="phone-module-grid">
                  {defaultMiniProgramModules.map((module) => (
                    <article key={module.id}><strong>{module.title}</strong><small>{module.privacyLevel}</small></article>
                  ))}
                </div>
                <div className="phone-tabbar">
                  {miniProgramBlueprint.navigation.map((item) => (
                    <span key={item.id}>{item.label}</span>
                  ))}
                </div>
              </div>
              <small className="sync-note">{miniProgramBlueprint.syncStrategy}</small>
            </div>
          }
        >
          <section className="panel side-card mini-program-card">
              <div className="card-heading compact"><h2>小程序试验版</h2><MonitorSmartphone size={20} /></div>
              <p>{miniProgramBlueprint.positioning}</p>
              <span className="implementation-pill">微信小程序原生</span>
            <div className="boundary-grid">
              <article><span>桌面端</span><strong>{miniProgramBlueprint.desktopBoundary}</strong></article>
              <article><span>小程序</span><strong>{miniProgramBlueprint.mobileBoundary}</strong></article>
            </div>
            <div className="phone-preview" aria-label="小程序首页预览">
              <div className="phone-preview-top"><strong>今天</strong><span>{getThemeById(miniProgramBlueprint.recommendedThemeId).name}</span></div>
              <div className="phone-priority"><strong>优先做 3 件事</strong><small>{activePersona.name} · {activePersona.modules[0].signal}</small></div>
              <div className="phone-module-grid">
                {defaultMiniProgramModules.slice(0, 4).map((module) => (
                  <article key={module.id}><strong>{module.title}</strong><small>{module.privacyLevel}</small></article>
                ))}
              </div>
              <div className="phone-tabbar">
                {miniProgramBlueprint.navigation.map((item) => (
                  <span key={item.id}>{item.label}</span>
                ))}
              </div>
            </div>
            <small className="sync-note">{miniProgramBlueprint.syncStrategy}</small>
          </section>
        </ExpandableCard>

        <ExpandableCard
          expandedTitle="主题中心 · 视觉档案"
          expandedContent={
            <div className="theme-center-expanded">
              <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.7 }}>
                当前主题：<strong style={{ color: 'var(--primary)' }}>{activeTheme.name}</strong>
                {' · '}
                共 {themeRegistry.length} 款主题、{themeFamilies.length} 个分类。
              </p>
              <div className="theme-detail-grid">
                <div className="theme-detail-item">
                  <span>设计基调</span>
                  <strong>{activeTheme.design.tone}</strong>
                </div>
                <div className="theme-detail-item">
                  <span>适用场景</span>
                  <strong>{activeTheme.design.scene}</strong>
                </div>
                <div className="theme-detail-item">
                  <span>设计原则</span>
                  <strong>{activeTheme.design.principle}</strong>
                </div>
                <div className="theme-detail-item">
                  <span>视觉舒适度</span>
                  <strong>{activeTheme.visualComfort}</strong>
                </div>
              </div>
              <div className="active-theme-preview" aria-label="当前主题预览">
                <strong>主题色板</strong>
                <span className="theme-swatch-row" aria-hidden="true">
                  <span className="theme-swatch" style={{ background: activeTheme.tokens.colors.primary }} />
                  <span className="theme-swatch" style={{ background: activeTheme.tokens.colors.secondary }} />
                  <span className="theme-swatch" style={{ background: activeTheme.tokens.colors.accent }} />
                </span>
              </div>
              <button
                className="theme-recommend-button"
                onClick={(event) => { event.stopPropagation(); restorePersonaTheme() }}
                type="button"
              >
                恢复场景推荐主题
              </button>
              <button
                className="theme-picker-button"
                onClick={(event) => { event.stopPropagation(); openThemePicker() }}
                type="button"
              >
                <span>打开主题库</span>
                <small>{themeRegistry.length} 款主题 · 支持搜索和滑动选择</small>
              </button>
            </div>
          }
        >
          <section className="panel side-card theme-center">
            <div className="card-heading compact"><h2>主题中心</h2><Sparkles size={20} /></div>
            <p>后期可继续新增学习、办公、游戏化和品牌主题包。</p>
            <div className="design-note">
              <span>设计定位</span>
              <strong>{activeTheme.design.tone}</strong>
              <small>{activeTheme.design.principle}</small>
            </div>
            <button
              className="theme-recommend-button"
              onClick={(event) => { event.stopPropagation(); restorePersonaTheme() }}
              type="button"
            >
              恢复场景推荐主题
            </button>
            <button
              className="theme-picker-button"
              onClick={(event) => { event.stopPropagation(); openThemePicker() }}
              type="button"
            >
              <span>打开主题库</span>
              <small>{themeRegistry.length} 款主题 · 支持搜索和滑动选择</small>
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
        </ExpandableCard>
      </aside>

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

              <section className="membership-tiers-section">
                <h3>会员套餐</h3>
                <div className="membership-tier-grid">
                  {studyProduct && (
                    <div className="membership-tier-card" key={studyProduct.id}>
                      <div className="membership-tier-header">
                        <span className="membership-tier-name">学习会员</span>
                        <span className="membership-tier-badge" style={{ background: '#10b981' }}>基础</span>
                      </div>
                      <div className="membership-tier-price">
                        {studyProduct.originalPrice && (
                          <span className="original-price">{formatPrice(studyProduct.originalPrice)}</span>
                        )}
                        <span className="price">{formatPrice(studyProduct.price)}</span>
                        <span className="period">/{studyProduct.period}</span>
                      </div>
                      <ul className="membership-tier-features">
                        <li>高级主题全解锁</li>
                        <li>云同步</li>
                        <li>高级统计</li>
                        <li>50次AI额度/月</li>
                      </ul>
                      <button className="membership-tier-button" style={{ background: '#10b981' }} onClick={() => studyProduct && handleSubscribe(studyProduct)}>立即订阅</button>
                    </div>
                  )}

                  {agentProduct && (
                    <div className="membership-tier-card featured" key={agentProduct.id}>
                      <div className="membership-tier-header">
                        <span className="membership-tier-name">Agent 会员</span>
                        <span className="membership-tier-badge" style={{ background: '#6366f1' }}>热门</span>
                      </div>
                      <div className="membership-tier-price">
                        {agentProduct.originalPrice && (
                          <span className="original-price">{formatPrice(agentProduct.originalPrice)}</span>
                        )}
                        <span className="price">{formatPrice(agentProduct.price)}</span>
                        <span className="period">/{agentProduct.period}</span>
                      </div>
                      <ul className="membership-tier-features">
                        <li>有记忆的AI搭子</li>
                        <li>自我进化机制</li>
                        <li>角色系统</li>
                        <li>RPM捏脸</li>
                        <li>200次AI额度/月</li>
                      </ul>
                      <button className="membership-tier-button" style={{ background: '#6366f1' }} onClick={() => agentProduct && handleSubscribe(agentProduct)}>立即订阅</button>
                    </div>
                  )}

                  {agentPlusProduct && (
                    <div className="membership-tier-card" key={agentPlusProduct.id}>
                      <div className="membership-tier-header">
                        <span className="membership-tier-name">Agent PLUS</span>
                        <span className="membership-tier-badge" style={{ background: '#8b5cf6' }}>旗舰</span>
                      </div>
                      <div className="membership-tier-price">
                        {agentPlusProduct.originalPrice && (
                          <span className="original-price">{formatPrice(agentPlusProduct.originalPrice)}</span>
                        )}
                        <span className="price">{formatPrice(agentPlusProduct.price)}</span>
                        <span className="period">/{agentPlusProduct.period}</span>
                      </div>
                      <ul className="membership-tier-features">
                        <li>AI 3D角色生成</li>
                        <li>实时反思</li>
                        <li>工具调用能力</li>
                        <li>角色进化全解锁</li>
                        <li>无限AI额度</li>
                      </ul>
                      <button className="membership-tier-button" style={{ background: '#8b5cf6' }} onClick={() => agentPlusProduct && handleSubscribe(agentPlusProduct)}>立即订阅</button>
                    </div>
                  )}
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

              <section className="membership-benefits-section">
                <h3>权益对比</h3>
                <table className="membership-benefits-table">
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

              <section className="membership-orders-section">
                <h3>订单记录</h3>
                {userOrders.length === 0 ? (
                  <p className="membership-orders-empty">暂无订单记录</p>
                ) : (
                  <div className="membership-orders-list">
                    {userOrders.map((order) => (
                      <div className="membership-order-item" key={order.id}>
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
    </main>
  )
}
