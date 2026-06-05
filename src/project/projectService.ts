export interface Project {
  id: string
  name: string
  description: string
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  startDate: string
  deadline: string
  progress: number
  tags: string[]
  createdAt: string
}

export interface Milestone {
  id: string
  projectId: string
  title: string
  dueDate: string
  completed: boolean
  completedAt?: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  createdAt: string
}

export interface ProjectState {
  projects: Project[]
  milestones: Milestone[]
  tasks: Task[]
}

const STORAGE_KEY = 'xinghuanhai-project-state'

const PROJECT_CATEGORIES = ['工作', '学习', '个人', '团队', '其他']

export const projectCategories = PROJECT_CATEGORIES

function loadState(): ProjectState {
  if (typeof window === 'undefined') return { projects: [], milestones: [], tasks: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { projects: [], milestones: [], tasks: [] }
}

function saveState(state: ProjectState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export interface ProjectService {
  getState(): ProjectState
  addProject(name: string, description: string, deadline: string, priority?: Project['priority']): Project
  updateProject(id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'status' | 'priority' | 'progress' | 'deadline'>>): void
  removeProject(id: string): void
  addMilestone(projectId: string, title: string, dueDate: string): Milestone
  toggleMilestone(milestoneId: string): void
  removeMilestone(milestoneId: string): void
  addTask(projectId: string, title: string, description?: string, priority?: Task['priority'], dueDate?: string): Task
  updateTaskStatus(taskId: string, status: Task['status']): void
  removeTask(taskId: string): void
  getProjectStats(projectId: string): { totalTasks: number; completedTasks: number; totalMilestones: number; completedMilestones: number; progress: number }
}

export function createProjectService(): ProjectService {
  const getState = (): ProjectState => loadState()

  const save = (state: ProjectState): void => saveState(state)

  const addProject = (name: string, description: string, deadline: string, priority: Project['priority'] = 'medium'): Project => {
    const state = getState()
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      status: 'planning',
      priority,
      startDate: new Date().toISOString().split('T')[0],
      deadline,
      progress: 0,
      tags: [],
      createdAt: new Date().toISOString()
    }
    save({ ...state, projects: [...state.projects, project] })
    return project
  }

  const updateProject = (id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'status' | 'priority' | 'progress' | 'deadline'>>): void => {
    const state = getState()
    save({
      ...state,
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p))
    })
  }

  const removeProject = (id: string): void => {
    const state = getState()
    save({
      ...state,
      projects: state.projects.filter((p) => p.id !== id),
      milestones: state.milestones.filter((m) => m.projectId !== id),
      tasks: state.tasks.filter((t) => t.projectId !== id)
    })
  }

  const addMilestone = (projectId: string, title: string, dueDate: string): Milestone => {
    const state = getState()
    const milestone: Milestone = {
      id: crypto.randomUUID(),
      projectId,
      title,
      dueDate,
      completed: false
    }
    save({ ...state, milestones: [...state.milestones, milestone] })
    return milestone
  }

  const toggleMilestone = (milestoneId: string): void => {
    const state = getState()
    save({
      ...state,
      milestones: state.milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined }
          : m
      )
    })
  }

  const removeMilestone = (milestoneId: string): void => {
    const state = getState()
    save({ ...state, milestones: state.milestones.filter((m) => m.id !== milestoneId) })
  }

  const addTask = (projectId: string, title: string, description: string = '', priority: Task['priority'] = 'medium', dueDate?: string): Task => {
    const state = getState()
    const task: Task = {
      id: crypto.randomUUID(),
      projectId,
      title,
      description,
      status: 'todo',
      priority,
      dueDate,
      createdAt: new Date().toISOString()
    }
    save({ ...state, tasks: [...state.tasks, task] })
    return task
  }

  const updateTaskStatus = (taskId: string, status: Task['status']): void => {
    const state = getState()
    save({
      ...state,
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t))
    })
  }

  const removeTask = (taskId: string): void => {
    const state = getState()
    save({ ...state, tasks: state.tasks.filter((t) => t.id !== taskId) })
  }

  const getProjectStats = (projectId: string) => {
    const state = getState()
    const tasks = state.tasks.filter((t) => t.projectId === projectId)
    const milestones = state.milestones.filter((m) => m.projectId === projectId)
    const completedTasks = tasks.filter((t) => t.status === 'done').length
    const completedMilestones = milestones.filter((m) => m.completed).length

    return {
      totalTasks: tasks.length,
      completedTasks,
      totalMilestones: milestones.length,
      completedMilestones,
      progress: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
    }
  }

  return {
    getState,
    addProject,
    updateProject,
    removeProject,
    addMilestone,
    toggleMilestone,
    removeMilestone,
    addTask,
    updateTaskStatus,
    removeTask,
    getProjectStats
  }
}