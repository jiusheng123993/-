/**
 * 疫苗/驱虫提醒 Hook
 * 提供订阅管理、即将到期和逾期的提醒查询、本地提醒调度
 */
import { useCallback } from 'react';
import { useReminderStore } from '../stores/reminderStore';
import type { ReminderItem, LocalReminder } from '../services/reminderService';
import {
  checkUpcomingReminders,
  scheduleLocalReminder,
  getLocalReminders,
  markReminderTriggered,
  clearLocalReminders,
} from '../services/reminderService';
import type { VaccineRecord } from '../services/vaccineService';

interface UseReminderReturn {
  subscriptionStatus: boolean;
  upcomingReminders: ReminderItem[];
  overdueReminders: ReminderItem[];
  isLoading: boolean;
  error: string | null;
  fetchSubscriptionStatus: () => void;
  requestSubscription: () => Promise<boolean>;
  fetchUpcomingReminders: (petId: string, days?: number) => void;
  fetchOverdueReminders: (petId: string) => void;
  toggleSubscription: (subscribed: boolean) => void;
  checkReminders: (petId: string) => ReminderItem[];
  scheduleReminder: (record: VaccineRecord, daysBefore: number) => LocalReminder;
  getReminders: () => LocalReminder[];
  markTriggered: (recordId: string) => void;
  clearReminders: (petId: string) => void;
  clearError: () => void;
}

/**
 * 疫苗/驱虫提醒 Hook
 * 提供订阅管理、即将到期和逾期的提醒查询、本地提醒调度
 */
export function useReminder(): UseReminderReturn {
  const {
    subscriptionStatus,
    upcomingReminders,
    overdueReminders,
    isLoading,
    error,
    fetchSubscriptionStatus,
    requestSubscription,
    fetchUpcomingReminders,
    fetchOverdueReminders,
    toggleSubscription,
    clearError,
  } = useReminderStore();

  const handleCheckReminders = useCallback(
    (petId: string): ReminderItem[] => {
      return checkUpcomingReminders(petId);
    },
    []
  );

  const handleScheduleReminder = useCallback(
    (record: VaccineRecord, daysBefore: number): LocalReminder => {
      return scheduleLocalReminder(record, daysBefore);
    },
    []
  );

  const handleGetReminders = useCallback((): LocalReminder[] => {
    return getLocalReminders();
  }, []);

  const handleMarkTriggered = useCallback(
    (recordId: string): void => {
      markReminderTriggered(recordId);
    },
    []
  );

  const handleClearReminders = useCallback(
    (petId: string): void => {
      clearLocalReminders(petId);
    },
    []
  );

  const handleToggleSubscription = useCallback(
    (subscribed: boolean): void => {
      toggleSubscription(subscribed);
    },
    [toggleSubscription]
  );

  const handleFetchSubscriptionStatus = useCallback((): void => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const handleRequestSubscription = useCallback(
    async (): Promise<boolean> => {
      return requestSubscription();
    },
    [requestSubscription]
  );

  const handleFetchUpcomingReminders = useCallback(
    (petId: string, days?: number): void => {
      fetchUpcomingReminders(petId, days);
    },
    [fetchUpcomingReminders]
  );

  const handleFetchOverdueReminders = useCallback(
    (petId: string): void => {
      fetchOverdueReminders(petId);
    },
    [fetchOverdueReminders]
  );

  const handleClearError = useCallback((): void => {
    clearError();
  }, [clearError]);

  return {
    subscriptionStatus,
    upcomingReminders,
    overdueReminders,
    isLoading,
    error,
    fetchSubscriptionStatus: handleFetchSubscriptionStatus,
    requestSubscription: handleRequestSubscription,
    fetchUpcomingReminders: handleFetchUpcomingReminders,
    fetchOverdueReminders: handleFetchOverdueReminders,
    toggleSubscription: handleToggleSubscription,
    checkReminders: handleCheckReminders,
    scheduleReminder: handleScheduleReminder,
    getReminders: handleGetReminders,
    markTriggered: handleMarkTriggered,
    clearReminders: handleClearReminders,
    clearError: handleClearError,
  };
}
