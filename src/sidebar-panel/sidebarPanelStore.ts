import type { SidebarPanelModule, SidebarPanelModuleId } from './types'

const STORAGE_KEY = 'xinghuanhai-sidebar-panel'

export const SIDEBAR_PANEL_MODULES: SidebarPanelModule[] = [
  {
    id: 'side-pomodoro',
    title: '番茄钟',
    icon: '⏱️',
    description: '专注计时器，大字号倒计时',
    personaIds: ['exam-student', 'office-worker', 'creator', 'self-growth', 'grad-exam', 'civil-service', 'cert-exam', 'english-cet']
  },
  {
    id: 'side-todo',
    title: '今日待办',
    icon: '📝',
    description: '可勾选待办列表，快速添加',
    personaIds: ['exam-student', 'office-worker', 'creator', 'self-growth', 'grad-exam', 'civil-service', 'cert-exam', 'english-cet']
  },
  {
    id: 'side-streak',
    title: '今日数据',
    icon: '📊',
    description: '今日专注时长、完成任务数',
    personaIds: ['exam-student', 'office-worker', 'creator', 'self-growth', 'grad-exam', 'civil-service', 'cert-exam', 'english-cet']
  },
  {
    id: 'side-countdown',
    title: '考试倒计时',
    icon: '📅',
    description: '距离考试还有 X 天',
    personaIds: ['exam-student', 'grad-exam', 'civil-service', 'cert-exam', 'english-cet']
  },
  {
    id: 'side-subject-progress',
    title: '科目进度',
    icon: '📚',
    description: '各科目学习进度条',
    personaIds: ['exam-student', 'grad-exam', 'civil-service', 'cert-exam', 'english-cet']
  },
  {
    id: 'side-meeting-actions',
    title: '会议行动项',
    icon: '💼',
    description: '待跟进行动项列表',
    personaIds: ['office-worker']
  },
  {
    id: 'side-weekly-materials',
    title: '周报素材',
    icon: '📋',
    description: '本周工作素材计数',
    personaIds: ['office-worker']
  },
  {
    id: 'side-idea-inbox',
    title: '灵感速记',
    icon: '💡',
    description: '快速记录灵感',
    personaIds: ['creator']
  },
  {
    id: 'side-publish-calendar',
    title: '发布日历',
    icon: '📆',
    description: '最近发布计划',
    personaIds: ['creator']
  },
  {
    id: 'side-habits',
    title: '今日习惯',
    icon: '✅',
    description: '今日待打卡习惯列表',
    personaIds: ['self-growth']
  },
  {
    id: 'side-mood',
    title: '心情打卡',
    icon: '😊',
    description: '快捷心情选择',
    personaIds: ['self-growth']
  },
  {
    id: 'side-daily-quote',
    title: '每日一句',
    icon: '💬',
    description: '随机格言语录',
    personaIds: ['exam-student', 'office-worker', 'creator', 'self-growth', 'grad-exam', 'civil-service', 'cert-exam', 'english-cet']
  }
]

export const PERSONA_DEFAULT_SIDEBAR_MODULES: Record<string, SidebarPanelModuleId[]> = {
  'exam-student': ['side-pomodoro', 'side-countdown', 'side-todo', 'side-subject-progress'],
  'grad-exam': ['side-pomodoro', 'side-countdown', 'side-todo', 'side-subject-progress'],
  'civil-service': ['side-pomodoro', 'side-countdown', 'side-todo', 'side-subject-progress'],
  'cert-exam': ['side-pomodoro', 'side-countdown', 'side-todo', 'side-subject-progress'],
  'english-cet': ['side-pomodoro', 'side-countdown', 'side-todo', 'side-subject-progress'],
  'office-worker': ['side-pomodoro', 'side-todo', 'side-meeting-actions', 'side-weekly-materials'],
  'creator': ['side-pomodoro', 'side-todo', 'side-idea-inbox', 'side-publish-calendar'],
  'self-growth': ['side-pomodoro', 'side-habits', 'side-mood', 'side-streak']
}

export function loadSidebarPanelState(personaId: string): SidebarPanelModuleId[] {
  if (typeof window === 'undefined') return PERSONA_DEFAULT_SIDEBAR_MODULES[personaId] ?? ['side-pomodoro', 'side-todo']
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}-${personaId}`)
    if (raw) {
      const ids = JSON.parse(raw) as SidebarPanelModuleId[]
      if (ids.length > 0) return ids
    }
  } catch { /* ignore */ }
  return PERSONA_DEFAULT_SIDEBAR_MODULES[personaId] ?? ['side-pomodoro', 'side-todo']
}

export function saveSidebarPanelState(personaId: string, moduleIds: SidebarPanelModuleId[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(`${STORAGE_KEY}-${personaId}`, JSON.stringify(moduleIds))
}