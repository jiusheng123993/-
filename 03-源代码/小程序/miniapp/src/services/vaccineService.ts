import Taro from '@tarojs/taro';
import { api } from './api';
import { getStorage, setStorage } from '../utils/storage';
import { queueSync } from './syncHelper';

export interface VaccineRecord {
  id: string;
  petId: string;
  type: 'vaccine' | 'deworm';
  category: string;
  date: string;
  nextDate: string;
  status: 'completed' | 'pending' | 'overdue';
  hospital?: string;
  doctor?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVaccineData {
  petId: string;
  userId: string;
  type: 'vaccine' | 'deworm';
  category: string;
  date: string;
  hospital?: string;
  doctor?: string;
  notes?: string;
}

export interface VaccineIntervalRule {
  category: string;
  intervalMonths: number;
  isCore: boolean;
}

const VACCINE_INTERVAL_RULES: VaccineIntervalRule[] = [
  { category: 'DHPP', intervalMonths: 36, isCore: true },
  { category: 'FVRCP', intervalMonths: 36, isCore: true },
  { category: 'rabies', intervalMonths: 12, isCore: true },
  { category: 'bordetella', intervalMonths: 12, isCore: false },
  { category: 'leptospirosis', intervalMonths: 12, isCore: false },
  { category: 'lyme', intervalMonths: 12, isCore: false },
  { category: 'felv', intervalMonths: 12, isCore: false },
  { category: 'internal_deworm', intervalMonths: 3, isCore: false },
  { category: 'external_deworm', intervalMonths: 1, isCore: false },
];

const VACCINE_KEY_PREFIX = 'vaccines_';

function getStorageKey(petId: string): string {
  return `${VACCINE_KEY_PREFIX}${petId}`;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getLocalRecords(petId: string): VaccineRecord[] {
  return getStorage<VaccineRecord[]>(getStorageKey(petId)) || [];
}

function saveLocalRecords(petId: string, records: VaccineRecord[]): void {
  setStorage(getStorageKey(petId), records);
}

function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr + 'T00:00:00.000Z');
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const newMonth = month + months;
  const newYear = year + Math.floor(newMonth / 12);
  const finalMonth = newMonth % 12;

  const newDate = new Date(Date.UTC(newYear, finalMonth, day));

  if (newDate.getUTCMonth() !== finalMonth) {
    newDate.setUTCDate(0);
  }

  return newDate.toISOString().slice(0, 10);
}

function calculateNextDate(category: string, date: string): string {
  const rule = VACCINE_INTERVAL_RULES.find((r) => r.category === category);
  if (rule) {
    return addMonths(date, rule.intervalMonths);
  }

  if (category.includes('internal') || category.includes('体内')) {
    return addMonths(date, 3);
  }
  if (category.includes('external') || category.includes('体外')) {
    return addMonths(date, 1);
  }

  return addMonths(date, 12);
}

function calculateStatus(nextDate: string): VaccineRecord['status'] {
  const today = new Date().toISOString().slice(0, 10);
  if (nextDate < today) {
    return 'overdue';
  }
  return 'pending';
}

function updateRecordStatus(record: VaccineRecord): VaccineRecord {
  if (record.status === 'completed') {
    return record;
  }
  return {
    ...record,
    status: calculateStatus(record.nextDate),
  };
}

export async function getVaccineRecords(petId: string): Promise<VaccineRecord[]> {
  try {
    const result = await api.get<VaccineRecord[]>(`/api/pets/${petId}/vaccines`);
    const updated = result.map(updateRecordStatus);
    saveLocalRecords(petId, updated);
    return updated;
  } catch (error) {
    const local = getLocalRecords(petId);
    return local.map(updateRecordStatus);
  }
}

export async function createVaccineRecord(data: CreateVaccineData): Promise<VaccineRecord> {
  const nextDate = calculateNextDate(data.category, data.date);
  const now = new Date().toISOString();

  const newRecord: VaccineRecord = {
    id: generateId(),
    ...data,
    nextDate,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const result = await api.post<VaccineRecord>(`/api/pets/${data.petId}/vaccines`, newRecord);
    const local = getLocalRecords(data.petId);
    local.push(result);
    saveLocalRecords(data.petId, local);
    queueSync('pet_vaccinations', result.id, 'insert', result, data.userId);
    return result;
  } catch (error) {
    const local = getLocalRecords(data.petId);
    local.push(newRecord);
    saveLocalRecords(data.petId, local);
    queueSync('pet_vaccinations', newRecord.id, 'insert', newRecord, data.userId);
    return newRecord;
  }
}

function getAllLocalRecords(): VaccineRecord[] {
  const keys: string[] = [];
  try {
    const storage = Taro.getStorageInfoSync();
    keys.push(...storage.keys.filter((k: string) => k.startsWith(`xhh_${VACCINE_KEY_PREFIX}`)));
  } catch {
    return [];
  }

  const all: VaccineRecord[] = [];
  for (const key of keys) {
    const records = getStorage<VaccineRecord[]>(key.replace('xhh_', ''));
    if (records) {
      all.push(...records);
    }
  }
  return all;
}

export async function updateVaccineRecord(
  id: string,
  data: Partial<Omit<VaccineRecord, 'id' | 'petId' | 'createdAt'>>
): Promise<VaccineRecord> {
  try {
    const result = await api.put<VaccineRecord>(`/api/vaccines/${id}`, data);

    const allRecords = getAllLocalRecords();
    const index = allRecords.findIndex((r) => r.id === id);
    if (index !== -1) {
      allRecords[index] = result;
      saveLocalRecords(result.petId, allRecords.filter((r) => r.petId === result.petId));
    }

    return result;
  } catch (error) {

    const allRecords = getAllLocalRecords();
    const index = allRecords.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error('记录不存在');
    }

    const existing = allRecords[index];
    const updated: VaccineRecord = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };

    if (data.category || data.date) {
      updated.nextDate = calculateNextDate(
        updated.category,
        updated.date
      );
    }

    if (updated.status !== 'completed') {
      updated.status = calculateStatus(updated.nextDate);
    }

    allRecords[index] = updated;
    saveLocalRecords(existing.petId, allRecords.filter((r) => r.petId === existing.petId));
    return updated;
  }
}

export async function deleteVaccineRecord(id: string): Promise<void> {
  try {
    await api.delete(`/api/vaccines/${id}`);
  } catch (error) {
  }

  const allRecords = getAllLocalRecords();
  const target = allRecords.find((r) => r.id === id);
  if (!target) {
    return;
  }

  const petId = target.petId;
  const local = getLocalRecords(petId);
  saveLocalRecords(petId, local.filter((r) => r.id !== id));
}

export async function getUpcomingRecords(petId: string, days: number = 30): Promise<VaccineRecord[]> {
  const records = await getVaccineRecords(petId);
  const today = new Date().toISOString().slice(0, 10);
  const futureDate = addMonths(today, 0);
  const targetDate = new Date(futureDate);
  targetDate.setDate(targetDate.getDate() + days);
  const targetStr = targetDate.toISOString().slice(0, 10);

  return records.filter(
    (r) =>
      r.status !== 'completed' &&
      r.nextDate >= today &&
      r.nextDate <= targetStr
  );
}

export async function getOverdueRecords(petId: string): Promise<VaccineRecord[]> {
  const records = await getVaccineRecords(petId);
  return records.filter((r) => r.status === 'overdue');
}

export async function markAsCompleted(id: string): Promise<VaccineRecord> {
  return updateVaccineRecord(id, { status: 'completed' });
}

export async function getRecordsByMonth(
  petId: string,
  year: number,
  month: number
): Promise<VaccineRecord[]> {
  const records = await getVaccineRecords(petId);
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  return records.filter(
    (r) => r.date.startsWith(monthStr) || r.nextDate.startsWith(monthStr)
  );
}

interface PetInfo {
  species: 'dog' | 'cat';
  breed: string;
  birthDate: string;
}

const CORE_VACCINES_DOG: string[] = ['DHPP', 'rabies'];
const CORE_VACCINES_CAT: string[] = ['FVRCP', 'rabies'];
const OPTIONAL_VACCINES_DOG: string[] = ['bordetella', 'leptospirosis', 'lyme'];
const OPTIONAL_VACCINES_CAT: string[] = ['felv'];
const DEWORM_CATEGORIES: string[] = ['internal_deworm', 'external_deworm'];

function isPuppyOrKitten(birthDate: string): boolean {
  const birth = new Date(birthDate + 'T00:00:00.000Z');
  const now = new Date();
  const ageInMonths =
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - birth.getUTCMonth());
  return ageInMonths < 12;
}

export async function generateInitialPlan(petId: string, petInfo: PetInfo): Promise<VaccineRecord[]> {
  const existing = getLocalRecords(petId);
  if (existing.length > 0) {
    return existing;
  }

  const today = new Date().toISOString().slice(0, 10);
  const isYoung = isPuppyOrKitten(petInfo.birthDate);
  const records: VaccineRecord[] = [];

  const coreVaccines = petInfo.species === 'dog' ? CORE_VACCINES_DOG : CORE_VACCINES_CAT;
  const optionalVaccines = petInfo.species === 'dog' ? OPTIONAL_VACCINES_DOG : OPTIONAL_VACCINES_CAT;

  for (const category of coreVaccines) {
    const date = isYoung ? addMonths(today, 1) : today;
    const nextDate = calculateNextDate(category, date);
    const now = new Date().toISOString();
    records.push({
      id: generateId(),
      petId,
      type: 'vaccine',
      category,
      date,
      nextDate,
      status: calculateStatus(nextDate),
      notes: isYoung ? '幼年首针，建议咨询兽医确定具体接种时间' : undefined,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (isYoung) {
    for (const category of optionalVaccines) {
      const date = addMonths(today, 2);
      const nextDate = calculateNextDate(category, date);
      const now = new Date().toISOString();
      records.push({
        id: generateId(),
        petId,
        type: 'vaccine',
        category,
        date,
        nextDate,
        status: calculateStatus(nextDate),
        notes: '非核心疫苗，建议咨询兽医是否需要接种',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  for (const category of DEWORM_CATEGORIES) {
    const date = today;
    const nextDate = calculateNextDate(category, date);
    const now = new Date().toISOString();
    records.push({
      id: generateId(),
      petId,
      type: 'deworm',
      category,
      date,
      nextDate,
      status: calculateStatus(nextDate),
      createdAt: now,
      updatedAt: now,
    });
  }

  saveLocalRecords(petId, records);
  return records;
}

export { VACCINE_INTERVAL_RULES, calculateNextDate };
