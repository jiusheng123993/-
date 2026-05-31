import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Clock3,
  Flame,
  LineChart,
  MonitorSmartphone,
  Palette,
  Sparkles,
  Target,
  Trophy
} from 'lucide-react'
import { createAiPromptDraft, getAiProviderById } from './ai/aiProvider'
import {
  createBrowserWorkspaceStore,
  createInitialWorkspaceState,
  type WorkspaceState,
  type WorkspaceType
} from './data/workspaceStore'
import { getPersonaById, personaRegistry, type PersonaId } from './personas/personaRegistry'
import { getPersonaTemplateById } from './personas/personaTemplates'
import { getDefaultMiniProgramModules, miniProgramBlueprint } from './platforms/miniProgramBlueprint'
import { getThemeById, themeRegistry, type ThemeAesthetic, type ThemeId, type StudyTheme } from './themes/themeRegistry'

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
  night: '夜间'
}

const themeFamilyOrder: ThemeAesthetic[] = ['minimal', 'dopamine', 'ink', 'chinese', 'anime', 'morandi', 'business', 'night']

const themeFamilies = themeFamilyOrder.map((aesthetic) => ({
  aesthetic,
  label: themeFamilyLabels[aesthetic],
  themes: themeRegistry.filter((theme) => theme.aesthetic === aesthetic)
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
  const activeProvider = getAiProviderById(workspaceState.integrations.ai.providerId)
  const promptDraft = createAiPromptDraft(activeProvider.id, {
    kind: activePersona.aiActions[0],
    input: activePersona.primaryFlow,
    context: `${activePersona.name}：${activePersona.painPoint}`
  })
  const weeklyProgress = visibleTasks.length === 0 ? 0 : Math.round((completedTasks.length / visibleTasks.length) * 100)
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false)
  const [themeSearchQuery, setThemeSearchQuery] = useState('')
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

        <section className="panel side-card timer-card">
          <h2>任务专注</h2>
          <strong>25:00</strong>
          <button type="button">绑定任务开始</button>
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
