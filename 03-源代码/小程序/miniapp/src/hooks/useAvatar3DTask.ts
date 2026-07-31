/**
 * 3D 宠物形象生成任务 Hook
 * 管理 3D 模型生成任务的轮询、状态跟踪、结果获取与重试
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { getTaskProgress, getAvatar3DModel, increment3DGenerationCount, generate3DAvatar } from '../services/avatarService'
import type { Avatar3DResult, GenerationTask, TaskStatus } from '../types/avatarTypes'

interface UseAvatar3DTaskResult {
  taskId: string | null
  progress: number
  status: TaskStatus
  error: string | null
  result: Avatar3DResult
  isGenerating: boolean
  isProcessing: boolean
  isComplete: boolean
  isFailed: boolean
  startPolling: (taskId: string) => void
  restoreFromTask: (task: GenerationTask, result?: Avatar3DResult) => void
  reset: () => void
  retry: (petId: string, image2DTaskId: string) => Promise<void>
}

/**
 * 3D 宠物形象生成任务 Hook
 * 管理 3D 模型生成任务的轮询、状态跟踪、结果获取与重试
 */
export function useAvatar3DTask(petId: string): UseAvatar3DTaskResult {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Avatar3DResult>({ task: null, model: null })
  const [isGenerating, setIsGenerating] = useState(false)

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
    setIsGenerating(true)

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
        increment3DGenerationCount()
        const newResult = await getAvatar3DModel(petId)
        if (!isMountedRef.current) return
        setResult(newResult)
        setIsGenerating(false)
        Taro.showToast({ title: '3D 模型生成完成', icon: 'success' })
      } else if (task.status === 'failed') {
        if (pollingRef.current) clearInterval(pollingRef.current)
        setError(task.error || '3D 模型生成失败，请重试')
        setIsGenerating(false)
      }
    }, 3000)
  }, [petId])

  const restoreFromTask = useCallback((task: GenerationTask, existingResult?: Avatar3DResult) => {
    setTaskId(task.id)
    setStatus(task.status)
    setProgress(task.progress)
    setError(task.error)
    if (existingResult) setResult(existingResult)
    if (task.status === 'pending' || task.status === 'processing') {
      setIsGenerating(true)
      startPolling(task.id)
    }
  }, [startPolling])

  const reset = useCallback(() => {
    setStatus('pending')
    setProgress(0)
    setError(null)
    setIsGenerating(false)
  }, [])

  const retry = useCallback(async (currentPetId: string, image2DTaskId: string) => {
    reset()
    setIsGenerating(true)
    try {
      const res = await generate3DAvatar(currentPetId, image2DTaskId)
      if (!isMountedRef.current) return
      if (res.success && res.data?.taskId) {
        setTaskId(res.data.taskId)
        startPolling(res.data.taskId)
      } else {
        Taro.showToast({ title: res.message || '重试失败', icon: 'none' })
        setIsGenerating(false)
      }
    } catch {
      if (!isMountedRef.current) return
      Taro.showToast({ title: '重试失败，请稍后再试', icon: 'none' })
      setIsGenerating(false)
    }
  }, [reset, startPolling])

  const isProcessing = status === 'pending' || status === 'processing'
  const isComplete = status === 'completed'
  const isFailed = status === 'failed'

  return {
    taskId,
    progress,
    status,
    error,
    result,
    isGenerating,
    isProcessing,
    isComplete,
    isFailed,
    startPolling,
    restoreFromTask,
    reset,
    retry,
  }
}
