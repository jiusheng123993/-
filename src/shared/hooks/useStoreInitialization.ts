import { useCallback, useMemo, useState } from 'react'
import { createBrowserStudyStore } from '../data/localStudyStore'
import { createHabitBrowserStore } from '../../growth/habits/habitService'
import { createJournalBrowserStore } from '../../growth/journal/journalService'
// readingService was removed - using stub
const createReadingService = () => ({ getState: () => ({ books: [], currentBook: null }) })
import { createGoalBrowserStore } from '../data/localGoalStore'
import { createFinanceBrowserStore } from '../data/localFinanceStore'
import { createWellnessBrowserStore } from '../data/localWellnessStore'
import { createProjectBrowserStore } from '../data/localProjectStore'
import type { WorkspaceState } from '../data/workspaceStore'
import type { OnboardingData } from '../onboarding/OnboardingUI'

const onboardingStorageKey = 'xinghuanhai-onboarding-completed'
const onboardingDataKey = 'xinghuanhai-onboarding-data'

export interface StoreInitializationState {
  getWorkspaceState: () => WorkspaceState
  studyStore: ReturnType<typeof createBrowserStudyStore>
  getStudyState: () => ReturnType<ReturnType<typeof createBrowserStudyStore>['load']>
  habitStore: ReturnType<typeof createHabitBrowserStore>
  getHabitState: () => ReturnType<ReturnType<typeof createHabitBrowserStore>['load']>
  journalStore: ReturnType<typeof createJournalBrowserStore>
  getJournalState: () => ReturnType<ReturnType<typeof createJournalBrowserStore>['load']>
  readingService: ReturnType<typeof createReadingService>
  getReadingState: () => ReturnType<ReturnType<typeof createReadingService>['getState']>
  goalStore: ReturnType<typeof createGoalBrowserStore>
  getGoalsState: () => ReturnType<ReturnType<typeof createGoalBrowserStore>['load']>
  financeStore: ReturnType<typeof createFinanceBrowserStore>
  getFinanceState: () => ReturnType<ReturnType<typeof createFinanceBrowserStore>['load']>
  wellnessStore: ReturnType<typeof createWellnessBrowserStore>
  getWellnessState: () => ReturnType<ReturnType<typeof createWellnessBrowserStore>['load']>
  projectStore: ReturnType<typeof createProjectBrowserStore>
  getProjectState: () => ReturnType<ReturnType<typeof createProjectBrowserStore>['load']>
  onboardingCompleted: boolean
  handleOnboardingComplete: (data: OnboardingData) => void
  handleOnboardingSkip: () => void
}

export interface UseStoreInitializationParams {
  workspaceState: WorkspaceState
}

export function useStoreInitialization({
  workspaceState
}: UseStoreInitializationParams): StoreInitializationState {
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(onboardingStorageKey) === 'true'
  })

  const getWorkspaceState = useCallback(() => workspaceState, [workspaceState])

  const studyStore = useMemo(() => createBrowserStudyStore(), [])
  const getStudyState = useCallback(() => studyStore.load(), [studyStore])

  const habitStore = useMemo(() => createHabitBrowserStore(), [])
  const getHabitState = useCallback(() => habitStore.load(), [habitStore])

  const journalStore = useMemo(() => createJournalBrowserStore(), [])
  const getJournalState = useCallback(() => journalStore.load(), [journalStore])

  const readingService = useMemo(() => createReadingService(), [])
  const getReadingState = useCallback(() => readingService.getState(), [readingService])

  const goalStore = useMemo(() => createGoalBrowserStore(), [])
  const getGoalsState = useCallback(() => goalStore.load(), [goalStore])

  const financeStore = useMemo(() => createFinanceBrowserStore(), [])
  const getFinanceState = useCallback(() => financeStore.load(), [financeStore])

  const wellnessStore = useMemo(() => createWellnessBrowserStore(), [])
  const getWellnessState = useCallback(() => wellnessStore.load(), [wellnessStore])

  const projectStore = useMemo(() => createProjectBrowserStore(), [])
  const getProjectState = useCallback(() => projectStore.load(), [projectStore])

  const handleOnboardingComplete = useCallback((data: OnboardingData) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(onboardingStorageKey, 'true')
      window.localStorage.setItem(onboardingDataKey, JSON.stringify(data))
    }
    setOnboardingCompleted(true)
  }, [])

  const handleOnboardingSkip = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(onboardingStorageKey, 'true')
    }
    setOnboardingCompleted(true)
  }, [])

  return {
    getWorkspaceState,
    studyStore,
    getStudyState,
    habitStore,
    getHabitState,
    journalStore,
    getJournalState,
    readingService,
    getReadingState,
    goalStore,
    getGoalsState,
    financeStore,
    getFinanceState,
    wellnessStore,
    getWellnessState,
    projectStore,
    getProjectState,
    onboardingCompleted,
    handleOnboardingComplete,
    handleOnboardingSkip
  }
}
