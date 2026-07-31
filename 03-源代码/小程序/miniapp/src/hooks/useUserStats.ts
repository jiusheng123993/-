/**
 * 用户数据统计 Hook
 * 提供宠物数量、打卡天数、疫苗和症状检查记录的汇总统计
 */
import { useMemo } from 'react';
import { usePetStore } from '../stores/petStore';
import { useCheckinStore } from '../stores/checkinStore';
import { getStorageArray } from '../utils/storage';

const VACCINE_DATA_KEY = 'vaccine_data';
const SYMPTOM_DATA_KEY = 'symptom_data';

interface UserStats {
  usageDays: number;
  petCount: number;
  checkinCount: number;
  vaccineCount: number;
  symptomCheckCount: number;
}

/**
 * 用户数据统计 Hook
 * 提供宠物数量、打卡天数、疫苗和症状检查记录的汇总统计
 */
export function useUserStats(): UserStats {
  const pets = usePetStore((state) => state.pets);
  const checkins = useCheckinStore((state) => state.checkins);

  return useMemo(() => {
    const vaccineData = getStorageArray(VACCINE_DATA_KEY);
    const symptomData = getStorageArray(SYMPTOM_DATA_KEY);

    const petCount = pets.length;
    const checkinCount = checkins.length;
    const vaccineCount = vaccineData.length;
    const symptomCheckCount = symptomData.length;

    let usageDays = 0;
    if (checkins.length > 0) {
      const sortedCheckins = [...checkins].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const firstEntryDate = new Date(sortedCheckins[0].createdAt);
      const now = new Date();
      const diffMs = now.getTime() - firstEntryDate.getTime();
      usageDays = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    }

    return {
      usageDays,
      petCount,
      checkinCount,
      vaccineCount,
      symptomCheckCount,
    };
  }, [pets, checkins]);
}

/** 获取用户累计使用天数 */
export function getUsageDays(): number {
  const checkins = useCheckinStore.getState().checkins;
  if (checkins.length === 0) return 0;

  const sortedCheckins = [...checkins].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const firstEntryDate = new Date(sortedCheckins[0].createdAt);
  const now = new Date();
  const diffMs = now.getTime() - firstEntryDate.getTime();
  return Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

/** 获取宠物总数 */
export function getPetCount(): number {
  return usePetStore.getState().pets.length;
}

/** 获取打卡记录总数 */
export function getCheckinCount(): number {
  return useCheckinStore.getState().checkins.length;
}

/** 获取疫苗记录总数 */
export function getVaccineCount(): number {
  const data = getStorageArray(VACCINE_DATA_KEY);
  return data.length;
}

/** 获取症状检查记录总数 */
export function getSymptomCheckCount(): number {
  const data = getStorageArray(SYMPTOM_DATA_KEY);
  return data.length;
}

/** 获取全部统计数据的快捷方法 */
export function getAllStats(): UserStats {
  return {
    usageDays: getUsageDays(),
    petCount: getPetCount(),
    checkinCount: getCheckinCount(),
    vaccineCount: getVaccineCount(),
    symptomCheckCount: getSymptomCheckCount(),
  };
}
