import { createStorageService } from '../../shared/data/storageFactory'

export interface StudyTask {
  id: string
  title: string
  subject: string
  completed: boolean
  completedAt?: string
  estimatedMinutes: number
}

export interface StudyPhase {
  id: string
  name: string
  startDate: string
  endDate: string
  tasks: StudyTask[]
}

export interface TargetScore {
  subject: string
  targetScore: number
  totalScore: number
}

export interface StudyPlan {
  id: string
  name: string
  examDate: string
  targetScores: TargetScore[]
  phases: StudyPhase[]
  aiDailySuggestion?: string
  createdAt: string
}

export interface StudyPlannerState {
  plans: StudyPlan[]
}

export interface PlanProgress {
  totalTasks: number
  completedTasks: number
  completionRate: number
  remainingDays: number
  phaseProgress: { phaseId: string; phaseName: string; total: number; completed: number; rate: number }[]
}

const storage = createStorageService<StudyPlannerState>('xinghuanhai-studyplanner-state', { plans: [] })

export function getStudyPlans(): StudyPlan[] {
  return storage.load().plans
}

export function getStudyPlanById(id: string): StudyPlan | undefined {
  return storage.load().plans.find(p => p.id === id)
}

export function addStudyPlan(plan: Omit<StudyPlan, 'id' | 'createdAt'>): StudyPlan {
  const state = storage.load()
  const newPlan: StudyPlan = {
    ...plan,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  }
  state.plans.unshift(newPlan)
  storage.save(state)
  return newPlan
}

export function updateStudyPlan(id: string, updates: Partial<StudyPlan>): StudyPlan | null {
  const state = storage.load()
  const index = state.plans.findIndex(p => p.id === id)
  if (index === -1) return null
  state.plans[index] = { ...state.plans[index], ...updates }
  storage.save(state)
  return state.plans[index]
}

export function deleteStudyPlan(id: string): boolean {
  const state = storage.load()
  const index = state.plans.findIndex(p => p.id === id)
  if (index === -1) return false
  state.plans.splice(index, 1)
  storage.save(state)
  return true
}

export function addPhase(planId: string, phase: Omit<StudyPhase, 'id'>): StudyPhase | null {
  const state = storage.load()
  const plan = state.plans.find(p => p.id === planId)
  if (!plan) return null
  const newPhase: StudyPhase = { ...phase, id: crypto.randomUUID() }
  plan.phases.push(newPhase)
  storage.save(state)
  return newPhase
}

export function updatePhase(planId: string, phaseId: string, updates: Partial<StudyPhase>): StudyPhase | null {
  const state = storage.load()
  const plan = state.plans.find(p => p.id === planId)
  if (!plan) return null
  const phase = plan.phases.find(p => p.id === phaseId)
  if (!phase) return null
  Object.assign(phase, updates)
  storage.save(state)
  return phase
}

export function deletePhase(planId: string, phaseId: string): boolean {
  const state = storage.load()
  const plan = state.plans.find(p => p.id === planId)
  if (!plan) return false
  const index = plan.phases.findIndex(p => p.id === phaseId)
  if (index === -1) return false
  plan.phases.splice(index, 1)
  storage.save(state)
  return true
}

export function addTask(planId: string, phaseId: string, task: Omit<StudyTask, 'id'>): StudyTask | null {
  const state = storage.load()
  const plan = state.plans.find(p => p.id === planId)
  if (!plan) return null
  const phase = plan.phases.find(p => p.id === phaseId)
  if (!phase) return null
  const newTask: StudyTask = { ...task, id: crypto.randomUUID() }
  phase.tasks.push(newTask)
  storage.save(state)
  return newTask
}

export function updateTask(planId: string, phaseId: string, taskId: string, updates: Partial<StudyTask>): StudyTask | null {
  const state = storage.load()
  const plan = state.plans.find(p => p.id === planId)
  if (!plan) return null
  const phase = plan.phases.find(p => p.id === phaseId)
  if (!phase) return null
  const task = phase.tasks.find(t => t.id === taskId)
  if (!task) return null
  Object.assign(task, updates)
  storage.save(state)
  return task
}

export function deleteTask(planId: string, phaseId: string, taskId: string): boolean {
  const state = storage.load()
  const plan = state.plans.find(p => p.id === planId)
  if (!plan) return false
  const phase = plan.phases.find(p => p.id === phaseId)
  if (!phase) return false
  const index = phase.tasks.findIndex(t => t.id === taskId)
  if (index === -1) return false
  phase.tasks.splice(index, 1)
  storage.save(state)
  return true
}

export function toggleTask(planId: string, phaseId: string, taskId: string): StudyTask | null {
  const state = storage.load()
  const plan = state.plans.find(p => p.id === planId)
  if (!plan) return null
  const phase = plan.phases.find(p => p.id === phaseId)
  if (!phase) return null
  const task = phase.tasks.find(t => t.id === taskId)
  if (!task) return null
  task.completed = !task.completed
  task.completedAt = task.completed ? new Date().toISOString() : undefined
  storage.save(state)
  return task
}

export function getPlanProgress(plan: StudyPlan): PlanProgress {
  let totalTasks = 0
  let completedTasks = 0
  const phaseProgress: PlanProgress['phaseProgress'] = []

  for (const phase of plan.phases) {
    const total = phase.tasks.length
    const completed = phase.tasks.filter(t => t.completed).length
    totalTasks += total
    completedTasks += completed
    phaseProgress.push({
      phaseId: phase.id,
      phaseName: phase.name,
      total,
      completed,
      rate: total > 0 ? completed / total : 0
    })
  }

  const examDate = new Date(plan.examDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffTime = examDate.getTime() - today.getTime()
  const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  return {
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
    remainingDays,
    phaseProgress
  }
}

export function getTodayTasks(plan: StudyPlan): { phaseName: string; task: StudyTask }[] {
  const today = new Date().toISOString().slice(0, 10)
  const result: { phaseName: string; task: StudyTask }[] = []

  for (const phase of plan.phases) {
    if (today < phase.startDate || today > phase.endDate) continue
    for (const task of phase.tasks) {
      result.push({ phaseName: phase.name, task })
    }
  }

  return result
}
