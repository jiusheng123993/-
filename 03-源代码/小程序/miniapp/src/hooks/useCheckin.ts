import { useCallback } from 'react';
import { useCheckinStore } from '../stores/checkinStore';
import type { Checkin } from '../types';

interface UseCheckinReturn {
  checkins: Checkin[];
  todayCheckin: Checkin | null;
  streakDays: number;
  isLoading: boolean;
  initUser: (userId: string) => Promise<void>;
  doCheckin: (data: Partial<Checkin>) => Promise<Checkin>;
  fetchCheckins: (petId: string) => Promise<void>;
}

export function useCheckin(): UseCheckinReturn {
  const {
    checkins,
    todayCheckin,
    streakDays,
    isLoading,
    initUser,
    fetchCheckins,
    doCheckin,
  } = useCheckinStore();

  const handleInitUser = useCallback(
    async (userId: string): Promise<void> => {
      await initUser(userId);
    },
    [initUser]
  );

  const handleDoCheckin = useCallback(
    async (data: Partial<Checkin>): Promise<Checkin> => {
      return doCheckin(data);
    },
    [doCheckin]
  );

  const handleFetchCheckins = useCallback(
    async (petId: string): Promise<void> => {
      await fetchCheckins(petId);
    },
    [fetchCheckins]
  );

  return {
    checkins,
    todayCheckin,
    streakDays,
    isLoading,
    initUser: handleInitUser,
    doCheckin: handleDoCheckin,
    fetchCheckins: handleFetchCheckins,
  };
}
