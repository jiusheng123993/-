/**
 * 疫苗管理 Hook
 * 提供疫苗记录的增删改查、接种完成标记和按月份筛选
 */
import { useEffect, useCallback } from 'react';
import { useVaccineStore } from '../stores/vaccineStore';
import type { VaccineRecord, CreateVaccineData } from '../services/vaccineService';

interface UseVaccineReturn {
  records: VaccineRecord[];
  upcomingRecords: VaccineRecord[];
  overdueRecords: VaccineRecord[];
  isLoading: boolean;
  error: string | null;
  fetchRecords: (petId: string) => Promise<void>;
  addRecord: (data: CreateVaccineData) => Promise<VaccineRecord>;
  updateRecord: (id: string, data: Partial<Omit<VaccineRecord, 'id' | 'petId' | 'createdAt'>>) => Promise<void>;
  removeRecord: (id: string) => Promise<void>;
  markCompleted: (id: string) => Promise<void>;
  fetchUpcoming: (petId: string, days?: number) => Promise<void>;
  fetchOverdue: (petId: string) => Promise<void>;
  initPlan: (petId: string, petInfo: { species: 'dog' | 'cat'; breed: string; birthDate: string }) => Promise<void>;
  getRecordsByMonth: (year: number, month: number) => VaccineRecord[];
  clearError: () => void;
}

/**
 * 疫苗管理 Hook
 * 提供疫苗记录的增删改查、接种完成标记和按月份筛选
 */
export function useVaccine(): UseVaccineReturn {
  const {
    records,
    upcomingRecords,
    overdueRecords,
    isLoading,
    error,
    fetchRecords,
    addRecord,
    updateRecord,
    removeRecord,
    markCompleted,
    fetchUpcoming,
    fetchOverdue,
    initPlan,
    getRecordsByMonth,
    clearError,
  } = useVaccineStore();

  const handleFetchRecords = useCallback(
    async (petId: string): Promise<void> => {
      await fetchRecords(petId);
    },
    [fetchRecords]
  );

  const handleAddRecord = useCallback(
    async (data: CreateVaccineData): Promise<VaccineRecord> => {
      return addRecord(data);
    },
    [addRecord]
  );

  const handleUpdateRecord = useCallback(
    async (id: string, data: Partial<Omit<VaccineRecord, 'id' | 'petId' | 'createdAt'>>): Promise<void> => {
      await updateRecord(id, data);
    },
    [updateRecord]
  );

  const handleRemoveRecord = useCallback(
    async (id: string): Promise<void> => {
      await removeRecord(id);
    },
    [removeRecord]
  );

  const handleMarkCompleted = useCallback(
    async (id: string): Promise<void> => {
      await markCompleted(id);
    },
    [markCompleted]
  );

  const handleFetchUpcoming = useCallback(
    async (petId: string, days?: number): Promise<void> => {
      await fetchUpcoming(petId, days);
    },
    [fetchUpcoming]
  );

  const handleFetchOverdue = useCallback(
    async (petId: string): Promise<void> => {
      await fetchOverdue(petId);
    },
    [fetchOverdue]
  );

  const handleInitPlan = useCallback(
    async (petId: string, petInfo: { species: 'dog' | 'cat'; breed: string; birthDate: string }): Promise<void> => {
      await initPlan(petId, petInfo);
    },
    [initPlan]
  );

  const handleGetRecordsByMonth = useCallback(
    (year: number, month: number): VaccineRecord[] => {
      return getRecordsByMonth(year, month);
    },
    [getRecordsByMonth]
  );

  const handleClearError = useCallback((): void => {
    clearError();
  }, [clearError]);

  return {
    records,
    upcomingRecords,
    overdueRecords,
    isLoading,
    error,
    fetchRecords: handleFetchRecords,
    addRecord: handleAddRecord,
    updateRecord: handleUpdateRecord,
    removeRecord: handleRemoveRecord,
    markCompleted: handleMarkCompleted,
    fetchUpcoming: handleFetchUpcoming,
    fetchOverdue: handleFetchOverdue,
    initPlan: handleInitPlan,
    getRecordsByMonth: handleGetRecordsByMonth,
    clearError: handleClearError,
  };
}
