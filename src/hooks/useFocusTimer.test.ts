import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFocusTimer, type FocusTask } from './useFocusTimer'

const mockTasks: FocusTask[] = [
  { id: 'task-1', title: '完成高数极限专题 20 题', status: 'todo', minutes: 60, rewardXp: 60, dueLabel: '今天', workspaceType: 'study' },
  { id: 'task-2', title: '背诵四级核心词 80 个', status: 'todo', minutes: 45, rewardXp: 45, dueLabel: '今天', workspaceType: 'study' },
  { id: 'task-3', title: '已完成任务', status: 'done', minutes: 30, rewardXp: 30, dueLabel: '昨天', workspaceType: 'study' }
]

describe('useFocusTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useFocusTimer({ tasks: mockTasks }))

    expect(result.current.taskId).toBeNull()
    expect(result.current.isRunning).toBe(false)
    expect(result.current.isPaused).toBe(false)
    expect(result.current.displayTask).toEqual(mockTasks[0])
    expect(result.current.targetMinutes).toBe(60)
  })

  it('calculates remaining time correctly', () => {
    const { result } = renderHook(() => useFocusTimer({ tasks: mockTasks }))

    expect(result.current.minuteText).toBe('60')
    expect(result.current.secondText).toBe('00')
  })

  it('starts timer when start is called', () => {
    const { result } = renderHook(() => useFocusTimer({ tasks: mockTasks }))

    act(() => {
      result.current.start()
    })

    expect(result.current.isRunning).toBe(true)
    expect(result.current.taskId).toBe('task-1')
  })

  it('pauses timer correctly', () => {
    const { result } = renderHook(() => useFocusTimer({ tasks: mockTasks }))

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    act(() => {
      result.current.pause()
    })

    expect(result.current.isRunning).toBe(false)
    expect(result.current.isPaused).toBe(true)
  })

  it('resets timer correctly', () => {
    const { result } = renderHook(() => useFocusTimer({ tasks: mockTasks }))

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.pause()
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.isRunning).toBe(false)
    expect(result.current.isPaused).toBe(false)
    expect(result.current.taskId).toBeNull()
  })

  it('adjusts duration correctly', () => {
    const { result } = renderHook(() => useFocusTimer({ tasks: mockTasks }))

    act(() => {
      result.current.adjustDuration(-5)
    })

    expect(result.current.targetMinutes).toBe(55)

    act(() => {
      result.current.adjustDuration(10)
    })

    expect(result.current.targetMinutes).toBe(65)
  })

  it('respects min/max duration limits', () => {
    const { result } = renderHook(() => useFocusTimer({ tasks: mockTasks }))

    act(() => {
      result.current.adjustDuration(-100)
    })

    expect(result.current.targetMinutes).toBe(5)

    act(() => {
      result.current.adjustDuration(500)
    })

    expect(result.current.targetMinutes).toBe(180)
  })

  it('does not adjust duration when timer is running', () => {
    const { result } = renderHook(() => useFocusTimer({ tasks: mockTasks }))

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.adjustDuration(-5)
    })

    expect(result.current.targetMinutes).toBe(60)
  })

  it('calculates reward XP based on duration', () => {
    const { result } = renderHook(() => useFocusTimer({ tasks: mockTasks }))

    act(() => {
      result.current.adjustDuration(-30)
    })

    expect(result.current.rewardXp).toBe(30)
  })

  it('uses next task when no task is bound', () => {
    const { result } = renderHook(() => useFocusTimer({ tasks: mockTasks }))

    expect(result.current.displayTask).toEqual(mockTasks[0])
    expect(result.current.nextTask).toEqual(mockTasks[0])
  })

  it('returns correct constants', () => {
    const { result } = renderHook(() => useFocusTimer({ tasks: mockTasks }))

    expect(result.current.FOCUS_MIN_MINUTES).toBe(5)
    expect(result.current.FOCUS_MAX_MINUTES).toBe(180)
    expect(result.current.FOCUS_STEP_MINUTES).toBe(5)
  })
})
