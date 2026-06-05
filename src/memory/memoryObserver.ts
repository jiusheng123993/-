import type { FocusSessionRecord, WorkspaceGoal, WorkspaceTask } from '../data/workspaceStore'
import type { MemoryEvent, MemoryKind, MemoryScope, MemoryStore } from './memoryTypes'

type StreakEventType = 'broken' | 'restored' | 'milestone'

type MemoryObserverOptions = {
  scope: MemoryScope
  store: MemoryStore
  now?: () => string
  createId?: () => string
}

export type MemoryObserver = {
  onTaskCompleted: (task: WorkspaceTask) => void
  onTaskDelayed: (task: WorkspaceTask) => void
  onFocusSessionCompleted: (session: FocusSessionRecord) => void
  onPlanDeviation: (expected: string, actual: string) => void
  onScheduleAnomaly: (detectedAt: string, anomalyType: string) => void
  onStreakEvent: (type: StreakEventType, detail: string) => void
  onGoalChange: (oldGoal: WorkspaceGoal, newGoal: WorkspaceGoal) => void
}

const createDefaultId = () => `memory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const defaultNow = () => new Date().toISOString()

const append = (
  options: Required<MemoryObserverOptions>,
  kind: MemoryKind,
  content: string,
  tags: string[],
  category: string,
  confidence = 0.8
) => {
  const timestamp = options.now()
  const event: MemoryEvent = {
    id: options.createId(),
    scope: options.scope,
    kind,
    content,
    source: 'workspace',
    confidence: Math.max(0, Math.min(1, confidence)),
    status: 'active',
    tags,
    createdAt: timestamp,
    updatedAt: timestamp,
    expiresAt: null,
    category,
    summary: content,
    timestamp
  }

  options.store.appendEvent(event)
}

const hasGoalChanged = (oldGoal: WorkspaceGoal, newGoal: WorkspaceGoal) =>
  oldGoal.title !== newGoal.title ||
  oldGoal.area !== newGoal.area ||
  oldGoal.targetDate !== newGoal.targetDate ||
  oldGoal.progress !== newGoal.progress ||
  oldGoal.workspaceType !== newGoal.workspaceType

export const createMemoryObserver = (options: MemoryObserverOptions): MemoryObserver => {
  const resolvedOptions: Required<MemoryObserverOptions> = {
    scope: options.scope,
    store: options.store,
    now: options.now ?? defaultNow,
    createId: options.createId ?? createDefaultId
  }

  return {
    onTaskCompleted: (task) => {
      append(
        resolvedOptions,
        'context',
        `完成任务：${task.title}，获得 ${task.rewardPoints} 积分，预计投入 ${task.minutes} 分钟。`,
        ['task_completed', task.workspaceType, task.source],
        'task_completed',
        0.82
      )
    },
    onTaskDelayed: (task) => {
      append(
        resolvedOptions,
        'context',
        `任务延期：${task.title}，原计划 ${task.dueLabel}，需要重新安排。`,
        ['task_delayed', task.workspaceType, task.source],
        'task_delayed',
        0.76
      )
    },
    onFocusSessionCompleted: (session) => {
      append(
        resolvedOptions,
        'habit',
        `完成 ${session.minutes} 分钟专注：${session.taskTitle}，获得 ${session.rewardPoints} 积分。`,
        ['focus_session', session.workspaceType],
        'focus_completed',
        Math.min(0.95, 0.65 + session.minutes / 200)
      )
    },
    onPlanDeviation: (expected, actual) => {
      if (expected === actual) return
      append(
        resolvedOptions,
        'context',
        `计划偏离：原计划「${expected}」，实际「${actual}」。`,
        ['plan_deviation'],
        'plan_deviation',
        0.78
      )
    },
    onScheduleAnomaly: (detectedAt, anomalyType) => {
      append(
        resolvedOptions,
        'context',
        `作息异常：${anomalyType}，检测时间 ${detectedAt}。`,
        ['schedule_anomaly'],
        'schedule_anomaly',
        0.74
      )
    },
    onStreakEvent: (type, detail) => {
      append(
        resolvedOptions,
        type === 'milestone' || type === 'restored' ? 'habit' : 'context',
        `连续行动事件：${detail}。`,
        [`streak_${type}`],
        `streak_${type}`,
        type === 'milestone' ? 0.88 : 0.8
      )
    },
    onGoalChange: (oldGoal, newGoal) => {
      if (!hasGoalChanged(oldGoal, newGoal)) return
      append(
        resolvedOptions,
        'goal',
        `目标更新：${newGoal.title}，目标进度从 ${oldGoal.progress}% 更新到 ${newGoal.progress}%。`,
        ['goal_change', newGoal.workspaceType],
        'goal_updated',
        newGoal.progress === 100 ? 0.9 : 0.82
      )
    }
  }
}
