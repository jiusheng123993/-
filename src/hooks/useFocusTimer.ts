import { useCallback, useEffect, useRef, useState } from 'react'
import type { FocusSessionRecord, WorkspaceState } from '../data/workspaceStore'

export interface FocusTimerState {
  focusTaskId: string | null
  focusEndsAt: number | null
  focusPausedRemainingMs: number | null
  focusNow: number
  focusDurationDraft: Record<string, number>
  isFocusRunning: boolean
  activeFocusTask: WorkspaceState['tasks'][number] | null
  focusDisplayTask: WorkspaceState['tasks'][number] | null
  focusTargetMinutes: number
  focusSeconds: number
  focusMinuteText: string
  focusSecondText: string
  focusRewardPoints: number
  focusRemainingSeconds: number
  FOCUS_MIN_MINUTES: number
  FOCUS_MAX_MINUTES: number
  FOCUS_STEP_MINUTES: number
  startFocusTimer: () => void
  pauseFocusTimer: () => void
  resetFocusTimer: () => void
  adjustFocusDuration: (delta: number) => void
  handleFocusDurationInput: (event: React.ChangeEvent<HTMLInputElement>) => void
}

interface UseFocusTimerParams {
  workspaceState: WorkspaceState
  nextFocusTask: WorkspaceState['tasks'][number] | undefined
  memoryObserver: { onFocusSessionCompleted: (session: FocusSessionRecord) => void; onTaskCompleted: (task: WorkspaceState['tasks'][number]) => void } | null
  refreshMemoryEvents: () => void
  checkCameoTriggerRef: React.MutableRefObject<(() => void) | undefined>
  setWorkspaceState: (updater: WorkspaceState | ((prev: WorkspaceState) => WorkspaceState)) => void
}

const FOCUS_MIN_MINUTES = 5
const FOCUS_MAX_MINUTES = 180
const FOCUS_STEP_MINUTES = 5
const DEFAULT_FOCUS_ID = '__default_focus__'

export function useFocusTimer({
  workspaceState,
  nextFocusTask,
  memoryObserver,
  refreshMemoryEvents,
  checkCameoTriggerRef,
  setWorkspaceState
}: UseFocusTimerParams): FocusTimerState {
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null)
  const [focusEndsAt, setFocusEndsAt] = useState<number | null>(null)
  const [focusPausedRemainingMs, setFocusPausedRemainingMs] = useState<number | null>(null)
  const [focusNow, setFocusNow] = useState<number>(() => Date.now())
  const [focusDurationDraft, setFocusDurationDraft] = useState<Record<string, number>>({})
  const focusIntervalRef = useRef<number | null>(null)

  const isFocusRunning = focusEndsAt !== null
  const candidateFocusTask = focusTaskId
    ? workspaceState.tasks.find((task) => task.id === focusTaskId) ?? null
    : null
  const activeFocusTask =
    candidateFocusTask && candidateFocusTask.status === 'todo' ? candidateFocusTask : null

  useEffect(() => {
    if (!isFocusRunning) {
      if (focusIntervalRef.current !== null) {
        window.clearInterval(focusIntervalRef.current)
        focusIntervalRef.current = null
      }
      return
    }

    focusIntervalRef.current = window.setInterval(() => {
      setFocusNow(Date.now())
    }, 250)

    return () => {
      if (focusIntervalRef.current !== null) {
        window.clearInterval(focusIntervalRef.current)
        focusIntervalRef.current = null
      }
    }
  }, [isFocusRunning])

  const remainingMsFromEnds = focusEndsAt !== null ? Math.max(0, focusEndsAt - focusNow) : 0
  const focusRemainingSeconds =
    focusEndsAt !== null
      ? Math.round(remainingMsFromEnds / 1000)
      : focusPausedRemainingMs !== null
        ? Math.round(focusPausedRemainingMs / 1000)
        : 0

  useEffect(() => {
    if (focusEndsAt === null || remainingMsFromEnds > 0) return

    const completedTaskId = focusTaskId
    const finish = () => {
      setFocusEndsAt(null)
      setFocusPausedRemainingMs(null)
      if (!completedTaskId) return

      setWorkspaceState((state) => {
        const target = state.tasks.find((task) => task.id === completedTaskId)
        if (!target || target.status === 'done') return state

        const session: FocusSessionRecord = {
          id: `focus-${Date.now()}`,
          taskId: target.id,
          taskTitle: target.title,
          workspaceType: target.workspaceType,
          minutes: target.minutes,
          rewardPoints: target.rewardPoints,
          completedAt: new Date().toISOString()
        }

        memoryObserver?.onFocusSessionCompleted(session)
        memoryObserver?.onTaskCompleted(target)
        refreshMemoryEvents()
        checkCameoTriggerRef.current?.()

        return {
          ...state,
          tasks: state.tasks.map((task) =>
            task.id === completedTaskId ? { ...task, status: 'done', dueLabel: '已完成' } : task
          ),
          growth: {
            ...state.growth,
            experience: state.growth.experience + target.rewardPoints,
            achievements: state.growth.achievements + 1
          },
          focusSessions: [session, ...state.focusSessions].slice(0, 20)
        }
      })
      setFocusTaskId(null)
      setFocusDurationDraft((current) => {
        if (!(completedTaskId in current)) return current
        const next = { ...current }
        delete next[completedTaskId]
        return next
      })
    }

    const handle = window.setTimeout(finish, 0)
    return () => window.clearTimeout(handle)
  }, [focusEndsAt, remainingMsFromEnds, focusTaskId, memoryObserver, refreshMemoryEvents, checkCameoTriggerRef, setWorkspaceState])

  const focusDisplayTask = activeFocusTask ?? nextFocusTask ?? null
  const focusTargetMinutes = focusDisplayTask
    ? focusDurationDraft[focusDisplayTask.id] ?? focusDisplayTask.minutes
    : focusDurationDraft[DEFAULT_FOCUS_ID] ?? 25

  const focusSeconds = activeFocusTask
    ? focusRemainingSeconds
    : focusTargetMinutes * 60
  const focusMinuteText = String(Math.floor(focusSeconds / 60)).padStart(2, '0')
  const focusSecondText = String(focusSeconds % 60).padStart(2, '0')
  const focusRewardPoints = focusDisplayTask
    ? Math.round((focusDisplayTask.rewardPoints * focusTargetMinutes) / focusDisplayTask.minutes)
    : 0

  const adjustFocusDuration = useCallback((delta: number) => {
    if (isFocusRunning) return
    const targetId = focusDisplayTask ? focusDisplayTask.id : DEFAULT_FOCUS_ID
    const currentMinutes = focusDisplayTask
      ? focusDurationDraft[focusDisplayTask.id] ?? focusDisplayTask.minutes
      : focusDurationDraft[DEFAULT_FOCUS_ID] ?? 25
    const next = Math.min(
      FOCUS_MAX_MINUTES,
      Math.max(FOCUS_MIN_MINUTES, currentMinutes + delta)
    )
    if (next === currentMinutes) return
    setFocusDurationDraft((current) => ({ ...current, [targetId]: next }))
    setFocusPausedRemainingMs(null)
  }, [isFocusRunning, focusDisplayTask, focusDurationDraft])

  const handleFocusDurationInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (isFocusRunning) return
    const raw = Number(event.target.value)
    if (!Number.isFinite(raw)) return
    const clamped = Math.min(FOCUS_MAX_MINUTES, Math.max(FOCUS_MIN_MINUTES, Math.round(raw)))
    const targetId = focusDisplayTask ? focusDisplayTask.id : DEFAULT_FOCUS_ID
    setFocusDurationDraft((current) => ({ ...current, [targetId]: clamped }))
    setFocusPausedRemainingMs(null)
  }, [isFocusRunning, focusDisplayTask])

  const startFocusTimer = useCallback(() => {
    if (activeFocusTask) {
      const targetMs = focusTargetMinutes * 60 * 1000
      const remainingMs = focusPausedRemainingMs ?? targetMs
      const now = Date.now()
      setFocusEndsAt(now + remainingMs)
      setFocusNow(now)
      setFocusPausedRemainingMs(null)
      return
    }

    if (!nextFocusTask) return
    const now = Date.now()
    const minutes = focusDurationDraft[nextFocusTask.id] ?? nextFocusTask.minutes
    setFocusTaskId(nextFocusTask.id)
    setFocusEndsAt(now + minutes * 60 * 1000)
    setFocusNow(now)
    setFocusPausedRemainingMs(null)
  }, [activeFocusTask, focusTargetMinutes, focusPausedRemainingMs, nextFocusTask, focusDurationDraft])

  const pauseFocusTimer = useCallback(() => {
    if (focusEndsAt === null) return
    const now = Date.now()
    const remainingMs = Math.max(0, focusEndsAt - now)
    setFocusPausedRemainingMs(remainingMs)
    setFocusEndsAt(null)
    setFocusNow(now)
  }, [focusEndsAt])

  const resetFocusTimer = useCallback(() => {
    const taskIdToClear = activeFocusTask?.id ?? focusDisplayTask?.id ?? null
    setFocusEndsAt(null)
    setFocusPausedRemainingMs(null)
    setFocusTaskId(null)
    setFocusNow(Date.now())
    if (taskIdToClear) {
      setFocusDurationDraft((current) => {
        if (!(taskIdToClear in current)) return current
        const next = { ...current }
        delete next[taskIdToClear]
        return next
      })
    }
  }, [activeFocusTask, focusDisplayTask])

  return {
    focusTaskId,
    focusEndsAt,
    focusPausedRemainingMs,
    focusNow,
    focusDurationDraft,
    isFocusRunning,
    activeFocusTask,
    focusDisplayTask,
    focusTargetMinutes,
    focusSeconds,
    focusMinuteText,
    focusSecondText,
    focusRewardPoints,
    focusRemainingSeconds,
    FOCUS_MIN_MINUTES,
    FOCUS_MAX_MINUTES,
    FOCUS_STEP_MINUTES,
    startFocusTimer,
    pauseFocusTimer,
    resetFocusTimer,
    adjustFocusDuration,
    handleFocusDurationInput
  }
}
