import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface Habit {
  id: string
  userId: string
  name: string
  frequency: string
  streak: number
  createdAt: string
  updatedAt: string
}

export interface CreateHabitInput {
  userId: string
  name: string
  frequency?: string
}

export interface UpdateHabitInput {
  name?: string
  frequency?: string
  streak?: number
}

export const habitRepository = {
  async findByUserId(userId: string): Promise<Habit[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<Habit>(row))
  },

  async create(input: CreateHabitInput): Promise<Habit> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('habits')
      .insert(mapInput({ ...input, frequency: input.frequency ?? 'daily', streak: 0 } as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Habit>(data)
  },

  async update(id: string, patch: UpdateHabitInput): Promise<Habit> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('habits')
      .update(mapInput(patch as unknown as Record<string, unknown>))
      .eq('id', id)
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Habit>(data)
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) throw new RepositoryError(error.message, error.code, error)
  }
}
