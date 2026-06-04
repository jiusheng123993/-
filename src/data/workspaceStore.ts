import type { PersonaId } from '../personas/personaRegistry'
import type { ThemeId } from '../themes/themeRegistry'
import type { FocusBriefStyleId } from '../components/focusBrief/types'
import type { WallpaperConfig as WallpaperRenderConfig } from '../wallpaper/wallpaperConfig'
import type { MemoryProfile } from '../memory/memoryTypes'

export type WorkspaceType = 'study' | 'work' | 'growth'

export type WorkspaceGoal = {
  id: string
  title: string
  area: string
  targetDate: string
  progress: number
  workspaceType: WorkspaceType
}

export type WorkspaceTask = {
  id: string
  title: string
  goalId: string
  workspaceType: WorkspaceType
  status: 'todo' | 'done'
  minutes: number
  rewardPoints: number
  source: 'manual' | 'ai' | 'meeting' | 'review'
  dueLabel: string
}

export type WorkspaceNote = {
  id: string
  title: string
  area: string
  workspaceType: WorkspaceType
  updatedAt: string
}

export type ReviewItem = {
  id: string
  title: string
  area: string
  dueDate: string
  level: 'easy' | 'medium' | 'hard'
}

export type ActionItem = {
  id: string
  title: string
  workspaceType: WorkspaceType
  owner: string
  dueLabel: string
  status: 'todo' | 'done'
}

export type GrowthState = {
  level: number
  experience: number
  streakDays: number
  achievements: number
}

export type AiSettings = {
  enabled: boolean
  providerId: 'deepseek' | 'openai' | 'tongyi' | 'doubao' | 'local'
  status: 'not-configured' | 'ready'
}

export type SyncSettings = {
  mode: 'local-first'
  status: 'local-only' | 'sync-ready'
}

export type ThemeMode = 'persona-recommended' | 'manual'

export type FocusSessionRecord = {
  id: string
  taskId: string
  taskTitle: string
  workspaceType: WorkspaceType
  minutes: number
  rewardPoints: number
  completedAt: string
}

export type WorkspaceState = {
  goals: WorkspaceGoal[]
  tasks: WorkspaceTask[]
  notes: WorkspaceNote[]
  reviews: ReviewItem[]
  actionItems: ActionItem[]
  growth: GrowthState
  focusSessions: FocusSessionRecord[]
  memoryProfile: MemoryProfile
  preferences: {
    themeId: ThemeId
    themeMode: ThemeMode
    activeWorkspace: WorkspaceType
    activePersona: PersonaId
    focusBriefStyle?: FocusBriefStyleId
    wallpaperConfig?: WallpaperRenderConfig
  }
  integrations: {
    ai: AiSettings
  }
  sync: SyncSettings
}

export type WorkspaceStore = {
  load: () => WorkspaceState
  save: (state: WorkspaceState) => void
}

type LegacyStudyState = {
  goals?: Array<{ id: string; title: string; subject: string; targetDate: string; progress: number }>
  tasks?: Array<{ id: string; title: string; goalId: string; status: 'todo' | 'done'; minutes: number; rewardPoints: number }>
  notes?: Array<{ id: string; title: string; subject: string; updatedAt: string }>
  reviews?: Array<{ id: string; title: string; subject: string; dueDate: string; level: 'easy' | 'medium' | 'hard' }>
  growth?: GrowthState
  preferences?: { themeId?: ThemeId }
}

export const createInitialWorkspaceState = (): WorkspaceState => ({
  goals: [
    {
      id: 'goal-math',
      title: '高数期末冲刺',
      area: '高数',
      targetDate: '2026-06-20',
      progress: 72,
      workspaceType: 'study'
    },
    {
      id: 'goal-english',
      title: '英语四级词汇计划',
      area: '英语',
      targetDate: '2026-07-01',
      progress: 48,
      workspaceType: 'study'
    },
    {
      id: 'goal-office',
      title: '项目方案与周报闭环',
      area: '办公',
      targetDate: '2026-06-14',
      progress: 56,
      workspaceType: 'work'
    },
    {
      id: 'goal-growth',
      title: '稳定行动系统养成',
      area: '成长',
      targetDate: '2026-07-31',
      progress: 38,
      workspaceType: 'growth'
    }
  ],
  tasks: [
    {
      id: 'task-1',
      title: '完成高数极限专题 20 题',
      goalId: 'goal-math',
      workspaceType: 'study',
      status: 'todo',
      minutes: 60,
      rewardPoints: 60,
      source: 'manual',
      dueLabel: '今天'
    },
    {
      id: 'task-2',
      title: '背诵四级核心词 80 个',
      goalId: 'goal-english',
      workspaceType: 'study',
      status: 'todo',
      minutes: 35,
      rewardPoints: 45,
      source: 'review',
      dueLabel: '今晚'
    },
    {
      id: 'task-3',
      title: '整理今天的错题复盘',
      goalId: 'goal-math',
      workspaceType: 'study',
      status: 'done',
      minutes: 25,
      rewardPoints: 35,
      source: 'manual',
      dueLabel: '已完成'
    },
    {
      id: 'task-4',
      title: '补齐项目首页结构说明',
      goalId: 'goal-office',
      workspaceType: 'work',
      status: 'todo',
      minutes: 45,
      rewardPoints: 50,
      source: 'meeting',
      dueLabel: '周三前'
    },
    {
      id: 'task-5',
      title: '整理本周工作日志素材',
      goalId: 'goal-office',
      workspaceType: 'work',
      status: 'todo',
      minutes: 30,
      rewardPoints: 35,
      source: 'ai',
      dueLabel: '周五'
    },
    {
      id: 'task-6',
      title: '晚间 10 分钟行动复盘',
      goalId: 'goal-growth',
      workspaceType: 'growth',
      status: 'todo',
      minutes: 10,
      rewardPoints: 20,
      source: 'ai',
      dueLabel: '睡前'
    }
  ],
  notes: [
    {
      id: 'note-1',
      title: '导数应用易错点',
      area: '高数',
      workspaceType: 'study',
      updatedAt: '今天 18:20'
    },
    {
      id: 'note-2',
      title: '作文万能句复盘',
      area: '英语',
      workspaceType: 'study',
      updatedAt: '昨天 21:10'
    },
    {
      id: 'note-3',
      title: '产品同步会行动摘录',
      area: '会议',
      workspaceType: 'work',
      updatedAt: '今天 16:40'
    },
    {
      id: 'note-4',
      title: '本周能量与时间分配观察',
      area: '复盘',
      workspaceType: 'growth',
      updatedAt: '今天 22:00'
    }
  ],
  reviews: [
    {
      id: 'review-1',
      title: '洛必达法则适用条件',
      area: '高数',
      dueDate: '今天',
      level: 'hard'
    },
    {
      id: 'review-2',
      title: '近义词辨析 abandon / desert',
      area: '英语',
      dueDate: '明天',
      level: 'medium'
    }
  ],
  actionItems: [
    {
      id: 'action-1',
      title: '确认首页工作区信息架构',
      workspaceType: 'work',
      owner: '产品',
      dueLabel: '周三前',
      status: 'todo'
    },
    {
      id: 'action-2',
      title: '评估 AI Provider 接入方案',
      workspaceType: 'work',
      owner: '开发',
      dueLabel: '本周',
      status: 'todo'
    },
    {
      id: 'action-3',
      title: '把未完成任务迁移到明日计划',
      workspaceType: 'growth',
      owner: '自己',
      dueLabel: '今晚',
      status: 'todo'
    }
  ],
  growth: {
    level: 18,
    experience: 1260,
    streakDays: 12,
    achievements: 23
  },
  focusSessions: [],
  memoryProfile: {
    version: 1,
    scope: { userId: '', projectId: 'default' },
    identity: {
      nickname: '',
      ageGroup: 'adult',
      occupation: '',
      currentRole: '',
      organization: '',
      lifeStage: ''
    },
    personality: {
      mbtiTendency: 'unknown',
      workStyle: 'mixed',
      planningStyle: 'adaptive',
      motivationStyle: 'growth',
      feedbackStyle: 'gentle',
      stressResponse: 'need_break',
      selfDescription: '',
      traits: []
    },
    rhythm: {
      energyPeak: 'morning',
      typicalStudyHours: '',
      sleepPattern: 'stable',
      preferredSessionLength: 25,
      breakPreference: 'pomodoro_25',
      weeklyActiveDays: 5
    },
    goals: {
      primaryGoal: '',
      secondaryGoals: [],
      targetExams: [],
      targetDate: '',
      careerDirection: ''
    },
    preferences: {
      encouragementStyle: 'coach',
      reminderFrequency: 'medium',
      detailLevel: 'moderate',
      languageStyle: 'casual'
    },
    boundaries: {
      tabooTopics: [],
      triggerWords: [],
      dontMention: [],
      sensitiveAreas: []
    },
    learning: {
      strongSubjects: [],
      weakSubjects: [],
      learningStyle: 'visual',
      commonBlockers: [],
      effectiveStrategies: []
    },
    emotional: {
      currentMoodTrend: 'stable',
      motivationLevel: 'medium',
      supportNeeds: [],
      recentWins: []
    },
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastReflectionAt: undefined,
      totalEventsProcessed: 0,
      sourceBreakdown: {
        manual: 0,
        conversation: 0,
        behavior: 0
      }
    }
  },
  preferences: {
    themeId: 'minimal-premium',
    themeMode: 'persona-recommended',
    activeWorkspace: 'study',
    activePersona: 'exam-student',
    focusBriefStyle: 'minimal-arc',
    wallpaperConfig: undefined
  },
  integrations: {
    ai: {
      enabled: false,
      providerId: 'deepseek',
      status: 'not-configured'
    }
  },
  sync: {
    mode: 'local-first',
    status: 'local-only'
  }
})

export const migrateLegacyStudyState = (legacyState: LegacyStudyState): WorkspaceState => {
  const fallback = createInitialWorkspaceState()

  return {
    ...fallback,
    goals: legacyState.goals?.map((goal) => ({
      id: goal.id,
      title: goal.title,
      area: goal.subject,
      targetDate: goal.targetDate,
      progress: goal.progress,
      workspaceType: 'study'
    })) ?? fallback.goals,
    tasks: legacyState.tasks?.map((task) => ({
      ...task,
      workspaceType: 'study',
      source: 'manual',
      dueLabel: task.status === 'done' ? '已完成' : '今天'
    })) ?? fallback.tasks,
    notes: legacyState.notes?.map((note) => ({
      id: note.id,
      title: note.title,
      area: note.subject,
      workspaceType: 'study',
      updatedAt: note.updatedAt
    })) ?? fallback.notes,
    reviews: legacyState.reviews?.map((review) => ({
      id: review.id,
      title: review.title,
      area: review.subject,
      dueDate: review.dueDate,
      level: review.level
    })) ?? fallback.reviews,
    growth: legacyState.growth ?? fallback.growth,
    preferences: {
      themeId: legacyState.preferences?.themeId ?? fallback.preferences.themeId,
      themeMode: legacyState.preferences?.themeId ? 'manual' : fallback.preferences.themeMode,
      activeWorkspace: 'study',
      activePersona: 'exam-student',
      wallpaperConfig: undefined
    }
  }
}

const isWorkspaceState = (state: unknown): state is WorkspaceState => {
  if (!state || typeof state !== 'object') return false
  const candidate = state as Partial<WorkspaceState>
  return Array.isArray(candidate.goals) && Array.isArray(candidate.tasks) && Boolean(candidate.preferences?.activeWorkspace)
}

const normalizeWorkspaceState = (state: WorkspaceState): WorkspaceState => {
  const defaults = createInitialWorkspaceState()
  return {
    ...state,
    focusSessions: Array.isArray(state.focusSessions) ? state.focusSessions : [],
    memoryProfile: state.memoryProfile ?? defaults.memoryProfile,
    preferences: {
      ...state.preferences,
      themeMode: state.preferences.themeMode ?? 'manual',
      focusBriefStyle: state.preferences.focusBriefStyle ?? 'minimal-arc',
      wallpaperConfig: state.preferences.wallpaperConfig
    }
  }
}

export const createMemoryWorkspaceStore = (initialState = createInitialWorkspaceState()): WorkspaceStore => {
  let state = structuredClone(initialState)

  return {
    load: () => normalizeWorkspaceState(structuredClone(state)),
    save: (nextState) => {
      state = normalizeWorkspaceState(structuredClone(nextState))
    }
  }
}

export const createBrowserWorkspaceStore = (
  storageKey = 'growth-workbench-state',
  legacyStorageKey = 'studyflow-state'
): WorkspaceStore => ({
  load: () => {
    const stored = window.localStorage.getItem(storageKey)
    if (stored) {
      const parsed = JSON.parse(stored) as unknown
      return isWorkspaceState(parsed) ? normalizeWorkspaceState(parsed) : migrateLegacyStudyState(parsed as LegacyStudyState)
    }

    const legacyStored = window.localStorage.getItem(legacyStorageKey)
    if (legacyStored) {
      return migrateLegacyStudyState(JSON.parse(legacyStored) as LegacyStudyState)
    }

    return createInitialWorkspaceState()
  },
  save: (state) => {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  }
})
