/**
 * 2D 宠物形象生成任务 Hook
 * 管理 2D 头像生成任务的轮询、状态跟踪与结果获取
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { getTaskProgress, getAvatar2DImages, incrementPhotoGenerationCount } from '../services/avatarService'
import type { Avatar2DPack, GenerationTask, TaskStatus } from '../types/avatarTypes'

interface UseAvatar2DTaskResult {
  taskId: string | null
  progress: number
  status: TaskStatus
  error: string | null
  pack: Avatar2DPack
  isProcessing: boolean
  isComplete: boolean
  isFailed: boolean
  startPolling: (taskId: string) => void
  restoreFromTask: (task: GenerationTask, pack?: Avatar2DPack) => void
  reset: () => void
  setTaskId: (id: string) => void
}

/**
 * 2D 宠物形象生成任务 Hook
 * 管理 2D 头像生成任务的轮询、状态跟踪与结果获取
 */
export function useAvatar2DTask(petId: string): UseAvatar2DTaskResult {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [error, setError] = useState<string | null>(null)
  const [pack, setPack] = useState<Avatar2DPack>({ task: null, images: [] })

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const startPolling = useCallback((id: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    setTaskId(id)
    setStatus('pending')
    setProgress(0)
    setError(null)

    pollingRef.current = setInterval(async () => {
      const task = await getTaskProgress(id)
      if (!task || !isMountedRef.current) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        return
      }

      setProgress(task.progress)
      setStatus(task.status)

      if (task.status === 'completed') {
        if (pollingRef.current) clearInterval(pollingRef.current)
        incrementPhotoGenerationCount()
        const newPack = await getAvatar2DImages(petId)
        if (!isMountedRef.current) return
        setPack(newPack)
        Taro.showToast({ title: '2D 形象生成完成', icon: 'success' })
      } else if (task.status === 'failed') {
        if (pollingRef.current) clearInterval(pollingRef.current)
        setError(task.error || '2D 形象生成失败，请重试')
      }
    }, 2000)
  }, [petId])

  const restoreFromTask = useCallback((task: GenerationTask, existingPack?: Avatar2DPack) => {
    setTaskId(task.id)
    setStatus(task.status)
    setProgress(task.progress)
    setError(task.error)
    if (existingPack) setPack(existingPack)
    if (task.status === 'pending' || task.status === 'processing') {
      startPolling(task.id)
    }
  }, [startPolling])

  const reset = useCallback(() => {
    setStatus('pending')
    setProgress(0)
    setError(null)
  }, [])

  const isProcessing = status === 'pending' || status === 'processing'
  const isComplete = status === 'completed'
  const isFailed = status === 'failed'

  return {
    taskId,
    progress,
    status,
    error,
    pack,
    isProcessing,
    isComplete,
    isFailed,
    startPolling,
    restoreFromTask,
    reset,
    setTaskId,
  }
}
