import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFocusTimer } from './useFocusTimer'
import type { WorkspaceState } from '../data/workspaceStore'

const mockTasks: WorkspaceState['tasks'] = [
  { id: 'task-1', title: '完成高数极限专题 20 题', status: 'todo', minutes: 60, rewardPoints: 60, dueLabel: '今天', workspaceType: 'study' },
  { id: 'task-2', title: '背诵四级核心词 80 个', status: 'todo', minutes: 45, rewardPoints: 45, dueLabel: '今天', workspaceType: 'study' },
  { id: 'task-3', title: '已完成任务', status: 'done', minutes: 30, rewardPoints: 30, dueLabel: '昨天', workspaceType: 'study' }
]

const mockWorkspaceState: WorkspaceState = {
  tasks: mockTasks,
  focusSessions: [],
  growth: { experience: 0, achievements: 0 },
  preferences: { activePersona: 'default', activeWorkspace: 'study', themeId: 'default', themeMode: 'manual' }
} as WorkspaceState

const defaultParams = {
  workspaceState: mockWorkspaceState,
  nextFocusTask: mockTasks[0],
  memoryObserver: null,
  refreshMemoryEvents: () => {},
  checkCameoTriggerRef: { current: undefined },
  setWorkspaceState: () => {}
}

describe('useFocusTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useFocusTimer(defaultParams))

    expect(result.current.focusTaskId).toBeNull()
    expect(result.current.isFocusRunning).toBe(false)
    expect(result.current.focusPausedRemainingMs).toBeNull()
    expect(result.current.focusDisplayTask).toEqual(mockTasks[0])
    expect(result.current.focusTargetMinutes).toBe(60)
  })

  it('calculates remaining time correctly', () => {
    const { result } = renderHook(() => useFocusTimer(defaultParams))

    expect(result.current.focusMinuteText).toBe('60')
    expect(result.current.focusSecondText).toBe('00')
  })

  it('starts timer when startFocusTimer is called', () => {
    const { result } = renderHook(() => useFocusTimer(defaultParams))

    act(() => {
      result.current.startFocusTimer()
    })

    expect(result.current.isFocusRunning).toBe(true)
    expect(result.current.focusTaskId).toBe('task-1')
  })

  it('pauses timer correctly', () => {
    const { result } = renderHook(() => useFocusTimer(defaultParams))

    act(() => {
      result.current.startFocusTimer()
    })

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    act(() => {
      result.current.pauseFocusTimer()
    })

    expect(result.current.isFocusRunning).toBe(false)
    expect(result.current.focusPausedRemainingMs).not.toBeNull()
  })

  it('resets timer correctly', () => {
    const { result } = renderHook(() => useFocusTimer(defaultParams))

    act(() => {
      result.current.startFocusTimer()
    })

    act(() => {
      result.current.pauseFocusTimer()
    })

    act(() => {
      result.current.resetFocusTimer()
    })

    expect(result.current.isFocusRunning).toBe(false)
    expect(result.current.focusPausedRemainingMs).toBeNull()
    expect(result.current.focusTaskId).toBeNull()
  })

  it('adjusts duration correctly', () => {
    const { result } = renderHook(() => useFocusTimer(defaultParams))

    act(() => {
      result.current.adjustFocusDuration(-5)
    })

    expect(result.current.focusTargetMinutes).toBe(55)

    act(() => {
      result.current.adjustFocusDuration(10)
    })

    expect(result.current.focusTargetMinutes).toBe(65)
  })

  it('respects min/max duration limits', () => {
    const { result } = renderHook(() => useFocusTimer(defaultParams))

    act(() => {
      result.current.adjustFocusDuration(-100)
    })

    expect(result.current.focusTargetMinutes).toBe(5)

    act(() => {
      result.current.adjustFocusDuration(500)
    })

    expect(result.current.focusTargetMinutes).toBe(180)
  })

  it('does not adjust duration when timer is running', () => {
    const { result } = renderHook(() => useFocusTimer(defaultParams))

    act(() => {
      result.current.startFocusTimer()
    })

    act(() => {
      result.current.adjustFocusDuration(-5)
    })

    expect(result.current.focusTargetMinutes).toBe(60)
  })

  it('calculates reward points based on duration', () => {
    const { result } = renderHook(() => useFocusTimer(defaultParams))

    act(() => {
      result.current.adjustFocusDuration(-30)
    })

    expect(result.current.focusRewardPoints).toBe(30)
  })

  it('uses next task when no task is bound', () => {
    const { result } = renderHook(() => useFocusTimer(defaultParams))

    expect(result.current.focusDisplayTask).toEqual(mockTasks[0])
  })

  it('returns correct constants', () => {
    const { result } = renderHook(() => useFocusTimer(defaultParams))

    expect(result.current.FOCUS_MIN_MINUTES).toBe(5)
    expect(result.current.FOCUS_MAX_MINUTES).toBe(180)
    expect(result.current.FOCUS_STEP_MINUTES).toBe(5)
  })
})
