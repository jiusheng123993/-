export interface TaskTemplate {
  id: string
  name: string
  tasks: { title: string; minutes: number }[]
  category: string
  usageCount: number
  createdAt: string
}

const STORAGE_KEY = 'xinghuanhai-task-templates-state'

function loadState(): TaskTemplate[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveState(templates: TaskTemplate[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

const defaultTemplates: TaskTemplate[] = [
  {
    id: 'default-1',
    name: '每日晨间',
    category: 'daily',
    usageCount: 0,
    createdAt: new Date().toISOString(),
    tasks: [
      { title: '晨间运动', minutes: 30 },
      { title: '早餐准备', minutes: 15 },
      { title: '晨间复盘', minutes: 10 }
    ]
  },
  {
    id: 'default-2',
    name: '周末学习',
    category: 'study',
    usageCount: 0,
    createdAt: new Date().toISOString(),
    tasks: [
      { title: '英语学习', minutes: 60 },
      { title: '专业阅读', minutes: 90 },
      { title: '笔记整理', minutes: 30 }
    ]
  },
  {
    id: 'default-3',
    name: '项目启动',
    category: 'work',
    usageCount: 0,
    createdAt: new Date().toISOString(),
    tasks: [
      { title: '需求分析', minutes: 60 },
      { title: '任务拆分', minutes: 30 },
      { title: '计划制定', minutes: 20 }
    ]
  }
]

export interface TemplateService {
  getTemplates(): TaskTemplate[]
  createTemplate(name: string, tasks: { title: string; minutes: number }[], category: string): TaskTemplate
  deleteTemplate(id: string): void
  useTemplate(id: string): { title: string; minutes: number }[]
}

export function createTemplateService(): TemplateService {
  const getTemplates = (): TaskTemplate[] => {
    const saved = loadState()
    if (saved.length === 0) {
      saveState(defaultTemplates)
      return defaultTemplates
    }
    return saved
  }

  const createTemplate = (name: string, tasks: { title: string; minutes: number }[], category: string): TaskTemplate => {
    const templates = getTemplates()
    const template: TaskTemplate = {
      id: crypto.randomUUID(),
      name,
      tasks,
      category,
      usageCount: 0,
      createdAt: new Date().toISOString()
    }
    saveState([template, ...templates])
    return template
  }

  const deleteTemplate = (id: string): void => {
    saveState(getTemplates().filter((t) => t.id !== id))
  }

  const useTemplate = (id: string): { title: string; minutes: number }[] => {
    const templates = getTemplates()
    const template = templates.find((t) => t.id === id)
    if (template) {
      saveState(templates.map((t) => (t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t)))
      return template.tasks
    }
    return []
  }

  return { getTemplates, createTemplate, deleteTemplate, useTemplate }
}