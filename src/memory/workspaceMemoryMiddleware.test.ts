import { describe, expect, it } from 'vitest'
import { createInitialWorkspaceState, createMemoryWorkspaceStore } from '../data/workspaceStore'
import { withWorkspaceMemoryObserver } from './workspaceMemoryMiddleware'
import type { MemoryObserver } from './memoryObserver'

const createObserverSpy = () => {
  const calls: string[] = []
  const observer: MemoryObserver = {
    onTaskCompleted: (task) => calls.push(`task:${task.id}`),
    onTaskDelayed: (task) => calls.push(`delayed:${task.id}`),
    onFocusSessionCompleted: (session) => calls.push(`focus:${session.id}`),
    onPlanDeviation: (expected, actual) => calls.push(`deviation:${expected}->${actual}`),
    onScheduleAnomaly: (_detectedAt, anomalyType) => calls.push(`anomaly:${anomalyType}`),
    onStreakEvent: (type, detail) => calls.push(`streak:${type}:${detail}`),
    onGoalChange: (oldGoal, newGoal) => calls.push(`goal:${oldGoal.id}:${oldGoal.progress}->${newGoal.progress}`)
  }

  return { calls, observer }
}

describe('workspaceMemoryMiddleware', () => {
  it('delegates load and save to the wrapped workspace store', () => {
    const baseStore = createMemoryWorkspaceStore(createInitialWorkspaceState())
    const { calls, observer } = createObserverSpy()
    const store = withWorkspaceMemoryObserver(baseStore, observer)
    const nextState = {
      ...store.load(),
      growth: {
        ...store.load().growth,
        experience: 999
      }
    }

    store.save(nextState)

    expect(store.load().growth.experience).toBe(999)
    expect(calls).toEqual([])
  })

  it('detects todo to done task transitions without duplicating unchanged done tasks', () => {
    const initialState = createInitialWorkspaceState()
    const baseStore = createMemoryWorkspaceStore(initialState)
    const { calls, observer } = createObserverSpy()
    const store = withWorkspaceMemoryObserver(baseStore, observer)
    const nextState = {
      ...initialState,
      tasks: initialState.tasks.map((task) => task.id === 'task-1' ? { ...task, status: 'done' as const } : task)
    }

    store.save(nextState)
    store.save(nextState)

    expect(calls).toEqual(['task:task-1'])
  })

  it('detects newly added focus sessions and meaningful goal changes', () => {
    const initialState = createInitialWorkspaceState()
    const baseStore = createMemoryWorkspaceStore(initialState)
    const { calls, observer } = createObserverSpy()
    const store = withWorkspaceMemoryObserver(baseStore, observer)
    const nextState = {
      ...initialState,
      goals: initialState.goals.map((goal) => goal.id === 'goal-math' ? { ...goal, progress: 100 } : goal),
      focusSessions: [
        ...initialState.focusSessions,
        {
          id: 'focus-new',
          taskId: 'task-1',
          taskTitle: '完成高数极限专题 20 题',
          workspaceType: 'study' as const,
          minutes: 60,
          rewardPoints: 60,
          completedAt: '2026-06-01T10:00:00.000Z'
        }
      ]
    }

    store.save(nextState)

    expect(calls).toEqual(['focus:focus-new', 'goal:goal-math:72->100'])
  })

  it('detects delayed todo tasks and streak changes as isolated events', () => {
    const initialState = createInitialWorkspaceState()
    const baseStore = createMemoryWorkspaceStore(initialState)
    const { calls, observer } = createObserverSpy()
    const store = withWorkspaceMemoryObserver(baseStore, observer)
    const nextState = {
      ...initialState,
      tasks: initialState.tasks.map((task) => task.id === 'task-2' ? { ...task, dueLabel: '已延期' } : task),
      growth: {
        ...initialState.growth,
        streakDays: initialState.growth.streakDays + 1
      }
    }

    store.save(nextState)

    expect(calls).toEqual(['delayed:task-2', `streak:milestone:连续行动 ${nextState.growth.streakDays} 天`])
  })
})
