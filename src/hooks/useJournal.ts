import { useMemo } from 'react'
import { journalService } from '../services/journalService'
import { useCrudList } from './useCrudList'
import type { Journal, CreateJournalInput, UpdateJournalInput } from '../data/repositories'
import type { ToastMessage } from '../components/toast/Toast'

export function useJournal(userId: string | null, addToast?: (toast: Omit<ToastMessage, 'id'>) => void) {
  const crud = useCrudList<Journal, Omit<CreateJournalInput, 'userId'>, UpdateJournalInput>({
    userId,
    loadFn: (uid) => journalService.getEntries(uid),
    createFn: (uid, input) => journalService.createEntry(uid, input),
    updateFn: (id, patch) => journalService.updateEntry(id, patch),
    deleteFn: (id) => journalService.deleteEntry(id),
    moduleName: '日记',
    addToast,
  })

  return useMemo(
    () => ({
      entries: crud.items,
      loading: crud.loading,
      error: crud.error,
      createEntry: crud.create,
      updateEntry: crud.update,
      deleteEntry: crud.remove,
      refresh: crud.refresh,
    }),
    [crud]
  )
}
