import { useCallback } from 'react';
import { useCheckinStore } from '../stores/checkinStore';
import type { PetHealthEntry, HealthCheckinStats } from '../stores/checkinStore';

interface UseCheckinReturn {
  entries: PetHealthEntry[];
  todayEntry: PetHealthEntry | null;
  stats: HealthCheckinStats | null;
  isLoading: boolean;
  error: string | null;
  initUser: (userId: string) => void;
  addCheckin: (
    data: Omit<PetHealthEntry, 'id' | 'createdAt' | 'riskLevel' | 'aiFeedback'>
  ) => Promise<PetHealthEntry>;
  fetchTodayCheckin: (petId: string) => Promise<void>;
  fetchStats: (petId: string) => Promise<void>;
  refreshCheckins: (petId: string) => Promise<void>;
  clearError: () => void;
}

export function useCheckin(): UseCheckinReturn {
  const {
    entries,
    todayEntry,
    stats,
    isLoading,
    error,
    initUser,
    fetchCheckins,
    fetchTodayCheckin,
    addCheckin,
    fetchStats,
    clearError,
  } = useCheckinStore();

  const handleInitUser = useCallback(
    (userId: string): void => {
      initUser(userId);
    },
    [initUser]
  );

  const handleAddCheckin = useCallback(
    async (
      data: Omit<PetHealthEntry, 'id' | 'createdAt' | 'riskLevel' | 'aiFeedback'>
    ): Promise<PetHealthEntry> => {
      return addCheckin(data);
    },
    [addCheckin]
  );

  const handleFetchTodayCheckin = useCallback(
    async (petId: string): Promise<void> => {
      await fetchTodayCheckin(petId);
    },
    [fetchTodayCheckin]
  );

  const handleFetchStats = useCallback(
    async (petId: string): Promise<void> => {
      await fetchStats(petId);
    },
    [fetchStats]
  );

  const handleRefreshCheckins = useCallback(
    async (petId: string): Promise<void> => {
      await fetchCheckins(petId);
    },
    [fetchCheckins]
  );

  const handleClearError = useCallback((): void => {
    clearError();
  }, [clearError]);

  return {
    entries,
    todayEntry,
    stats,
    isLoading,
    error,
    initUser: handleInitUser,
    addCheckin: handleAddCheckin,
    fetchTodayCheckin: handleFetchTodayCheckin,
    fetchStats: handleFetchStats,
    refreshCheckins: handleRefreshCheckins,
    clearError: handleClearError,
  };
}
