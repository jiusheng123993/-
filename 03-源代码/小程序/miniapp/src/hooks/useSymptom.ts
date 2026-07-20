import { useEffect, useCallback } from 'react'
import { useSymptomStore } from '../stores/symptomStore'
import type { SymptomCheckResult, SymptomCategory } from '../services/symptomService'
import type { PetProfile } from '../services/petService'

interface UseSymptomReturn {
  categories: SymptomCategory[]
  selectedSymptoms: string[]
  currentResult: SymptomCheckResult | null
  history: SymptomCheckResult[]
  isLoading: boolean
  error: string | null
  fetchCategories: (species?: 'cat' | 'dog') => void
  selectSymptom: (symptomId: string) => void
  deselectSymptom: (symptomId: string) => void
  analyzeSymptoms: (
    petId: string,
    additionalInfo?: SymptomCheckResult['additionalInfo'],
    petProfile?: PetProfile
  ) => Promise<SymptomCheckResult>
  fetchHistory: (petId: string) => Promise<void>
  fetchCheckResult: (id: string) => Promise<void>
  removeCheckResult: (id: string) => Promise<void>
  clearSelection: () => void
  clearError: () => void
}

export function useSymptom(): UseSymptomReturn {
  const {
    categories,
    selectedSymptoms,
    currentResult,
    history,
    isLoading,
    error,
    fetchCategories,
    selectSymptom,
    deselectSymptom,
    analyzeSymptoms,
    fetchHistory,
    fetchCheckResult,
    removeCheckResult,
    clearSelection,
    clearError,
  } = useSymptomStore()

  const handleFetchCategories = useCallback(
    (species?: 'cat' | 'dog') => {
      fetchCategories(species)
    },
    [fetchCategories]
  )

  const handleSelectSymptom = useCallback(
    (symptomId: string) => {
      selectSymptom(symptomId)
    },
    [selectSymptom]
  )

  const handleDeselectSymptom = useCallback(
    (symptomId: string) => {
      deselectSymptom(symptomId)
    },
    [deselectSymptom]
  )

  const handleAnalyzeSymptoms = useCallback(
    async (
      petId: string,
      additionalInfo?: SymptomCheckResult['additionalInfo'],
      petProfile?: PetProfile
    ): Promise<SymptomCheckResult> => {
      return analyzeSymptoms(petId, additionalInfo, petProfile)
    },
    [analyzeSymptoms]
  )

  const handleFetchHistory = useCallback(
    async (petId: string): Promise<void> => {
      await fetchHistory(petId)
    },
    [fetchHistory]
  )

  const handleFetchCheckResult = useCallback(
    async (id: string): Promise<void> => {
      await fetchCheckResult(id)
    },
    [fetchCheckResult]
  )

  const handleRemoveCheckResult = useCallback(
    async (id: string): Promise<void> => {
      await removeCheckResult(id)
    },
    [removeCheckResult]
  )

  const handleClearSelection = useCallback((): void => {
    clearSelection()
  }, [clearSelection])

  const handleClearError = useCallback((): void => {
    clearError()
  }, [clearError])

  return {
    categories,
    selectedSymptoms,
    currentResult,
    history,
    isLoading,
    error,
    fetchCategories: handleFetchCategories,
    selectSymptom: handleSelectSymptom,
    deselectSymptom: handleDeselectSymptom,
    analyzeSymptoms: handleAnalyzeSymptoms,
    fetchHistory: handleFetchHistory,
    fetchCheckResult: handleFetchCheckResult,
    removeCheckResult: handleRemoveCheckResult,
    clearSelection: handleClearSelection,
    clearError: handleClearError,
  }
}
