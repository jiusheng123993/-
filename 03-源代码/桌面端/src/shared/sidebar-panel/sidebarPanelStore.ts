import type { SidebarPanelModule, SidebarPanelModuleId } from './types'

const STORAGE_KEY = 'xinghuanhai-sidebar-panel'

export const SIDEBAR_PANEL_MODULES: SidebarPanelModule[] = [
  {
    id: 'side-focus-dashboard',
    title: '专注仪表',
    icon: '⏱️',
    description: '环形进度条 + 番茄钟计时',
    personaIds: ['exam-student', 'office-worker', 'creator', 'self-growth', 'grad-exam', 'civil-service', 'cert-exam', 'english-cet']
  },
  {
    id: 'side-daily-pulse',
    title: '今日脉搏',
    icon: '📊',
    description: '今日关键数据聚合卡片',
    personaIds: ['exam-student', 'office-worker', 'creator', 'self-growth', 'grad-exam', 'civil-service', 'cert-exam', 'english-cet']
  },
  {
    id: 'side-habits',
    title: '微习惯打卡',
    icon: '✅',
    description: '今日待打卡习惯，点击即打卡',
    personaIds: ['self-growth']
  },
  {
    id: 'side-quick-notes',
    title: '灵感一闪',
    icon: '💡',
    description: '快速记录想法，输入即保存',
    personaIds: ['creator']
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
  'exam-student': ['side-focus-dashboard', 'side-daily-pulse', 'side-daily-quote'],
  'grad-exam': ['side-focus-dashboard', 'side-daily-pulse', 'side-daily-quote'],
  'civil-service': ['side-focus-dashboard', 'side-daily-pulse', 'side-daily-quote'],
  'cert-exam': ['side-focus-dashboard', 'side-daily-pulse', 'side-daily-quote'],
  'english-cet': ['side-focus-dashboard', 'side-daily-pulse', 'side-daily-quote'],
  'office-worker': ['side-focus-dashboard', 'side-daily-pulse', 'side-daily-quote'],
  'creator': ['side-focus-dashboard', 'side-daily-pulse', 'side-quick-notes', 'side-daily-quote'],
  'self-growth': ['side-focus-dashboard', 'side-daily-pulse', 'side-habits', 'side-daily-quote']
}

export function loadSidebarPanelState(personaId: string): SidebarPanelModuleId[] {
  if (typeof window === 'undefined') return PERSONA_DEFAULT_SIDEBAR_MODULES[personaId] ?? ['side-focus-dashboard', 'side-daily-pulse']
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}-${personaId}`)
    if (raw) {
      const ids = JSON.parse(raw) as SidebarPanelModuleId[]
      if (ids.length > 0) return ids
    }
  } catch { /* ignore */ }
  return PERSONA_DEFAULT_SIDEBAR_MODULES[personaId] ?? ['side-focus-dashboard', 'side-daily-pulse']
}

export function saveSidebarPanelState(personaId: string, moduleIds: SidebarPanelModuleId[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(`${STORAGE_KEY}-${personaId}`, JSON.stringify(moduleIds))
}
