import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Clock3,
  Flame,
  LineChart,
  Minus,
  MonitorSmartphone,
  Palette,
  Plus,
  Sparkles,
  Target,
  Trophy
} from 'lucide-react'
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

const navigationItems = [
  { label: '首页仪表盘', icon: LineChart },
  { label: '学习目标', icon: Target },
  { label: '办公行动', icon: Briefcase },
  { label: '每日打卡', icon: Flame },
  { label: '番茄专注', icon: Clock3 },
  { label: '知识笔记', icon: BookOpen },
  { label: '复盘提醒', icon: Brain },
  { label: '数据统计', icon: Trophy },
  { label: '主题中心', icon: Palette }
]

const personaWorkspaceMap: Record<PersonaId, WorkspaceType> = {
  'exam-student': 'study',
  'office-worker': 'work',
  creator: 'growth',
  'self-growth': 'growth'
}

const store = typeof window === 'undefined' ? undefined : createBrowserWorkspaceStore()

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
}) => (
  <button
    className={theme.id === activeThemeId ? 'theme-option selected' : 'theme-option'}
    key={theme.id}
    onClick={() => onSelect(theme.id)}
    style={{
      background: theme.tokens.colors.surfaceStrong,
      borderColor: theme.tokens.colors.border,
      color: theme.tokens.colors.primary
    }}
    type="button"
  >
    <span className="theme-option-name">{theme.name}</span>
    <span className="theme-swatch-row" aria-hidden="true">
      <span className="theme-swatch" style={{ background: theme.tokens.colors.primary }} />
      <span className="theme-swatch" style={{ background: theme.tokens.colors.secondary }} />
      <span className="theme-swatch" style={{ background: theme.tokens.colors.accent }} />
    </span>
  </button>
)

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

    return normalizedThemeSearch.length === 0 || searchableText.includes(normalizedThemeSearch)
  })

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
            return (
              <button className={index === 0 ? 'nav-item active' : 'nav-item'} key={item.label} type="button">
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

          <section className="growth-card card" style={{ background: activeTheme.tokens.gradients.card }}>
            <p className="eyebrow">Growth RPG</p>
            <h2>Lv. {workspaceState.growth.level}</h2>
            <p>完成学习、办公和成长行动都会沉淀经验。</p>
            <div className="xp-track"><span /></div>
            <strong>{workspaceState.growth.achievements} 个成就 · {workspaceState.growth.experience} XP</strong>
          </section>

          <section className="card focus-brief-card" aria-label="桌面专注概览">
            <div className="card-heading compact"><h2>桌面专注概览</h2><Clock3 size={20} /></div>
            <div className="focus-brief-ring" style={{ '--focus-progress': `${weeklyProgress}%` } as CSSProperties}>
              <strong>{weeklyProgress}%</strong>
              <span>完成率</span>
            </div>
            <div className="focus-brief-meta">
              <span>{todoTasks.length} 个待办</span>
              <span>{totalFocusMinutes} 分钟</span>
              <span>{completedTasks.length} 个已完成</span>
            </div>
          </section>

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
        </div>
      </section>

      <aside className="today-panel">
        <section className="panel side-card">
          <h2>今日行动</h2>
          <div className="today-list">
            {todoTasks.map((task) => (
              <article key={task.id}><span /><div><strong>{task.title}</strong><small>{task.dueLabel} · {task.minutes} 分钟</small></div></article>
            ))}
          </div>
        </section>

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

        <section className="panel side-card theme-center">
          <div className="card-heading compact"><h2>主题中心</h2><Sparkles size={20} /></div>
          <p>后期可继续新增学习、办公、游戏化和品牌主题包。</p>
          <div className="design-note">
            <span>设计定位</span>
            <strong>{activeTheme.design.tone}</strong>
            <small>{activeTheme.design.principle}</small>
          </div>
          <button className="theme-recommend-button" onClick={restorePersonaTheme} type="button">
            恢复场景推荐主题
          </button>
          <button className="theme-picker-button" onClick={openThemePicker} type="button">
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
      </aside>

      {isThemePickerOpen && (
        <div className="theme-modal-backdrop" onClick={closeThemePicker} role="presentation">
          <section aria-modal="true" className="theme-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="主题库">
            <div className="theme-modal-header">
              <div>
                <p className="eyebrow">Theme Library</p>
                <h2>主题库</h2>
                <small>上下滑动浏览全部主题，输入关键词可快速定位。</small>
              </div>
              <button className="theme-modal-close" onClick={closeThemePicker} type="button" aria-label="关闭主题库">
                ×
              </button>
            </div>
            <label className="theme-search">
              <span>搜索主题</span>
              <input
                aria-label="搜索主题"
                onChange={(event) => setThemeSearchQuery(event.target.value)}
                placeholder="搜索多巴胺、薄荷、水墨、夜间..."
                type="search"
                value={themeSearchQuery}
              />
            </label>
            <div className="theme-family-summary" aria-label="主题分类概览">
              {themeFamilies.map((family) => (
                <span key={family.aesthetic}>{family.label} {family.themes.length}</span>
              ))}
            </div>
            <div className="theme-modal-list" aria-label="主题列表">
              {filteredThemes.map((theme) => (
                <ThemeOptionButton activeThemeId={activeTheme.id} key={theme.id} onSelect={switchTheme} theme={theme} />
              ))}
              {filteredThemes.length === 0 && (
                <div className="theme-empty-state">
                  <strong>没有找到匹配主题</strong>
                  <small>换个关键词试试，例如：多巴胺、水墨、商务、夜间。</small>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
