import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface Goal {
  id: string
  userId: string
  title: string
  subject: string | null
  targetDate: string | null
  progress: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreateGoalInput {
  userId: string
  title: string
  subject?: string
  targetDate?: string
  progress?: number
  status?: string
}

export interface UpdateGoalInput {
  title?: string
  subject?: string
  targetDate?: string
  progress?: number
  status?: string
}

export const goalRepository = {
  async findById(id: string): Promise<Goal | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<Goal>(data)
  },

  async findByUserId(userId: string): Promise<Goal[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<Goal>(row))
  },

  async findByStatus(userId: string, status: string): Promise<Goal[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<Goal>(row))
  },

  async create(input: CreateGoalInput): Promise<Goal> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('goals')
      .insert(mapInput({ ...input, progress: input.progress ?? 0, status: input.status ?? 'active' } as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Goal>(data)
  },

  async update(id: string, patch: UpdateGoalInput): Promise<Goal> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('goals')
      .update(mapInput(patch as unknown as Record<string, unknown>))
      .eq('id', id)
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Goal>(data)
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (error) throw new RepositoryError(error.message, error.code, error)
  }
}
