import { describe, expect, it } from 'vitest'
import { createInMemoryMemoryStore, createInitialMemoryState } from './memoryStore'
import { createMemoryObserver } from './memoryObserver'
import type { MemoryScope } from './memoryTypes'
import type { FocusSessionRecord, WorkspaceGoal, WorkspaceTask } from '../data/workspaceStore'

const fixedNow = '2026-06-01T10:00:00.000Z'

const defaultScope: MemoryScope = {
  userId: 'user-default',
  projectId: 'personal-study-planner'
}

const task: WorkspaceTask = {
  id: 'task-1',
  title: '完成高数极限专题 20 题',
  goalId: 'goal-math',
  workspaceType: 'study',
  status: 'done',
  minutes: 60,
  rewardXp: 60,
  source: 'manual',
  dueLabel: '今天'
}

const focusSession: FocusSessionRecord = {
  id: 'focus-1',
  taskId: 'task-1',
  taskTitle: '完成高数极限专题 20 题',
  workspaceType: 'study',
  minutes: 60,
  rewardXp: 60,
  completedAt: fixedNow
}

const oldGoal: WorkspaceGoal = {
  id: 'goal-math',
  title: '高数期末冲刺',
  area: '高数',
  targetDate: '2026-06-20',
  progress: 72,
  workspaceType: 'study'
}

const newGoal: WorkspaceGoal = {
  ...oldGoal,
  progress: 100
}

describe('memoryObserver', () => {
  it('records completed workspace tasks as active memory events', () => {
    const store = createInMemoryMemoryStore(createInitialMemoryState())
    const observer = createMemoryObserver({ scope: defaultScope, store, now: () => fixedNow, createId: () => 'memory-task-1' })

    observer.onTaskCompleted(task)

    const events = store.listEvents(defaultScope)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      id: 'memory-task-1',
      kind: 'context',
      source: 'workspace',
      status: 'active'
    })
    expect(events[0].content).toContain('完成任务')
    expect(events[0].content).toContain('完成高数极限专题 20 题')
    expect(events[0].tags).toEqual(expect.arrayContaining(['task_completed', 'study']))
  })

  it('records focus sessions as habit evidence with bounded confidence', () => {
    const store = createInMemoryMemoryStore(createInitialMemoryState())
    const observer = createMemoryObserver({ scope: defaultScope, store, now: () => fixedNow, createId: () => 'memory-focus-1' })

    observer.onFocusSessionCompleted(focusSession)

    const events = store.listEvents(defaultScope)
    expect(events[0].kind).toBe('habit')
    expect(events[0].content).toContain('完成 60 分钟专注')
    expect(events[0].confidence).toBeLessThanOrEqual(1)
    expect(events[0].tags).toEqual(expect.arrayContaining(['focus_session', 'study']))
  })

  it('records meaningful goal changes and ignores unchanged goals', () => {
    const store = createInMemoryMemoryStore(createInitialMemoryState())
    const observer = createMemoryObserver({ scope: defaultScope, store, now: () => fixedNow, createId: () => 'memory-goal-1' })

    observer.onGoalChange(oldGoal, oldGoal)
    observer.onGoalChange(oldGoal, newGoal)

    const events = store.listEvents(defaultScope)
    expect(events).toHaveLength(1)
    expect(events[0].kind).toBe('goal')
    expect(events[0].content).toContain('目标进度从 72% 更新到 100%')
    expect(events[0].tags).toEqual(expect.arrayContaining(['goal_change', 'study']))
  })

  it('records plan deviation, schedule anomaly and streak milestones with isolated tags', () => {
    const store = createInMemoryMemoryStore(createInitialMemoryState())
    let index = 0
    const observer = createMemoryObserver({ scope: defaultScope, store, now: () => fixedNow, createId: () => `memory-${index += 1}` })

    observer.onPlanDeviation('晚间复盘', '跳过复盘')
    observer.onScheduleAnomaly(fixedNow, '凌晨仍在学习')
    observer.onStreakEvent('milestone', '连续学习 7 天')

    const events = store.listEvents(defaultScope)
    expect(events.map((event) => event.tags[0])).toEqual(['plan_deviation', 'schedule_anomaly', 'streak_milestone'])
    expect(events.map((event) => event.kind)).toEqual(['context', 'context', 'habit'])
  })
})
