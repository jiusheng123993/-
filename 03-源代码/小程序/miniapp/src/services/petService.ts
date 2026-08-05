/**
 * 宠物档案服务
 *
 * 宠物资料的 CRUD、当前宠物切换、本地缓存与云端同步
 */
import { api } from './api';
import { getStorage, setStorage, removeStorage } from '../utils/storage';
import { queueSync } from './syncHelper';
import type { PetProfile as UnifiedPetProfile } from '../memory-body/types/memoryBodyTypes';

export type PetProfile = UnifiedPetProfile;

export interface PetFact {
  id: number
  petId: string
  category: 'like' | 'dislike' | 'habit' | 'personality' | 'general'
  fact: string
  createdAt: string
}

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
    if (result && result.length > 0) {
      saveLocalPets(userId, result);
      return result;
    }
    return getLocalPets(userId);
  } catch (error) {
    return getLocalPets(userId);
  }
}

export async function getPetById(userId: string, id: string): Promise<PetProfile | null> {
  if (!userId) throw new Error('[PetService] userId is required');
  try {
    const result = await api.get<PetProfile>(`/api/pets/${id}`);
    if (result) {
      const localPets = getLocalPets(userId);
      const index = localPets.findIndex(p => p.id === id);
      if (index !== -1) {
        localPets[index] = result;
      } else {
        localPets.push(result);
      }
      saveLocalPets(userId, localPets);
      return result;
    }
    const localPets = getLocalPets(userId);
    return localPets.find(p => p.id === id) || null;
  } catch (error) {
    const localPets = getLocalPets(userId);
    return localPets.find(p => p.id === id) || null;
  }
}

function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    result[snakeKey] = obj[key]
  }
  return result
}

export async function createPet(
  userId: string,
  data: Omit<PetProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PetProfile> {
  if (!userId) throw new Error('[PetService] userId is required')
  const now = new Date().toISOString()
  const newPet: PetProfile = {
    id: generateId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  }

  try {
    const serverData = toSnakeCase(newPet as unknown as Record<string, unknown>)
    const result = await api.post<PetProfile>('/api/pets', serverData);
    const localPets = getLocalPets(userId);
    localPets.push(result);
    saveLocalPets(userId, localPets);
    queueSync('pet_profiles', newPet.id, 'insert', newPet, userId);
    return result;
  } catch (error) {
    // 离线兜底：存入本地存储并加入同步队列，但重新抛出错误让用户知晓失败原因
    const localPets = getLocalPets(userId);
    localPets.push(newPet);
    saveLocalPets(userId, localPets);
    queueSync('pet_profiles', newPet.id, 'insert', newPet, userId);
    throw error instanceof Error ? error : new Error('网络请求失败，请检查网络后重试')
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

    // 如果服务器返回404（宠物不在服务器上），先同步到服务器
    const is404 = error instanceof Error && error.message.includes('404')
      || (typeof error === 'object' && error !== null && 'statusCode' in error && (error as any).statusCode === 404);
    if (is404) {
      try {
        const localPet = localPets[index];
        const { id: _localId, createdAt, updatedAt, ...serverData } = localPet;
        const serverPet = await createPet(userId, serverData as Omit<PetProfile, 'id' | 'createdAt' | 'updatedAt'>);
        // 用服务器返回的 ID 更新本地存储
        const merged: PetProfile = { ...localPet, ...data, id: serverPet.id, updatedAt: new Date().toISOString() };
        localPets.splice(index, 1);
        localPets.push(merged);
        saveLocalPets(userId, localPets);
        // 用服务器 ID 再次尝试更新
        try {
          const result = await api.put<PetProfile>(`/api/pets/${serverPet.id}`, data);
          const refreshedPets = getLocalPets(userId);
          const idx = refreshedPets.findIndex(p => p.id === serverPet.id);
          if (idx !== -1) {
            refreshedPets[idx] = result;
            saveLocalPets(userId, refreshedPets);
          }
          queueSync('pet_profiles', serverPet.id, 'update', result, userId);
          return result;
        } catch {
          // 服务器更新也失败，至少已创建成功，返回合并后的数据
          queueSync('pet_profiles', serverPet.id, 'update', merged, userId);
          return merged;
        }
      } catch {
        // 创建也失败，降级为纯本地更新
      }
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

export async function getPetFacts(petId: string): Promise<PetFact[]> {
  try {
    const result = await api.get<PetFact[]>(`/api/pets/${petId}/facts`);
    return result || [];
  } catch {
    return [];
  }
}
