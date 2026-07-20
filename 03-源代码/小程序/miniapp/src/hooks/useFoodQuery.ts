import { useCallback } from 'react';
import { useFoodQueryStore } from '../stores/foodQueryStore';
import type { PetFoodQuery, FoodQueryStats } from '../stores/foodQueryStore';

interface UseFoodQueryReturn {
  history: PetFoodQuery[];
  lastResult: PetFoodQuery | null;
  stats: FoodQueryStats | null;
  isLoading: boolean;
  error: string | null;
  queryFood: (userId: string, petId: string, foodName: string, species: 'dog' | 'cat') => Promise<PetFoodQuery>;
  fetchHistory: (petId: string, userId: string) => Promise<void>;
  fetchStats: (petId: string, userId: string) => Promise<void>;
  clearError: () => void;
}

export function useFoodQuery(): UseFoodQueryReturn {
  const {
    history,
    lastResult,
    stats,
    isLoading,
    error,
    queryFood,
    fetchHistory,
    fetchStats,
    clearError,
  } = useFoodQueryStore();

  const handleQueryFood = useCallback(
    async (userId: string, petId: string, foodName: string, species: 'dog' | 'cat'): Promise<PetFoodQuery> => {
      return queryFood(userId, petId, foodName, species);
    },
    [queryFood]
  );

  const handleFetchHistory = useCallback(
    async (petId: string, userId: string): Promise<void> => {
      await fetchHistory(petId, userId);
    },
    [fetchHistory]
  );

  const handleFetchStats = useCallback(
    async (petId: string, userId: string): Promise<void> => {
      await fetchStats(petId, userId);
    },
    [fetchStats]
  );

  const handleClearError = useCallback((): void => {
    clearError();
  }, [clearError]);

  return {
    history,
    lastResult,
    stats,
    isLoading,
    error,
    queryFood: handleQueryFood,
    fetchHistory: handleFetchHistory,
    fetchStats: handleFetchStats,
    clearError: handleClearError,
  };
}
