import { api } from './api';
import { getStorage, setStorage, removeStorage } from '../utils/storage';
import { queueSync } from './syncHelper';
import type { PetProfile as UnifiedPetProfile } from '../memory-body/types/memoryBodyTypes';

export type PetProfile = UnifiedPetProfile;

const PETS_KEY = 'pets';
const CURRENT_PET_ID_KEY = 'current_pet_id';
const HEALTH_ENTRIES_KEY = 'health_entries';
const VACCINATIONS_KEY = 'vaccinations';
const VACCINE_REMINDERS_KEY = 'vaccine_reminders';
const FOOD_QUERY_HISTORY_KEY = 'food_query_history';
const CHECKIN_STATS_KEY = 'checkin_stats';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function userKey(userId: string, key: string): string {
  return `${key}_${userId}`;
}

function getLocalPets(userId: string): PetProfile[] {
  return getStorage<PetProfile[]>(userKey(userId, PETS_KEY)) || [];
}

function saveLocalPets(userId: string, pets: PetProfile[]): void {
  setStorage(userKey(userId, PETS_KEY), pets);
}

export async function getPets(userId: string): Promise<PetProfile[]> {
  if (!userId) throw new Error('[PetService] userId is required');
  try {
    const result = await api.get<PetProfile[]>('/api/pets');
    saveLocalPets(userId, result);
    return result;
  } catch (error) {
    return getLocalPets(userId);
  }
}

export async function getPetById(userId: string, id: string): Promise<PetProfile | null> {
  if (!userId) throw new Error('[PetService] userId is required');
  try {
    const result = await api.get<PetProfile>(`/api/pets/${id}`);
    const localPets = getLocalPets(userId);
    const index = localPets.findIndex(p => p.id === id);
    if (index !== -1) {
      localPets[index] = result;
    } else {
      localPets.push(result);
    }
    saveLocalPets(userId, localPets);
    return result;
  } catch (error) {
    const localPets = getLocalPets(userId);
    return localPets.find(p => p.id === id) || null;
  }
}

export async function createPet(
  userId: string,
  data: Omit<PetProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PetProfile> {
  if (!userId) throw new Error('[PetService] userId is required');
  const now = new Date().toISOString();
  const newPet: PetProfile = {
    id: generateId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const result = await api.post<PetProfile>('/api/pets', newPet);
    const localPets = getLocalPets(userId);
    localPets.push(result);
    saveLocalPets(userId, localPets);
    queueSync('pet_profiles', newPet.id, 'insert', newPet, userId);
    return result;
  } catch (error) {
    const localPets = getLocalPets(userId);
    localPets.push(newPet);
    saveLocalPets(userId, localPets);
    queueSync('pet_profiles', newPet.id, 'insert', newPet, userId);
    return newPet;
  }
}

export async function updatePet(
  userId: string,
  id: string,
  data: Partial<PetProfile>
): Promise<PetProfile> {
  if (!userId) throw new Error('[PetService] userId is required');
  try {
    const result = await api.put<PetProfile>(`/api/pets/${id}`, data);
    const localPets = getLocalPets(userId);
    const index = localPets.findIndex(p => p.id === id);
    if (index !== -1) {
      localPets[index] = result;
      saveLocalPets(userId, localPets);
    }
    queueSync('pet_profiles', id, 'update', result, userId);
    return result;
  } catch (error) {
    const localPets = getLocalPets(userId);
    const index = localPets.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Pet not found');
    }
    const updated: PetProfile = {
      ...localPets[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    localPets[index] = updated;
    saveLocalPets(userId, localPets);
    queueSync('pet_profiles', id, 'update', updated, userId);
    return updated;
  }
}

function deletePetRelatedData(userId: string, petId: string): void {
  const healthEntries = getStorage<Record<string, unknown>[]>(userKey(userId, HEALTH_ENTRIES_KEY)) || [];
  setStorage(userKey(userId, HEALTH_ENTRIES_KEY), healthEntries.filter(e => (e as { petId?: string }).petId !== petId));

  const vaccinations = getStorage<Record<string, unknown>[]>(userKey(userId, VACCINATIONS_KEY)) || [];
  setStorage(userKey(userId, VACCINATIONS_KEY), vaccinations.filter(v => (v as { petId?: string }).petId !== petId));

  const reminders = getStorage<Record<string, unknown>[]>(userKey(userId, VACCINE_REMINDERS_KEY)) || [];
  setStorage(userKey(userId, VACCINE_REMINDERS_KEY), reminders.filter(r => (r as { petId?: string }).petId !== petId));

  const foodHistory = getStorage<Record<string, unknown>[]>(userKey(userId, FOOD_QUERY_HISTORY_KEY)) || [];
  setStorage(userKey(userId, FOOD_QUERY_HISTORY_KEY), foodHistory.filter(f => (f as { petId?: string }).petId !== petId));

  removeStorage(userKey(userId, `${CHECKIN_STATS_KEY}_${petId}`));
}

export async function deletePet(userId: string, id: string): Promise<void> {
  if (!userId) throw new Error('[PetService] userId is required');
  try {
    await api.delete(`/api/pets/${id}`);
    const localPets = getLocalPets(userId);
    saveLocalPets(userId, localPets.filter(p => p.id !== id));
    deletePetRelatedData(userId, id);
    queueSync('pet_profiles', id, 'delete', { id }, userId);
    const currentId = getStorage<string>(userKey(userId, CURRENT_PET_ID_KEY));
    if (currentId === id) {
      removeStorage(userKey(userId, CURRENT_PET_ID_KEY));
    }
  } catch (error) {
    const localPets = getLocalPets(userId);
    saveLocalPets(userId, localPets.filter(p => p.id !== id));
    deletePetRelatedData(userId, id);
    queueSync('pet_profiles', id, 'delete', { id }, userId);
    const currentId = getStorage<string>(userKey(userId, CURRENT_PET_ID_KEY));
    if (currentId === id) {
      removeStorage(userKey(userId, CURRENT_PET_ID_KEY));
    }
  }
}

export async function markDeceased(userId: string, id: string, date: string): Promise<PetProfile> {
  return updatePet(userId, id, {
    isDeceased: true,
    deceasedDate: date,
  });
}

export async function getCurrentPet(userId: string): Promise<PetProfile | null> {
  if (!userId) throw new Error('[PetService] userId is required');
  const currentId = getStorage<string>(userKey(userId, CURRENT_PET_ID_KEY));
  if (!currentId) {
    const pets = await getPets(userId);
    if (pets.length === 0) return null;
    return pets[0];
  }
  return getPetById(userId, currentId);
}

export async function setCurrentPet(userId: string, id: string): Promise<void> {
  if (!userId) throw new Error('[PetService] userId is required');
  setStorage(userKey(userId, CURRENT_PET_ID_KEY), id);
}
