import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

export interface FocusTask {
  id: string
  title: string
  status: 'todo' | 'done'
  minutes: number
  rewardXp: number
  dueLabel: string
  workspaceType: string
}

export interface FocusSession {
  id: string
  taskId: string
  taskTitle: string
  workspaceType: string
  minutes: number
  rewardXp: number
  completedAt: string
}

interface UseFocusTimerOptions {
  tasks: FocusTask[]
  onSessionComplete?: (session: FocusSession) => void
  onTaskComplete?: (task: FocusTask) => void
}

const FOCUS_MIN_MINUTES = 5
const FOCUS_MAX_MINUTES = 180
const FOCUS_STEP_MINUTES = 5

export function useFocusTimer({ tasks, onSessionComplete, onTaskComplete }: UseFocusTimerOptions) {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [pausedRemainingMs, setPausedRemainingMs] = useState<number | null>(null)
  const [now, setNow] = useState<number>(() => Date.now())
  const [durationDraft, setDurationDraft] = useState<Record<string, number>>({})
  const intervalRef = useRef<number | null>(null)

  const isRunning = endsAt !== null
  const isPaused = pausedRemainingMs !== null

  const todoTasks = useMemo(() => tasks.filter(t => t.status === 'todo'), [tasks])
  const nextTask = todoTasks[0] ?? null

  const activeTask = useMemo(() => {
    if (!taskId) return null
    return tasks.find(t => t.id === taskId) ?? null
  }, [taskId, tasks])

  const displayTask = activeTask ?? nextTask

  const targetMinutes = useMemo(() => {
    if (!displayTask) return 25
    return durationDraft[displayTask.id] ?? displayTask.minutes
  }, [displayTask, durationDraft])

  const remainingMs = useMemo(() => {
    if (endsAt !== null) return Math.max(0, endsAt - now)
    if (pausedRemainingMs !== null) return pausedRemainingMs
    if (!displayTask) return 0
    return (durationDraft[displayTask.id] ?? displayTask.minutes) * 60 * 1000
  }, [endsAt, now, pausedRemainingMs, displayTask, durationDraft])

  const remainingSeconds = Math.round(remainingMs / 1000)

  const minuteText = String(Math.floor(remainingSeconds / 60)).padStart(2, '0')
  const secondText = String(remainingSeconds % 60).padStart(2, '0')

  const rewardXp = useMemo(() => {
    if (!displayTask) return 0
    return Math.round((displayTask.rewardXp * targetMinutes) / displayTask.minutes)
  }, [displayTask, targetMinutes])

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = window.setInterval(() => {
      setNow(Date.now())
    }, 250)

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning])

  useEffect(() => {
    if (endsAt === null || remainingMs > 0) return

    const completedTaskId = taskId
    const finish = () => {
      setEndsAt(null)
      setPausedRemainingMs(null)
      if (!completedTaskId) return

      const target = tasks.find(t => t.id === completedTaskId)
      if (!target || target.status === 'done') return

      const session: FocusSession = {
        id: `focus-${Date.now()}`,
        taskId: target.id,
        taskTitle: target.title,
        workspaceType: target.workspaceType,
        minutes: target.minutes,
        rewardXp: target.rewardXp,
        completedAt: new Date().toISOString()
      }

      onSessionComplete?.(session)
      onTaskComplete?.(target)

      setTaskId(null)
      setDurationDraft(current => {
        if (!(completedTaskId in current)) return current
        const next = { ...current }
        delete next[completedTaskId]
        return next
      })
    }

    const handle = window.setTimeout(finish, 0)
    return () => window.clearTimeout(handle)
  }, [endsAt, remainingMs, taskId, tasks, onSessionComplete, onTaskComplete])

  const adjustDuration = useCallback((delta: number) => {
    if (!displayTask || isRunning) return
    const next = Math.min(
      FOCUS_MAX_MINUTES,
      Math.max(FOCUS_MIN_MINUTES, targetMinutes + delta)
    )
    if (next === targetMinutes) return
    setDurationDraft(current => ({ ...current, [displayTask.id]: next }))
    setPausedRemainingMs(null)
  }, [displayTask, isRunning, targetMinutes])

  const setDuration = useCallback((minutes: number) => {
    if (!displayTask || isRunning) return
    const clamped = Math.min(FOCUS_MAX_MINUTES, Math.max(FOCUS_MIN_MINUTES, Math.round(minutes)))
    setDurationDraft(current => ({ ...current, [displayTask.id]: clamped }))
    setPausedRemainingMs(null)
  }, [displayTask, isRunning])

  const start = useCallback(() => {
    if (activeTask) {
      const targetMs = targetMinutes * 60 * 1000
      const remainingMs = pausedRemainingMs ?? targetMs
      const now = Date.now()
      setEndsAt(now + remainingMs)
      setNow(now)
      setPausedRemainingMs(null)
      return
    }

    if (!nextTask) return
    const now = Date.now()
    const minutes = durationDraft[nextTask.id] ?? nextTask.minutes
    setTaskId(nextTask.id)
    setEndsAt(now + minutes * 60 * 1000)
    setNow(now)
    setPausedRemainingMs(null)
  }, [activeTask, targetMinutes, pausedRemainingMs, nextTask, durationDraft])

  const pause = useCallback(() => {
    if (endsAt === null) return
    const now = Date.now()
    const remainingMs = Math.max(0, endsAt - now)
    setPausedRemainingMs(remainingMs)
    setEndsAt(null)
    setNow(now)
  }, [endsAt])

  const reset = useCallback(() => {
    const taskIdToClear = activeTask?.id ?? displayTask?.id ?? null
    setEndsAt(null)
    setPausedRemainingMs(null)
    setTaskId(null)
    setNow(Date.now())
    if (taskIdToClear) {
      setDurationDraft(current => {
        if (!(taskIdToClear in current)) return current
        const next = { ...current }
        delete next[taskIdToClear]
        return next
      })
    }
  }, [activeTask, displayTask])

  return {
    taskId,
    displayTask,
    nextTask,
    targetMinutes,
    remainingSeconds,
    minuteText,
    secondText,
    rewardXp,
    isRunning,
    isPaused,
    adjustDuration,
    setDuration,
    start,
    pause,
    reset,
    FOCUS_MIN_MINUTES,
    FOCUS_MAX_MINUTES,
    FOCUS_STEP_MINUTES
  }
}
