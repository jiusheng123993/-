export interface Objective {
  id: string
  title: string
  description: string
  category: 'career' | 'learning' | 'health' | 'life' | 'creative' | 'other'
  status: 'active' | 'completed' | 'paused' | 'abandoned'
  priority: 'high' | 'medium' | 'low'
  startDate: string
  targetDate: string
  completedDate?: string
  progress: number
  keyResults: KeyResult[]
  createdAt: string
  updatedAt: string
}

export interface KeyResult {
  id: string
  title: string
  target: number
  current: number
  unit: string
  isCompleted: boolean
}

export interface GoalState {
  objectives: Objective[]
  totalCompleted: number
  totalActive: number
}

export const CATEGORY_OPTIONS: { value: Objective['category']; label: string; icon: string }[] = [
  { value: 'career', label: '职业发展', icon: '💼' },
  { value: 'learning', label: '学习成长', icon: '📚' },
  { value: 'health', label: '健康生活', icon: '💪' },
  { value: 'life', label: '生活品质', icon: '🏠' },
  { value: 'creative', label: '创意创作', icon: '🎨' },
  { value: 'other', label: '其他', icon: '🎯' }
]

export const PRIORITY_OPTIONS: { value: Objective['priority']; label: string; color: string }[] = [
  { value: 'high', label: '高优先级', color: '#ef4444' },
  { value: 'medium', label: '中优先级', color: '#f59e0b' },
  { value: 'low', label: '低优先级', color: '#6b7280' }
]

export interface GoalStore {
  load: () => GoalState
  save: (state: GoalState) => void
}

export function createInitialGoalState(): GoalState {
  return {
    objectives: [],
    totalCompleted: 0,
    totalActive: 0
  }
}

export function createGoalBrowserStore(storageKey = 'goal-state'): GoalStore {
  return {
    load: () => {
      const stored = window.localStorage.getItem(storageKey)
      if (!stored) return createInitialGoalState()
      try {
        return JSON.parse(stored) as GoalState
      } catch {
        return createInitialGoalState()
      }
    },
    save: (state) => {
      window.localStorage.setItem(storageKey, JSON.stringify(state))
    }
  }
}

export function createObjective(
  state: GoalState,
  objective: Omit<Objective, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'keyResults'>
): GoalState {
  const id = `obj-${Date.now()}`
  const now = new Date().toISOString()
  const newObj: Objective = {
    ...objective,
    id,
    progress: 0,
    keyResults: [],
    createdAt: now,
    updatedAt: now
  }

  return {
    ...state,
    objectives: [newObj, ...state.objectives],
    totalActive: state.totalActive + 1
  }
}

export function updateObjective(
  state: GoalState,
  id: string,
  updates: Partial<Omit<Objective, 'id' | 'createdAt'>>
): GoalState {
  const newObjectives = state.objectives.map((obj) =>
    obj.id === id ? { ...obj, ...updates, updatedAt: new Date().toISOString() } : obj
  )

  const newState = { ...state, objectives: newObjectives }
  return recalculateGoalStats(newState)
}

export function deleteObjective(state: GoalState, id: string): GoalState {
  const newObjectives = state.objectives.filter((o) => o.id !== id)
  const newState = { ...state, objectives: newObjectives }
  return recalculateGoalStats(newState)
}

export function addKeyResult(
  state: GoalState,
  objectiveId: string,
  kr: Omit<KeyResult, 'id' | 'isCompleted'>
): GoalState {
  const id = `kr-${Date.now()}`
  const newKr: KeyResult = { ...kr, id, isCompleted: false }

  const newObjectives = state.objectives.map((obj) =>
    obj.id === objectiveId
      ? { ...obj, keyResults: [...obj.keyResults, newKr], updatedAt: new Date().toISOString() }
      : obj
  )

  return recalculateProgress({ ...state, objectives: newObjectives })
}

export function updateKeyResult(
  state: GoalState,
  objectiveId: string,
  krId: string,
  updates: Partial<Pick<KeyResult, 'title' | 'target' | 'current' | 'unit'>>
): GoalState {
  const newObjectives = state.objectives.map((obj) =>
    obj.id === objectiveId
      ? {
          ...obj,
          keyResults: obj.keyResults.map((kr) =>
            kr.id === krId
              ? { ...kr, ...updates, isCompleted: (updates.current ?? kr.current) >= (updates.target ?? kr.target) }
              : kr
          ),
          updatedAt: new Date().toISOString()
        }
      : obj
  )

  return recalculateProgress({ ...state, objectives: newObjectives })
}

export function deleteKeyResult(
  state: GoalState,
  objectiveId: string,
  krId: string
): GoalState {
  const newObjectives = state.objectives.map((obj) =>
    obj.id === objectiveId
      ? { ...obj, keyResults: obj.keyResults.filter((kr) => kr.id !== krId), updatedAt: new Date().toISOString() }
      : obj
  )

  return recalculateProgress({ ...state, objectives: newObjectives })
}

export function completeObjective(state: GoalState, id: string): GoalState {
  return updateObjective(state, id, {
    status: 'completed',
    completedDate: new Date().toISOString(),
    progress: 100
  })
}

export function getObjectiveById(state: GoalState, id: string): Objective | undefined {
  return state.objectives.find((o) => o.id === id)
}

export function getActiveObjectives(state: GoalState): Objective[] {
  return state.objectives.filter((o) => o.status === 'active')
}

export function getObjectivesByCategory(
  state: GoalState,
  category: Objective['category']
): Objective[] {
  return state.objectives.filter((o) => o.category === category)
}

export function getOverallProgress(state: GoalState): number {
  const active = getActiveObjectives(state)
  if (active.length === 0) return 0
  const total = active.reduce((sum, o) => sum + o.progress, 0)
  return Math.round(total / active.length)
}

function recalculateProgress(state: GoalState): GoalState {
  const newObjectives = state.objectives.map((obj) => {
    if (obj.keyResults.length === 0) return obj
    const krProgress = obj.keyResults.reduce((sum, kr) => {
      const krPct = kr.target > 0 ? Math.min(100, (kr.current / kr.target) * 100) : 0
      return sum + krPct
    }, 0)
    const progress = Math.round(krProgress / obj.keyResults.length)

    const allCompleted = obj.keyResults.every((kr) => kr.isCompleted)
    const status = allCompleted ? 'completed' as const : obj.status

    return { ...obj, progress, status, updatedAt: new Date().toISOString() }
  })

  return recalculateGoalStats({ ...state, objectives: newObjectives })
}

function recalculateGoalStats(state: GoalState): GoalState {
  const active = state.objectives.filter((o) => o.status === 'active').length
  const completed = state.objectives.filter((o) => o.status === 'completed').length
  return { ...state, totalActive: active, totalCompleted: completed }
}
