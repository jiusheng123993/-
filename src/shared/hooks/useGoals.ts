import { useCallback, useMemo } from 'react'
import { goalService, type GrowthReward } from '../services/goalService'
import { useCrudList } from './useCrudList'
import { createErrorHandler } from '../utils/errorHandler'
import type { Goal, CreateGoalInput, UpdateGoalInput } from '../data/repositories'
import type { ToastMessage } from '../components/toast/Toast'

export function useGoals(userId: string | null, addToast?: (toast: Omit<ToastMessage, 'id'>) => void) {
  const crud = useCrudList<Goal, Omit<CreateGoalInput, 'userId'>, UpdateGoalInput>({
    userId,
    loadFn: (uid) => goalService.getAllGoals(uid),
    createFn: (uid, input) => goalService.createGoal(uid, input),
    updateFn: (id, patch) => goalService.updateProgress(id, patch.progress ?? 0),
    deleteFn: (id) => goalService.deleteGoal(id),
    moduleName: '目标',
    addToast,
  })

  const handleError = useMemo(
    () => createErrorHandler({ setError: () => {}, addToast, moduleName: '目标' }),
    [addToast]
  )

  const completeGoal = useCallback(async (goalId: string): Promise<GrowthReward | null> => {
    try {
      const { reward } = await goalService.completeGoal(goalId)
      crud.refresh()
      return reward
    } catch (e) {
      handleError(e, '完成失败')
      return null
    }
  }, [handleError, crud])

  return useMemo(
    () => ({
      goals: crud.items,
      loading: crud.loading,
      error: crud.error,
      createGoal: crud.create,
      updateGoal: crud.update,
      completeGoal,
      deleteGoal: crud.remove,
      refresh: crud.refresh,
    }),
    [crud, completeGoal]
  )
}
