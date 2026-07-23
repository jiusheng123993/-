import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface FocusSession {
  id: string
  userId: string
  duration: number
  startedAt: string
  endedAt: string | null
  mode: string | null
  createdAt: string
}

export interface CreateFocusInput {
  userId: string
  duration: number
  startedAt: string
  endedAt?: string
  mode?: string
}

export const focusRepository = {
  async findById(id: string): Promise<FocusSession | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<FocusSession>(data)
  },

  async findByUserId(userId: string, limit = 50): Promise<FocusSession[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<FocusSession>(row))
  },

  async create(input: CreateFocusInput): Promise<FocusSession> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('focus_sessions')
      .insert(mapInput(input as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<FocusSession>(data)
  },

  async getTotalDuration(userId: string): Promise<number> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('focus_sessions')
      .select('duration')
      .eq('user_id', userId)

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).reduce((sum, row) => sum + (row.duration || 0), 0)
  }
}
