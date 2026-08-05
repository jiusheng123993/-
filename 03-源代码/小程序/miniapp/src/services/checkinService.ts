/**
 * 健康打卡服务
 *
 * 宠物健康打卡的查询/创建/统计，含本地缓存与云端同步、风险评估与 AI 反馈
 */
import { api } from './api';
import { getStorage, setStorage } from '../utils/storage';
import { queueSync } from './syncHelper';
import { requirePetOwnership } from '../utils/petOwnership';
import type { PetHealthEntry, HealthRiskLevel, AnomalyItem } from '../memory-body/types/memoryBodyTypes';
export type { PetHealthEntry, HealthRiskLevel } from '../memory-body/types/memoryBodyTypes';

/** 健康打卡统计 */
export interface HealthCheckinStats {
  totalCheckins: number;
  streak: number;
  lastCheckinDate: string | null;
  weeklyCount: number;
  monthlyCount: number;
  consecutiveAnomalyDays: number;
  totalAnomalyDays: number;
  lastAnomalyDate: string | null;
}

function userKey(key: string, userId: string): string {
  return `${key}_${userId}`;
}

function getStorageKey(petId: string, userId: string): string {
  return userKey(`checkins_${petId}`, userId);
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getLocalCheckins(petId: string, userId: string): PetHealthEntry[] {
  return getStorage<PetHealthEntry[]>(getStorageKey(petId, userId)) || [];
}

function saveLocalCheckins(petId: string, userId: string, entries: PetHealthEntry[]): void {
  setStorage(getStorageKey(petId, userId), entries);
}

type LegacyRiskLevel = 'normal' | 'caution' | 'warning' | 'emergency';

function mapRiskLevel(legacy: LegacyRiskLevel): HealthRiskLevel {
  switch (legacy) {
    case 'normal': return 'low';
    case 'caution': return 'medium';
    case 'warning': return 'high';
    case 'emergency': return 'emergency';
  }
}

/** 打卡输入参数 */
export interface CheckinInput {
  petId: string;
  userId: string;
  poopLevel: 1 | 2 | 3 | 4 | 5;
  appetiteLevel: 1 | 2 | 3 | 4 | 5 | 6;
  spiritLevel: 1 | 2 | 3 | 4 | 5;
  exerciseLevel: 1 | 2 | 3;
  weight?: number;
  hasAnomaly: boolean;
  anomalyItems: AnomalyItem[];
  note?: string;
}

function calculateRiskLevel(entry: CheckinInput): HealthRiskLevel {
  let legacy: LegacyRiskLevel = 'normal';

  if (entry.poopLevel === 1) legacy = 'emergency';
  else if (entry.appetiteLevel === 6) legacy = 'emergency';
  else if (entry.appetiteLevel === 1 && entry.spiritLevel === 1) legacy = 'emergency';
  else if (entry.poopLevel === 2 && entry.appetiteLevel <= 2 && entry.spiritLevel <= 2) legacy = 'emergency';
  else if (entry.appetiteLevel === 5 && entry.poopLevel <= 2) legacy = 'emergency';
  else if (entry.appetiteLevel <= 2 && entry.spiritLevel <= 2) legacy = 'warning';
  else if (entry.poopLevel === 2) legacy = 'warning';
  else if (entry.appetiteLevel <= 2) legacy = 'warning';
  else if (entry.spiritLevel <= 2) legacy = 'warning';
  else if (entry.appetiteLevel === 5 && entry.spiritLevel <= 2) legacy = 'warning';
  else if (entry.appetiteLevel === 5) legacy = 'caution';
  else if (entry.hasAnomaly) legacy = 'caution';
  else if (entry.appetiteLevel === 3 || entry.spiritLevel === 3) legacy = 'caution';

  return mapRiskLevel(legacy);
}

function generateAiFeedback(entry: CheckinInput, riskLevel: HealthRiskLevel): string {
  const symptoms: string[] = [];

  if (entry.appetiteLevel <= 2) symptoms.push('食欲异常');
  if (entry.appetiteLevel === 6) symptoms.push('呕吐');
  if (entry.appetiteLevel === 5) symptoms.push('食欲亢进');
  if (entry.spiritLevel <= 2) symptoms.push('精神状态异常');
  if (entry.poopLevel <= 2) symptoms.push('排便异常');
  if (entry.hasAnomaly) symptoms.push(`异常项：${entry.anomalyItems.join('、')}`);

  const symptomText = symptoms.length > 0 ? `具体症状：${symptoms.join('、')}。` : '';

  switch (riskLevel) {
    case 'emergency':
      return `⚠️ 检测到紧急健康信号！建议立即联系宠物医院。${symptomText}`;
    case 'high':
      return `🔔 您的宠物出现了一些需要关注的症状。建议密切观察，如持续恶化请就医。${symptomText}`;
    case 'medium':
      return `💡 您的宠物有些小异常，建议多观察。${symptomText}`;
    case 'low':
      return '✅ 您的宠物今天状态不错！继续保持良好的照顾习惯。';
  }
}

function entryDateStr(entry: PetHealthEntry): string {
  if (entry.createdAt instanceof Date) {
    return entry.createdAt.toISOString().slice(0, 10);
  }
  return String(entry.createdAt).slice(0, 10);
}

/**
 * 获取打卡记录列表（含本地缓存兜底）
 * @param petId - 宠物 ID
 * @param userId - 用户 ID
 */
export async function getCheckins(petId: string, userId: string): Promise<PetHealthEntry[]> {
  requirePetOwnership(petId, userId);
  try {
    const result = await api.get<PetHealthEntry[]>(`/api/pets/${petId}/checkins`);
    saveLocalCheckins(petId, userId, result);
    return result;
  } catch (error) {
    return getLocalCheckins(petId, userId);
  }
}

/**
 * 按日期范围查询打卡记录
 * @param petId - 宠物 ID
 * @param userId - 用户 ID
 * @param startDate - 开始日期 (YYYY-MM-DD)
 * @param endDate - 结束日期 (YYYY-MM-DD)
 */
export async function getCheckinsByDateRange(
  petId: string,
  userId: string,
  startDate: string,
  endDate: string
): Promise<PetHealthEntry[]> {
  requirePetOwnership(petId, userId);
  try {
    const result = await api.get<PetHealthEntry[]>(
      `/api/pets/${petId}/checkins?startDate=${startDate}&endDate=${endDate}`
    );
    return result;
  } catch (error) {
    const all = getLocalCheckins(petId, userId);
    return all.filter((e) => {
      const dateStr = entryDateStr(e);
      return dateStr >= startDate && dateStr <= endDate;
    });
  }
}

/**
 * 创建打卡记录（先写云端，失败则存本地）
 * @param data - 打卡输入参数
 */
export async function createCheckin(data: CheckinInput): Promise<PetHealthEntry> {
  requirePetOwnership(data.petId, data.userId);
  const riskLevel = calculateRiskLevel(data);
  const aiFeedback = generateAiFeedback(data, riskLevel);
  const now = new Date();

  const newEntry: PetHealthEntry = {
    id: generateId(),
    petId: data.petId,
    userId: data.userId,
    poopLevel: data.poopLevel,
    appetiteLevel: data.appetiteLevel,
    spiritLevel: data.spiritLevel,
    exerciseLevel: data.exerciseLevel,
    weight: data.weight,
    hasAnomaly: data.hasAnomaly,
    anomalyItems: data.anomalyItems,
    aiFeedback,
    riskLevel,
    note: data.note,
    createdAt: now,
  };

  try {
    // 后端 createCheckinSchema 使用 snake_case（必填：4 个等级 + risk_level）
    const result = await api.post<PetHealthEntry>(`/api/pets/${data.petId}/checkins`, {
      poop_level: data.poopLevel,
      appetite_level: data.appetiteLevel,
      spirit_level: data.spiritLevel,
      exercise_level: data.exerciseLevel,
      weight: data.weight,
      has_anomaly: data.hasAnomaly,
      anomaly_items: data.anomalyItems,
      ai_feedback: aiFeedback,
      risk_level: riskLevel,
      note: data.note,
    });
    const local = getLocalCheckins(data.petId, data.userId);
    const todayStr = entryDateStr(newEntry);
    const existingIndex = local.findIndex((e) => entryDateStr(e) === todayStr);
    if (existingIndex !== -1) {
      local[existingIndex] = result;
    } else {
      local.push(result);
    }
    saveLocalCheckins(data.petId, data.userId, local);
    queueSync('pet_health_entries', newEntry.id, 'insert', newEntry, data.userId);
    return result;
  } catch (error) {
    const local = getLocalCheckins(data.petId, data.userId);
    const todayStr = entryDateStr(newEntry);
    const existingIndex = local.findIndex((e) => entryDateStr(e) === todayStr);
    if (existingIndex !== -1) {
      local[existingIndex] = newEntry;
    } else {
      local.push(newEntry);
    }
    saveLocalCheckins(data.petId, data.userId, local);
    queueSync('pet_health_entries', newEntry.id, 'insert', newEntry, data.userId);
    return newEntry;
  }
}

/**
 * 获取今日打卡记录
 * @param petId - 宠物 ID
 * @param userId - 用户 ID
 */
export async function getTodayCheckin(petId: string, userId: string): Promise<PetHealthEntry | null> {
  if (!petId) {
    console.warn('getTodayCheckin: petId is required');
    return null;
  }
  const today = new Date().toISOString().slice(0, 10);
  try {
    const result = await api.get<PetHealthEntry | null>(
      `/api/pets/${petId}/checkins/today?date=${today}`
    );
    return result;
  } catch (error) {
    const local = getLocalCheckins(petId, userId);
    return local.find((e) => entryDateStr(e) === today) || null;
  }
}

/**
 * 获取打卡统计数据
 * 后端未提供 stats 专用接口，直接基于本地缓存计算（含云端同步回写的数据）
 * @param petId - 宠物 ID
 * @param userId - 用户 ID
 */
export async function getCheckinStats(petId: string, userId: string): Promise<HealthCheckinStats> {
  const local = getLocalCheckins(petId, userId);
  return calculateLocalStats(local);
}

export async function getLatestCheckin(petId: string, userId: string): Promise<PetHealthEntry | null> {
  const local = getLocalCheckins(petId, userId);
  if (local.length === 0) return null;
  return local.reduce((latest, entry) =>
    entryDateStr(entry) > entryDateStr(latest) ? entry : latest
  );
}

export function calculateConsecutiveAnomalyDays(
  entries: PetHealthEntry[],
): number {
  const sorted = [...entries]
    .sort((a, b) => {
      const aStr = entryDateStr(a)
      const bStr = entryDateStr(b)
      return bStr.localeCompare(aStr)
    })
  const seenDates = new Set<string>()
  let count = 0
  for (const entry of sorted) {
    const dateStr = entryDateStr(entry)
    if (seenDates.has(dateStr)) continue
    seenDates.add(dateStr)
    if (entry.hasAnomaly) {
      count++
    } else {
      break
    }
  }
  return count
}

function calculateLocalStats(entries: PetHealthEntry[]): HealthCheckinStats {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  const sortedDates = entries
    .map((e) => entryDateStr(e))
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .sort()
    .reverse();

  let streak = 0;
  const checkDate = new Date(todayStr);
  for (const dateStr of sortedDates) {
    const expected = checkDate.toISOString().slice(0, 10);
    if (dateStr === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const consecutiveAnomalyDays = calculateConsecutiveAnomalyDays(entries);
  const anomalyEntries = entries.filter((e) => e.hasAnomaly);
  const totalAnomalyDays = anomalyEntries.length;
  const lastAnomalyDate = anomalyEntries.length > 0
    ? entryDateStr(anomalyEntries.sort((a, b) => entryDateStr(b).localeCompare(entryDateStr(a)))[0])
    : null;

  return {
    totalCheckins: entries.length,
    streak,
    lastCheckinDate: sortedDates.length > 0 ? sortedDates[0] : null,
    weeklyCount: entries.filter((e) => entryDateStr(e) >= weekStartStr).length,
    monthlyCount: entries.filter((e) => entryDateStr(e) >= monthStartStr).length,
    consecutiveAnomalyDays,
    totalAnomalyDays,
    lastAnomalyDate,
  };
}
