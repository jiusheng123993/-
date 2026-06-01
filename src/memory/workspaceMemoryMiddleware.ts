import type { WorkspaceState, WorkspaceStore, WorkspaceTask } from '../data/workspaceStore'
import type { MemoryObserver } from './memoryObserver'

const taskById = (tasks: WorkspaceTask[]) => new Map(tasks.map((task) => [task.id, task]))

const isDelayedLabel = (dueLabel: string) => dueLabel.includes('延期') || dueLabel.includes('逾期') || dueLabel.includes('延后')

const observeTaskChanges = (previousState: WorkspaceState, nextState: WorkspaceState, observer: MemoryObserver) => {
  const previousTasks = taskById(previousState.tasks)

  nextState.tasks.forEach((nextTask) => {
    const previousTask = previousTasks.get(nextTask.id)
    if (!previousTask) return

    if (previousTask.status === 'todo' && nextTask.status === 'done') {
      observer.onTaskCompleted(nextTask)
      return
    }

    if (nextTask.status === 'todo' && previousTask.dueLabel !== nextTask.dueLabel && isDelayedLabel(nextTask.dueLabel)) {
      observer.onTaskDelayed(nextTask)
    }
  })
}

const observeFocusSessionChanges = (previousState: WorkspaceState, nextState: WorkspaceState, observer: MemoryObserver) => {
  const previousSessionIds = new Set(previousState.focusSessions.map((session) => session.id))
  nextState.focusSessions
    .filter((session) => !previousSessionIds.has(session.id))
    .forEach((session) => observer.onFocusSessionCompleted(session))
}

const hasGoalChanged = (previousGoal: WorkspaceState['goals'][number], nextGoal: WorkspaceState['goals'][number]) =>
  previousGoal.title !== nextGoal.title ||
  previousGoal.area !== nextGoal.area ||
  previousGoal.targetDate !== nextGoal.targetDate ||
  previousGoal.progress !== nextGoal.progress ||
  previousGoal.workspaceType !== nextGoal.workspaceType

const observeGoalChanges = (previousState: WorkspaceState, nextState: WorkspaceState, observer: MemoryObserver) => {
  const previousGoals = new Map(previousState.goals.map((goal) => [goal.id, goal]))
  nextState.goals.forEach((nextGoal) => {
    const previousGoal = previousGoals.get(nextGoal.id)
    if (previousGoal && hasGoalChanged(previousGoal, nextGoal)) observer.onGoalChange(previousGoal, nextGoal)
  })
}

const observeStreakChanges = (previousState: WorkspaceState, nextState: WorkspaceState, observer: MemoryObserver) => {
  const previousStreak = previousState.growth.streakDays
  const nextStreak = nextState.growth.streakDays

  if (previousStreak === nextStreak) return
  if (previousStreak > 0 && nextStreak === 0) {
    observer.onStreakEvent('broken', '连续行动中断')
    return
  }
  if (previousStreak === 0 && nextStreak > 0) {
    observer.onStreakEvent('restored', `连续行动恢复到 ${nextStreak} 天`)
    return
  }
  if (nextStreak > previousStreak) {
    observer.onStreakEvent('milestone', `连续行动 ${nextStreak} 天`)
  }
}

const observeWorkspaceChanges = (previousState: WorkspaceState, nextState: WorkspaceState, observer: MemoryObserver) => {
  observeTaskChanges(previousState, nextState, observer)
  observeFocusSessionChanges(previousState, nextState, observer)
  observeGoalChanges(previousState, nextState, observer)
  observeStreakChanges(previousState, nextState, observer)
}

export const withWorkspaceMemoryObserver = (store: WorkspaceStore, observer: MemoryObserver): WorkspaceStore => ({
  load: store.load,
  save: (nextState) => {
    const previousState = store.load()
    observeWorkspaceChanges(previousState, nextState, observer)
    store.save(nextState)
  }
})
