/**
 * AI建议记录服务 - 效果追踪模块
 *
 * 对接后端 /api/pets/:petId/suggestions 接口
 * 不再使用本地存储
 */
import { api } from './api'

export interface SuggestionRecord {
  id: string
  petId: string
  userId: string
  type: 'feeding' | 'symptom' | 'trend' | 'chat'
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
  adopted: boolean
  createdAt: string
  adoptedAt: string | null
  updatedAt: string
}

/** 后端返回的原始字段（snake_case） */
interface SuggestionRecordRaw {
  id: string
  pet_id: string
  user_id: string
  type: string
  title: string
  content: string
  priority: string
  adopted: boolean
  created_at: string
  adopted_at: string | null
  updated_at: string
}

function toCamel(raw: SuggestionRecordRaw): SuggestionRecord {
  return {
    id: raw.id,
    petId: raw.pet_id,
    userId: raw.user_id,
    type: raw.type as SuggestionRecord['type'],
    title: raw.title,
    content: raw.content,
    priority: raw.priority as SuggestionRecord['priority'],
    adopted: raw.adopted,
    createdAt: raw.created_at,
    adoptedAt: raw.adopted_at,
    updatedAt: raw.updated_at,
  }
}

/** 获取某宠物的所有建议记录 */
export async function getSuggestionRecords(petId: string): Promise<SuggestionRecord[]> {
  try {
    const res = await api.get<{ success: boolean; data: SuggestionRecordRaw[] }>(
      `/api/pets/${petId}/suggestions`
    )
    return (res.data || []).map(toCamel)
  } catch {
    return []
  }
}

/** 创建建议记录 */
export async function createSuggestionRecord(
  petId: string,
  data: { type: string; title: string; content: string; priority?: string }
): Promise<SuggestionRecord | null> {
  try {
    const res = await api.post<{ success: boolean; data: SuggestionRecordRaw }>(
      `/api/pets/${petId}/suggestions`,
      data
    )
    return toCamel(res.data)
  } catch {
    return null
  }
}

/** 更新采纳状态 */
export async function updateSuggestionAdoption(
  petId: string,
  recordId: string,
  adopted: boolean
): Promise<SuggestionRecord | null> {
  try {
    const res = await api.patch<{ success: boolean; data: SuggestionRecordRaw }>(
      `/api/pets/${petId}/suggestions/${recordId}/adoption`,
      { adopted }
    )
    return toCamel(res.data)
  } catch {
    return null
  }
}

/** 删除建议记录 */
export async function deleteSuggestionRecord(
  petId: string,
  recordId: string
): Promise<boolean> {
  try {
    await api.delete(`/api/pets/${petId}/suggestions/${recordId}`)
    return true
  } catch {
    return false
  }
}