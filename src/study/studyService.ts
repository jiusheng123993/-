import type {
  StudyGoal,
  StudyTask,
  StudyNote,
  ReviewItem,
  StudyState,
  StudyStore
} from '../data/localStudyStore'
import { createInitialStudyState, createBrowserStudyStore } from '../data/localStudyStore'

export interface StudyService {
  getState(): StudyState
  addGoal(title: string, subject: string, targetDate: string): StudyGoal
  updateGoalProgress(goalId: string, progress: number): void
  removeGoal(goalId: string): void
  addTask(title: string, goalId: string, minutes: number): StudyTask
  toggleTask(taskId: string): void
  removeTask(taskId: string): void
  addNote(title: string, subject: string): StudyNote
  removeNote(noteId: string): void
  addReviewItem(title: string, subject: string, dueDate: string, level: 'easy' | 'medium' | 'hard'): ReviewItem
  removeReviewItem(reviewId: string): void
  getOverallProgress(): { totalGoals: number; avgProgress: number; completedTasks: number; totalTasks: number; reviewDueCount: number }
}

export function createStudyService(store?: StudyStore): StudyService {
  const storage = store ?? createBrowserStudyStore()

  const getState = (): StudyState => storage.load()

  const saveState = (state: StudyState): void => {
    storage.save(state)
  }

  const addGoal = (title: string, subject: string, targetDate: string): StudyGoal => {
    const state = getState()
    const goal: StudyGoal = {
      id: crypto.randomUUID(),
      title,
      subject,
      targetDate,
      progress: 0
    }
    saveState({ ...state, goals: [...state.goals, goal] })
    return goal
  }

  const updateGoalProgress = (goalId: string, progress: number): void => {
    const state = getState()
    const goals = state.goals.map((g) =>
      g.id === goalId ? { ...g, progress: Math.max(0, Math.min(100, progress)) } : g
    )
    saveState({ ...state, goals })
  }

  const removeGoal = (goalId: string): void => {
    const state = getState()
    const goals = state.goals.filter((g) => g.id !== goalId)
    const tasks = state.tasks.filter((t) => t.goalId !== goalId)
    saveState({ ...state, goals, tasks })
  }

  const addTask = (title: string, goalId: string, minutes: number): StudyTask => {
    const state = getState()
    const task: StudyTask = {
      id: crypto.randomUUID(),
      title,
      goalId,
      status: 'todo',
      minutes,
      rewardPoints: minutes
    }
    saveState({ ...state, tasks: [...state.tasks, task] })
    return task
  }

  const toggleTask = (taskId: string): void => {
    const state = getState()
    const tasks = state.tasks.map((t) =>
      t.id === taskId ? { ...t, status: t.status === 'todo' ? ('done' as const) : ('todo' as const) } : t
    )
    saveState({ ...state, tasks })
  }

  const removeTask = (taskId: string): void => {
    const state = getState()
    const tasks = state.tasks.filter((t) => t.id !== taskId)
    saveState({ ...state, tasks })
  }

  const addNote = (title: string, subject: string): StudyNote => {
    const state = getState()
    const note: StudyNote = {
      id: crypto.randomUUID(),
      title,
      subject,
      updatedAt: new Date().toISOString()
    }
    saveState({ ...state, notes: [...state.notes, note] })
    return note
  }

  const removeNote = (noteId: string): void => {
    const state = getState()
    const notes = state.notes.filter((n) => n.id !== noteId)
    saveState({ ...state, notes })
  }

  const addReviewItem = (title: string, subject: string, dueDate: string, level: 'easy' | 'medium' | 'hard'): ReviewItem => {
    const state = getState()
    const item: ReviewItem = {
      id: crypto.randomUUID(),
      title,
      subject,
      dueDate,
      level
    }
    saveState({ ...state, reviews: [...state.reviews, item] })
    return item
  }

  const removeReviewItem = (reviewId: string): void => {
    const state = getState()
    const reviews = state.reviews.filter((r) => r.id !== reviewId)
    saveState({ ...state, reviews })
  }

  const getOverallProgress = (): { totalGoals: number; avgProgress: number; completedTasks: number; totalTasks: number; reviewDueCount: number } => {
    const state = getState()
    const totalGoals = state.goals.length
    const avgProgress = totalGoals > 0
      ? Math.round(state.goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals)
      : 0
    const totalTasks = state.tasks.length
    const completedTasks = state.tasks.filter((t) => t.status === 'done').length
    const today = new Date().toISOString().slice(0, 10)
    const reviewDueCount = state.reviews.filter((r) => r.dueDate <= today).length

    return { totalGoals, avgProgress, completedTasks, totalTasks, reviewDueCount }
  }

  return {
    getState,
    addGoal,
    updateGoalProgress,
    removeGoal,
    addTask,
    toggleTask,
    removeTask,
    addNote,
    removeNote,
    addReviewItem,
    removeReviewItem,
    getOverallProgress
  }
}
