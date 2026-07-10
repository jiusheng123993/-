import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface MoodRecord {
  id: string
  userId: string
  mood: string
  note: string | null
  recordedAt: string
}

export interface CreateMoodInput {
  userId: string
  mood: string
  note?: string
}

export const moodRepository = {
  async findByUserId(userId: string, limit = 30): Promise<MoodRecord[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('mood_records')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(limit)

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<MoodRecord>(row))
  },

  async create(input: CreateMoodInput): Promise<MoodRecord> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('mood_records')
      .insert(mapInput(input as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<MoodRecord>(data)
  }
}
