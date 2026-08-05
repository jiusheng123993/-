/**
 * 喂养记录服务
 *
 * 宠物喂养记录（每日饮食记录）的增删改查
 * 数据存储：对接后端 /api/pets/:petId/feeding-records
 */
import { api } from './api'

export interface FeedingRecord {
  id: string
  petId: string
  recordDate: string
  foodType: string
  brand?: string
  amount: number
  unit?: string
  mealTime?: string
  appetite?: 'good' | 'normal' | 'poor'
  stool?: 'normal' | 'loose' | 'hard'
  energy?: 'high' | 'normal' | 'low'
  notes?: string
  createdAt: string
  updatedAt: string
}

/** 后端返回的喂养记录（snake_case） */
interface FeedingRecordRaw {
  id: string
  pet_id: string
  user_id: string
  record_date: string
  food_type: string
  brand: string | null
  amount: string
  unit: string | null
  meal_time: string | null
  appetite: string | null
  stool: string | null
  energy: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

function toCamelRecord(raw: FeedingRecordRaw): FeedingRecord {
  return {
    id: raw.id,
    petId: raw.pet_id,
    recordDate: raw.record_date,
    foodType: raw.food_type,
    brand: raw.brand || '',
    amount: parseFloat(raw.amount) || 0,
    unit: raw.unit || '',
    mealTime: raw.meal_time || '',
    appetite: (raw.appetite as FeedingRecord['appetite']) || undefined,
    stool: (raw.stool as FeedingRecord['stool']) || undefined,
    energy: (raw.energy as FeedingRecord['energy']) || undefined,
    notes: raw.notes || '',
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function toSnakeRecord(data: Partial<FeedingRecord>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  if (data.recordDate !== undefined) result.record_date = data.recordDate
  if (data.foodType !== undefined) result.food_type = data.foodType
  if (data.brand !== undefined) result.brand = data.brand
  if (data.amount !== undefined) result.amount = data.amount
  if (data.unit !== undefined) result.unit = data.unit
  if (data.mealTime !== undefined) result.meal_time = data.mealTime
  if (data.appetite !== undefined) result.appetite = data.appetite
  if (data.stool !== undefined) result.stool = data.stool
  if (data.energy !== undefined) result.energy = data.energy
  if (data.notes !== undefined) result.notes = data.notes
  return result
}

export async function getFeedingRecords(petId: string): Promise<FeedingRecord[]> {
  try {
    const res = await api.get<{ success: boolean; data: FeedingRecordRaw[] }>(
      `/api/pets/${petId}/feeding-records`
    )
    return (res.data || []).map(toCamelRecord)
  } catch {
    return []
  }
}

export async function addFeedingRecord(
  petId: string,
  data: Omit<FeedingRecord, 'id' | 'petId' | 'createdAt' | 'updatedAt'>
): Promise<FeedingRecord | null> {
  try {
    const res = await api.post<{ success: boolean; data: FeedingRecordRaw }>(
      `/api/pets/${petId}/feeding-records`,
      toSnakeRecord(data)
    )
    return toCamelRecord(res.data)
  } catch {
    return null
  }
}

export async function updateFeedingRecord(
  petId: string,
  recordId: string,
  updates: Partial<FeedingRecord>
): Promise<FeedingRecord | null> {
  try {
    const res = await api.put<{ success: boolean; data: FeedingRecordRaw }>(
      `/api/pets/${petId}/feeding-records/${recordId}`,
      toSnakeRecord(updates)
    )
    return toCamelRecord(res.data)
  } catch {
    return null
  }
}

export async function deleteFeedingRecord(petId: string, recordId: string): Promise<boolean> {
  try {
    await api.delete(`/api/pets/${petId}/feeding-records/${recordId}`)
    return true
  } catch {
    return false
  }
}