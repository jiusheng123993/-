import { useCallback, useMemo } from 'react'
import { habitService } from '../services/habitService'
import { useCrudList } from './useCrudList'
import { createErrorHandler } from '../utils/errorHandler'
import type { Habit, CreateHabitInput, UpdateHabitInput } from '../data/repositories'
import type { ToastMessage } from '../components/toast/Toast'

export function useHabits(userId: string | null, addToast?: (toast: Omit<ToastMessage, 'id'>) => void) {
  const crud = useCrudList<Habit, Omit<CreateHabitInput, 'userId'>, UpdateHabitInput>({
    userId,
    loadFn: (uid) => habitService.getHabits(uid),
    createFn: (uid, input) => habitService.createHabit(uid, input),
    updateFn: (id, patch) => habitService.updateHabit(id, patch),
    deleteFn: (id) => habitService.deleteHabit(id),
    moduleName: '习惯',
    addToast,
  })

  const handleError = useMemo(
    () => createErrorHandler({ setError: () => {}, addToast, moduleName: '习惯' }),
    [addToast]
  )

  const checkIn = useCallback(async (habitId: string): Promise<Habit | null> => {
    try {
      const updated = await habitService.checkIn(habitId)
      crud.refresh()
      return updated
    } catch (e) {
      handleError(e, '打卡失败')
      return null
    }
  }, [handleError, crud])

  return useMemo(
    () => ({
      habits: crud.items,
      loading: crud.loading,
      error: crud.error,
      createHabit: crud.create,
      checkIn,
      updateHabit: crud.update,
      deleteHabit: crud.remove,
      refresh: crud.refresh,
    }),
    [crud, checkIn]
  )
}
