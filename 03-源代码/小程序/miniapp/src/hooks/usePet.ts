import { useEffect, useCallback } from 'react';
import { usePetStore, type PetProfile } from '../stores/petStore';

interface UsePetReturn {
  pets: PetProfile[];
  currentPet: PetProfile | null;
  isLoading: boolean;
  error: string | null;
  initUser: (userId: string) => Promise<void>;
  addPet: (data: Omit<PetProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PetProfile>;
  updatePet: (id: string, data: Partial<PetProfile>) => Promise<void>;
  removePet: (id: string) => Promise<void>;
  markPetDeceased: (id: string, date: string) => Promise<void>;
  switchPet: (id: string) => Promise<void>;
  refreshPets: () => Promise<void>;
  clearError: () => void;
}

export function usePet(): UsePetReturn {
  const {
    userId,
    pets,
    currentPet,
    isLoading,
    error,
    initUser,
    fetchPets,
    addPet,
    updatePet,
    removePet,
    markPetDeceased,
    switchPet,
    clearError,
  } = usePetStore();

  useEffect(() => {
    if (userId && pets.length === 0) {
      fetchPets();
    }
  }, [userId, pets.length, fetchPets]);

  const handleInitUser = useCallback(
    async (uid: string): Promise<void> => {
      await initUser(uid);
    },
    [initUser]
  );

  const handleAddPet = useCallback(
    async (data: Omit<PetProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<PetProfile> => {
      return addPet(data);
    },
    [addPet]
  );

  const handleUpdatePet = useCallback(
    async (id: string, data: Partial<PetProfile>): Promise<void> => {
      await updatePet(id, data);
    },
    [updatePet]
  );

  const handleRemovePet = useCallback(
    async (id: string): Promise<void> => {
      await removePet(id);
    },
    [removePet]
  );

  const handleMarkPetDeceased = useCallback(
    async (id: string, date: string): Promise<void> => {
      await markPetDeceased(id, date);
    },
    [markPetDeceased]
  );

  const handleSwitchPet = useCallback(
    async (id: string): Promise<void> => {
      await switchPet(id);
    },
    [switchPet]
  );

  const handleRefreshPets = useCallback(async (): Promise<void> => {
    await fetchPets();
  }, [fetchPets]);

  const handleClearError = useCallback((): void => {
    clearError();
  }, [clearError]);

  return {
    pets,
    currentPet,
    isLoading,
    error,
    initUser: handleInitUser,
    addPet: handleAddPet,
    updatePet: handleUpdatePet,
    removePet: handleRemovePet,
    markPetDeceased: handleMarkPetDeceased,
    switchPet: handleSwitchPet,
    refreshPets: handleRefreshPets,
    clearError: handleClearError,
  };
}
