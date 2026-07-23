import { useCallback, useMemo } from 'react'
import { taskService } from '../services/taskService'
import { useCrudList } from './useCrudList'
import { createErrorHandler } from '../utils/errorHandler'
import type { Task, CreateTaskInput, UpdateTaskInput } from '../data/repositories'
import type { ToastMessage } from '../components/toast/Toast'

export function useTasks(userId: string | null, addToast?: (toast: Omit<ToastMessage, 'id'>) => void) {
  const crud = useCrudList<Task, Omit<CreateTaskInput, 'userId'>, UpdateTaskInput>({
    userId,
    loadFn: (uid) => taskService.getAllTasks(uid),
    createFn: (uid, input) => taskService.createTask(uid, input),
    updateFn: (id, patch) => taskService.updateTask(id, patch),
    deleteFn: (id) => taskService.deleteTask(id),
    moduleName: '任务',
    addToast,
  })

  const handleError = useMemo(
    () => createErrorHandler({ setError: () => {}, addToast, moduleName: '任务' }),
    [addToast]
  )

  const completeTask = useCallback(async (taskId: string): Promise<number | null> => {
    try {
      const { experience } = await taskService.completeTask(taskId)
      crud.refresh()
      return experience
    } catch (e) {
      handleError(e, '完成失败')
      return null
    }
  }, [handleError, crud])

  return useMemo(
    () => ({
      tasks: crud.items,
      loading: crud.loading,
      error: crud.error,
      createTask: crud.create,
      completeTask,
      updateTask: crud.update,
      deleteTask: crud.remove,
      refresh: crud.refresh,
    }),
    [crud, completeTask]
  )
}
