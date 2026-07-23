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

export function getPetCount(): number {
  return usePetStore.getState().pets.length;
}

export function getCheckinCount(): number {
  return useCheckinStore.getState().checkins.length;
}

export function getVaccineCount(): number {
  const data = getStorageArray(VACCINE_DATA_KEY);
  return data.length;
}

export function getSymptomCheckCount(): number {
  const data = getStorageArray(SYMPTOM_DATA_KEY);
  return data.length;
}

export function getAllStats(): UserStats {
  return {
    usageDays: getUsageDays(),
    petCount: getPetCount(),
    checkinCount: getCheckinCount(),
    vaccineCount: getVaccineCount(),
    symptomCheckCount: getSymptomCheckCount(),
  };
}
